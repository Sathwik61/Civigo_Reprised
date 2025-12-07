import { projectsDB, type SubworkRecord } from "@/db/projectsDB";
import { createSubwork, listSubworks, updateSubwork, deleteSubwork, type SubworkPayload } from "@/services/api/subwork";

export async function addLocalSubwork(
  subwork: Omit<SubworkRecord, "id" | "synced" | "updatedAt" | "backendId">,
) {
  const now = Date.now();
  await projectsDB.subworks.add({ ...subwork, synced: false, updatedAt: now });
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
  const remote = await listSubworks();
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
  const all = await projectsDB.subworks.toArray();
  const toCreate = all.filter((s) => !s.backendId && !s.deleted && s.synced === false);
  const toUpdate = all.filter((s) => s.backendId && !s.deleted && s.synced === false);
  const toDelete = all.filter((s) => s.backendId && s.deleted && s.synced === false);

  // create new subworks on backend
  for (const s of toCreate) {
    if (!s.workBackendId) continue;
    try {
      const payload: SubworkPayload = {
        name: s.name,
        workId: s.workBackendId,
      };
      const created = await createSubwork(payload);
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
      });
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
      await deleteSubwork(s.backendId!);
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
