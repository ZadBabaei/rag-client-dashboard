import type { ChatMessage } from "../../types";
import CitationChip from "./CitationChip";
import StreamingText from "./StreamingText";

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

export default function MessageBubble({
  message,
  isStreaming = false,
}: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={isUser ? "ml-auto max-w-[70%]" : "mr-auto max-w-[70%]"}>
      <div
        className={
          isUser
            ? "rounded-2xl rounded-br-sm bg-blue-500 px-4 py-3 text-white"
            : "rounded-2xl rounded-bl-sm bg-gray-100 px-4 py-3 text-gray-900"
        }
      >
        {isStreaming && !isUser ? (
          <StreamingText text={message.content} />
        ) : (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        )}
      </div>

      {!isUser && message.citations && message.citations.length > 0 ? (
        <div className="mt-2 flex flex-wrap">
          {message.citations.map((citation, index) => (
            <CitationChip
              key={`${citation.documentName}-${citation.pageNumber ?? "na"}-${index}`}
              citation={citation}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
