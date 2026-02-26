"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
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
  ChevronDown,
  ChevronUp,
  LogOut,
  Download,
  ClipboardCopy,
  ArrowLeft,
  Gift,
  Trophy,
  AlertCircle,
} from "lucide-react";
import {
  getTeamById,
  getEvent,
  uploadTeamFile,
  searchCandidates,
  addTeamMember,
  removeTeamMember,
  deleteTeamFile,
  giveVr,
  giveSpecial,
} from "@/utils/apievent";
import { getCurrentUser } from "@/utils/apiuser";
import EditProjectDialog from "../../Presenter/components/EditProjectDialog";
import CommentSection from "../../Presenter/components/Comment";
import CommitteeGradingForm from "../../Presenter/components/CommitteeGradingForm";
import type { PresenterProject } from "../../Presenter/components/types";
import {
  type EventData,
  FileType,
  type ProjectMember,
  type Candidate,
  type Team,
} from "@/utils/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { linkify, UserAvatar, generateQrCode } from "@/utils/function";
import SelectTeam from "../../components/selectTeam";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  params: Promise<{ id: string; projectId: string }>;
};

export default function ProjectDetailPage({ params }: Props) {
  const { t } = useLanguage();
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
  const [isDescExpanded, setIsDescExpanded] = useState(false);

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

  // Evaluation State
  const [virtualReward, setVirtualReward] = useState<number>(0);
  const [selectedSpecialRewards, setSelectedSpecialRewards] = useState<
    string[]
  >([]);
  const [savingVr, setSavingVr] = useState(false);
  const [savingSpecial, setSavingSpecial] = useState(false);

  // Derived state for Evaluation
  const myVirtualTotal = eventData?.myVirtualTotal || 0;
  const myVirtualUsed = eventData?.myVirtualUsed || 0;

  const isEventActive = eventData
    ? new Date() >= new Date(eventData.startView || "") &&
      new Date() <= new Date(eventData.endView || "")
    : false;

  const isSubmissionActive = eventData
    ? (!eventData.startJoinDate ||
        new Date() >= new Date(eventData.startJoinDate)) &&
      (!eventData.endJoinDate || new Date() <= new Date(eventData.endJoinDate))
    : true;

  const vrTeamCapEnabled = eventData?.vrTeamCapEnabled ?? true;
  const vrTeamCap =
    eventData?.myRole === "COMMITTEE"
      ? (eventData?.vrTeamCapCommittee ?? 20)
      : (eventData?.vrTeamCapGuest ?? 10);
  const totalVrForThisTeam = Math.max(0, Number(virtualReward || 0));
  const isVrOverTeamCap =
    (eventData?.myRole === "COMMITTEE" || eventData?.myRole === "GUEST") &&
    vrTeamCapEnabled &&
    totalVrForThisTeam > vrTeamCap;

  const handleSaveVr = async () => {
    if (!eventData || !project) return;
    try {
      setSavingVr(true);
      const res = await giveVr(id, projectId, Number(virtualReward));

      // Update local state directly from response
      setEventData((prev) =>
        prev
          ? {
              ...prev,
              myVirtualTotal: res.totalLimit,
              myVirtualUsed: res.totalUsed,
            }
          : prev,
      );

      toast.success(t("projectDetail.messages.vrSaved"));
    } catch (error: unknown) {
      const fallback = t("projectDetail.messages.vrSaveFailed");
      let message = fallback;
      if (error instanceof AxiosError) {
        message = error.response?.data?.message || fallback;
      } else if (error instanceof Error && error.message) {
        message = error.message;
      }
      toast.error(message);
    } finally {
      setSavingVr(false);
    }
  };

  const handleSaveSpecial = async () => {
    try {
      setSavingSpecial(true);
      await giveSpecial(id, projectId, selectedSpecialRewards);
      toast.success(t("projectDetail.messages.specialRewardsSaved"));
    } catch (error: unknown) {
      const fallback = t("projectDetail.messages.specialRewardsSaveFailed");
      let message = fallback;
      if (error instanceof AxiosError) {
        message = error.response?.data?.message || fallback;
      } else if (error instanceof Error && error.message) {
        message = error.message;
      }
      toast.error(message);
    } finally {
      setSavingSpecial(false);
    }
  };

  const toggleSpecialReward = (rewardId: string) => {
    setSelectedSpecialRewards((prev) => {
      if (prev.includes(rewardId)) {
        return prev.filter((id) => id !== rewardId);
      } else {
        return [...prev, rewardId];
      }
    });
  };

  const specialRewardsById = new Map(
    (eventData?.specialRewards ?? []).map((r) => [r.id, r] as const),
  );
  const selectedSpecialRewardItems = selectedSpecialRewards.map((rewardId) => {
    const reward = specialRewardsById.get(rewardId);
    return {
      id: rewardId,
      name: reward?.name ?? rewardId,
    };
  });
  const selectedSpecialRewardsSummary = (() => {
    if (selectedSpecialRewardItems.length === 0) return "";
    const names = selectedSpecialRewardItems.map((r) => r.name);
    if (names.length <= 2) return names.join(", ");
    return `${names[0]}, ${names[1]} +${names.length - 2}`;
  })();

  const isRewardDisabled = (rewardId: string) => {
    const isUnused = eventData?.awardsUnused?.some((r) => r.id === rewardId);

    const currentlySelected = selectedSpecialRewards.includes(rewardId);
    return !isUnused && !currentlySelected;
  };

  const [shareOpen, setShareOpen] = useState(false);
  const [shareQrSrc, setShareQrSrc] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [teamRes, eventRes] = await Promise.all([
        getTeamById(id, projectId),
        getEvent(id),
      ]);
      let currentUserRes: Awaited<ReturnType<typeof getCurrentUser>> | null = null;
      try {
        currentUserRes = await getCurrentUser();
      } catch {}

      if (teamRes.message === "not_found") {
        router.push(`/event/${id}`);
        return;
      }

      if (teamRes.message === "ok") {
        const t = teamRes.team as Team;
        setVirtualReward(t.myReward || 0);
        setSelectedSpecialRewards(t.mySpecialRewards || []);
        let isUserMember = false;

        // Check if current user is member of the team
        if (currentUserRes?.message === "ok") {
          const currentUser = currentUserRes.user;
          setCurrentUserId(currentUser.id);
          isUserMember =
            t.participants?.some((p) => p.user.id === currentUser.id) || false;
          setIsMember(isUserMember);
        }

        // Check if user is leader of THIS team
        let isTeamLeader = false;
        if (currentUserRes?.message === "ok") {
          const currentUser = currentUserRes.user;
          const userInTeam = t.participants?.find(
            (p) => p.user.id === currentUser.id,
          );
          if (userInTeam && userInTeam.isLeader) {
            isTeamLeader = true;
          }
        }

        // Final permission: Only Team Leader can edit
        const canEdit = isTeamLeader;

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
          members: t.participants?.map((p) => p.user?.name || "Unknown") || [],
          isLeader: canEdit,
        });
        setMembersData(
          t.participants?.map((p) => ({
            id: p.user.id,
            name: p.user.name,
            username: p.user.username,
            image: p.user.image,
            isLeader: p.isLeader,
          })) || [],
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
  }, [id, projectId, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
        toast.success(t("projectDetail.messages.memberAdded"));
        setInviteOpen(false);
        setSearchQuery("");
        fetchData(); // Refresh list
      }
    } catch (e: unknown) {
      const msg =
        (e as AxiosError<{ message: string }>).response?.data?.message ||
        t("projectDetail.messages.addMemberFailed");
      toast.error(msg);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm(t("projectDetail.messages.confirmRemoveMember"))) return;
    try {
      const res = await removeTeamMember(id, projectId, userId);
      if (res.message === "ok") {
        toast.success(t("projectDetail.messages.memberRemoved"));
        fetchData();
      }
    } catch (e: unknown) {
      const msg =
        (e as AxiosError<{ message: string }>).response?.data?.message ||
        t("projectDetail.messages.removeMemberFailed");
      toast.error(msg);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement> | null,
    fileTypeId?: string,
    urlValue?: string,
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
        const name =
          fileOrUrl instanceof File
            ? fileOrUrl.name
            : t("projectDetail.files.defaultLinkName");

        setProject((prev) => {
          if (!prev) return null;
          const newFiles = [...(prev.files || [])];
          const existingIdx = newFiles.findIndex(
            (x) => x.fileTypeId === fileTypeId,
          );
          if (existingIdx >= 0) {
            newFiles[existingIdx] = { name, url: newUrl, fileTypeId };
          } else {
            newFiles.push({ name, url: newUrl, fileTypeId });
          }
          return { ...prev, files: newFiles };
        });
        toast.success(t("projectDetail.messages.fileUploaded"));
      }
    } catch {
      toast.error(t("projectDetail.messages.uploadFailed"));
    } finally {
      setUploading((prev) => ({ ...prev, [fileTypeId]: false }));
    }
  };

  const handleDeleteFile = async (fileTypeId: string) => {
    if (!project || !confirm(t("projectDetail.messages.confirmDeleteFile")))
      return;
    try {
      const res = await deleteTeamFile(id, project.id, fileTypeId);
      if (res.message === "ok") {
        setProject((prev) => {
          if (!prev) return null;
          const newFiles = (prev.files || []).filter(
            (f) => f.fileTypeId !== fileTypeId,
          );
          return { ...prev, files: newFiles };
        });

        // Clear input if exists (for URL type)
        const input = document.getElementById(
          `url-input-${fileTypeId}`,
        ) as HTMLInputElement;
        if (input) input.value = "";

        toast.success(t("projectDetail.messages.fileDeleted"));
      }
    } catch {
      toast.error(t("projectDetail.messages.deleteFileFailed"));
    }
  };

  const copyToClipboard = (tText: string) => {
    navigator.clipboard.writeText(tText);
    toast.success(t("projectDetail.messages.copiedToClipboard"));
  };

  const handleLeaveTeam = async () => {
    if (!currentUserId) return;
    try {
      const res = await removeTeamMember(id, projectId, currentUserId);
      if (res.message === "ok") {
        toast.success(t("projectDetail.messages.leftTeam"));
        router.push(`/event/${id}`);
      }
    } catch (e) {
      const msg =
        (e as AxiosError<{ message: string }>).response?.data?.message ||
        t("projectDetail.messages.leaveTeamFailed");
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl space-y-8 bg-background">
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
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
          <Search className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-3">
          {t("projectDetail.messages.projectNotFound")}
        </h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          {t("projectDetail.messages.projectNotFoundDetail") || t("projectDetail.messages.ProjectNotFoundDesc")}
        </p>
        <Link href={`/event/${id}`}>
          <Button variant="default" size="lg">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("projectDetail.buttons.backToProjects")}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex justify-center bg-background">
      <div className="w-full max-w-6xl mx-auto mt-6 space-y-8 animate-in fade-in duration-500 bg-background text-foreground">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href={`/event/${id}`}>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {t("projectDetail.title")}
                </h1>
                {eventData?.myRole && (
                  <Badge
                    variant="secondary"
                    className="text-xs text-white"
                    style={{
                      backgroundColor: `var(--role-${eventData.myRole.toLowerCase()})`,
                    }}
                  >
                    {eventData.myRole}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {t("projectDetail.viewDetailsFor")}{" "}
                <span className="font-bold">{project.title}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <SelectTeam className="w-full md:w-62.5" />
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative group rounded-xl overflow-hidden shadow-sm border bg-card">
          <div
            className="relative w-full overflow-hidden cursor-pointer"
            onClick={() => setBannerOpen(true)}
          >
            {project.img &&
            !project.img.startsWith("data:image/png;base64src") ? (
              <Image
                src={project.img}
                alt={project.title}
                width={1200}
                height={600}
                sizes="100vw"
                className="w-full h-auto transition-transform duration-700 opacity-90"
              />
            ) : (
              <Image
                src="/banner.png"
                alt={project.title}
                width={1200}
                height={600}
                sizes="100vw"
                className="w-full h-auto transition-transform duration-700 opacity-90"
              />
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent" />

            <div className="absolute bottom-0 left-0 p-6 md:p-10 text-white w-full max-w-4xl z-10">
              <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight drop-shadow-lg leading-tight backdrop-blur-md bg-black/30 rounded-lg px-4 py-2 w-fit">
                {project.title}
              </h1>
            </div>
          </div>

          {/* Action Bar */}
          <div className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between bg-card border-t">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Badge
                variant="outline"
                className="px-3 py-1 text-sm font-normal border-border"
              >
                {eventData?.eventName || t("projectDetail.defaultEventName")}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-2 items-center justify-center sm:justify-end w-full sm:w-auto">
              <Button
                variant="secondary"
                size="sm"
                className="shadow-sm"
                onClick={async () => {
                  const url = `${window.location.origin}/event/${id}/Projects/${projectId}`;
                  const qr = await generateQrCode(url);
                  setShareQrSrc(qr);
                  setShareOpen(true);
                }}
              >
                <Share2 className="w-4 h-4 mr-2" />
                {t("projectDetail.buttons.share")}
              </Button>

              {isMember && !project.isLeader && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="shadow-sm"
                  onClick={() => setLeaveDialogOpen(true)}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {t("projectDetail.buttons.leaveTeam")}
                </Button>
              )}

              {project.isLeader && (
                <Button
                  variant="outline"
                  size="sm"
                  className="shadow-sm border-primary/20 hover:border-primary/50 hover:bg-primary/5"
                  onClick={() => setEditOpen(true)}
                  disabled={!isSubmissionActive}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  {t("projectDetail.buttons.editProject")}
                </Button>
              )}

              {isMember && (
                <Button
                  variant="outline"
                  size="sm"
                  className="shadow-sm"
                  onClick={() => setFilesOpen(true)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {t("projectDetail.buttons.manageFiles")}
                  {project.files && project.files.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-2 h-5 min-w-5 px-1"
                    >
                      {project.files.length}
                    </Badge>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {project.isLeader && !isSubmissionActive && (
          <Card className="border-l-4 border-l-destructive bg-destructive/10 mb-6">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm font-medium text-destructive">
                {t("projectDetail.messages.submissionEnded") ||
                  "Submission period has ended. You cannot edit this project."}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Video & Works */}
          <div className="lg:col-span-2 space-y-8">
            {/* Project Description */}
            <Card className="border-none shadow-md overflow-hidden bg-card">
              <CardHeader className="border-b px-6 py-4">
                <CardTitle className="text-xl flex items-center gap-2 text-foreground">
                  <FileText className="w-5 h-5 text-primary" />
                  {t("projectDetail.sections.description") ||
                    "Project Description"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div
                  className={`text-muted-foreground whitespace-pre-wrap leading-relaxed transition-all duration-300 ${
                    isDescExpanded ? "" : "line-clamp-4 relative"
                  }`}
                >
                  {linkify(project.desc || t("projectDetail.noDescription"))}
                  {!isDescExpanded &&
                    project.desc &&
                    project.desc.length > 300 && (
                      <div className="absolute bottom-0 left-0 w-full h-12 bg-linear-to-t from-card to-transparent" />
                    )}
                </div>
                {project.desc && project.desc.length > 300 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 w-full flex items-center justify-center text-primary hover:text-primary/80"
                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                  >
                    {isDescExpanded ? (
                      <>
                        {t("projectDetail.buttons.readLess")}
                        <ChevronUp className="ml-2 w-4 h-4" />
                      </>
                    ) : (
                      <>
                        {t("projectDetail.buttons.readMore")}
                        <ChevronDown className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Video Section */}
            {project.videoLink && (
              <Card className="border-none shadow-md overflow-hidden">
                <CardHeader className="border-b px-6 py-4">
                  <CardTitle className="text-xl flex items-center gap-2">
                    {t("projectDetail.sections.projectVideo")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="aspect-video w-full bg-black">
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

            {/* Project Works Display */}
            <Card className="border-none shadow-md overflow-hidden bg-card">
              <CardHeader className="border-b px-6 py-4">
                <CardTitle className="text-xl flex items-center gap-2 text-foreground">
                  <FileText className="w-5 h-5 text-primary" />
                  {t("projectDetail.sections.projectWorks")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 gap-8">
                  {project.files && project.files.length > 0 ? (
                    project.files.map((file, idx) => {
                      const ft = eventData?.fileTypes?.find(
                        (t) => t.id === file.fileTypeId,
                      );
                      const isPdf = file.url.toLowerCase().endsWith(".pdf");
                      const isImage =
                        file.url.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;
                      const isUrlType = ft?.allowedFileTypes?.includes(
                        FileType.url,
                      );

                      // YouTube check
                      const youtubeMatch = file.url.match(
                        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
                      );
                      const isYoutube = !!youtubeMatch;
                      const youtubeId = youtubeMatch ? youtubeMatch[1] : null;

                      return (
                        <div key={idx} className="space-y-3">
                          <div className="flex items-baseline justify-between border-b pb-2 border-border">
                            <h3 className="font-semibold text-lg text-foreground">
                              {ft?.name || file.name}
                            </h3>
                            {ft?.description && (
                              <span className="text-sm text-muted-foreground ml-4 text-right">
                                {ft.description}
                              </span>
                            )}
                          </div>

                          <div className="rounded-xl overflow-hidden border bg-muted/30 shadow-sm">
                            {isImage ? (
                              <div
                                className="relative w-full h-100 cursor-zoom-in group bg-muted"
                                onClick={() => setPreviewImage(file.url)}
                              >
                                <Image
                                  src={file.url}
                                  alt={file.name}
                                  fill
                                  className="object-contain p-2 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                  <Search className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 drop-shadow-lg transition-opacity" />
                                </div>
                                <div className="absolute bottom-0 right-0 p-3 flex justify-end pointer-events-none group-hover:pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    asChild
                                    className="shadow-lg"
                                  >
                                    <a
                                      href={file.url}
                                      download
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex items-center gap-2"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Download className="w-4 h-4" />
                                      {t("projectDetail.files.downloadImage")}
                                    </a>
                                  </Button>
                                </div>
                              </div>
                            ) : isPdf ? (
                              <div className="flex flex-col">
                                <iframe
                                  src={`${file.url}#toolbar=0`}
                                  className="w-full h-150"
                                  title={file.name}
                                />
                                <div className="p-3 bg-card border-t flex justify-end">
                                  <Button variant="outline" size="sm" asChild>
                                    <a
                                      href={file.url}
                                      download
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex items-center gap-2"
                                    >
                                      <Download className="w-4 h-4" />
                                      {t("projectDetail.files.downloadPDF")}
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
                                  <div className="w-full h-100 bg-card border-b relative">
                                    <iframe
                                      src={file.url}
                                      className="w-full h-full"
                                      title={file.name}
                                      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                                    />
                                  </div>
                                )}
                                <div className="p-4 flex items-center justify-between bg-muted/50">
                                  <div className="truncate flex-1 mr-4 text-primary underline">
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
                                      {t("projectDetail.buttons.openLink")}
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
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-muted/50 rounded-xl border border-dashed">
                      <FileText className="w-12 h-12 mb-3 opacity-20" />
                      <p>{t("projectDetail.noWorks")}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Evaluation Section (Committee/Guest only) */}
            {(eventData?.myRole === "COMMITTEE" ||
              eventData?.myRole === "GUEST") && (
              <>
                {!isEventActive && (
                  <Card className="border-l-4 border-l-destructive bg-destructive/10 mb-6">
                    <CardContent className="p-4 flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      <p className="text-sm font-medium text-destructive">
                        {t("projectDetail.messages.eventEnded") ||
                          "Event has ended or not in active period. Actions are restricted."}
                      </p>
                    </CardContent>
                  </Card>
                )}
                {/* Reward Section (Committee/Guest) */}
                <Card className="border-none shadow-md bg-card">
                  <CardHeader className="border-b px-6 py-4">
                    <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                      <Gift className="w-5 h-5 text-purple-600" />
                      {t("projectDetail.sections.evaluation")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <Tabs defaultValue="virtual" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-muted border rounded-lg mb-6">
                        <TabsTrigger
                          value="virtual"
                          className="flex items-center gap-2 py-2"
                        >
                          <Gift className="w-4 h-4" />
                          <span>
                            {t("projectDetail.evaluation.virtualReward")}
                          </span>
                        </TabsTrigger>
                        {eventData?.myRole === "COMMITTEE" && (
                          <TabsTrigger
                            value="special"
                            className="flex items-center gap-2 py-2"
                          >
                            <Trophy className="w-4 h-4" />
                            <span>
                              {t("projectDetail.evaluation.specialReward")}
                            </span>
                          </TabsTrigger>
                        )}
                      </TabsList>

                      <TabsContent value="virtual" className="space-y-6 mt-0">
                        <div className="space-y-3">
                          <div className="flex justify-between items-end">
                            <p className="text-sm font-bold">
                              {t("projectDetail.evaluation.budgetUsage")}
                            </p>
                            <span className="text-sm font-medium text-foreground">
                              {myVirtualTotal}{" "}
                              {eventData?.unitReward ??
                                t("projectDetail.evaluation.coins")}
                            </span>
                          </div>
                          <div className="relative h-3 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              className="absolute top-0 left-0 h-full bg-purple-600 transition-all duration-500 ease-out rounded-full"
                              style={{
                                width: `${Math.min(100, (myVirtualUsed / (myVirtualTotal || 1)) * 100)}%`,
                              }}
                            />
                          </div>
                          <div className="flex justify-between items-end">
                            <p className="text-sm font-medium text-foreground">
                              {myVirtualUsed}{" "}
                              {t("projectDetail.evaluation.used")}
                            </p>
                            <span className="text-sm font-medium text-foreground">
                              {myVirtualTotal - myVirtualUsed}{" "}
                              {t("projectDetail.evaluation.left")}
                            </span>
                          </div>
                        </div>

                        <div
                          className={`rounded-lg border p-3 ${
                            isVrOverTeamCap
                              ? "border-destructive bg-destructive/5"
                              : ""
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-semibold">
                              {t("projectDetail.evaluation.vrTeamCapTitle")}
                              {vrTeamCapEnabled ? (
                                <>
                                  : {vrTeamCap}{" "}
                                  {eventData?.unitReward ??
                                    t("projectDetail.evaluation.coins")}
                                </>
                              ) : (
                                t("projectDetail.evaluation.vrTeamCapNoLimit")
                              )}
                            </div>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span>
                              {t("projectDetail.evaluation.vrTeamCapCurrent")}:{" "}
                              {totalVrForThisTeam}
                              {" | "}
                              {vrTeamCapEnabled ? (
                                <span>
                                  {t(
                                    "projectDetail.evaluation.vrTeamCapRemaining",
                                  )}
                                  :{" "}
                                  {Math.max(0, vrTeamCap - totalVrForThisTeam)}
                                </span>
                              ) : null}
                            </span>
                          </div>
                          {isVrOverTeamCap ? (
                            <div className="text-xs font-medium text-destructive mt-1">
                              {t("projectDetail.evaluation.vrTeamCapExceeded")}
                            </div>
                          ) : null}
                        </div>

                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {[100, 500, 1000].map((amount) => (
                              <Button
                                key={amount}
                                variant="outline"
                                size="sm"
                                onClick={() => setVirtualReward(amount)}
                                className="h-7 text-xs"
                                disabled={!isEventActive}
                              >
                                {amount}
                              </Button>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setVirtualReward(
                                  Math.min(
                                    myVirtualTotal - myVirtualUsed,
                                    vrTeamCapEnabled
                                      ? vrTeamCap
                                      : myVirtualTotal - myVirtualUsed,
                                  ),
                                )
                              }
                              className="h-7 text-xs text-purple-600 border-purple-200"
                              disabled={!isEventActive}
                            >
                              {t("projectDetail.buttons.max")}
                            </Button>
                          </div>

                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder="0"
                              min="0"
                              value={virtualReward === 0 ? "" : virtualReward}
                              onChange={(e) => {
                                const val = e.target.value;
                                setVirtualReward(val === "" ? 0 : Number(val));
                              }}
                              className="h-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              disabled={!isEventActive}
                            />
                            <Button
                              onClick={handleSaveVr}
                              disabled={
                                savingVr || !isEventActive || isVrOverTeamCap
                              }
                              className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                              {savingVr ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                t("projectDetail.buttons.give")
                              )}
                            </Button>
                          </div>
                        </div>
                      </TabsContent>

                      {eventData?.myRole === "COMMITTEE" && (
                        <TabsContent value="special" className="space-y-4 mt-0">
                          <div className="space-y-2">
                            <Label>
                              {t(
                                "projectDetail.evaluation.selectSpecialRewards",
                              )}
                            </Label>
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                asChild
                                disabled={!isEventActive}
                              >
                                <Button
                                  variant="outline"
                                  className="w-full justify-between px-3"
                                >
                                  <span className="truncate text-sm">
                                    {selectedSpecialRewards.length > 0
                                      ? `${selectedSpecialRewardsSummary} (${selectedSpecialRewards.length} ${t("projectDetail.evaluation.selected")})`
                                      : t(
                                          "projectDetail.evaluation.selectRewardsPlaceholder",
                                        )}
                                  </span>
                                  <Trophy className="ml-2 h-4 w-4 opacity-50 shrink-0" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                className="w-70"
                                align="start"
                              >
                                <DropdownMenuLabel>
                                  {t(
                                    "projectDetail.evaluation.availableRewards",
                                  )}
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <div className="max-h-50 overflow-y-auto custom-scrollbar">
                                  {eventData.specialRewards?.map((reward) => {
                                    const disabled = isRewardDisabled(
                                      reward.id,
                                    );
                                    return (
                                      <DropdownMenuCheckboxItem
                                        key={reward.id}
                                        checked={selectedSpecialRewards.includes(
                                          reward.id,
                                        )}
                                        onCheckedChange={() =>
                                          toggleSpecialReward(reward.id)
                                        }
                                        disabled={disabled}
                                      >
                                        <span
                                          className={
                                            disabled
                                              ? "text-muted-foreground line-through opacity-70"
                                              : ""
                                          }
                                        >
                                          {reward.name}
                                        </span>
                                      </DropdownMenuCheckboxItem>
                                    );
                                  })}
                                </div>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            {selectedSpecialRewardItems.length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-2">
                                {selectedSpecialRewardItems.map((reward) => (
                                  <Badge
                                    key={reward.id}
                                    variant="secondary"
                                    className="flex items-center gap-1"
                                  >
                                    <span className="max-w-60 truncate">
                                      {reward.name}
                                    </span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 w-5 p-0"
                                      onClick={() =>
                                        toggleSpecialReward(reward.id)
                                      }
                                      disabled={!isEventActive}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button
                            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                            onClick={handleSaveSpecial}
                            disabled={savingSpecial || !isEventActive}
                          >
                            {savingSpecial ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              t("projectDetail.buttons.saveAwards")
                            )}
                          </Button>
                        </TabsContent>
                      )}
                    </Tabs>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Grading Section (Committee only) */}
            {eventData?.myRole === "COMMITTEE" &&
              (eventData?.gradingEnabled ?? true) && (
                <CommitteeGradingForm
                  eventId={id}
                  teamId={projectId}
                  teamName={project.title}
                  disabled={!isEventActive}
                />
              )}

            {/* Comment Section */}
            <CommentSection
              eventId={id}
              projectId={projectId}
              myRole={eventData?.myRole}
              disabled={!isEventActive}
            />

            <Card className="border-none shadow-md bg-card">
              <CardHeader className="border-b px-6 py-4 flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                  <Users className="w-5 h-5 text-primary" />
                  {t("projectDetail.projectMembers")}
                </CardTitle>
                <Badge variant="secondary" className="font-normal">
                  {membersData.length} / {eventData?.maxTeamMembers || "-"}
                </Badge>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {membersData.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors shadow-sm relative group"
                    >
                      <UserAvatar
                        user={m}
                        className="w-10 h-10 border-2 border-background shadow-sm"
                      />
                      <div className="overflow-hidden flex-1">
                        <div className="font-medium truncate text-foreground">
                          {m.name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          @{m.username || "user"}
                        </div>
                        {m.isLeader && (
                          <Badge
                            variant="secondary"
                            className="mt-1 text-[10px] h-5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800/50"
                          >
                            {t("projectDetail.leader")}
                          </Badge>
                        )}
                      </div>
                      {project.isLeader && !m.isLeader && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveMember(m.id)}
                          disabled={!isSubmissionActive}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {membersData.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      {t("projectDetail.messages.noMembers")}
                    </div>
                  )}

                  {project.isLeader && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2 border-dashed border-2 hover:border-primary hover:text-primary"
                      onClick={() => setInviteOpen(true)}
                      disabled={
                        (!!eventData?.maxTeamMembers &&
                          membersData.length >= eventData.maxTeamMembers) ||
                        !isSubmissionActive
                      }
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {t("projectDetail.buttons.addMember")}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Banner Dialog */}
        <Dialog open={bannerOpen} onOpenChange={setBannerOpen}>
          <DialogContent className="max-w-5xl p-0 overflow-hidden bg-transparent border-none shadow-none">
            <DialogTitle className="sr-only">
              {t("projectDetail.banner.title")}
            </DialogTitle>
            <div className="relative w-full aspect-video">
              <Image
                src={
                  project?.img &&
                  !project.img.startsWith("data:image/png;base64src")
                    ? project.img
                    : "/banner.png"
                }
                alt={project?.title || t("projectDetail.banner.alt")}
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
            <DialogTitle className="sr-only">
              {t("projectDetail.imagePreview.title")}
            </DialogTitle>
            <div className="relative w-full h-full">
              {previewImage && (
                <Image
                  src={previewImage}
                  alt={t("projectDetail.imagePreview.alt")}
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
          <DialogContent className="max-w-3xl w-[calc(100%-2rem)] rounded-lg max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="text-xl">
                {t("projectDetail.dialogs.manageFilesTitle")}
              </DialogTitle>
              <DialogDescription>
                {t("projectDetail.dialogs.manageFilesDesc")}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-4">
              {(eventData?.fileTypes || []).map((ft) => {
                const uploaded = project.files?.find(
                  (f) => f.fileTypeId === ft.id,
                );
                const isUrlType = ft.allowedFileTypes.includes(FileType.url);
                const isUploading = ft.id ? uploading[ft.id] : false;

                return (
                  <div
                    key={ft.id}
                    className="flex flex-col md:flex-row gap-4 p-4 border rounded-xl bg-card hover:bg-muted/50 transition-colors items-start"
                  >
                    {/* Info Section */}
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm md:text-base">
                          {ft.name}
                        </span>
                        {ft.isRequired && (
                          <Badge
                            variant="destructive"
                            className="text-[10px] px-1.5 h-5"
                          >
                            {t("projectDetail.files.required")}
                          </Badge>
                        )}
                        {uploaded && (
                          <Badge
                            variant="secondary"
                            className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/50 border-green-200 dark:border-green-800 text-[10px] px-1.5 h-5"
                          >
                            {t("projectDetail.files.uploaded")}
                          </Badge>
                        )}
                      </div>
                      {ft.description && (
                        <p className="text-sm text-muted-foreground leading-snug">
                          {ft.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground font-mono bg-muted w-fit px-1.5 py-0.5 rounded border">
                        {ft.allowedFileTypes.join(", ")}
                      </p>
                    </div>

                    {/* Actions Section */}
                    <div className="w-full md:w-70 flex flex-col justify-center gap-3 shrink-0">
                      {isUrlType ? (
                        <div className="flex flex-col gap-2 w-full">
                          <div className="flex gap-2 w-full items-center">
                            <Input
                              id={`url-input-${ft.id}`}
                              placeholder="https://..."
                              defaultValue={uploaded?.url || ""}
                              disabled={isUploading || !isSubmissionActive}
                              className="h-9 text-sm bg-background"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleFileUpload(
                                    null,
                                    ft.id,
                                    e.currentTarget.value,
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
                              disabled={isUploading || !isSubmissionActive}
                              className="h-9"
                              onClick={() => {
                                const input = document.getElementById(
                                  `url-input-${ft.id}`,
                                ) as HTMLInputElement;
                                if (input) {
                                  handleFileUpload(null, ft.id, input.value);
                                }
                              }}
                            >
                              {isUploading ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                t("projectDetail.evaluation.save")
                              )}
                            </Button>
                          </div>

                          {/* Secondary Actions Row */}
                          <div className="flex justify-end gap-2">
                            {uploaded && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs"
                                  asChild
                                >
                                  <a
                                    href={uploaded.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1.5"
                                  >
                                    <Share2 className="w-3 h-3" />{" "}
                                    {t("projectDetail.files.open")}
                                  </a>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDeleteFile(ft.id!)}
                                  disabled={!isSubmissionActive}
                                >
                                  <X className="w-3 h-3 mr-1" />{" "}
                                  {t("projectDetail.files.remove")}
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
                            disabled={isUploading || !isSubmissionActive}
                          />
                          <div className="flex gap-2 w-full justify-end">
                            <Button
                              variant={uploaded ? "outline" : "default"}
                              size="sm"
                              className="w-full h-9"
                              disabled={isUploading || !isSubmissionActive}
                              onClick={() =>
                                document
                                  .getElementById(`file-${ft.id}`)
                                  ?.click()
                              }
                            >
                              {isUploading ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              ) : (
                                <Plus className="w-4 h-4 mr-2" />
                              )}
                              {uploaded
                                ? t("projectDetail.files.replaceFile")
                                : t("projectDetail.files.uploadFile")}
                            </Button>
                          </div>

                          {uploaded && (
                            <div className="flex gap-2 justify-end w-full">
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-7 text-xs"
                                asChild
                              >
                                <a
                                  href={uploaded.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-1.5"
                                >
                                  <Download className="w-3 h-3" />{" "}
                                  {t("projectDetail.files.download")}
                                </a>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => ft.id && handleDeleteFile(ft.id)}
                                disabled={!isSubmissionActive}
                              >
                                <X className="w-3 h-3 mr-1" />{" "}
                                {t("projectDetail.files.remove")}
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
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/50">
                  <FileText className="w-10 h-10 mb-2 opacity-20" />
                  <p>{t("projectDetail.files.noRequirements")}</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t bg-muted/50 flex justify-end">
              <Button onClick={() => setFilesOpen(false)}>
                {t("projectDetail.buttons.close")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Invite Member Dialog */}
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
            <DialogHeader className="p-4 pb-2 border-b bg-muted/50">
              <DialogTitle>
                {t("projectDetail.dialogs.addMemberTitle")}
              </DialogTitle>
              <DialogDescription>
                {t("projectDetail.dialogs.addMemberDesc")}
              </DialogDescription>
            </DialogHeader>

            <div className="p-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("projectDetail.member.searchPlaceholder")}
                  className="pl-9 bg-muted/50 border-border focus-visible:ring-1"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="h-75 overflow-y-auto rounded-lg border bg-muted/30 p-2">
                {isSearching ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-primary/50" />
                    <span className="text-xs">
                      {t("projectDetail.member.searching")}
                    </span>
                  </div>
                ) : candidates.length > 0 ? (
                  <div className="space-y-1">
                    {candidates.map((c) => (
                      <div
                        key={c.userId}
                        className="flex items-center justify-between p-2 hover:bg-card hover:shadow-sm rounded-lg transition-all group border border-transparent hover:border-border"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <UserAvatar
                            user={c}
                            className="w-9 h-9 border bg-card"
                          />
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate text-foreground">
                              {c.name}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              @{c.username}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 px-3 shadow-sm opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0"
                          onClick={() => handleAddMember(c.userId)}
                        >
                          <Plus className="w-3.5 h-3.5 mr-1.5" />
                          {t("projectDetail.member.add")}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : searchQuery.length >= 2 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 opacity-50">
                    <Users className="w-8 h-8" />
                    <span className="text-sm">
                      {t("projectDetail.member.noUsers")}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 opacity-50">
                    <Search className="w-8 h-8" />
                    <span className="text-sm">
                      {t("projectDetail.member.typeToSearch")}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="p-3 bg-muted border-t flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInviteOpen(false)}
              >
                {t("projectDetail.buttons.cancel")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Leave Team Confirmation Dialog */}
        <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {t("projectDetail.dialogs.leaveTeamTitle")}
              </DialogTitle>
              <DialogDescription>
                {t("projectDetail.dialogs.leaveTeamDesc")}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setLeaveDialogOpen(false)}
              >
                {t("projectDetail.buttons.cancel")}
              </Button>
              <Button variant="destructive" onClick={handleLeaveTeam}>
                {t("projectDetail.buttons.leaveTeam")}
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
          isSubmissionActive={isSubmissionActive}
        />

        {/* Share Dialog */}
        <Dialog open={shareOpen} onOpenChange={setShareOpen}>
          <DialogContent className="max-w-md w-[calc(100%-2rem)] rounded-lg">
            <DialogHeader>
              <DialogTitle>
                {t("projectDetail.dialogs.shareProjectTitle")}
              </DialogTitle>
              <DialogDescription>
                {t("projectDetail.dialogs.shareProjectDesc")}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-6 py-4">
              {shareQrSrc ? (
                <div className="relative group/qr">
                  <Image
                    src={shareQrSrc}
                    alt="Project QR"
                    width={240}
                    height={240}
                    className="rounded-lg border shadow-sm"
                  />
                </div>
              ) : (
                <Skeleton className="w-60 h-60 rounded-lg" />
              )}

              <div className="flex w-full gap-2">
                <Input
                  value={`${
                    typeof window !== "undefined" ? window.location.origin : ""
                  }/event/${id}/Projects/${projectId}`}
                  readOnly
                  className="bg-muted text-sm font-mono"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() =>
                    copyToClipboard(
                      `${window.location.origin}/event/${id}/Projects/${projectId}`,
                    )
                  }
                >
                  <ClipboardCopy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
