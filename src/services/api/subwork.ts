import { apiFetch } from "./client";

export interface SubworkPayload {
  name: string;
  workId: string;
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

export async function createSubwork(payload: SubworkPayload): Promise<Subwork> {
  return apiFetch<Subwork>("/subwork/create-subwork", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
}

export async function updateSubwork(id: string, updates: Partial<SubworkPayload>): Promise<{ message: string; subwork: Subwork }>
{
  return apiFetch<{ message: string; subwork: Subwork }>(`/subwork/update-subwork/${id}`, {
    method: "PUT",
    auth: true,
    body: JSON.stringify(updates),
  });
}

export async function updateSubworkDefault(
  id: string,
  updates: { CFT?: number; SFT?: number },
): Promise<{ message: string; subwork: Subwork }>
{
  return apiFetch<{ message: string; subwork: Subwork }>(`/subwork/update-default/${id}`, {
    method: "PUT",
    auth: true,
    body: JSON.stringify(updates),
  });
}

export async function deleteSubwork(id: string): Promise<{ message: string; subwork: Subwork }>
{
  return apiFetch<{ message: string; subwork: Subwork }>(`/subwork/delete/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

export async function listSubworks(): Promise<Subwork[]> {
  return apiFetch<Subwork[]>("/subwork/all-subworks", {
    method: "GET",
    auth: true,
  });
}

export async function bulkReplaceItems(
  id: string,
  type: "details" | "deductions",
  items: ItemPayload[],
): Promise<{ message: string; subwork: Subwork }>
{
  return apiFetch<{ message: string; subwork: Subwork }>(`/subwork/update-items/${id}`, {
    method: "PUT",
    auth: true,
    body: JSON.stringify({ type, items }),
  });
}

export async function addItems(
  id: string,
  type: "details" | "deductions",
  items: ItemPayload[],
): Promise<{ message: string; items: ItemPayload[] }>
{
  return apiFetch<{ message: string; items: ItemPayload[] }>(`/subwork/items/${id}`, {
    method: "POST",
    auth: true,
    headers: {
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
): Promise<{ message: string; item: ItemPayload }>
{
  return apiFetch<{ message: string; item: ItemPayload }>(`/subwork/items/${id}/${itemId}`, {
    method: "PUT",
    auth: true,
    headers: {
      "X-Item-Type": type,
    },
    body: JSON.stringify(item),
  });
}

export async function deleteItem(
  id: string,
  itemId: string,
  type: "details" | "deductions",
): Promise<{ message: string; itemId: string }>
{
  return apiFetch<{ message: string; itemId: string }>(`/subwork/items/${id}/${itemId}`, {
    method: "DELETE",
    auth: true,
    headers: {
      "X-Item-Type": type,
    },
  });
}
