import { useCallback, useState } from "react";
import type { ChatMessage, Citation } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface TokenEvent {
  type: "token";
  data: string;
}

interface DoneEvent {
  type: "done";
  data: {
    citations?: Citation[];
    conversationId?: string;
  };
}

type ChatStreamEvent = TokenEvent | DoneEvent;

function appendToLastAssistant(
  messages: ChatMessage[],
  updater: (message: ChatMessage) => ChatMessage
) {
  const nextMessages = [...messages];

  for (let index = nextMessages.length - 1; index >= 0; index -= 1) {
    if (nextMessages[index].role === "assistant") {
      nextMessages[index] = updater(nextMessages[index]);
      break;
    }
  }

  return nextMessages;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (question: string, clientId?: string) => {
      const trimmedQuestion = question.trim();

      if (!trimmedQuestion || isStreaming) {
        return;
      }

      setMessages((prev) => [
        ...prev,
        { role: "user", content: trimmedQuestion },
        { role: "assistant", content: "" },
      ]);
      setIsStreaming(true);

      try {
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: trimmedQuestion,
            clientId,
            conversationId,
            stream: true,
          }),
        });

        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }

        if (!response.body) {
          throw new Error("Streaming response body is not available");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const processEvent = (rawEvent: string) => {
          const payload = rawEvent
            .split(/\r?\n/)
            .map((line) => line.trimEnd())
            .filter((line) => line.startsWith("data: "))
            .map((line) => line.slice(6))
            .join("\n");

          if (!payload) {
            return;
          }

          const parsedEvent = JSON.parse(payload) as ChatStreamEvent;

          if (parsedEvent.type === "token") {
            setMessages((prev) =>
              appendToLastAssistant(prev, (message) => ({
                ...message,
                content: message.content + parsedEvent.data,
              }))
            );
            return;
          }

          if (parsedEvent.type === "done") {
            setMessages((prev) =>
              appendToLastAssistant(prev, (message) => ({
                ...message,
                citations: parsedEvent.data.citations ?? [],
              }))
            );
            setConversationId(parsedEvent.data.conversationId ?? null);
          }
        };

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            buffer += decoder.decode();
            break;
          }

          buffer += decoder.decode(value, { stream: true });

          const events = buffer.split(/\r?\n\r?\n/);
          buffer = events.pop() ?? "";

          for (const event of events) {
            if (event.trim()) {
              processEvent(event);
            }
          }
        }

        if (buffer.trim()) {
          processEvent(buffer);
        }
      } catch {
        setMessages((prev) =>
          appendToLastAssistant(prev, () => ({
            role: "assistant",
            content: "Sorry, something went wrong. Please try again.",
          }))
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [conversationId, isStreaming]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setIsStreaming(false);
  }, []);

  return { messages, isStreaming, sendMessage, clearChat, conversationId };
}
