import { Link } from "react-router-dom";
import type { Client } from "../../types";

interface ClientListProps {
  clients: Client[];
  isLoading: boolean;
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatAum(aum: number | null) {
  return aum === null ? "N/A" : currencyFormatter.format(aum);
}

function riskBadgeClasses(riskTolerance: string | null) {
  const normalizedRisk = riskTolerance?.toLowerCase();

  if (normalizedRisk?.includes("high") || normalizedRisk?.includes("aggressive")) {
    return "bg-red-100 text-red-800";
  }

  if (normalizedRisk?.includes("moderate") || normalizedRisk?.includes("medium")) {
    return "bg-amber-100 text-amber-800";
  }

  return "bg-emerald-100 text-emerald-800";
}

export default function ClientList({ clients, isLoading }: ClientListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-40 animate-pulse rounded-lg bg-gray-200"
          />
        ))}
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-16 text-center text-gray-500">
        No clients found
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {clients.map((client) => (
        <Link
          key={client.id}
          to={`/clients/${client.id}`}
          className="rounded-lg bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900">{client.name}</h2>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${riskBadgeClasses(client.riskTolerance)}`}
            >
              {client.riskTolerance ?? "Unknown Risk"}
            </span>
          </div>
          <p className="mt-6 text-sm text-gray-500">Assets Under Management</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {formatAum(client.aum)}
          </p>
        </Link>
      ))}
    </div>
  );
}
