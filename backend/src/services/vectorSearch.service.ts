import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface RetrievedChunk {
  id: string;
  content: string;
  documentId: string;
  documentName: string;
  chunkIndex: number;
  pageNumber: number | null;
  similarity: number;
}

function toVectorLiteral(values: number[]): Prisma.Sql {
  return Prisma.sql`${Prisma.raw(`'[${values.join(",")}]'::vector`)}`;
}

export async function searchSimilar(
  embedding: number[],
  options?: { clientId?: string; limit?: number },
): Promise<RetrievedChunk[]> {
  const clientId = options?.clientId ?? null;
  const limit = options?.limit ?? 10;
  const vector = toVectorLiteral(embedding);

  return prisma.$queryRaw<RetrievedChunk[]>(
    Prisma.sql`
      SELECT
        dc.id,
        dc.content,
        dc."documentId",
        d."fileName" as "documentName",
        dc."chunkIndex",
        dc."pageNumber",
        1 - (dc.embedding <=> ${vector}) as similarity
      FROM "DocumentChunk" dc
      JOIN "Document" d ON dc."documentId" = d.id
      WHERE (${clientId}::text IS NULL OR d."clientId" = ${clientId})
      ORDER BY dc.embedding <=> ${vector}
      LIMIT ${limit}
    `,
  );
}
