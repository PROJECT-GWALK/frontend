"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import * as QRCode from "qrcode";
import { toast } from "sonner";
import {
  Share2,
  Users,
  FileText,
  Search,
  ChevronLeft,
} from "lucide-react";
import {
  getTeamById,
  getEvent,
  getMyEvents,
} from "@/utils/apievent";
import type { PresenterProject } from "../../Presenter/components/types";
import { type EventData, FileType } from "@/utils/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

import { useParams } from "next/navigation";

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const projectId = params?.projectId as string;
  
  const [project, setProject] = useState<PresenterProject | null>(null);
  const [membersData, setMembersData] = useState<any[]>([]);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);

  const [bannerOpen, setBannerOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [qrThumb, setQrThumb] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [teamRes, eventRes, myEventsRes] = await Promise.all([
        getTeamById(id, projectId),
        getEvent(id),
        getMyEvents(),
      ]);

      if (teamRes.message === "ok") {
        const t = teamRes.team;

        // Check if current user is leader based on getMyEvents
        const myEvent =
          myEventsRes.message === "ok"
            ? myEventsRes.events.find((e: any) => e.id === id)
            : null;
        const isLeader = myEvent?.isLeader || false;

        setProject({
          id: t.id,
          title: t.teamName,
          desc: t.description || "",
          img: t.imageCover,
          videoLink: t.videoLink,
          files:
            t.files?.map((f: any) => ({
              name: f.fileUrl.split("/").pop() || "File",
              url: f.fileUrl,
              fileTypeId: f.fileTypeId,
            })) || [],
          members:
            t.participants?.map((p: any) => p.user?.name || "Unknown") || [],
          isLeader: isLeader,
        });
        setMembersData(
          t.participants?.map((p: any) => ({
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
      try {
        const thumb = await QRCode.toDataURL(link, { width: 240 });
        setQrThumb(thumb);
      } catch (e) {
        // ignore
      }
    };
    gen();
  }, [id, projectId]);

  const copyToClipboard = (t: string) => {
    navigator.clipboard.writeText(t);
    toast.success("Copied to clipboard");
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-8">
        <div>
          <Skeleton className="h-10 w-48 mb-6" />
        </div>
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
              </div>
              <Skeleton className="h-9 w-24" />
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
        <div className="relative h-48 w-full bg-slate-100 rounded-t-lg overflow-hidden">
          {project.img ? (
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
                  {project.desc || "No description provided."}
                </p>
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
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {membersData.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card text-card-foreground shadow-sm relative group"
              >
                <Avatar>
                  <AvatarImage src={m.image} />
                  <AvatarFallback>{m.name?.charAt(0) || "?"}</AvatarFallback>
                </Avatar>
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
              </div>
            ))}
            {membersData.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No members yet.
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
                        </div>
                      ) : isPdf ? (
                        <iframe
                          src={`${file.url}#toolbar=0`}
                          className="w-full h-[500px]"
                          title={file.name}
                        />
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

      {/* Share Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Public Share Link</CardTitle>
            <CardDescription>Share this project with everyone</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            {qrThumb ? (
              <img
                src={qrThumb}
                alt="QR invite"
                className="w-32 h-32 rounded border"
              />
            ) : (
              <div className="w-32 h-32 bg-slate-100 rounded animate-pulse" />
            )}
            <div className="flex-1 space-y-2">
              <div className="text-sm text-muted-foreground break-all">
                {`${location.origin}/event/${id}/Projects/${projectId}`}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  copyToClipboard(
                    `${location.origin}/event/${id}/Projects/${projectId}`
                  )
                }
              >
                <Share2 className="w-3 h-3 mr-2" />
                Copy Link
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

       {/* Image Preview Dialog */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl w-full h-full max-h-[90vh]">
            <Image
              src={previewImage}
              alt="Preview"
              fill
              className="object-contain"
            />
            <button
              className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70"
              onClick={() => setPreviewImage(null)}
            >
              <Search className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
