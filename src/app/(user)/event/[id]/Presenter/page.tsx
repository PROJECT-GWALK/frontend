"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building, Trophy, MessageSquare, Star, Gift, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { toast } from "sonner";
import type { EventData, Team } from "@/utils/types";
import InformationSection from "../components/InformationSection";
import CreateProjectDialog from "./components/CreateProjectDialog";
import EditProjectDialog from "./components/EditProjectDialog";
import type { PresenterProject } from "./components/types";
import { createTeam, getTeams, getPresenterStats } from "@/utils/apievent";
import { useSession } from "next-auth/react";
import Link from "next/link";
import UnifiedProjectList from "../components/UnifiedProjectList";
import ResultSection from "../components/ResultSection";
import CommentSection from "./components/Comment";
import OrganizerBanner from "../Organizer/components/OrganizerBanner";
import { useParams, useRouter } from "next/navigation";

export default function PresenterPage() {
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

export function PresenterView({ id, event }: Props) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [searchQuery, setSearchQuery] = useState("");
  const [tab, setTab] = useState<"dashboard" | "information" | "project" | "result">("dashboard");
  const [localEvent, setLocalEvent] = useState<EventData>(event);
  const [bannerOpen, setBannerOpen] = useState(false);

  // Presenter Stats
  type PresenterStats = {
    rank: number | string;
    score: number;
    comments: {
      total: number;
      guest: number;
      committee: number;
    };
    specialRewards: { name: string; image: string | null; count: number }[];
  };
  const [myStats, setMyStats] = useState<PresenterStats | null>(null);

  // Local project (mock) state for presenter
  type LocalProject = {
    id: string;
    title: string;
    description?: string;
    img?: string;
    videoLink?: string;
    files?: { name: string; url: string; fileTypeId?: string }[];
    members?: string[];
    owner?: boolean;
  };

  const [userProject, setUserProject] = useState<LocalProject | null>(null);
  const [projects, setProjects] = useState<PresenterProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const { t } = useLanguage();

  const now = new Date();
  const eventStarted = !localEvent.startView || now >= new Date(localEvent.startView);

  const isSubmissionActive = localEvent
    ? (!localEvent.startJoinDate || now >= new Date(localEvent.startJoinDate)) &&
      (!localEvent.endJoinDate || now <= new Date(localEvent.endJoinDate))
    : true;

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
        }));
        setProjects(mappedProjects);

        // Update userProject if user is in one of these teams
        if (userId) {
          const myTeam = teams.find((t) => t.participants.some((p) => p.userId === userId));
          if (myTeam) {
            const me = myTeam.participants.find((p) => p.userId === userId);
            setUserProject({
              id: myTeam.id,
              title: myTeam.teamName,
              description: myTeam.description,
              img: myTeam.imageCover || "/banner.png",
              videoLink: myTeam.videoLink,
              files:
                myTeam.files?.map((f) => ({
                  name: f.fileUrl.split("/").pop() || "File",
                  url: f.fileUrl,
                  fileTypeId: f.fileTypeId,
                })) || [],
              members: myTeam.participants?.map((p) => p.user?.name || "Unknown") || [],
              owner: me?.isLeader || false,
            });
          } else {
            setUserProject(null);
          }
        }
      }
    } catch (e) {
      console.error("Failed to fetch teams", e);
    } finally {
      setProjectsLoading(false);
    }
  };

  const fetchMyStats = useCallback(async () => {
    try {
      const res = await getPresenterStats(id);
      if (res.message === "ok") {
        setMyStats(res.stats);
      }
    } catch (e) {
      console.error("Failed to fetch presenter stats", e);
    }
  }, [id]);

  useEffect(() => {
    fetchTeamsData();
  }, [id, userId]);

  useEffect(() => {
    if (userProject) {
      fetchMyStats();
    }
  }, [userProject, fetchMyStats]);

  // Redirect from dashboard if not in a team
  useEffect(() => {
    if (!projectsLoading && !userProject && tab === "dashboard") {
      setTab("project");
    }
  }, [projectsLoading, userProject, tab]);

  const [createOpen, setCreateOpen] = useState(false);

  // UI state for project viewer/editor
  const [viewOpen, setViewOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(false);
  const [projectForm, setProjectForm] = useState<PresenterProject | null>(null);

  return (
    <div className="min-h-screen bg-background w-full justify-center flex">
      <div className="w-full">
        <OrganizerBanner event={localEvent} open={bannerOpen} onOpenChange={setBannerOpen} />
        <div className="max-w-6xl mx-auto mt-6">
          <Card
            className="border-none shadow-md mb-6 transition-all hover:shadow-lg relative overflow-hidden"
            style={{ borderLeft: "6px solid var(--role-presenter)" }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(to right, var(--role-presenter), transparent)",
                opacity: 0.05,
              }}
            />
            <CardHeader className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                {/* LEFT SIDE: Title & Status */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <CardTitle
                      className="text-2xl lg:text-3xl font-bold"
                      style={{ color: "var(--role-presenter)" }}
                    >
                      {localEvent?.eventName || "Event"}
                    </CardTitle>
                  </div>
                </div>

                {/* RIGHT SIDE: Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Presenter Label */}
                  <div className="h-10 inline-flex items-center justify-center gap-2 px-5 rounded-lg bg-(--role-presenter) text-white font-medium shadow-md select-none">
                    <Building className="h-4 w-4" />
                    <span>Presenter</span>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {!isSubmissionActive && (
            <Card className="border-l-4 border-l-destructive bg-destructive/10 mb-6">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <p className="text-sm font-medium text-destructive">
                  {t("projectDetail.messages.submissionEnded") ||
                    "Submission period has ended. You cannot create or edit projects."}
                </p>
              </CardContent>
            </Card>
          )}

          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mt-6">
            <TabsList className="w-full flex flex-wrap h-auto p-1 justify-start gap-1 bg-muted/50">
              {userProject && (
                <TabsTrigger value="dashboard" className="flex-1 min-w-25">
                  {t("eventTab.dashboard")}
                </TabsTrigger>
              )}
              <TabsTrigger value="information" className="flex-1 min-w-25">
                {t("eventTab.information")}
              </TabsTrigger>
              <TabsTrigger value="project" className="flex-1 min-w-25">
                {t("eventTab.projects")}
              </TabsTrigger>
              <TabsTrigger value="result" className="flex-1 min-w-25">
                {t("eventTab.results")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              {!eventStarted ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <Trophy className="h-16 w-16 mb-4 opacity-20" />
                  <h3 className="text-xl font-semibold mb-2">{t("resultsTab.notStartedTitle") || "Event Not Started"}</h3>
                  <p className="text-sm">{t("resultsTab.notStartedDesc") || "Rankings will be available once the event starts."}</p>
                </div>
              ) : (
                myStats && (
                <div className="mt-6 mb-8 space-y-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    {t("presenterDashboard.title")}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Rank & Score */}
                    <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-all">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          {t("presenterDashboard.rank")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold">#{myStats.rank}</span>
                          <span className="text-sm text-muted-foreground">
                            / {projects.length} {t("presenterDashboard.project")}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("presenterDashboard.score")}:{" "}
                          <span className="font-semibold text-foreground">{myStats.score}</span>{" "}
                          {localEvent?.unitReward ?? "coins"}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Comments Breakdown */}
                    <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          {t("presenterDashboard.commentRe")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold">{myStats.comments.total}</span>
                          <span className="text-sm text-muted-foreground">
                            {t("presenterDashboard.comment")}
                          </span>
                        </div>
                        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                          <div className="flex justify-between">
                            <span>{t("presenterDashboard.guest")}:</span>
                            <span className="font-medium text-foreground">
                              {myStats.comments.guest}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>{t("presenterDashboard.committee")}:</span>
                            <span className="font-medium text-foreground">
                              {myStats.comments.committee}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Special Rewards Votes */}
                    <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-all md:col-span-2">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          {t("presenterDashboard.voteSR")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {myStats.specialRewards.length > 0 ? (
                          <div className="grid gap-3 sm:grid-cols-2 max-h-75 overflow-y-auto custom-scrollbar pr-2">
                            {myStats.specialRewards.map((reward, index) => (
                              <div
                                key={index}
                                className={`border rounded-lg p-3 space-y-3 transition-all ${
                                  reward.count > 0
                                    ? "bg-muted/30 border-border"
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
                                        {t("presenterDashboard.committeeVote")}
                                      </div>
                                      <div
                                        className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md ${
                                          reward.count > 0
                                            ? "bg-primary/10 text-primary"
                                            : "bg-muted text-muted-foreground"
                                        }`}
                                      >
                                        <span className="text-sm font-bold">{reward.count}</span>
                                        <Users className="h-3 w-3" />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-15 text-muted-foreground text-sm">
                            <Star className="h-5 w-5 mb-1 opacity-20" />
                            {t("presenterDashboard.noVote")}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
              <div className="mt-6">{/* Removed General Stats Cards as requested */}</div>

              {/* Comments Section */}
              {userProject?.id && (
                <CommentSection eventId={id} projectId={userProject.id} myRole="PRESENTER" />
              )}
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
                {/* My Project */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold">{t("guest.myProjects")}</h2>
                  </div>

                  {!userProject ? (
                    <Card className="p-6 rounded-xl">
                      <div className="text-sm text-muted-foreground">
                        {t("myProject.noProject")}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => setCreateOpen(true)}
                          disabled={
                            !!localEvent?.maxTeams && projects.length >= localEvent.maxTeams
                          }
                        >
                          {t("myProject.createProject")}
                        </Button>
                      </div>
                    </Card>
                  ) : (
                    <Card className="p-4 rounded-xl border">
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                        <Link
                          href={`/event/${id}/Projects/${userProject.id}`}
                          className="relative w-full md:w-45 h-30 shrink-0 block overflow-hidden rounded-lg group border bg-muted"
                        >
                          <Image
                            src={userProject.img || "/banner.png"}
                            alt={userProject.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        </Link>

                        <div className="flex-1 min-w-0 space-y-2">
                          <div>
                            <div className="font-semibold text-lg truncate">
                              {userProject.title}
                            </div>
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {userProject.description || t("myProject.noProjectDesc")}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {(userProject.members || []).map((m) => (
                              <div
                                key={m}
                                className="px-2 py-0.5 rounded-md bg-muted text-xs text-muted-foreground"
                              >
                                {m}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2 mt-2 md:mt-0">
                          <Link href={`/event/${id}/Projects/${userProject.id}`} target="_blank">
                            <Button variant="outline">{t("myProject.editProject")}</Button>
                          </Link>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Create Project Dialog */}
                  <CreateProjectDialog
                    open={createOpen}
                    onOpenChange={setCreateOpen}
                    onSuccess={fetchTeamsData}
                    isSubmissionActive={isSubmissionActive}
                  />
                </div>

                {/* Projects in the event */}
                <div>
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <h2 className="text-lg font-semibold">{t("guest.allProjects")}</h2>
                    <Input
                      placeholder={t("myProject.searchPlaceholder")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>

                  <UnifiedProjectList
                    projects={projects}
                    searchQuery={searchQuery}
                    eventId={event.id}
                    role="PRESENTER"
                    currentUserId={userId}
                    eventStartView={localEvent?.startView ?? null}
                    loading={projectsLoading}
                    onRefresh={fetchTeamsData}
                    unitReward={localEvent?.unitReward ?? "coins"}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="result">
              <ResultSection eventId={id} role="PRESENTER" eventStartView={localEvent.startView} />
            </TabsContent>
          </Tabs>
        </div>
        {/* Edit Dialog */}
        {projectForm && (
          <EditProjectDialog
            open={viewOpen}
            onOpenChange={setViewOpen}
            project={projectForm}
            eventId={id}
            onSuccess={fetchTeamsData}
            isSubmissionActive={isSubmissionActive}
          />
        )}
      </div>
    </div>
  );
}
