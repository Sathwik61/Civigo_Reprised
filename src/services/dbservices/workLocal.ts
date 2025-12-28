import { projectsDB, type WorkRecord } from "@/db/projectsDB";
import { createWork, listWorks, updateWork, deleteWork, type WorkPayload } from "@/services/api/work";
import { getProjectLocalIdFromBackendId, getProjectSpecificDataFromLocalId } from "./projectLocal";
import { numericId } from "@/utils/randomId";

export async function addLocalWork(
  work: Omit<WorkRecord,  "synced" | "updatedAt" >,
) {
  const now = Date.now();
  console.log("Adding local work:", work);
  // await projectsDB.works.add({ ...work, id: work.id, synced: false, updatedAt: now });
  await projectsDB.works.add({ ...work, synced: false, updatedAt: now });
}

export async function getLocalWorksForProject(projectKey: { backendId?: string; localId?: number }): Promise<WorkRecord[]> {
 console.log("Loading works for project localID:", projectKey.backendId);
  return projectsDB.works
    .where("projectBackendId")
    .equals(projectKey.backendId??"")
    .and((w) => !w.deleted)
    .toArray();
}

/** Pull all works from backend and overwrite local cache */
export async function syncWorksFromServer() {
  const remote = await listWorks();
  const remoteIds = remote.map((w) => w.id);
  const existing = await projectsDB.works.where("backendId").anyOf(remoteIds).toArray();
  const byRemoteId = new Map(existing.map((w) => [w.backendId, w]));
  // const projects = await projectsDB.projects.toArray();
  // const projectMap = new Map(projects.map(p => [p.backendId, p.id]));
  try{
    const upsert = await Promise.all(remote.map(async (remoteWork) => {
      const localWork = byRemoteId.get(remoteWork.id);
      if(localWork){
        // console.log("Updating local work from server:", remoteWork.projectId);
        return {
          ...localWork,
          projectBackendId:localWork.projectBackendId?localWork.projectBackendId:await getProjectLocalIdFromBackendId(remoteWork.projectId),
          projectLocalId: localWork.projectLocalId?localWork.projectLocalId:await getProjectLocalIdFromBackendId(remoteWork.projectId),
          remoteWork,
          id: localWork.id,
          deleted: false,
          backendId: remoteWork.id,
        }
      }
      // console.log("A ocal work from server:", await getProjectSpecificDataFromLocalId(remoteWork.projectId, "backendId"));
      return {
        ...remoteWork,
        backendId: remoteWork.id,
        projectBackendId: await getProjectSpecificDataFromLocalId(remoteWork.projectId, "backendId"),
        projectLocalId: await getProjectLocalIdFromBackendId(remoteWork.projectId),
        deleted: false,
        id: numericId(),
      }
    }));

    await projectsDB.works.clear();
    await projectsDB.works.bulkAdd(
      upsert.map((w) => ({
        ...w,
        synced: true,
        deleted: false,
        updatedAt: Date.now(),
      })),
    );

    // await projectsDB.works.bulkAdd(
    //   remote.map((w) => ({
    //     id: w.id,
    //     backendId: w.id,
    //     projectBackendId: w.projectId,
    //     projectLocalId: undefined,
    //     name: w.name,
    //     description: w.description,
    //     synced: true,
    //     updatedAt: Date.now(),
    //     deleted: false,
    //   })),
    // );

  }catch(e){
    console.error("Error syncing works from server:", e);
  }
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
        projectId: await getProjectSpecificDataFromLocalId(w.projectBackendId!, "backendId"),
      };
      const created = await createWork(payload);
      await projectsDB.works.update(w.id!, {
        backendId: created.id,
        synced: true,
        updatedAt: Date.now(),
      });
    } catch (err){
      // keep as unsynced; will retry later
      console.error("Failed to create work on backend:", err);
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
    } catch(err){
      // keep as unsynced; will retry later
      console.error("Failed to update work on backend:", err);
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
  console.log("Updating local work ID :",record.id, "record", record, "with updates:", updates);
  await projectsDB.works.update(record.id, {
    ...record,
    ...updates,
    id: record.id,
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
