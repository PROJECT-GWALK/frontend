"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Calendar } from "lucide-react";
import { toast } from "sonner";
import { AxiosError } from "axios";
import {
  getPublishedEvents,
  getInviteToken,
  joinEventWithToken,
} from "@/utils/apievent";
import { formatDateTime } from "@/utils/function";
import type { MyEvent } from "@/utils/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

export default function EventsPage() {
  const { timeFormat } = useLanguage();
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<
    | "all"
    | "upcomingRecruit"
    | "accepting"
    | "viewSoon"
    | "viewOpen"
    | "finished"
  >("all");

  const getEventStatus = (event: MyEvent): string => {
    const now = new Date();
    const startJoin = event.startJoinDate ? new Date(event.startJoinDate) : null;
    const endJoin = event.endJoinDate ? new Date(event.endJoinDate) : null;
    const startView = event.startView ? new Date(event.startView) : null;
    const endView = event.endView ? new Date(event.endView) : null;

    // finished: หลัง endView
    if (endView && now > endView) return "finished";
    
    // viewOpen: กำลัง startView (ระหว่าง startView ถึง endView)
    if (startView && now >= startView) return "viewOpen";
    
    // viewSoon: ก่อน startView (หลัง endJoin แต่ก่อน startView)
    if (endJoin && now > endJoin && startView && now < startView) return "viewSoon";
    
    // accepting: กำลัง startJoinDate (ระหว่าง startJoin ถึง endJoin)
    if (startJoin && endJoin && now >= startJoin && now <= endJoin) return "accepting";
    
    // upcomingRecruit: ก่อน startJoinDate
    if (startJoin && now < startJoin) return "upcomingRecruit";
    
    return "viewOpen"; // default fallback
  };

  const counts = {
    upcomingRecruit: events.filter(e => getEventStatus(e) === "upcomingRecruit").length,
    accepting: events.filter(e => getEventStatus(e) === "accepting").length,
    viewSoon: events.filter(e => getEventStatus(e) === "viewSoon").length,
    viewOpen: events.filter(e => getEventStatus(e) === "viewOpen").length,
    finished: events.filter(e => getEventStatus(e) === "finished").length,
  };

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
      const token = await getInviteToken(eventId, role);
      if (token?.message !== "ok" || !token?.token) {
        toast.error("ไม่สามารถเข้าร่วมอีเวนต์ได้");
        return;
      }
      const resJoin = await joinEventWithToken(eventId, token.token);
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
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <Skeleton className="h-9 w-32 mb-2" />
            <Skeleton className="h-5 w-48" />
          </div>
          <Skeleton className="h-10 w-full md:w-80" />
        </div>

        <Skeleton className="h-10 w-full max-w-2xl" />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden border-none shadow-md">
              <Skeleton className="h-36 w-full" />
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-2 w-full">
                    <Skeleton className="h-5 w-3/4" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getFilterLabel = (f: string) => {
    const labels: Record<string, string> = {
      all: "All Events",
      upcomingRecruit: "Coming Soon",
      accepting: "Accepting",
      viewSoon: "Viewing Soon",
      viewOpen: "Live Now",
      finished: "Finished",
    };
    return labels[f] || f;
  };

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

      <div className="flex flex-wrap gap-2">
        {(["all", "upcomingRecruit", "accepting", "viewSoon", "viewOpen", "finished"] as const).map((f) => {
          const count = f === "all" ? events.length : counts[f];
          return (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
              className={`rounded-full transition-all ${
                filter === f ? "shadow-md" : "hover:border-primary/50"
              }`}
            >
              {getFilterLabel(f)}
              <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-background/20">
                {count}
              </span>
            </Button>
          );
        })}
      </div>

      {events
        .filter((e) => e.eventName.toLowerCase().includes(search.toLowerCase()))
        .filter((e) => {
          if (filter === "all") return true;
          return getEventStatus(e) === filter;
        }).length === 0 && (
        <p className="text-muted-foreground">ยังไม่มีอีเวนต์ที่เผยแพร่</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {events
          .filter((e) =>
            e.eventName.toLowerCase().includes(search.toLowerCase())
          )
          .filter((e) => {
            if (filter === "all") return true;
            return getEventStatus(e) === filter;
          })
          .map((event) => {
            const hasBanner = Boolean(event.imageCover);
            const status = getEventStatus(event);
            const statusConfig = {
              upcomingRecruit: { label: "Coming Soon", color: "bg-amber-500" },
              accepting: { label: "Accepting", color: "bg-emerald-500" },
              viewSoon: { label: "Viewing Soon", color: "bg-blue-500" },
              viewOpen: { label: "Live", color: "bg-rose-500" },
              finished: { label: "Finished", color: "bg-slate-500" },
            };
            const config = statusConfig[status as keyof typeof statusConfig] || { label: status, color: "bg-gray-500" };

            return (
              <Card
                key={event.id}
                className="group relative flex flex-col overflow-hidden border border-border/60 bg-card shadow-sm transition-all duration-300 hover:border-primary hover:shadow-xl"
              >
                <div className="relative aspect-video w-full overflow-hidden">
                  {hasBanner ? (
                    <Image
                      src={event.imageCover as string}
                      alt={event.eventName}
                      fill
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-linear-to-br from-brand-tertiary/40 to-brand-primary/40 flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
                      <Image
                        src="/banner.png"
                        alt={event.eventName}
                        fill
                        className="h-full w-full object-cover opacity-80"
                      />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-40" />
                  
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md ${config.color} text-white shadow-sm backdrop-blur-md`}>
                      {config.label}
                    </span>
                  </div>

                  {event.role && (
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md bg-white/90 text-primary shadow-sm backdrop-blur-md">
                        {event.role}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-4 space-y-2">
                    <Link
                      href={`/event/${event.id}`}
                      className="block"
                    >
                      <h3 className="font-bold text-lg leading-tight tracking-tight text-foreground transition-colors group-hover:text-primary line-clamp-2">
                        {event.eventName}
                      </h3>
                    </Link>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {formatDateTime(new Date(event.createdAt), timeFormat)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-auto pt-2">
                    {event.role ? (
                      <Link href={`/event/${event.id}`} className="block w-full">
                        <Button className="w-full group-hover:bg-primary/90 transition-colors" size="default">
                          Joined Event
                        </Button>
                      </Link>
                    ) : (
                      <div className="space-y-3">
                        {status === "accepting" && (
                          <>
                            <div className="flex items-center gap-2">
                              <div className="h-px flex-1 bg-border" />
                              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                Join As
                              </span>
                              <div className="h-px flex-1 bg-border" />
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-xs hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                              onClick={() => handleJoin(event.id, "presenter")}
                            >
                              Presenter
                            </Button>
                          </>
                        )}

                        {(status === "viewSoon" || status === "viewOpen") && (
                          <>
                            <div className="flex items-center gap-2">
                              <div className="h-px flex-1 bg-border" />
                              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                Join As
                              </span>
                              <div className="h-px flex-1 bg-border" />
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-xs hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                              onClick={() => handleJoin(event.id, "guest")}
                            >
                              Guest
                            </Button>
                          </>
                        )}
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
