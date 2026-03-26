export interface TextChunk {
  content: string;
  chunkIndex: number;
  tokenCount: number;
}

interface ChunkOptions {
  chunkSize?: number;
  overlap?: number;
}

interface SentenceUnit {
  content: string;
  tokenCount: number;
}

const DEFAULT_CHUNK_SIZE = 500;
const DEFAULT_OVERLAP = 50;

function estimateTokens(content: string): number {
  return Math.ceil(content.length / 4);
}

function buildChunk(sentences: SentenceUnit[], chunkIndex: number): TextChunk {
  const content = sentences.map((sentence) => sentence.content).join(" ").trim();

  return {
    content,
    chunkIndex,
    tokenCount: estimateTokens(content),
  };
}

function getOverlapSentences(
  sentences: SentenceUnit[],
  overlapTokens: number,
): SentenceUnit[] {
  if (overlapTokens <= 0 || sentences.length === 0) {
    return [];
  }

  const overlap: SentenceUnit[] = [];
  let tokenTotal = 0;

  for (let index = sentences.length - 1; index >= 0; index -= 1) {
    overlap.unshift(sentences[index]);
    tokenTotal += sentences[index].tokenCount;

    if (tokenTotal >= overlapTokens) {
      break;
    }
  }

  return overlap;
}

export function chunkText(text: string, options: ChunkOptions = {}): TextChunk[] {
  if (text.trim().length === 0) {
    return [];
  }

  const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const overlap = options.overlap ?? DEFAULT_OVERLAP;
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0)
    .map((sentence) => ({
      content: sentence,
      tokenCount: estimateTokens(sentence),
    }));

  if (sentences.length === 0) {
    return [];
  }

  const chunks: TextChunk[] = [];
  let currentSentences: SentenceUnit[] = [];
  let currentTokenCount = 0;

  for (const sentence of sentences) {
    const exceedsChunkSize =
      currentSentences.length > 0 && currentTokenCount + sentence.tokenCount > chunkSize;

    if (exceedsChunkSize) {
      chunks.push(buildChunk(currentSentences, chunks.length));

      currentSentences = getOverlapSentences(currentSentences, overlap);
      currentTokenCount = currentSentences.reduce(
        (total, overlapSentence) => total + overlapSentence.tokenCount,
        0,
      );
    }

    currentSentences.push(sentence);
    currentTokenCount += sentence.tokenCount;
  }

  if (currentSentences.length > 0) {
    chunks.push(buildChunk(currentSentences, chunks.length));
  }

  return chunks;
}
