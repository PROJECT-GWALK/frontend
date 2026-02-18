"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import Image from "next/image";
import Link from "next/link";
import { getTeams, getEvent, giveVr, resetVr, giveSpecial, resetSpecial } from "@/utils/apievent";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building, MessageSquare, BadgeCheck, Award, Gift } from "lucide-react";
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
import { useParams, useRouter } from "next/navigation";
import ResultSection from "../components/ResultSection";
import OrganizerBanner from "../Organizer/components/OrganizerBanner";
import { useSession } from "next-auth/react";

export default function CommitteePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;

  if (id) router.replace(`/event/${id}`);

  return null;
}

type Props = {
  id: string;
  event: EventData;
};

export function CommitteeView(props: Props) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

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

  const [projects, setProjects] = useState<PresenterProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  // Committee-specific UI state for project interactions
  const [projectRewards, setProjectRewards] = useState<
    Record<string, { vrGiven: number; specialGiven: string | null | string[] }>
  >({});

  const fetchTeamsData = async () => {
    setProjectsLoading(true);
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
          members: t.participants?.map((p) => p.user?.name || "Unknown") || [],
          memberUserIds: t.participants?.map((p) => p.userId) || [],
          createdAt: t.createdAt,
          totalVr: t.totalVr,
          myComment: t.myComment,
          myGraded: t.myGraded,
        }));
        setProjects(mappedProjects);

        // Initialize rewards state for new projects
        setProjectRewards((prev) => {
          const newState = { ...prev };
          teams.forEach((t) => {
            // Update or initialize with fetched myReward
            if (!newState[t.id]) {
              newState[t.id] = {
                vrGiven: t.myReward || 0,
                specialGiven:
                  t.mySpecialRewards && t.mySpecialRewards.length > 0 ? t.mySpecialRewards : null,
              };
            } else {
              // If re-fetching, update the vrGiven to match server state
              newState[t.id] = {
                ...newState[t.id],
                vrGiven: t.myReward || 0,
                // We trust local state for special rewards unless we want to force sync from server always
                // For now let's sync from server if we are refetching
                specialGiven:
                  t.mySpecialRewards && t.mySpecialRewards.length > 0 ? t.mySpecialRewards : null,
              };
            }
          });
          return newState;
        });
      }
    } catch (error) {
      console.error("Failed to fetch teams:", error);
    } finally {
      setProjectsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamsData();
  }, [id]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

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
      // Update local event state with new totals from backend
      setLocalEvent((prev) =>
        prev
          ? {
              ...prev,
              myVirtualTotal: res.totalLimit,
              myVirtualUsed: res.totalUsed,
            }
          : prev,
      );

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
      toast.success(t("toast.specialRewardRefunded"));
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to reset special reward"));
    }
  };

  const handleGiveVr = async (projectId: string, amount: number) => {
    try {
      const res = await giveVr(id, projectId, amount);
      setLocalEvent((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          myVirtualTotal: res.totalLimit,
          myVirtualUsed: res.totalUsed,
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
      await giveSpecial(id, projectId, [rewardId]);
      fetchData();

      setProjectRewards((prev) => {
        const currentSpecial = prev[projectId]?.specialGiven;
        let newSpecial: string | string[] | null = rewardId;

        // If there were existing rewards, we might want to append (if logic supports multiple)
        // But the API giveSpecial replaces or adds? The API takes array.
        // Assuming the UI drawer picks one, we add it to the list if we want to support multiple.
        // For now, let's just use array of IDs.
        if (Array.isArray(currentSpecial)) {
          if (!currentSpecial.includes(rewardId)) {
            newSpecial = [...currentSpecial, rewardId];
          } else {
            newSpecial = currentSpecial;
          }
        } else if (currentSpecial && typeof currentSpecial === "string") {
          // If previously stored as string (shouldn't happen with new logic but for safety)
          if (currentSpecial !== rewardId) {
            newSpecial = [currentSpecial, rewardId];
          } else {
            newSpecial = [rewardId];
          }
        } else {
          newSpecial = [rewardId];
        }

        return {
          ...prev,
          [projectId]: {
            ...prev[projectId],
            specialGiven: newSpecial,
          },
        };
      });
      toast.success(t("toast.specialRewardGiven"));
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to give special reward"));
    }
  };

  const handleAction = (action: string, projectId: string) => {
    if (action === "reset_vr") {
      handleResetVR(projectId);
    } else if (action === "reset_special") {
      handleResetSpecial(projectId);
    }
  };

  const teamsGivenVrCount = useMemo(() => {
    return Object.values(projectRewards).filter((p) => p.vrGiven > 0).length;
  }, [projectRewards]);

  const givenSpecialRewardsStats = useMemo(() => {
    const stats: Record<string, string[]> = {};

    // Initialize with empty arrays
    localEvent?.specialRewards?.forEach((r) => {
      stats[r.id] = [];
    });

    Object.entries(projectRewards).forEach(([projectId, rewardData]) => {
      const special = rewardData.specialGiven;
      const team = projects.find((p) => p.id === projectId);
      if (!team) return;

      if (Array.isArray(special)) {
        special.forEach((rewardId) => {
          if (!stats[rewardId]) stats[rewardId] = [];
          stats[rewardId].push(team.title);
        });
      } else if (typeof special === "string") {
        if (!stats[special]) stats[special] = [];
        stats[special].push(team.title);
      }
    });
    return stats;
  }, [projectRewards, projects, localEvent]);

  if (loading || !localEvent) {
    return (
      <div className="w-full justify-center flex">
        <div className="w-full">
          {/* Banner Skeleton */}
          <div className="relative w-full aspect-2/1 md:h-100 overflow-hidden">
            <Skeleton className="w-full h-full" />
          </div>
          <div className="max-w-6xl mx-auto px-6 lg:px-8 mt-6">
            {/* Header Card Skeleton */}
            <div className="border rounded-xl shadow-md mb-6 p-6 h-25 bg-card">
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
    <div className="w-full justify-center flex">
      <div className="w-full">
        <OrganizerBanner event={localEvent} open={bannerOpen} onOpenChange={setBannerOpen} />

        <div className="max-w-6xl mx-auto mt-6">
          <div
            className="bg-card rounded-xl shadow-sm border p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 transition-all hover:shadow-md relative overflow-hidden"
            style={{ borderLeft: "6px solid var(--role-committee)" }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(to right, var(--role-committee), transparent)",
                opacity: 0.05,
              }}
            />
            {/* LEFT SIDE: Title & Status */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1
                  className="text-2xl lg:text-3xl font-bold tracking-tight"
                  style={{ color: "var(--role-committee)" }}
                >
                  {localEvent?.eventName || "Event"}
                </h1>
              </div>
            </div>

            {/* RIGHT SIDE: Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Role Label */}
              <div className="h-10 inline-flex items-center justify-center gap-2 px-5 rounded-lg bg-(--role-committee) text-white font-medium shadow-sm select-none">
                <Building className="h-4 w-4" />
                <span>Committee</span>
              </div>
            </div>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mt-6">
            <TabsList className="w-full flex flex-wrap h-auto p-1 justify-start gap-1 bg-muted/50">
              <TabsTrigger value="dashboard" className="flex-1 min-w-25">
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="information" className="flex-1 min-w-25">
                Information
              </TabsTrigger>
              <TabsTrigger value="project" className="flex-1 min-w-25">
                Projects
              </TabsTrigger>
              <TabsTrigger value="result" className="flex-1 min-w-25">
                Result
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <div className="mt-4">
                {/* Personal Virtual Rewards summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 1. My Virtual Rewards */}
                  <Card className="border-0 dark:border dark:border-white/10 shadow-md hover:shadow-xl transition-all duration-300">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                        <div className="p-2 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                          <BadgeCheck className="h-5 w-5" />
                        </div>
                        {t("committeeSection.myVirtualRewards")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {t("committeeSection.used")}
                          </p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold">
                              {localEvent?.myVirtualUsed?.toLocaleString() ?? 0}
                            </span>
                            <span className="text-lg text-muted-foreground">
                              / {localEvent?.myVirtualTotal?.toLocaleString() ?? 0}{" "}
                              {localEvent?.unitReward ?? "coins"}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Given to</p>
                          <div className="flex items-baseline gap-1 justify-end">
                            <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
                              {teamsGivenVrCount}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              / {localEvent?.presenterTeams ?? projects.length} Teams
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-amber-100 dark:bg-amber-900/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-amber-500 to-yellow-400 dark:from-amber-600 dark:to-amber-400 rounded-full transition-all duration-1000"
                          style={{
                            width: `${
                              localEvent?.myVirtualTotal && localEvent.myVirtualTotal > 0
                                ? ((localEvent.myVirtualUsed ?? 0) / localEvent.myVirtualTotal) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-medium text-right">
                        {t("committeeSection.remaining")}{" "}
                        {(
                          (localEvent?.myVirtualTotal ?? 0) - (localEvent?.myVirtualUsed ?? 0)
                        ).toLocaleString()}{" "}
                        {localEvent?.unitReward ?? "coins"}
                      </p>
                    </CardContent>
                  </Card>

                  {/* 2. จำนวนผู้เข้าร่วมทั้งหมด */}
                  <Card className="border-0 dark:border dark:border-white/10 shadow-md hover:shadow-xl transition-all duration-300">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                        <div className="p-2 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
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
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
                          {t("dashboard.presenterCount")}: {localEvent?.presentersCount ?? 0}
                        </span>
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
                          {t("dashboard.guestCount")}: {localEvent?.guestsCount ?? 0}
                        </span>
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
                          {t("dashboard.committeeCount")}: {localEvent?.committeeCount ?? 0}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 4. รางวัลพิเศษ (Updated with List of Voted Teams) */}
                  <Card className="border-0 dark:border dark:border-white/10 shadow-md hover:shadow-xl transition-all duration-300 md:col-span-2 lg:col-span-1">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                        <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400">
                          <Award className="h-5 w-5" />
                        </div>
                        {t("committeeSection.specialAwards")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-end">
                        <span className="text-2xl font-bold">
                          {localEvent?.specialPrizeUsed ?? 0}{" "}
                          <span className="text-sm font-normal text-muted-foreground">
                            / {localEvent?.specialPrizeCount ?? 0}
                          </span>
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {t("committeeSection.usedOverTotal")}
                        </span>
                      </div>

                      {/* Voted Awards List */}
                      <div className="grid gap-3 sm:grid-cols-2 mt-4 max-h-100 overflow-y-auto custom-scrollbar pr-2">
                        {localEvent?.specialRewards?.map((reward) => {
                          const teams = givenSpecialRewardsStats[reward.id];
                          const isGiven = teams && teams.length > 0;

                          return (
                            <div
                              key={reward.id}
                              className={`border rounded-lg p-3 space-y-3 transition-all ${
                                isGiven
                                  ? "bg-indigo-50/50 border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-500/30"
                                  : "bg-background border-dashed border-muted opacity-60 grayscale hover:opacity-100 hover:grayscale-0 hover:border-solid hover:shadow-sm"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-16 shrink-0">
                                  {reward.image ? (
                                    <div className="relative border rounded-lg overflow-hidden aspect-square bg-muted w-full">
                                      <Image
                                        src={reward.image}
                                        alt={reward.name}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="border-2 border-dashed border-border rounded-lg aspect-square bg-muted flex items-center justify-center">
                                      <Gift className="h-6 w-6 text-muted-foreground/50" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0 space-y-1">
                                  <div
                                    className="font-semibold text-sm line-clamp-2"
                                    title={reward.name}
                                  >
                                    {reward.name}
                                  </div>

                                  <div className="pt-2 border-t mt-1 flex justify-between items-end">
                                    <div className="text-xs text-muted-foreground">Given to</div>
                                    <div
                                      className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md ${
                                        isGiven
                                          ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
                                          : "bg-muted text-muted-foreground"
                                      }`}
                                    >
                                      <span className="text-sm font-bold">
                                        {teams ? teams.length : 0}
                                      </span>
                                      <span className="text-[10px]">Teams</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {isGiven && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {teams.map((teamName, idx) => (
                                    <span
                                      key={idx}
                                      className="text-[10px] px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 truncate max-w-full"
                                    >
                                      {teamName}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {(!localEvent?.specialRewards ||
                          localEvent.specialRewards.length === 0) && (
                          <p className="text-sm text-muted-foreground text-center py-2 col-span-2">
                            No special rewards available
                          </p>
                        )}
                      </div>

                      {/* Unused Awards List (Remaining) */}
                      {awardsUnused.length > 0 && (
                        <div className="space-y-1 mt-4 pt-4 border-t border-dashed">
                          <p className="text-[10px] font-bold text-indigo-400 uppercase">
                            {t("dashboard.remainingAwards")}:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {awardsUnused.map((award, i) => (
                              <div
                                key={award.id || i}
                                className="text-[10px] px-2 py-1 bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-500 rounded border border-slate-100 dark:border-slate-800"
                              >
                                {award.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* 5. Feedback (New Card) */}
                  <Card className="border-0 dark:border dark:border-white/10 shadow-md hover:shadow-xl transition-all duration-300">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                        <div className="p-2 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
                          <MessageSquare className="h-5 w-5" />
                        </div>
                        Comment Progress
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {t("committeeSection.feedbackGiven")}
                          </p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                              {localEvent?.opinionsCommittee ?? 0}
                            </span>
                            <span className="text-lg text-muted-foreground">
                              / {localEvent?.presenterTeams ?? 0} Teams
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-rose-100 dark:bg-rose-900/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-rose-500 to-pink-400 dark:from-rose-600 dark:to-rose-400 rounded-full transition-all duration-1000"
                          style={{
                            width: `${
                              localEvent?.presenterTeams && localEvent.presenterTeams > 0
                                ? ((localEvent.opinionsCommittee ?? 0) /
                                    localEvent.presenterTeams) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-rose-600 dark:text-rose-400 font-medium text-right">
                        {t("committeeSection.remaining")}{" "}
                        {(localEvent?.presenterTeams ?? 0) - (localEvent?.opinionsCommittee ?? 0)}{" "}
                        Teams
                      </p>
                    </CardContent>
                  </Card>
                </div>
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
                        onValueChange={(v) => setFilterStatus(v as "all" | "scored" | "unscored")}
                      >
                        <SelectTrigger className="w-35">
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
                    currentUserId={userId}
                    eventStartView={localEvent?.startView ?? null}
                    searchQuery={searchQuery}
                    filterStatus={filterStatus}
                    projectRewards={projectRewards}
                    loading={projectsLoading}
                    onAction={handleAction}
                    onGiveVr={handleGiveVr}
                    onGiveSpecial={handleGiveSpecial}
                    unusedAwards={awardsUnused}
                    onPostComment={() => {
                      toast.success("ส่งความคิดเห็นเรียบร้อย");
                    }}
                    onRefresh={fetchTeamsData}
                    unitReward={localEvent?.unitReward ?? "coins"}
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
