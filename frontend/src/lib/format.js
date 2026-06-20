// Shared formatting helpers (currency, dates, initials).

const pkr = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  maximumFractionDigits: 0,
});

export function currency(value) {
  return pkr.format(Number(value || 0));
}

export function compactCurrency(value) {
  const n = Number(value || 0);
  if (n >= 1_000_000) return `PKR ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `PKR ${(n / 1_000).toFixed(1)}K`;
  return currency(n);
}

export function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function dayMonth(iso) {
  if (!iso) return { d: "—", m: "" };
  const dt = new Date(iso + "T00:00:00");
  return {
    d: dt.toLocaleDateString("en-GB", { day: "2-digit" }),
    m: dt.toLocaleDateString("en-GB", { month: "short" }),
  };
}

export function initials(name = "") {
  return name
    .replace(/^(Dr\.?|Mr\.?|Mrs\.?|Ms\.?)\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export function age(dobIso) {
  if (!dobIso) return null;
  const dob = new Date(dobIso + "T00:00:00");
  const diff = Date.now() - dob.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}
