import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../services/api";

interface DocumentViewerProps {
  documentId: string;
  highlightText?: string;
  onClose: () => void;
}

interface DocumentResponse {
  id?: string;
  fileName?: string;
  documentName?: string;
  name?: string;
  text?: string;
  content?: string;
}

function getDocumentName(document: DocumentResponse | null) {
  return document?.fileName ?? document?.documentName ?? document?.name ?? "Document";
}

function getDocumentText(document: DocumentResponse | null) {
  return document?.text ?? document?.content ?? "";
}

export default function DocumentViewer({
  documentId,
  highlightText,
  onClose,
}: DocumentViewerProps) {
  const [document, setDocument] = useState<DocumentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const highlightRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    setDocument(null);
    setIsLoading(true);
    setError(false);

    const getDocument = (api as typeof api & {
      getDocument: (id: string) => Promise<DocumentResponse>;
    }).getDocument;

    getDocument(documentId)
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setDocument(response);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setError(true);
      })
      .finally(() => {
        if (!isMounted) {
          return;
        }

        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [documentId]);

  useEffect(() => {
    const animationFrame = window.requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const documentText = getDocumentText(document);

  const content = useMemo(() => {
    const trimmedHighlight = highlightText?.trim();

    if (!trimmedHighlight || !documentText) {
      return {
        hasHighlight: false,
        content: documentText,
      };
    }

    const matchIndex = documentText.indexOf(trimmedHighlight);

    if (matchIndex === -1) {
      return {
        hasHighlight: false,
        content: documentText,
      };
    }

    const before = documentText.slice(0, matchIndex);
    const match = documentText.slice(matchIndex, matchIndex + trimmedHighlight.length);
    const after = documentText.slice(matchIndex + trimmedHighlight.length);

    return {
      hasHighlight: true,
      content: (
        <>
          {before}
          <mark
            ref={(node) => {
              highlightRef.current = node;
            }}
            className="bg-yellow-200"
          >
            {match}
          </mark>
          {after}
        </>
      ),
    };
  }, [documentText, highlightText]);

  useEffect(() => {
    if (!content.hasHighlight || !highlightRef.current) {
      return;
    }

    highlightRef.current.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [content]);

  return (
    <>
      <button
        aria-label="Close document viewer"
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
        type="button"
      />

      <aside
        aria-label="Document viewer"
        className={`fixed right-0 top-0 z-50 flex h-full w-1/2 min-w-[24rem] flex-col bg-white shadow-xl transition-transform duration-300 ease-out ${
          isVisible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="truncate pr-4 text-base font-semibold text-gray-900">
            {getDocumentName(document)}
          </h2>
          <button
            aria-label="Close document viewer"
            className="rounded p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            onClick={onClose}
            type="button"
          >
            <span aria-hidden="true" className="text-xl leading-none">
              X
            </span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto whitespace-pre-wrap p-4 text-sm text-gray-700">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-gray-600" />
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center text-gray-500">
              Failed to load document
            </div>
          ) : (
            content.content
          )}
        </div>
      </aside>
    </>
  );
}
