import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui";
import { useEffect, useState } from "react";
import type { SubworkRecord } from "@/db/projectsDB";
import {
  addLocalSubwork,
  getLocalSubworksForWork,
  updateLocalSubwork,
  deleteLocalSubwork,
  fullSubworksSync,
} from "@/services/dbservices/subworkLocal";
import { SubworkDialog } from "@/components/dialog/subworkDialog";
import { ConfirmDialog } from "@/components/dialog/confirmDialog";

export default function Subworks() {
  const { workId } = useParams(); // backend work id
  const [subworks, setSubworks] = useState<SubworkRecord[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubwork, setEditingSubwork] = useState<SubworkRecord | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [subworkToDelete, setSubworkToDelete] = useState<SubworkRecord | null>(null);

  useEffect(() => {
    if (!workId) return;
    let cancelled = false;

    async function init() {
      const local = await getLocalSubworksForWork({ localId: Number(workId) });
      if (!cancelled) setSubworks(local);

      if (navigator.onLine) {
        await fullSubworksSync();
        const synced = await getLocalSubworksForWork({ localId: Number(workId) });
        if (!cancelled) setSubworks(synced);
      }
    }

    init();

    const onOnline = async () => {
      await fullSubworksSync();
      const data = await getLocalSubworksForWork({ localId: Number(workId) });
      if (!cancelled) setSubworks(data);
    };

    window.addEventListener("online", onOnline);

    return () => {
      cancelled = true;
      window.removeEventListener("online", onOnline);
    };
  }, [workId]);

  const handleSubworkSubmit = async (values: { name: string; description?: string }) => {
    if (!workId) return;

    if (editingSubwork) {
      await updateLocalSubwork(editingSubwork, {
        name: values.name,
        description: values.description,
      });
    } else {
      console.log("Adding local subwork for work local ID:", Number(workId));
      await addLocalSubwork({
        workBackendId: workId,
        workLocalId: Number(workId),
        name: values.name,
        description: values.description,
      });
    }

    const updated = await getLocalSubworksForWork({ localId: Number(workId) });
    setSubworks(updated ?? []);

    if (navigator.onLine) {
      await fullSubworksSync();
      const synced = await getLocalSubworksForWork({ localId: Number(workId) });
      setSubworks(synced ?? []);
    }

    setEditingSubwork(null);
  };

  const handleDeleteClick = (subwork: SubworkRecord) => {
    setSubworkToDelete(subwork);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!subworkToDelete || !subworkToDelete.id || !workId) return;
    await deleteLocalSubwork(subworkToDelete);
    const updated = await getLocalSubworksForWork({ localId: Number(workId) });
    setSubworks(updated);
    setSubworkToDelete(null);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <div className="container mx-auto px-6 py-10">
        <div className="mb-2 text-[11px] text-slate-500 dark:text-slate-400">Work #{workId}</div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-lg font-semibold tracking-tight">Subworks</h1>
          <Button className="h-8 px-3 text-xs" onClick={() => setDialogOpen(true)}>
            Add Subwork
          </Button>
        </div>

        <div className="space-y-2 text-sm">
          {subworks.map((subwork) => (
            <div
              key={subwork.id}
              className="flex items-center justify-between rounded-lg border border-slate-200/80 bg-white px-4 py-3 text-xs dark:border-white/10 dark:bg-slate-900/70"
            >
              <div className="mx-3">
                <span
                  className={
                    `inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px]` +
                    (subwork.synced
                      ? " bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300"
                      : " bg-red-500/10 text-red-600 dark:bg-red-400/20 dark:text-red-300")
                  }
                >
                  ●
                </span>
              </div>
              <Link
                to={`/subworks/${/*subwork.backendId ??*/ subwork.id}/details`}
                className="flex-1 text-left hover:text-primary"
              >
                <span>{subwork.name}, {subwork.id}</span>
              </Link>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setEditingSubwork(subwork);
                    setDialogOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleDeleteClick(subwork)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <SubworkDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) setEditingSubwork(null);
          setDialogOpen(open);
        }}
        onSubmit={handleSubworkSubmit}
        initialValues={editingSubwork ? {
          name: editingSubwork.name,
          description: editingSubwork.description,
        } : undefined}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!open) setSubworkToDelete(null);
          setConfirmOpen(open);
        }}
        title="Delete this subwork?"
        description="This will remove the subwork from your local data."
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
      />
    </main>
  );
}
