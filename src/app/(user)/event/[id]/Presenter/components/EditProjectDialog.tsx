"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit2 } from "lucide-react";
import type { PresenterProject } from "./types";
import { uploadTeamFile } from "@/utils/apievent";
import type { EventFileType } from "@/utils/types";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: PresenterProject;
  onSave: (p: PresenterProject) => void;
  eventId: string;
  fileTypes: EventFileType[];
};

export default function EditProjectDialog({
  open,
  onOpenChange,
  project,
  onSave,
  eventId,
  fileTypes,
}: Props) {
  const [form, setForm] = useState<PresenterProject>(project);
  const [newMember, setNewMember] = useState("");

  React.useEffect(() => setForm(project), [project]);

  const addMember = () => {
    if (!newMember.trim()) return;
    setForm((f) => ({ ...f, members: [...(f.members || []), newMember.trim()] }));
    setNewMember("");
  };

  const removeMember = (m: string) => {
    setForm((f) => ({ ...f, members: (f.members || []).filter((x) => x !== m) }));
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
            <Label>Image URL</Label>
            <Input
              value={form.img || ""}
              onChange={(e) => setForm({ ...form, img: e.target.value })}
            />
          </div>

          <div>
            <Label>Video Link (embed url)</Label>
            <Input
              value={form.videoLink || ""}
              onChange={(e) => setForm({ ...form, videoLink: e.target.value })}
            />
          </div>

          <div>
            <Label>Files</Label>
            <div className="space-y-4 mt-2">
              {(fileTypes || []).map((ft) => {
                const uploaded = form.files?.find((f) => f.fileTypeId === ft.id);
                return (
                  <div key={ft.id} className="border p-3 rounded-md">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">
                          {ft.name} {ft.isRequired && <span className="text-red-500">*</span>}
                        </div>
                        {ft.description && (
                          <div className="text-xs text-muted-foreground">{ft.description}</div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          Allowed: {ft.allowedFileTypes.join(", ")}
                        </div>
                      </div>
                      {uploaded && (
                        <a
                          href={uploaded.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:underline"
                        >
                          View Uploaded
                        </a>
                      )}
                    </div>

                    <Input
                      type="file"
                      accept={ft.allowedFileTypes.map((t) => "." + t).join(",")}
                      onChange={(e) => handleFileUpload(e, ft.id!)}
                    />
                  </div>
                );
              })}
              {(!fileTypes || fileTypes.length === 0) && (
                <div className="text-sm text-muted-foreground">
                  No file requirements configured for this event.
                </div>
              )}
            </div>
          </div>

          <div>
            <Label>Members</Label>
            <div className="flex gap-2 flex-wrap">
              {(form.members || []).map((m) => (
                <div
                  key={m}
                  className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-sm"
                >
                  <span>{m}</span>
                  <Button size="sm" variant="ghost" onClick={() => removeMember(m)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="New member name"
                value={newMember}
                onChange={(e) => setNewMember(e.target.value)}
              />
              <Button size="sm" onClick={addMember}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                onSave(form);
                onOpenChange(false);
              }}
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
