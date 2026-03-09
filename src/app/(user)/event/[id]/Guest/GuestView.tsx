"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { getTeams, giveVr, resetVr } from "@/utils/apievent";
import { useCallback, useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import {
  Users,
  Building,
  BadgeCheck,
  MessageSquare,
  ChevronDown,
  Filter,
  Award,
  Gift,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import type { EventData, Team } from "@/utils/types";
import InformationSection from "../components/InformationSection";
import type { PresenterProject } from "../Presenter/components/types";
import UnifiedProjectList from "../components/UnifiedProjectList";
import ResultSection from "../components/ResultSection";
import OrganizerBanner from "../Organizer/components/OrganizerBanner";
import { useSession } from "next-auth/react";

type Props = {
  id: string;
  event: EventData;
};

export function GuestView({ id, event }: Props) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const searchParams = useSearchParams();
  const resolveTab = (value: string | null) => {
    const allowed = ["dashboard", "information", "project", "result"] as const;
    return allowed.includes(value as (typeof allowed)[number])
      ? (value as (typeof allowed)[number])
      : null;
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>(["all"]);
  const [tab, setTab] = useState<"dashboard" | "information" | "project" | "result">(
    () => {
      if (typeof window === "undefined") return "dashboard";
      const fromQuery = resolveTab(searchParams?.get("tab") ?? null);
      const fromStorage = resolveTab(sessionStorage.getItem(`eventTab:${id}`));
      return fromQuery || fromStorage || "dashboard";
    },
  );
  const [localEvent, setLocalEvent] = useState<EventData>(event);
  const [bannerOpen, setBannerOpen] = useState(false);

  const { t } = useLanguage();
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`eventTab:${id}`, tab);
    }
  }, [id, tab]);
  const [projects, setProjects] = useState<PresenterProject[]>([]);

  // Guest-specific UI state for project interactions
  const [projectRewards, setProjectRewards] = useState<
    Record<string, { vrGiven: number; specialGiven: string | null | string[] }>
  >({});

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
      setLocalEvent((prev) => (prev ? {
        ...prev,
        myVirtualTotal: res.totalLimit,
        myVirtualUsed: res.totalUsed
      } : prev));
      setProjectRewards((prev) => ({
        ...prev,
        [projectId]: {
          ...prev[projectId],
          vrGiven: 0,
        },
      }));
      toast.success(t("toast.resetVR"));
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, t("toast.failedResetVR")));
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
      toast.success(t("toast.giveVRSuccess"));
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, t("toast.failedGiveVR")));
    }
  };

  const handleAction = (action: string, projectId: string) => {
    if (action === "reset_vr") {
      handleResetVR(projectId);
    }
  };

  const fetchTeamsData = useCallback(async () => {
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
          memberUserIds: t.participants?.map((p) => p.userId) || [],
          createdAt: t.createdAt,
          totalVr: t.totalVr,
          myComment: t.myComment,
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
              newState[t.id] = {
                ...newState[t.id],
                vrGiven: t.myReward || 0,
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
    }
  }, [id]);

  useEffect(() => {
    fetchTeamsData();
  }, [fetchTeamsData]);

  const guestRewards = useMemo(
    () => (localEvent?.specialRewards ?? []).filter((r) => r.allowGuestVote),
    [localEvent],
  );

  const givenSpecialRewardsStats = useMemo(() => {
    const stats: Record<string, string[]> = {};
    guestRewards.forEach((r) => {
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
  }, [projectRewards, projects, guestRewards]);

  const teamsGivenVrCount = useMemo(() => {
    return Object.values(projectRewards).filter((p) => p.vrGiven > 0).length;
  }, [projectRewards]);

  const guestRewardUsed = useMemo(
    () =>
      guestRewards.filter((reward) => (givenSpecialRewardsStats[reward.id]?.length ?? 0) > 0)
        .length,
    [guestRewards, givenSpecialRewardsStats],
  );

  const guestRewardTotal = guestRewards.length;

  return (
    <div className="w-full justify-center flex">
      <div className="w-full">
        <OrganizerBanner event={localEvent} open={bannerOpen} onOpenChange={setBannerOpen} />
        <div className="max-w-6xl mx-auto mt-6">
          <div
            className="bg-card rounded-xl shadow-sm border p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 transition-all hover:shadow-md relative overflow-hidden"
            style={{ borderLeft: "6px solid var(--role-guest)" }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(to right, var(--role-guest), transparent)",
                opacity: 0.05,
              }}
            />
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1
                  className="text-2xl lg:text-3xl font-bold tracking-tight"
                  style={{ color: "var(--role-guest)" }}
                >
                  {localEvent?.eventName || "Event"}
                </h1>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="h-10 inline-flex items-center justify-center gap-2 px-5 rounded-lg bg-(--role-guest) text-white font-medium shadow-sm select-none">
                <Building className="h-4 w-4" />
                <span>{t("guest.role")}</span>
              </div>
            </div>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mt-6">
            <TabsList className="w-full flex flex-wrap h-auto p-1 justify-start gap-1 bg-muted/70 border border-border/60 rounded-xl">
              <TabsTrigger value="dashboard" className="flex-1 min-w-25 font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/30 dark:data-[state=active]:bg-white dark:data-[state=active]:text-black dark:data-[state=active]:shadow-white/30 dark:data-[state=active]:border dark:data-[state=active]:border-white/70">{t("guest.dashboard")}</TabsTrigger>
              <TabsTrigger value="information" className="flex-1 min-w-25 font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/30 dark:data-[state=active]:bg-white dark:data-[state=active]:text-black dark:data-[state=active]:shadow-white/30 dark:data-[state=active]:border dark:data-[state=active]:border-white/70">{t("guest.information")}</TabsTrigger>
              <TabsTrigger value="project" className="flex-1 min-w-25 font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/30 dark:data-[state=active]:bg-white dark:data-[state=active]:text-black dark:data-[state=active]:shadow-white/30 dark:data-[state=active]:border dark:data-[state=active]:border-white/70">{t("guest.projects")}</TabsTrigger>
              <TabsTrigger value="result" className="flex-1 min-w-25 font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/30 dark:data-[state=active]:bg-white dark:data-[state=active]:text-black dark:data-[state=active]:shadow-white/30 dark:data-[state=active]:border dark:data-[state=active]:border-white/70">{t("guest.result")}</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <div className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-0 dark:border dark:border-white/10 shadow-md hover:shadow-xl transition-all duration-300">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                        <div className="p-2 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                          <BadgeCheck className="h-5 w-5" />
                        </div>
                        {t("committeeSection.myVirtualRewards") || "My Virtual Rewards"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-sm text-muted-foreground">{t("committeeSection.used")}</p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold">
                              {localEvent?.myVirtualUsed?.toLocaleString() ?? 0}
                            </span>
                            <span className="text-lg text-muted-foreground">
                              / {localEvent?.myVirtualTotal?.toLocaleString() ?? 0}{" "}
                              {localEvent?.unitReward ?? t("guest.defaultUnit")}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">{t("dashboard.givenTo")}</p>
                          <div className="flex items-baseline gap-1 justify-end">
                            <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
                              {teamsGivenVrCount}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              / {localEvent?.presenterTeams ?? projects.length} {t("dashboard.teamCount")}
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
                                ? ((localEvent.myVirtualUsed ?? 0) / localEvent.myVirtualTotal) * 100
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
                        {localEvent?.unitReward ?? t("guest.defaultUnit")}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 dark:border dark:border-white/10 shadow-md hover:shadow-xl transition-all duration-300">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                        <div className="p-2 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                          <Users className="h-5 w-5" />
                        </div>
                        {t("dashboard.totalParticipants")}
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
                          {guestRewardUsed}{" "}
                          <span className="text-sm font-normal text-muted-foreground">
                            / {guestRewardTotal}
                          </span>
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {t("committeeSection.usedOverTotal")}
                        </span>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 mt-4 max-h-100 overflow-y-auto custom-scrollbar pr-2">
                        {guestRewards.map((reward) => {
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
                                    <div className="text-xs text-muted-foreground">
                                      {t("dashboard.givenTo")}
                                    </div>
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
                                      <span className="text-[10px]">{t("dashboard.teamCount")}</span>
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
                        {guestRewards.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-2 col-span-2">
                            No special rewards available
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 dark:border dark:border-white/10 shadow-md hover:shadow-xl transition-all duration-300">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                        <div className="p-2 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
                          <MessageSquare className="h-5 w-5" />
                        </div>
                        {t("dashboard.commentGiven")}
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
                              {projects.filter((p) => p.myComment).length}
                            </span>
                            <span className="text-lg text-muted-foreground">
                              / {localEvent?.presenterTeams ?? projects.length} {t("dashboard.teamCount")}
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
                                ? (projects.filter((p) => p.myComment).length /
                                    localEvent.presenterTeams) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-rose-600 dark:text-rose-400 font-medium text-right">
                        {t("committeeSection.remaining")}{" "}
                        {(localEvent?.presenterTeams ?? projects.length) -
                          projects.filter((p) => p.myComment).length}{" "}
                        {t("dashboard.teamCount")}
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
              />
            </TabsContent>

            <TabsContent value="project">
              <div className="mt-6 space-y-6">
                {/* Projects in the event */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                    <h2 className="text-lg font-semibold">{t("guest.projectSectionTitle")}</h2>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-auto min-w-37.5 justify-between">
                            <div className="flex items-center gap-2">
                              <Filter className="w-4 h-4 text-muted-foreground" />
                              <span>
                                {activeFilters.includes("all")
                                  ? t("guest.allProjects")
                                  : `Filtered (${activeFilters.length})`}
                              </span>
                            </div>
                            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel>{t("guest.filter")}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuCheckboxItem
                            checked={activeFilters.includes("all")}
                            onCheckedChange={(checked) => {
                              if (checked) setActiveFilters(["all"]);
                            }}
                          >
                            {t("guest.allProjects")}
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuCheckboxItem
                            checked={activeFilters.includes("rewards")}
                            onCheckedChange={(checked) => {
                              let next = activeFilters.filter((f) => f !== "all" && f !== "pending");
                              if (checked) {
                                next.push("rewards");
                              } else {
                                next = next.filter((f) => f !== "rewards");
                              }
                              if (next.length === 0) next = ["all"];
                              setActiveFilters(next);
                            }}
                          >
                            {t("guest.evaluated")}
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem
                            checked={activeFilters.includes("pending")}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setActiveFilters(["pending"]);
                              } else {
                                setActiveFilters(["all"]);
                              }
                            }}
                          >
                            {t("guest.pending")}
                          </DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Input
                        placeholder={t("guest.searchProjects")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="max-w-xs"
                      />
                    </div>
                  </div>

                  <UnifiedProjectList
                    projects={projects}
                    role="GUEST"
                    eventId={id}
                    currentUserId={userId}
                    eventStartView={localEvent?.startView ?? null}
                    searchQuery={searchQuery}
                    activeFilters={activeFilters}
                    projectRewards={projectRewards}
                    userVrBalance={
                      (localEvent?.myVirtualTotal ?? 0) - (localEvent?.myVirtualUsed ?? 0)
                    }
                    onAction={handleAction}
                    onGiveVr={handleGiveVr}
                    onPostComment={() => {
                      toast.success(t("toast.commentSuccess"));
                    }}
                    onRefresh={fetchTeamsData}
                    unitReward={localEvent?.unitReward ?? t("guest.defaultUnit")}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="result">
              <ResultSection eventId={id} role="GUEST" eventStartView={localEvent?.startView} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
