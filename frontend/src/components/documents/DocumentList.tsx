import type { Document } from "../../types";

interface DocumentListProps {
  documents: Document[];
  isLoading: boolean;
}

function formatFileSize(fileSize: number) {
  const megabyte = 1024 * 1024;

  if (fileSize >= megabyte) {
    return `${(fileSize / megabyte).toFixed(1)} MB`;
  }

  return `${Math.max(fileSize / 1024, 0.1).toFixed(1)} KB`;
}

export default function DocumentList({ documents, isLoading }: DocumentListProps) {
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-lg bg-white shadow-sm">
        <table className="w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Type</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Size</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {Array.from({ length: 5 }).map((_, index) => (
              <tr key={index} className="animate-pulse">
                <td className="px-4 py-4">
                  <div className="h-4 w-40 rounded bg-gray-200" />
                </td>
                <td className="px-4 py-4">
                  <div className="h-4 w-20 rounded bg-gray-200" />
                </td>
                <td className="px-4 py-4">
                  <div className="h-4 w-16 rounded bg-gray-200" />
                </td>
                <td className="px-4 py-4">
                  <div className="h-4 w-24 rounded bg-gray-200" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-16 text-center text-gray-500">
        No documents uploaded yet
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-sm">
      <table className="w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Type</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Size</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {documents.map((document) => (
            <tr key={document.id}>
              <td className="px-4 py-4 font-medium text-gray-900">{document.fileName}</td>
              <td className="px-4 py-4 text-gray-600">{document.fileType}</td>
              <td className="px-4 py-4 text-gray-600">{formatFileSize(document.fileSize)}</td>
              <td className="px-4 py-4 text-gray-600">
                {new Date(document.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
