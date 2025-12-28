import Dexie from "dexie";

export interface ProjectRecord {
   id: string;              // local auto-id
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
  id?: string;              // local auto-id
  backendId?: string;       // id from API when synced
  projectBackendId?: string; // backend id of parent project
  projectLocalId?: string;   // local id of parent project (fallback when offline)
  name: string;
  description: string;
  synced: boolean;
  updatedAt: number;
  deleted?: boolean;        // soft-delete marker for sync
}

export interface SubworkRecord {
  id?: string;               // local auto-id
  backendId?: string;        // id from API when synced
  workBackendId?: string;    // backend id of parent work
  workLocalId?: string;      // local id of parent work (fallback when offline)
  name: string;
  description?: string;
  unit?: "SFT" | "CFT";      // measurement unit per subwork
  defaultRate?: number;       // rate per unit for this subwork
  synced: boolean;
  updatedAt: number;
  deleted?: boolean;         // soft-delete marker for sync
}

export interface SubworkEntryRecord {
  id?: string;                // local auto-id
  backendId?: string;         // id from API when synced (itemId)
  subworkBackendId?: string;  // backend id of parent subwork
  subworkLocalId?: string;    // local id of parent subwork (fallback when offline)
  kind: "details" | "deductions";
  name: string;
  number: number;
  length: number;
  breadth: number;
  depth: number;
  quantity: number;
  rate: number;
  total: number;
  unit?: "SFT" | "CFT";
  defaultRate?: number;       // rate per unit for this entry
  synced: boolean;
  updatedAt: number;
  deleted?: boolean;
  operation?: "create" | "update" | "delete"; 
  createSynced?: boolean;   // whether creation has been synced to backend
}

class ProjectsDB extends Dexie {
  projects!: Dexie.Table<ProjectRecord, string>;
  works!: Dexie.Table<WorkRecord, string>;
  subworks!: Dexie.Table<SubworkRecord, string>;
  subworkEntries!: Dexie.Table<SubworkEntryRecord, string>;

  constructor() {
    super("civigoProjectsDB");
    this.version(3).stores({
      projects: "++id, backendId, synced, updatedAt, deleted",
      works: "++id, backendId, projectBackendId, projectLocalId, synced, updatedAt, deleted",
      subworks: "++id, backendId, workBackendId, workLocalId, synced, updatedAt,unit,defaultRate, deleted",
      subworkEntries: "++id, backendId, subworkBackendId, subworkLocalId, kind, synced, updatedAt, deleted, operation, createSynced",
    });
  }
}

export const projectsDB = new ProjectsDB();