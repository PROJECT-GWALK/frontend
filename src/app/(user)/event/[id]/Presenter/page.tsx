"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { toast } from "sonner";
import type { EventData, Team } from "@/utils/types";
import InformationSection from "../components/InformationSection";
import CreateProjectDialog from "./components/CreateProjectDialog";
import EditProjectDialog from "./components/EditProjectDialog";
import type { PresenterProject } from "./components/types";
import { createTeam, getTeams } from "@/utils/apievent";
import { useSession } from "next-auth/react";
import Link from "next/link";
import UnifiedProjectList from "../components/UnifiedProjectList";

type Props = {
  id: string;
  event: EventData;
};

export default function PresenterView({ id, event }: Props) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [searchQuery, setSearchQuery] = useState("");
  const [tab, setTab] = useState<
    "dashboard" | "information" | "project" | "result"
  >("dashboard");
  const [localEvent, setLocalEvent] = useState<EventData>(event);
  const [bannerOpen, setBannerOpen] = useState(false);

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
          members:
            t.participants?.map((p) => p.user?.name || "Unknown") || [],
        }));
        setProjects(mappedProjects);

        // Update userProject if user is in one of these teams
        if (userId) {
          const myTeam = teams.find((t) =>
            t.participants.some((p) => p.userId === userId)
          );
          if (myTeam) {
            const me = myTeam.participants.find(
              (p) => p.userId === userId
            );
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
              members:
                myTeam.participants?.map(
                  (p) => p.user?.name || "Unknown"
                ) || [],
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

  useEffect(() => {
    fetchTeamsData();
  }, [id, userId]);

  const [createOpen, setCreateOpen] = useState(false);

  // UI state for project viewer/editor
  const [viewOpen, setViewOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(false);
  const [projectForm, setProjectForm] = useState<PresenterProject | null>(null);

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
            style={{ borderLeft: "6px solid var(--role-presenter)" }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to right, var(--role-presenter), transparent)",
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
                  <div className="h-10 inline-flex items-center justify-center gap-2 px-5 rounded-lg bg-[var(--role-presenter)] text-white font-medium shadow-md select-none">
                    <Building className="h-4 w-4" />
                    <span>Presenter</span>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as typeof tab)}
            className="mt-6"
          >
            <TabsList className="w-full flex flex-wrap h-auto p-1 justify-start gap-1 bg-muted/50">
              <TabsTrigger value="dashboard" className="flex-1 min-w-[100px]">Dashboard</TabsTrigger>
              <TabsTrigger value="information" className="flex-1 min-w-[100px]">Information</TabsTrigger>
              <TabsTrigger value="project" className="flex-1 min-w-[100px]">Projects</TabsTrigger>
              <TabsTrigger value="result" className="flex-1 min-w-[100px]">Result</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* จำนวนผู้เข้าร่วมทั้งหมด */}
                <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        <Users className="h-5 w-5" />
                      </div>
                      {t("dashboard.totalParticipants")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-foreground">
                      {(localEvent?.presentersCount ?? 0) +
                        (localEvent?.guestsCount ?? 0) +
                        (localEvent?.committeeCount ?? 0)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {t("dashboard.presenterCount")}:{" "}
                      {localEvent?.presentersCount ?? localEvent?.maxTeams ?? 0}{" "}
                      | {t("dashboard.guestCount")}:{" "}
                      {localEvent?.guestsCount ?? 0} |{" "}
                      {t("dashboard.committeeCount")}:{" "}
                      {localEvent?.committeeCount ?? 0}
                    </p>
                  </CardContent>
                </Card>

                {/* ผู้นำเสนอ */}
                <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                      <div className="p-2 rounded-lg bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                        <Users className="h-5 w-5" />
                      </div>
                      {t("dashboard.presenterCount")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-foreground">
                      {localEvent?.presentersCount ?? localEvent?.maxTeams ?? 0}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {t("dashboard.teamCount")}
                    </p>
                  </CardContent>
                </Card>

                {/* ผู้เข้าร่วม */}
                <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                      <div className="p-2 rounded-lg bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                        <Users className="h-5 w-5" />
                      </div>
                      {t("dashboard.guestCount")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-foreground">
                      {localEvent?.guestsCount ?? 0}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {t("dashboard.commentGiven")}:{" "}
                      {localEvent?.participantsCommentCount ?? 90} /{" "}
                      {t("dashboard.used")}:{" "}
                      {localEvent?.participantsVirtualUsed ?? 2000}
                    </p>
                  </CardContent>
                </Card>

                {/* กรรมการ */}
                <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                      <div className="p-2 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                        <Users className="h-5 w-5" />
                      </div>
                      {t("dashboard.committeeCount")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-foreground">
                      {localEvent?.committeeCount ?? 0}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {t("dashboard.feedbackGiven")}:{" "}
                      {localEvent?.committeeFeedbackCount ?? 10} /{" "}
                      {t("dashboard.used")}:{" "}
                      {localEvent?.committeeVirtualUsed ?? 2000}
                    </p>
                  </CardContent>
                </Card>

                {/* ความคิดเห็นทั้งหมด */}
                <Card className="lg:col-span-2 border-none shadow-md hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                      <div className="p-2 rounded-lg bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300">
                        <Users className="h-5 w-5" />
                      </div>
                      {t("dashboard.allComments")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-foreground">
                      {localEvent?.opinionsGot ?? 33}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {t("dashboard.presenterCount")}:{" "}
                      {localEvent?.opinionsPresenter ?? 10} |{" "}
                      {t("dashboard.guestCount")}:{" "}
                      {localEvent?.opinionsGuest ?? 20} |{" "}
                      {t("dashboard.committeeCount")}:{" "}
                      {localEvent?.opinionsCommittee ?? 3}
                    </p>
                  </CardContent>
                </Card>

                {/* Virtual Rewards */}
                <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                      <div className="p-2 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                        <Users className="h-5 w-5" />
                      </div>
                      {t("dashboard.reward")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {t("dashboard.usedAlready")}
                      </span>
                      <span className="text-lg font-bold">
                        {localEvent?.vrUsed ?? 20000}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-amber-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${
                            ((localEvent?.vrUsed ?? 20000) /
                              (localEvent?.vrTotal ?? 50000)) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>
                        {t("dashboard.remaining")} {t("dashboard.total")}{" "}
                        {(localEvent?.vrTotal ?? 50000) -
                          (localEvent?.vrUsed ?? 20000)}
                      </span>
                      <span>
                        {t("dashboard.total")} {localEvent?.vrTotal ?? 50000}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* รางวัลพิเศษ */}
                <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                      <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                        <Users className="h-5 w-5" />
                      </div>
                      {t("dashboard.specialAwards")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-foreground">
                      {localEvent?.specialPrizeUsed ?? 4}{" "}
                      <span className="text-xl font-normal text-muted-foreground">
                        / {localEvent?.specialPrizeCount ?? 5}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {t("dashboard.usedOverTotal")}
                    </p>
                  </CardContent>
                </Card>

                {/* ยังไม่ได้ใช้ */}
                <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                      <div className="p-2 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300">
                        <Users className="h-5 w-5" />
                      </div>
                      {t("dashboard.remainingAwards")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(
                        localEvent?.awardsUnused ?? ["รางวัล AI ยอดเยี่ยม"]
                      ).map((a, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                          <span className="text-sm font-medium">{a}</span>
                        </div>
                      ))}
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
                linkLabel="ลิงก์"
              />
            </TabsContent>

            <TabsContent value="project">
              <div className="mt-6 space-y-6">
                {/* My Project */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold">My Project</h2>
                    <span className="text-sm text-muted-foreground">
                      Teams: {projects.length} / {localEvent?.maxTeams || "-"}
                    </span>
                  </div>

                  {!userProject ? (
                    <Card className="p-6 rounded-xl">
                      <div className="text-sm text-muted-foreground">
                        You don&apos;t have any project yet. Create or join a group
                        to appear here.
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => setCreateOpen(true)}
                          disabled={!!localEvent?.maxTeams && projects.length >= localEvent.maxTeams}
                        >
                          Create Project
                        </Button>
                      </div>
                    </Card>
                  ) : (
                    <Card className="p-4 rounded-xl border">
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                        <Link
                          href={`/event/${id}/Projects/${userProject.id}`}
                          className="relative w-full md:w-[180px] h-[120px] shrink-0 block overflow-hidden rounded-lg group border bg-muted"
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
                              {userProject.description ||
                                "No description provided"}
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
                          <Link
                            href={`/event/${id}/Projects/${userProject.id}`}
                          >
                            <Button variant="outline">Edit</Button>
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
                  />
                </div>

                {/* Projects in the event */}
                <div>
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <h2 className="text-lg font-semibold">Projects</h2>
                    <Input
                      placeholder="Search projects by name..."
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
                    loading={projectsLoading}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="result">
              <div className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>ผลการจัดอันดับ</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-muted-foreground">
                      ยังไม่มีผลการจัดอันดับ
                    </div>
                  </CardContent>
                </Card>
              </div>
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
          />
        )}
      </div>
    </div>
  );
}
