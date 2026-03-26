import OpenAI from "openai";

import { config } from "../config";

const openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });

export function retrievalRecall(retrievedDocs: string[], expectedDocs: string[]): number {
  if (expectedDocs.length === 0) {
    return 1;
  }

  const expected = new Set(expectedDocs);
  const retrieved = new Set(retrievedDocs);
  let intersectionCount = 0;

  for (const documentName of expected) {
    if (retrieved.has(documentName)) {
      intersectionCount += 1;
    }
  }

  return intersectionCount / expected.size;
}

export async function answerAccuracy(generated: string, expected: string): Promise<number> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "You are grading a RAG answer. Return only one integer from 0 to 10, where 10 means the generated answer fully matches the expected answer and 0 means it is completely incorrect or irrelevant.",
      },
      {
        role: "user",
        content: `Expected answer:\n${expected}\n\nGenerated answer:\n${generated}\n\nScore from 0 to 10 only.`,
      },
    ],
  });

  const rawScore = response.choices[0]?.message?.content?.trim() ?? "0";
  const parsedScore = Number.parseInt(rawScore, 10);
  const boundedScore = Number.isNaN(parsedScore) ? 0 : Math.min(10, Math.max(0, parsedScore));

  return boundedScore / 10;
}

export function citationFidelity(
  citations: { documentName: string }[],
  retrievedChunkDocNames: string[],
): number {
  if (citations.length === 0) {
    return 1;
  }

  const retrieved = new Set(retrievedChunkDocNames);
  const faithfulCitations = citations.filter((citation) => retrieved.has(citation.documentName)).length;

  return faithfulCitations / citations.length;
}
