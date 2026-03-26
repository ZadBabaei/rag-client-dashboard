# RAG-Powered Client Intelligence Dashboard — Project Plan

## 1. Understanding

### Core Features
1. **Document Ingestion Pipeline** — Upload PDF/TXT/DOCX → parse → chunk (500 tokens, 50 overlap) → embed → store in pgvector
2. **RAG Query Pipeline** — Question → embed → vector search (top 10) → optional rerank → LLM generate → cited answer
3. **Client Profile Extraction** — LLM auto-extracts structured fields (AUM, risk tolerance, goals, family) from documents
4. **Chat Interface** — Message bubbles, streaming SSE responses, conversation memory, clickable citation chips
5. **Document Management** — Upload, list, preview per client
6. **Source Viewer** — Click citation → highlighted passage in original document
7. **Eval Framework** — Retrieval recall, answer accuracy, citation fidelity

### Non-Functional Requirements
- **Performance**: Streaming responses (SSE), responsive UI
- **Security**: API keys in env vars only, file upload validation (type, size)
- **Scalability**: Chunking strategy supports large documents; pgvector handles moderate scale

### Constraints
- React 18 + TypeScript + Tailwind (frontend)
- Node.js + Express + TypeScript (backend)
- PostgreSQL + pgvector (database)
- Prisma (ORM)
- OpenAI embeddings + GPT-4o/Claude for generation
- Docker Compose for local dev

### Assumptions
- Single-user system (no multi-tenancy or auth beyond basic)
- Documents are English text
- pgvector handles both relational and vector data (no separate Pinecone)
- Monorepo structure (frontend + backend in one repo)
- Local-first development, deploy later

---

## 2. Architecture

### Data Flow

```
Upload Flow:
  File → POST /api/documents/upload → parse text → chunk → embed (OpenAI) → store in PostgreSQL/pgvector

Query Flow:
  Question → POST /api/chat → embed query → vector similarity search → rerank → assemble context → LLM call → parse citations → stream response (SSE)

Profile Extraction:
  On document upload → extract text → LLM structured extraction → upsert Client profile fields
```

