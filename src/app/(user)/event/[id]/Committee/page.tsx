"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building } from "lucide-react";
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
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Personal Virtual Rewards summary */}
                <div className="lg:col-span-3">
                  <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300 p-4">
                    <div className="max-w-2xl mx-auto">
                      <h3 className="text-lg font-semibold mb-3">Virtual Rewards ของฉัน</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                          <div className="text-sm text-muted-foreground">คงเหลือ</div>
                          <div className="text-2xl font-bold text-emerald-600">
                            {localEvent?.committeeVirtualRemaining ?? 2000}
                          </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                          <div className="text-sm text-muted-foreground">ใช้ไป</div>
                          <div className="text-2xl font-bold text-rose-600">
                            {localEvent?.committeeVirtualUsed ?? 8000}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* จำนวนผู้เข้าร่วมทั้งหมด */}
                <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        <Users className="h-5 w-5" />
                      </div>
                      จำนวนผู้เข้าร่วมทั้งหมด
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-foreground">
                      {(localEvent?.presentersCount ?? 0) +
                        (localEvent?.guestsCount ?? 0) +
                        (localEvent?.committeeCount ?? 0)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      ผู้นำเสนอ: {localEvent?.presentersCount ?? localEvent?.maxTeams ?? 0} |
                      ผู้เข้าร่วม: {localEvent?.guestsCount ?? 0} | กรรมการ:{" "}
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
                      ผู้นำเสนอ
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-foreground">
                      {localEvent?.presentersCount ?? localEvent?.maxTeams ?? 0}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">จำนวนทีม</p>
                  </CardContent>
                </Card>

                {/* กรรมการ */}
                <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                      <div className="p-2 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                        <Users className="h-5 w-5" />
                      </div>
                      กรรมการ
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-foreground">
                      {localEvent?.committeeCount ?? 0}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      ให้ฟีดแบ็ก: {localEvent?.committeeFeedbackCount ?? 10} / ใช้ไป:{" "}
                      {localEvent?.committeeVirtualUsed ?? 2000}
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
                      Virtual Rewards
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">ใช้ไปแล้ว</span>
                      <span className="text-lg font-bold">{localEvent?.vrUsed ?? 20000}</span>
                    </div>
                    <div className="h-2 w-full bg-amber-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${
                            ((localEvent?.vrUsed ?? 20000) / (localEvent?.vrTotal ?? 50000)) * 100
                          }%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>
                        คงเหลือ {(localEvent?.vrTotal ?? 50000) - (localEvent?.vrUsed ?? 20000)}
                      </span>
                      <span>ทั้งหมด {localEvent?.vrTotal ?? 50000}</span>
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
                      รางวัลพิเศษ
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-foreground">
                      {localEvent?.specialPrizeUsed ?? 4}{" "}
                      <span className="text-xl font-normal text-muted-foreground">
                        / {localEvent?.specialPrizeCount ?? 5}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">ใช้ไป / ทั้งหมด</p>
                  </CardContent>
                </Card>

                {/* ยังไม่ได้ใช้ */}
                <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                      <div className="p-2 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300">
                        <Users className="h-5 w-5" />
                      </div>
                      ยังไม่ได้ใช้
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(localEvent?.awardsUnused ?? ["รางวัล AI ยอดเยี่ยม"]).map((a, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                          <span className="text-sm font-medium">{a}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Projects overview for committee with action buttons */}
                <div className="lg:col-span-3">
                  <h3 className="text-xl font-semibold mt-6 mb-4">Projects</h3>
                  <div className="space-y-4">
                    {projects.map((p) => (
                      <Card
                        key={p.id}
                        className="border-none shadow-md hover:shadow-xl transition-all duration-300"
                      >
                        <CardHeader>
                          <div className="flex items-center justify-between w-full">
                            <div>
                              <div className="text-sm text-muted-foreground">{p.teamName}</div>
                              <CardTitle className="text-lg font-semibold">{p.title}</CardTitle>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">ให้ไป</div>
                              <div className="text-2xl font-bold text-foreground">
                                {projectRewards[p.id]?.vrGiven ?? 0}
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="space-y-2">
                              <div className="text-sm text-muted-foreground">ประเภทรางวัลพิเศษ</div>
                              <div className="text-sm font-medium">
                                {projectRewards[p.id]?.specialGiven ?? "-"}
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="ghost"
                                onClick={() => {
                                  setSelectedProjectId(p.id);
                                  setViewProjectOpen(true);
                                }}
                                className="bg-sky-500 text-white hover:bg-sky-600"
                              >
                                ดูข้อมูลโครงการ
                              </Button>
                              <Button
                                variant="ghost"
                                onClick={() => {
                                  setSelectedProjectId(p.id);
                                  setCommentOpen(true);
                                }}
                                className="bg-pink-400 text-white hover:bg-pink-500"
                              >
                                แสดงความคิดเห็น
                              </Button>
                              <Button
                                variant="ghost"
                                onClick={() => {
                                  setSelectedProjectId(p.id);
                                  setVrDialogOpen(true);
                                }}
                                className="bg-green-500 text-white hover:bg-green-600"
                              >
                                ให้ Virtual Reward
                              </Button>
                              <Button
                                variant="ghost"
                                onClick={() => {
                                  if (confirm("ยืนยันการขอคืน Virtual Reward สำหรับโครงการนี้?")) {
                                    setProjectRewards((prev) => ({
                                      ...prev,
                                      [p.id]: { ...prev[p.id], vrGiven: 0 },
                                    }));
                                    toast.success("คืน Virtual Reward เรียบร้อย");
                                  }
                                }}
                                className="bg-red-500 text-white hover:bg-red-600"
                              >
                                ขอคืน Virtual Reward
                              </Button>
                              <Button
                                variant="ghost"
                                onClick={() => {
                                  setSelectedProjectId(p.id);
                                  setSpecialDialogOpen(true);
                                }}
                                className="bg-amber-500 text-white hover:bg-amber-600"
                              >
                                ให้รางวัลพิเศษ
                              </Button>
                              <Button
                                variant="ghost"
                                onClick={() => {
                                  if (confirm("ยืนยันการขอคืนรางวัลพิเศษสำหรับโครงการนี้?")) {
                                    setProjectRewards((prev) => ({
                                      ...prev,
                                      [p.id]: { ...prev[p.id], specialGiven: null },
                                    }));
                                    toast.success("คืนรางวัลพิเศษเรียบร้อย");
                                  }
                                }}
                                className="bg-rose-500 text-white hover:bg-rose-600"
                              >
                                ขอคืนรางวัลพิเศษ
                              </Button>
                            </div>
                          </div>
                        </CardContent>
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
