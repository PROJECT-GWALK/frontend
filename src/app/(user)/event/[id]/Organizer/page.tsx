"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Gift,
  Upload,
  Trash2,
  Plus,
  Building,
  EyeOff,
  Eye,
  AlertCircle,
  Trophy,
  Coins,
  MessageSquare,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import {
  setEventPublicView,
  updateEvent,
  createSpecialReward,
  updateSpecialReward,
  deleteSpecialReward,
  getEvent,
} from "@/utils/apievent";
import ImageCropDialog from "@/lib/image-crop-dialog";
import { toast } from "sonner";
import InformationSection from "../InformationSection";
import type { EventData, EventEditSection, SpecialRewardEdit, EventFormState } from "@/utils/types";
import ParticipantsSection from "./ParticipantsSection";
import { toLocalDatetimeValue, toISOStringFromLocal } from "@/utils/function";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  id: string;
  event: EventData;
};

export default function OrganizerView({ id, event }: Props) {
  const { timeFormat } = useLanguage();
  const [tab, setTab] = useState<"dashboard" | "information" | "Participants" | "project" | "result">("dashboard");
  const [updatingPublic, setUpdatingPublic] = useState(false);
  const [localEvent, setLocalEvent] = useState<EventData>(event);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<EventEditSection | null>(null);
  const [form, setForm] = useState<EventFormState>({});
  const [saving, setSaving] = useState(false);

  // Special rewards editing state
  const [srList, setSrList] = useState<SpecialRewardEdit[]>([]);
  const [srPreviews, setSrPreviews] = useState<Record<string, string | null>>({});
  const rewardFileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [srCropOpen, setSrCropOpen] = useState(false);
  const [srCropSrc, setSrCropSrc] = useState<string | null>(null);
  const [srPendingMeta, setSrPendingMeta] = useState<{
    id: string;
    name: string;
    type: string;
  } | null>(null);
  const [removedRewardIds, setRemovedRewardIds] = useState<string[]>([]);
  const [rewardErrors, setRewardErrors] = useState<Record<string, string>>({});

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
          <div 
            className="bg-card rounded-xl shadow-sm border p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 transition-all hover:shadow-md relative overflow-hidden"
            style={{ borderLeft: "6px solid var(--role-organizer)" }}
          >
            <div 
              className="absolute inset-0 pointer-events-none" 
              style={{ background: "linear-gradient(to right, var(--role-organizer), transparent)", opacity: 0.05 }} 
            />
            {/* LEFT SIDE: Title & Status */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 
                  className="text-2xl lg:text-3xl font-bold tracking-tight"
                  style={{ color: "var(--role-organizer)" }}
                >
                  {localEvent?.eventName || "Event"}
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-600 mr-1.5"></span>
                  เผยแพร่แล้ว
                </span>
              </div>
            </div>

            {/* RIGHT SIDE: Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Visibility Toggle Button */}
              <Button
                variant={localEvent?.publicView ? "outline" : "default"} // Changed logic: Solid when action is needed (to publish), Outline when already public
                onClick={async () => {
                  if (!id) return;
                  setUpdatingPublic(true);
                  try {
                    const res = await setEventPublicView(id, !localEvent?.publicView);
                    if (res?.event)
                      setLocalEvent(
                        (prev) =>
                          ({
                            ...(prev || {}),
                            publicView: res.event.publicView,
                          } as EventData)
                      );
                  } catch {
                  } finally {
                    setUpdatingPublic(false);
                  }
                }}
                disabled={updatingPublic}
                className={`h-10 px-6 font-medium ${
                  localEvent?.publicView
                    ? "border-dashed border-gray-300 text-gray-600 hover:bg-gray-50"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {localEvent?.publicView ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    ซ่อนจากสาธารณะ
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    เปิดให้สาธารณะเห็น
                  </>
                )}
              </Button>

              {/* Organizer Label - Styled to match Button height/shape exactly */}
              <div className="h-10 inline-flex items-center justify-center gap-2 px-5 rounded-lg bg-(--role-organizer) text-white font-medium shadow-sm select-none">
                <Building className="h-4 w-4" />
                <span>Organizer</span>
              </div>
            </div>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mt-6">
            <TabsList>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="information">Information</TabsTrigger>
              <TabsTrigger value="Participants">Participants</TabsTrigger>
              <TabsTrigger value="project">Project</TabsTrigger>
              <TabsTrigger value="result">Result</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6 mt-6">
              {/* SECTION 1: PEOPLE & PARTICIPATION */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Participants - Highlighted Card */}
                <Card className="col-span-1 md:col-span-2 lg:col-span-1 border-l-4 border-l-blue-600 shadow-sm hover:shadow-md transition-all">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                      ผู้เข้าร่วมทั้งหมด
                      <Users className="h-4 w-4 text-blue-600" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-blue-700">
                      {(localEvent?.presentersCount ?? 0) +
                        (localEvent?.guestsCount ?? 0) +
                        (localEvent?.committeeCount ?? 0)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">คนรวมทั้งหมดในงาน</p>
                  </CardContent>
                </Card>

                {/* Breakdown Cards - Compact Design */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      ผู้นำเสนอ
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {localEvent?.presentersCount ?? localEvent?.maxTeams ?? 0}
                      <span className="text-sm font-normal text-muted-foreground ml-2">คน</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      จากทั้งหมด {localEvent?.maxTeams ?? 0} ทีม
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      ผู้เข้าร่วม (Guests)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{localEvent?.guestsCount ?? 0}</div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      คอมเมนต์: {localEvent?.participantsCommentCount ?? 90}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      กรรมการ
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{localEvent?.committeeCount ?? 0}</div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      ฟีดแบ็ก: {localEvent?.committeeFeedbackCount ?? 10}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* SECTION 2: REWARDS & GAMIFICATION */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Virtual Rewards - Progress Bar Visualization */}
                <Card className="lg:col-span-1 border-t-4 border-t-amber-500 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-700">
                      <Coins className="h-5 w-5" /> Virtual Rewards
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-3xl font-bold text-amber-600">
                        {localEvent?.vrUsed?.toLocaleString(timeFormat) ?? "20,000"}
                      </span>
                      <span className="text-sm text-muted-foreground mb-1">
                        / {localEvent?.vrTotal?.toLocaleString(timeFormat) ?? "50,000"} coins
                      </span>
                    </div>

                    {/* Custom Progress Bar */}
                    <div className="h-2 w-full bg-amber-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{
                          width: `${
                            ((localEvent?.vrUsed ?? 20000) / (localEvent?.vrTotal ?? 50000)) * 100
                          }%`,
                        }}
                      />
                    </div>

                    <div className="text-xs text-muted-foreground pt-1 flex justify-between">
                      <span>
                        ใช้ไปแล้ว{" "}
                        {localEvent?.vrUsed && localEvent?.vrTotal
                          ? Math.round((localEvent.vrUsed / localEvent.vrTotal) * 100)
                          : 40}
                        %
                      </span>
                      <span>
                        คงเหลือ {(localEvent?.vrTotal ?? 50000) - (localEvent?.vrUsed ?? 20000)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Special Prizes - Simple Stats */}
                <Card className="lg:col-span-1 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-purple-600" /> รางวัลพิเศษ
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-purple-50 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-purple-700">
                          {localEvent?.specialPrizeUsed ?? 4}
                        </div>
                        <div className="text-xs text-purple-900/60">แจกแล้ว</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg text-center border">
                        <div className="text-2xl font-bold text-gray-700">
                          {localEvent?.specialPrizeCount ?? 5}
                        </div>
                        <div className="text-xs text-muted-foreground">ทั้งหมด</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Unused Awards - Badge List */}
                <Card className="lg:col-span-1 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="h-5 w-5 text-pink-600" /> ยังไม่ได้แจก
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {localEvent?.awardsUnused && localEvent.awardsUnused.length > 0 ? (
                        localEvent.awardsUnused.map((a, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800 border border-pink-200"
                          >
                            {a}
                          </span>
                        ))
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <AlertCircle className="h-4 w-4" /> แจกครบทุกรางวัลแล้ว
                        </div>
                      )}
                      {/* Fallback for demo if data is null */}
                      {!localEvent?.awardsUnused && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                          รางวัล AI ยอดเยี่ยม
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* SECTION 3: ENGAGEMENT & OPINIONS */}
              <Card className="bg-slate-50 border-slate-200">
                <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-full shadow-sm border">
                      <MessageSquare className="h-8 w-8 text-slate-700" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">ความคิดเห็นทั้งหมดที่ได้รับ</h3>
                      <p className="text-muted-foreground text-sm">
                        รวมทุกช่องทางจากผู้นำเสนอ กรรมการ ผู้เข้าร่วม
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-8 text-center">
                    <div>
                      <div className="text-3xl font-bold text-slate-800">
                        {localEvent?.opinionsGot ?? 33}
                      </div>
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Total
                      </div>
                    </div>
                    <div className="h-10 w-px bg-slate-300"></div> {/* Divider */}
                    <div className="grid grid-cols-3 gap-6 text-left">
                      <div>
                        <div className="text-xl font-bold text-slate-700">
                          {localEvent?.opinionsPresenter ?? 10}
                        </div>
                        <div className="text-[10px] text-muted-foreground">ผู้นำเสนอ</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-slate-700">
                          {localEvent?.opinionsGuest ?? 20}
                        </div>
                        <div className="text-[10px] text-muted-foreground">ผู้เข้าร่วม</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-slate-700">
                          {localEvent?.opinionsCommittee ?? 3}
                        </div>
                        <div className="text-[10px] text-muted-foreground">กรรมการ</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button variant="default" className="mt-4">
                จัดการผู้เข้าร่วม
              </Button>
            </TabsContent>

            <TabsContent value="information">
              <InformationSection
                id={id}
                event={localEvent}
                editable
                onEdit={(section, initialForm) => {
                  setEditingSection(section);
                  setForm(initialForm as EventFormState);
                }}
                linkLabel="Google Map Link of location"
              />
            </TabsContent>

            <TabsContent value="project">
              <div className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>ผลงาน</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-muted-foreground">ยังไม่มีข้อมูลผลงาน</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="Participants">
              <ParticipantsSection
                id={id}
                onRefreshCounts={(list) => {
                  setLocalEvent((prev) => ({
                    ...prev,
                    presentersCount: list.filter((p) => p.eventGroup === "PRESENTER").length,
                    guestsCount: list.filter((p) => p.eventGroup === "GUEST").length,
                    committeeCount: list.filter((p) => p.eventGroup === "COMMITTEE").length,
                  }));
                }}
              />
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
              setSrCropOpen(false);
              if (srCropSrc && srCropSrc.startsWith("blob:")) URL.revokeObjectURL(srCropSrc);
              setSrCropSrc(null);
              setSrPendingMeta(null);
            }
          }}
        >
          <DialogContent className="max-w-lg">
            <DialogTitle>แก้ไขข้อมูล</DialogTitle>
            <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto pr-2">
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

              {editingSection === "time" && (
                <div className="grid grid-cols-1 gap-2">
                  <Label>Start Time</Label>
                  <Input
                    type="datetime-local"
                    value={form.startView ? toLocalDatetimeValue(form.startView) : ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        startView: toISOStringFromLocal(e.target.value),
                      }))
                    }
                  />
                  <Label>End Time</Label>
                  <Input
                    type="datetime-local"
                    value={form.endView ? toLocalDatetimeValue(form.endView) : ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        endView: toISOStringFromLocal(e.target.value),
                      }))
                    }
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
                  <Label>Reward Unit (e.g. coins, points)</Label>
                  <Input
                    type="text"
                    value={form.unitReward ?? "coins"}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, unitReward: e.target.value }))
                    }
                  />
                </div>
              )}

              {editingSection === "rewards" && (
                <div className="space-y-4">
                  <ImageCropDialog
                    open={srCropOpen}
                    src={srCropSrc}
                    fileName={srPendingMeta?.name}
                    fileType={srPendingMeta?.type}
                    aspect={1}
                    title="Crop reward image"
                    outputWidth={512}
                    outputHeight={512}
                    onOpenChange={(o) => {
                      if (!o) {
                        setSrCropOpen(false);
                        setSrPendingMeta(null);
                        if (srCropSrc && srCropSrc.startsWith("blob:")) {
                          URL.revokeObjectURL(srCropSrc);
                        }
                        setSrCropSrc(null);
                      }
                    }}
                    onCancel={() => {
                      setSrCropOpen(false);
                      setSrPendingMeta(null);
                      if (srCropSrc && srCropSrc.startsWith("blob:")) {
                        URL.revokeObjectURL(srCropSrc);
                      }
                      setSrCropSrc(null);
                    }}
                    onConfirm={(file, previewUrl) => {
                      if (!srPendingMeta) return;
                      setSrList((prev) =>
                        prev.map((r) =>
                          r.id === srPendingMeta.id
                            ? { ...r, pendingFile: file, preview: previewUrl }
                            : r
                        )
                      );
                      setSrPreviews((p) => ({ ...p, [srPendingMeta.id]: previewUrl }));
                      if (srCropSrc && srCropSrc.startsWith("blob:"))
                        URL.revokeObjectURL(srCropSrc);
                      setSrCropOpen(false);
                      setSrPendingMeta(null);
                      setSrCropSrc(null);
                    }}
                  />

                  <div className="flex items-center justify-between">
                    <Label>Special Rewards</Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const id = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
                        setSrList((s) => [
                          ...s,
                          {
                            id,
                            name: "",
                            description: "",
                            image: null,
                            pendingFile: undefined,
                            preview: null,
                          },
                        ]);
                        setTimeout(() => {
                          rewardFileRefs.current[id] = null;
                        }, 0);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Reward / เพิ่มรางวัล
                    </Button>
                  </div>

                  {srList.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Gift className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No special rewards added yet / ยังไม่มีรางวัลพิเศษ</p>
                    </div>
                  ) : (
                    srList.map((reward, index) => (
                      <div key={reward.id} className="border rounded-lg p-4 space-y-4 bg-muted/30">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">
                            Reward #{index + 1}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => {
                              if (!String(reward.id).startsWith("temp-")) {
                                setRemovedRewardIds((r) => [...r, reward.id]);
                              }
                              setSrList((list) => list.filter((x) => x.id !== reward.id));
                              setSrPreviews((p) => {
                                const np = { ...p };
                                delete np[reward.id];
                                return np;
                              });
                              if (
                                reward.preview &&
                                typeof reward.preview === "string" &&
                                reward.preview.startsWith("blob:")
                              )
                                URL.revokeObjectURL(reward.preview);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex items-start gap-4">
                          <div className="w-24 sm:w-32">
                            {srPreviews[reward.id] ? (
                              <>
                                <div className="relative border rounded-lg overflow-hidden aspect-square bg-muted w-full">
                                  <Image
                                    src={srPreviews[reward.id] as string}
                                    alt="Reward image preview"
                                    fill
                                    className="absolute inset-0 h-full w-full object-cover"
                                  />
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    ref={(el) => {
                                      rewardFileRefs.current[reward.id] = el;
                                      if (el) {
                                        el.onchange = (e: Event) => {
                                          const target = e.target as HTMLInputElement;
                                          const f = target.files?.[0];
                                          if (!f) return;
                                          const url = URL.createObjectURL(f);
                                          setSrCropSrc(url);
                                          setSrPendingMeta({
                                            id: reward.id,
                                            name: f.name,
                                            type: f.type,
                                          });
                                          setSrCropOpen(true);
                                        };
                                      }
                                    }}
                                  />
                                </div>
                                <div className="mt-2 flex items-center justify-center gap-2">
                                  <Button
                                    size="icon"
                                    variant="secondary"
                                    aria-label="Change image"
                                    title="Change"
                                    onClick={() => rewardFileRefs.current[reward.id]?.click()}
                                  >
                                    <Upload className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="destructive"
                                    aria-label="Remove image"
                                    title="Remove"
                                    onClick={() => {
                                      setSrList((prev) =>
                                        prev.map((r) =>
                                          r.id === reward.id
                                            ? {
                                                ...r,
                                                pendingFile: undefined,
                                                preview: null,
                                                removeImage: !!r.image,
                                              }
                                            : r
                                        )
                                      );
                                      setSrPreviews((p) => {
                                        const np = { ...p };
                                        delete np[reward.id];
                                        return np;
                                      });
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <>
                                <div
                                  className="relative w-full cursor-pointer"
                                  onClick={() => rewardFileRefs.current[reward.id]?.click()}
                                >
                                  <div className="border-2 border-dashed border-border rounded-lg hover:border-primary/50 transition-colors aspect-square overflow-hidden">
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3 sm:p-6">
                                      <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground mb-2" />
                                      <p className="text-[10px] sm:text-sm text-muted-foreground hidden sm:block">
                                        Click to upload or drag and drop
                                      </p>
                                      <p className="text-[9px] sm:text-xs text-muted-foreground mt-1 hidden sm:block">
                                        PNG, JPG, GIF
                                      </p>
                                    </div>
                                    <input
                                      type="file"
                                      className="hidden"
                                      accept="image/*"
                                      ref={(el) => {
                                        rewardFileRefs.current[reward.id] = el;
                                        if (el) {
                                          el.onchange = (e: Event) => {
                                            const target = e.target as HTMLInputElement;
                                            const f = target.files?.[0];
                                            if (!f) return;
                                            const url = URL.createObjectURL(f);
                                            setSrCropSrc(url);
                                            setSrPendingMeta({
                                              id: reward.id,
                                              name: f.name,
                                              type: f.type,
                                            });
                                            setSrCropOpen(true);
                                          };
                                        }
                                      }}
                                    />
                                  </div>
                                </div>
                                <div className="mt-2 flex items-center justify-center">
                                  <Button
                                    size="icon"
                                    variant="secondary"
                                    aria-label="Upload image"
                                    title="Upload"
                                    onClick={() => rewardFileRefs.current[reward.id]?.click()}
                                  >
                                    <Upload className="h-4 w-4" />
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                          <div className="flex-1 space-y-3">
                            <div className="space-y-2">
                              <Label>Reward Name / ชื่อรางวัล</Label>
                              <Input
                                placeholder="e.g. Best Presentation"
                                value={reward.name}
                                onChange={(e) =>
                                  setSrList((prev) =>
                                    prev.map((r) =>
                                      r.id === reward.id
                                        ? {
                                            ...r,
                                            name: e.target.value,
                                            _dirty: !String(r.id).startsWith("temp-")
                                              ? true
                                              : r._dirty,
                                          }
                                        : r
                                    )
                                  )
                                }
                              />
                              {rewardErrors && rewardErrors[reward.id] && (
                                <p className="text-xs text-destructive mt-1">
                                  {rewardErrors[reward.id]}
                                </p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label>Description / รายละเอียด</Label>
                              <Textarea
                                placeholder="Describe what this reward is for..."
                                value={reward.description ?? ""}
                                onChange={(e) =>
                                  setSrList((prev) =>
                                    prev.map((r) =>
                                      r.id === reward.id
                                        ? {
                                            ...r,
                                            description: e.target.value,
                                            _dirty: !String(r.id).startsWith("temp-")
                                              ? true
                                              : r._dirty,
                                          }
                                        : r
                                    )
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
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
                      const payload: Partial<EventData> = {};
                      if (editingSection === "location") {
                        payload.locationName = form.locationName;
                        payload.location = form.location;
                      } else if (editingSection === "time") {
                        payload.startView = form.startView;
                        payload.endView = form.endView;
                      } else if (editingSection === "description") {
                        payload.eventDescription = form.eventDescription;
                      } else if (editingSection === "guest") {
                        payload.virtualRewardGuest = Number(form.guestReward ?? 0);
                        payload.virtualRewardCommittee = Number(form.committeeReward ?? 0);
                        payload.unitReward = form.unitReward;
                      } else if (editingSection === "rewards") {
                        // handle create / update / delete of special rewards
                        try {
                          // client-side validation
                          const errs: Record<string, string> = {};
                          srList.forEach((r) => {
                            if (!r.name || !String(r.name).trim()) errs[r.id] = "Name is required";
                          });
                          if (Object.keys(errs).length) {
                            setRewardErrors(errs);
                            toast.error("Please fix reward errors");
                            setSaving(false);
                            return;
                          }

                          // delete removed rewards (server-side ids only)
                          for (const rid of removedRewardIds) {
                            if (!String(rid).startsWith("temp-")) {
                              await deleteSpecialReward(id, rid);
                            }
                          }

                          // create new and update existing
                          for (const r of srList) {
                            if (String(r.id).startsWith("temp-")) {
                              // new
                              if (r.pendingFile) {
                                const fd = new FormData();
                                fd.append("name", r.name || "");
                                fd.append("description", r.description || "");
                                fd.append("image", r.pendingFile);
                                await createSpecialReward(id, fd);
                              } else {
                                await createSpecialReward(id, {
                                  name: r.name || "",
                                  description: r.description || "",
                                });
                              }
                            } else {
                              // existing - update if needed
                              if (r.pendingFile || r.removeImage || r._dirty) {
                                if (r.pendingFile) {
                                  const fd = new FormData();
                                  fd.append("name", r.name || "");
                                  fd.append("description", r.description || "");
                                  fd.append("image", r.pendingFile);
                                  await updateSpecialReward(id, r.id, fd);
                                } else {
                                  const up: { name: string; description: string; image?: null } = {
                                    name: r.name || "",
                                    description: r.description || "",
                                  };
                                  if (r.removeImage) up.image = null;
                                  await updateSpecialReward(id, r.id, up);
                                }
                              }
                            }
                          }

                          // Refresh event from server to get canonical state
                          try {
                            const fresh = await getEvent(id);
                            if (fresh.message === "ok") {
                              setLocalEvent(
                                (prev) =>
                                  ({ ...(prev || {}), ...(fresh.event || {}) } as EventData)
                              );
                            }
                          } catch (e) {
                            // ignore refresh errors
                            console.error("Failed to refresh event after rewards update", e);
                          }

                          toast.success("Updated");
                          setEditingSection(null);
                        } catch (e) {
                          console.error(e);
                          toast.error((e as Error)?.message || "Failed to save rewards");
                        } finally {
                          setSaving(false);
                        }
                        return;
                      }

                      await updateEvent(id, payload);
                      // optimistic update
                      setLocalEvent(
                        (prev) => ({ ...(prev || {}), ...payload } as EventData)
                      );
                      toast.success("Updated");
                      setEditingSection(null);
                    } catch (e) {
                      console.error(e);
                      toast.error((e as Error)?.message || "Update failed");
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
