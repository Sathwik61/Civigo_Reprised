import { apiFetch, JWT_STORAGE_KEY } from "./client";

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: string;
}

export interface RegisterResponse {
  message: string;
  id: string;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
}

export async function registerUser(payload: RegisterRequest): Promise<RegisterResponse> {
  const data = await apiFetch<RegisterResponse>("/user/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (data.token) {
    window.localStorage.setItem(JWT_STORAGE_KEY, data.token);
  }

  return data;
}

export async function loginUser(payload: LoginRequest): Promise<LoginResponse> {
  const data = await apiFetch<LoginResponse>("/user/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (data.token) {
    window.localStorage.setItem(JWT_STORAGE_KEY, data.token);
  }

  return data;
}
