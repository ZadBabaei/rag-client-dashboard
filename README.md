# RAG-Powered Client Intelligence Dashboard

A full-stack dashboard where financial advisors can upload client documents, view auto-extracted profiles, and ask natural language questions — getting cited answers that link back to source documents and pages.

## Features

- **Document Ingestion** — Upload PDFs, TXT, and DOCX files. Documents are parsed, chunked, embedded, and stored for retrieval.
- **Client Profiles** — Auto-extracted fields (AUM, risk tolerance, goals, family members) from uploaded documents.
- **Natural Language Q&A** — Ask questions like *"What's the Johnson family's risk tolerance?"* and get answers with inline citations.
- **Source Citations** — Every claim links to the source document and page. Click a citation to view the highlighted passage.
- **Streaming Responses** — Real-time token output via Server-Sent Events.
- **Conversation Memory** — Follow-up questions retain context from the conversation.
- **Eval Framework** — Automated evaluation of retrieval recall, answer accuracy, and citation fidelity.

## Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌────────────────────┐
│  React/TS    │────>│  Node.js API     │────>│  RAG Engine        │
│  Frontend    │<────│  (Express)       │<────│                    │
│              │     │                  │     │  1. Embed query    │
│  - Chat UI   │     │  - Auth          │     │  2. Vector search  │
│  - Doc view  │     │  - File upload   │     │  3. Rerank         │
│  - Profiles  │     │  - RAG endpoint  │     │  4. LLM generate   │
└──────────────┘     └──────────────────┘     └────────────────────┘
                           │                          │
                    ┌──────┴──────┐           ┌───────┴───────┐
                    │  PostgreSQL │           │   pgvector    │
                    │  (Clients,  │           │  (Embeddings) │
                    │   Docs)     │           │               │
                    └─────────────┘           └───────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL + pgvector |
| Embeddings | OpenAI text-embedding-3-small |
| LLM | OpenAI GPT-5.4 / Claude 3.5 Sonnet |
| PDF Parsing | pdf-parse |
| Chunking | LangChain.js text splitters |
| ORM | Prisma |
| Infra | Docker Compose (local), AWS (deploy) |

## Project Structure

```
rag-client-dashboard/
├── frontend/                # React + TypeScript + Tailwind
│   ├── src/
│   │   ├── components/      # Chat, Documents, Clients, Citations
│   │   ├── pages/           # Main views
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API client
│   │   └── types/           # TypeScript interfaces
│   └── package.json
├── backend/                 # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # RAG engine, embeddings, LLM
│   │   ├── pipeline/        # Document ingestion pipeline
│   │   ├── eval/            # Eval framework
│   │   └── types/           # TypeScript interfaces
│   ├── prisma/              # Database schema
│   └── package.json
├── docker-compose.yml       # PostgreSQL + pgvector
├── .env.example             # Environment variable template
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- OpenAI API key (or Anthropic API key)

### Setup

```bash
# Clone the repo
git clone https://github.com/ZadBabaei/rag-client-dashboard.git
cd rag-client-dashboard

# Start PostgreSQL with pgvector
docker-compose up -d

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Run database migrations
cd ../backend && npx prisma migrate dev

# Start the development servers
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

## Eval Framework

The project includes an automated evaluation harness that measures:

- **Retrieval Recall** — Did the correct document chunks get retrieved?
- **Answer Accuracy** — Does the generated answer match the expected answer?
- **Citation Fidelity** — Do citations reference real source documents and pages?

Run evals:
```bash
cd backend && npm run eval
```
- <!-- add-to-portfolio -->

## License

MIT
