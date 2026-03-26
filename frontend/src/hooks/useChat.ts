import { useState, useCallback } from "react";
import type { ChatMessage } from "../types";
import { api } from "../services/api";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (question: string, clientId?: string) => {
      setMessages((prev) => [...prev, { role: "user", content: question }]);
      setIsLoading(true);

      try {
        const response = await api.sendMessage(
          question,
          clientId,
          conversationId ?? undefined
        );
        setConversationId(response.conversationId);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: response.answer,
            citations: response.citations,
          },
        ]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, something went wrong. Please try again.",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
  }, []);

  return { messages, isLoading, sendMessage, clearChat, conversationId };
}
