import { Link, useNavigate } from "react-router-dom";
import type { Client } from "../../types";

interface ClientProfileProps {
  client: Client;
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function Field({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-base text-gray-900">{value}</p>
    </div>
  );
}

export default function ClientProfile({ client }: ClientProfileProps) {
  const navigate = useNavigate();
  const goals = client.goals ?? [];
  const familyMembers = client.familyMembers ?? [];

  return (
    <div className="max-w-4xl">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
      >
        Back
      </button>

      <div className="rounded-xl bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-100 pb-6 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">{client.name}</h1>
            <p className="mt-2 text-sm text-gray-500">Client profile overview</p>
          </div>
          <Link
            to={`/chat?clientId=${client.id}`}
            className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            Chat about this client
          </Link>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Field label="Email" value={client.email ?? "N/A"} />
          <Field label="Phone" value={client.phone ?? "N/A"} />
          <Field
            label="Assets Under Management"
            value={client.aum === null ? "N/A" : currencyFormatter.format(client.aum)}
          />
          <Field label="Risk Tolerance" value={client.riskTolerance ?? "N/A"} />
        </div>

        <div className="mt-8">
          <h2 className="text-sm font-medium text-gray-500">Goals</h2>
          {goals.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {goals.map((goal) => (
                <span
                  key={goal}
                  className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                >
                  {goal}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-base text-gray-900">No goals recorded</p>
          )}
        </div>

        <div className="mt-8">
          <h2 className="text-sm font-medium text-gray-500">Family Members</h2>
          {familyMembers.length > 0 ? (
            <ul className="mt-3 space-y-3">
              {familyMembers.map((familyMember, index) => (
                <li
                  key={`${familyMember.name}-${familyMember.relationship}-${index}`}
                  className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
                >
                  <p className="font-medium text-gray-900">{familyMember.name}</p>
                  <p className="text-sm text-gray-600">
                    {familyMember.relationship}
                    {familyMember.age !== undefined ? `, Age ${familyMember.age}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-base text-gray-900">No family members recorded</p>
          )}
        </div>
      </div>
    </div>
  );
}
