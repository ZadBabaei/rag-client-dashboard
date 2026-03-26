export interface ChatRequest {
  question: string;
  clientId?: string;
  conversationId?: string;
  history?: ChatMessage[];
  stream?: boolean;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  answer: string;
  citations: Citation[];
  conversationId: string;
}

export interface Citation {
  documentId: string;
  documentName: string;
  pageNumber: number | null;
  snippet: string;
  chunkId: string;
  relevanceScore: number;
}

export interface RetrievedChunk {
  id: string;
  content: string;
  documentId: string;
  documentName: string;
  pageNumber: number | null;
  chunkIndex: number;
  similarityScore: number;
}

export interface SSEEvent {
  type: "token" | "citation" | "done" | "error";
  data: string | Citation[] | { conversationId: string } | { message: string };
}

export interface AssembledContext {
  systemPrompt: string;
  chunks: RetrievedChunk[];
  query: string;
  history: ChatMessage[];
}
