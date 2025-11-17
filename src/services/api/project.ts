import { apiFetch } from "./client";

export interface ProjectPayload {
  name: string;
  description: string;
  clientDetails: Record<string, unknown>;
}

export interface Project extends ProjectPayload {
  id: string;
}

export async function createProject(payload: ProjectPayload): Promise<Project> {
  return apiFetch<Project>("/project/create", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
}

export async function updateProject(id: string, updates: Partial<ProjectPayload>): Promise<{ message: string; project: Project }>
{
  return apiFetch<{ message: string; project: Project }>(`/project/update/${id}`, {
    method: "PUT",
    auth: true,
    body: JSON.stringify(updates),
  });
}

export async function deleteProject(id: string): Promise<{ message: string; project: Project }>
{
  return apiFetch<{ message: string; project: Project }>(`/project/delete/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

export async function listProjects(): Promise<Project[]> {
  return apiFetch<Project[]>("/project/allProjects", {
    method: "GET",
    auth: true,
  });
}
