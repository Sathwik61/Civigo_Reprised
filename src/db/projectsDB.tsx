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

class ProjectsDB extends Dexie {
  projects!: Dexie.Table<ProjectRecord, number>;

  constructor() {
    super("civigoProjectsDB");
    this.version(1).stores({
      projects: "++id, backendId, synced, updatedAt",
    });
  }
}

export const projectsDB = new ProjectsDB();