import { useAuthStore } from "@/zustand/useAuthStore";
import { apiFetch } from "./client";
import { getIdFromJwt } from "@/utils/decodeJwt";


export interface ClientDetails {
  clientname: string;
  clientnumber: number;
  clientaddress: string;
}

export interface ProjectPayload {
  name: string;
  description: string;
  status: string;
  clientdetails: ClientDetails;
}

export interface Project extends ProjectPayload {
  id: string;
}

export async function createProject(payload: ProjectPayload): Promise<Project> {
  const { token, role } = useAuthStore.getState();  
  return apiFetch<Project>("/project/create", {
    method: "POST",
    auth: true,
    headers: {
      "Content-Type": "application/json",
      "role": role || "unknown",
      "createdBy": getIdFromJwt(token || "") || "unknown",
    },
    body: JSON.stringify(payload),
  });
}

export async function updateProject(
  id: string,
  updates: Partial<Pick<ProjectPayload, "name" | "description">>,
): Promise<{ message: string; project: Project }> {
  const { token, role } = useAuthStore.getState();  
  return apiFetch<{ message: string; project: Project }>(`/project/update/${id}`, {
    method: "PUT",
    auth: true,
    headers: {
      "Content-Type": "application/json",
      "createdBy": getIdFromJwt(token || "") || "unknown",
      "role": role || "unknown",
    },
    body: JSON.stringify(updates),
  });
}

export async function deleteProject(id: string): Promise<{ message: string; project: Project }> {
  const { token, role } = useAuthStore.getState();  
  return apiFetch<{ message: string; project: Project }>(`/project/delete/${id}`, {
    method: "DELETE",
    auth: true,
    headers: {
      "Content-Type": "application/json",
      "createdBy": getIdFromJwt(token!=null? token : "") || "unknown",
      "role": role || "unknown",
    },
  });
}

// src/services/api/project.ts
export async function listProjects(): Promise<Project[]> {
  const { token, role } = useAuthStore.getState();

  const raw = await apiFetch<any>("/project/allProjects", {
    method: "GET",
    auth: true,
    headers: {
      "Content-Type": "application/json",
      createdBy: getIdFromJwt(token != null ? token : "") || "unknown",
      role: role || "unknown",
    },
  });
  const res = typeof raw === "string" ? JSON.parse(raw) : raw;
  console.log("Fetched projects from API (parsed):", res);

  // Backend returns a plain array of project objects
  const items: any[] = Array.isArray(res) ? res : [];

  // Map backend fields to our Project type
  return items.map((p: any) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status ?? "Active",
    clientdetails: p.clientDetails ?? p.clientdetails ?? {
      clientname: "",
      clientnumber: 0,
      clientaddress: "",
    },
  })) as Project[];
}