"use client";

import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit2, Upload } from "lucide-react";
import type { PresenterProject } from "./types";
import { uploadTeamFile, updateTeam, deleteTeam } from "@/utils/apievent";
import type { EventFileType } from "@/utils/types";
import { toast } from "sonner";
import ImageCropDialog from "@/lib/image-crop-dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: PresenterProject;
  onSuccess: () => void;
  eventId: string;
};

export default function EditProjectDialog({
  open,
  onOpenChange,
  project,
  onSuccess,
  eventId,
}: Props) {
  const [form, setForm] = useState<PresenterProject>(project);
  const [loading, setLoading] = useState(false);

  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [pendingFileMeta, setPendingFileMeta] = useState<{ name: string; type: string } | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(project.img || null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      toast.success("Project updated");
      onSuccess();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to update project");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    setLoading(true);
    try {
      await deleteTeam(eventId, project.id);
      toast.success("Project deleted");
      onSuccess();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to delete project");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fileTypeId: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await uploadTeamFile(eventId, project.id, fileTypeId, file);
      if (res.message === "ok") {
        const newUrl = res.teamFile.fileUrl;
        const name = file.name;

        // Update form
        setForm((f) => {
          const newFiles = [...(f.files || [])];
          // Remove existing file for this type if any
          const existingIdx = newFiles.findIndex(
            (x) => x.fileTypeId === fileTypeId
          );
          if (existingIdx >= 0) {
            newFiles[existingIdx] = { name, url: newUrl, fileTypeId };
          } else {
            newFiles.push({ name, url: newUrl, fileTypeId });
          }
          return { ...f, files: newFiles };
        });
        toast.success("File uploaded");
      }
    } catch (err) {
      toast.error("Upload failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogTitle className="flex items-center gap-2">
          <Edit2 className="w-4 h-4" /> Edit Project
        </DialogTitle>
        <div className="mt-4 space-y-4">
          <div>
            <Label>Name</Label>
            <Input
              value={form.title || ""}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={form.desc || ""}
              onChange={(e) => setForm({ ...form, desc: e.target.value })}
            />
          </div>

          <div>
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
              <div className="relative border rounded-lg overflow-hidden aspect-video bg-muted mt-2">
                <img
                  src={bannerPreview}
                  alt="Project cover preview"
                  className="absolute inset-0 h-full w-full object-cover"
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
                className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer aspect-video flex flex-col items-center justify-center mt-2"
                onClick={openFilePicker}
              >
                <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Click to upload</p>
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



          <div>
            <Label>Members</Label>
            <div className="flex gap-2 flex-wrap mt-2">
              {(form.members || []).length > 0 ? (
                (form.members || []).map((m) => (
                  <div
                    key={m}
                    className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-sm"
                  >
                    <span>{m}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No members yet.</div>
              )}
            </div>
          </div>

          <div>
            <Label>Files</Label>
            <div className="text-sm text-muted-foreground mt-1">
              File management has been moved to the project details page.
            </div>
          </div>

          <div className="flex justify-between gap-2 mt-4 pt-4 border-t">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={loading}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Project
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
