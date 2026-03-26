import { useParams } from "react-router-dom";
import ClientProfile from "../components/clients/ClientProfile";
import { useClient } from "../hooks/useClients";

function LoadingState() {
  return (
    <div className="max-w-4xl animate-pulse rounded-xl bg-white p-8 shadow-sm">
      <div className="h-6 w-24 rounded bg-gray-200" />
      <div className="mt-6 h-10 w-64 rounded bg-gray-200" />
      <div className="mt-3 h-4 w-40 rounded bg-gray-100" />
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index}>
            <div className="h-4 w-24 rounded bg-gray-100" />
            <div className="mt-2 h-6 w-40 rounded bg-gray-200" />
          </div>
        ))}
      </div>
      <div className="mt-8 h-24 rounded bg-gray-100" />
      <div className="mt-8 h-32 rounded bg-gray-100" />
    </div>
  );
}

export default function ClientDetailPage() {
  const { id } = useParams();
  const { data, isLoading, isError, error } = useClient(id ?? "");

  if (!id) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        Missing client id.
      </div>
    );
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error instanceof Error ? error.message : "Failed to load client."}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-6 py-10 text-center text-gray-500 shadow-sm">
        Client not found.
      </div>
    );
  }

  return <ClientProfile client={data} />;
}
