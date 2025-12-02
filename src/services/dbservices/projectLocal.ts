import { projectsDB, type ProjectRecord } from "@/db/projectsDB";
import { createProject, listProjects, updateProject, deleteProject } from "../api/project";

export async function addLocalProject(p: Omit<ProjectRecord, "id" | "synced" | "updatedAt" | "backendId">) {
  const now = Date.now();
  const id = await projectsDB.projects.add({ ...p, synced: false, updatedAt: now });
  console.log("Saved to Dexie with id:", id);
  return id;
}

export async function getAllLocalProjects(): Promise<ProjectRecord[]> {
  const all = await projectsDB.projects.orderBy("updatedAt").reverse().toArray();
  return all.filter((p)=>!p.deleted);
}

/** Pull from backend and overwrite local cache */
export async function syncFromServer() {
  const remote = await listProjects();
  await projectsDB.projects.clear();
  // console.log("Syncing projects from server, got:", remote);
  await projectsDB.projects.bulkAdd(
    remote.map((p) => ({
      backendId: p.id,
      name: p.name,
      description: p.description,
      status: p.status ?? "Active",
      clientdetails: p.clientdetails ?? { clientname: "", clientnumber: 0, clientaddress: "" },
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
export async function markProjectDeletedLocal(id: number) {
  await projectsDB.projects.update(id, {
    deleted: true,
    synced: false,
    updatedAt: Date.now(),
  });
}