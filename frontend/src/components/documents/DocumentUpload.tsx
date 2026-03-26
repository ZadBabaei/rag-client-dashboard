import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useClients } from "../../hooks/useClients";
import { useUploadDocument } from "../../hooks/useDocuments";

interface DocumentUploadProps {
  onUploadSuccess?: () => void;
}

const ACCEPTED_EXTENSIONS = [".pdf", ".txt", ".docx"];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function isAllowedFileType(file: File) {
  const fileName = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((extension) => fileName.endsWith(extension));
}

export default function DocumentUpload({ onUploadSuccess }: DocumentUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { data: clients = [], isLoading: isClientsLoading, isError: isClientsError, error: clientsError } = useClients();
  const uploadDocument = useUploadDocument();

  function validateFile(file: File) {
    if (!selectedClientId) {
      return "Select a client before uploading.";
    }

    if (!isAllowedFileType(file)) {
      return "Unsupported file type. Upload a PDF, TXT, or DOCX file.";
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return "File size must be 10MB or less.";
    }

    return null;
  }

  function handleFileUpload(file: File) {
    const validationError = validateFile(file);

    if (validationError) {
      setStatusMessage({ type: "error", text: validationError });
      return;
    }

    setStatusMessage(null);
    uploadDocument.mutate(
      { file, clientId: selectedClientId },
      {
        onSuccess: () => {
          setStatusMessage({ type: "success", text: `${file.name} uploaded successfully.` });
          onUploadSuccess?.();
        },
        onError: (error) => {
          setStatusMessage({
            type: "error",
            text: error instanceof Error ? error.message : "Upload failed.",
          });
        },
      },
    );
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    event.target.value = "";
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }

  return (
    <section className="rounded-lg bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Upload Document</h2>
          <p className="mt-1 text-sm text-gray-500">
            Attach PDFs, text files, or Word documents to a client record.
          </p>
        </div>

        <div>
          <label htmlFor="upload-client" className="mb-2 block text-sm font-medium text-gray-700">
            Client
          </label>
          <select
            id="upload-client"
            value={selectedClientId}
            onChange={(event) => {
              setSelectedClientId(event.target.value);
              setStatusMessage(null);
            }}
            disabled={isClientsLoading || uploadDocument.isPending}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200 disabled:cursor-not-allowed disabled:bg-gray-100"
          >
            <option value="">{isClientsLoading ? "Loading clients..." : "Select a client"}</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          {isClientsError ? (
            <p className="mt-2 text-sm text-red-600">
              {clientsError instanceof Error ? clientsError.message : "Failed to load clients."}
            </p>
          ) : null}
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`cursor-pointer rounded-lg border-2 border-dashed p-10 text-center transition ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 bg-white hover:border-gray-400"
          } ${uploadDocument.isPending ? "pointer-events-none opacity-70" : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.docx"
            onChange={handleInputChange}
            className="hidden"
            disabled={uploadDocument.isPending}
          />

          {uploadDocument.isPending ? (
            <div className="flex flex-col items-center justify-center gap-3 text-sm text-gray-600">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              <span>Uploading...</span>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">Drag and drop a document here</p>
              <p className="text-sm text-gray-500">or click to browse</p>
              <p className="text-xs text-gray-400">Accepted: PDF, TXT, DOCX up to 10MB</p>
            </div>
          )}
        </div>

        {statusMessage ? (
          <p className={`text-sm ${statusMessage.type === "success" ? "text-green-600" : "text-red-600"}`}>
            {statusMessage.text}
          </p>
        ) : null}
      </div>
    </section>
  );
}
