import { useEffect, useRef } from "react";
import type { ChatMessage } from "../../types";
import MessageBubble from "./MessageBubble";

interface ChatWindowProps {
  messages: ChatMessage[];
  isStreaming: boolean;
}

export default function ChatWindow({
  messages,
  isStreaming,
}: ChatWindowProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const handleScroll = () => {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      shouldAutoScrollRef.current = distanceFromBottom <= 100;
    };

    handleScroll();
    container.addEventListener("scroll", handleScroll);

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, isStreaming]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-center text-gray-500">
        Ask a question about your clients
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex h-full flex-col overflow-y-auto p-4 space-y-4">
      {messages.map((message, index) => (
        <MessageBubble
          key={`${message.role}-${index}`}
          message={message}
          isStreaming={
            isStreaming &&
            message.role === "assistant" &&
            index === messages.length - 1
          }
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
