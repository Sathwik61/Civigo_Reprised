import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui";
import { useEffect, useState } from "react";
import type { WorkRecord } from "@/db/projectsDB";
import { WorkDialog } from "@/components/dialog/workDialog";
import { ConfirmDialog } from "@/components/dialog/confirmDialog";
import {
  addLocalWork,
  getLocalWorksForProject,
  updateLocalWork,
  deleteLocalWork,
  syncWorksFromServer,
  syncWorksToServer,
} from "@/services/dbservices/workLocal";

export default function Works() {
  const { projectId } = useParams(); // this is backend project id
  const [works, setWorks] = useState<WorkRecord[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<WorkRecord | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [workToDelete, setWorkToDelete] = useState<WorkRecord | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!projectId) return;

      const local = await getLocalWorksForProject({ backendId: projectId });
      if (!cancelled) setWorks(local);

      if (navigator.onLine) {
        await syncWorksToServer();
        await syncWorksFromServer();
        const synced = await getLocalWorksForProject({ backendId: projectId });
        if (!cancelled) setWorks(synced);
      }
    }

    init();

    const onOnline = async () => {
      if (!projectId) return;
      await syncWorksToServer();
      await syncWorksFromServer();
      const synced = await getLocalWorksForProject({ backendId: projectId });
      setWorks(synced);
    };

    window.addEventListener("online", onOnline);
    return () => {
      cancelled = true;
      window.removeEventListener("online", onOnline);
    };
  }, [projectId]);

  const handleWorkSubmit = async (values: { name: string; description: string }) => {
    if (!projectId) return;

    if (editingWork) {
      await updateLocalWork(editingWork, {
        name: values.name,
        description: values.description,
      });
    } else {
      await addLocalWork({
        projectBackendId: projectId,
        projectLocalId: undefined,
        name: values.name,
        description: values.description,
      });
    }

    const updated = await getLocalWorksForProject({ backendId: projectId });
    setWorks(updated);

    if (navigator.onLine) {
      await syncWorksToServer();
      await syncWorksFromServer();
      const synced = await getLocalWorksForProject({ backendId: projectId });
      setWorks(synced);
    }

    setEditingWork(null);
  };

  const handleConfirmDeleteWork = async () => {
    if (!projectId || !workToDelete) return;
    await deleteLocalWork(workToDelete);
    const updated = await getLocalWorksForProject({ backendId: projectId });
    setWorks(updated);
    setWorkToDelete(null);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <div className="container mx-auto px-6 py-10">
        <div className="mb-2 text-[11px] text-slate-500 dark:text-slate-400">Project #{projectId}</div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-lg font-semibold tracking-tight">Works</h1>
          <Button
            className="h-8 px-3 text-xs"
            onClick={() => {
              setEditingWork(null);
              setDialogOpen(true);
            }}
          >
            Add Work
          </Button>
        </div>

        <div className="space-y-2 text-sm">
          {works.map((work) => (
            <div
              key={work.id}
              className="flex items-center justify-between rounded-lg border border-slate-200/80 bg-white px-4 py-3 text-xs dark:border-white/10 dark:bg-slate-900/70"
            >
              <Link
                to={`/works/${work.id}/subworks`}
                className="flex-1 text-left hover:text-primary"
              >
                <span>{work.name}</span>
              </Link>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setEditingWork(work);
                    setDialogOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setWorkToDelete(work);
                    setConfirmOpen(true);
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <WorkDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) setEditingWork(null);
          setDialogOpen(open);
        }}
        onSubmit={handleWorkSubmit}
        initialValues={editingWork ? {
          name: editingWork.name,
          description: editingWork.description,
        } : undefined}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!open) setWorkToDelete(null);
          setConfirmOpen(open);
        }}
        title="Delete this work?"
        description="This will remove the work from your local data."
        confirmLabel="Delete"
        onConfirm={handleConfirmDeleteWork}
      />
    </main>
  );
}
