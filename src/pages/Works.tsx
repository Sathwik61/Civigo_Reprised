import { Link, useParams } from "react-router-dom"
import { Button } from "@/components/ui"

const mockWorks = [
  { id: "10", name: "Foundation" },
  { id: "11", name: "Superstructure" },
]

export default function Works() {
  const { projectId } = useParams()

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="container mx-auto px-6 py-10">
        <div className="mb-2 text-[11px] text-slate-400">Project #{projectId}</div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-lg font-semibold tracking-tight">Works</h1>
          <Button className="h-8 px-3 text-xs">Add Work</Button>
        </div>

        <div className="space-y-2 text-sm">
          {mockWorks.map((work) => (
            <Link
              key={work.id}
              to={`/works/${work.id}/subworks`}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900/70 px-4 py-3 text-xs hover:border-primary/60 hover:bg-slate-900"
            >
              <span>{work.name}</span>
              <span className="text-slate-400">View subworks →</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
