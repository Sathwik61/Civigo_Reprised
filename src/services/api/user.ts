import { apiFetch } from "./client";

export interface UserPayload {
  name: string;
  email: string;
  password: string;
  role: string;
  org_id?: string;
}

export interface UserResponse {
  message: string;
  id?: string;
  user?: unknown;
}

export async function createUserAsAdmin(payload: UserPayload, adminId: string): Promise<UserResponse> {
  return apiFetch<UserResponse>("/user/create", {
    method: "POST",
    headers: {
      "X-Admin-ID": adminId,
    },
    body: JSON.stringify(payload),
  });
}

export async function deleteUser(userId: string, adminId: string): Promise<UserResponse> {
  return apiFetch<UserResponse>(`/user/delete/${userId}`, {
    method: "DELETE",
    headers: {
      "X-Admin-ID": adminId,
    },
  });
}

export async function updateUser(userId: string, updates: Partial<UserPayload>, adminId: string): Promise<UserResponse> {
  return apiFetch<UserResponse>(`/user/update/${userId}`, {
    method: "PATCH",
    headers: {
      "X-Admin-ID": adminId,
    },
    body: JSON.stringify(updates),
  });
}
