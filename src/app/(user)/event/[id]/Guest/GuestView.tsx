"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { getTeams, giveVr, resetVr } from "@/utils/apievent";
import { useCallback, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building, BadgeCheck, MessageSquare, ChevronDown, Filter } from "lucide-react";
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

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>(["all"]);
  const [tab, setTab] = useState<"dashboard" | "information" | "project" | "result">("dashboard");
  const [localEvent, setLocalEvent] = useState<EventData>(event);
  const [bannerOpen, setBannerOpen] = useState(false);

  const { t } = useLanguage();
  const [projects, setProjects] = useState<PresenterProject[]>([]);

  // Guest-specific UI state for project interactions
  const [projectRewards, setProjectRewards] = useState<
    Record<string, { vrGiven: number; specialGiven: string | null }>
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
  }, [id]);

  useEffect(() => {
    fetchTeamsData();
  }, [fetchTeamsData]);

  return (
    <div className="min-h-screen bg-background w-full justify-center flex">
      <div className="w-full">
        <OrganizerBanner 
          event={localEvent} 
          open={bannerOpen} 
          onOpenChange={setBannerOpen} 
        />
        <div className="max-w-6xl mx-auto mt-6">
          <Card 
            className="border-0 dark:border dark:border-white/10 shadow-md mb-6 transition-all hover:shadow-lg relative overflow-hidden"
            style={{ borderLeft: "6px solid var(--role-guest)" }}
          >
            <div 
              className="absolute inset-0 pointer-events-none" 
              style={{ background: "linear-gradient(to right, var(--role-guest), transparent)", opacity: 0.05 }} 
            />
            <CardHeader className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                {/* LEFT SIDE: Title & Status */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <CardTitle 
                      className="text-2xl lg:text-3xl font-bold"
                      style={{ color: "var(--role-guest)" }}
                    >
                      {localEvent?.eventName || "Event"}
                    </CardTitle>
                  </div>
                </div>

                {/* RIGHT SIDE: Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Role Label */}
                  <div className="h-10 inline-flex items-center justify-center gap-2 px-5 rounded-lg bg-(--role-guest) text-white font-medium shadow-md select-none">
                    <Building className="h-4 w-4" />
                    <span>{t("guest.role")}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mt-6">
            <TabsList className="w-full flex flex-wrap h-auto p-1 justify-start gap-1 bg-muted/50">
              <TabsTrigger value="dashboard" className="flex-1 min-w-25">{t("guest.dashboard")}</TabsTrigger>
              <TabsTrigger value="information" className="flex-1 min-w-25">{t("guest.information")}</TabsTrigger>
              <TabsTrigger value="project" className="flex-1 min-w-25">{t("guest.projects")}</TabsTrigger>
              <TabsTrigger value="result" className="flex-1 min-w-25">{t("guest.result")}</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {/* My Virtual Rewards */}
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
                          <span className="text-3xl font-bold text-foreground">
                            {localEvent?.myVirtualUsed ?? 0}
                          </span>
                          <span className="text-lg text-muted-foreground">
                            / {localEvent?.myVirtualTotal ?? 0} {localEvent?.unitReward ?? t("guest.defaultUnit")}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{t("dashboard.givenTo")}</p>
                        <div className="flex items-baseline justify-end gap-1">
                          <span className="text-2xl font-bold text-foreground">
                            {Object.values(projectRewards).filter((r) => r.vrGiven > 0).length}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {t("dashboard.teamCount")}
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
                      {(localEvent?.myVirtualTotal ?? 0) - (localEvent?.myVirtualUsed ?? 0)} {localEvent?.unitReward ?? t("guest.defaultUnit")}
                    </p>
                  </CardContent>
                </Card>

                {/* Total Participants (Consolidated) */}
                <Card className="border-0 dark:border dark:border-white/10 shadow-md hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                        <Users className="h-5 w-5" />
                      </div>
                       {t("dashboard.totalParticipants")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-foreground mb-4">
                      {(localEvent?.presentersCount ?? 0) +
                        (localEvent?.guestsCount ?? 0) +
                        (localEvent?.committeeCount ?? 0)}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div className="p-2 rounded-lg bg-muted/50 dark:bg-muted/20">
                            <div className="font-semibold text-foreground">{localEvent?.presentersCount ?? 0}</div>
                            <div className="text-xs text-muted-foreground">{t("dashboard.presenterCount")}</div>
                        </div>
                        <div className="p-2 rounded-lg bg-muted/50 dark:bg-muted/20">
                            <div className="font-semibold text-foreground">{localEvent?.guestsCount ?? 0}</div>
                            <div className="text-xs text-muted-foreground">{t("dashboard.guestCount")}</div>
                        </div>
                        <div className="p-2 rounded-lg bg-muted/50 dark:bg-muted/20">
                            <div className="font-semibold text-foreground">{localEvent?.committeeCount ?? 0}</div>
                            <div className="text-xs text-muted-foreground">{t("dashboard.committeeCount")}</div>
                        </div>
                    </div>
                  </CardContent>
                </Card>

                {/* All Comments */}
                <Card className="border-0 dark:border dark:border-white/10 shadow-md hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                      <div className="p-2 rounded-lg bg-pink-100 text-pink-700 dark:bg-pink-500/10 dark:text-pink-400">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      {t("dashboard.commentGiven")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-foreground">
                      {projects.filter((p) => p.myComment).length}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {t("dashboard.teamCount")}
                    </p>
                  </CardContent>
                </Card>
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
