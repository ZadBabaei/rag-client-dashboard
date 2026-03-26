import { PrismaClient } from "@prisma/client";
import { Router } from "express";

import { ValidationError } from "../errors";
import { embedText } from "../services/embedding.service";
import { assembleContext, generate, generateStream, parseCitations } from "../services/llm.service";
import { rerank } from "../services/reranker.service";
import { searchSimilar } from "../services/vectorSearch.service";

const prisma = new PrismaClient();
const router = Router();

async function persistConversation(params: {
  conversationId?: string;
  clientId?: string;
  question: string;
  answer: string;
  citations: { documentName: string; pageNumber: number | null; snippet: string }[];
}): Promise<string> {
  const normalizedClientId =
    typeof params.clientId === "string" && params.clientId.trim().length > 0 ? params.clientId.trim() : undefined;

  if (typeof params.conversationId === "string" && params.conversationId.trim().length > 0) {
    const conversation = await prisma.conversation.update({
      where: { id: params.conversationId.trim() },
      data: {
        messages: {
          create: [
            {
              role: "user",
              content: params.question,
            },
            {
              role: "assistant",
              content: params.answer,
              citations: params.citations,
            },
          ],
        },
      },
      select: { id: true },
    });

    return conversation.id;
  }

  const conversation = await prisma.conversation.create({
    data: {
      clientId: normalizedClientId,
      messages: {
        create: [
          {
            role: "user",
            content: params.question,
          },
          {
            role: "assistant",
            content: params.answer,
            citations: params.citations,
          },
        ],
      },
    },
    select: { id: true },
  });

  return conversation.id;
}

router.post("/", async (req, res, next) => {
  try {
    const { question, clientId, conversationId } = req.body;
    const isStreaming = req.body.stream === true;
    const noInfoMessage = "I couldn't find any relevant information in the documents to answer your question.";

    if (typeof question !== "string" || question.trim().length === 0) {
      throw new ValidationError("question is required");
    }

    let clientDisconnected = false;

    if (isStreaming) {
      req.on("close", () => {
        clientDisconnected = true;
      });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();

      // Send initial comment to confirm connection
      res.write(":ok\n\n");
    }

    const normalizedQuestion = question.trim();
    let persistedHistory: { role: string; content: string }[] | undefined;

    if (typeof conversationId === "string" && conversationId.trim().length > 0) {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId.trim() },
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      });

      if (!conversation) {
        throw new ValidationError("conversationId is invalid");
      }

      persistedHistory = [...conversation.messages]
        .reverse()
        .map((message) => ({
          role: message.role,
          content: message.content,
        }));
    }

    const requestHistory = Array.isArray(req.body.history) ? req.body.history : [];
    const history = persistedHistory ? [...persistedHistory, ...requestHistory] : requestHistory;
    const embedding = await embedText(normalizedQuestion);
    const chunks = await searchSimilar(embedding, {
      clientId: typeof clientId === "string" && clientId.trim().length > 0 ? clientId.trim() : undefined,
      limit: 10,
    });

    if (chunks.length === 0 || chunks.every((chunk) => chunk.similarity < 0.3)) {
      if (isStreaming) {
        if (!clientDisconnected) {
          res.write(
            `data: ${JSON.stringify({
              type: "done",
              data: { message: noInfoMessage, citations: [], conversationId: null },
            })}\n\n`,
          );
          res.end();
        }
        return;
      }

      res.status(200).json({
        answer: noInfoMessage,
        citations: [],
        conversationId: null,
      });
      return;
    }

    const rerankedChunks = await rerank(normalizedQuestion, chunks);
    const context = assembleContext(rerankedChunks, normalizedQuestion, history);

    if (isStreaming) {
      let answer = "";

      for await (const token of generateStream(context)) {
        if (clientDisconnected) {
          break;
        }

        answer += token;
        res.write(`data: ${JSON.stringify({ type: "token", data: token })}\n\n`);
      }

      if (!clientDisconnected) {
        const citations = parseCitations(answer);
        const persistedConversationId = await persistConversation({
          conversationId,
          clientId,
          question: normalizedQuestion,
          answer,
          citations,
        });

        res.write(
          `data: ${JSON.stringify({
            type: "done",
            data: { citations, conversationId: persistedConversationId },
          })}\n\n`,
        );
        res.end();
      }

      return;
    }

    const answer = await generate(context);
    const citations = parseCitations(answer);
    const persistedConversationId = await persistConversation({
      conversationId,
      clientId,
      question: normalizedQuestion,
      answer,
      citations,
    });

    res.status(200).json({
      answer,
      citations,
      conversationId: persistedConversationId,
    });
  } catch (error) {
    if (req.body.stream === true && !res.headersSent) {
      next(error);
      return;
    }

    if (req.body.stream === true && !res.writableEnded) {
      res.write(
        `data: ${JSON.stringify({
          type: "error",
          data: { message: error instanceof Error ? error.message : "Streaming failed." },
        })}\n\n`,
      );
      res.end();
      return;
    }

    next(error);
  }
});

router.get("/history/:clientId", async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const conversations = await prisma.conversation.findMany({
      where: { clientId },
      include: { messages: true },
      orderBy: { updatedAt: "desc" },
    });

    res.status(200).json({ conversations });
  } catch (error) {
    next(error);
  }
});

export default router;
