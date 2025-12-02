import { projectsDB, type WorkRecord } from "@/db/projectsDB";
import { createWork, listWorks, updateWork, deleteWork, type WorkPayload } from "@/services/api/work";

export async function addLocalWork(
  work: Omit<WorkRecord, "id" | "synced" | "updatedAt" | "backendId">,
) {
  const now = Date.now();
  await projectsDB.works.add({ ...work, synced: false, updatedAt: now });
}

export async function getLocalWorksForProject(projectKey: { backendId?: string; localId?: number }): Promise<WorkRecord[]> {
  return projectsDB.works
    .where("projectBackendId")
    .equals(projectKey.backendId ?? "")
    .or("projectLocalId")
    .equals(projectKey.localId ?? -1)
    .and((w) => !w.deleted)
    .toArray();
}

/** Pull all works from backend and overwrite local cache */
export async function syncWorksFromServer() {
  const remote = await listWorks();
  await projectsDB.works.clear();
  await projectsDB.works.bulkAdd(
    remote.map((w) => ({
      backendId: w.id,
      projectBackendId: w.projectId,
      projectLocalId: undefined,
      name: w.name,
      description: w.description,
      synced: true,
      updatedAt: Date.now(),
      deleted: false,
    })),
  );
}

/** Push unsynced local works to server */
export async function syncWorksToServer() {
  const all = await projectsDB.works.toArray();
  const toCreate = all.filter((w) => !w.backendId && !w.deleted && w.synced === false);
  const toUpdate = all.filter((w) => w.backendId && !w.deleted && w.synced === false);
  const toDelete = all.filter((w) => w.backendId && w.deleted && w.synced === false);

  // create new works on backend
  for (const w of toCreate) {
    try {
      const payload: WorkPayload = {
        name: w.name,
        description: w.description,
        projectId: w.projectBackendId!,
      };
      const created = await createWork(payload);
      await projectsDB.works.update(w.id!, {
        backendId: created.id,
        synced: true,
        updatedAt: Date.now(),
      });
    } catch {
      // keep as unsynced; will retry later
    }
  }

  // update existing works on backend
  for (const w of toUpdate) {
    try {
      await updateWork(w.backendId!, {
        name: w.name,
        description: w.description,
      });
      await projectsDB.works.update(w.id!, {
        synced: true,
        updatedAt: Date.now(),
      });
    } catch {
      // keep as unsynced; will retry later
    }
  }

  // delete works on backend
  for (const w of toDelete) {
    try {
      await deleteWork(w.backendId!);
      await projectsDB.works.delete(w.id!);
    } catch (err) {
      console.error("Failed to delete work on backend:", w.backendId, err);
    }
  }
}

export async function updateLocalWork(record: WorkRecord, updates: Partial<Pick<WorkRecord, "name" | "description">>) {
  if (!record.id) return;
  const now = Date.now();
  // how to parse the string to a number.  parseInt 
  // const wId:number  = record.synced?parseInt(record.backendId):record.id;
  await projectsDB.works.update(record.id, {
    ...record,
    ...updates,
    synced: false,
    updatedAt: now,
  });
}

export async function deleteLocalWork(record: WorkRecord) {
  if (!record.id) return;
  // soft delete; actual deletion happens after successful server sync
  await projectsDB.works.update(record.id, {
    deleted: true,
    synced: false,
    updatedAt: Date.now(),
  });
}

export async function fullWorksSync() {
  if (!navigator.onLine) return;
  await syncWorksToServer();
  await syncWorksFromServer();
}
