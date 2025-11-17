import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onOpenChange: (open: boolean) => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onOpenChange,
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[95vw] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-slate-200/80 bg-white px-5 py-4 text-slate-900 shadow-xl shadow-slate-900/20 focus:outline-none dark:border-white/10 dark:bg-slate-950 dark:text-slate-50">
        <DialogHeader>
          <DialogTitle className="text-sm">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter className="mt-4 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="text-xs"
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
