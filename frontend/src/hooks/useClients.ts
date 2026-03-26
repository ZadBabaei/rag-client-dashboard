import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";

export function useClients(search?: string) {
  return useQuery({
    queryKey: ["clients", search],
    queryFn: () => api.getClients(search),
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: ["clients", id],
    queryFn: () => api.getClient(id),
    enabled: !!id,
  });
}
