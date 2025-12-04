"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGoDashboard: () => void;
};

export default function DeleteSuccessDialog({ open, onOpenChange, onGoDashboard }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm flex flex-col items-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <Check className="h-6 w-6 text-green-600" />
        </div>
        <DialogHeader className="text-center gap-0">
          <DialogTitle className="text-center">Deleted successfully</DialogTitle>
          <DialogDescription className="mt-2 text-center mx-auto sm:max-w-[90%]">
            Event draft has been deleted.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row sm:gap-3 w-full gap-2">
          <DialogClose asChild>
            <Button variant="default" className="w-full sm:w-1/2" onClick={onGoDashboard}>Go to Dashboard</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="outline" className="w-full sm:w-1/2">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

