import { useState } from "react";
import ChatInput from "../components/chat/ChatInput";
import ChatWindow from "../components/chat/ChatWindow";
import { useChat } from "../hooks/useChat";
import { useClients } from "../hooks/useClients";

export default function ChatPage() {
  const { messages, isStreaming, sendMessage, clearChat } = useChat();
  const { data: clients = [] } = useClients();
  const [selectedClientId, setSelectedClientId] = useState("");

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-4 border-b border-gray-200 p-4">
        <select
          className="min-w-[14rem] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          onChange={(event) => setSelectedClientId(event.target.value)}
          value={selectedClientId}
        >
          <option value="">All clients</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>

        <button
          className="text-sm text-gray-500 transition hover:text-red-500"
          onClick={clearChat}
          type="button"
        >
          Clear conversation
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        <ChatWindow isStreaming={isStreaming} messages={messages} />
      </div>

      <ChatInput
        disabled={isStreaming}
        onSend={(text) => sendMessage(text, selectedClientId || undefined)}
      />
    </div>
  );
}
