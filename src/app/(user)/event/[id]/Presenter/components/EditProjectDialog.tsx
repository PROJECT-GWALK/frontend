"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit2 } from "lucide-react";
import type { PresenterProject } from "./types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: PresenterProject;
  onSave: (p: PresenterProject) => void;
};

export default function EditProjectDialog({ open, onOpenChange, project, onSave }: Props) {
  const [form, setForm] = useState<PresenterProject>(project);
  const [newMember, setNewMember] = useState("");
  const [newFileUrl, setNewFileUrl] = useState("");

  React.useEffect(() => setForm(project), [project]);

  const addMember = () => {
    if (!newMember.trim()) return;
    setForm((f) => ({ ...f, members: [...(f.members || []), newMember.trim()] }));
    setNewMember("");
  };

  const removeMember = (m: string) => {
    setForm((f) => ({ ...f, members: (f.members || []).filter((x) => x !== m) }));
  };

  const addFile = () => {
    if (!newFileUrl.trim()) return;
    const name = newFileUrl.split("/").pop() || newFileUrl;
    setForm((f) => ({ ...f, files: [...(f.files || []), { name, url: newFileUrl.trim() }] }));
    setNewFileUrl("");
  };

  const removeFile = (url: string) => {
    setForm((f) => ({ ...f, files: (f.files || []).filter((x) => x.url !== url) }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
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
            <div className="space-y-2">
              {(form.files || []).map((f) => (
                <div key={f.url} className="flex items-center justify-between gap-2">
                  <div className="text-sm">{f.name}</div>
                  <div className="flex items-center gap-2">
                    <a
                      href={f.url}
                      className="text-sm text-blue-600 underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open
                    </a>
                    <Button size="sm" variant="ghost" onClick={() => removeFile(f.url)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="https://.../file.pdf"
                  value={newFileUrl}
                  onChange={(e) => setNewFileUrl(e.target.value)}
                />
                <Button size="sm" onClick={addFile}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
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
