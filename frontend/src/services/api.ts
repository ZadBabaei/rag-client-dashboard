const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Clients
  getClients: (search?: string) =>
    request<import("../types").Client[]>(`/clients${search ? `?search=${encodeURIComponent(search)}` : ""}`),

  getClient: (id: string) =>
    request<import("../types").Client>(`/clients/${id}`),

  createClient: (data: { name: string; email?: string; phone?: string }) =>
    request<import("../types").Client>("/clients", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Documents
  getDocuments: (clientId?: string) =>
    request<import("../types").Document[]>(`/documents${clientId ? `?clientId=${clientId}` : ""}`),

  uploadDocument: (file: File, clientId: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("clientId", clientId);
    return fetch(`${BASE_URL}/documents/upload`, {
      method: "POST",
      body: formData,
    }).then((res) => {
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    });
  },

  // Chat
  sendMessage: (question: string, clientId?: string, conversationId?: string) =>
    request<import("../types").ChatResponse>("/chat", {
      method: "POST",
      body: JSON.stringify({ question, clientId, conversationId }),
    }),
};
