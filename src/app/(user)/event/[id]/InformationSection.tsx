"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Users, Gift, ClipboardCopy } from "lucide-react";
import { timeUntil, getInviteLink } from "@/utils/function";
import { toast } from "sonner";
import type { EventData } from "@/utils/types";

type Props = {
  id: string;
  event: EventData;
  editable?: boolean;
  onEdit?: (section: "description" | "time" | "location" | "presenter" | "guest" | "rewards", initialForm: Record<string, unknown>) => void;
  linkLabel?: string;
};

export default function InformationSection({ id, event, editable, onEdit, linkLabel = "ลิงก์" }: Props) {
  const handleEdit = (section: Props["onEdit"] extends Function ? "description" | "time" | "location" | "presenter" | "guest" | "rewards" : never, initialForm: Record<string, unknown>) => {
    if (editable && onEdit) onEdit(section, initialForm);
  };

  return (
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle>รายละเอียดอีเว้นต์</CardTitle>
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
          <p className="text-muted-foreground whitespace-pre-wrap">{event?.eventDescription || ""}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" /> ช่วงเวลาของอีเว้นต์
            </CardTitle>
            {editable && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  handleEdit("time", {
                    startView: event?.startView ?? "",
                    endView: event?.endView ?? "",
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
                    <div className="font-bold text-xl">
                      จบแล้ว
                    </div>
                  );
                }
                return null;
              })()}
            </div>
            <div>
              <div>
                เริ่ม: {event?.startView ? new Date(event.startView).toLocaleString("th-TH") : "-"}
              </div>
              <div>
                สิ้นสุด: {event?.endView ? new Date(event.endView).toLocaleString("th-TH") : "-"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" /> สถานที่จัดอีเว้นต์
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
            <div>{event?.locationName ?? "-"}</div>
            {event?.location && (
              <a href={event.location} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                {linkLabel}
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> ผู้นำเสนอ
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
            <div>
              Submission Start: {event?.startJoinDate ? new Date(event.startJoinDate).toLocaleString("th-TH") : "-"}
            </div>
            <div>
              Submission End: {event?.endJoinDate ? new Date(event.endJoinDate).toLocaleString("th-TH") : "-"}
            </div>
            <div>Max Teams: {event?.maxTeams ?? "-"}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" /> รางวัลและแต้ม
            </CardTitle>
            {editable && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  handleEdit("guest", {
                    guestReward: event?.virtualRewardGuest ?? 0,
                    committeeReward: event?.virtualRewardCommittee ?? 0,
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
            <div>Guest Reward per person: {event?.virtualRewardGuest ?? 0}</div>
            <div>Committee Reward per person: {event?.virtualRewardCommittee ?? 0}</div>
          </div>
        </CardContent>
      </Card>

      {editable && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" /> Invite Links
              </CardTitle>
              <div className="text-sm text-muted-foreground">Share invite link for roles</div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {["presenter", "guest", "committee"].map((role) => {
                const link = getInviteLink(id, role as "presenter" | "guest" | "committee");
                return (
                  <div key={role} className="flex items-center justify-between gap-2">
                    <div className="capitalize">{role}</div>
                    <div className="flex items-center gap-2">
                      <a href={link} target="_blank" rel="noreferrer" className="text-primary underline">
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
      )}

      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle>รางวัลพิเศษ</CardTitle>
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
          <div className="flex flex-wrap gap-2">
            {(event?.awardsUnused ?? []).map((a, i) => (
              <span key={i} className="px-2 py-1 rounded border text-xs">
                {a}
              </span>
            ))}
            {(!event?.awardsUnused || event.awardsUnused.length === 0) && (
              <div className="text-sm text-muted-foreground">ไม่มีรางวัลที่ยังไม่ได้แจก</div>
            )}
          </div>
          <div className="mt-3 text-sm text-muted-foreground">
            ทั้งหมด: {event?.specialPrizeCount ?? 0} | ใช้ไป: {event?.specialPrizeUsed ?? 0}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
