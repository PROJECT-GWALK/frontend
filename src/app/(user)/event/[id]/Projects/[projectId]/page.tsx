"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import * as QRCode from "qrcode";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AxiosError } from "axios";
import {
  Users,
  FileText,
  Search,
  Plus,
  Share2,
  Edit3,
  Loader2,
  X,
  ChevronLeft,
  LogOut,
  Download,
} from "lucide-react";
import {
  getTeamById,
  getEvent,
  uploadTeamFile,
  searchCandidates,
  addTeamMember,
  getMyEvents,
  removeTeamMember,
  deleteTeamFile,
} from "@/utils/apievent";
import { getCurrentUser } from "@/utils/apiuser";
import EditProjectDialog from "../../Presenter/components/EditProjectDialog";
import type { PresenterProject } from "../../Presenter/components/types";
import { type EventData, FileType, type ProjectMember, type Candidate, type Team, type DraftEvent } from "@/utils/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { linkify, UserAvatar } from "@/utils/function";

type Props = {
  params: Promise<{ id: string; projectId: string }>;
};

export default function ProjectDetailPage({ params }: Props) {
  const router = useRouter();
  const paramsResolved = React.use(params);
  const { projectId, id } = paramsResolved;
  const [project, setProject] = useState<PresenterProject | null>(null);
  const [membersData, setMembersData] = useState<ProjectMember[]>([]);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [isMember, setIsMember] = useState(false);

  // Files Dialog
  const [filesOpen, setFilesOpen] = useState(false);

  // Invite Dialog
  const [inviteOpen, setInviteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Upload loading state per fileTypeId
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  const [qrThumb, setQrThumb] = useState<string | null>(null);
  const [qrThumbCommittee, setQrThumbCommittee] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [teamRes, eventRes, myEventsRes, currentUserRes] = await Promise.all([
        getTeamById(id, projectId),
        getEvent(id),
        getMyEvents(),
        getCurrentUser(),
      ]);

      if (teamRes.message === "not_found") {
        router.push(`/event/${id}`);
        return;
      }

      if (teamRes.message === "ok") {
        const t = teamRes.team as Team;
        let isUserMember = false;

        // Check if current user is member of the team
        if (currentUserRes.message === "ok") {
          const currentUser = currentUserRes.user;
          setCurrentUserId(currentUser.id);
          isUserMember = t.participants?.some(
            (p) => p.user.id === currentUser.id
          ) || false;
          setIsMember(isUserMember);
        }

        // Check if current user is leader based on getMyEvents
        const myEvent =
          myEventsRes.message === "ok"
            ? (myEventsRes.events as DraftEvent[]).find((e) => e.id === id)
            : null;
        const isLeader = myEvent?.isLeader || false;

        setProject({
          id: t.id,
          title: t.teamName,
          desc: t.description || "",
          img: t.imageCover,
          videoLink: t.videoLink,
          files:
            t.files?.map((f) => ({
              name: f.fileUrl.split("/").pop() || "File",
              url: f.fileUrl,
              fileTypeId: f.fileTypeId,
            })) || [],
          members:
            t.participants?.map((p) => p.user?.name || "Unknown") || [],
          isLeader: isLeader,
        });
        setMembersData(
          t.participants?.map((p) => ({
            id: p.user.id,
            name: p.user.name,
            username: p.user.username,
            image: p.user.image,
            isLeader: p.isLeader,
          })) || []
        );
      }

      if (eventRes.message === "ok") {
        setEventData(eventRes.event);
      }
    } catch (e) {
      console.error("Failed to fetch data", e);
    } finally {
      setLoading(false);
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
    } catch (e: unknown) {
      const msg = (e as AxiosError<{ message: string }>).response?.data?.message || "Failed to add member";
      toast.error(msg);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    try {
      const res = await removeTeamMember(id, projectId, userId);
      if (res.message === "ok") {
        toast.success("Member removed");
        fetchData();
      }
    } catch (e: unknown) {
      const msg = (e as AxiosError<{ message: string }>).response?.data?.message || "Failed to remove member";
      toast.error(msg);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement> | null,
    fileTypeId?: string,
    urlValue?: string
  ) => {
    if (!project || !fileTypeId) return;

    // Prevent duplicate uploads
    if (uploading[fileTypeId]) return;

    let fileOrUrl: File | string | undefined;
    if (e) {
      fileOrUrl = e.target.files?.[0];
    } else if (urlValue) {
      fileOrUrl = urlValue;
    }

    if (!fileOrUrl) return;

    setUploading((prev) => ({ ...prev, [fileTypeId]: true }));
    try {
      const res = await uploadTeamFile(id, project.id, fileTypeId, fileOrUrl);
      if (res.message === "ok") {
        const newUrl = res.teamFile.fileUrl;
        const name = fileOrUrl instanceof File ? fileOrUrl.name : "Link";

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
    } finally {
      setUploading((prev) => ({ ...prev, [fileTypeId]: false }));
    }
  };

  const handleDeleteFile = async (fileTypeId: string) => {
    if (!project || !confirm("Are you sure you want to delete this file?"))
      return;
    try {
      const res = await deleteTeamFile(id, project.id, fileTypeId);
      if (res.message === "ok") {
        setProject((prev) => {
          if (!prev) return null;
          const newFiles = (prev.files || []).filter(
            (f) => f.fileTypeId !== fileTypeId
          );
          return { ...prev, files: newFiles };
        });

        // Clear input if exists (for URL type)
        const input = document.getElementById(
          `url-input-${fileTypeId}`
        ) as HTMLInputElement;
        if (input) input.value = "";

        toast.success("File deleted");
      }
    } catch (e) {
      toast.error("Failed to delete file");
    }
  };

  const copyToClipboard = (t: string) => {
    navigator.clipboard.writeText(t);
    toast.success("Copied to clipboard");
  };

  const handleLeaveTeam = async () => {
    if (!currentUserId) return;
    try {
      const res = await removeTeamMember(id, projectId, currentUserId);
      if (res.message === "ok") {
        toast.success("You have left the team");
        router.push(`/event/${id}`);
      }
    } catch (e) {
      const msg = (e as AxiosError<{ message: string }>).response?.data?.message || "Failed to leave team";
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-8">
        <Skeleton className="h-10 w-32" />
        <Card>
          <Skeleton className="h-48 w-full rounded-t-lg" />
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
              <div className="space-y-4 flex-1">
                <div>
                  <Skeleton className="h-10 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <div className="flex gap-4">
                  <Skeleton className="h-9 w-32" />
                  <Skeleton className="h-9 w-32" />
                </div>
              </div>
              <Skeleton className="h-9 w-24" />
            </div>
          </CardContent>
        </Card>
        <Card>
           <CardHeader>
             <Skeleton className="h-6 w-48" />
           </CardHeader>
           <CardContent>
             <div className="space-y-4">
               {[1, 2, 3].map((i) => (
                 <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div>
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                 </div>
               ))}
             </div>
           </CardContent>
        </Card>
      </div>
    );
  }

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
      <div>
        <Button
          variant="ghost"
          className="gap-2 pl-0 text-muted-foreground hover:text-foreground"
          asChild
        >
          <Link href={`/event/${id}`}>
            <ChevronLeft className="w-4 h-4" />
            Back to Event Dashboard
          </Link>
        </Button>
      </div>

      {/* Header Section */}
      <Card>
        <div className="relative w-full aspect-video md:h-64 bg-slate-100 rounded-t-lg overflow-hidden">
          {project.img && !project.img.startsWith("data:image/png;base64src") ? (
            <Image
              src={project.img}
              alt={project.title}
              fill
              className="object-cover"
            />
          ) : (
            <Image
              src="/banner.png"
              alt={project.title}
              fill
              className="object-cover"
            />
          )}
        </div>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
            <div className="space-y-4 flex-1">
              <div>
                <h1 className="text-3xl font-bold">{project.title}</h1>
                <p className="text-muted-foreground mt-2 leading-relaxed">
                  {linkify(project.desc || "No description provided.")}
                </p>
              </div>

              <div className="flex gap-4">
                {isMember && !project.isLeader && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setLeaveDialogOpen(true)}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Leave Team
                  </Button>
                )}
                {project.isLeader && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditOpen(true)}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit Project
                    </Button>
                  </>
                )}
                {isMember && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilesOpen(true)}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Manage Files
                      {project.files && project.files.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {project.files.length}
                        </Badge>
                      )}
                    </Button>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  copyToClipboard(
                    `${location.origin}/event/${id}/Projects/${projectId}`
                  )
                }
              >
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
            Team Members{" "}
            <span className="text-muted-foreground text-sm font-normal">
              ({membersData.length} / {eventData?.maxTeamMembers || "-"})
            </span>
          </CardTitle>
          {project.isLeader && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInviteOpen(true)}
              disabled={
                !!eventData?.maxTeamMembers &&
                membersData.length >= eventData.maxTeamMembers
              }
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {membersData.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card text-card-foreground shadow-sm relative group"
              >
                <UserAvatar user={m} />
                <div className="overflow-hidden">
                  <div className="font-medium truncate">{m.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    @{m.username || "user"}
                  </div>
                  {m.isLeader && (
                    <Badge variant="secondary" className="mt-1 text-[10px] h-5">
                      Leader
                    </Badge>
                  )}
                </div>
                {project.isLeader && !m.isLeader && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveMember(m.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
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

      {/* Project Works Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Project Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6">
            {project.files && project.files.length > 0 ? (
              project.files.map((file, idx) => {
                const ft = eventData?.fileTypes?.find(
                  (t) => t.id === file.fileTypeId
                );
                const isPdf = file.url.toLowerCase().endsWith(".pdf");
                const isImage =
                  file.url.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;
                const isUrlType = ft?.allowedFileTypes?.includes(FileType.url);
                const isUploading = ft?.id ? uploading[ft.id] : false;

                // YouTube check
                const youtubeMatch = file.url.match(
                  /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
                );
                const isYoutube = !!youtubeMatch;
                const youtubeId = youtubeMatch ? youtubeMatch[1] : null;

                return (
                  <div key={idx} className="space-y-2">
                    <div className="font-semibold text-lg">
                      {ft?.name || file.name}
                    </div>
                    {ft?.description && (
                      <p className="text-sm text-muted-foreground">
                        {ft.description}
                      </p>
                    )}

                    <div className="border rounded-lg overflow-hidden bg-slate-50">
                      {isImage ? (
                        <div
                          className="relative w-full h-[400px] cursor-zoom-in group"
                          onClick={() => setPreviewImage(file.url)}
                        >
                          <Image
                            src={file.url}
                            alt={file.name}
                            fill
                            className="object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <Search className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 drop-shadow-lg transition-opacity" />
                          </div>
                          <div className="absolute bottom-0 right-0 p-3 flex justify-end">
                            <Button variant="outline" size="sm" asChild>
                              <a
                                href={file.url}
                                download
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Download className="w-4 h-4" />
                                Download Image
                              </a>
                            </Button>
                          </div>
                        </div>
                      ) : isPdf ? (
                        <div className="flex flex-col">
                            <iframe
                            src={`${file.url}#toolbar=0`}
                            className="w-full h-[500px]"
                            title={file.name}
                            />
                            <div className="p-3 bg-white border-t flex justify-end">
                                <Button variant="outline" size="sm" asChild>
                                    <a
                                    href={file.url}
                                    download
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2"
                                    >
                                    <Download className="w-4 h-4" />
                                    Download PDF
                                    </a>
                                </Button>
                            </div>
                        </div>
                      ) : isYoutube && youtubeId ? (
                        <div className="aspect-video w-full">
                          <iframe
                            src={`https://www.youtube.com/embed/${youtubeId}`}
                            title={file.name}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          {/* Preview attempt for other links if it is a URL type */}
                          {isUrlType && (
                            <div className="w-full h-[400px] bg-white border-b relative">
                              <iframe
                                src={file.url}
                                className="w-full h-full"
                                title={file.name}
                                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                              />
                            </div>
                          )}
                          <div className="p-4 flex items-center justify-between bg-slate-50">
                            <div className="truncate flex-1 mr-4 text-blue-600 underline">
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {file.url}
                              </a>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Open Link
                              </a>
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No works uploaded yet.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Banner Dialog */}
      <Dialog open={bannerOpen} onOpenChange={setBannerOpen}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden bg-transparent border-none shadow-none">
          <DialogTitle className="sr-only">Event Banner</DialogTitle>
          <div className="relative w-full aspect-video">
            <Image
              src={
                eventData?.imageCover &&
                !eventData.imageCover.startsWith("data:image/png;base64src")
                  ? eventData.imageCover
                  : "/banner.png"
              }
              alt={eventData?.eventName || "Event banner"}
              fill
              className="object-contain rounded-lg"
            />
            <DialogClose className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2">
              <X className="w-5 h-5" />
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog
        open={!!previewImage}
        onOpenChange={(open) => !open && setPreviewImage(null)}
      >
        <DialogContent className="max-w-[90vw] h-[90vh] p-0 overflow-hidden bg-transparent border-none shadow-none flex items-center justify-center">
          <DialogTitle className="sr-only">Image Preview</DialogTitle>
          <div className="relative w-full h-full">
            {previewImage && (
              <Image
                src={previewImage}
                alt="Preview"
                fill
                className="object-contain"
                priority
              />
            )}
            <DialogClose className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 z-50">
              <X className="w-6 h-6" />
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>

      {/* Files Dialog */}
      <Dialog open={filesOpen} onOpenChange={setFilesOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Project Files</DialogTitle>
            <DialogDescription>
              Upload required documents and files for your project.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {(eventData?.fileTypes || []).map((ft) => {
              const uploaded = project.files?.find(
                (f) => f.fileTypeId === ft.id
              );
              const isUrlType = ft.allowedFileTypes.includes(FileType.url);
              const isUploading = ft.id ? uploading[ft.id] : false;

              return (
                <div
                  key={ft.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 border rounded-lg p-4 bg-slate-50/50"
                >
                  {/* Info Section */}
                  <div className="md:col-span-5 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{ft.name}</span>
                      {ft.isRequired && (
                        <Badge variant="destructive" className="text-[10px]">
                          Required
                        </Badge>
                      )}
                      {uploaded && (
                        <Badge className="bg-green-600 hover:bg-green-700 text-[10px]">
                          Uploaded
                        </Badge>
                      )}
                    </div>
                    {ft.description && (
                      <p className="text-sm text-muted-foreground">
                        {ft.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground font-mono bg-slate-100 w-fit px-1 rounded">
                      Allowed: {ft.allowedFileTypes.join(", ")}
                    </p>
                  </div>

                  {/* Actions Section */}
                  <div className="md:col-span-7 flex flex-col justify-center gap-3">
                    {isUrlType ? (
                      <div className="flex flex-col gap-2 w-full">
                        <div className="flex gap-2 w-full items-center">
                          <Input
                            id={`url-input-${ft.id}`}
                            placeholder="https://..."
                            defaultValue={uploaded?.url || ""}
                            disabled={isUploading}
                            className="text-sm bg-white"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleFileUpload(
                                  null,
                                  ft.id,
                                  e.currentTarget.value
                                );
                              }
                            }}
                            onBlur={(e) => {
                              if (
                                e.target.value &&
                                e.target.value !== uploaded?.url
                              ) {
                                handleFileUpload(null, ft.id, e.target.value);
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            disabled={isUploading}
                            onClick={() => {
                              const input = document.getElementById(
                                `url-input-${ft.id}`
                              ) as HTMLInputElement;
                              if (input) {
                                handleFileUpload(null, ft.id, input.value);
                              }
                            }}
                          >
                            {isUploading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Save"
                            )}
                          </Button>
                        </div>

                        {/* Secondary Actions Row */}
                        <div className="flex justify-end gap-2">
                          {uploaded && (
                            <>
                              <Button size="sm" variant="outline" asChild>
                                <a
                                  href={uploaded.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-2"
                                >
                                  <Share2 className="w-3 h-3" /> Open Link
                                </a>
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteFile(ft.id!)}
                              >
                                <X className="w-3 h-3 mr-1" /> Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end gap-2 w-full">
                        <Input
                          type="file"
                          id={`file-${ft.id}`}
                          className="hidden"
                          accept={ft.allowedFileTypes
                            .map((t) => "." + t)
                            .join(",")}
                          onChange={(e) => handleFileUpload(e, ft.id)}
                          disabled={isUploading}
                        />
                        <div className="flex gap-2 w-full justify-end">
                          <Button
                            variant={uploaded ? "outline" : "default"}
                            size="sm"
                            disabled={isUploading}
                            onClick={() =>
                              document.getElementById(`file-${ft.id}`)?.click()
                            }
                          >
                            {isUploading ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <Plus className="w-4 h-4 mr-2" />
                            )}
                            {uploaded ? "Replace File" : "Upload File"}
                          </Button>
                        </div>

                        {uploaded && (
                          <div className="flex gap-2 justify-end w-full">
                            <Button size="sm" variant="secondary" asChild>
                              <a
                                href={uploaded.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2"
                              >
                                <FileText className="w-3 h-3" /> Download
                              </a>
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => ft.id && handleDeleteFile(ft.id)}
                            >
                              <X className="w-3 h-3 mr-1" /> Delete
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
              Search for a presenter by name or username to add them to your
              team.
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
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-md group"
                    >
                      <div className="flex items-center gap-3">
                        <UserAvatar user={c} className="w-8 h-8" />
                        <div>
                          <div className="text-sm font-medium">{c.name}</div>
                          <div className="text-xs text-muted-foreground">
                            @{c.username}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100"
                        onClick={() => handleAddMember(c.userId)}
                      >
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

      {/* Leave Team Confirmation Dialog */}
      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Team</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave this team? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLeaveTeam}>
              Leave Team
            </Button>
          </DialogFooter>
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
