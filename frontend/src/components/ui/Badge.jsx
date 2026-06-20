export function Badge({ tone = "slate", children }) {
  return (
    <span className={`badge badge-${tone}`}>
      <span className="dot" />
      {children}
    </span>
  );
}

const STATUS_TONE = {
  Scheduled: "blue",
  Completed: "emerald",
  Cancelled: "red",
  "No-Show": "amber",
};

export function StatusBadge({ status }) {
  return <Badge tone={STATUS_TONE[status] || "slate"}>{status}</Badge>;
}
