"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Gift, Clock, MapPin, Building } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { setEventPublicView, updateEvent } from "@/utils/apievent";
import { ClipboardCopy, Edit3 } from "lucide-react";
import { DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

type EventData = {
  id: string;
  eventName: string;
  eventDescription?: string;
  imageCover?: string | null;
  status?: "DRAFT" | "PUBLISHED";
  publicView?: boolean;
  startView?: string;
  endView?: string;
  startJoinDate?: string;
  endJoinDate?: string;
  maxTeams?: number;
  virtualRewardGuest?: number;
  virtualRewardCommittee?: number;
  locationName?: string;
  location?: string;
  totalParticipants?: number;
  presentersCount?: number;
  guestsCount?: number;
  committeeCount?: number;

  participantsVirtualTotal?: number;
  participantsVirtualUsed?: number;
  participantsCommentCount?: number;

  committeeVirtualTotal?: number;
  committeeVirtualUsed?: number;
  committeeFeedbackCount?: number;

  opinionsGot?: number;
  opinionsPresenter?: number;
  opinionsGuest?: number;
  opinionsCommittee?: number;

  vrTotal?: number;
  vrUsed?: number;

  specialPrizeCount?: number;
  specialPrizeUsed?: number;
  awardsUnused?: string[];

  presenterTeams?: number;
};

type Props = {
  id: string;
  event: EventData;
};

export default function PublishedPresenterView({ id, event }: Props) {
  const [tab, setTab] = useState<"dashboard" | "information" | "project" | "result">("dashboard");
  const [updatingPublic, setUpdatingPublic] = useState(false);
  const [localEvent, setLocalEvent] = useState<EventData>(event);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<
    null | "time" | "location" | "description" | "presenter" | "guest" | "committee" | "rewards"
  >(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const timeUntil = (iso?: string) => {
    if (!iso) return "";
    const now = new Date();
    const target = new Date(iso);
    const diff = target.getTime() - now.getTime();
    if (diff <= 0) return "เริ่มแล้ว";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    if (days > 0) return `${days} วัน ${hours} ชม.`;
    if (hours > 0) return `${hours} ชม. ${mins} นาที`;
    return `${mins} นาที`;
  };

  const toLocalDatetimeValue = (iso: string) => {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    const YYYY = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const DD = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${YYYY}-${MM}-${DD}T${hh}:${mm}`;
  };

  const toISOStringFromLocal = (localVal: string) => {
    // localVal in format YYYY-MM-DDTHH:MM
    const d = new Date(localVal);
    return d.toISOString();
  };

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
          <div className="bg-card rounded-xl shadow-sm border p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 transition-all hover:shadow-md">
            {/* LEFT SIDE: Title & Status */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
                  {localEvent?.eventName || "Event"}
                </h1>
              </div>
            </div>

            {/* RIGHT SIDE: Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Presenter Label - Styled to match Button height/shape exactly */}
              <div className="h-10 inline-flex items-center justify-center gap-2 px-5 rounded-lg bg-lime-600 text-white font-medium shadow-sm select-none">
                <Building className="h-4 w-4" />
                <span>Presenter</span>
              </div>
            </div>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mt-6">
            <TabsList>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="information">Information</TabsTrigger>
              <TabsTrigger value="project">Project</TabsTrigger>
              <TabsTrigger value="result">Result</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* จำนวนผู้เข้าร่วมทั้งหมด */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" /> จำนวนผู้เข้าร่วมทั้งหมด
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {(localEvent?.presentersCount ?? 0) +
                        (localEvent?.guestsCount ?? 0) +
                        (localEvent?.committeeCount ?? 0)}
                    </div>
                    <p className="text-muted-foreground">
                      ผู้นำเสนอ: {localEvent?.presentersCount ?? localEvent?.maxTeams ?? 0} |
                      ผู้เข้าร่วม: {localEvent?.guestsCount ?? 0} | กรรมการ:{" "}
                      {localEvent?.committeeCount ?? 0}
                    </p>
                  </CardContent>
                </Card>

                {/* ผู้นำเสนอ */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" /> ผู้นำเสนอ
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {localEvent?.presentersCount ?? localEvent?.maxTeams ?? 0}
                    </div>
                    <p className="text-muted-foreground">จำนวนทีม</p>
                  </CardContent>
                </Card>

                {/* ผู้เข้าร่วม */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" /> ผู้เข้าร่วม
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{localEvent?.guestsCount ?? 0}</div>
                    <p className="text-muted-foreground">
                      ให้คอมเมนต์: {localEvent?.participantsCommentCount ?? 90} / ใช้ไป:{" "}
                      {localEvent?.participantsVirtualUsed ?? 2000}
                    </p>
                  </CardContent>
                </Card>

                {/* กรรมการ */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" /> กรรมการ
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{localEvent?.committeeCount ?? 0}</div>
                    <p className="text-muted-foreground">
                      ให้ฟีดแบ็ก: {localEvent?.committeeFeedbackCount ?? 10} / ใช้ไป:{" "}
                      {localEvent?.committeeVirtualUsed ?? 2000}
                    </p>
                  </CardContent>
                </Card>

                {/* ความคิดเห็นทั้งหมด */}
                <Card className="lg:col-span-3">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">ความคิดเห็นทั้งหมด</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{localEvent?.opinionsGot ?? 33}</div>
                    <p className="text-muted-foreground">
                      ผู้นำเสนอ: {localEvent?.opinionsPresenter ?? 10} | ผู้เข้าร่วม:{" "}
                      {localEvent?.opinionsGuest ?? 20} | กรรมการ:{" "}
                      {localEvent?.opinionsCommittee ?? 3}
                    </p>
                  </CardContent>
                </Card>

                {/* Virtual Rewards */}
                <Card>
                  <CardHeader>
                    <CardTitle>Virtual Rewards</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>ทั้งหมด: {localEvent?.vrTotal ?? 50000}</p>
                    <p>ใช้ไป: {localEvent?.vrUsed ?? 20000}</p>
                    <p>คงเหลือ: {(localEvent?.vrTotal ?? 50000) - (localEvent?.vrUsed ?? 20000)}</p>
                  </CardContent>
                </Card>

                {/* รางวัลพิเศษ */}
                <Card>
                  <CardHeader>
                    <CardTitle>รางวัลพิเศษ</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>ทั้งหมด: {localEvent?.specialPrizeCount ?? 5}</p>
                    <p>ใช้ไป: {localEvent?.specialPrizeUsed ?? 4}</p>
                  </CardContent>
                </Card>

                {/* ยังไม่ได้ใช้ */}
                <Card>
                  <CardHeader>
                    <CardTitle>ยังไม่ได้ใช้</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(localEvent?.awardsUnused ?? ["รางวัล AI ยอดเยี่ยม"]).map((a, i) => (
                      <p key={i}>{a}</p>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="information">
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* รายละเอียดอีเว้นต์ */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <div className="flex items-center justify-between w-full">
                      <CardTitle>รายละเอียดอีเว้นต์</CardTitle>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingSection("description");
                          setForm({ eventDescription: localEvent?.eventDescription ?? "" });
                        }}
                      >
                        <Edit3 className="h-4 w-4" /> แก้ไข
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {localEvent?.eventDescription || ""}
                    </p>
                  </CardContent>
                </Card>

                {/* รายละเอียด Event Time */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between w-full">
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" /> ช่วงเวลาของอีเว้นต์
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingSection("time");
                            setForm({
                              startView: localEvent?.startView ?? "",
                              endView: localEvent?.endView ?? "",
                            });
                          }}
                        >
                          <Edit3 className="h-4 w-4" /> แก้ไข
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Changed generic spacing to a Grid layout with 2 columns */}
                    <div className="grid grid-cols-2 gap-4 items-center">
                      {/* Column 1: Countdown */}
                      <div>
                        {localEvent?.startView && (
                          <div className="font-bold text-xl">
                            {" "}
                            {/* Fixed text-bold to font-bold */}
                            เริ่มในอีก
                            <h1 className="text-blue-600">{timeUntil(localEvent.startView)}</h1>
                          </div>
                        )}
                      </div>

                      {/* Column 2: Start/End Dates (Aligned to the right) */}
                      <div>
                        <div>
                          {" "}
                          {/* Optional: Made text slightly smaller/lighter for hierarchy */}
                          เริ่ม:{" "}
                          {localEvent?.startView
                            ? new Date(localEvent.startView).toLocaleString("th-TH")
                            : "-"}
                        </div>
                        <div>
                          สิ้นสุด:{" "}
                          {localEvent?.endView
                            ? new Date(localEvent.endView).toLocaleString("th-TH")
                            : "-"}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* รายละเอียด Location */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between w-full">
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" /> สถานที่จัดอีเว้นต์
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingSection("location");
                          setForm({
                            locationName: localEvent?.locationName ?? "",
                            location: localEvent?.location ?? "",
                          });
                        }}
                      >
                        <Edit3 className="h-4 w-4" /> แก้ไข
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>{localEvent?.locationName ?? "-"}</div>
                      {localEvent?.location && (
                        <a
                          href={localEvent.location}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline"
                        >
                          ลิงก์
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* รายละเอียดPresenter */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between w-full">
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" /> ผู้นำเสนอ
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingSection("presenter");
                            setForm({
                              startJoinDate: localEvent?.startJoinDate ?? "",
                              endJoinDate: localEvent?.endJoinDate ?? "",
                              maxTeams: localEvent?.maxTeams ?? 0,
                            });
                          }}
                        >
                          <Edit3 className="h-4 w-4" /> แก้ไข
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        Submission Start:{" "}
                        {localEvent?.startJoinDate
                          ? new Date(localEvent.startJoinDate).toLocaleString("th-TH")
                          : "-"}
                      </div>
                      <div>
                        Submission End:{" "}
                        {localEvent?.endJoinDate
                          ? new Date(localEvent.endJoinDate).toLocaleString("th-TH")
                          : "-"}
                      </div>
                      <div>Max Teams: {localEvent?.maxTeams ?? "-"}</div>
                    </div>
                  </CardContent>
                </Card>

                {/* รายละเอียด Guest&Committee */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between w-full">
                      <CardTitle className="flex items-center gap-2">
                        <Gift className="h-5 w-5" /> รางวัลและแต้ม
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingSection("guest");
                            setForm({
                              guestReward: localEvent?.virtualRewardGuest ?? 0,
                              committeeReward: localEvent?.virtualRewardCommittee ?? 0,
                            });
                          }}
                        >
                          <Edit3 className="h-4 w-4" /> แก้ไข
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>Guest Reward per person: {localEvent?.virtualRewardGuest ?? 0}</div>
                      <div>
                        Committee Reward per person: {localEvent?.virtualRewardCommittee ?? 0}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between w-full">
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" /> Invite Links
                      </CardTitle>
                      <div className="text-sm text-muted-foreground">
                        Share invite link for roles
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {["presenter", "guest", "committee"].map((role) => {
                        const link = `${
                          typeof window !== "undefined" ? window.location.origin : ""
                        }/event/${id}/invite?role=${role}`;
                        return (
                          <div key={role} className="flex items-center justify-between gap-2">
                            <div className="capitalize">{role}</div>
                            <div className="flex items-center gap-2">
                              <a
                                href={link}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary underline"
                              >
                                Open
                              </a>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  navigator.clipboard.writeText(link);
                                  toast.success("Copied");
                                }}
                              >
                                <ClipboardCopy className="h-4 w-4" />
                              </Button>
                              <img
                                src={`https://chart.googleapis.com/chart?chs=120x120&cht=qr&chl=${encodeURIComponent(
                                  link
                                )}`}
                                alt={`qr-${role}`}
                                className="h-10 w-10"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between w-full">
                      <CardTitle>รางวัลพิเศษ</CardTitle>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingSection("rewards");
                          setForm({ specialRewards: localEvent?.awardsUnused ?? [] });
                        }}
                      >
                        <Edit3 className="h-4 w-4" /> แก้ไข
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc pl-5">
                      {(localEvent?.awardsUnused ?? []).map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="project">
  <div className="mt-6 space-y-6">

    {/* My Project */}
    <div>
      <h2 className="text-lg font-semibold mb-3">My Project</h2>
      <Card className="flex items-center gap-4 p-4 rounded-xl">
        <Image
          src="/project1.png"
          alt="Doctor Web App"
          width={64}
          height={64}
          className="rounded-xl"
        />
        <div>
          <div className="font-semibold">01 - Doctor Web App</div>
          <div className="text-sm text-muted-foreground">
            Create Appointment, View Medical Records etc.
          </div>
        </div>
      </Card>
    </div>

    {/* Presenters */}
    <div>
      <h2 className="text-lg font-semibold mb-3">10 Presenters</h2>

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
        ].map((p) => (
          <Card key={p.id} className="flex items-center gap-4 p-4 rounded-xl">
            <Image
              src={p.img}
              alt={p.title}
              width={64}
              height={64}
              className="rounded-xl"
            />
            <div>
              <div className="font-semibold">
                {p.id} - {p.title}
              </div>
              <div className="text-sm text-muted-foreground">{p.desc}</div>
            </div>
          </Card>
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
        {/* Edit Dialog */}
        <Dialog
          open={Boolean(editingSection)}
          onOpenChange={(o) => {
            if (!o) {
              setEditingSection(null);
            }
          }}
        >
          <DialogContent className="max-w-lg">
            <DialogTitle>แก้ไขข้อมูล</DialogTitle>
            <div className="space-y-4 mt-4">
              {editingSection === "time" && (
                <div className="grid grid-cols-1 gap-2">
                  <Label>Start (date & time)</Label>
                  <Input
                    type="datetime-local"
                    value={form.startView ? toLocalDatetimeValue(form.startView) : ""}
                    onChange={(e) => setForm((f) => ({ ...f, startView: e.target.value }))}
                  />
                  <Label>End (date & time)</Label>
                  <Input
                    type="datetime-local"
                    value={form.endView ? toLocalDatetimeValue(form.endView) : ""}
                    onChange={(e) => setForm((f) => ({ ...f, endView: e.target.value }))}
                  />
                </div>
              )}

              {editingSection === "location" && (
                <div className="grid grid-cols-1 gap-2">
                  <Label>Location Name</Label>
                  <Input
                    value={form.locationName || ""}
                    onChange={(e) => setForm((f) => ({ ...f, locationName: e.target.value }))}
                  />
                  <Label>Location Link</Label>
                  <Input
                    value={form.location || ""}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  />
                </div>
              )}

              {editingSection === "description" && (
                <div className="grid grid-cols-1 gap-2">
                  <Label>Description</Label>
                  <Textarea
                    value={form.eventDescription || ""}
                    onChange={(e) => setForm((f) => ({ ...f, eventDescription: e.target.value }))}
                  />
                </div>
              )}

              {editingSection === "presenter" && (
                <div className="grid grid-cols-1 gap-2">
                  <Label>Submission Start</Label>
                  <Input
                    type="datetime-local"
                    value={form.startJoinDate ? toLocalDatetimeValue(form.startJoinDate) : ""}
                    onChange={(e) => setForm((f) => ({ ...f, startJoinDate: e.target.value }))}
                  />
                  <Label>Submission End</Label>
                  <Input
                    type="datetime-local"
                    value={form.endJoinDate ? toLocalDatetimeValue(form.endJoinDate) : ""}
                    onChange={(e) => setForm((f) => ({ ...f, endJoinDate: e.target.value }))}
                  />
                  <Label>Max Teams</Label>
                  <Input
                    type="number"
                    value={form.maxTeams ?? 0}
                    onChange={(e) => setForm((f) => ({ ...f, maxTeams: Number(e.target.value) }))}
                  />
                </div>
              )}

              {editingSection === "guest" && (
                <div className="grid grid-cols-1 gap-2">
                  <Label>Guest Reward per person</Label>
                  <Input
                    type="number"
                    value={form.guestReward ?? 0}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, guestReward: Number(e.target.value) }))
                    }
                  />
                  <Label>Committee Reward per person</Label>
                  <Input
                    type="number"
                    value={form.committeeReward ?? 0}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, committeeReward: Number(e.target.value) }))
                    }
                  />
                </div>
              )}

              {editingSection === "rewards" && (
                <div className="grid grid-cols-1 gap-2">
                  <Label>Special Rewards (one per line)</Label>
                  <Textarea
                    value={(form.specialRewards || []).join("\n")}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        specialRewards: e.target.value
                          .split("\n")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      }))
                    }
                  />
                </div>
              )}

              <div className="flex justify-end items-center gap-2">
                <Button variant="secondary" onClick={() => setEditingSection(null)}>
                  ยกเลิก
                </Button>
                <Button
                  onClick={async () => {
                    if (!id) return;
                    setSaving(true);
                    try {
                      let payload: Record<string, any> = {};
                      if (editingSection === "time") {
                        payload.startView = form.startView
                          ? toISOStringFromLocal(form.startView)
                          : null;
                        payload.endView = form.endView ? toISOStringFromLocal(form.endView) : null;
                      } else if (editingSection === "location") {
                        payload.locationName = form.locationName;
                        payload.location = form.location;
                      } else if (editingSection === "description") {
                        payload.eventDescription = form.eventDescription;
                      } else if (editingSection === "presenter") {
                        payload.startJoinDate = form.startJoinDate
                          ? toISOStringFromLocal(form.startJoinDate)
                          : null;
                        payload.endJoinDate = form.endJoinDate
                          ? toISOStringFromLocal(form.endJoinDate)
                          : null;
                        payload.maxTeams = form.maxTeams;
                      } else if (editingSection === "guest") {
                        payload.virtualRewardGuest = Number(form.guestReward ?? 0);
                        payload.virtualRewardCommittee = Number(form.committeeReward ?? 0);
                      } else if (editingSection === "rewards") {
                        payload.awardsUnused = form.specialRewards || [];
                      }

                      const res = await updateEvent(id, payload);
                      // optimistic update
                      setLocalEvent(
                        (prev) => ({ ...(prev || {}), ...(payload as any) } as EventData)
                      );
                      toast.success("Updated");
                      setEditingSection(null);
                    } catch (e: any) {
                      console.error(e);
                      toast.error(e?.message || "Update failed");
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving}
                >
                  บันทึก
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
