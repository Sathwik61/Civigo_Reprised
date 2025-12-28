import { projectsDB, type ProjectRecord } from "@/db/projectsDB";
import { createProject, listProjects, updateProject, deleteProject } from "../api/project";
import { numericId } from "@/utils/randomId";

export async function addLocalProject(p: Omit<ProjectRecord, "synced" | "updatedAt" | "backendId">) {
  const now = Date.now();
  const id = await projectsDB.projects.add({ ...p, synced: false, updatedAt: now });
  console.log("Saved to Dexie with id:", id);
  return id;
}

export async function getAllLocalProjects(): Promise<ProjectRecord[]> {
  const all = await projectsDB.projects.orderBy("updatedAt").reverse().toArray();
  console.log("Loaded", all.length, "projects from local DB.");
  return all.filter((p) => !p.deleted);
}

/** Pull from backend and overwrite local cache */
export async function syncFromServer() {
  const remote = await listProjects();
  // console.log("Fetched", remote.length, "projects from server.");
  const remoteIds = remote.map((p) => p.id);
  // Remove local projects that no longer exist on backend
  const local = await projectsDB.projects.where("backendId").anyOf(remoteIds).toArray();
  const byRemoteId = new Map(local.map((p) => [p.backendId, p]));

  const upsert = remote.map((remoteProj) => {
    const localProj = byRemoteId.get(remoteProj.id);

    if (localProj) {
      return {
        ...localProj,
        remoteProj,
        id: localProj.id,
        backendId: remoteProj.id,
      }
    }

    return {
      ...remoteProj,
      backendId: remoteProj.id,
      id: numericId(),
    }
    // return {
    //   id: localProj ? localProj.id : undefined,
    //   backendId: remoteProj.id,
    //   name: remoteProj.name,
    //   description: remoteProj.description,
    //   status: remoteProj.status ?? "Active",
    //   clientdetails: remoteProj.clientdetails ?? ,
    //     clientname: "",
    //   }
  });

  await projectsDB.projects.clear();
  // console.log("Syncing projects from server, got:", remote);
  // await projectsDB.projects.bulkAdd(
  //   remote.map((p) => ({
  //     id: p.id,
  //     backendId: p.id,
  //     name: p.name,
  //     description: p.description,
  //     status: p.status ?? "Active",
  //     clientdetails: p.clientdetails ?? { clientname: "", clientnumber: 0, clientaddress: "" },
  //     synced: true,
  //     updatedAt: Date.now(),
  //   })),
  // );
  await projectsDB.projects.bulkAdd(
    upsert.map((p) => ({
      ...p,
      synced: true,
      updatedAt: Date.now(),
    })),
  );
}

/** Push local changes to server: create, update, delete */
export async function syncToServer() {
  const all = await projectsDB.projects.toArray();
  const toCreate = all.filter((p) => !p.backendId && !p.deleted && p.synced === false);
  const toUpdate = all.filter((p) => p.backendId && !p.deleted && p.synced === false);
  const toDelete = all.filter((p) => p.backendId && p.deleted && p.synced === false);

  // create new projects on backend
  for (const p of toCreate) {
    try {
      const created = await createProject({
        name: p.name,
        description: p.description,
        status: p.status,
        clientdetails: p.clientdetails,
      });
      await projectsDB.projects.update(p.id!, {
        backendId: created.id,
        synced: true,
        updatedAt: Date.now(),
      });
    } catch {
      // keep as unsynced; will retry later
    }
  }

  // update existing projects on backend
  for (const p of toUpdate) {
    try {
      await updateProject(p.backendId!, {
        name: p.name,
        description: p.description,
      });
      await projectsDB.projects.update(p.id!, {
        synced: true,
        updatedAt: Date.now(),
      });
    } catch {
      // keep as unsynced; will retry later
    }
  }

  // delete projects on backend
  for (const p of toDelete) {
    try {
      await deleteProject(p.backendId!);
      await projectsDB.projects.delete(p.id!);
    } catch (err) {
      console.error("Failed to delete project on backend:", p.backendId, err);
    }
  }
}

/** Full sync: push pending then pull latest */
export async function fullSync() {
  if (!navigator.onLine) return;
  await syncToServer();
  await syncFromServer();
}

// mark a local project as deleted (soft delete until synced)
export async function markProjectDeletedLocal(id: string) {
  await projectsDB.projects.update(id, {
    deleted: true,
    synced: false,
    updatedAt: Date.now(),
  });
}

export async function getProjectLocalIdFromBackendId(backendId: string): Promise<string | undefined> {
  const record = await projectsDB.projects.where('backendId').equals(backendId).first();
  return record?.id;
}

export async function getProjectSpecificDataFromLocalId(id: string, item: string): Promise<any> {
  const record = await projectsDB.projects.get(id);
  if (!record) return undefined;
  return (record as any)[item];
}
// export async function getBackendIdFromProjectLocalId(backendId: string): Promise<string | undefined> {
//   const record = await projectsDB.projects.where('id').equals(backendId).first();
//   return record?.id;
// }