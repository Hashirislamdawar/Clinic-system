import { useMemo, useState } from "react";
import { Search, ChevronUp, ChevronDown, Inbox } from "lucide-react";
import Skeleton from "./Skeleton.jsx";

export default function DataTable({
  columns,
  rows,
  loading = false,
  rowKey = "id",
  searchable = true,
  searchKeys = [],
  searchPlaceholder = "Search…",
  toolbarRight = null,
  emptyTitle = "Nothing here yet",
  emptyHint = "",
  emptyIcon: EmptyIcon = Inbox,
  onRowClick,
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState({ key: null, dir: "asc" });

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) =>
      searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(q))
    );
  }, [rows, query, searchKeys]);

  const sorted = useMemo(() => {
    if (!sort.key) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    const val = (r) => (col?.sortValue ? col.sortValue(r) : r[sort.key]);
    return [...filtered].sort((a, b) => {
      const av = val(a), bv = val(b);
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sort, columns]);

  const toggleSort = (key) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );

  return (
    <div className="card">
      {(searchable || toolbarRight) && (
        <div className="toolbar">
          {searchable && (
            <div className="field-search">
              <Search size={16} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label="Search table"
              />
            </div>
          )}
          <div style={{ flex: 1 }} />
          {toolbarRight}
        </div>
      )}

      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={c.sortable ? "sortable" : ""}
                  style={{ textAlign: c.align || "left", width: c.width }}
                  onClick={c.sortable ? () => toggleSort(c.key) : undefined}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, verticalAlign: "middle" }}>
                    {c.header}
                    {c.sortable && sort.key === c.key &&
                      (sort.dir === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((c) => (
                      <td key={c.key}>
                        <Skeleton height={14} width={`${50 + ((i * 7 + c.key.length * 9) % 45)}%`} />
                      </td>
                    ))}
                  </tr>
                ))
              : sorted.map((row) => (
                  <tr
                    key={row[rowKey]}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    style={onRowClick ? { cursor: "pointer" } : undefined}
                  >
                    {columns.map((c) => (
                      <td key={c.key} style={{ textAlign: c.align || "left" }}>
                        {c.render ? c.render(row) : row[c.key] ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {!loading && sorted.length === 0 && (
        <div className="empty">
          <span className="empty-icon">
            <EmptyIcon size={24} />
          </span>
          <h4>{query ? "No matches found" : emptyTitle}</h4>
          {(query ? "Try a different search term." : emptyHint) && (
            <p className="caption">{query ? "Try a different search term." : emptyHint}</p>
          )}
        </div>
      )}
    </div>
  );
}
