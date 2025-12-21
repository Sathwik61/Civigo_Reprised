import { projectsDB, type SubworkEntryRecord } from "@/db/projectsDB";
import { addItems, deleteItem, listSubworks, updateItem, type ItemPayload } from "@/services/api/subwork";
import { useAuthStore } from "@/zustand/useAuthStore";

export async function getLocalEntriesForSubwork(
  subworkKey: { backendId?: string; localId?: number },
  kind: "details" | "deductions",
): Promise<SubworkEntryRecord[]> {
  return projectsDB.subworkEntries
    .filter((e) => (e.subworkBackendId === subworkKey.backendId || e.subworkLocalId === subworkKey.localId) && e.kind === kind && !e.deleted)
    .toArray();
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
  await projectsDB.subworkEntries.update(record.id, {
    ...record,
    ...updates,
    synced: false,
    updatedAt: now,
  });
}

export async function markEntryDeletedLocal(record: SubworkEntryRecord) {
  if (!record.id) return;
  await projectsDB.subworkEntries.update(record.id, {
    deleted: true,
    synced: false,
    updatedAt: Date.now(),
  });
}

/** Pull all entries from backend subworks and sync local cache */
export async function syncSubworkEntriesFromServer() {
  const { token, role } = useAuthStore.getState();
  const authToken = token ?? "";
  const authRole = role ?? "";
  const remoteSubworks = await listSubworks(authToken, authRole);

  // Build a map of existing local entries to keep relationship between backendId and local id
  const allLocal = await projectsDB.subworkEntries.toArray();

  // Collect all remote item backendIds
  const remoteItemIds = new Set<string>();
  for (const s of remoteSubworks as any[]) {
    const details: ItemPayload[] = (s.details as ItemPayload[] | undefined) ?? [];
    const deductions: ItemPayload[] = (s.deductions as ItemPayload[] | undefined) ?? [];
    for (const it of [...details, ...deductions]) {
      const itemId = (it as any).id ? String((it as any).id) : undefined;
      if (itemId) {
        remoteItemIds.add(itemId);
      }
    }
  }

  const bulk: SubworkEntryRecord[] = [];

  for (const s of remoteSubworks as any[]) {
    const backendId = String(s.id);
    const details: ItemPayload[] = (s.details as ItemPayload[] | undefined) ?? [];
    const deductions: ItemPayload[] = (s.deductions as ItemPayload[] | undefined) ?? [];

    const pushItems = (items: ItemPayload[], kind: "details" | "deductions") => {
      for (const it of items) {
        const itemId = (it as any).id ? String((it as any).id) : undefined;
        const existing = itemId
          ? allLocal.find((e) => e.backendId === itemId && e.subworkBackendId === backendId)
          : undefined;

        const base: SubworkEntryRecord = {
          id: existing?.id,
          backendId: itemId,
          subworkBackendId: backendId,
          subworkLocalId: undefined,
          kind,
          name: String((it as any).name ?? ""),
          number: Number((it as any).number ?? 0),
          length: Number((it as any).length ?? 0),
          breadth: Number((it as any).breadth ?? 0),
          depth: Number((it as any).depth ?? 0),
          quantity: Number((it as any).quantity ?? 0),
          rate: Number((it as any).rate ?? 0),
          total: Number((it as any).total ?? 0),
          unit: (it as any).unit === "CFT" ? "CFT" : (it as any).unit === "SFT" ? "SFT" : undefined,
          defaultRate: Number((it as any).defaultRate ?? 0),
          synced: true,
          updatedAt: Date.now(),
          deleted: false,
        };
        bulk.push(base);
      }
    };

    pushItems(details, "details");
    pushItems(deductions, "deductions");
  }

  if (bulk.length) {
    await projectsDB.subworkEntries.bulkPut(bulk);
  }

  // Delete local synced entries not present on server
  for (const local of allLocal) {
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

  const toCreate = all.filter((e) => !e.backendId && !e.deleted && e.synced === false);
  const toUpdate = all.filter((e) => e.backendId && !e.deleted && e.synced === false);
  const toDelete = all.filter((e) => e.backendId && e.deleted && e.synced === false);

  // create
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

      const created = await addItems(e.subworkBackendId, e.kind, [payload], authToken, authRole);
      const createdItem = created.items[0] as any;
      await projectsDB.subworkEntries.update(e.id!, {
        backendId: createdItem.id ? String(createdItem.id) : undefined,
        synced: true,
        updatedAt: Date.now(),
      });
    } catch {
      // keep unsynced
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
    if (!e.subworkBackendId || !e.backendId) continue;
    try {
      await deleteItem(e.subworkBackendId, e.backendId, e.kind, authToken, authRole);
      await projectsDB.subworkEntries.delete(e.id!);
    } catch (err) {
      console.error("Failed to delete subwork entry on backend:", e.backendId, err);
    }
  }
}

export async function fullSubworkEntriesSync() {
  if (!navigator.onLine) return;
  await syncSubworkEntriesToServer();
  await syncSubworkEntriesFromServer();
}
