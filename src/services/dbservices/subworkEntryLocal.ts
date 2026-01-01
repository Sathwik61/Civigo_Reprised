import { projectsDB, type SubworkEntryRecord } from "@/db/projectsDB";
import { addItems, deleteItem, listSubworks, updateItem, type ItemPayload, type RemoteSubwork } from "@/services/api/subwork";
import { useAuthStore } from "@/zustand/useAuthStore";
import { getSubworkBackendIdFromLocalId, getSubworkLocalIdFromBackendId, getSubworkValue } from "./subworkLocal";
import { numericId } from "@/utils/randomId";

export async function getLocalEntriesForSubwork(
  subworkKey: { backendId?: string; localId?: number },
  kind: "details" | "deductions",
): Promise<SubworkEntryRecord[]> {
  return projectsDB.subworkEntries
    .where("subworkBackendId")
    .equals(subworkKey.backendId ?? "")
    .or("subworkLocalId")
    .equals(subworkKey.localId ?? -1)
    .and((e) => e.kind === kind && !e.deleted)
    .toArray();
  // return projectsDB.subworkEntries
  //   .filter((e) => (e.subworkBackendId === subworkKey.backendId || e.subworkLocalId === subworkKey.localId) && e.kind === kind && !e.deleted)
  //   .toArray();
}

export async function addLocalEntry(
  entry: Omit<SubworkEntryRecord, "synced" | "updatedAt" | "backendId">,
) {
  const now = Date.now();
  // Dexie add() returns the generated primary key (id)
  return projectsDB.subworkEntries.add({ ...entry, synced: false, updatedAt: now });
}

export async function updateLocalEntry(record: SubworkEntryRecord, updates: Partial<SubworkEntryRecord>) {
  if (!record.id) return;
  const now = Date.now();
  // console.log("Updating local subwork entry ID", record.id, "with updates:", record.synced);
  const syn = await getSubworkEntryValue(record.id, "createSynced")
  await projectsDB.subworkEntries.update(record.id, {
    ...record,
    ...updates,
    synced: false ,
    operation: syn ? "update" : "create",
    updatedAt: now,
  });
}

export async function markEntryDeletedLocal(record: SubworkEntryRecord) {
  if (!record.id) return;
  await projectsDB.subworkEntries.update(record.id, {
    deleted: true,
    synced: false,
    operation: "delete",
    updatedAt: Date.now(),
  });
}

