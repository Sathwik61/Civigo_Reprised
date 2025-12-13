import { useAuthStore } from "@/zustand/useAuthStore";
import { apiFetch } from "./client";
import { getIdFromJwt } from "@/utils/decodeJwt";

export interface WorkPayload {
  name: string;
  description: string;
  projectId: string;
}

export interface Work extends WorkPayload {
  id: string;
}

// POST /work/create
export async function createWork(payload: WorkPayload): Promise<Work> {
  const { token, role } = useAuthStore.getState();

  const createdBy = getIdFromJwt(token || "") || "unknown";

  return apiFetch<Work>("/work/create", {
    method: "POST",
    auth: true,
    headers: {
      "Content-Type": "application/json",
      createdBy,
      ...(role ? { role } : {}),
    },
    body: JSON.stringify(payload),
  });
}

// PUT /work/update/:id
export async function updateWork(
  id: string,
  updates: Partial<WorkPayload>,
): Promise<{ message: string; work: Work }> {
  const { token, role } = useAuthStore.getState();

  const createdBy = getIdFromJwt(token || "") || "unknown";

  return apiFetch<{ message: string; work: Work }>(`/work/update/${id}`, {
    method: "PUT",
    auth: true,
    headers: {
      "Content-Type": "application/json",
      createdBy,
      ...(role ? { role } : {}),
    },
    body: JSON.stringify(updates),
  });
}

// DELETE /work/delete/:id
export async function deleteWork(id: string): Promise<{ message: string; work: Work }> {
  const { token, role } = useAuthStore.getState();

  const createdBy = getIdFromJwt(token || "") || "unknown";

  return apiFetch<{ message: string; work: Work }>(`/work/delete/${id}`, {
    method: "DELETE",
    auth: true,
    headers: {
      "Content-Type": "application/json",
      createdBy,
      ...(role ? { role } : {}),
    },
  });
}

// GET /work/allWorks
export async function listWorks(): Promise<Work[]> {
  const { token, role } = useAuthStore.getState();

  const createdBy = getIdFromJwt(token || "") || "unknown";

  const raw = await apiFetch<any>("/work/allWorks", {
    method: "GET",
    auth: true,
    headers: {
      "Content-Type": "application/json",
      createdBy,
      ...(role ? { role } : {}),
    },
  });

  const res = typeof raw === "string" ? JSON.parse(raw) : raw;
  const items: any[] = Array.isArray(res) ? res : [];

  return items.map((w: any) => ({
    id: w.id ?? w._id,
    name: w.name,
    description: w.description,
    projectId: w.projectId,
  })) as Work[];
}
