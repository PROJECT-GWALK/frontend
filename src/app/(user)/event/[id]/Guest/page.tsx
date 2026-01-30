"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { getTeams, giveVr, resetVr } from "@/utils/apievent";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building, BadgeCheck, MessageSquare, Gift } from "lucide-react";
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
import type { EventData, Team } from "@/utils/types";
import InformationSection from "../components/InformationSection";
import CreateProjectDialog from "../Presenter/components/CreateProjectDialog";
import type { PresenterProject } from "../Presenter/components/types";
import UnifiedProjectList from "../components/UnifiedProjectList";
import ResultSection from "../components/ResultSection";

type Props = {
  id: string;
  event: EventData;
};

export default function GuestView({ id, event }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "scored" | "unscored">("all");
  const [tab, setTab] = useState<"dashboard" | "information" | "project" | "result">("dashboard");
  const [localEvent, setLocalEvent] = useState<EventData>(event);
  const [bannerOpen, setBannerOpen] = useState(false);

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
  const { t } = useLanguage();

  const [userProject, setUserProject] = useState<LocalProject | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
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
  };

  useEffect(() => {
    fetchTeamsData();
  }, [id]);

  // UI state for project viewer/editor
  const [viewOpen, setViewOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(false);
  const [projectForm, setProjectForm] = useState<PresenterProject | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full">
        <div
          className="relative w-full aspect-video md:aspect-2/1 md:h-100 overflow-hidden cursor-zoom-in"
          onClick={() => setBannerOpen(true)}
        >
          {localEvent?.imageCover ? (
            <Image
              src={localEvent.imageCover}
              alt={localEvent.eventName || t("guest.bannerAlt")}
              fill
              sizes="100vw"
              className="object-cover rounded-xl"
            />
          ) : (
            <Image
              src="/banner.png"
              alt={t("guest.defaultBannerAlt")}
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
                      {t("dashboard.allComments")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-foreground">
                      {localEvent?.opinionsGot?.toLocaleString() ?? 33}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {t("guest.totalFeedbackDesc")}
                    </p>
                    <div className="h-2 w-full bg-pink-100 dark:bg-pink-900/30 rounded-full overflow-hidden mt-4">
                      <div
                        className="h-full bg-linear-to-r from-pink-500 to-rose-400 dark:from-pink-600 dark:to-rose-400 rounded-full transition-all duration-1000"
                        style={{ width: "65%" }} 
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Virtual Rewards (Global) */}
                <Card className="border-0 dark:border dark:border-white/10 shadow-md hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                      <div className="p-2 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400">
                        <Gift className="h-5 w-5" />
                      </div>
                      {t("dashboard.reward")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t("dashboard.usedAlready")}</span>
                      <span className="text-lg font-bold text-foreground">{localEvent?.vrUsed?.toLocaleString() ?? 20000}</span>
                    </div>
                    <div className="h-2 w-full bg-purple-100 dark:bg-purple-900/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-purple-500 to-indigo-400 dark:from-purple-600 dark:to-indigo-400 rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${
                            ((localEvent?.vrUsed ?? 20000) / (localEvent?.vrTotal ?? 50000)) * 100
                          }%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>
                         {t("guest.totalPool")} {(localEvent?.vrTotal ?? 50000).toLocaleString()}
                      </span>
                      <span>
                        {Math.round(
                          ((localEvent?.vrUsed ?? 20000) /
                            (localEvent?.vrTotal ?? 50000)) *
                            100
                        )}
                        %
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="information">
              <InformationSection
                id={id}
                event={localEvent as EventData}
                editable={false}
                linkLabel={t("information.link")}
              />
            </TabsContent>

            <TabsContent value="project">
              <div className="mt-6 space-y-6">
                {/* Projects in the event */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                    <h2 className="text-lg font-semibold">{t("guest.projectSectionTitle")}</h2>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Select
                        value={filterStatus}
                        onValueChange={(v) =>
                          setFilterStatus(v as "all" | "scored" | "unscored")
                        }
                      >
                        <SelectTrigger className="w-32.5">
                          <SelectValue placeholder={t("guest.filter")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("guest.allProjects")}</SelectItem>
                          <SelectItem value="scored">{t("guest.evaluated")}</SelectItem>
                          <SelectItem value="unscored">{t("guest.pending")}</SelectItem>
                        </SelectContent>
                      </Select>
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
                    searchQuery={searchQuery}
                    filterStatus={filterStatus}
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
              <div className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t("guest.ranking")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-muted-foreground">{t("guest.noRanking")}</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        {/* Edit Dialog (existing code left intact) */}
      </div>
    </div>
  );
}