/** Pull all entries from backend subworks and sync local cache */
export async function syncSubworkEntriesFromServer(wid: string) {
  console.log("Starting sync of subwork entries from server...");
  wid = wid ?? "";
  const { token, role } = useAuthStore.getState();
  const authToken = token ?? "";
  const authRole = role ?? "";
  console.log("Fetching remote subworks...");
  const response = await listSubworks(authToken, authRole, wid);
  let remoteSubworks: RemoteSubwork[] = [];
  if (Array.isArray(response)) {
    remoteSubworks = response;
    console.log("Remote subworks fetched as array.");
  } else if (typeof response === 'string') {
    try {
      const parsed = JSON.parse(response);
      if (Array.isArray(parsed)) {
        remoteSubworks = parsed;
        console.log("Remote subworks parsed from JSON string.");
      } else {
        console.error("Parsed response is not an array:", parsed);
      }
    } catch (e) {
      console.error("Failed to parse response string:", e);
    }
  } else if (typeof response === 'object' && response !== null && Array.isArray((response as any).subworks)) {
    remoteSubworks = (response as any).subworks;
    console.log("Extracted remote subworks from response object.");
  } else {
    console.error("Unexpected response format for remoteSubworks:", response);
  }

  console.log("\n\n",Array.isArray(remoteSubworks), remoteSubworks.length)

  console.log("Fetching all local subwork entries...");
  const allLocal = await projectsDB.subworkEntries.toArray();
  console.log("Fetched local entries:", allLocal.length, "entries");

  // Collect all remote item backendIds
  console.log("Collecting remote item IDs...");
  const remoteItemIds = new Set<string>();
  for (const s of remoteSubworks) {
    const details: ItemPayload[] = Array.isArray(s.details) ? s.details : [];
    const deductions: ItemPayload[] = Array.isArray(s.deductions) ? s.deductions : [];
    console.log(`Subwork ${s.id}: ${details.length} details, ${deductions.length} deductions\n\n ${s}`);
    for (const it of [...details, ...deductions]) {
      const itemId = it.id ? String(it.id) : undefined;
      if (itemId) {
        remoteItemIds.add(itemId);
      }
    }
  }

  console.log("Processing remote subworks to create upsert entries...");
  const upsert = await Promise.all(remoteSubworks.map(async (remoteSubwork) => {
    const backendId = remoteSubwork.id;
    console.log(`Processing subwork ${backendId}...`);
    const localSubworkId = await getSubworkLocalIdFromBackendId(backendId);
    console.log(`Local subwork ID for ${backendId}: ${localSubworkId}`);
    const details: ItemPayload[] = Array.isArray(remoteSubwork.details) ? remoteSubwork.details : [];
    const deductions: ItemPayload[] = Array.isArray(remoteSubwork.deductions) ? remoteSubwork.deductions : [];

    const items = [
      ...details.map(it => ({ ...it, kind: 'details' as const })),
      ...deductions.map(it => ({ ...it, kind: 'deductions' as const }))
    ];
    console.log(`Total items for subwork ${backendId}: ${items.length}`);

    return items.map(it => {
      const itemId = it.id ? String(it.id) : undefined;
      const existing = itemId
        ? allLocal.find((e) => e.backendId === itemId && e.subworkBackendId === backendId)
        : undefined;
      console.log(`Item ${itemId}: existing local entry? ${!!existing}`);
      return {
        id: numericId(),
        backendId: itemId,
        subworkBackendId: backendId,
        subworkLocalId: localSubworkId,
        kind: it.kind,
        name: String(it.name ?? ""),
        number: Number(it.number ?? 0),
        length: Number(it.length ?? 0),
        breadth: Number(it.breadth ?? 0),
        depth: Number(it.depth ?? 0),
        quantity: Number(it.quantity ?? 0),
        rate: Number((it as any).rate ?? 0),
        createSynced: true,
        total: Number((it as any).total ?? 0),
        unit: (it as any).unit === "CFT" ? "CFT" :  "SFT" ,
        defaultRate: Number((it as any).defaultRate ?? 0),
        synced: true,
        operation: "update",
        updatedAt: Date.now(),
        deleted: false,
      } as SubworkEntryRecord;
    });
  }));

  const flatUpsert = upsert.flat();
  console.log("Flattened upsert entries:", flatUpsert.length, "entries");

  // console.log("Bulk updating subwork entries from server, total items:", flatUpsert.length, flatUpsert);
  if (flatUpsert.length) {
    console.log("Clearing local subwork entries table...");
    await projectsDB.subworkEntries.clear();
    console.log("Bulk putting upsert entries...");
    await projectsDB.subworkEntries.bulkPut(flatUpsert);
    console.log("Bulk put completed.");
  } else {
    console.log("No entries to upsert.");
  }

  // Delete local synced entries not present on server
  console.log("Checking for local entries to delete...");
  let deletedCount = 0;
  for (const local of allLocal) {
    // console.log("Checking local entry for deletion:", local);
    if (local.synced && local.backendId && !remoteItemIds.has(local.backendId)) {
      console.log(`Deleting local entry ${local.id} (backendId: ${local.backendId})`);
      await projectsDB.subworkEntries.delete(local.id!);
      deletedCount++;
    }
  }
  console.log(`Deleted ${deletedCount} local entries not present on server.`);
  console.log("Sync of subwork entries from server completed.");
}

