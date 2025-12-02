import { projectsDB, type SubworkRecord } from "@/db/projectsDB";
import { createSubwork, listSubworks, type SubworkPayload } from "@/services/api/subwork";

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
      synced: true,
      updatedAt: Date.now(),
    })),
  );
}

/** Push unsynced local subworks to server */
export async function syncSubworksToServer() {
  const all = await projectsDB.subworks.toArray();
  const unsynced = all.filter((s) => s.synced === false);

  for (const s of unsynced) {
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
      // keep as unsynced
    }
  }
}

export async function updateLocalSubwork(
  record: SubworkRecord,
  updates: Partial<Pick<SubworkRecord, "name" | "description">>,
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
  await projectsDB.subworks.delete(record.id);
}
