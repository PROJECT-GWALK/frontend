"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { setEventPublicView, updateEvent } from "@/utils/apievent";
import { DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { toLocalDatetimeValue, toISOStringFromLocal } from "@/utils/function";
import type { EventData } from "@/utils/types";
import InformationSection from "../InformationSection";

type Props = {
  id: string;
  event: EventData;
};

export default function PresenterView({ id, event }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [tab, setTab] = useState<"dashboard" | "information" | "project" | "result">("dashboard");
  const [updatingPublic, setUpdatingPublic] = useState(false);
  const [localEvent, setLocalEvent] = useState<EventData>(event);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<
    null | "time" | "location" | "description" | "presenter" | "guest" | "committee" | "rewards"
  >(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

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
  const [createName, setCreateName] = useState("");
  const [viewOpen, setViewOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(false);
  const [projectForm, setProjectForm] = useState<LocalProject | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

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
          <Card className="border-none shadow-md bg-gradient-to-br from-background to-muted/20 mb-6 transition-all hover:shadow-lg">
            <CardHeader className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                {/* LEFT SIDE: Title & Status */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <CardTitle className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                      {localEvent?.eventName || "Event"}
                    </CardTitle>
                  </div>
                </div>

                {/* RIGHT SIDE: Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Presenter Label */}
                  <div className="h-10 inline-flex items-center justify-center gap-2 px-5 rounded-lg bg-lime-600 text-white font-medium shadow-md select-none">
                    <Building className="h-4 w-4" />
                    <span>Presenter</span>
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
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
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

                {/* ผู้เข้าร่วม */}
                <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                      <div className="p-2 rounded-lg bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                        <Users className="h-5 w-5" />
                      </div>
                      ผู้เข้าร่วม
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-foreground">
                      {localEvent?.guestsCount ?? 0}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      ให้คอมเมนต์: {localEvent?.participantsCommentCount ?? 90} / ใช้ไป:{" "}
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

                {/* ความคิดเห็นทั้งหมด */}
                <Card className="lg:col-span-2 border-none shadow-md hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                      <div className="p-2 rounded-lg bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300">
                        <Users className="h-5 w-5" />
                      </div>
                      ความคิดเห็นทั้งหมด
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-foreground">
                      {localEvent?.opinionsGot ?? 33}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      ผู้นำเสนอ: {localEvent?.opinionsPresenter ?? 10} | ผู้เข้าร่วม:{" "}
                      {localEvent?.opinionsGuest ?? 20} | กรรมการ:{" "}
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
                  <h2 className="text-lg font-semibold mb-3">My Project</h2>

                  {!userProject ? (
                    <Card className="p-6 rounded-xl">
                      <div className="text-sm text-muted-foreground">
                        You don't have any project yet. Create or join a group to appear here.
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button size="sm" variant="default" onClick={() => setCreateOpen(true)}>
                          Create Project
                        </Button>
                        <Button size="sm" variant="outline">
                          Join Project
                        </Button>
                      </div>
                    </Card>
                  ) : (
                    <Card className="p-4 rounded-xl">
                      <div className="flex items-start gap-4">
                        <Image
                          src={userProject.img || "/project1.png"}
                          alt={userProject.title}
                          width={96}
                          height={96}
                          className="rounded-lg object-cover bg-slate-50"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <div className="font-semibold text-lg">{userProject.title}</div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {userProject.description || "No description provided"}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setProjectForm(userProject);
                                  setViewOpen(true);
                                  setEditingProject(false);
                                }}
                              >
                                View Project
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setProjectForm(userProject);
                                  setViewOpen(true);
                                  setEditingProject(true);
                                }}
                              >
                                Edit
                              </Button>
                            </div>
                          </div>

                          <div className="mt-3">
                            <div className="text-sm font-medium">Members</div>
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {(userProject.members || []).map((m) => (
                                <div key={m} className="px-3 py-1 rounded-full bg-muted text-sm">
                                  {m}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Create Project Dialog */}
                  <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogContent className="max-w-md">
                      <DialogTitle>Create Project</DialogTitle>
                      <div className="mt-4 space-y-3">
                        <Label>Project name</Label>
                        <Input value={createName} onChange={(e) => setCreateName(e.target.value)} />
                        <Label>Description</Label>
                        <Textarea
                          value={projectForm?.description || ""}
                          onChange={(e) =>
                            setProjectForm((p) => ({ ...(p || {}), description: e.target.value }))
                          }
                        />
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCreateOpen(false);
                              setCreateName("");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              const id = `team-${Date.now().toString().slice(-6)}`;
                              const pr: LocalProject = {
                                id,
                                title: createName || `Team ${id}`,
                                description: (projectForm && projectForm.description) || "",
                                img: "/project1.png",
                                videoLink: "",
                                files: [],
                                members: ["You"],
                                owner: true,
                              };
                              setUserProject(pr);
                              setProjectForm(pr);
                              setCreateOpen(false);
                              setCreateName("");
                              toast.success("Project created");
                            }}
                          >
                            Create
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* View / Edit Project Dialog */}
                  <Dialog
                    open={viewOpen}
                    onOpenChange={(o) => {
                      setViewOpen(o);
                      if (!o) setEditingProject(false);
                    }}
                  >
                    <DialogContent className="max-w-3xl">
                      <DialogTitle>{projectForm?.title}</DialogTitle>
                      <DialogClose className="absolute top-3 right-3">
                        {/* <X className="h-4 w-4" /> */}
                      </DialogClose>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1">
                          <Image
                            src={projectForm?.img || "/project1.png"}
                            alt={projectForm?.title || "project"}
                            width={320}
                            height={200}
                            className="rounded-lg object-cover"
                          />
                          <div className="mt-4">
                            <div className="text-sm font-medium">Members</div>
                            <div className="mt-2 space-y-2">
                              {(projectForm?.members || []).map((m) => (
                                <div key={m} className="flex items-center justify-between gap-2">
                                  <div className="text-sm">{m}</div>
                                  {projectForm?.owner && m !== "You" && (
                                    <Button
                                      size="xs"
                                      variant="destructive"
                                      onClick={() => {
                                        setProjectForm((p) => ({
                                          ...(p || {}),
                                          members: (p?.members || []).filter((mm) => mm !== m),
                                        }));
                                      }}
                                    >
                                      Remove
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>

                            {projectForm?.owner && (
                              <div className="mt-4">
                                <Button size="sm" onClick={() => setShareOpen(true)}>
                                  Manage Members (Add by link / QR)
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="md:col-span-2 space-y-3">
                          <div>
                            <Label>Name</Label>
                            {editingProject ? (
                              <Input
                                value={projectForm?.title || ""}
                                onChange={(e) =>
                                  setProjectForm((p) => ({ ...(p || {}), title: e.target.value }))
                                }
                              />
                            ) : (
                              <div className="font-semibold">{projectForm?.title}</div>
                            )}
                          </div>

                          <div>
                            <Label>Description</Label>
                            {editingProject ? (
                              <Textarea
                                value={projectForm?.description || ""}
                                onChange={(e) =>
                                  setProjectForm((p) => ({
                                    ...(p || {}),
                                    description: e.target.value,
                                  }))
                                }
                              />
                            ) : (
                              <div className="text-sm text-muted-foreground">
                                {projectForm?.description || "No description"}
                              </div>
                            )}
                          </div>

                          <div>
                            <Label>Video Link</Label>
                            {editingProject ? (
                              <Input
                                value={projectForm?.videoLink || ""}
                                onChange={(e) =>
                                  setProjectForm((p) => ({
                                    ...(p || {}),
                                    videoLink: e.target.value,
                                  }))
                                }
                              />
                            ) : projectForm?.videoLink ? (
                              <a
                                href={projectForm.videoLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm text-primary"
                              >
                                Open video link
                              </a>
                            ) : (
                              <div className="text-sm text-muted-foreground">No video provided</div>
                            )}
                          </div>

                          <div>
                            <Label>Files</Label>
                            <div className="space-y-2 mt-2">
                              {(projectForm?.files || []).map((f, i) => (
                                <div key={i} className="flex items-center justify-between gap-2">
                                  <div className="text-sm">{f}</div>
                                  {editingProject && (
                                    <Button
                                      size="xs"
                                      variant="destructive"
                                      onClick={() =>
                                        setProjectForm((p) => ({
                                          ...(p || {}),
                                          files: (p?.files || []).filter((_, idx) => idx !== i),
                                        }))
                                      }
                                    >
                                      Remove
                                    </Button>
                                  )}
                                </div>
                              ))}
                              {editingProject && (
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="File name (mock)"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        const v = (e.target as HTMLInputElement).value.trim();
                                        if (!v) return;
                                        setProjectForm((p) => ({
                                          ...(p || {}),
                                          files: [...(p?.files || []), v],
                                        }));
                                        (e.target as HTMLInputElement).value = "";
                                      }
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 justify-end">
                            {editingProject ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setProjectForm(userProject);
                                    setEditingProject(false);
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    if (projectForm) {
                                      setUserProject(projectForm);
                                      setEditingProject(false);
                                      toast.success("Project updated");
                                    }
                                  }}
                                >
                                  Save
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingProject(true)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setUserProject(null);
                                    setProjectForm(null);
                                    setViewOpen(false);
                                    toast.success("Project deleted");
                                  }}
                                >
                                  Delete
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Share dialog (add members link / QR) */}
                  <Dialog open={shareOpen} onOpenChange={setShareOpen}>
                    <DialogContent className="max-w-md">
                      <DialogTitle>Share Join Link</DialogTitle>
                      <div className="mt-4 space-y-3">
                        <div className="text-sm text-muted-foreground">
                          Share this link to invite members:
                        </div>
                        <div className="rounded-md bg-slate-100 p-3 text-sm break-all">{`/event/${id}/detail?team=${userProject?.id}`}</div>
                        <div className="h-40 w-40 rounded-lg bg-muted flex items-center justify-center">
                          QR (mock)
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => setShareOpen(false)}>
                            Close
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
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

                  <div className="space-y-3">
                    {[
                      {
                        id: "01",
                        title: "Doctor Web App",
                        desc: "Create Appointment, View Medical Records etc.",
                        img: "/project1.png",
                      },
                      {
                        id: "02",
                        title: "Restaurant Application",
                        desc: "Create Reservation, View Menu etc.",
                        img: "/project2.png",
                      },
                      {
                        id: "03",
                        title: "CMU Hub",
                        desc: "Hub for every CMU students.",
                        img: "/project3.png",
                      },
                    ]
                      .filter(
                        (p) =>
                          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.id.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((p) => (
                        <Link
                          key={p.id}
                          href={`./detail?team=${encodeURIComponent(p.id)}`}
                          className="block"
                        >
                          <div className="relative group rounded-xl bg-gradient-to-r from-slate-200 to-slate-100 p-[1px] hover:from-blue-500 hover:to-purple-500 transition-all duration-300">
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-white h-full relative">
                              <Image
                                src={p.img}
                                alt={p.title}
                                width={80}
                                height={80}
                                className="shrink-0 h-20 w-20 rounded-lg object-cover shadow-sm bg-slate-50"
                              />
                              <div>
                                <h3 className="font-bold text-xl text-slate-900 mb-1">{p.title}</h3>
                                <p className="text-sm text-slate-500 font-medium ">{p.desc}</p>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                  </div>
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
        {/* Edit Dialog (existing code left intact) */}
      </div>
    </div>
  );
}