### API Structure

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/clients` | List clients with search/filter |
| GET | `/api/clients/:id` | Client profile detail |
| POST | `/api/clients` | Create client |
| GET | `/api/documents` | List documents (optional `?clientId=`) |
| GET | `/api/documents/:id` | Document detail with chunks |
| POST | `/api/documents/upload` | Upload and ingest document |
| POST | `/api/chat` | RAG query (SSE streaming response) |
| GET | `/api/chat/history/:clientId` | Conversation history |
| POST | `/api/eval/run` | Run eval suite |

### State Management (Frontend)
- **React Context** for global state (active client, conversation)
- **TanStack Query (React Query)** for server state (clients, documents)
- No Redux — project scope doesn't warrant it

### Error Handling Strategy
- Backend: Express error middleware, typed error classes (`NotFoundError`, `ValidationError`, `UploadError`)
- Frontend: React Query error states, toast notifications, empty states
- RAG-specific: "No relevant documents found" handling, LLM timeout/failure fallback

### Testing Strategy
- Backend: Unit tests for chunking, embedding, citation parsing (Vitest)
- Backend: Integration tests for API endpoints (supertest)
- Eval: Custom harness for RAG quality metrics
- Frontend: Component tests where valuable (Vitest + Testing Library)

---

## 3. File Structure

```
rag-client-dashboard/
├── backend/
│   ├── src/
│   │   ├── index.ts                    # Express app entry point
│   │   ├── config.ts                   # Environment config validation
│   │   ├── types/
│   │   │   ├── index.ts                # Re-exports
│   │   │   ├── client.types.ts         # Client interfaces
│   │   │   ├── document.types.ts       # Document & chunk interfaces
│   │   │   ├── chat.types.ts           # Chat request/response interfaces
│   │   │   └── eval.types.ts           # Eval interfaces
│   │   ├── routes/
│   │   │   ├── clients.routes.ts       # /api/clients
│   │   │   ├── documents.routes.ts     # /api/documents
│   │   │   ├── chat.routes.ts          # /api/chat
│   │   │   └── eval.routes.ts          # /api/eval
│   │   ├── services/
│   │   │   ├── embedding.service.ts    # OpenAI embedding calls
│   │   │   ├── llm.service.ts          # LLM generation (OpenAI/Claude)
│   │   │   ├── vectorSearch.service.ts # pgvector similarity search
│   │   │   ├── reranker.service.ts     # Chunk reranking
│   │   │   └── profileExtractor.service.ts # LLM-based profile extraction
│   │   ├── pipeline/
│   │   │   ├── parser.ts               # PDF/TXT/DOCX text extraction
│   │   │   ├── chunker.ts             # Text chunking with overlap
│   │   │   └── ingest.ts              # Orchestrates parse → chunk → embed → store
│   │   ├── eval/
│   │   │   ├── runner.ts              # Eval execution engine
│   │   │   ├── metrics.ts             # Recall, accuracy, citation fidelity
│   │   │   └── testCases.json         # Test dataset
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts        # Global error middleware
│   │   │   └── upload.ts              # Multer config for file uploads
│   │   └── errors/
│   │       └── index.ts               # Custom error classes
│   ├── prisma/
│   │   └── schema.prisma              # Database schema
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── main.tsx                   # App entry
│   │   ├── App.tsx                    # Router + layout
│   │   ├── components/
│   │   │   ├── chat/
│   │   │   │   ├── ChatWindow.tsx     # Main chat container
│   │   │   │   ├── MessageBubble.tsx  # Single message (user or AI)
│   │   │   │   ├── ChatInput.tsx      # Text input + send
│   │   │   │   ├── CitationChip.tsx   # Clickable citation badge
│   │   │   │   └── StreamingText.tsx  # Renders tokens as they arrive
│   │   │   ├── documents/
│   │   │   │   ├── DocumentUpload.tsx # Drag-and-drop upload
│   │   │   │   ├── DocumentList.tsx   # Document list per client
│   │   │   │   └── DocumentViewer.tsx # View doc with highlighted citations
│   │   │   ├── clients/
│   │   │   │   ├── ClientList.tsx     # Client list with search
│   │   │   │   └── ClientProfile.tsx  # Profile card with extracted fields
│   │   │   └── layout/
│   │   │       ├── Sidebar.tsx        # Navigation sidebar
│   │   │       └── Layout.tsx         # Page layout wrapper
│   │   ├── pages/
│   │   │   ├── ChatPage.tsx
│   │   │   ├── ClientsPage.tsx
│   │   │   ├── ClientDetailPage.tsx
│   │   │   └── DocumentsPage.tsx
│   │   ├── services/
│   │   │   └── api.ts                 # Fetch wrapper for backend API
│   │   ├── hooks/
│   │   │   ├── useChat.ts            # Chat state + SSE streaming
│   │   │   ├── useClients.ts         # React Query hooks for clients
│   │   │   └── useDocuments.ts       # React Query hooks for documents
│   │   └── types/
│   │       └── index.ts              # Shared frontend types
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## 4. Task List

### Task 1: Project Initialization & Database Schema ✅ IN PROGRESS
**Objective**: Scaffold both packages, configure TypeScript/Vite/Tailwind, define Prisma schema, define all TypeScript interfaces.

**Files to create/modify**:
- `backend/package.json`, `backend/tsconfig.json`
- `frontend/package.json`, `frontend/tsconfig.json`, `frontend/vite.config.ts`, `frontend/tailwind.config.js`, `frontend/index.html`
- `backend/prisma/schema.prisma`
- `backend/src/config.ts`
- `backend/src/types/*.ts` (all type files)
- `frontend/src/types/index.ts`
- `docker-compose.yml`, `.env.example`

**Acceptance criteria**:
- `docker-compose up -d` starts PostgreSQL with pgvector
- `npx prisma migrate dev` runs without errors
- `npm run build` succeeds in both frontend and backend
- All type interfaces are defined and exported

---

### Task 2: Backend Express Server + Error Handling
**Objective**: Express app with CORS, JSON parsing, error middleware, health endpoint.

**Files**: `backend/src/index.ts`, `backend/src/middleware/errorHandler.ts`, `backend/src/errors/index.ts`

