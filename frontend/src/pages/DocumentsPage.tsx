import { useState } from "react";
import DocumentList from "../components/documents/DocumentList";
import DocumentUpload from "../components/documents/DocumentUpload";
import { useClients } from "../hooks/useClients";
import { useDocuments } from "../hooks/useDocuments";

export default function DocumentsPage() {
  const [selectedClientId, setSelectedClientId] = useState("");
  const { data: clients = [], isLoading: isClientsLoading, isError: isClientsError, error: clientsError } = useClients();
  const {
    data: documents = [],
    isLoading: isDocumentsLoading,
    isError: isDocumentsError,
    error: documentsError,
    refetch,
  } = useDocuments(selectedClientId || undefined);

  const filteredDocuments = selectedClientId
    ? documents.filter((document) => document.clientId === selectedClientId)
    : documents;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upload client documents and review the latest files in one place.
        </p>
      </div>

      <DocumentUpload onUploadSuccess={() => void refetch()} />

      <section className="space-y-4">
        <div className="flex flex-col gap-3 rounded-lg bg-white p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full sm:max-w-xs">
            <label htmlFor="document-client-filter" className="mb-2 block text-sm font-medium text-gray-700">
              Filter by client
            </label>
            <select
              id="document-client-filter"
              value={selectedClientId}
              onChange={(event) => setSelectedClientId(event.target.value)}
              disabled={isClientsLoading}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200 disabled:cursor-not-allowed disabled:bg-gray-100"
            >
              <option value="">{isClientsLoading ? "Loading clients..." : "All clients"}</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isClientsError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {clientsError instanceof Error ? clientsError.message : "Failed to load clients."}
          </div>
        ) : null}

        {isDocumentsError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {documentsError instanceof Error ? documentsError.message : "Failed to load documents."}
          </div>
        ) : (
          <DocumentList documents={filteredDocuments} isLoading={isDocumentsLoading} />
        )}
      </section>
    </div>
  );
}
