// Export an array of rows to a downloaded CSV file.
// columns: [{ header, value: (row) => any }]
export function exportCsv(filename, rows, columns) {
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = columns.map((c) => escape(c.header)).join(",");
  const body = rows
    .map((r) => columns.map((c) => escape(c.value(r))).join(","))
    .join("\n");
  const blob = new Blob(["﻿" + head + "\n" + body], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
