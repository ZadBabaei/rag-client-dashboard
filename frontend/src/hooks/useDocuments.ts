import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";

export function useDocuments(clientId?: string) {
  return useQuery({
    queryKey: ["documents", clientId],
    queryFn: () => api.getDocuments(clientId),
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, clientId }: { file: File; clientId: string }) =>
      api.uploadDocument(file, clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}
