"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void> | void;
  title?: string;
  description?: string;
  cancelLabel?: string;
  confirmLabel?: string;
};

export default function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  cancelLabel,
  confirmLabel,
}: Props) {
  const { t } = useLanguage();
  const titleText = title ?? t("dialog.deleteConfirmTitle");
  const descriptionText = description ?? t("dialog.deleteConfirmDesc");
  const cancelText = cancelLabel ?? t("dialog.cancel");
  const confirmText = confirmLabel ?? t("dialog.delete");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{titleText}</DialogTitle>
          <DialogDescription>{descriptionText}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row sm:gap-3 w-full gap-2">
          <DialogClose asChild>
            <Button variant="outline" className="w-full sm:w-1/2">
              {cancelText}
            </Button>
          </DialogClose>
          <Button variant="destructive" className="w-full sm:w-1/2" onClick={onConfirm}>
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

