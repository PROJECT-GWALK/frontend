"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, CalendarPlus, MoreHorizontal, ChevronRight, Calendar, Users, Eye, Star } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createEvent, getMyDraftEvents, getMyEvents, deleteEvent } from "@/utils/apievent";
import { DraftEvent, MyEvent } from "@/utils/types";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDateTime } from "@/utils/function";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { AxiosError } from "axios";
import Image from "next/image";



type FilterType = "all" | "draft" | "upcomingRecruit" | "accepting" | "viewSoon" | "viewOpen" | "finished";

// ฟังก์ชันกำหนดสถานะของอีเวนต์ตามวันที่
const getEventStatus = (event: MyEvent | DraftEvent): Exclude<FilterType, "all"> => {
  if (event.status !== "PUBLISHED") return "draft";
  
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



const getRoleColorVar = (role?: string) => {
  switch (role) {
    case "ORGANIZER": return "var(--role-organizer)";
    case "PRESENTER": return "var(--role-presenter)";
    case "COMMITTEE": return "var(--role-committee)";
    case "GUEST": return "var(--role-guest)";
    default: return undefined;
  }
};

export default function DashboardPage() {
  const { timeFormat, t } = useLanguage();

  const mapEventNameMessage = (message: string) =>
    message === "Event name already exists" ? t.homePage.error.nameExists : message;

  const getStatusBadge = (status: Exclude<FilterType, "all">) => {
    const badges = {
      draft: { label: t.homePage.status.draft, color: "bg-gray-500" },
      upcomingRecruit: { label: t.homePage.status.upcomingRecruit, color: "bg-blue-500" },
      accepting: { label: t.homePage.status.accepting, color: "bg-green-500" },
      viewSoon: { label: t.homePage.status.viewSoon, color: "bg-yellow-500" },
      viewOpen: { label: t.homePage.status.viewOpen, color: "bg-emerald-500" },
      finished: { label: t.homePage.status.finished, color: "bg-red-500" },
    };
    return badges[status];
  };

  const getFilterLabel = (filter: FilterType) => {
    const labels = {
      all: t.homePage.filter.all,
      draft: t.homePage.filter.draft,
      upcomingRecruit: t.homePage.filter.upcomingRecruit,
      accepting: t.homePage.filter.accepting,
      viewSoon: t.homePage.filter.viewSoon,
      viewOpen: t.homePage.filter.viewOpen,
      finished: t.homePage.filter.finished,
    };
    return labels[filter];
  };

  const [drafts, setDrafts] = useState<DraftEvent[]>([]);
  const [myEvents, setMyEvents] = useState<MyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEventName, setNewEventName] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; eventName: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [roleFilter, setRoleFilter] = useState<"ALL" | "ORGANIZER" | "PRESENTER" | "COMMITTEE" | "GUEST">("ALL");

  useEffect(() => {
    const load = async () => {
      try {
        const [dRes, eRes] = await Promise.all([getMyDraftEvents(), getMyEvents()]);
        setDrafts(dRes.events || []);
        setMyEvents(eRes.events || []);
      } catch (err) {
        console.error("Failed to load events:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleCreateEvent = async (eventName: string) => {
    try {
      const resCreate = await createEvent(eventName);

      if (resCreate?.message === "Event name already exists") {
        toast.error(mapEventNameMessage(resCreate.message));
        return;
      }

      const resDrafts = await getMyDraftEvents();
      setDrafts(resDrafts.events || []);
      toast.success(t.homePage.toast.createSuccess);
    } catch (err) {
      let message = t.homePage.toast.createFail;
      if (typeof err === "object" && err) {
        const backendMessage = (err as AxiosError<{ message: string }>).response?.data?.message;
        if (backendMessage) {
          message = backendMessage;
        } else if (err instanceof Error && err.message) {
          message = err.message;
        }
      }
      toast.error(mapEventNameMessage(message));
    }
  };

  const openDeleteConfirm = (event: { id: string; eventName: string }) => {
    setDeleteTarget({ id: event.id, eventName: event.eventName });
    setDeleteOpen(true);
  };

  const handleDeleteEvent = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      const res = await deleteEvent(deleteTarget.id);
      const deletedId = (res?.deletedId as string) ?? deleteTarget.id;
      setDrafts((prev) => prev.filter((d) => d.id !== deletedId));
      setMyEvents((prev) => prev.filter((e) => e.id !== deletedId));
      toast.success(t.homePage.toast.deleteSuccess);
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (err) {
      let message = t.homePage.toast.deleteFail;
      if (typeof err === "object" && err) {
        const backendMessage = (err as AxiosError<{ message: string }>).response?.data?.message;
        if (backendMessage) {
          message = backendMessage;
        } else if (err instanceof Error && err.message) {
          message = err.message;
        }
      }
      toast.error(mapEventNameMessage(message));
    } finally {
      setDeleting(false);
    }
  };

  // รวม drafts และ myEvents เข้าด้วยกัน
  const allEvents = [
    ...drafts.map(d => ({ ...d, isDraft: true as const })),
    ...myEvents.map(e => ({ ...e, isDraft: false as const }))
  ];

  // กรองตาม filter และ search
  const filteredEvents = allEvents.filter((event) => {
    const matchText = event.eventName.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "ALL" || (!event.isDraft && event.role === roleFilter);
    const eventStatus = getEventStatus(event);
    
    if (filter === "all") return matchText && (event.isDraft || matchRole);
    return matchText && eventStatus === filter && (event.isDraft || matchRole);
  });

  // นับจำนวนในแต่ละ category
  const counts = {
    all: allEvents.length,
    draft: allEvents.filter(e => getEventStatus(e) === "draft").length,
    upcomingRecruit: allEvents.filter(e => getEventStatus(e) === "upcomingRecruit").length,
    accepting: allEvents.filter(e => getEventStatus(e) === "accepting").length,
    viewSoon: allEvents.filter(e => getEventStatus(e) === "viewSoon").length,
    viewOpen: allEvents.filter(e => getEventStatus(e) === "viewOpen").length,
    finished: allEvents.filter(e => getEventStatus(e) === "finished").length,
  };

  return (
    <div className="min-h-screen from-background via-background to-muted/20 flex justify-center">
      <Card className=" max-w-6xl shadow-xl border-border/50">
        <CardHeader className="pb-4 border-b">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {t.homePage.title}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {t.homePage.subtitle}
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow">
                  <CalendarPlus className="mr-2 h-5 w-5" />
                  {t.homePage.createEvent}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t.homePage.createDialog.title}</DialogTitle>
                  <DialogDescription>
                    {t.homePage.createDialog.description}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-3">
                    <Label htmlFor="event-name">{t.homePage.createDialog.eventNameLabel}</Label>
                    <Input
                      id="event-name"
                      placeholder={t.homePage.createDialog.eventNamePlaceholder}
                      value={newEventName}
                      onChange={(e) => setNewEventName(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">{t.homePage.createDialog.cancel}</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button
                      type="button"
                      onClick={async () => {
                        const name = newEventName.trim();
                        if (!name) return;
                        await handleCreateEvent(name);
                        setNewEventName("");
                      }}
                      disabled={!newEventName.trim()}
                    >
                      {t.homePage.createDialog.submit}
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Search and Filters */}
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    placeholder={t.homePage.searchPlaceholder}
                    className="w-full pl-10 h-11 bg-background/60 backdrop-blur-sm border-border/60"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap gap-2">
                  {(["all", "draft", "upcomingRecruit", "accepting", "viewSoon", "viewOpen", "finished"] as FilterType[]).map((f) => (
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
                        {counts[f]}
                      </span>
                    </Button>
                  ))}
                </div>

                {/* Role Filter */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{t.homePage.roleFilter.label}</span>
                  <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}>
                    <SelectTrigger className="w-40 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">{t.homePage.roleFilter.all}</SelectItem>
                      <SelectItem value="ORGANIZER">{t.homePage.roleFilter.organizer}</SelectItem>
                      <SelectItem value="PRESENTER">{t.homePage.roleFilter.presenter}</SelectItem>
                      <SelectItem value="COMMITTEE">{t.homePage.roleFilter.committee}</SelectItem>
                      <SelectItem value="GUEST">{t.homePage.roleFilter.guest}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Events List */}
              <div>
                {loading && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="flex flex-col space-y-3">
                        <Skeleton className="h-50 w-full rounded-xl" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-62.5" />
                          <Skeleton className="h-4 w-50" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {!loading && filteredEvents.length === 0 && (
                  <div className="text-center py-12">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">{t.homePage.noEvents.title}</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      {t.homePage.noEvents.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEvents.map((event) => {
                    const hasBanner = Boolean(event.imageCover);
                    const eventStatus = getEventStatus(event);
                    const badge = getStatusBadge(eventStatus);
                    const roleColor = !event.isDraft ? getRoleColorVar(event.role ?? undefined) : undefined;
                    
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
                        
                        {/* Event Image */}
                        <div className="relative aspect-video w-full overflow-hidden bg-muted">
                          <Link href={`/event/${event.id}`} className="block w-full h-full">
                            {hasBanner ? (
                              <Image
                                src={event.imageCover as string}
                                alt={event.eventName}
                                fill
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Image
                                  src="/banner.png"
                                  alt={event.eventName}
                                  fill
                                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                            )}
                          </Link>
                          
                          <span
                            className={`absolute top-3 left-3 px-2.5 py-1 text-xs font-semibold rounded-full shadow-lg ${badge.color} text-white z-10`}
                          >
                            {badge.label}
                          </span>
                          
                          {(event.isDraft || (event.role === "ORGANIZER" && event.isLeader)) && (
                            <div className="absolute top-2 right-2 z-20">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/50 backdrop-blur-sm hover:bg-background/80 rounded-full text-foreground">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      openDeleteConfirm({ id: event.id, eventName: event.eventName })
                                    }
                                    className="text-red-600 cursor-pointer"
                                  >
                                    {t.homePage.deleteEvent}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col flex-1 p-4 gap-3">
                          {/* Event Info */}
                          <div className="space-y-2">
                            <Link href={`/event/${event.id}`} className="block">
                              <h4 className="font-semibold text-lg line-clamp-1 hover:text-primary transition-colors">
                                {event.eventName}
                              </h4>
                            </Link>
                            
                            {!event.isDraft && (
                              <div 
                                className={`flex items-center gap-2 text-xs ${!roleColor ? "text-muted-foreground" : ""}`}
                                style={roleColor ? { color: roleColor } : {}}
                              >
                                <Users className="h-3.5 w-3.5" />
                                <span className="font-medium">{event.role}</span>
                                {event.isLeader && (
                                  <span 
                                    className="px-2 py-0.5 rounded-full font-medium border text-[10px]"
                                    style={roleColor ? { borderColor: roleColor, color: roleColor } : { backgroundColor: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))", border: "none" }}
                                  >
                                    Leader
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {event.isDraft ? (
                              <p className="text-xs text-muted-foreground">
                                {t.homePage.created} {formatDateTime(new Date(event.createdAt), timeFormat)}
                              </p>
                            ) : (
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
                                            <span>{t.eventsPage.period.join}</span>
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
                                            <span>{t.eventsPage.period.event}</span>
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
                            )}
                          </div>

                          {/* Actions */}
                          <div className="mt-auto pt-2 flex gap-2">
                            {!event.isDraft && eventStatus === "finished" && event.role !== "ORGANIZER" && (
                              <Link href={`/event/${event.id}/FeedbackEvent`} className="flex-1">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className={`w-full ${
                                    event.userRating 
                                      ? "border-yellow-500/50 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-950/30" 
                                      : "border-primary/20 hover:border-primary/50 text-primary hover:bg-primary/5"
                                  }`}
                                >
                                  <Star className={`mr-1 h-3 w-3 ${event.userRating ? "fill-yellow-500 text-yellow-500" : "text-primary"}`} />
                                  {event.userRating ? t.homePage.rateButton.rated : t.homePage.rateButton.rate}
                                </Button>
                              </Link>
                            )}
                            <Link href={`/event/${event.id}`} className="flex-1">
                              <Button size="sm" variant={event.isDraft ? "default" : "outline"} className="w-full">
                                {event.isDraft ? t.homePage.actionButton.edit : t.homePage.actionButton.open}
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <Card className="bg-linear-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardHeader className="pb-3">
                  <h3 className="font-semibold text-base">{t.homePage.stats.title}</h3>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/60">
                    <span className="text-sm text-muted-foreground">{t.homePage.stats.totalEvents}</span>
                    <span className="text-2xl font-bold text-primary">{allEvents.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/60">
                    <span className="text-sm text-muted-foreground">{t.homePage.stats.drafts}</span>
                    <span className="text-2xl font-bold">{counts.draft}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/60">
                    <span className="text-sm text-muted-foreground">{t.homePage.stats.live}</span>
                    <span className="text-2xl font-bold text-green-600">{counts.viewOpen}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/60">
                    <span className="text-sm text-muted-foreground">{t.homePage.stats.recruiting}</span>
                    <span className="text-2xl font-bold text-blue-600">{counts.accepting}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <h3 className="font-semibold text-base">{t.homePage.links.title}</h3>
                </CardHeader>
                <CardContent className="space-y-1">
                  <Link href="/profile">
                    <Button variant="ghost" className="w-full justify-between h-10 hover:bg-primary/5">
                      {t.homePage.links.viewProfile} <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/settings">
                    <Button variant="ghost" className="w-full justify-between h-10 hover:bg-primary/5">
                      {t.homePage.links.settings} <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.homePage.deleteDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.homePage.deleteDialog.description.replace("{eventName}", deleteTarget?.eventName || "")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.homePage.deleteDialog.cancel}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteEvent} 
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? t.homePage.deleteDialog.deleting : t.homePage.deleteDialog.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}