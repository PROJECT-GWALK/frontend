"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Users, Gift, ClipboardCopy, Award, Trash2 } from "lucide-react";
import { timeUntil } from "@/utils/function";
import { toast } from "sonner";
import type { EventData } from "@/utils/types";
import { useEffect, useRef, useState } from "react";
import { getInviteToken } from "@/utils/apievent";
import { deleteSpecialReward, getEvent } from "@/utils/apievent";
import { toPng } from "html-to-image";
import * as QRCode from "qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type EditSection = "description" | "time" | "location" | "presenter" | "guest" | "rewards";

type Props = {
  id: string;
  event: EventData;
  editable?: boolean;
  onEdit?: (section: EditSection, initialForm: Record<string, unknown>) => void;
  linkLabel?: string;
};

export default function InformationSection({ id, event, editable, onEdit, linkLabel = "ลิงก์" }: Props) {
  const handleEdit = (section: EditSection, initialForm: Record<string, unknown>) => {
    if (editable && onEdit) onEdit(section, initialForm);
  };

  const [rewards, setRewards] = useState(event.specialRewards ?? []);
  useEffect(() => {
    setRewards(event.specialRewards ?? []);
  }, [event.specialRewards]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const handleDeleteReward = async (rid: string) => {
    if (!editable) return;
    setDeletingId(rid);
    try {
      await deleteSpecialReward(id, rid);
      setRewards((prev) => prev.filter((r) => r.id !== rid));
      toast.success("ลบรางวัลแล้ว");
    } catch (e: any) {
      toast.error(e?.message || "ลบรางวัลไม่สำเร็จ");
    } finally {
      setDeletingId(null);
    }
  };

  const [tokens, setTokens] = useState<{
    presenter?: string;
    guest?: string;
    committee?: string;
  }>({});
  const [qrThumbs, setQrThumbs] = useState<{
    presenter?: string;
    guest?: string;
    committee?: string;
  }>({});
  const [qrLarge, setQrLarge] = useState<{
    presenter?: string;
    guest?: string;
    committee?: string;
  }>({});

  useEffect(() => {
    const loadTokens = async () => {
      try {
        const roles: Array<"presenter" | "guest" | "committee"> = ["presenter", "guest", "committee"];
        const results = await Promise.all(
          roles.map((r) => getInviteToken(id, r).catch(() => null))
        );
        const map: { presenter?: string; guest?: string; committee?: string } = {};
        results.forEach((res, i) => {
          const role = roles[i];
          if (res?.message === "ok" && res?.token) {
            map[role] = res.token as string;
          }
        });
        setTokens(map);
      } catch {
        toast.error("โหลดลิงก์เชิญไม่สำเร็จ");
      }
    };
    if (editable) loadTokens();
  }, [id, editable]);

  useEffect(() => {
    const genQrs = async () => {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const roles: Array<"presenter" | "guest" | "committee"> = ["presenter", "guest", "committee"];
      const thumbMap: { presenter?: string; guest?: string; committee?: string } = {};
      const largeMap: { presenter?: string; guest?: string; committee?: string } = {};
      for (const r of roles) {
        const token = tokens[r];
        if (!token) continue;
        const link = `${origin}/event/${id}?invite=1&token=${encodeURIComponent(token)}`;
        try {
          const large = await QRCode.toDataURL(link, { errorCorrectionLevel: "M", width: 600 });
          const thumb = await QRCode.toDataURL(link, { errorCorrectionLevel: "M", width: 120 });
          largeMap[r] = large;
          thumbMap[r] = thumb;
        } catch {
          // ignore
        }
      }
      setQrLarge(largeMap);
      setQrThumbs(thumbMap);
    };
    genQrs();
  }, [tokens, id]);

  const qrPresenterRef = useRef<HTMLDivElement>(null);
  const qrGuestRef = useRef<HTMLDivElement>(null);
  const qrCommitteeRef = useRef<HTMLDivElement>(null);
  const refForRole = (role: "presenter" | "guest" | "committee") =>
    role === "presenter" ? qrPresenterRef : role === "guest" ? qrGuestRef : qrCommitteeRef;
  const [qrOpen, setQrOpen] = useState(false);
  const [qrSrc, setQrSrc] = useState<string>("");
  const [qrTitle, setQrTitle] = useState<string>("");

  return (
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="lg:col-span-2 border-none shadow-md bg-gradient-to-br from-background to-muted/20">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle className="text-xl font-bold">
              รายละเอียดอีเว้นต์
            </CardTitle>
            {editable && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleEdit("description", { eventDescription: event?.eventDescription ?? "" })}
              >
                แก้ไข
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {event?.eventDescription || "ไม่มีรายละเอียด"}
          </p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                <Clock className="h-5 w-5" />
              </div>
              ช่วงเวลาของอีเว้นต์
            </CardTitle>
            {editable && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  handleEdit("time", {
                    startView: event?.startView ?? "",
                    endView: event?.endView ?? "",
                    startTime: event?.startJoinDate ?? "",
                    endTime: event?.endJoinDate ?? "",
                  })
                }
              >
                แก้ไข
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 items-center">
            <div>
              {(() => {
                const now = new Date();
                const sv = event?.startView ? new Date(event.startView) : undefined;
                const ev = event?.endView ? new Date(event.endView) : undefined;
                if (sv && now < sv) {
                  return (
                    <div className="font-bold text-xl">
                      เริ่มในอีก
                      <h1 className="text-blue-600">{timeUntil(event.startView)}</h1>
                    </div>
                  );
                }
                if (sv && (!ev || now <= ev)) {
                  return (
                    <div className="font-bold text-xl">
                      จะจบในอีก
                      <h1 className="text-red-600">{event?.endView ? timeUntil(event.endView) : "กำลังจัด"}</h1>
                    </div>
                  );
                }
                if (ev && now > ev) {
                  return (
                    <div className="font-bold text-xl text-muted-foreground">
                      จบแล้ว
                    </div>
                  );
                }
                return null;
              })()}
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">เริ่ม:</span>
                <span>{event?.startView ? new Date(event.startView).toLocaleString("th-TH") : "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">สิ้นสุด:</span>
                <span>{event?.endView ? new Date(event.endView).toLocaleString("th-TH") : "-"}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <div className="p-2 rounded-lg bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                <MapPin className="h-5 w-5" />
              </div>
              สถานที่จัดอีเว้นต์
            </CardTitle>
            {editable && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  handleEdit("location", {
                    locationName: event?.locationName ?? "",
                    location: event?.location ?? "",
                  })
                }
              >
                แก้ไข
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="font-medium">{event?.locationName ?? "-"}</div>
            {event?.location && (
              <a href={(event?.location || "").replace(/`/g, "").trim()} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80 transition-colors">
                {linkLabel}
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <div className="p-2 rounded-lg bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                <Users className="h-5 w-5" />
              </div>
              ผู้นำเสนอ
            </CardTitle>
            {editable && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  handleEdit("presenter", {
                    startJoinDate: event?.startJoinDate ?? "",
                    endJoinDate: event?.endJoinDate ?? "",
                    maxTeams: event?.maxTeams ?? 0,
                    maxTeamMembers: event?.maxTeamMembers ?? 0,
                  })
                }
              >
                แก้ไข
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Submission Start:</span>
              <span>{event?.startJoinDate ? new Date(event.startJoinDate).toLocaleString("th-TH") : "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Submission End:</span>
              <span>{event?.endJoinDate ? new Date(event.endJoinDate).toLocaleString("th-TH") : "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Max Teams:</span>
              <span>{event?.maxTeams ?? "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Members per Group:</span>
              <span>{event?.maxTeamMembers ?? "-"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <div className="p-2 rounded-lg bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300">
                <Gift className="h-5 w-5" />
              </div>
              รางวัลและแต้ม
            </CardTitle>
            {editable && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  handleEdit("guest", {
                    guestReward: event?.virtualRewardGuest ?? 0,
                    committeeReward: event?.virtualRewardCommittee ?? 0,
                    unitReward: event?.unitReward ?? "coins",
                  })
                }
              >
                แก้ไข
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Guest Reward:</span>
              <span className="font-medium text-amber-600">
                {event?.virtualRewardGuest ?? 0} {event?.unitReward ?? "coins"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Committee Reward:</span>
              <span className="font-medium text-amber-600">
                {event?.virtualRewardCommittee ?? 0} {event?.unitReward ?? "coins"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {editable && (
        <Card className="lg:col-span-2 border-none shadow-md hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <div className="p-2 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                  <Users className="h-5 w-5" />
                </div>
                Invite Links
              </CardTitle>
              <div className="text-sm text-muted-foreground">Share invite link for roles</div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {["presenter", "guest", "committee"].map((role) => {
                const r = role as "presenter" | "guest" | "committee";
                const origin = typeof window !== "undefined" ? window.location.origin : "";
                const token = tokens[r];
                const link = token ? `${origin}/event/${id}/invite?token=${encodeURIComponent(token)}` : `${origin}/event/${id}/invite?role=${encodeURIComponent(r)}`;
                const qrRef = refForRole(r);
                const qrThumb = qrThumbs[r] || "";
                const qrLargeUrl = qrLarge[r] || "";
                return (
                  <div key={role} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/30">
                    <div className="capitalize font-medium min-w-[100px]">{role}</div>
                    <div className="flex items-center gap-2" ref={qrRef}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="hover:bg-background"
                        onClick={() => {
                          if (!link) {
                            toast.error("กำลังเตรียมลิงก์เชิญ...");
                            return;
                          }
                          navigator.clipboard.writeText(link);
                          toast.success("Copied");
                        }}
                      >
                        <ClipboardCopy className="h-4 w-4 mr-2" />
                        Copy Link
                      </Button>
                      {qrThumb ? (
                        <>
                          <img src={qrThumb} alt={`qr-${role}`} className="h-10 w-10 rounded border" />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              if (qrLargeUrl) {
                                setQrSrc(qrLargeUrl);
                                setQrTitle(`QR Code สำหรับ ${role}`);
                                setQrOpen(true);
                                return;
                              }
                              const node = qrRef.current;
                              if (!node) {
                                toast.error("กำลังเตรียม QR...");
                                return;
                              }
                              try {
                                const dataUrl = await toPng(node, { cacheBust: true, pixelRatio: 2 });
                                setQrSrc(dataUrl);
                                setQrTitle(`QR Code สำหรับ ${role}`);
                                setQrOpen(true);
                              } catch {
                                toast.error("แสดงรูป QR ไม่สำเร็จ");
                              }
                            }}
                          >
                            View QR
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">กำลังเตรียม...</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{qrTitle || "QR Code"}</DialogTitle>
          </DialogHeader>
          {qrSrc && <img src={qrSrc} alt="qr" className="w-full h-auto" />}
        </DialogContent>
      </Dialog>

      <Card className="lg:col-span-2 border-none shadow-md bg-gradient-to-br from-background to-muted/20">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold">
              <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                <Award className="h-5 w-5" />
              </div>
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Special Rewards / รางวัลพิเศษ
              </span>
            </CardTitle>
            {editable && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  handleEdit("rewards", {
                    specialRewards: (event?.specialRewards ?? []).map((r) => r.name),
                  })
                }
              >
                แก้ไข
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {rewards && rewards.length > 0 ? (
            <div className="space-y-4">
              {rewards.map((reward, index) => (
                <div key={reward.id} className="border rounded-lg p-4 space-y-4 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      Reward #{index + 1}
                    </span>
                    {editable && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteReward(reward.id)}
                        disabled={deletingId === reward.id}
                        title="ลบรางวัล"
                        aria-label="ลบรางวัล"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-24 sm:w-32">
                      {reward.image ? (
                        <div className="relative border rounded-lg overflow-hidden aspect-square bg-muted w-full">
                          <img
                            src={reward.image}
                            alt={reward.name}
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-border rounded-lg aspect-square bg-muted flex items-center justify-center">
                          <Gift className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="space-y-2">
                        <Label>Reward Name / ชื่อรางวัล</Label>
                        <p className="font-medium text-base">{reward.name}</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Description / รายละเอียด</Label>
                        <p className="text-muted-foreground text-sm whitespace-pre-wrap">{reward.description || "ไม่มีรายละเอียด"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No special rewards added yet / ยังไม่มีรางวัลพิเศษ</p>
              <p className="text-sm">Contact organizer to add rewards / ติดต่อผู้จัดงานเพื่อเพิ่มรางวัล</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
