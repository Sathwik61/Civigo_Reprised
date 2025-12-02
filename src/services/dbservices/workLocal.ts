import { projectsDB, type WorkRecord } from "@/db/projectsDB";
import { createWork, listWorks, type WorkPayload } from "@/services/api/work";

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
    })),
  );
}

/** Push unsynced local works to server */
export async function syncWorksToServer() {
  const all = await projectsDB.works.toArray();
  const unsynced = all.filter((w) => w.synced === false);

  for (const w of unsynced) {
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
      // keep as unsynced
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
  await projectsDB.works.delete(record.id);
}
