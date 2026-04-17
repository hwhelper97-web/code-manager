const BASE = "/api";

function getToken() {
  return localStorage.getItem("accessToken");
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || data?.message || `Request failed: ${res.status}`);
  return data;
}

export const api = {
  get: (path: string) => request(path),
  post: (path: string, body: unknown) => request(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path: string, body: unknown) => request(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: (path: string, body: unknown) => request(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (path: string) => request(path, { method: "DELETE" }),
};
