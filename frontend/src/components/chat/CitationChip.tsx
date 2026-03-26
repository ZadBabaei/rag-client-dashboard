import type { Citation } from "../../types";

interface CitationChipProps {
  citation: Citation;
}

export default function CitationChip({ citation }: CitationChipProps) {
  const pageLabel = `${citation.documentName}, p.${citation.pageNumber ?? "?"}`;

  return (
    <span
      className="mx-1 inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800"
      title={citation.snippet}
    >
      [{pageLabel}]
    </span>
  );
}