**Acceptance criteria**:
- `npm run dev` starts server on port 3001
- `GET /health` returns `{ status: "ok" }`
- Unknown routes return 404 JSON
- Errors return structured `{ error, message, statusCode }`

---

### Task 3: Client CRUD Routes
**Objective**: Implement `/api/clients` endpoints using Prisma.

**Files**: `backend/src/routes/clients.routes.ts`

**Acceptance criteria**:
- `POST /api/clients` creates a client
- `GET /api/clients` lists clients (with `?search=` query)
- `GET /api/clients/:id` returns client with documents
- Tests pass for all 3 endpoints

---

### Task 4: File Upload + PDF Parsing
**Objective**: Upload endpoint, Multer config, text extraction from PDF/TXT/DOCX.

**Files**: `backend/src/middleware/upload.ts`, `backend/src/routes/documents.routes.ts`, `backend/src/pipeline/parser.ts`

**Acceptance criteria**:
- `POST /api/documents/upload` accepts multipart file + `clientId`
- Rejects files > 10MB or unsupported types
- Extracts text from PDF, TXT, DOCX
- Document record saved in DB
- Unit test: parser extracts text from sample PDF

---

### Task 5: Chunking + Embedding + Storage
**Objective**: Text chunking with overlap, OpenAI embedding, pgvector storage.

**Files**: `backend/src/pipeline/chunker.ts`, `backend/src/services/embedding.service.ts`, `backend/src/pipeline/ingest.ts`

**Acceptance criteria**:
- Chunker splits text into ~500 token chunks with 50 token overlap
- Each chunk gets embedded via OpenAI API
- Chunks stored in DB with vector column
- Unit test: chunker produces correct chunk count and overlap
- Integration: upload a file → chunks appear in DB with embeddings

---

### Task 6: Vector Search + RAG Query Endpoint
**Objective**: Embed query, search pgvector, assemble context, call LLM, return cited answer.

**Files**: `backend/src/services/vectorSearch.service.ts`, `backend/src/services/llm.service.ts`, `backend/src/services/reranker.service.ts`, `backend/src/routes/chat.routes.ts`

**Acceptance criteria**:
- `POST /api/chat` with `{ question, clientId }` returns `{ answer, citations[] }`
- Vector search returns top 10 relevant chunks
- LLM prompt includes citation instructions
- Citations parsed into structured objects `{ documentId, documentName, pageNumber, snippet }`
- Works with both OpenAI and Claude (configurable)

---

### Task 7: SSE Streaming
**Objective**: Add streaming to chat endpoint via Server-Sent Events.

**Files**: `backend/src/routes/chat.routes.ts` (modify), `backend/src/services/llm.service.ts` (modify)

**Acceptance criteria**:
- `POST /api/chat` with `Accept: text/event-stream` streams tokens
- Each SSE event: `data: { token }` or `data: { citations, done: true }`
- Non-streaming still works for eval

---

### Task 8: Client Profile Extraction
**Objective**: After document ingestion, use LLM to extract profile fields and upsert client record.

**Files**: `backend/src/services/profileExtractor.service.ts`, `backend/src/pipeline/ingest.ts` (modify)

**Acceptance criteria**:
- After ingestion, client profile fields updated (AUM, riskTolerance, goals, familyMembers)
- Extraction uses structured LLM prompt
- Existing fields not overwritten with null/empty

---

### Task 9: Eval Framework
**Objective**: Test dataset + metrics + runner script.

**Files**: `backend/src/eval/testCases.json`, `backend/src/eval/metrics.ts`, `backend/src/eval/runner.ts`, `backend/src/routes/eval.routes.ts`

**Acceptance criteria**:
- 10+ test cases with question, expected answer, expected source docs
- `npm run eval` outputs JSON report + console table
- Measures retrieval recall, answer accuracy, citation fidelity
- `POST /api/eval/run` triggers eval and returns results

---

### Task 10: Frontend — Layout + Routing + API Client
**Objective**: Vite app with Tailwind, React Router, sidebar layout, API service.

**Files**: `frontend/src/main.tsx`, `frontend/src/App.tsx`, `frontend/src/components/layout/*`, `frontend/src/services/api.ts`, `frontend/src/types/index.ts`

