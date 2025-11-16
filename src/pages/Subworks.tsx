import { Link, useParams } from "react-router-dom"
import { Button } from "@/components/ui"

const mockSubworks = [
  { id: "100", name: "Rebar & Steel" },
  { id: "101", name: "Concrete Pouring" },
]

export default function Subworks() {
  const { workId } = useParams()

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="container mx-auto px-6 py-10">
        <div className="mb-2 text-[11px] text-slate-400">Work #{workId}</div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-lg font-semibold tracking-tight">Subworks</h1>
          <Button className="h-8 px-3 text-xs">Add Subwork</Button>
        </div>

        <div className="space-y-2 text-sm">
          {mockSubworks.map((subwork) => (
            <Link
              key={subwork.id}
              to={`/subworks/${subwork.id}/details`}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900/70 px-4 py-3 text-xs hover:border-primary/60 hover:bg-slate-900"
            >
              <span>{subwork.name}</span>
              <span className="text-slate-400">View details →</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
