// Wrapper around fetch for the City Clinic API (v2).
// The API returns a standard envelope: { success, message, data, meta }.
// On success we unwrap and return `data`; on error we throw `message`.

async function request(path, options = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(`/api${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  // Session expired or missing → bounce to login (except during login itself).
  if (res.status === 401 && !path.startsWith("/auth/login")) {
    localStorage.removeItem("token");
    if (!location.pathname.startsWith("/login")) {
      location.href = "/login";
    }
  }

  if (res.status === 204) return null;

  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    throw new Error(extractError(body, res.status));
  }

  // Unwrap the standard success envelope.
  if (body && typeof body === "object" && "success" in body && "data" in body) {
    return body.data;
  }
  return body;
}

function extractError(body, status) {
  if (!body) return `Request failed (${status})`;
  if (body.message) {
    // Append the first field error if present (validation).
    if (Array.isArray(body.errors) && body.errors.length) {
      const e = body.errors[0];
      return `${body.message}: ${e.field ? e.field + " — " : ""}${e.message}`;
    }
    return body.message;
  }
  if (typeof body.detail === "string") return body.detail; // legacy fallback
  return `Request failed (${status})`;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) }),
  del: (path) => request(path, { method: "DELETE" }),
};
