import { useState } from "react"
import { Button } from "@/components/ui"

interface Row {
  id: number
  description: string
  amount: string
  type: "addition" | "deduction"
}

export default function SubworkDetails() {
  const [rows, setRows] = useState<Row[]>([{
    id: 1,
    description: "Initial scope",
    amount: "1200",
    type: "addition",
  }])

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { id: prev.length + 1, description: "", amount: "", type: "addition" },
    ])
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <div className="container mx-auto px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Subwork details</h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Track additions and deductions for this subwork.</p>
          </div>
          <Button className="h-8 px-3 text-xs" onClick={addRow}>
            Add row
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white dark:border-white/10 dark:bg-slate-950/80">
          <table className="min-w-full text-left text-[11px]">
            <thead className="bg-slate-100 text-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
              <tr>
                <th className="px-4 py-2">S. No</th>
                <th className="px-4 py-2">Description</th>
                <th className="px-4 py-2">Amount</th>
                <th className="px-4 py-2">Type</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id} className="border-t border-slate-100 dark:border-white/5">
                  <td className="px-4 py-2 align-top text-slate-700 dark:text-slate-300">{index + 1}</td>
                  <td className="px-4 py-2 align-top">
                    <input
                      className="h-8 w-full rounded-md border border-slate-200/80 bg-white px-2 text-[11px] outline-none ring-0 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-white/10 dark:bg-slate-900 dark:placeholder:text-slate-500"
                      placeholder="Describe the item"
                    />
                  </td>
                  <td className="px-4 py-2 align-top">
                    <input
                      className="h-8 w-28 rounded-md border border-slate-200/80 bg-white px-2 text-[11px] outline-none ring-0 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-white/10 dark:bg-slate-900 dark:placeholder:text-slate-500"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="px-4 py-2 align-top">
                    <select
                      className="h-8 rounded-md border border-slate-200/80 bg-white px-2 text-[11px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-white/10 dark:bg-slate-900"
                      defaultValue={row.type}
                    >
                      <option value="addition">Addition</option>
                      <option value="deduction">Deduction</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
