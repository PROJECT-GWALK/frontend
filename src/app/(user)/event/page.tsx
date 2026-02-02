"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Calendar, Users, Eye } from "lucide-react";
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
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function EventsPage() {
  const { timeFormat, t } = useLanguage();
  const { status: sessionStatus } = useSession();
  const router = useRouter();
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
        toast.error(t.eventsPage.toast.loadError);
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
    if (sessionStatus !== "authenticated") {
      router.push("/sign-in");
      return;
    }

    try {
      const token = await getInviteToken(eventId, role);
      if (token?.message !== "ok" || !token?.token) {
        toast.error(t.eventsPage.toast.joinError);
        return;
      }
      const resJoin = await joinEventWithToken(eventId, token.token);
      if (resJoin?.message === "ok") {
        toast.success(t.eventsPage.toast.joinSuccess);
        setEvents((prev) =>
          prev.map((e) =>
            e.id === eventId ? { ...e, role: role.toUpperCase() } : e
          )
        );
      } else {
        toast.error(resJoin?.message || t.eventsPage.toast.joinFail);
      }
    } catch (err) {
      let message = t.eventsPage.toast.joinFail;
      const ax = err as AxiosError<{ message?: string }>;
      const backendMessage = ax?.response?.data?.message;
      if (backendMessage) message = backendMessage;
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
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
      all: t.eventsPage.filter.all,
      upcomingRecruit: t.eventsPage.filter.upcomingRecruit,
      accepting: t.eventsPage.filter.accepting,
      viewSoon: t.eventsPage.filter.viewSoon,
      viewOpen: t.eventsPage.filter.viewOpen,
      finished: t.eventsPage.filter.finished,
    };
    return labels[f] || f;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.eventsPage.title}</h1>
          <p className="text-muted-foreground">{t.eventsPage.subtitle}</p>
        </div>
        <div className="relative w-full md:w-80">
          <Input
            placeholder={t.eventsPage.searchPlaceholder}
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
        <p className="text-muted-foreground">{t.eventsPage.noEvents}</p>
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
            
            const getRoleColorVar = (role?: string) => {
              switch (role) {
                case "ORGANIZER": return "var(--role-organizer)";
                case "PRESENTER": return "var(--role-presenter)";
                case "COMMITTEE": return "var(--role-committee)";
                case "GUEST": return "var(--role-guest)";
                default: return undefined;
              }
            };

            const roleColor = getRoleColorVar(event.role ?? undefined);

            return (
              <Card
                key={event.id}
                className="group relative flex flex-col overflow-hidden hover:shadow-xl transition-all duration-300 border border-border/60 p-0 gap-0"
                style={roleColor ? { 
                  borderLeftWidth: "6px", 
                  borderLeftColor: roleColor,
                  "--card-role-color": roleColor 
                } as React.CSSProperties : {}}
              >
                {roleColor && (
                  <div 
                    className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-300 opacity-[0.08] group-hover:opacity-20"
                    style={{ 
                      background: `linear-gradient(to right, ${roleColor}, transparent 40%)`,
                    }} 
                  />
                )}
                
                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                  <Link href={`/event/${event.id}`} className="block w-full h-full">
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
                  </Link>

                  <span
                    className={`absolute top-3 left-3 px-2.5 py-1 text-xs font-semibold rounded-full shadow-lg ${config.color} text-white z-10`}
                  >
                    {config.label}
                  </span>
                </div>

                <div className="flex flex-col flex-1 p-4 gap-3">
                  <div className="space-y-2">
                    <Link
                      href={`/event/${event.id}`}
                      className="block"
                    >
                      <h4 className="font-semibold text-lg line-clamp-1 hover:text-primary transition-colors">
                        {event.eventName}
                      </h4>
                    </Link>
                    
                    <div 
                      className={`flex items-center gap-2 text-xs ${!roleColor ? "text-muted-foreground" : ""}`}
                      style={roleColor ? { color: roleColor } : {}}
                    >
                      {event.role ? (
                        <>
                          <Users className="h-3.5 w-3.5" />
                          <span className="font-medium">{event.role}</span>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            {formatDateTime(new Date(event.createdAt), timeFormat)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    {(() => {
                      const subStart = event.startJoinDate ? new Date(event.startJoinDate) : null;
                      const subEnd = event.endJoinDate ? new Date(event.endJoinDate) : null;
                      const eventStart = event.startView ? new Date(event.startView) : null;
                      const eventEnd = event.endView ? new Date(event.endView) : null;
                      
                      return (
                        <>
                          {subStart && subEnd && (
                            <div className="flex flex-col gap-1 p-2 rounded-md bg-muted/50 border border-border/50">
                              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground/80">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>Join Period</span>
                              </div>
                              <div className="text-xs pl-5">
                                <span className="font-medium text-foreground">{formatDateTime(subStart, timeFormat)}</span>
                                <span className="mx-1 text-muted-foreground">-</span>
                                <span className="font-medium text-foreground">{formatDateTime(subEnd, timeFormat)}</span>
                              </div>
                            </div>
                          )}
                          
                          {eventStart && eventEnd && (
                            <div className="flex flex-col gap-1 p-2 rounded-md bg-primary/5 border border-primary/10">
                              <div className="flex items-center gap-1.5 text-xs font-medium text-primary/80">
                                <Eye className="h-3.5 w-3.5" />
                                <span>Event Period</span>
                              </div>
                              <div className="text-xs pl-5">
                                <span className="font-medium text-foreground">{formatDateTime(eventStart, timeFormat)}</span>
                                <span className="mx-1 text-muted-foreground">-</span>
                                <span className="font-medium text-foreground">{formatDateTime(eventEnd, timeFormat)}</span>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  <div className="mt-auto pt-2">
                    {event.role ? (
                      <Link href={`/event/${event.id}`} className="block w-full">
                        <Button className="w-full hover:bg-primary/90 transition-colors" size="sm">
                          {t.eventsPage.joinedEvent}
                        </Button>
                      </Link>
                    ) : (
                      <div className="space-y-3">
                        {status === "accepting" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-xs hover:bg-primary hover:text-white dark:hover:text-black hover:border-primary transition-colors"
                              onClick={() => handleJoin(event.id, "presenter")}
                            >
                              {t.eventsPage.joinAsPresenter}
                            </Button>
                          </div>
                        )}

                        {(status === "viewSoon" || status === "viewOpen") && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-xs hover:bg-primary hover:text-white dark:hover:text-black hover:border-primary transition-colors"
                              onClick={() => handleJoin(event.id, "guest")}
                            >
                              {t.eventsPage.joinAsGuest}
                            </Button>
                          </div>
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
