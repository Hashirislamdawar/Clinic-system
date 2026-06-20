import { useEffect, useState } from "react";
import { ScrollText } from "lucide-react";
import { api } from "../api.js";
import DataTable from "../components/ui/DataTable.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import Avatar from "../components/ui/Avatar.jsx";

const ACTION_TONE = { create: "emerald", update: "blue", delete: "red" };

export default function Audit() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/audit?page_size=200")
      .then(setRows)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    {
      key: "created_at",
      header: "When",
      sortable: true,
      render: (r) => new Date(r.created_at).toLocaleString("en-GB"),
    },
    {
      key: "actor",
      header: "Actor",
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-12">
          <Avatar name={r.actor} size={30} />
          <span className="cell-strong">{r.actor}</span>
        </div>
      ),
    },
    {
      key: "action",
      header: "Action",
      sortable: true,
      render: (r) => <Badge tone={ACTION_TONE[r.action] || "slate"}>{r.action}</Badge>,
    },
    { key: "entity", header: "Entity", sortable: true, render: (r) => r.entity },
    { key: "entity_id", header: "Record", render: (r) => (r.entity_id ? `#${r.entity_id}` : "—") },
  ];

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="h-page">Audit Log</h1>
          <p>{loading ? "Loading…" : `${rows.length} recorded change${rows.length === 1 ? "" : "s"} — who did what, and when`}</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        searchKeys={["actor", "entity", "action"]}
        searchPlaceholder="Search by actor, entity, or action…"
        emptyTitle="No activity recorded yet"
        emptyIcon={ScrollText}
      />
    </div>
  );
}
