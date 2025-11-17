import { apiFetch } from "./client";

export interface WorkPayload {
  name: string;
  description: string;
  projectId: string;
}

export interface Work extends WorkPayload {
  id: string;
}

export async function createWork(payload: WorkPayload): Promise<Work> {
  return apiFetch<Work>("/work/create", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
}

export async function updateWork(id: string, updates: Partial<WorkPayload>): Promise<{ message: string; work: Work }>
{
  return apiFetch<{ message: string; work: Work }>(`/work/update/${id}`, {
    method: "PUT",
    auth: true,
    body: JSON.stringify(updates),
  });
}

export async function deleteWork(id: string): Promise<{ message: string; work: Work }>
{
  return apiFetch<{ message: string; work: Work }>(`/work/delete/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

export async function listWorks(): Promise<Work[]> {
  return apiFetch<Work[]>("/work/allWorks", {
    method: "GET",
    auth: true,
  });
}