**Acceptance criteria**:
- App renders with sidebar (Clients, Documents, Chat nav)
- Routes: `/`, `/clients`, `/clients/:id`, `/documents`, `/chat`
- API client configured with base URL from env

---

### Task 11: Frontend — Client List + Profile
**Objective**: Client list page with search, client detail page with profile card.

**Files**: `frontend/src/pages/ClientsPage.tsx`, `frontend/src/pages/ClientDetailPage.tsx`, `frontend/src/components/clients/*`, `frontend/src/hooks/useClients.ts`

**Acceptance criteria**:
- Client list fetches from API, renders cards
- Search filters clients by name
- Client detail shows profile fields (AUM, risk, goals, family)
- Loading and empty states

---

### Task 12: Frontend — Document Upload + List
**Objective**: Upload page with drag-and-drop, document list per client.

**Files**: `frontend/src/pages/DocumentsPage.tsx`, `frontend/src/components/documents/DocumentUpload.tsx`, `frontend/src/components/documents/DocumentList.tsx`, `frontend/src/hooks/useDocuments.ts`

**Acceptance criteria**:
- Drag-and-drop or click to upload files
- Progress indicator during upload
- Document list shows name, type, date, client
- Links to client detail

---

### Task 13: Frontend — Chat Interface + Streaming
**Objective**: Chat page with message bubbles, SSE streaming, citation chips.

**Files**: `frontend/src/pages/ChatPage.tsx`, `frontend/src/components/chat/*`, `frontend/src/hooks/useChat.ts`

**Acceptance criteria**:
- User types question, sees streaming AI response
- Citation chips rendered inline, clickable
- Conversation history maintained in state
- Client selector to scope questions
- "No results found" state

---

### Task 14: Frontend — Document Viewer + Citation Highlighting
**Objective**: View document with highlighted passage when citation clicked.

**Files**: `frontend/src/components/documents/DocumentViewer.tsx`

**Acceptance criteria**:
- Opens document text in a viewer panel
- Scrolls to and highlights the cited passage
- Works from citation chip click in chat

---

### Task 15: Conversation Memory
**Objective**: Chat endpoint retains prior messages for follow-up questions.

**Files**: `backend/src/routes/chat.routes.ts` (modify)

**Acceptance criteria**:
- `POST /api/chat` accepts optional `conversationId` and `history[]`
- LLM receives prior turns as context
- Follow-up questions resolve pronouns correctly

---

### Task 16: Docker Compose Full Stack
**Objective**: Dockerize frontend + backend + DB for one-command startup.

**Files**: `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.yml` (modify)

**Acceptance criteria**:
- `docker-compose up` starts all 3 services
- Frontend accessible on port 5173, backend on 3001
- DB migrations run automatically

---

## 5. Prisma Schema Reference

```prisma
model Client {
  id             String    @id @default(uuid())
  name           String
  email          String?
  phone          String?
  aum            Float?
  riskTolerance  String?
  goals          String[]
  familyMembers  Json?
  documents      Document[]
  conversations  Conversation[]
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
}

model Document {
  id        String   @id @default(uuid())
  fileName  String
  fileType  String
  fileSize  Int
  rawText   String?
  clientId  String
  client    Client   @relation(fields: [clientId], references: [id])
  chunks    DocumentChunk[]
  createdAt DateTime @default(now())
}

model DocumentChunk {
  id         String   @id @default(uuid())
  content    String
  embedding  Unsupported("vector(1536)")?
  pageNumber Int?
  chunkIndex Int
  tokenCount Int
  metadata   Json?
  documentId String
  document   Document @relation(fields: [documentId], references: [id])
}

model Conversation {
  id        String    @id @default(uuid())
  clientId  String?
  client    Client?   @relation(fields: [clientId], references: [id])
  messages  Message[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Message {
  id             String       @id @default(uuid())
  role           String       // "user" | "assistant"
  content        String
  citations      Json?
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id])
  createdAt      DateTime     @default(now())
}
```

---

## 6. Change Log

| Date | Task | Status | Notes |
|------|------|--------|-------|
| 2026-03-25 | GitHub repo created | ✅ Done | Public repo at ZadBabaei/rag-client-dashboard |
| 2026-03-25 | Task 1: Scaffolding | 🔄 In Progress | |
