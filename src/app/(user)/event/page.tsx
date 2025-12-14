"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Calendar } from "lucide-react";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { getPublishedEvents, signInvite, joinEvent } from "@/utils/apievent";
import type { MyEvent } from "@/utils/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function EventsPage() {
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<
    "upcomingRecruit" | "accepting" | "viewSoon" | "viewOpen" | "finished"
  >("viewOpen");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getPublishedEvents();
        setEvents(res.events || []);
      } catch {
        toast.error("โหลดรายการอีเวนต์ไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleJoin = async (
    eventId: string,
    role: "presenter" | "committee" | "guest"
  ) => {
    try {
      const resSign = await signInvite(eventId, role);
      if (resSign?.message !== "ok" || !resSign?.sig) {
        toast.error("ไม่สามารถเข้าร่วมอีเวนต์ได้");
        return;
      }
      const resJoin = await joinEvent(eventId, role, resSign.sig);
      if (resJoin?.message === "ok") {
        toast.success("เข้าร่วมอีเวนต์สำเร็จ");
        setEvents((prev) =>
          prev.map((e) =>
            e.id === eventId ? { ...e, role: role.toUpperCase() } : e
          )
        );
      } else {
        toast.error(resJoin?.message || "เข้าร่วมอีเวนต์ไม่สำเร็จ");
      }
    } catch (err) {
      let message = "เข้าร่วมอีเวนต์ไม่สำเร็จ";
      const ax = err as AxiosError<{ message?: string }>;
      const backendMessage = ax?.response?.data?.message;
      if (backendMessage) message = backendMessage;
      toast.error(message);
    }
  };

  if (loading) {
    return <div className="p-6">กำลังโหลด...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground">รายการอีเวนต์ที่กำลังเปิดอยู่</p>
        </div>
        <div className="relative w-full md:w-80">
          <Input
            placeholder="ค้นหาด้วยชื่ออีเวนต์..."
            className="pl-10 bg-background/60 backdrop-blur-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList>
          <TabsTrigger value="upcomingRecruit">จะเปิดรับสมัครเร็วๆ นี้</TabsTrigger>
          <TabsTrigger value="accepting">เปิดรับสมัครผู้นำเสนอ</TabsTrigger>
          <TabsTrigger value="viewSoon">จะเปิดให้ชมเร็วๆ นี้</TabsTrigger>
          <TabsTrigger value="viewOpen">กำลังเปิดให้ชม</TabsTrigger>
          <TabsTrigger value="finished">จบแล้ว</TabsTrigger>
        </TabsList>
        <TabsContent value={filter} />
      </Tabs>

      {events
        .filter((e) => e.eventName.toLowerCase().includes(search.toLowerCase()))
        .filter((e) => {
          const now = new Date();
          const sv = e.startView ? new Date(e.startView) : undefined;
          const ev = e.endView ? new Date(e.endView) : undefined;
          const sj = e.startJoinDate ? new Date(e.startJoinDate) : undefined;
          const ej = e.endJoinDate ? new Date(e.endJoinDate) : undefined;
          if (filter === "upcomingRecruit") {
            if (!sj) return false;
            return now < sj;
          }
          if (filter === "accepting") {
            if (sj && ej) return now >= sj && now <= ej;
            if (sj && !ej) return now >= sj;
            if (!sj && ej) return now <= ej;
            return false;
          }
          if (filter === "viewSoon") {
            if (!sv) return false;
            return now < sv;
          }
          if (filter === "viewOpen") {
            if (!sv) return false;
            const within = ev ? now >= sv && now <= ev : now >= sv;
            return (e.publicView ?? false) && within;
          }
          if (filter === "finished") {
            if (!ev) return false;
            return now > ev;
          }
          return true;
        }).length === 0 && (
        <p className="text-muted-foreground">ยังไม่มีอีเวนต์ที่เผยแพร่</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {events
          .filter((e) => e.eventName.toLowerCase().includes(search.toLowerCase()))
          .filter((e) => {
            const now = new Date();
            const sv = e.startView ? new Date(e.startView) : undefined;
            const ev = e.endView ? new Date(e.endView) : undefined;
            const sj = e.startJoinDate ? new Date(e.startJoinDate) : undefined;
            const ej = e.endJoinDate ? new Date(e.endJoinDate) : undefined;
            if (filter === "upcomingRecruit") {
              if (!sj) return false;
              return now < sj;
            }
            if (filter === "accepting") {
              if (sj && ej) return now >= sj && now <= ej;
              if (sj && !ej) return now >= sj;
              if (!sj && ej) return now <= ej;
              return false;
            }
            if (filter === "viewSoon") {
              if (!sv) return false;
              return now < sv;
            }
            if (filter === "viewOpen") {
              if (!sv) return false;
              const within = ev ? now >= sv && now <= ev : now >= sv;
              return (e.publicView ?? false) && within;
            }
            if (filter === "finished") {
              if (!ev) return false;
              return now > ev;
            }
            return true;
          })
          .map((event) => {
            const hasBanner = Boolean(event.imageCover);
            return (
              <Card
                key={event.id}
                className="overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative h-36">
                  {hasBanner ? (
                    <img
                      src={event.imageCover as string}
                      alt={event.eventName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-linear-to-br from-brand-tertiary/40 to-brand-primary/40 flex items-center justify-center">
                      <img
                        src="/banner.png"
                        alt={event.eventName}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <span className="absolute top-2 left-2 px-2 py-1 text-[10px] font-medium rounded-2xl bg-emerald-500 text-white shadow-sm">
                    Live
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Link
                        href={`/event/${event.id}`}
                        className="font-semibold hover:underline line-clamp-1"
                      >
                        {event.eventName}
                      </Link>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Published at{" "}
                          {new Date(event.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {event.role && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border">
                        {event.role}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    {event.role ? (
                      <Link href={`/event/${event.id}`}>
                        <Button size="sm">View</Button>
                      </Link>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleJoin(event.id, "presenter")}
                        >
                          Presenter
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleJoin(event.id, "committee")}
                        >
                          Committee
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleJoin(event.id, "guest")}
                        >
                          Guest
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
      </div>
    </div>
  );
}
