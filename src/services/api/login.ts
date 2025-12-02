import { useAuthStore } from "@/zustand/useAuthStore";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ;

export interface LoginRequest{
    email: string;
    password: string;
}

export interface LoginResponse{
    token: string;
    userId: string;
}
const JWT_STORAGE_KEY = "civigo-jwt-token";

export async function loginApi(payload: LoginRequest): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE_URL}/user/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(errorText || "Login failed");
  }

  const data = (await res.json()) as LoginResponse;

  // store JWT in localStorage
  window.localStorage.setItem(JWT_STORAGE_KEY, data.token);
  return data;
}

export function getStoredToken(): string | null {
  return window.localStorage.getItem(JWT_STORAGE_KEY);
}

export function clearStoredToken() {
  window.localStorage.removeItem(JWT_STORAGE_KEY);
}