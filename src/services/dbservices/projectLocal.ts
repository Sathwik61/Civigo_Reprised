import { projectsDB, type ProjectRecord } from "@/db/projectsDB";
import { createProject,listProjects } from "../api/project";

export async function addLocalProject(p: Omit<ProjectRecord, "id" | "synced" | "updatedAt">) {
  const now = Date.now();
  const id = await projectsDB.projects.add({ ...p, synced: false, updatedAt: now });
  console.log("Saved to Dexie with id:", id);
  return id;
}

export async function getAllLocalProjects(): Promise<ProjectRecord[]> {
  return projectsDB.projects.orderBy("updatedAt").reverse().toArray();
}

/** Pull from backend and overwrite local cache */
export async function syncFromServer() {
  const remote = await listProjects();
  await projectsDB.projects.clear();
  await projectsDB.projects.bulkAdd(
    remote.map((p) => ({
      backendId: p.id,
      name: p.name,
      description: p.description,
      status: (p as any).status ?? "Active",
      clientdetails: (p as any).clientDetails ?? { clientname: "", clientnumber: 0, clientaddress: "" },
      synced: true,
      updatedAt: Date.now(),
    })),
  );
}

/** Push unsynced local projects to server */
export async function syncToServer() {
  const all = await projectsDB.projects.toArray();
  const unsynced = all.filter((p) => p.synced === false);
  for (const p of unsynced) {
    try {
      const created = await createProject({
        name: p.name,
        description: p.description,
        clientDetails: p.clientdetails,
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
}

/** Full sync: push pending then pull latest */
export async function fullSync() {
  if (!navigator.onLine) return;
  await syncToServer();
  await syncFromServer();
}