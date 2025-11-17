

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export const JWT_STORAGE_KEY = "civigo-jwt";

export function getStoredToken(): string | null {
  return window.localStorage.getItem(JWT_STORAGE_KEY);
}

export function clearStoredToken() {
  window.localStorage.removeItem(JWT_STORAGE_KEY);
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth, headers, ...rest } = options;

  const finalHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...(headers || {}),
  };

  if (auth) {
    const token = getStoredToken();
    if (token) {
      (finalHeaders as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
  });

  if (!res.ok) {
    let message = "Request failed";
    try {
      const text = await res.text();
      message = text || message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const contentType = res.headers.get("Content-Type") || "";
  if (contentType.includes("application/json")) {
    return (await res.json()) as T;
  }
  return (await res.text()) as T;
}
