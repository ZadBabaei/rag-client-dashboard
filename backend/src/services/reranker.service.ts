import type { RetrievedChunk } from "./vectorSearch.service";

export async function rerank(query: string, chunks: RetrievedChunk[]): Promise<RetrievedChunk[]> {
  void query;

  // TODO: Enhance this with cross-encoder reranking for better semantic ordering.
  return chunks;
}
