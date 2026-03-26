import { Prisma, PrismaClient } from "@prisma/client";

import { embedBatch } from "../services/embedding.service";
import { extractProfile } from "../services/profileExtractor.service";
import { chunkText } from "./chunker";
import { parseDocument } from "./parser";

const prisma = new PrismaClient();

interface IngestFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

function toVectorLiteral(values: number[]): Prisma.Sql {
  return Prisma.sql`${Prisma.raw(`'[${values.join(",")}]'::vector`)}`;
}

export async function ingestDocument(
  file: IngestFile,
  clientId: string,
): Promise<any> {
  const parsed = await parseDocument(file.buffer, file.mimetype);
  const chunks = chunkText(parsed.text);
  const embeddings = await embedBatch(chunks.map((chunk) => chunk.content));

  const document = await prisma.document.create({
    data: {
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      rawText: parsed.text,
      clientId,
    },
  });

  for (const [index, chunk] of chunks.entries()) {
    await prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO "DocumentChunk" (
          id,
          "documentId",
          content,
          embedding,
          "chunkIndex",
          "tokenCount",
          "createdAt"
        )
        VALUES (
          gen_random_uuid(),
          ${document.id},
          ${chunk.content},
          ${toVectorLiteral(embeddings[index])},
          ${chunk.chunkIndex},
          ${chunk.tokenCount},
          NOW()
        )
      `,
    );
  }

  try {
    const extracted = await extractProfile(parsed.text);

    if (Object.keys(extracted).length > 0) {
      await prisma.client.update({
        where: { id: clientId },
        data: {
          aum: extracted.aum ?? undefined,
          riskTolerance: extracted.riskTolerance ?? undefined,
          goals: extracted.goals ?? undefined,
          familyMembers: extracted.familyMembers as Prisma.InputJsonValue | undefined,
        },
      });
    }
  } catch (error) {
    console.warn("Profile update failed:", error);
  }

  return document;
}
