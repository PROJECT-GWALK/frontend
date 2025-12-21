"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building, MessageSquare, BadgeCheck, Award } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { toast } from "sonner";
import type { EventData } from "@/utils/types";
import InformationSection from "../InformationSection";
import ProjectsList from "../Presenter/components/ProjectsList";
import CreateProjectDialog from "../Presenter/components/CreateProjectDialog";
import { SAMPLE_PROJECTS } from "../Presenter/components/mockProjects";
import type { PresenterProject } from "../Presenter/components/types";

type Props = {
  id: string;
  event: EventData;
};

export default function CommitteeView({ id, event }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
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

  const [userProject, setUserProject] = useState<LocalProject | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [projects, setProjects] = useState<PresenterProject[]>(SAMPLE_PROJECTS);

  // Committee-specific UI state for project interactions
  const [projectRewards, setProjectRewards] = useState<
    Record<string, { vrGiven: number; specialGiven: string | null }>
  >(
    SAMPLE_PROJECTS.reduce((acc, p) => {
      acc[p.id] = { vrGiven: 0, specialGiven: null };
      return acc;
    }, {} as Record<string, { vrGiven: number; specialGiven: string | null }>)
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [viewProjectOpen, setViewProjectOpen] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [vrDialogOpen, setVrDialogOpen] = useState(false);
  const [vrAmount, setVrAmount] = useState<number>(0);
  const [specialDialogOpen, setSpecialDialogOpen] = useState(false);
  const [specialChoice, setSpecialChoice] = useState<string | null>(null);

  // UI state for project viewer/editor
  const [viewOpen, setViewOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(false);
  const [projectForm, setProjectForm] = useState<PresenterProject | null>(null);
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full">
        <div
          className="relative w-full aspect-2/1 md:h-[400px] overflow-hidden cursor-zoom-in"
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
                  <div className="h-10 inline-flex items-center justify-center gap-2 px-5 rounded-lg bg-[var(--role-committee)] text-white font-medium shadow-md select-none">
                    <Building className="h-4 w-4" />
                    <span>Committee</span>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mt-6">
            <TabsList>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="information">Information</TabsTrigger>
              <TabsTrigger value="project">Projects</TabsTrigger>
              <TabsTrigger value="result">Result</TabsTrigger>
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
                            {localEvent?.committeeVirtualUsed ?? 20000}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {t("committeeSection.total")} {localEvent?.committeeVirtualTotal ?? 50000}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-amber-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                          style={{
                            width: `${
                              ((localEvent?.committeeVirtualUsed ?? 20000) /
                                (localEvent?.committeeVirtualTotal ?? 50000)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-amber-600 font-medium text-right">
                        {t("committeeSection.remaining")}{" "}
                        {(localEvent?.committeeVirtualTotal ?? 50000) -
                          (localEvent?.committeeVirtualUsed ?? 20000)}
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
                          {localEvent?.feedbackGiven ?? 8}{" "}
                          <span className="text-sm font-normal text-muted-foreground">
                            / {localEvent?.totalProjects ?? 10}
                          </span>
                        </span>
                        <span className="text-sm text-muted-foreground">{t("committeeSection.feedbackGiven")}</span>
                      </div>
                      <div className="h-2 w-full bg-rose-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full transition-all duration-1000"
                          style={{
                            width: `${
                              ((localEvent?.feedbackGiven ?? 8) /
                                (localEvent?.totalProjects ?? 10)) *
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

                {/* Projects overview for committee with action buttons */}
                <div className="lg:col-span-3">
                  <div className="flex items-center justify-between gap-4 mb-3 mt-4">
                    <h2 className="text-xl font-semibold">Projects</h2>
                    {/* Search Input Unable to search */}
                    <Input
                      placeholder="Search projects by name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                  <div className="space-y-6">
                    {projects.map((p) => (
                      <Card
                        key={p.id}
                        className="group border-none shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden bg-white/50 backdrop-blur-sm"
                      >
                        <div className="flex flex-col md:flex-row">
                          {/* Project Image Section */}
                          <div className="relative w-full md:w-64 h-48 md:h-auto overflow-hidden bg-slate-100">
                            <img
                              src={p.imageUrl || "/api/placeholder/400/300"} // Fallback image
                              alt={p.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute top-2 left-2">
                              <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/90 text-slate-700 rounded shadow-sm">
                                {p.teamName}
                              </span>
                            </div>
                          </div>

                          {/* Content Section */}
                          <div className="flex-1 p-5 flex flex-col justify-between">
                            <div className="flex justify-between items-start gap-4">
                              <div className="space-y-1">
                                <CardTitle className="text-xl font-bold text-slate-800 leading-tight">
                                  {p.title}
                                </CardTitle>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-xs text-muted-foreground">
                                    ประเภทรางวัลพิเศษ:
                                  </span>
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                      projectRewards[p.id]?.specialGiven
                                        ? "bg-amber-100 text-amber-700 border border-amber-200"
                                        : "bg-slate-100 text-slate-400"
                                    }`}
                                  >
                                    {projectRewards[p.id]?.specialGiven ?? "ยังไม่ได้รับ"}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right bg-slate-50 p-3 rounded-xl border border-slate-100 min-w-[100px]">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                  Virtual Reward Given
                                </div>
                                <div className="text-3xl font-black text-blue-600">
                                  {projectRewards[p.id]?.vrGiven?.toLocaleString() ?? 0}
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons Grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mt-6">
                              {/* Primary Actions */}
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSelectedProjectId(p.id);
                                  setViewProjectOpen(true);
                                }}
                                className="hover:bg-sky-50 hover:text-sky-600 border-slate-200"
                              >
                                ดูข้อมูล
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSelectedProjectId(p.id);
                                  setCommentOpen(true);
                                }}
                                className="hover:bg-pink-50 hover:text-pink-600 border-slate-200"
                              >
                                แสดงความเห็น
                              </Button>

                              {/* Reward Actions */}
                              <Button
                                onClick={() => {
                                  setSelectedProjectId(p.id);
                                  setVrDialogOpen(true);
                                }}
                                className="bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm"
                              >
                                ให้ Virtual Reward
                              </Button>
                              <Button
                                onClick={() => {
                                  setSelectedProjectId(p.id);
                                  setSpecialDialogOpen(true);
                                }}
                                className="bg-amber-500 text-white hover:bg-amber-600 shadow-sm"
                              >
                                ให้รางวัลพิเศษ
                              </Button>

                              {/* Undo Actions - Styled more subtly */}
                              <Button
                                variant="ghost"
                                onClick={() => handleResetVR(p.id)}
                                className="text-slate-400 hover:text-red-500 hover:bg-red-50 text-xs"
                              >
                                ขอคืน Virtual Reward
                              </Button>
                              <Button
                                variant="ghost"
                                onClick={() => handleResetSpecial(p.id)}
                                className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 text-xs"
                              >
                                ขอคืนรางวัลพิเศษ
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dialogs for project actions */}
              <Dialog open={viewProjectOpen} onOpenChange={setViewProjectOpen}>
                <DialogContent>
                  <DialogTitle>ข้อมูลโครงการ</DialogTitle>
                  <div className="mt-2">
                    {projects.find((pr) => pr.id === selectedProjectId) ? (
                      <div>
                        <h4 className="text-lg font-semibold">
                          {projects.find((pr) => pr.id === selectedProjectId)?.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-2">
                          {projects.find((pr) => pr.id === selectedProjectId)?.description}
                        </p>
                      </div>
                    ) : (
                      <p>ไม่มีข้อมูล</p>
                    )}
                  </div>
                  <DialogClose className="mt-4">ปิด</DialogClose>
                </DialogContent>
              </Dialog>

              <Dialog open={commentOpen} onOpenChange={setCommentOpen}>
                <DialogContent>
                  <DialogTitle>แสดงความคิดเห็น</DialogTitle>
                  <div className="mt-2">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="w-full rounded-md border p-2"
                      rows={6}
                    />
                    <div className="flex justify-end gap-2 mt-3">
                      <Button
                        onClick={() => {
                          setCommentOpen(false);
                          setCommentText("");
                        }}
                      >
                        ยกเลิก
                      </Button>
                      <Button
                        onClick={() => {
                          toast.success("ส่งความคิดเห็นเรียบร้อย");
                          setCommentOpen(false);
                          setCommentText("");
                        }}
                      >
                        ส่งความคิดเห็น
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={vrDialogOpen} onOpenChange={setVrDialogOpen}>
                <DialogContent>
                  <DialogTitle>ให้ Virtual Reward</DialogTitle>
                  <div className="mt-2">
                    <Input
                      type="number"
                      value={vrAmount}
                      onChange={(e) => setVrAmount(Number(e.target.value || 0))}
                      className="w-full"
                    />
                    <div className="flex justify-end gap-2 mt-3">
                      <Button
                        onClick={() => {
                          setVrDialogOpen(false);
                          setVrAmount(0);
                        }}
                      >
                        ยกเลิก
                      </Button>
                      <Button
                        onClick={() => {
                          if (!selectedProjectId) return;
                          setProjectRewards((prev) => ({
                            ...prev,
                            [selectedProjectId]: {
                              ...prev[selectedProjectId],
                              vrGiven: (prev[selectedProjectId]?.vrGiven ?? 0) + vrAmount,
                            },
                          }));
                          toast.success("ให้ Virtual Reward เรียบร้อย");
                          setVrDialogOpen(false);
                          setVrAmount(0);
                        }}
                      >
                        ยืนยัน
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={specialDialogOpen} onOpenChange={setSpecialDialogOpen}>
                <DialogContent>
                  <DialogTitle>ให้รางวัลพิเศษ</DialogTitle>
                  <div className="mt-2 space-y-3">
                    {(localEvent?.awardsUnused ?? ["รางวัล AI ยอดเยี่ยม"]).map((a) => (
                      <div key={a} className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="special"
                          checked={specialChoice === a}
                          onChange={() => setSpecialChoice(a)}
                        />
                        <div className="text-sm">{a}</div>
                      </div>
                    ))}
                    <div className="flex justify-end gap-2 mt-3">
                      <Button
                        onClick={() => {
                          setSpecialDialogOpen(false);
                          setSpecialChoice(null);
                        }}
                      >
                        ยกเลิก
                      </Button>
                      <Button
                        onClick={() => {
                          if (!selectedProjectId || !specialChoice) {
                            toast.error("โปรดเลือกของรางวัล");
                            return;
                          }
                          setProjectRewards((prev) => ({
                            ...prev,
                            [selectedProjectId]: {
                              ...prev[selectedProjectId],
                              specialGiven: specialChoice,
                            },
                          }));
                          toast.success("ให้รางวัลพิเศษเรียบร้อย");
                          setSpecialDialogOpen(false);
                          setSpecialChoice(null);
                        }}
                      >
                        ยืนยัน
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
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
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <h2 className="text-lg font-semibold">Projects</h2>
                    <Input
                      placeholder="Search projects by name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>

                  <ProjectsList projects={projects} searchQuery={searchQuery} eventId={event.id} />
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
                    <div className="text-muted-foreground">ยังไม่มีผลการจัดอันดับ</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
