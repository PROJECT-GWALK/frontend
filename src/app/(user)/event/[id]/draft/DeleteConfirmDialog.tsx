"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void> | void;
};

export default function DeleteConfirmDialog({ open, onOpenChange, onConfirm }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>ยืนยันการลบ</DialogTitle>
          <DialogDescription>ยืนยันลบ Event ฉบับร่างนี้หรือไม่?</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row sm:gap-3 w-full gap-2">
          <DialogClose asChild>
            <Button variant="outline" className="w-full sm:w-1/2">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" className="w-full sm:w-1/2" onClick={onConfirm}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

