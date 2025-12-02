import type { ChangeEvent } from "react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui";
import type { ItemPayload } from "@/services/api/subwork";
import { listSubworks } from "@/services/api/subwork";
import {
  getLocalEntriesForSubwork,
  fullSubworkEntriesSync,
  addLocalEntry,
  updateLocalEntry,
  markEntryDeletedLocal,
} from "@/services/dbservices/subworkEntryLocal";

interface Row extends ItemPayload {
  id: string;
  localId?: number; // Dexie id for offline persistence
  number?: number;
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

  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (!subworkId) return;
      // get subwork name from backend once
      const all = await listSubworks();
      const subwork = all.find((s) => s.id === subworkId);
      if (!subwork || cancelled) return;
      setSubworkName(subwork.name as string);

      // load entries from Dexie
      const localAdd = await getLocalEntriesForSubwork({ backendId: subworkId }, "details");
      const localDed = await getLocalEntriesForSubwork({ backendId: subworkId }, "deductions");

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

      const recalcedAdd = recalculateRows(mappedAdditions, unit, ratePerUnit, "additions");
      const recalcedDed = recalculateRows(mappedDeductions, unit, ratePerUnit, "deductions");
      if (!cancelled) {
        setAdditions(recalcedAdd);
        setDeductions(recalcedDed);
      }

      // if online, sync entries then reload
      if (navigator.onLine) {
        await fullSubworkEntriesSync();
        const syncedAdd = await getLocalEntriesForSubwork({ backendId: subworkId }, "details");
        const syncedDed = await getLocalEntriesForSubwork({ backendId: subworkId }, "deductions");
        if (!cancelled) {
          setAdditions(
            recalculateRows(
              syncedAdd.map((e) => ({
                id: String(e.id ?? e.backendId ?? ""),
                localId: e.id,
                name: e.name,
                number: e.number,
                length: e.length,
                breadth: e.breadth,
                depth: e.depth,
                quantity: e.quantity,
                total: e.total,
              })),
              unit,
              ratePerUnit,
              "additions",
            ),
          );
          setDeductions(
            recalculateRows(
              syncedDed.map((e) => ({
                id: String(e.id ?? e.backendId ?? ""),
                localId: e.id,
                name: e.name,
                number: e.number,
                length: e.length,
                breadth: e.breadth,
                depth: e.depth,
                quantity: e.quantity,
                total: e.total,
              })),
              unit,
              ratePerUnit,
              "deductions",
            ),
          );
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [subworkId]);

  useEffect(() => {
    setAdditions((prev) => recalculateRows(prev, unit, ratePerUnit, "additions"));
    setDeductions((prev) => recalculateRows(prev, unit, ratePerUnit, "deductions"));
  }, [unit, ratePerUnit]);

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
      const base: Omit<import("@/db/projectsDB").SubworkEntryRecord, "id" | "synced" | "updatedAt" | "backendId"> = {
        subworkBackendId: subworkId,
        subworkLocalId: undefined,
        kind: kindKey,
        name: "",
        number: 1,
        length: 0,
        breadth: 0,
        depth: 0,
        quantity: 0,
        rate: ratePerUnit,
        total: 0,
        deleted: false,
      };
      const nowId = await addLocalEntry(base as any);
      // patch the just-created row with its Dexie id so future edits/deletes persist
      const updater = (rows: Row[]): Row[] =>
        rows.map((r) => (r.id === tempId ? { ...r, localId: nowId as number } : r));
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
      return recalculateRows(
        rows.map((row) => {
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
        }),
        unit,
        ratePerUnit,
        kind,
      );
    };

    if (type === "details") {
      setAdditions((prev) => {
        const updatedRows = updater(prev, "additions");
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
            },
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
            },
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Subwork details {subworkName ? `- ${subworkName}` : ""}</h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Track additions and deductions for this subwork.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[11px]">
              <span>Unit</span>
              <select
                className="h-8 rounded-md border border-slate-200/80 bg-white px-2 text-[11px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-white/10 dark:bg-slate-900"
                value={unit}
                onChange={(e) => setUnit(e.target.value as "SFT" | "CFT")}
              >
                <option value="SFT">SFT</option>
                <option value="CFT">CFT</option>
              </select>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span>Rate / {unit}</span>
              <input
                className="h-8 w-24 rounded-md border border-slate-200/80 bg-white px-2 text-[11px] outline-none ring-0 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-white/10 dark:bg-slate-900 dark:placeholder:text-slate-500"
                placeholder="0"
                value={ratePerUnit || ""}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const n = parseFloat(e.target.value);
                  setRatePerUnit(Number.isNaN(n) ? 0 : n);
                }}
              />
            </div>
            <Button className="h-8 px-3 text-xs" onClick={() => handleAddRow("details")}>
              Add addition
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
        <div className="mt-6 flex justify-end">
          <div className="rounded-lg border border-slate-200/80 bg-white px-4 py-3 text-[11px] dark:border-white/10 dark:bg-slate-900/70">
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
