import { initials } from "../../lib/format.js";

// Deterministic gradient based on the name so each person keeps a stable color.
const PALETTES = [
  ["#2563eb", "#1d4ed8"],
  ["#10b981", "#059669"],
  ["#8b5cf6", "#6d28d9"],
  ["#f59e0b", "#d97706"],
  ["#0ea5e9", "#0369a1"],
  ["#ec4899", "#be185d"],
  ["#14b8a6", "#0f766e"],
];

function hash(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i);
  return Math.abs(h);
}

export default function Avatar({ name = "", size = 38 }) {
  const [a, b] = PALETTES[hash(name) % PALETTES.length];
  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `linear-gradient(135deg, ${a}, ${b})`,
      }}
      aria-hidden="true"
    >
      {initials(name) || "?"}
    </span>
  );
}
