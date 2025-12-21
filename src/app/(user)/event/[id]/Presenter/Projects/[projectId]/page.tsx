"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import * as QRCode from "qrcode";
import { toast } from "sonner";
import { Edit3, Share2, Users, FileText, Plus, Search, Loader2, X } from "lucide-react";
import { getTeamById, getEvent, uploadTeamFile, searchCandidates, addTeamMember } from "@/utils/apievent";
import EditProjectDialog from "../../components/EditProjectDialog";
import type { PresenterProject } from "../../components/types";
import type { EventData } from "@/utils/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

type Props = {
  params: { id: string; projectId: string };
};

export default function ProjectDetailPage({ params }: Props) {
  const paramsResolved = (React as any).use ? (React as any).use(params) : params;
  const { projectId, id } = paramsResolved as { projectId: string; id: string };
  const [project, setProject] = useState<PresenterProject | null>(null);
  const [membersData, setMembersData] = useState<any[]>([]);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  
  // Files Dialog
  const [filesOpen, setFilesOpen] = useState(false);

  // Invite Dialog
  const [inviteOpen, setInviteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [candidates, setCandidates] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [qrThumb, setQrThumb] = useState<string | null>(null);
  const [qrThumbCommittee, setQrThumbCommittee] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [teamRes, eventRes] = await Promise.all([
        getTeamById(id, projectId),
        getEvent(id),
      ]);

      if (teamRes.message === "ok") {
        const t = teamRes.team;
        setProject({
          id: t.id,
          title: t.teamName,
          desc: t.description || "",
          img: t.imageCover || "/project1.png",
          videoLink: t.videoLink,
          files:
            t.files?.map((f: any) => ({
              name: f.fileUrl.split("/").pop() || "File",
              url: f.fileUrl,
              fileTypeId: f.fileTypeId,
            })) || [],
          members:
            t.participants?.map((p: any) => p.user?.name || "Unknown") || [],
        });
        setMembersData(t.participants?.map((p: any) => ({
          id: p.user.id,
          name: p.user.name,
          username: p.user.username,
          image: p.user.image,
          isLeader: p.isLeader,
        })) || []);
      }

      if (eventRes.message === "ok") {
        setEventData(eventRes.event);
      }
    } catch (e) {
      console.error("Failed to fetch data", e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, projectId]);

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

  // Search Candidates
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        try {
          const res = await searchCandidates(id, searchQuery);
          setCandidates(res.candidates || []);
        } catch (e) {
          console.error(e);
        } finally {
          setIsSearching(false);
        }
      } else {
        setCandidates([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, id]);

  const handleAddMember = async (userId: string) => {
    try {
      const res = await addTeamMember(id, projectId, userId);
      if (res.message === "ok") {
        toast.success("Member added");
        setInviteOpen(false);
        setSearchQuery("");
        fetchData(); // Refresh list
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to add member");
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fileTypeId?: string
  ) => {
    const file = e.target.files?.[0];
    if (!file || !project || !fileTypeId) return;

    try {
      const res = await uploadTeamFile(id, project.id, fileTypeId, file);
      if (res.message === "ok") {
        const newUrl = res.teamFile.fileUrl;
        const name = file.name;

        setProject((prev) => {
          if (!prev) return null;
          const newFiles = [...(prev.files || [])];
          const existingIdx = newFiles.findIndex(
            (x) => x.fileTypeId === fileTypeId
          );
          if (existingIdx >= 0) {
            newFiles[existingIdx] = { name, url: newUrl, fileTypeId };
          } else {
            newFiles.push({ name, url: newUrl, fileTypeId });
          }
          return { ...prev, files: newFiles };
        });
        toast.success("File uploaded");
      }
    } catch (err) {
      toast.error("Upload failed");
    }
  };

  const copyToClipboard = (t: string) => {
    navigator.clipboard.writeText(t);
    toast.success("Copied to clipboard");
  };

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

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Header Section */}
      <Card>
        <div className="relative h-48 w-full bg-slate-100 rounded-t-lg overflow-hidden">
          {project.img ? (
            <Image src={project.img} alt={project.title} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-300 text-5xl font-bold">
              {project.title.charAt(0)}
            </div>
          )}
        </div>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
            <div className="space-y-4 flex-1">
              <div>
                <h1 className="text-3xl font-bold">{project.title}</h1>
                <p className="text-muted-foreground mt-2 leading-relaxed">
                  {project.desc || "No description provided."}
                </p>
              </div>
              
              <div className="flex gap-4">
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Project
                </Button>
                <Button variant="outline" size="sm" onClick={() => setFilesOpen(true)}>
                  <FileText className="w-4 h-4 mr-2" />
                  Manage Files
                  {project.files && project.files.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {project.files.length}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
               <Button variant="secondary" size="sm" onClick={() => copyToClipboard(`${location.origin}/event/${id}/Projects/${projectId}`)}>
                 <Share2 className="w-4 h-4 mr-2" />
                 Share
               </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Section */}
      {project.videoLink && (
        <Card>
          <CardHeader>
            <CardTitle>Project Video</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video rounded-lg overflow-hidden bg-black">
              <iframe
                src={project.videoLink}
                title={project.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Members
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setInviteOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Member
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {membersData.map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card text-card-foreground shadow-sm">
                <Avatar>
                  <AvatarImage src={m.image} />
                  <AvatarFallback>{m.name?.charAt(0) || "?"}</AvatarFallback>
                </Avatar>
                <div className="overflow-hidden">
                  <div className="font-medium truncate">{m.name}</div>
                  <div className="text-xs text-muted-foreground truncate">@{m.username || "user"}</div>
                  {m.isLeader && <Badge variant="secondary" className="mt-1 text-[10px] h-5">Leader</Badge>}
                </div>
              </div>
            ))}
            {membersData.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No members yet. Invite someone to join your team!
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Share Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Public Share Link</CardTitle>
            <CardDescription>Share this project with everyone</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
             {qrThumb ? (
              <img src={qrThumb} alt="QR invite" className="w-32 h-32 rounded border" />
            ) : (
              <div className="w-32 h-32 bg-slate-100 rounded animate-pulse" />
            )}
            <div className="flex-1 space-y-2">
              <div className="text-sm text-muted-foreground break-all">
                {`${location.origin}/event/${id}/Projects/${projectId}`}
              </div>
              <Button size="sm" variant="secondary" onClick={() => copyToClipboard(`${location.origin}/event/${id}/Projects/${projectId}`)}>
                Copy Link
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
             <CardTitle className="text-base">Committee / VR Link</CardTitle>
             <CardDescription>Share with committees or for VR viewing</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            {qrThumbCommittee ? (
              <img src={qrThumbCommittee} alt="QR committee" className="w-32 h-32 rounded border" />
            ) : (
              <div className="w-32 h-32 bg-slate-100 rounded animate-pulse" />
            )}
            <div className="flex-1 space-y-2">
              <div className="text-sm text-muted-foreground break-all">
                {`${location.origin}/event/${id}/Projects/${projectId}?role=committee`}
              </div>
              <Button size="sm" variant="secondary" onClick={() => copyToClipboard(`${location.origin}/event/${id}/Projects/${projectId}?role=committee`)}>
                Copy Link
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Files Dialog */}
      <Dialog open={filesOpen} onOpenChange={setFilesOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Project Files</DialogTitle>
            <DialogDescription>
              Upload required documents and files for your project.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {(eventData?.fileTypes || []).map((ft) => {
              const uploaded = project.files?.find((f) => f.fileTypeId === ft.id);
              const isPdf = uploaded?.url?.toLowerCase().endsWith(".pdf");

              return (
                <div key={ft.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        {ft.name}
                        {ft.isRequired && <Badge variant="destructive">Required</Badge>}
                        {uploaded && <Badge variant="default" className="bg-green-600">Uploaded</Badge>}
                      </div>
                      {ft.description && <p className="text-sm text-muted-foreground mt-1">{ft.description}</p>}
                      <p className="text-xs text-muted-foreground mt-1">Allowed: {ft.allowedFileTypes.join(", ")}</p>
                    </div>
                    
                    <div className="flex flex-col gap-2 items-end">
                      <Input
                        type="file"
                        id={`file-${ft.id}`}
                        className="hidden"
                        accept={ft.allowedFileTypes.map((t) => "." + t).join(",")}
                        onChange={(e) => handleFileUpload(e, ft.id)}
                      />
                      <Button variant="outline" size="sm" onClick={() => document.getElementById(`file-${ft.id}`)?.click()}>
                        {uploaded ? "Replace File" : "Upload File"}
                      </Button>
                      
                      {uploaded && (
                        <Button variant="link" size="sm" asChild className="h-auto p-0 text-blue-600">
                          <a href={uploaded.url} target="_blank" rel="noreferrer">
                            Download / View
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* PDF Preview */}
                  {uploaded && isPdf && (
                    <div className="mt-4 border rounded-md overflow-hidden bg-slate-50">
                      <div className="p-2 bg-slate-100 text-xs font-medium text-center border-b text-muted-foreground">
                        PDF Preview
                      </div>
                      <iframe 
                        src={`${uploaded.url}#toolbar=0`} 
                        className="w-full h-[400px]" 
                        title="PDF Preview"
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {(!eventData?.fileTypes || eventData.fileTypes.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                No specific file requirements for this event.
              </div>
            )}
          </div>
          <DialogFooter>
             <Button onClick={() => setFilesOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Member Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Search for a presenter by name or username to add them to your team.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or username..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="h-[200px] border rounded-md p-2 overflow-y-auto">
              {isSearching ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Searching...
                </div>
              ) : candidates.length > 0 ? (
                <div className="space-y-2">
                  {candidates.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-md group">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={c.image} />
                          <AvatarFallback>{c.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">{c.name}</div>
                          <div className="text-xs text-muted-foreground">@{c.username}</div>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100" onClick={() => handleAddMember(c.userId)}>
                        <Plus className="w-4 h-4" />
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              ) : searchQuery.length >= 2 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  No candidates found.
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Type at least 2 characters to search.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <EditProjectDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        project={project}
        onSuccess={fetchData}
        eventId={id}
      />
    </div>
  );
}
