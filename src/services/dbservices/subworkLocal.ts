import { projectsDB, type SubworkRecord } from "@/db/projectsDB";
import { createSubwork, listSubworks, updateSubwork, deleteSubwork, type SubworkPayload } from "@/services/api/subwork";
import { useAuthStore } from "@/zustand/useAuthStore";

export async function addLocalSubwork(
  subwork: Omit<SubworkRecord, "id" | "synced" | "updatedAt" | "backendId">,
) {
  const now = Date.now();
  await projectsDB.subworks.add({ ...subwork, synced: false, updatedAt: now });
}
/**
 * Given a workLocalId (Dexie id), returns the backendId (MongoDB id) of the work, or undefined if not found.
 */
export async function getWorkBackendIdFromLocalId(workLocalId: number | undefined): Promise<string | undefined> {
  if (!workLocalId) return undefined;
  const work = await projectsDB.works.get(workLocalId);
  return work?.backendId;
}
export async function getLocalSubworksForWork(workKey: { backendId?: string; localId?: number }): Promise<SubworkRecord[]> {
  return projectsDB.subworks
    .where("workBackendId")
    .equals(workKey.backendId ?? "")
    .or("workLocalId")
    .equals(workKey.localId ?? -1)
    .and((s) => !s.deleted)
    .toArray();
}

/** Pull all subworks from backend and overwrite local cache */
export async function syncSubworksFromServer() {
  const { token, role } = useAuthStore.getState();
  if (!token || !role) return;

  const remote = await listSubworks(token, role);
  await projectsDB.subworks.clear();
  await projectsDB.subworks.bulkAdd(
    remote.map((s) => ({
      backendId: s.id,
      workBackendId: String(s.workId),
      workLocalId: undefined,
      name: String(s.name ?? ""),
      description: typeof s.description === "string" ? s.description : undefined,
      unit: (s as any).unit === "CFT" ? "CFT" : (s as any).unit === "SFT" ? "SFT" : undefined,
      defaultRate: Number((s as any).defaultRate ?? 0),
      synced: true,
      updatedAt: Date.now(),
      deleted: false,
    })),
  );
}

/** Push unsynced local subworks to server */
export async function syncSubworksToServer() {
  const { token, role } = useAuthStore.getState();
  if (!token || !role) return;

  const all = await projectsDB.subworks.toArray();
  const toCreate = all.filter((s) => !s.backendId && !s.deleted && s.synced === false);
  const toUpdate = all.filter((s) => s.backendId && !s.deleted && s.synced === false);
  const toDelete = all.filter((s) => s.backendId && s.deleted && s.synced === false);

  for (const s of toCreate) {
    if (!s.workBackendId) continue;
    try {
      const Wid:string |undefined = await getWorkBackendIdFromLocalId(Number(s.workBackendId));
      const payload: SubworkPayload = {
        name: s.name,
        wid: Wid || "",
      };
      const created = await createSubwork(payload, token, role);
      await projectsDB.subworks.update(s.id!, {
        backendId: created.id,
        synced: true,
        updatedAt: Date.now(),
      });
    } catch {
      // keep as unsynced; will retry later
    }
  }

  // update existing subworks on backend
  for (const s of toUpdate) {
    try {
      await updateSubwork(s.backendId!, {
        name: s.name,
        description: s.description,
      }, token, role);
      await projectsDB.subworks.update(s.id!, {
        synced: true,
        updatedAt: Date.now(),
      });
    } catch {
      // keep as unsynced; will retry later
    }
  }

  // delete subworks on backend
  for (const s of toDelete) {
    try {
      await deleteSubwork(s.backendId!, token, role);
      await projectsDB.subworks.delete(s.id!);
    } catch (err) {
      console.error("Failed to delete subwork on backend:", s.backendId, err);
    }
  }
}

export async function updateLocalSubwork(
  record: SubworkRecord,
  updates: Partial<Pick<SubworkRecord, "name" | "description" | "unit" | "defaultRate">>,
) {
  if (!record.id) return;
  const now = Date.now();
  await projectsDB.subworks.update(record.id, {
    ...record,
    ...updates,
    synced: false,
    updatedAt: now,
  });
}

export async function deleteLocalSubwork(record: SubworkRecord) {
  if (!record.id) return;
  await projectsDB.subworks.update(record.id, {
    deleted: true,
    synced: false,
    updatedAt: Date.now(),
  });
}

export async function fullSubworksSync() {
  if (!navigator.onLine) return;
  await syncSubworksToServer();
  await syncSubworksFromServer();
}
