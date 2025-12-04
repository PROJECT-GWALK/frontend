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
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" /> ผู้นำเสนอ
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {localEvent?.maxTeams ?? 0}
                    </div>
                    <p className="text-muted-foreground">จำนวนทีม</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="h-5 w-5" /> รางวัลผู้เข้าร่วม
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {localEvent?.virtualRewardGuest ?? 0}
                    </div>
                    <p className="text-muted-foreground">Virtual Rewards</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="h-5 w-5" /> รางวัลกรรมการ
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {localEvent?.virtualRewardCommittee ?? 0}
                    </div>
                    <p className="text-muted-foreground">Virtual Rewards</p>
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
