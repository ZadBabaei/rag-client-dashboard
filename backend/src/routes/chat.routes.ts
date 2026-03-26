import { PrismaClient } from "@prisma/client";
import { Router } from "express";

import { ValidationError } from "../errors";
import { embedText } from "../services/embedding.service";
import { assembleContext, generate, generateStream, parseCitations } from "../services/llm.service";
import { rerank } from "../services/reranker.service";
import { searchSimilar } from "../services/vectorSearch.service";

const prisma = new PrismaClient();
const router = Router();

router.post("/", async (req, res, next) => {
  try {
    const { question, clientId, conversationId } = req.body;
    const isStreaming = req.body.stream === true;
    const noInfoMessage = "I couldn't find any relevant information in the documents to answer your question.";
    void prisma;
    void conversationId;

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
      res.flushHeaders();
    }

    const normalizedQuestion = question.trim();
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
    const context = assembleContext(
      rerankedChunks,
      normalizedQuestion,
      Array.isArray(req.body.history) ? req.body.history : undefined,
    );

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
        res.write(
          `data: ${JSON.stringify({
            type: "done",
            data: { citations, conversationId: null },
          })}\n\n`,
        );
        res.end();
      }

      return;
    }

    const answer = await generate(context);
    const citations = parseCitations(answer);

    res.status(200).json({
      answer,
      citations,
      conversationId: null,
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

export default router;
