import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"

function Dialog({ children, ...props }: DialogPrimitive.DialogProps) {
  return <DialogPrimitive.Root {...props}>{children}</DialogPrimitive.Root>
}

const DialogTrigger = DialogPrimitive.Trigger

function DialogPortal({ children, className, ...props }: any) {
  return (
    <DialogPrimitive.Portal {...props}>
      <div className={cn("fixed inset-0 z-50 flex items-end justify-center sm:items-center", className)}>
        {children}
      </div>
    </DialogPrimitive.Portal>
  )
}

function DialogOverlay({ className, ...props }: any) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({ className, children, ...props }: any) {
  return (
    <DialogPrimitive.Content
      className={cn(
        "z-50 w-full max-w-lg rounded-lg bg-popover p-6 shadow-lg focus:outline-none",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4" />
    </DialogPrimitive.Content>
  )
}

const DialogHeader = ({ className, ...props }: any) => (
  <div className={cn("flex flex-col space-y-1.5", className)} {...props} />
)

const DialogFooter = ({ className, ...props }: any) => (
  <div className={cn("flex items-center justify-end space-x-2", className)} {...props} />
)

const DialogTitle = DialogPrimitive.Title
const DialogDescription = DialogPrimitive.Description

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}

export default Dialog
