import type { ChangeEvent } from "react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { RefreshCw, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui";
import type { ItemPayload } from "@/services/api/subwork";
import { listSubworks } from "@/services/api/subwork";
import { projectsDB } from "@/db/projectsDB";
import { updateLocalSubwork } from "@/services/dbservices/subworkLocal";
import {
  getLocalEntriesForSubwork,
  fullSubworkEntriesSync,
  addLocalEntry,
  updateLocalEntry,
  markEntryDeletedLocal,
} from "@/services/dbservices/subworkEntryLocal";
import { useAuthStore } from "@/zustand/useAuthStore";
import { numericId } from "@/utils/randomId";

interface Row extends ItemPayload {
  id: string;
  localId?: string; // Dexie id for offline persistence
  number: number;
  length?: number;
  breadth?: number;
  depth?: number;
  quantity?: number;
  total?: number;
}

export default function SubworkDetails() {
  const { subworkId } = useParams();
  const [additions, setAdditions] = useState<Row[]>([]);
  const [deductions, setDeductions] = useState<Row[]>([]);
  const [subworkName, setSubworkName] = useState<string>("");
  const [unit, setUnit] = useState<"SFT" | "CFT">("SFT");
  const [ratePerUnit, setRatePerUnit] = useState<number>(0);

  const [additionsTotal, setAdditionsTotal] = useState<number>(0);
  const [deductionsTotal, setDeductionsTotal] = useState<number>(0);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced">("idle");
  const { token, role } = useAuthStore.getState();

  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (!subworkId) return;
      // try to get subwork name from backend once, but don't block local loading if it fails
      try {

        const all = await listSubworks(token ? token : "", role ? role : "");
        const subwork = all.find((s) => s.id === subworkId);
        if (subwork && !cancelled) {
          setSubworkName(subwork.name as string);
        }
      } catch {
        // ignore network / API errors here; we can still work with local data
      }

      // read subwork settings from Dexie subworks table (per-subwork settings)
     /* if (!cancelled) {
        let localSubwork = await projectsDB.subworks
          .where("id")
          .equals(subworkId)
          .first();
        if (!localSubwork) {
          const id = await projectsDB.subworks.add({
            backendId: undefined,
            workBackendId: undefined,
            workLocalId: undefined,
            name: subworkName || "",
            description: undefined,
            unit: undefined,
            // id: subworkId,
            defaultRate: undefined,
            synced: false,
            updatedAt: Date.now(),
            deleted: false,
          });
          localSubwork = await projectsDB.subworks.get(id!);
        }

        if (localSubwork?.unit === "SFT" || localSubwork?.unit === "CFT") {
          setUnit(localSubwork.unit);
        }
        if (typeof localSubwork?.defaultRate === "number") {
          setRatePerUnit(localSubwork.defaultRate);
        }
      }
      */
      // always load entries from Dexie so data is available offline
      // console.log("Loading local entries for subwork:$$$$$$$$$$", subworkId);
      const localAdd = await getLocalEntriesForSubwork({ backendId: subworkId,localId:Number(subworkId) }, "details");
      const localDed = await getLocalEntriesForSubwork({ backendId: subworkId,localId:Number(subworkId) }, "deductions");
      // console.log("Local additions:", localAdd);
      // console.log("Local deductions:", localDed);
      const mappedAdditions: Row[] = localAdd.map((e) => ({
        id: String(e.id ?? e.backendId ?? ""),
        localId: e.id,
        name: e.name,
        number: e.number,
        length: e.length,
        breadth: e.breadth,
        depth: e.depth,
        quantity: e.quantity,
        total: e.total,
      }));

      const mappedDeductions: Row[] = localDed.map((e) => ({
        id: String(e.id ?? e.backendId ?? ""),
        localId: e.id,
        name: e.name,
        number: e.number,
        length: e.length,
        breadth: e.breadth,
        depth: e.depth,
        quantity: e.quantity,
        total: e.total,
      }));

      // initialize rows and totals directly from stored Dexie values
      if (!cancelled) {
        setAdditions(mappedAdditions);
        setDeductions(mappedDeductions);

        const addTotal = mappedAdditions.reduce(
          (sum, r) => sum + (r.total ?? 0),
          0,
        );
        const dedTotal = mappedDeductions.reduce(
          (sum, r) => sum + (r.total ?? 0),
          0,
        );
        setAdditionsTotal(addTotal);
        setDeductionsTotal(dedTotal);
      }

      if(!cancelled){
        const localSubwork = await projectsDB.subworks
          .where("id")
          .equals(subworkId)
          .first();
        if (localSubwork) {
          setRatePerUnit(localSubwork.defaultRate ?? 0);
          console.log("Local subwork unit: %%", localSubwork.unit);
          setUnit(localSubwork.unit ? localSubwork.unit:"SFT");
        }
      }

      // if online, sync entries then reload
      /*if (navigator.onLine) {
        await fullSubworkEntriesSync();
        const syncedAdd = await getLocalEntriesForSubwork({ backendId: subworkId }, "details");
        const syncedDed = await getLocalEntriesForSubwork({ backendId: subworkId }, "deductions");
        if (!cancelled) {
          const syncedAddRows: Row[] = syncedAdd.map((e) => ({
            id: String(e.id ?? e.backendId ?? ""),
            localId: e.id,
            name: e.name,
            number: e.number,
            length: e.length,
            breadth: e.breadth,
            depth: e.depth,
            quantity: e.quantity,
            total: e.total,
          }));
          const syncedDedRows: Row[] = syncedDed.map((e) => ({
            id: String(e.id ?? e.backendId ?? ""),
            localId: e.id,
            name: e.name,
            number: e.number,
            length: e.length,
            breadth: e.breadth,
            depth: e.depth,
            quantity: e.quantity,
            total: e.total,
          }));

          setAdditions(syncedAddRows);
          setDeductions(syncedDedRows);

          const addTotal = syncedAddRows.reduce(
            (sum, r) => sum + (r.total ?? 0),
            0,
          );
          const dedTotal = syncedDedRows.reduce(
            (sum, r) => sum + (r.total ?? 0),
            0,
          );
          setAdditionsTotal(addTotal);
          setDeductionsTotal(dedTotal);
        }
      }*/
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [subworkId]);

  // totals are initialized from Dexie and updated when rows change;
  // we no longer recompute all rows on every unit/rate change

  const handleAddRow = (type: "details" | "deductions") => {
    const makeBaseRow = (id: string): Row => ({
      id,
      localId: undefined,
      name: "",
      number: 1,
      length: 0,
      breadth: 0,
      depth: 0,
    });

    const createLocal = async (tempId: string) => {
      if (!subworkId) return;
      const kindKey = type;
      const base: Omit<
        import("@/db/projectsDB").SubworkEntryRecord,
         "synced" | "updatedAt"
      > = {
        id:numericId(),
        subworkBackendId: subworkId,
        subworkLocalId: undefined,
        backendId: undefined,
        kind: kindKey,
        name: "",
        number: 1,
        length: 0,
        breadth: 0,
        depth: 0,
        quantity: 0,
        rate: ratePerUnit,
        total: 0,
        unit,
        deleted: false,
        operation: "create",
        createSynced: false,
      };
      const nowId = await addLocalEntry(base);
      // patch the just-created row with its Dexie id so future edits/deletes persist
      const updater = (rows: Row[]): Row[] =>
        rows.map((r) => (r.id === tempId ? { ...r, localId: nowId as string } : r));
      if (type === "details") {
        setAdditions((prev) => updater(prev));
      } else {
        setDeductions((prev) => updater(prev));
      }
    };

    if (type === "details") {
      setAdditions((prev) => {
        const tempId = `local-${Date.now()}-${prev.length + 1}`;
        const next = [...prev, recalculateRow(makeBaseRow(tempId), unit, ratePerUnit)];
        void createLocal(tempId);
        return next;
      });
    } else {
      setDeductions((prev) => {
        const tempId = `local-${Date.now()}-${prev.length + 1}`;
        const next = [...prev, recalculateRow(makeBaseRow(tempId), unit, ratePerUnit)];
        void createLocal(tempId);
        return next;
      });
    }
  };

  const handleRowChange = (
    type: "details" | "deductions",
    id: string,
    field: keyof Row,
    value: string,
  ) => {
    const parseNum = (v: string) => {
      const n = parseFloat(v);
      return Number.isNaN(n) ? 0 : n;
    };

    const updater = (rows: Row[], kind: "additions" | "deductions"): Row[] => {
      const updatedRows = rows.map((row) => {
        if (row.id !== id) return row;
        if (field === "name") {
          return { ...row, name: value };
        }
        if (field === "number") {
          return { ...row, number: parseNum(value) };
        }
        if (field === "length") {
          return { ...row, length: parseNum(value) };
        }
        if (field === "breadth") {
          return { ...row, breadth: parseNum(value) };
        }
        if (field === "depth") {
          return { ...row, depth: parseNum(value) };
        }
        return row;
      });
      // use the latest unit and ratePerUnit when recalculating
      return recalculateRows(updatedRows, unit, ratePerUnit, kind);
    };

    if (type === "details") {
      setAdditions((prev) => {
        const updatedRows = updater(prev, "additions");
        const updated = updatedRows.find((r) => r.id === id);
        console.log("Updated row after change:", updated, updated?.synced);
        if (updated && updated.localId != null) {
          console.log("Persisting updated local entry:", updated);
          void updateLocalEntry(
            { id: updated.localId } as any,
            {
              name: updated.name as any,
              number: updated.number,
              length: updated.length,
              breadth: updated.breadth,
              depth: updated.depth,
              quantity: updated.quantity,
              total: updated.total,
              rate: ratePerUnit,
            } as any,
          );
        }
        return updatedRows;
      });
    } else {
      setDeductions((prev) => {
        const updatedRows = updater(prev, "deductions");
        const updated = updatedRows.find((r) => r.id === id);
        if (updated && updated.localId != null) {
          void updateLocalEntry(
            { id: updated.localId } as any,
            {
              name: updated.name as any,
              number: updated.number,
              length: updated.length,
              breadth: updated.breadth,
              depth: updated.depth,
              quantity: updated.quantity,
              total: updated.total,
              rate: ratePerUnit,
            } as any,
          );
        }
        return updatedRows;
      });
    }
  };

  const handleRemoveRow = (type: "details" | "deductions", id: string) => {
    if (type === "details") {
      setAdditions((prev) =>
        recalculateRows(prev.filter((r) => r.id !== id), unit, ratePerUnit, "additions"),
      );
      const row = additions.find((r) => r.id === id);
      if (row && row.localId != null) {
        void markEntryDeletedLocal({ id: row.localId } as any);
      }
    } else {
      setDeductions((prev) =>
        recalculateRows(prev.filter((r) => r.id !== id), unit, ratePerUnit, "deductions"),
      );
      const row = deductions.find((r) => r.id === id);
      if (row && row.localId != null) {
        void markEntryDeletedLocal({ id: row.localId } as any);
      }
    }
  };

  const recalculateTotals = (rows: Row[]): { rows: Row[]; total: number } => {
    let total = 0;
    const updated = rows.map((row) => {
      const quantity = row.quantity ?? 0;
      const rowTotal = row.total ?? 0;
      total += rowTotal;
      return { ...row, quantity, total: rowTotal };
    });
    return { rows: updated, total };
  };

  function recalculateRow(row: Row, unit: "SFT" | "CFT", rate: number): Row {
    const number = row.number ?? 0;
    const length = row.length ?? 0;
    const breadth = row.breadth ?? 0;
    const depth = row.depth ?? 0;

    let quantity = 0;
    if (unit === "SFT") {
      quantity = length * breadth * number;
    } else {
      quantity = length * breadth * depth * number;
    }
    const total = quantity * (rate || 0);
    return { ...row, quantity, total };
  }

  function recalculateRows(
    rows: Row[],
    unit: "SFT" | "CFT",
    rate: number,
    kind: "additions" | "deductions",
  ): Row[] {
    const updated = rows.map((row) => recalculateRow(row, unit, rate));
    const { rows: withTotals, total } = recalculateTotals(updated);
    if (kind === "additions") {
      setAdditionsTotal(total);
    } else {
      setDeductionsTotal(total);
    }
    return withTotals;
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <div className="container mx-auto px-6 py-10">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Subwork details {subworkName ? `- ${subworkName}` : ""}</h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Track additions and deductions for this subwork.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-[11px]">
              <span>Unit</span>
              <select
                className="h-8 rounded-md border border-slate-200/80 bg-white px-2 text-[11px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-white/10 dark:bg-slate-900"
                value={unit}
                onChange={async (e) => {
                  const next = e.target.value as "SFT" | "CFT";
                  console.log("Changing unit to:", next, "Subwork ID", subworkId);
                  setUnit(next);
                  if (subworkId) {
                    const localSubwork = await projectsDB.subworks
                      .where("id")
                      .equals(subworkId)
                      .first();
                    if (localSubwork) {
                      await updateLocalSubwork(localSubwork, { unit: next });
                    }
                  }
                  // recalculate all rows and totals based on the new unit
                  setAdditions((prev) => recalculateRows(prev, next, ratePerUnit, "additions"));
                  setDeductions((prev) => recalculateRows(prev, next, ratePerUnit, "deductions"));
                }}
              >
                <option value="SFT">SFT</option>
                <option value="CFT">CFT</option>
              </select>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span>Rate / {unit}</span>
              <input
                type="number"
                step="any"
                className="h-8 w-24 rounded-md border border-slate-200/80 bg-white px-2 text-[11px] outline-none ring-0 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-white/10 dark:bg-slate-900 dark:placeholder:text-slate-500"
                placeholder="0"
                value={ratePerUnit || ""}
                onChange={async (e: ChangeEvent<HTMLInputElement>) => {
                  // Accept and store float values for Rate/unit
                  const n = parseFloat(e.target.value);
                  const next = Number.isNaN(n) ? 0 : n; // next can be a float
                  setRatePerUnit(next);
                  // persist default rate for this subwork
                  if (subworkId) {
                    const localSubwork = await projectsDB.subworks
                      .where("id")
                      .equals(subworkId)
                      .first();
                    if (localSubwork) {
                      await updateLocalSubwork(localSubwork, { defaultRate: next });
                    }
                  }
                  // recalculate all rows and totals based on the new rate
                  setAdditions((prev) => recalculateRows(prev, unit, next, "additions"));
                  setDeductions((prev) => recalculateRows(prev, unit, next, "deductions"));
                }}
              />
            </div>
            {/* <Button className="h-8 px-3 text-xs" onClick={() => handleAddRow("details")}>
              Add addition
            </Button> */}
            <Button
              className="h-8 px-3 text-xs"
              onClick={async () => {
                setSyncStatus("syncing");
                try {
                  await fullSubworkEntriesSync(subworkId ?? "");
                  setSyncStatus("synced");  
                  setTimeout(() => setSyncStatus("idle"), 3000);
                } catch {
                  setSyncStatus("idle");
                }
              }}
              disabled={syncStatus === "syncing" || syncStatus === "synced"}
            >
              {syncStatus === "syncing" ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : syncStatus === "synced" ? (
                <CheckCircle className="w-4 h-4 mr-1" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-1" />
              )}
              {syncStatus === "syncing" ? "Syncing..." : syncStatus === "synced" ? "Synced" : "Sync"}
            </Button>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white dark:border-white/10 dark:bg-slate-950/80">
            <div className="flex items-center justify-between px-4 py-2 text-[11px] font-semibold">
              <span>Additions</span>
              <Button size="sm" className="h-7 px-2 text-[10px]" onClick={() => handleAddRow("details")}>
                Add row
              </Button>
            </div>
            <div className="w-full overflow-x-auto">
              <table className="min-w-full text-left text-[11px]">
                <thead className="bg-slate-100 text-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
                  <tr>
                    <th className="px-4 py-2">S. No</th>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Number</th>
                    <th className="px-4 py-2">Length</th>
                    <th className="px-4 py-2">Breadth</th>
                    <th className="px-4 py-2">Depth</th>
                    <th className="px-4 py-2">Quantity</th>
                    <th className="px-4 py-2">Total (Rs)</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {additions.map((row, index) => (
                    <tr key={row.id} className="border-t border-slate-100 dark:border-white/5">
                      <td className="px-4 py-2 align-top text-slate-700 dark:text-slate-300">{index + 1}</td>
                      <td className="px-4 py-2 align-top">
                        <input
                          className="h-8 w-full rounded-md border border-slate-200/80 bg-white px-2 text-[11px] outline-none ring-0 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-white/10 dark:bg-slate-900 dark:placeholder:text-slate-500"
                          placeholder="Name (optional)"
                          value={String(row.name ?? "")}
                          onChange={(e) => handleRowChange("details", row.id, "name", e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-2 align-top">
                        <input
                          className="h-8 w-16 rounded-md border border-slate-200/80 bg-white px-2 text-[11px] outline-none ring-0 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-white/10 dark:bg-slate-900 dark:placeholder:text-slate-500"
                          placeholder="0"
                          value={row.number != null ? String(row.number) : ""}
                          onChange={(e) => handleRowChange("details", row.id, "number", e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-2 align-top">
                        <input
                          className="h-8 w-20 rounded-md border border-slate-200/80 bg-white px-2 text-[11px] outline-none ring-0 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-white/10 dark:bg-slate-900 dark:placeholder:text-slate-500"
                          placeholder="0"
                          value={row.length != null ? String(row.length) : ""}
                          onChange={(e) => handleRowChange("details", row.id, "length", e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-2 align-top">
                        <input
                          className="h-8 w-20 rounded-md border border-slate-200/80 bg-white px-2 text-[11px] outline-none ring-0 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-white/10 dark:bg-slate-900 dark:placeholder:text-slate-500"
                          placeholder="0"
                          value={row.breadth != null ? String(row.breadth) : ""}
                          onChange={(e) => handleRowChange("details", row.id, "breadth", e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-2 align-top">
                        <input
                          className="h-8 w-20 rounded-md border border-slate-200/80 bg-white px-2 text-[11px] outline-none ring-0 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-white/10 dark:bg-slate-900 dark:placeholder:text-slate-500"
                          placeholder="0"
                          value={row.depth != null ? String(row.depth) : ""}
                          onChange={(e) => handleRowChange("details", row.id, "depth", e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-2 align-top text-right text-slate-700 dark:text-slate-300">
                        {row.quantity != null ? row.quantity.toFixed(2) : "0.00"}
                      </td>
                      <td className="px-4 py-2 align-top text-right text-slate-700 dark:text-slate-300">
                        {row.total != null ? row.total.toFixed(2) : "0.00"}
                      </td>
                      <td className="px-4 py-2 align-top text-right">
                        <button
                          type="button"
                          className="text-[10px] text-red-500 hover:underline"
                          onClick={() => handleRemoveRow("details", row.id)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-slate-100 bg-slate-50 text-[11px] font-semibold dark:border-white/5 dark:bg-slate-900/60">
                    <td className="px-4 py-2" colSpan={7}>
                      Additions Total
                    </td>
                    <td className="px-4 py-2 text-right">{additionsTotal.toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white dark:border-white/10 dark:bg-slate-950/80">
            <div className="flex items-center justify-between px-4 py-2 text-[11px] font-semibold">
              <span>Deductions</span>
              <Button size="sm" className="h-7 px-2 text-[10px]" onClick={() => handleAddRow("deductions")}>
                Add row
              </Button>
            </div>
            <div className="w-full overflow-x-auto">
              <table className="min-w-full text-left text-[11px]">
                <thead className="bg-slate-100 text-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
                  <tr>
                    <th className="px-4 py-2">S. No</th>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Number</th>
                    <th className="px-4 py-2">Length</th>
                    <th className="px-4 py-2">Breadth</th>
                    <th className="px-4 py-2">Depth</th>
                    <th className="px-4 py-2">Quantity</th>
                    <th className="px-4 py-2">Total (Rs)</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {deductions.map((row, index) => (
                    <tr key={row.id} className="border-t border-slate-100 dark:border-white/5">
                      <td className="px-4 py-2 align-top text-slate-700 dark:text-slate-300">{index + 1}</td>
                      <td className="px-4 py-2 align-top">
                        <input
                          className="h-8 w-full rounded-md border border-slate-200/80 bg-white px-2 text-[11px] outline-none ring-0 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-white/10 dark:bg-slate-900 dark:placeholder:text-slate-500"
                          placeholder="Name (optional)"
                          value={String(row.name ?? "")}
                          onChange={(e) => handleRowChange("deductions", row.id, "name", e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-2 align-top">
                        <input
                          className="h-8 w-16 rounded-md border border-slate-200/80 bg-white px-2 text-[11px] outline-none ring-0 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-white/10 dark:bg-slate-900 dark:placeholder:text-slate-500"
                          placeholder="0"
                          value={row.number != null ? String(row.number) : ""}
                          onChange={(e) => handleRowChange("deductions", row.id, "number", e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-2 align-top">
                        <input
                          className="h-8 w-20 rounded-md border border-slate-200/80 bg-white px-2 text-[11px] outline-none ring-0 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-white/10 dark:bg-slate-900 dark:placeholder:text-slate-500"
                          placeholder="0"
                          value={row.length != null ? String(row.length) : ""}
                          onChange={(e) => handleRowChange("deductions", row.id, "length", e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-2 align-top">
                        <input
                          className="h-8 w-20 rounded-md border border-slate-200/80 bg-white px-2 text-[11px] outline-none ring-0 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-white/10 dark:bg-slate-900 dark:placeholder:text-slate-500"
                          placeholder="0"
                          value={row.breadth != null ? String(row.breadth) : ""}
                          onChange={(e) => handleRowChange("deductions", row.id, "breadth", e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-2 align-top">
                        <input
                          className="h-8 w-20 rounded-md border border-slate-200/80 bg-white px-2 text-[11px] outline-none ring-0 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-white/10 dark:bg-slate-900 dark:placeholder:text-slate-500"
                          placeholder="0"
                          value={row.depth != null ? String(row.depth) : ""}
                          onChange={(e) => handleRowChange("deductions", row.id, "depth", e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-2 align-top text-right text-slate-700 dark:text-slate-300">
                        {row.quantity != null ? row.quantity.toFixed(2) : "0.00"}
                      </td>
                      <td className="px-4 py-2 align-top text-right text-slate-700 dark:text-slate-300">
                        {row.total != null ? row.total.toFixed(2) : "0.00"}
                      </td>
                      <td className="px-4 py-2 align-top text-right">
                        <button
                          type="button"
                          className="text-[10px] text-red-500 hover:underline"
                          onClick={() => handleRemoveRow("deductions", row.id)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-slate-100 bg-slate-50 text-[11px] font-semibold dark:border-white/5 dark:bg-slate-900/60">
                    <td className="px-4 py-2" colSpan={7}>
                      Deductions Total
                    </td>
                    <td className="px-4 py-2 text-right">{deductionsTotal.toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-center md:justify-end">
          <div className="w-full max-w-sm rounded-lg border border-slate-200/80 bg-white px-4 py-3 text-[11px] dark:border-white/10 dark:bg-slate-900/70">
            <div className="flex justify-between gap-8">
              <span className="text-slate-600 dark:text-slate-300">Additions Total:</span>
              <span className="font-semibold">{additionsTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-8">
              <span className="text-slate-600 dark:text-slate-300">Deductions Total:</span>
              <span className="font-semibold">{deductionsTotal.toFixed(2)}</span>
            </div>
            <div className="mt-2 border-t border-slate-100 pt-2 dark:border-white/10">
              <div className="flex justify-between gap-8">
                <span className="text-slate-700 dark:text-slate-100">Net Total (Add - Ded):</span>
                <span className="text-sm font-bold">{(additionsTotal - deductionsTotal).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
