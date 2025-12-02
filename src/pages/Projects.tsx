import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui"
import { useEffect, useState } from "react"
import { ProjectDialog } from "@/components/dialog/projectDialog"
import { ConfirmDialog } from "@/components/dialog/confirmDialog";
import {
    getAllLocalProjects,
    addLocalProject,
    fullSync,
    syncToServer,
    markProjectDeletedLocal,
} from "@/services/dbservices/projectLocal";
import { projectsDB } from "@/db/projectsDB";
import type { ProjectRecord } from "@/db/projectsDB";


export default function Projects() {
    const navigate = useNavigate()
    const [dialogOpen, setDialogOpen] = useState(false)
    const [projects, setProjects] = useState<ProjectRecord[]>([]);
    const [editingProject, setEditingProject] = useState<ProjectRecord | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<ProjectRecord | null>(null);

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

    const handleDeleteClick = (project: ProjectRecord) => {
        setProjectToDelete(project);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!projectToDelete || projectToDelete.id == null) return;
        // mark as deleted locally (soft delete); syncToServer will
        // later propagate this to the backend when online
        await markProjectDeletedLocal(projectToDelete.id);

        // refresh UI from Dexie
        const updated = await getAllLocalProjects();
        setProjects(updated);

        // if online now, push deletion immediately
        if (navigator.onLine) {
            await syncToServer();
            const synced = await getAllLocalProjects();
            setProjects(synced);
        }

        setProjectToDelete(null);
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
                            <div className="mx-3">
                                <span
                                    className={
                                        `inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px]` +
                                        (project.synced
                                            ? " bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300"
                                            : " bg-red-500/10 text-red-600 dark:bg-red-400/20 dark:text-red-300")
                                    }
                                >
                                    ●
                                </span>
                            </div>
                            <div className="flex-1">
                                <button
                                    type="button"
                                    className="text-left w-full hover:text-primary"
                                    onClick={() => {
                                        if (!project.backendId) return;
                                        navigate(`/projects/${project.backendId}/works`);
                                    }}
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

            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={(open) => {
                    if (!open) setProjectToDelete(null);
                    setConfirmOpen(open);
                }}
                title="Delete this project?"
                description="This will remove the project from your local data."
                confirmLabel="Delete"
                onConfirm={handleConfirmDelete}
            />
        </main>
    )
}

