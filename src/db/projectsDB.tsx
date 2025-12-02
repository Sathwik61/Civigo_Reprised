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
  deleted?: boolean;        // soft-delete marker for sync
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
  deleted?: boolean;        // soft-delete marker for sync
}

export interface SubworkRecord {
  id?: number;               // local auto-id
  backendId?: string;        // id from API when synced
  workBackendId?: string;    // backend id of parent work
  workLocalId?: number;      // local id of parent work (fallback when offline)
  name: string;
  description?: string;
  synced: boolean;
  updatedAt: number;
  deleted?: boolean;         // soft-delete marker for sync
}

export interface SubworkEntryRecord {
  id?: number;                // local auto-id
  backendId?: string;         // id from API when synced (itemId)
  subworkBackendId?: string;  // backend id of parent subwork
  subworkLocalId?: number;    // local id of parent subwork (fallback when offline)
  kind: "details" | "deductions";
  name: string;
  number: number;
  length: number;
  breadth: number;
  depth: number;
  quantity: number;
  rate: number;
  total: number;
  synced: boolean;
  updatedAt: number;
  deleted?: boolean;
}

class ProjectsDB extends Dexie {
  projects!: Dexie.Table<ProjectRecord, number>;
  works!: Dexie.Table<WorkRecord, number>;
  subworks!: Dexie.Table<SubworkRecord, number>;
  subworkEntries!: Dexie.Table<SubworkEntryRecord, number>;

  constructor() {
    super("civigoProjectsDB");
    this.version(3).stores({
      projects: "++id, backendId, synced, updatedAt, deleted",
      works: "++id, backendId, projectBackendId, projectLocalId, synced, updatedAt, deleted",
      subworks: "++id, backendId, workBackendId, workLocalId, synced, updatedAt, deleted",
      subworkEntries: "++id, backendId, subworkBackendId, subworkLocalId, kind, synced, updatedAt, deleted",
    });
  }
}

export const projectsDB = new ProjectsDB();