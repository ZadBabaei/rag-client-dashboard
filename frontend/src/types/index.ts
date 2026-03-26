// Client types
export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  aum: number | null;
  riskTolerance: string | null;
  goals: string[];
  familyMembers: FamilyMember[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyMember {
  name: string;
  relationship: string;
  age?: number;
}

// Document types
export interface Document {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  clientId: string;
  createdAt: string;
}

// Chat types
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
}

export interface Citation {
  documentId: string;
  documentName: string;
  pageNumber: number | null;
  snippet: string;
  chunkId: string;
  relevanceScore: number;
}

export interface ChatResponse {
  answer: string;
  citations: Citation[];
  conversationId: string;
}
