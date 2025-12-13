import { getIdFromJwt } from "@/utils/decodeJwt";
import { apiFetch } from "./client";

export interface SubworkPayload {
  name: string;
  wid: string;
  [key: string]: unknown;
}

export interface Subwork extends SubworkPayload {
  id: string;
}

export interface ItemPayload {
  name: string;
  length?: number;
  breadth?: number;
  depth?: number;
  quantity?: number;
  [key: string]: unknown;
}

export async function createSubwork(
  payload: SubworkPayload,
  token: string,
  role: string,
): Promise<Subwork> {
  const createdBy = getIdFromJwt(token || "") || "unknown";
  return apiFetch<Subwork>("/subwork/create-subwork", {
    method: "POST",
    auth: true,
    headers: {
      createdBy,
      role,
    },
    body: JSON.stringify(payload),
  });
}

export async function updateSubwork(
  id: string,
  updates: Partial<SubworkPayload>,
  token: string,
  role: string,
): Promise<{ message: string; subwork: Subwork }>
{
  const createdBy = getIdFromJwt(token || "") || "unknown";
  
  return apiFetch<{ message: string; subwork: Subwork }>(`/subwork/update-subwork/${id}`, {
    method: "PUT",
    auth: true,
    headers: {
      createdBy,
      role,
    },
    body: JSON.stringify(updates),
  });
}

export async function updateSubworkDefault(
  id: string,
  updates: { CFT?: number; SFT?: number },
  token: string,
  role: string,
): Promise<{ message: string; subwork: Subwork }>
{
  const createdBy = getIdFromJwt(token || "") || "unknown";
  
  return apiFetch<{ message: string; subwork: Subwork }>(`/subwork/update-default/${id}`, {
    method: "PUT",
    auth: true,
    headers: {
      createdBy,
      role,
    },
    body: JSON.stringify(updates),
  });
}

export async function deleteSubwork(
  id: string,
  token: string,
  role: string,
): Promise<{ message: string; subwork: Subwork }>
{
  const createdBy = getIdFromJwt(token || "") || "unknown";
  
  return apiFetch<{ message: string; subwork: Subwork }>(`/subwork/delete/${id}`, {
    method: "DELETE",
    auth: true,
    headers: {
      createdBy,
      role,
    },
  });
}

export async function listSubworks(
  token: string,
  role: string,
): Promise<Subwork[]> {
  const createdBy = getIdFromJwt(token || "") || "unknown";
  
  return apiFetch<Subwork[]>("/subwork/all-subworks", {
    method: "GET",
    auth: true,
    headers: {
      createdBy,
      role,
    },
  });
}

export async function bulkReplaceItems(
  id: string,
  type: "details" | "deductions",
  items: ItemPayload[],
  token: string,
  role: string,
): Promise<{ message: string; subwork: Subwork }>
{
  const createdBy = getIdFromJwt(token || "") || "unknown";
  
  return apiFetch<{ message: string; subwork: Subwork }>(`/subwork/update-items/${id}`, {
    method: "PUT",
    auth: true,
    headers: {
      createdBy,
      role,
    },
    body: JSON.stringify({ type, items }),
  });
}

export async function addItems(
  id: string,
  type: "details" | "deductions",
  items: ItemPayload[],
  token: string,
  role: string,
): Promise<{ message: string; items: ItemPayload[] }>
{
  const createdBy = getIdFromJwt(token || "") || "unknown";
  
  return apiFetch<{ message: string; items: ItemPayload[] }>(`/subwork/items/${id}`, {
    method: "POST",
    auth: true,
    headers: {
      createdBy,
      role,
      "X-Item-Type": type,
    },
    body: JSON.stringify(items),
  });
}

export async function updateItem(
  id: string,
  itemId: string,
  type: "details" | "deductions",
  item: ItemPayload,
  token: string,
  role: string,
): Promise<{ message: string; item: ItemPayload }>
{
  const createdBy = getIdFromJwt(token || "") || "unknown";
  return apiFetch<{ message: string; item: ItemPayload }>(`/subwork/items/${id}/${itemId}`, {
    method: "PUT",
    auth: true,
    headers: {
      createdBy,
      role,
      "X-Item-Type": type,
    },
    body: JSON.stringify(item),
  });
}

export async function deleteItem(
  id: string,
  itemId: string,
  type: "details" | "deductions",
  token: string,
  role: string,
): Promise<{ message: string; itemId: string }>
{
  const createdBy = getIdFromJwt(token || "") || "unknown";
  return apiFetch<{ message: string; itemId: string }>(`/subwork/items/${id}/${itemId}`, {
    method: "DELETE",
    auth: true,
    headers: {
      createdBy,
      role,
      "X-Item-Type": type,
    },
  });
}
