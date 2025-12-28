
import { projectsDB, type SubworkRecord } from "@/db/projectsDB";
import { createSubwork, listSubworks, updateSubwork, deleteSubwork, type SubworkPayload } from "@/services/api/subwork";
import { numericId } from "@/utils/randomId";
import { useAuthStore } from "@/zustand/useAuthStore";

export async function addLocalSubwork(
  subwork: Omit<SubworkRecord, "synced" | "updatedAt" | "backendId">,
) {
  const now = Date.now();
  await projectsDB.subworks.add({ ...subwork, synced: false, updatedAt: now });
}
/**
 * Given a workLocalId (Dexie id), returns the backendId (MongoDB id) of the work, or undefined if not found.
 */
export async function getWorkBackendIdFromLocalId(workLocalId: string | undefined): Promise<string | undefined> {
  if (!workLocalId) return undefined;
  const work = await projectsDB.works.get(workLocalId);
  console.log("Mapping work local ID", workLocalId, "to backend ID:", work?.backendId);
  return work?.backendId;
}
/**
 * Given a workBackendId (MongoDB id), returns the localId (Dexie id) of the work, or undefined if not found.
 */
export async function getWorkLocalIdFromBackendId(workBackendId: string | undefined): Promise<string | undefined> {
  if (!workBackendId) return undefined;
  const work = await projectsDB.works.where("backendId").equals(workBackendId).first();
  return work?.id;
}
export async function getLocalSubworksForWork(workKey: { backendId?: string; localId?: string }): Promise<SubworkRecord[]> {
  
  console.log("Loading Db buis for localID:", workKey.localId);
  return projectsDB.subworks
    .where("workBackendId")
    .equals(workKey.backendId ?? "")
    .or("workLocalId")
    .equals(workKey.localId ?? "")
    .and((s) => !s.deleted)
    .toArray();
}

/** Pull all subworks from backend and overwrite local cache */
export async function syncSubworksFromServer() {
  const { token, role } = useAuthStore.getState();
  if (!token || !role) return;

  let remote = await listSubworks(token, role);
  // If remote is a string, try to parse it as JSON
  if (typeof remote === "string") {
    try {
      remote = JSON.parse(remote);
    } catch (e) {
      console.error("Failed to parse subworks JSON:", e, remote);
      return;
    }
  }
  if (!remote || remote.length === 0 || !Array.isArray(remote) ) return;

  const remoteIds = remote.map((s) => s.id);
  const existing = await projectsDB.subworks.where("backendId").anyOf(remoteIds).toArray();
  const byRemoteId = new Map(existing.map((s) => [s.backendId, s]));
  const upsert = remote.map(async (remoteSubwork) => {
    const localSubwork = byRemoteId.get(remoteSubwork.id);
    if (localSubwork) {
      return {
        ...localSubwork,
        id: localSubwork.id,
        // remoteSubwork,
        name: String(remoteSubwork.name ?? ""),
        backendId: remoteSubwork.id,
        workLocalId: localSubwork.workLocalId?localSubwork.workLocalId:await getWorkLocalIdFromBackendId(remoteSubwork.wid),
        workBackendId: localSubwork.workBackendId?localSubwork.workBackendId:await getWorkBackendIdFromLocalId(remoteSubwork.wid),
        deleted: false,
        synced: true,
        updatedAt: Date.now(),
      }
    }
    return{
      // ...remoteSubwork,
      name: String(remoteSubwork.name ?? ""),
      backendId: remoteSubwork.id,
      workBackendId: await getWorkBackendIdFromLocalId(remoteSubwork.wid),
      workLocalId: await getWorkLocalIdFromBackendId(remoteSubwork.wid),
      id: numericId(),
      deleted: false,
      synced: true,
      updatedAt: Date.now(),
    }})

  await projectsDB.subworks.clear();
  const resolvedUpsert = await Promise.all(upsert);
  await projectsDB.subworks.bulkAdd(
    resolvedUpsert.map((w) => ({
      ...w,
      synced: true,
      deleted: false,
      updatedAt: Date.now(),
    })),
  );
  /*
  console.log("Fetched", remote.length, "subworks from server.");
  remote.map((s) => {
    console.log("Subwork:", s.id, s.name, "for work ID:", s.workId);
  })
  await projectsDB.subworks.clear();
  await projectsDB.subworks.bulkAdd(
    await Promise.all(remote.map(async (s) => ({
      backendId: s.id,
      workBackendId: s.wid,
      workLocalId: await getWorkLocalIdFromBackendId(s.wid),
      name: String(s.name ?? ""),
      description: typeof s.description === "string" ? s.description : undefined,
      unit: (s as any).unit === "CFT" ? "CFT" : (s as any).unit === "SFT" ? "SFT" : undefined,
      defaultRate: Number((s as any).defaultRate ?? 0),
      synced: true,
      updatedAt: Date.now(),
      deleted: false,
    })),
  ));
  */
  
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
      const Wid = await getWorkBackendIdFromLocalId(s.workBackendId);
      // console.log("Creating subwork on backend for work backend ID:", Wid, "bakendId ",s.workBackendId);
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
    } catch(err) {
      // keep as unsynced; will retry later
      console.error("Failed to create subwork on backend:", err);
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
    } catch (err) {
      // keep as unsynced; will retry later
      console.error("Failed to update subwork on backend:", err);
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

/**
 * Given a subworkLocalId (Dexie id), returns the backendId (MongoDB id) of the subwork, or undefined if not found.
 */
export async function getSubworkBackendIdFromLocalId(subworkLocalId: string | undefined): Promise<string | undefined> {
  if (!subworkLocalId) return undefined;
  const subwork = await projectsDB.subworks.get(subworkLocalId);
  return subwork?.backendId;
}

/**
 * Given a subworkBackendId (MongoDB id), returns the localId (Dexie id) of the subwork, or undefined if not found.
 */
export async function getSubworkLocalIdFromBackendId(subworkBackendId: string | undefined): Promise<string | undefined> {
  if (!subworkBackendId) return undefined;
  const subwork = await projectsDB.subworks.where("backendId").equals(subworkBackendId).first();
  return subwork?.id;
}
export async function getSubworkValue(id: string, variableName: string): Promise<any> {
  const entry = await projectsDB.subworks.get(id);
  if (!entry) return undefined;
  return (entry as any)[variableName];
}

export async function fullSubworksSync() {
  if (!navigator.onLine) return;
  await syncSubworksToServer();
  await syncSubworksFromServer();
}
