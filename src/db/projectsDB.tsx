import Dexie from "dexie";

export interface ProjectRecord {
  id?: number;              // local auto-id
  backendId?: string;       // id from API when synced
  name: string;
  description: string;
  status: string;
  clientdetails: {
    clientname: string;
    clientnumber: number;
    clientaddress: string;
  };
  synced: boolean;          // false = needs upload
  updatedAt: number;
}

export interface WorkRecord {
  id?: number;              // local auto-id
  backendId?: string;       // id from API when synced
  projectBackendId?: string; // backend id of parent project
  projectLocalId?: number;   // local id of parent project (fallback when offline)
  name: string;
  description: string;
  synced: boolean;
  updatedAt: number;
}

class ProjectsDB extends Dexie {
  projects!: Dexie.Table<ProjectRecord, number>;
  works!: Dexie.Table<WorkRecord, number>;

  constructor() {
    super("civigoProjectsDB");
    this.version(2).stores({
      projects: "++id, backendId, synced, updatedAt",
      works: "++id, backendId, projectBackendId, projectLocalId, synced, updatedAt",
    });
  }
}

export const projectsDB = new ProjectsDB();