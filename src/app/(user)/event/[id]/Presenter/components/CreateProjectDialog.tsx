"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { PresenterProject } from "./types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (p: PresenterProject) => void;
};

export default function CreateProjectDialog({ open, onOpenChange, onCreate }: Props) {
  const [name, setName] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle>Create Project</DialogTitle>
        <div className="mt-4 space-y-3">
          <Label>Project name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setName("");
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                const id = `team-${Date.now().toString().slice(-6)}`;
                const pr: PresenterProject = {
                  id,
                  title: name || `Team ${id}`,
                  desc: "",
                  img: "/project1.png",
                };
                onCreate(pr);
                setName("");
                onOpenChange(false);
              }}
            >
              Create
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
