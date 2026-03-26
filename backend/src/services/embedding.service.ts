import OpenAI from "openai";

import { config } from "../config";

const EMBEDDING_MODEL = "text-embedding-3-small";
const BATCH_SIZE = 100;

const openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });

export async function embedText(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });

  return response.data[0].embedding;
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  const embeddings: number[][] = [];

  for (let start = 0; start < texts.length; start += BATCH_SIZE) {
    const batch = texts.slice(start, start + BATCH_SIZE);
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
    });

    embeddings.push(...response.data.map((item) => item.embedding));
  }

  return embeddings;
}
