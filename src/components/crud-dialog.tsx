import type { ReactNode } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type CrudDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  className?: string;
};

/** Dialog controlado com DialogContent sempre montado (evita bug do Radix). */
export function CrudDialog({ open, onOpenChange, className, children }: CrudDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className={cn("max-h-[min(90dvh,100vh-2rem)] overflow-y-auto", className)}
      >
        {open ? children : null}
      </DialogContent>
    </Dialog>
  );
}
