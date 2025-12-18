"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import * as QRCode from "qrcode";
import { toast } from "sonner";
import { Edit3, Share2, QrCode } from "lucide-react";
import { getProjectById, updateProject } from "../../components/mockProjects";
import EditProjectDialog from "../../components/EditProjectDialog";
import type { PresenterProject } from "../../components/types";

type Props = {
  params: { id: string; projectId: string };
};

export default function ProjectDetailPage({ params }: Props) {
  // params can be a Thenable in newer Next.js versions; unwrap with React.use() when available
  const paramsResolved = (React as any).use ? (React as any).use(params) : params;
  const { projectId, id } = paramsResolved as { projectId: string; id: string };
  const [project, setProject] = useState<PresenterProject | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [qrThumb, setQrThumb] = useState<string | null>(null);
  const [qrThumbCommittee, setQrThumbCommittee] = useState<string | null>(null);

  useEffect(() => {
    const p = getProjectById(projectId);
    setProject(p);
  }, [projectId]);

  useEffect(() => {
    const gen = async () => {
      const link = `${location.origin}/event/${id}/Projects/${projectId}`;
      const committeeLink = `${location.origin}/event/${id}/Projects/${projectId}?role=committee`;
      try {
        const thumb = await QRCode.toDataURL(link, { width: 240 });
        setQrThumb(thumb);
        const thumb2 = await QRCode.toDataURL(committeeLink, { width: 240 });
        setQrThumbCommittee(thumb2);
      } catch (e) {
        // ignore
      }
    };
    gen();
  }, [id, projectId]);

  if (!project) {
    return (
      <div className="p-6">
        <Link href={`../`} className="text-sm text-blue-600 underline">
          Back to Projects
        </Link>
        <div className="mt-4 text-muted-foreground">Project not found.</div>
      </div>
    );
  }

  const onSave = (p: PresenterProject) => {
    const ok = updateProject(p);
    if (ok) {
      setProject(p);
      toast.success("Project updated");
    } else {
      toast.error("Failed to update project");
    }
  };

  const copyToClipboard = (t: string) => {
    navigator.clipboard.writeText(t);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-start gap-6">
        <div className="w-48 h-32 relative rounded-lg overflow-hidden bg-slate-100">
          {project.img ? (
            <Image src={project.img} alt={project.title} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-300 text-4xl font-bold">
              {project.title.charAt(0)}
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{project.title}</h1>
              <p className="text-sm text-muted-foreground mt-2">{project.desc}</p>

              <div className="mt-4 flex gap-3 text-sm text-muted-foreground">
                <div>Members: {project.members?.length ?? 0}</div>
                <div>Files: {project.files?.length ?? 0}</div>
              </div>

              <div className="mt-4">
                <Link href={`../../`} className="text-sm text-blue-600 underline">
                  Back to Projects
                </Link>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                className="inline-flex items-center gap-2 rounded bg-muted/50 px-3 py-2"
                onClick={() => setEditOpen(true)}
              >
                <Edit3 className="w-4 h-4" /> Edit
              </button>
              <button
                className="inline-flex items-center gap-2 rounded bg-muted/50 px-3 py-2"
                onClick={() =>
                  copyToClipboard(`${location.origin}/event/${id}/Projects/${projectId}`)
                }
              >
                <Share2 className="w-4 h-4" /> Copy Link
              </button>
            </div>
          </div>
        </div>
      </div>

      {project.videoLink ? (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Project Video</h3>
          <div className="aspect-video">
            <iframe
              src={project.videoLink}
              title={project.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full rounded"
            />
          </div>
        </div>
      ) : null}

      {project.files && project.files.length > 0 ? (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Files</h3>
          <ul className="space-y-2">
            {project.files.map((f) => (
              <li key={f.url}>
                <a href={f.url} className="text-blue-600 underline">
                  {f.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {project.members && project.members.length > 0 ? (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Members</h3>
          <div className="flex gap-2 flex-wrap">
            {project.members.map((m) => (
              <div key={m} className="px-3 py-1 rounded-full bg-muted text-sm">
                {m}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 border rounded-md">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Share invite (Project)</h4>
            <button
              className="inline-flex items-center gap-2"
              onClick={() =>
                copyToClipboard(`${location.origin}/event/${id}/Projects/${projectId}`)
              }
            >
              <Share2 className="w-4 h-4" /> Copy
            </button>
          </div>
          <div className="mt-3 flex items-center gap-4">
            {qrThumb ? (
              <img src={qrThumb} alt="QR invite" className="w-36 h-36" />
            ) : (
              <div className="w-36 h-36 bg-slate-100" />
            )}
            <div>
              <div className="text-sm text-muted-foreground">Link</div>
              <div className="text-sm text-blue-600">{`${location.origin}/event/${id}/Projects/${projectId}`}</div>
            </div>
          </div>
        </div>

        <div className="p-4 border rounded-md">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Share for Committee/Guest (VR)</h4>
            <button
              className="inline-flex items-center gap-2"
              onClick={() =>
                copyToClipboard(
                  `${location.origin}/event/${id}/Projects/${projectId}?role=committee`
                )
              }
            >
              <Share2 className="w-4 h-4" /> Copy
            </button>
          </div>
          <div className="mt-3 flex items-center gap-4">
            {qrThumbCommittee ? (
              <img src={qrThumbCommittee} alt="QR committee" className="w-36 h-36" />
            ) : (
              <div className="w-36 h-36 bg-slate-100" />
            )}
            <div>
              <div className="text-sm text-muted-foreground">Link</div>
              <div className="text-sm text-blue-600">{`${location.origin}/event/${id}/Projects/${projectId}?role=committee`}</div>
            </div>
          </div>
        </div>
      </div>

      <EditProjectDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        project={project}
        onSave={onSave}
      />
    </div>
  );
}
