import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui"
import { useEffect, useState } from "react"
import { ProjectDialog } from "@/components/dialog/projectDialog"
import {
    getAllLocalProjects,
    addLocalProject,
    fullSync,
    syncToServer,
} from "@/services/dbservices/projectLocal";
import { projectsDB } from "@/db/projectsDB";
import type { ProjectRecord } from "@/db/projectsDB";


export default function Projects() {
    const navigate = useNavigate()
    const [dialogOpen, setDialogOpen] = useState(false)
    const [projects, setProjects] = useState<ProjectRecord[]>([]);
    const [editingProject, setEditingProject] = useState<ProjectRecord | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function init() {
            // 1. Always show what’s already in Dexie
            const local = await getAllLocalProjects();
            if (!cancelled) setProjects(local);
			
            // 2. Then sync in background if online
            if (navigator.onLine) {
                await fullSync();
                const synced = await getAllLocalProjects();
                if (!cancelled) setProjects(synced);
            }
        }

        init();

        const onOnline = async () => {
            await fullSync();
            const data = await getAllLocalProjects();
            setProjects(data);
        };
        window.addEventListener("online", onOnline);

        return () => {
            cancelled = true;
            window.removeEventListener("online", onOnline);
        };
    }, []);

    const handleCreateProject = async (project: {
        name: string
        description: string
        status: string
        clientdetails: {
            clientname: string
            clientnumber: number
            clientaddress: string
        }
    }) => {
        if (editingProject) {
            await projectsDB.projects.update(editingProject.id!, {
                ...editingProject,
                ...project,
                clientdetails: project.clientdetails,
                synced: false,
                updatedAt: Date.now(),
            });
        } else {
            await addLocalProject(project);
        }

        const updated = await getAllLocalProjects();
        setProjects(updated);

        if (navigator.onLine) {
            await syncToServer();
            const synced = await getAllLocalProjects();
            setProjects(synced);
        }

        setEditingProject(null);
    }

    const handleEditClick = (project: ProjectRecord) => {
        setEditingProject(project);
        setDialogOpen(true);
    };

    const handleDeleteClick = async (project: ProjectRecord) => {
        const confirmed = window.confirm("Are you sure you want to delete this project?");
        if (!confirmed || project.id == null) return;

        await projectsDB.projects.delete(project.id);
        const updated = await getAllLocalProjects();
        setProjects(updated);
    };

    return (
        <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
            <div className="container mx-auto px-6 py-10">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-lg font-semibold tracking-tight">Projects</h1>
                    <Button className="h-8 px-3 text-xs" onClick={() => setDialogOpen(true)}>
                        Add Project
                    </Button>
                </div>

                <div className="space-y-2 text-sm">
                    {projects.map((project) => (
                        <div
                            key={project.id}
                            className="flex items-center justify-between rounded-lg border border-slate-200/80 bg-white px-4 py-3 text-xs dark:border-white/10 dark:bg-slate-900/70"
                        >
                            <div className="flex-1">
                                <button
                                    type="button"
                                    className="text-left w-full hover:text-primary"
                                    onClick={() => navigate(`/projects/${project.id}/works`)}
                                >
                                    <span>{project.name}</span>
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => handleEditClick(project)}
                                >
                                    Edit
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => handleDeleteClick(project)}
                                >
                                    Delete
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <ProjectDialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    if (!open) setEditingProject(null);
                    setDialogOpen(open);
                }}
                onSubmit={handleCreateProject}
                initialValues={editingProject ? {
                    name: editingProject.name,
                    description: editingProject.description,
                    status: editingProject.status,
                    clientdetails: editingProject.clientdetails,
                } : undefined}
            />
        </main>
    )
}

