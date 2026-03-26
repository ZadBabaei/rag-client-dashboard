import OpenAI from "openai";

import { config } from "../config";
import { AppError } from "../errors";
import type { RetrievedChunk } from "./vectorSearch.service";

const openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });

export interface AssembledContext {
  systemPrompt: string;
  chunks: { content: string; documentName: string; pageNumber: number | null }[];
  question: string;
  history?: { role: string; content: string }[];
}

export function assembleContext(
  chunks: RetrievedChunk[],
  question: string,
  history?: any[],
): AssembledContext {
  return {
    systemPrompt:
      "You are a helpful financial advisor assistant. Answer questions based on the provided document context. Always cite your sources using the format [Source: document_name, page X]. If you cannot find relevant information in the context, say so.",
    chunks: chunks.map((chunk) => ({
      content: chunk.content,
      documentName: chunk.documentName,
      pageNumber: chunk.pageNumber,
    })),
    question,
    history,
  };
}

function buildChunkContext(context: AssembledContext): string {
  const chunkContext = context.chunks
    .map((chunk, index) => {
      const pageLabel = chunk.pageNumber === null ? "page unknown" : `page ${chunk.pageNumber}`;

      return `Chunk ${index + 1}:\nSource: ${chunk.documentName}, ${pageLabel}\n${chunk.content}`;
    })
    .join("\n\n");

  return chunkContext.length > 0 ? `Document context:\n\n${chunkContext}` : "Document context:\n\nNo relevant chunks found.";
}

function buildHistoryMessages(context: AssembledContext): { role: "user" | "assistant"; content: string }[] {
  return (context.history ?? []).map((message) => ({
    role: message.role === "assistant" ? "assistant" : "user",
    content: message.content,
  }));
}

async function createAnthropicClient() {
  if (!config.ANTHROPIC_API_KEY) {
    throw new AppError("ANTHROPIC_API_KEY is required when LLM_PROVIDER is anthropic", 500);
  }

  const anthropicModuleName = "@anthropic-ai/sdk";
  const anthropicModule = (await import(anthropicModuleName)) as any;
  const Anthropic = anthropicModule.default;
  return new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });
}

export async function generate(context: AssembledContext): Promise<string> {
  const contextMessage = buildChunkContext(context);
  const historyMessages = buildHistoryMessages(context);

  if (config.LLM_PROVIDER === "openai") {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system" as const, content: context.systemPrompt },
        { role: "system" as const, content: contextMessage },
        ...historyMessages,
        { role: "user" as const, content: context.question },
      ],
    });

    return response.choices[0]?.message?.content ?? "";
  }

  const anthropic = await createAnthropicClient();

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    system: context.systemPrompt,
    max_tokens: 1024,
    messages: [
      { role: "user" as const, content: contextMessage },
      ...historyMessages,
      { role: "user" as const, content: context.question },
    ],
  });

  return response.content
    .filter((item: any) => item.type === "text")
    .map((item: any) => item.text)
    .join("");
}

export async function* generateStream(context: AssembledContext): AsyncGenerator<string> {
  const contextMessage = buildChunkContext(context);
  const historyMessages = buildHistoryMessages(context);

  if (config.LLM_PROVIDER === "openai") {
    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      stream: true,
      messages: [
        { role: "system" as const, content: context.systemPrompt },
        { role: "system" as const, content: contextMessage },
        ...historyMessages,
        { role: "user" as const, content: context.question },
      ],
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }

    return;
  }

  const anthropic = await createAnthropicClient();
  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-20250514",
    system: context.systemPrompt,
    max_tokens: 1024,
    messages: [
      { role: "user" as const, content: contextMessage },
      ...historyMessages,
      { role: "user" as const, content: context.question },
    ],
  });

  try {
    for await (const event of stream) {
      if (event?.type === "content_block_delta" && event.delta?.type === "text_delta" && event.delta.text) {
        yield event.delta.text;
      }
    }
  } finally {
    if (typeof stream.close === "function") {
      await stream.close();
    }
  }
}

export function parseCitations(
  text: string,
): { documentName: string; pageNumber: number | null; snippet: string }[] {
  const regex = /\[Source:\s*(.+?)(?:,\s*page\s*(\d+))?\]/g;
  const citations: { documentName: string; pageNumber: number | null; snippet: string }[] = [];

  for (const match of text.matchAll(regex)) {
    citations.push({
      documentName: match[1].trim(),
      pageNumber: match[2] ? Number.parseInt(match[2], 10) : null,
      snippet: match[0],
    });
  }

  return citations;
}
