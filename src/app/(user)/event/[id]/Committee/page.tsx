"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import Image from "next/image";
import Link from "next/link";
import { createTeam, getTeams, getEvent, giveVr, resetVr, giveSpecial, resetSpecial } from "@/utils/apievent";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building, MessageSquare, BadgeCheck, Award } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { toast } from "sonner";
import type { EventData, Team, SpecialReward } from "@/utils/types";
import InformationSection from "../components/InformationSection";
import type { PresenterProject } from "../Presenter/components/types";
import React from "react";
import UnifiedProjectList from "../components/UnifiedProjectList";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams } from "next/navigation";
import ResultSection from "../components/ResultSection";

type Props = {
  params?: Promise<{ id: string }>;
  id?: string;
  event?: EventData;
};

export default function CommitteePage(props: Props) {
  const paramsHook = useParams();
  const idFromParams = paramsHook?.id as string;
  const id = props.id || idFromParams;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "scored" | "unscored">("all");
  const [tab, setTab] = useState<"dashboard" | "information" | "project" | "result">("dashboard");
  const [localEvent, setLocalEvent] = useState<EventData | null>(props.event || null);
  const [awardsUnused, setAwardsUnused] = useState<SpecialReward[]>([]);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [loading, setLoading] = useState(!props.event);

  const fetchData = async () => {
    try {
      const res = await getEvent(id);
      if (res.message === "ok") {
        setLocalEvent(res.event);
        if (res.event.awardsUnused) {
            setAwardsUnused(res.event.awardsUnused);
        }
      }
    } catch (error) {
      console.error("Failed to fetch event:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (props.event) {
      setLocalEvent(props.event);
      if (props.event.awardsUnused) {
        setAwardsUnused(props.event.awardsUnused);
      }
      setLoading(false);
    } else if (id) {
      fetchData();
    }
  }, [id, props.event]);

  // Local project (mock) state for presenter
  type LocalProject = {
    id: string;
    title: string;
    description?: string;
    img?: string;
    videoLink?: string;
    files?: string[];
    members?: string[];
    owner?: boolean;
  };

  const [userProject, setUserProject] = useState<LocalProject | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [projects, setProjects] = useState<PresenterProject[]>([]);

  // Committee-specific UI state for project interactions
  const [projectRewards, setProjectRewards] = useState<
    Record<string, { vrGiven: number; specialGiven: string | null }>
  >({});

  const fetchTeamsData = async () => {
    try {
      const res = await getTeams(id);
      if (res.message === "ok") {
        const teams = res.teams as Team[];
        const mappedProjects: PresenterProject[] = teams.map((t) => ({
          id: t.id,
          title: t.teamName,
          desc: t.description || "",
          img: t.imageCover || "/banner.png",
          videoLink: t.videoLink,
          files:
            t.files?.map((f) => ({
              name: f.fileUrl.split("/").pop() || "File",
              url: f.fileUrl,
              fileTypeId: f.fileTypeId,
            })) || [],
          members:
            t.participants?.map((p) => p.user?.name || "Unknown") || [],
          totalVr: t.totalVr,
        }));
        setProjects(mappedProjects);

        // Initialize rewards state for new projects
        setProjectRewards((prev) => {
          const newState = { ...prev };
          teams.forEach((t) => {
            // Update or initialize with fetched myReward
            if (!newState[t.id]) {
              newState[t.id] = { vrGiven: t.myReward || 0, specialGiven: null };
            } else {
              // If re-fetching, update the vrGiven to match server state
              newState[t.id] = {
                ...newState[t.id],
                vrGiven: t.myReward || 0,
              };
            }
          });
          return newState;
        });
      }
    } catch (error) {
      console.error("Failed to fetch teams:", error);
    }
  };

  useEffect(() => {
    fetchTeamsData();
  }, [id]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // UI state for project viewer/editor
  const [viewOpen, setViewOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(false);
  const [projectForm, setProjectForm] = useState<PresenterProject | null>(null);
  const { t } = useLanguage();

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (typeof error === "object" && error !== null && "response" in error) {
      const response = (error as { response?: unknown }).response;
      if (typeof response === "object" && response !== null && "data" in response) {
        const data = (response as { data?: unknown }).data;
        if (typeof data === "object" && data !== null && "message" in data) {
          const message = (data as { message?: unknown }).message;
          if (typeof message === "string" && message.trim()) return message;
        }
      }
    }
    if (typeof error === "object" && error !== null && "message" in error) {
      const message = (error as { message?: unknown }).message;
      if (typeof message === "string" && message.trim()) return message;
    }
    return fallback;
  };

  const handleResetVR = async (projectId: string) => {
    try {
      const res = await resetVr(id, projectId);
      const refundAmount = res.newBalance - (localEvent?.myVirtualTotal ?? 0);
      setLocalEvent((prev) => (prev ? {
        ...prev,
        myVirtualTotal: res.newBalance,
        myVirtualUsed: (prev.myVirtualUsed ?? 0) - refundAmount
      } : prev));
      setProjectRewards((prev) => ({
        ...prev,
        [projectId]: {
          ...prev[projectId],
          vrGiven: 0,
        },
      }));
      toast.success("Reset Virtual Reward");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to reset VR"));
    }
  };

  const handleResetSpecial = async (projectId: string) => {
    try {
      await resetSpecial(id, projectId);
      fetchData();
      setProjectRewards((prev) => ({
        ...prev,
        [projectId]: {
          ...prev[projectId],
          specialGiven: null,
        },
      }));
      toast.success("คืนรางวัลพิเศษเรียบร้อย");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to reset special reward"));
    }
  };

  const handleGiveVr = async (projectId: string, amount: number) => {
    try {
      const res = await giveVr(id, projectId, amount);
      setLocalEvent((prev) => {
        if (!prev) return prev;
        const initialTotal = (prev.myVirtualTotal ?? 0) + (prev.myVirtualUsed ?? 0);
        return {
          ...prev,
          myVirtualTotal: res.newBalance,
          myVirtualUsed: initialTotal - res.newBalance,
        };
      });
      setProjectRewards((prev) => ({
        ...prev,
        [projectId]: {
          ...prev[projectId],
          vrGiven: amount,
        },
      }));
      toast.success("ให้ Virtual Reward เรียบร้อย");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to give VR"));
    }
  };

  const handleGiveSpecial = async (projectId: string, rewardId: string) => {
    try {
      await giveSpecial(id, projectId, rewardId);
      fetchData();
      
      const rewardName = localEvent?.specialRewards?.find(r => r.id === rewardId)?.name || "Unknown";

      setProjectRewards((prev) => ({
        ...prev,
        [projectId]: {
          ...prev[projectId],
          specialGiven: rewardName,
        },
      }));
      toast.success("ให้รางวัลพิเศษเรียบร้อย");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to give special reward"));
    }
  };

  const handleAction = (
    action: string,
    projectId: string
  ) => {
    if (action === "reset_vr") {
      handleResetVR(projectId);
    } else if (action === "reset_special") {
      handleResetSpecial(projectId);
    }
  };

  if (loading || !localEvent) {
    return (
      <div className="min-h-screen bg-background">
        <div className="w-full">
          {/* Banner Skeleton */}
          <div className="relative w-full aspect-2/1 md:h-[400px] overflow-hidden">
            <Skeleton className="w-full h-full" />
          </div>
          <div className="max-w-6xl mx-auto px-6 lg:px-8 mt-6">
            {/* Header Card Skeleton */}
            <div className="border rounded-xl shadow-md mb-6 p-6 h-[100px] bg-card">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 h-full">
                 <Skeleton className="h-8 w-1/3" />
                 <Skeleton className="h-10 w-32" />
              </div>
            </div>

            {/* Tabs Skeleton */}
            <div className="mt-6 flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>

            {/* Content Skeleton */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-64 rounded-xl" />
              <Skeleton className="h-64 rounded-xl" />
              <Skeleton className="h-64 rounded-xl" />
              <Skeleton className="h-64 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full">
        <div
          className="relative w-full aspect-video md:aspect-2/1 md:h-[400px] overflow-hidden cursor-zoom-in"
          onClick={() => setBannerOpen(true)}
        >
          {localEvent?.imageCover ? (
            <Image
              src={localEvent.imageCover}
              alt={localEvent.eventName || "Event banner"}
              fill
              sizes="100vw"
              className="object-cover rounded-xl"
            />
          ) : (
            <Image
              src="/banner.png"
              alt="Default banner"
              fill
              sizes="100vw"
              className="object-cover rounded-xl"
            />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-background/60 to-transparent pointer-events-none" />
        </div>
        <Dialog open={bannerOpen} onOpenChange={setBannerOpen}>
          <DialogContent
            showCloseButton={false}
            className="sm:max-w-3xl md:max-w-5xl bg-transparent border-none p-0"
            aria-label="Event banner"
          >
            <DialogTitle className="sr-only">Event banner</DialogTitle>
            <Image
              src={localEvent?.imageCover || "/banner.png"}
              alt={localEvent.eventName || "Event banner"}
              width={800}
              height={400}
              className="w-full h-auto rounded-xl"
            />
            <DialogClose
              aria-label="Close banner"
              className="absolute top-3 right-3 z-50 rounded-full bg-black/60 text-white hover:bg-black/80 p-2 shadow"
            >
              <X className="h-4 w-4" />
            </DialogClose>
          </DialogContent>
        </Dialog>
        <div className="max-w-6xl mx-auto px-6 lg:px-8 mt-6">
          <Card 
            className="border-none shadow-md mb-6 transition-all hover:shadow-lg relative overflow-hidden"
            style={{ borderLeft: "6px solid var(--role-committee)" }}
          >
            <div 
              className="absolute inset-0 pointer-events-none" 
              style={{ background: "linear-gradient(to right, var(--role-committee), transparent)", opacity: 0.05 }} 
            />
            <CardHeader className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                {/* LEFT SIDE: Title & Status */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <CardTitle 
                      className="text-2xl lg:text-3xl font-bold"
                      style={{ color: "var(--role-committee)" }}
                    >
                      {localEvent?.eventName || "Event"}
                    </CardTitle>
                  </div>
                </div>

                {/* RIGHT SIDE: Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Role Label */}
                  <div className="h-10 inline-flex items-center justify-center gap-2 px-5 rounded-lg bg-(--role-committee) text-white font-medium shadow-md select-none">
                    <Building className="h-4 w-4" />
                    <span>Committee</span>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mt-6">
            <TabsList className="w-full flex flex-wrap h-auto p-1 justify-start gap-1 bg-muted/50">
              <TabsTrigger value="dashboard" className="flex-1 min-w-[100px]">Dashboard</TabsTrigger>
              <TabsTrigger value="information" className="flex-1 min-w-[100px]">Information</TabsTrigger>
              <TabsTrigger value="project" className="flex-1 min-w-[100px]">Projects</TabsTrigger>
              <TabsTrigger value="result" className="flex-1 min-w-[100px]">Result</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <div className="mt-4">
                {/* Personal Virtual Rewards summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 1. My Virtual Rewards */}
                  <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                        <div className="p-2 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                          <BadgeCheck className="h-5 w-5" />
                        </div>
                        {t("committeeSection.myVirtualRewards")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-sm text-muted-foreground">{t("committeeSection.used")}</p>
                          <span className="text-2xl font-bold">
                            {localEvent?.myVirtualUsed ?? 0}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {t("committeeSection.total")} {localEvent?.myVirtualTotal ?? 0}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-amber-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                          style={{
                            width: `${
                              ((localEvent?.myVirtualUsed ?? 0) /
                                (localEvent?.myVirtualTotal || 1)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-amber-600 font-medium text-right">
                        {t("committeeSection.remaining")}{" "}
                        {(localEvent?.myVirtualTotal ?? 0) - (localEvent?.myVirtualUsed ?? 0)}
                      </p>
                    </CardContent>
                  </Card>

                  {/* 2. จำนวนผู้เข้าร่วมทั้งหมด */}
                  <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                        <div className="p-2 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                          <Users className="h-5 w-5" />
                        </div>
                        {t("committeeSection.totalParticipants")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-foreground py-2">
                        {(localEvent?.presentersCount ?? 0) +
                          (localEvent?.guestsCount ?? 0) +
                          (localEvent?.committeeCount ?? 0)}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs mt-2 text-muted-foreground">
                        <span className="px-2 py-1 bg-slate-100 rounded">
                          {t("dashboard.presenterCount")}: {localEvent?.presentersCount ?? 0}
                        </span>
                        <span className="px-2 py-1 bg-slate-100 rounded">
                          {t("dashboard.guestCount")}: {localEvent?.guestsCount ?? 0}
                        </span>
                        <span className="px-2 py-1 bg-slate-100 rounded">
                          {t("dashboard.committeeCount")}: {localEvent?.committeeCount ?? 0}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 3. รางวัลพิเศษ (Updated with Progress Bar & List) */}
                  <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                        <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                          <Award className="h-5 w-5" />
                        </div>
                        {t("committeeSection.specialAwards")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-end">
                        <span className="text-2xl font-bold">
                          {localEvent?.specialPrizeUsed ?? 4}{" "}
                          <span className="text-sm font-normal text-muted-foreground">
                            / {localEvent?.specialPrizeCount ?? 5}
                          </span>
                        </span>
                        <span className="text-sm text-muted-foreground">{t("committeeSection.usedOverTotal")}</span>
                      </div>
                      <div className="h-2 w-full bg-indigo-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                          style={{
                            width: `${
                              ((localEvent?.specialPrizeUsed ?? 4) /
                                (localEvent?.specialPrizeCount ?? 5)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      {/* <div className="flex flex-wrap gap-2"> */}
                      {/* Placeholder for remaining rewards */}
                      {/* {Array.from({
                          length:
                            (localEvent?.specialPrizeCount ?? 5) -
                            (localEvent?.specialPrizeUsed ?? 4),
                        }).map((_, i) => (
                          <div
                            key={i}
                            className="text-[10px] px-2 py-1 border border-indigo-200 text-indigo-500 rounded bg-indigo-50/50"
                          >
                            Available Reward {i + 1}
                          </div>
                        ))}
                      </div> */}
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-indigo-500 uppercase">
                          {t("committeeSection.waitForVote")} :
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {/* Example of projects that haven't received feedback */}
                          <div className="text-[10px] px-2 py-1 bg-indigo-50/50 text-indigo-500 rounded border border-indigo-200">
                            Best Innovatic Project
                          </div>
                          <div className="text-[10px] px-2 py-1 bg-indigo-50/50 text-indigo-500 rounded border border-indigo-200">
                            Best Design Project
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 4. Feedback (New Card) */}
                  <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                        <div className="p-2 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300">
                          <MessageSquare className="h-5 w-5" />
                        </div>
                        Feedback Progress
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-end">
                        <span className="text-2xl font-bold text-foreground">
                          {localEvent?.myFeedbackCount ?? 0}{" "}
                          <span className="text-sm font-normal text-muted-foreground">
                            / {localEvent?.presenterTeams ?? 10}
                          </span>
                        </span>
                        <span className="text-sm text-muted-foreground">{t("committeeSection.feedbackGiven")}</span>
                      </div>
                      <div className="h-2 w-full bg-rose-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full transition-all duration-1000"
                          style={{
                            width: `${
                              ((localEvent?.myFeedbackCount ?? 0) /
                                (localEvent?.presenterTeams ?? 10)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-rose-600 uppercase">
                          Wait for Feedback:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {/* Example of projects that haven't received feedback */}
                          <div className="text-[10px] px-2 py-1 bg-rose-50 text-rose-600 rounded border border-rose-100">
                            Project Alpha
                          </div>
                          <div className="text-[10px] px-2 py-1 bg-rose-50 text-rose-600 rounded border border-rose-100">
                            Project Gamma
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Projects overview for committee with action buttons
                <div className="lg:col-span-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3 mt-4">
                    <h2 className="text-xl font-semibold">Projects</h2>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Select
                        value={filterStatus}
                        onValueChange={(v) =>
                          setFilterStatus(v as "all" | "scored" | "unscored")
                        }
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Filter" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Projects</SelectItem>
                          <SelectItem value="scored">Evaluated</SelectItem>
                          <SelectItem value="unscored">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="max-w-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-6">
                    <UnifiedProjectList
                      projects={projects}
                      role="COMMITTEE"
                      eventId={id}
                      searchQuery={searchQuery}
                      filterStatus={filterStatus}
                      projectRewards={projectRewards}
                      userVrBalance={localEvent?.myVirtualTotal ?? 0}
                      onAction={handleAction}
                      onGiveVr={handleGiveVr}
                      onGiveSpecial={handleGiveSpecial}
                      unusedAwards={awardsUnused}
                      onPostComment={() => {
                        toast.success("ส่งความคิดเห็นเรียบร้อย");
                      }}
                    />
                  </div>
                </div> */}
              </div>
            </TabsContent>

            <TabsContent value="information">
              <InformationSection
                id={id}
                event={localEvent as EventData}
                editable={false}
                linkLabel="ลิงก์"
              />
            </TabsContent>

            <TabsContent value="project">
              <div className="mt-6 space-y-6">
                {/* Projects in the event */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                    <h2 className="text-lg font-semibold">Projects</h2>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Select
                        value={filterStatus}
                        onValueChange={(v) =>
                          setFilterStatus(v as "all" | "scored" | "unscored")
                        }
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Filter" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Projects</SelectItem>
                          <SelectItem value="scored">Evaluated</SelectItem>
                          <SelectItem value="unscored">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="max-w-xs"
                      />
                    </div>
                  </div>

                  <UnifiedProjectList
                    projects={projects}
                    role="COMMITTEE"
                    eventId={id}
                    searchQuery={searchQuery}
                    filterStatus={filterStatus}
                    projectRewards={projectRewards}
                    onAction={handleAction}
                    onGiveVr={handleGiveVr}
                    onGiveSpecial={handleGiveSpecial}
                    unusedAwards={awardsUnused}
                    onPostComment={() => {
                      toast.success("ส่งความคิดเห็นเรียบร้อย");
                    }}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="result">
              <ResultSection eventId={id} role="COMMITTEE" />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
