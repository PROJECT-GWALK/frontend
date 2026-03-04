"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createTeam } from "@/utils/apievent";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import ImageCropDialog from "@/lib/image-crop-dialog";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  isSubmissionActive?: boolean;
};

export default function CreateProjectDialog({ open, onOpenChange, onSuccess, isSubmissionActive = true }: Props) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  
  // Image Crop State
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [pendingFileMeta, setPendingFileMeta] = useState<{ name: string; type: string } | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
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

  const [loading, setLoading] = useState(false);
  const params = useParams();
  const eventId = params?.id as string;

  const resetForm = () => {
    setName("");
    setDescription("");
    setBannerPreview(null);
    setImageFile(null);
    setCropSrc(null);
    setPendingFileMeta(null);
  };

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto rounded-lg">
        <DialogTitle>Create Project</DialogTitle>
        <div className="mt-4 space-y-3">
          <div>
            <Label>Project name</Label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              disabled={loading} 
              placeholder="Enter project name"
            />
          </div>
          
          <div>
            <Label>Description</Label>
            <Textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              disabled={loading} 
              placeholder="Enter description"
              className="min-h-15 max-h-25"
            />
          </div>

          <div>
            <Label>Image Cover (optional)</Label>
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
              <div className="relative border rounded-lg overflow-hidden aspect-video bg-muted mt-2">
                <Image
                  src={bannerPreview}
                  alt="Project cover preview"
                  fill
                  sizes="(max-width: 768px) 100vw, 800px"
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button size="sm" variant="secondary" onClick={openFilePicker}>
                    Change
                  </Button>
                  <Button size="sm" variant="destructive" onClick={onRemoveBanner}>
                    Remove
                  </Button>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={onBannerFileChange}
                />
              </div>
            ) : (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors flex flex-col items-center justify-center mt-2 aspect-video ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                } ${
                  !isSubmissionActive ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                }`}
                onClick={isSubmissionActive ? openFilePicker : undefined}
                onDragOver={isSubmissionActive ? handleDragOver : undefined}
                onDragLeave={isSubmissionActive ? handleDragLeave : undefined}
                onDrop={isSubmissionActive ? handleDrop : undefined}
              >
                <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">{t("eventInfo.clickToUpload")}</p>
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
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 justify-end mt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              {t("dialog.cancel")}
            </Button>
            <Button
              size="sm"
              disabled={loading || !isSubmissionActive}
              onClick={async () => {
                if (!name.trim()) return;
                setLoading(true);
                try {
                  await createTeam(eventId, name, description, undefined, imageFile || undefined);
                  toast.success(t("toast.projectCreated"));
                  resetForm();
                  onOpenChange(false);
                  onSuccess();
                } catch (e: unknown) {
                  console.error(e);
                  if (e && typeof e === 'object' && 'response' in e) {
                     const err = e as { response: { status: number; data?: { message?: string } } };
                    if (err.response.status === 400) {
                      toast.error(err.response.data?.message || "Failed to create project: Bad Request");
                    } else {
                      toast.error((e as unknown as Error).message || "Failed to create project");
                    }
                  } else {
                    toast.error((e as Error).message || "Failed to create project");
                  }
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? t("projectDetail.buttons.creating") : t("projectDetail.buttons.create")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
