import { projectsDB, type SubworkEntryRecord } from "@/db/projectsDB";
import { addItems, deleteItem, listSubworks, updateItem, type ItemPayload } from "@/services/api/subwork";
import { useAuthStore } from "@/zustand/useAuthStore";
import { getSubworkBackendIdFromLocalId } from "./subworkLocal";

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
  entry: Omit<SubworkEntryRecord, "id" | "synced" | "updatedAt" | "backendId">,
) {
  const now = Date.now();
  // Dexie add() returns the generated primary key (id)
  return projectsDB.subworkEntries.add({ ...entry, synced: false, updatedAt: now });
}

export async function updateLocalEntry(record: SubworkEntryRecord, updates: Partial<SubworkEntryRecord>) {
  if (!record.id) return;
  const now = Date.now();
  // console.log("Updating local subwork entry ID", record.id, "with updates:", record.synced);
  const syn = await getSubworkEntryValue(Number(record.id),"synced")
  // console.log("Synced value is:", syn);
  await projectsDB.subworkEntries.update(record.id, {
    ...record,
    ...updates,
    synced: false,
    operation: syn?"update":"create",
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
  // console.log("Starting sync of subwork entries from server...");
  // if(!navigator.onLine) return;
  wid = wid ?? "";
  // console.log("Syncing subwork entries for subwork backend ID:", wid);
  const { token, role } = useAuthStore.getState();
  const authToken = token ?? "";
  const authRole = role ?? "";
  const remoteSubworks = await listSubworks(authToken, authRole);
  // Build a map of existing local entries to keep relationship between backendId and local id
  const allLocal = await projectsDB.subworkEntries.toArray();
  // console.log("Fetched subworks from Server:", JSON.parse(remoteSubworks.toString())[0]);
  console.log("Fetched subworks from Local:", allLocal);
  
  
  // Collect all remote item backendIds

    const remoteItemIds = new Set<string>();
    const jsonRemoteData = JSON.parse(remoteSubworks.toString());
    for (const s of jsonRemoteData as any[]) {
      const details: ItemPayload[] = (s.details as ItemPayload[] | undefined) ?? [];
      const deductions: ItemPayload[] = (s.deductions as ItemPayload[] | undefined) ?? [];
      for (const it of [...details, ...deductions]) {
        const itemId = (it as any).id ? String((it as any).id) : undefined;
        if (itemId) {
          remoteItemIds.add(itemId);
        }
      }
    }
    // console.log("Remote item backend IDs from server:", remoteItemIds);
  

  const bulk: SubworkEntryRecord[] = [];
// console.log("Remote subworks fetched from server:", remoteSubworks);
// console.log("Remote subworks fetched from server:", remoteSubworks);
  for (const s of jsonRemoteData as any[]) {
    const backendId = String(s.id);
    const details: ItemPayload[] = (s.details as ItemPayload[] | undefined) ?? [];
    // console.log("Details items for subwork", details, ": ");
    const deductions: ItemPayload[] = (s.deductions as ItemPayload[] | undefined) ?? [];
    // console.log(`Processing subwork ${backendId}: details=${details.length}, deductions=${deductions.length}`);

    const pushItems = async (items: ItemPayload[], kind: "details" | "deductions") => {
      // console.log(`Processing ${kind} for subwork ${backendId}: ${items.length} items`);
      if (items.length > 0) {
        // console.log("First item in array:", items[0]);
      }
      for (const it of items) {
        const itemId = (it as any).id ? String((it as any).id) : undefined;
        const existing = itemId
          ? allLocal.find((e) => Number(e.backendId) === Number(itemId) /*&& e.subworkBackendId === backendId*/)
          : undefined;
          // allLocal.find((e) =>{ 
          //     console.log("Comparing local entry  Ebackend ID", e.backendId, "with item ID", itemId, "and subwork backend ID", backendId);
          // })
          console.log("Existing local entry for item ID", itemId, "and subwork backend ID", backendId, "is:", existing);
        // allLocal.find((e) => Number(e.backendId) === Number(itemId) && e.subworkBackendId === backendId)
      // console.log("Syncing subwork entry from server. Subwork backend ID:", backendId, "Item backend ID:", itemId, "Existing local entry:", existing);
        const base: SubworkEntryRecord = {
          id: existing?.id,
          backendId: itemId,
          subworkBackendId: wid,
          subworkLocalId: undefined,
          kind,
          name: String((it as any).name ?? ""),
          number: Number((it as any).number ?? 0),
          length: Number((it as any).length ?? 0),
          breadth: Number((it as any).breadth ?? 0),
          depth: Number((it as any).depth ?? 0),
          quantity: Number((it as any).quantity ?? 0),
          rate: Number((it as any).rate ?? 0),
          createSynced: true,
          total: Number((it as any).total ?? 0),
          unit: (it as any).unit === "CFT" ? "CFT" : (it as any).unit === "SFT" ? "SFT" : undefined,
          defaultRate: Number((it as any).defaultRate ?? 0),
          synced: true,
          operation:"update",
          updatedAt: Date.now(),
          deleted: false,
        };
        // console.log("Prepared subwork entry for bulk put:", base);
        bulk.push(base);
      }
    };
    console.log(`Pushing items for subwork backend ID: ${backendId} for details `, details);
    console.log(`Pushing items for subwork backend ID: ${backendId} for deductions}`, deductions);

    pushItems(details, "details");
    pushItems(deductions, "deductions");
  }

  // console.log("Bulk updating subwork entries from server, total items:", bulk.length, bulk);
  if (bulk.length) {
  await projectsDB.subworkEntries.clear();
    await projectsDB.subworkEntries.bulkPut(bulk);
  }

  // Delete local synced entries not present on server
  for (const local of allLocal) {
    console.log("Checking local entry for deletion:", local);
    if (local.synced && local.backendId && !remoteItemIds.has(local.backendId)) {
      await projectsDB.subworkEntries.delete(local.id!);
    }
  }
}

/** Push local changes (create/update/delete) to backend for all subworks */
export async function syncSubworkEntriesToServer() {
  const { token, role } = useAuthStore.getState();
  const authToken = token ?? "";
  const authRole = role ?? "";
  const all = await projectsDB.subworkEntries.toArray();

  const toCreate = all.filter((e) => !e.backendId && !e.deleted && e.synced === false &&e.operation=="create" && e.createSynced===false);
  const toUpdate = all.filter((e) => e.backendId && !e.deleted && e.synced === false && e.operation=="update"&& e.createSynced==true);
  const toDelete = all.filter((e) => e.backendId && e.deleted && e.synced === false && e.operation=="delete"&& e.createSynced==true);

  // create
  // console.log("To create subwork entries on backend:", toCreate);
  // console.log("To update subwork entries on backend:", toUpdate);
  console.log("To delete subwork entries on backend:", toDelete);

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
      const correspondingSubworkBackendID = await getSubworkBackendIdFromLocalId(Number(e.subworkBackendId ));
      // console.log("Corresponding subwork backend ID for local ID", e.subworkBackendId, "is", correspondingSubworkBackendID);
      if (!correspondingSubworkBackendID) continue;
      const created = await addItems(correspondingSubworkBackendID, e.kind, [payload], authToken, authRole);
      const createdItem = JSON.parse(created as unknown as string); 
      // console.log("Created subwork entry on backend:", createdItem);
      console.log("local ID", e.id);
      await projectsDB.subworkEntries.update(e.id!, {
        backendId: createdItem.items[0]?.id ? String(createdItem.items[0].id) : undefined,
        subworkLocalId:e.id,
        synced: true,
        updatedAt: Date.now(),
      });
    } catch(err) {
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
      await updateItem(e.subworkBackendId, e.backendId, e.kind, payload, authToken, authRole);
      await projectsDB.subworkEntries.update(e.id!, {
        synced: true,
        updatedAt: Date.now(),
      });
    } catch {
      // keep unsynced
    }
  }

  // delete
  for (const e of toDelete) {
    console.log("[Enter Delete] Deleting local subwork entry ID:", e.id, "with backend ID:", e.backendId);
    if (!e.subworkBackendId || !e.backendId) continue;
    try {
      const subbackendId = await getSubworkBackendIdFromLocalId(Number((e.subworkBackendId)));
      console.log("Deleting subwork entry on backend:", e.backendId, "for subwork backend ID:", subbackendId);
      const deleteResponse = await deleteItem(String(subbackendId), e.backendId, e.kind, authToken, authRole);
      if (!deleteResponse){
        console.log("Delete response falsy, skipping local deletion for entry ID:", e.id);
        continue;
      } await projectsDB.subworkEntries.delete(e.id!);
    } catch (err) {
      console.error("Failed to delete subwork entry on backend:", e.backendId, err);
    }
  } 
}

export async function fullSubworkEntriesSync(wid: string) {
  if (!navigator.onLine) return;
  await syncSubworkEntriesToServer();
  await syncSubworkEntriesFromServer(wid);
}
export async function getSubworkEntryValue(id: number, variableName: string): Promise<any> {
  const entry = await projectsDB.subworkEntries.get(id);

  if (!entry) return undefined;
  return (entry as any)[variableName];
}