/** Push local changes (create/update/delete) to backend for all subworks */
export async function syncSubworkEntriesToServer() {
  const { token, role } = useAuthStore.getState();
  const authToken = token ?? "";
  const authRole = role ?? "";
  const all = await projectsDB.subworkEntries.toArray();

  const toCreate = all.filter((e) => !e.backendId && !e.deleted && e.synced === false && e.operation == "create" && e.createSynced === false);
  const toUpdate = all.filter((e) => e.backendId && !e.deleted && e.synced === false && e.operation == "update" && e.createSynced == true);
  const toDelete = all.filter((e) => e.backendId && e.deleted && e.synced === false && e.operation == "delete" && e.createSynced == true);

  // sync the Unit and Default Rate  to server
//  const toUpdates = all.filter(
//   (e) =>{ 
//     if(e.backendId && !e.deleted && e.synced === false && e.operation == "update" && e.createSynced == true){
//       console.log(`${true} Bc`);
//     }else{
//       console.log(`${false} Bc`);
//     }
//     console.log("\n\nTo update subwork entries for unit and rate sync:", e);
//     console.log("bakendId",e.backendId,"Deleted:", !e.deleted, "Synced", e.synced, "Operation:", e.operation, "Create Synced:", e.createSynced);
//   });
  

  // create
  // console.log("To create subwork entries on backend:", toCreate);
  // console.log("To update subwork entries on backend:^^", toUpdate);
  // console.log("To delete subwork entries on backend:", toDelete);

  for (const e of toCreate) {
    if (!e.subworkBackendId) continue;
    try {
      const payload: ItemPayload = {
        name: e.name,
        length: e.length,
        breadth: e.breadth,
        depth: e.depth,
        quantity: e.quantity,
        number: e.number,
        rate: e.rate,
        total: e.total,
      } as any;
      const correspondingSubworkBackendID = await getSubworkBackendIdFromLocalId(e.subworkBackendId);
      // console.log("Corresponding subwork backend ID for local ID", e.subworkBackendId, "is", correspondingSubworkBackendID);
      if (!correspondingSubworkBackendID) continue;
      const created = await addItems(correspondingSubworkBackendID, e.kind, [payload], authToken, authRole);
      const createdItem = JSON.parse(created as unknown as string);
      // console.log("Created subwork entry on backend:", createdItem);
      // console.log("local ID", e);
      await projectsDB.subworkEntries.update(e.id!, {
        id: e.id,
        backendId: createdItem.items[0]?.id ? String(createdItem.items[0].id) : undefined,
        subworkLocalId: e.id,
        synced: true,
        createSynced: true,
        operation: "update",
        updatedAt: Date.now(),
      });

      // console.log("!!!@@@@@Synced created subwork entry to local DB:\n", await projectsDB.subworkEntries.get(e.id!));
    } catch (err) {
      console.error("Failed to create subwork entry on backend:", err);
    }
  }

  // update
  for (const e of toUpdate) {
    if (!e.subworkBackendId || !e.backendId) continue;
    try {
      const payload: ItemPayload = {
        name: e.name,
        length: e.length,
        breadth: e.breadth,
        depth: e.depth,
        quantity: e.quantity,
        number: e.number,
        rate: e.rate,
        total: e.total,
      } as any;
      const sbid = await getSubworkValue(e.subworkBackendId,"backendId");
      // console.log("Updating subwork entry on backend. Subwork backend ID:", sbid, "Item backend ID:", e.backendId, "Payload:", e.subworkBackendId);
      await updateItem(sbid,e.backendId,  e.kind, payload, authToken, authRole);
      await projectsDB.subworkEntries.update(e.id!, {
        backendId: e.backendId,
        synced: true,
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.error("Failed to update subwork entry on backend:", err);
    }
  }

  // delete
  for (const e of toDelete) {
    if (!e.subworkBackendId || !e.backendId) continue;
    try {
      const subbackendId = await getSubworkBackendIdFromLocalId(e.subworkBackendId);
      const deleteResponse = await deleteItem(String(subbackendId), e.backendId, e.kind, authToken, authRole);
      if (!deleteResponse) {
        continue;
      } await projectsDB.subworkEntries.delete(e.id!);
    } catch (err) {
      console.error("Failed to delete subwork entry on backend:", e.backendId, err);
    }
  }
}

export async function syncUnitsToServer(wid: string) {
  if (!navigator.onLine) return;
  let UnitAndRateSyncJson = {
    "CFT": 0,
    "SFT": 0
  }
  const subwork = await projectsDB.subworks.where("id").equals(wid).first();
  // console.log("Fetched subwork for unit and rate sync:", subwork, wid);
  if (subwork && subwork.unit && subwork.defaultRate !== undefined) {
    console.log("Subwork to update units and rates on server:", subwork);
    switch (subwork.unit) {
      case "CFT":
        UnitAndRateSyncJson.CFT = subwork.defaultRate;
        break;
      case "SFT":
        UnitAndRateSyncJson.SFT = subwork.defaultRate;
        break;
      default:
        break;
    }
    console.log("Unit and Rate payload to sync to server:", UnitAndRateSyncJson);
    // TODO: Add the API call to update the server with UnitAndRateSyncJson
  }
}

export async function fullSubworkEntriesSync(wid: string) {
  if (!navigator.onLine) return;
  await syncSubworkEntriesToServer();
  await syncSubworkEntriesFromServer(wid);
  await syncUnitsToServer(wid);
}
export async function getSubworkEntryValue(id: string, variableName: string): Promise<any> {
  const entry = await projectsDB.subworkEntries.get(id);

  if (!entry) return undefined;
  return (entry as any)[variableName];
}