"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Gift, Clock, MapPin } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { setEventPublicView } from "@/utils/apievent";

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

export default function PublishedView({ id, event }: Props) {
  const [tab, setTab] = useState<
    "dashboard" | "information" | "project" | "result"
  >("dashboard");
  const [updatingPublic, setUpdatingPublic] = useState(false);
  const [localEvent, setLocalEvent] = useState<EventData>(event);
  const [bannerOpen, setBannerOpen] = useState(false);

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
          <DialogContent showCloseButton={false} className="sm:max-w-3xl md:max-w-5xl bg-transparent border-none p-0" aria-label="Event banner">
            <DialogTitle className="sr-only">Event banner</DialogTitle>
            <Image
              src={localEvent?.imageCover || "/banner.png"}
              alt={localEvent.eventName || "Event banner"}
              width={800}
              height={400}
              className="w-full h-auto rounded-xl"
            />
            <DialogClose aria-label="Close banner" className="absolute top-3 right-3 z-50 rounded-full bg-black/60 text-white hover:bg-black/80 p-2 shadow">
              <X className="h-4 w-4" />
            </DialogClose>
          </DialogContent>
        </Dialog>
        <div className="max-w-6xl mx-auto px-6 lg:px-8 mt-6">
          <div className="bg-card rounded-xl shadow-sm border p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                {localEvent?.eventName || "Event"}
              </h1>
              <p className="text-muted-foreground">เผยแพร่แล้ว</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={localEvent?.publicView ? "default" : "secondary"}
                onClick={async () => {
                  if (!id) return;
                  setUpdatingPublic(true);
                  try {
                    const res = await setEventPublicView(
                      id,
                      !localEvent?.publicView
                    );
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
                className="px-6"
              >
                {localEvent?.publicView
                  ? "ซ่อนจากสาธารณะ"
                  : "เปิดให้สาธารณะเห็น"}
              </Button>
            </div>
          </div>

          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as typeof tab)}
            className="mt-6"
          >
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
          ผู้เข้าร่วม: {localEvent?.guestsCount ?? 0} |
          กรรมการ: {localEvent?.committeeCount ?? 0}
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
        <div className="text-3xl font-bold">
          {localEvent?.guestsCount ?? 0}
        </div>
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
        <div className="text-3xl font-bold">
          {localEvent?.committeeCount ?? 0}
        </div>
        <p className="text-muted-foreground">
          ให้ฟีดแบ็ก: {localEvent?.committeeFeedbackCount ?? 10} / ใช้ไป:{" "}
          {localEvent?.committeeVirtualUsed ?? 2000}
        </p>
      </CardContent>
    </Card>

    {/* ความคิดเห็นทั้งหมด */}
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          ความคิดเห็นทั้งหมด
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">
          {localEvent?.opinionsGot ?? 33}
        </div>
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
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" /> ช่วงเวลา
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        เริ่ม:{" "}
                        {localEvent?.startView
                          ? new Date(localEvent.startView).toLocaleString(
                              "th-TH"
                            )
                          : "-"}
                      </div>
                      <div>
                        สิ้นสุด:{" "}
                        {localEvent?.endView
                          ? new Date(localEvent.endView).toLocaleString("th-TH")
                          : "-"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" /> สถานที่
                    </CardTitle>
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
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>รายละเอียด</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {localEvent?.eventDescription || ""}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="project">
              <div className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>ผลงาน</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-muted-foreground">
                      ยังไม่มีข้อมูลผลงาน
                    </div>
                  </CardContent>
                </Card>
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
      </div>
    </div>
  );
}
