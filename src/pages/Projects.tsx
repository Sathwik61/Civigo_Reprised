import { Link } from "react-router-dom"
import { Button } from "@/components/ui"

const mockProjects = [
  { id: "1", name: "Downtown Complex" },
  { id: "2", name: "Harbor Expansion" },
]

export default function Projects() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="container mx-auto px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-lg font-semibold tracking-tight">Projects</h1>
          <Button className="h-8 px-3 text-xs">Add Project</Button>
        </div>

        <div className="space-y-2 text-sm">
          {mockProjects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}/works`}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900/70 px-4 py-3 text-xs hover:border-primary/60 hover:bg-slate-900"
            >
              <span>{project.name}</span>
              <span className="text-slate-400">View works →</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
