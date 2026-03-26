import mammoth from "mammoth";
import pdfParse from "pdf-parse";

import { UploadError } from "../errors";

export interface ParsedDocument {
  text: string;
  pageCount?: number;
}

export async function parsePdf(buffer: Buffer): Promise<ParsedDocument> {
  const data = await pdfParse(buffer);

  return {
    text: data.text,
    pageCount: data.numpages,
  };
}

export async function parseTxt(buffer: Buffer): Promise<ParsedDocument> {
  return { text: buffer.toString("utf-8") };
}

export async function parseDocx(buffer: Buffer): Promise<ParsedDocument> {
  const result = await mammoth.extractRawText({ buffer });

  return { text: result.value };
}

export async function parseDocument(
  buffer: Buffer,
  mimeType: string,
): Promise<ParsedDocument> {
  switch (mimeType) {
    case "application/pdf":
      return parsePdf(buffer);
    case "text/plain":
      return parseTxt(buffer);
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return parseDocx(buffer);
    default:
      throw new UploadError("Unsupported file type");
  }
}
