"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2, Edit2, Upload } from "lucide-react";
import type { PresenterProject } from "./types";
import { updateTeam, deleteTeam } from "@/utils/apievent";
import { toast } from "sonner";
import ImageCropDialog from "@/lib/image-crop-dialog";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: PresenterProject;
  onSuccess: () => void;
  eventId: string;
  isSubmissionActive?: boolean;
  canDelete?: boolean;
};

export default function EditProjectDialog({
  open,
  onOpenChange,
  project,
  onSuccess,
  eventId,
  isSubmissionActive = true,
  canDelete,
}: Props) {
  const router = useRouter();
  const { t } = useLanguage();
  const [form, setForm] = useState<PresenterProject>(project);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Determine if delete button should be shown
  // If canDelete is provided, use it. Otherwise fallback to project.isLeader
  const showDelete = canDelete !== undefined ? canDelete : project.isLeader;

  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [pendingFileMeta, setPendingFileMeta] = useState<{ name: string; type: string } | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(project.img || null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag and Drop state
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!isSubmissionActive) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        // Create a synthetic event to reuse onBannerFileChange logic
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        
        const event = {
          target: {
            files: dataTransfer.files,
            value: "", // Reset value simulation
          },
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        
        onBannerFileChange(event);
      } else {
        toast.error(t("projectDetail.files.onlyImage"));
      }
    }
  };

  useEffect(() => {
    setForm(project);
    setBannerPreview(project.img || null);
    setImageFile(null);
  }, [project]);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const onBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error(t("projectDetail.files.sizeExceeded"));
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
      setPendingFileMeta({ name: file.name, type: file.type });
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = ""; // reset
  };

  const onCropCancel = () => {
    setCropOpen(false);
    setCropSrc(null);
    setPendingFileMeta(null);
  };

  const onCropConfirm = (file: File, previewUrl: string) => {
    setImageFile(file);
    setBannerPreview(previewUrl);
    setCropOpen(false);
    setCropSrc(null);
    setPendingFileMeta(null);
  };

  const onRemoveBanner = () => {
    setImageFile(null);
    setBannerPreview(null);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let imageCover: string | File | null | undefined = undefined;
      if (imageFile) {
        imageCover = imageFile;
      } else if (bannerPreview !== (project.img || null)) {
         // changed (removed)
         imageCover = null;
      }

      await updateTeam(eventId, project.id, {
        teamName: form.title,
        description: form.desc,
        imageCover,
      });
      toast.success(t("toast.projectUpdated"));
      onSuccess();
      onOpenChange(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t("toast.projectUpdateFailed");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteTeam(eventId, project.id);
      toast.success(t("toast.projectDeleted"));
      onSuccess();
      onOpenChange(false);
      setDeleteDialogOpen(false);
      router.push(`/event/${eventId}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t("toast.projectDeleteFailed");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[calc(100%-2rem)] rounded-lg flex flex-col max-h-[90vh]">
        <DialogTitle className="flex items-center gap-2">
          <Edit2 className="w-4 h-4" /> {t("projectDetail.buttons.editProject")}
        </DialogTitle>
        <div className="mt-2 space-y-3 flex-1 overflow-hidden flex flex-col">
          <div>
            <Label>Name</Label>
            <Input
              value={form.title || ""}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              disabled={!isSubmissionActive}
              className="h-9"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={form.desc || ""}
              onChange={(e) => setForm({ ...form, desc: e.target.value })}
              disabled={!isSubmissionActive}
              className="min-h-15 max-h-25"
            />
          </div>

          <div className="flex-1 min-h-0 flex flex-col">
            <Label>Image Cover</Label>
            <ImageCropDialog
              open={cropOpen}
              src={cropSrc}
              fileName={pendingFileMeta?.name}
              fileType={pendingFileMeta?.type}
              aspect={2}
              title="Crop to 800x400"
              outputWidth={800}
              outputHeight={400}
              onOpenChange={(o) => {
                if (!o) onCropCancel();
              }}
              onCancel={onCropCancel}
              onConfirm={onCropConfirm}
            />
            {bannerPreview ? (
              <div className="relative border rounded-lg overflow-hidden bg-muted mt-1 flex-1 min-h-30 group">
                <Image
                  src={bannerPreview}
                  alt="Project cover preview"
                  fill
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button size="sm" variant="secondary" onClick={openFilePicker} disabled={!isSubmissionActive} className="h-7 text-xs shadow-md">
                    {t("eventInfo.change")}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={onRemoveBanner} disabled={!isSubmissionActive} className="h-7 text-xs shadow-md">
                    {t("eventInfo.remove")}
                  </Button>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={onBannerFileChange}
                  disabled={!isSubmissionActive}
                />
              </div>
            ) : (
              <div
                className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors flex flex-col items-center justify-center mt-1 flex-1 min-h-30 ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                } ${
                  !isSubmissionActive ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                }`}
                onClick={isSubmissionActive ? openFilePicker : undefined}
                onDragOver={isSubmissionActive ? handleDragOver : undefined}
                onDragLeave={isSubmissionActive ? handleDragLeave : undefined}
                onDrop={isSubmissionActive ? handleDrop : undefined}
              >
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">{t("eventInfo.clickToUpload")}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("projectDetail.files.dragAndDrop")}</p>
                <p className="text-[10px] text-muted-foreground mt-1 opacity-70">
                  {t("projectDetail.files.maxSize")}
                </p>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={onBannerFileChange}
                  disabled={!isSubmissionActive}
                />
              </div>
            )}
          </div>

          <div>
            <Label>Members</Label>
            <div className="flex gap-2 flex-wrap mt-1 max-h-15 overflow-y-auto">
              {(form.members || []).length > 0 ? (
                (form.members || []).map((m) => (
                  <div
                    key={m}
                    className="flex items-center gap-2 px-2 py-0.5 rounded-full bg-muted text-xs"
                  >
                    <span>{m}</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-muted-foreground">No members yet.</div>
              )}
            </div>
          </div>

          <div className="flex justify-between gap-2 mt-2 pt-2 border-t">
            {showDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={loading || !isSubmissionActive}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t("dialog.delete")}
              </Button>
            )}
            <div className={`flex gap-2 ${!showDelete ? "w-full justify-end" : ""}`}>
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={loading}>
                {t("dialog.cancel")}
              </Button>
              <Button size="sm" onClick={handleSave} disabled={loading || !isSubmissionActive}>
                {loading ? t("projectDetail.evaluation.saving") : t("dialog.save")}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("projectDetail.dialogs.deleteProjectTitle")}</DialogTitle>
            <DialogDescription>
              {t("projectDetail.dialogs.deleteProjectDesc")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t("dialog.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? t("projectDetail.messages.deleting") : t("projectDetail.dialogs.deleteProjectTitle")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
