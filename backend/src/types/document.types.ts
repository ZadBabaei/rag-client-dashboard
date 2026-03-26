export interface DocumentRecord {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  rawText: string | null;
  clientId: string;
  createdAt: Date;
}

export interface DocumentChunkRecord {
  id: string;
  content: string;
  pageNumber: number | null;
  chunkIndex: number;
  tokenCount: number;
  metadata: ChunkMetadata | null;
  documentId: string;
}

export interface ChunkMetadata {
  source: string;
  pageNumber?: number;
  startChar?: number;
  endChar?: number;
}

export interface TextChunk {
  content: string;
  chunkIndex: number;
  tokenCount: number;
  pageNumber?: number;
  metadata?: ChunkMetadata;
}

export interface ParsedDocument {
  text: string;
  pageCount?: number;
  pages?: string[];
}

export type SupportedFileType = "application/pdf" | "text/plain" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export const SUPPORTED_MIME_TYPES: SupportedFileType[] = [
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
