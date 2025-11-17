import { apiFetch } from "./client";

export interface OrganisationPayload {
  name: string;
}

export interface OrganisationResponse {
  message: string;
  organisation?: unknown;
  id?: string;
}

export async function createOrganisation(payload: OrganisationPayload, superAdminId: string): Promise<OrganisationResponse> {
  return apiFetch<OrganisationResponse>("/org/create", {
    method: "POST",
    headers: {
      "X-Super-Admin-ID": superAdminId,
    },
    body: JSON.stringify(payload),
  });
}

export async function updateOrganisation(id: string, adminId: string, updates: Partial<OrganisationPayload>): Promise<OrganisationResponse> {
  return apiFetch<OrganisationResponse>(`/org/update/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ admin_id: adminId, ...updates }),
  });
}

export async function deleteOrganisation(id: string, adminId: string): Promise<OrganisationResponse> {
  return apiFetch<OrganisationResponse>(`/org/delete/${id}`, {
    method: "DELETE",
    headers: {
      "X-Admin-ID": adminId,
    },
  });
}
