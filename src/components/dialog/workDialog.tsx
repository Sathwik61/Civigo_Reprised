import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface WorkDialogValues {
  name: string;
  description: string;
}

export interface WorkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: WorkDialogValues;
  onSubmit: (work: WorkDialogValues) => Promise<void> | void;
}

export function WorkDialog({ open, onOpenChange, initialValues, onSubmit }: WorkDialogProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(initialValues?.name ?? "");
    setDescription(initialValues?.description ?? "");
  }, [initialValues, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ name, description });
      onOpenChange(false);
      setName("");
      setDescription("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[95vw] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-slate-200/80 bg-white px-5 py-4 text-slate-900 shadow-xl shadow-slate-900/20 focus:outline-none dark:border-white/10 dark:bg-slate-950 dark:text-slate-50">
        <DialogHeader>
          <DialogTitle className="text-base">{initialValues ? "Edit Work" : "Add Work"}</DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            {initialValues
              ? "Update the details for this work."
              : "Create a new work under this project."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-3 space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs outline-none ring-0 placeholder:text-slate-400 focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-slate-500"
              placeholder="Excavation"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium">Description</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-md border border-slate-300 bg-white px-3 py-2 text-xs outline-none ring-0 placeholder:text-slate-400 focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-slate-500"
              placeholder="Short description of the work"
            />
          </div>

          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" className="text-xs" disabled={loading}>
              {loading ? "Saving..." : initialValues ? "Save changes" : "Save work"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
