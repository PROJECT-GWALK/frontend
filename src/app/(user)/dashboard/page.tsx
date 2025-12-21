"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, CalendarPlus, MoreHorizontal, ChevronRight, Calendar, Users, Eye } from "lucide-react";
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

const mapEventNameMessage = (message: string) =>
  message === "Event name already exists" ? "ไม่สามารถใช้ชื่อนี้ได้" : message;

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

const getStatusBadge = (status: Exclude<FilterType, "all">) => {
  const badges = {
    draft: { label: "Draft", color: "bg-gray-500" },
    upcomingRecruit: { label: "Soon", color: "bg-blue-500" },
    accepting: { label: "Recruiting", color: "bg-green-500" },
    viewSoon: { label: "Starting Soon", color: "bg-yellow-500" },
    viewOpen: { label: "Live", color: "bg-emerald-500" },
    finished: { label: "Ended", color: "bg-red-500" },
  };
  return badges[status];
};

const getFilterLabel = (filter: FilterType) => {
  const labels = {
    all: "All Events",
    draft: "Drafts",
    upcomingRecruit: "Upcoming",
    accepting: "Recruiting",
    viewSoon: "Starting Soon",
    viewOpen: "Live Now",
    finished: "Ended",
  };
  return labels[filter];
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
  const { timeFormat } = useLanguage();
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
      toast.success("Event created successfully!");
    } catch (err) {
      let message = "Failed to create event";
      if (typeof err === "object" && err) {
        const backendMessage = (err as any)?.response?.data?.message;
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
      toast.success("Deleted successfully");
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (err) {
      let message = "Failed to delete event";
      if (typeof err === "object" && err) {
        const backendMessage = (err as any)?.response?.data?.message;
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
    ...drafts.map(d => ({ ...d, isDraft: true })),
    ...myEvents.map(e => ({ ...e, isDraft: false }))
  ];

  // กรองตาม filter และ search
  const filteredEvents = allEvents.filter((event) => {
    const matchText = event.eventName.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "ALL" || event.role === roleFilter;
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
    <div className="min-h-screen from-background via-background to-muted/20 flex justify-center px-4 py-8">
      <Card className="w-full max-w-6xl shadow-xl border-border/50">
        <CardHeader className="pb-4 border-b">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Event Dashboard
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Create, manage, and join events with ease
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow">
                  <CalendarPlus className="mr-2 h-5 w-5" />
                  Create New Event
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Event</DialogTitle>
                  <DialogDescription>
                    Enter an event name to get started. You can complete the setup later.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-3">
                    <Label htmlFor="event-name">Event Name</Label>
                    <Input
                      id="event-name"
                      placeholder="e.g., Annual Tech Conference 2024"
                      value={newEventName}
                      onChange={(e) => setNewEventName(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
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
                      Create Event
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
                    placeholder="Search events by name..."
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
                  <span className="text-sm text-muted-foreground">Filter by role:</span>
                  <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}>
                    <SelectTrigger className="w-40 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Roles</SelectItem>
                      <SelectItem value="ORGANIZER">Organizer</SelectItem>
                      <SelectItem value="PRESENTER">Presenter</SelectItem>
                      <SelectItem value="COMMITTEE">Committee</SelectItem>
                      <SelectItem value="GUEST">Guest</SelectItem>
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
                        <Skeleton className="h-[200px] w-full rounded-xl" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[250px]" />
                          <Skeleton className="h-4 w-[200px]" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {!loading && filteredEvents.length === 0 && (
                  <div className="text-center py-12">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No events found</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      Try adjusting your filters or create a new event
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  {filteredEvents.map((event) => {
                    const hasBanner = Boolean(event.imageCover);
                    const eventStatus = getEventStatus(event);
                    const badge = getStatusBadge(eventStatus);
                    const roleColor = getRoleColorVar(event.role ?? undefined);
                    
                    return (
                      <Card
                        key={event.id}
                        className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-border/60 hover:border-primary/30"
                      >
                        {roleColor && (
                          <>
                            <div 
                              className="absolute top-0 left-0 right-0 h-1.5 z-10" 
                              style={{ backgroundColor: roleColor }} 
                            />
                            <div 
                              className="absolute inset-0 pointer-events-none z-0"
                              style={{ 
                                background: `linear-gradient(to bottom, ${roleColor}, transparent 40%)`,
                                opacity: 0.15
                              }} 
                            />
                          </>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr_auto] gap-4 items-start sm:items-center p-4 relative z-10">
                          {/* Event Image */}
                          <Link 
                            href={`/event/${event.id}`} 
                            className="relative h-40 w-full sm:h-28 sm:w-40 rounded-lg overflow-hidden bg-muted block group"
                          >
                            {hasBanner ? (
                              <img
                                src={event.imageCover as string}
                                alt={event.eventName}
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <img
                                  src="/banner.png"
                                  alt={event.eventName}
                                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                            )}
                            <span
                              className={`absolute top-2 left-2 px-2.5 py-1 text-xs font-semibold rounded-full shadow-lg ${badge.color} text-white`}
                            >
                              {badge.label}
                            </span>
                          </Link>

                          {/* Event Info */}
                          <Link href={`/event/${event.id}`} className="space-y-2 block min-w-0">
                            <h4 className="font-semibold text-base line-clamp-1 hover:text-primary transition-colors">
                              {event.eventName}
                            </h4>
                            
                            {!event.isDraft && (
                              <div 
                                className={`flex items-center gap-2 text-xs ${!roleColor ? "text-muted-foreground" : ""}`}
                                style={roleColor ? { color: roleColor } : {}}
                              >
                                <Users className="h-3.5 w-3.5" />
                                <span className="font-medium">{event.role}</span>
                                {event.isLeader && (
                                  <span 
                                    className="px-2 py-0.5 rounded-full font-medium border"
                                    style={roleColor ? { borderColor: roleColor, color: roleColor } : { backgroundColor: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))", border: "none" }}
                                  >
                                    Leader
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {event.isDraft ? (
                              <p className="text-xs text-muted-foreground">
                                Created {formatDateTime(new Date(event.createdAt), timeFormat)}
                              </p>
                            ) : (
                              <div className="space-y-1.5 mt-1">
                                {(() => {
                                  const now = new Date();
                                  const subStart = event.startJoinDate ? new Date(event.startJoinDate) : null;
                                  const subEnd = event.endJoinDate ? new Date(event.endJoinDate) : null;
                                  const eventStart = event.startView ? new Date(event.startView) : null;
                                  const eventEnd = event.endView ? new Date(event.endView) : null;
                                  
                                  const isOrgOrPres = event.role === "ORGANIZER" || event.role === "PRESENTER";
                                  const inSubmission = subStart && subEnd && now >= subStart && now <= subEnd;
                                  
                                  return (
                                    <>
                                      {isOrgOrPres && inSubmission && subStart && subEnd && (
                                        <div className="flex items-center gap-2 text-xs font-medium text-amber-600 dark:text-amber-500">
                                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                                          <span>Submission: {formatDateTime(subStart, timeFormat)} - {formatDateTime(subEnd, timeFormat)}</span>
                                        </div>
                                      )}
                                      
                                      {eventStart && eventEnd && (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                          <Eye className="h-3.5 w-3.5 shrink-0" />
                                          <span>Event: {formatDateTime(eventStart, timeFormat)} - {formatDateTime(eventEnd, timeFormat)}</span>
                                        </div>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            )}
                          </Link>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <Link href={`/event/${event.id}`}>
                              <Button size="sm" variant={event.isDraft ? "default" : "outline"}>
                                {event.isDraft ? "Edit" : "Open"}
                              </Button>
                            </Link>
                            {(event.isDraft || (event.role === "ORGANIZER" && event.isLeader)) && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      openDeleteConfirm({ id: event.id, eventName: event.eventName })
                                    }
                                    className="text-red-600"
                                  >
                                    Delete Event
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
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
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardHeader className="pb-3">
                  <h3 className="font-semibold text-base">Quick Stats</h3>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/60">
                    <span className="text-sm text-muted-foreground">Total Events</span>
                    <span className="text-2xl font-bold text-primary">{allEvents.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/60">
                    <span className="text-sm text-muted-foreground">Drafts</span>
                    <span className="text-2xl font-bold">{counts.draft}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/60">
                    <span className="text-sm text-muted-foreground">Live</span>
                    <span className="text-2xl font-bold text-green-600">{counts.viewOpen}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/60">
                    <span className="text-sm text-muted-foreground">Recruiting</span>
                    <span className="text-2xl font-bold text-blue-600">{counts.accepting}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <h3 className="font-semibold text-base">Quick Links</h3>
                </CardHeader>
                <CardContent className="space-y-1">
                  <Link href="/profile">
                    <Button variant="ghost" className="w-full justify-between h-10 hover:bg-primary/5">
                      View Profile <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/settings">
                    <Button variant="ghost" className="w-full justify-between h-10 hover:bg-primary/5">
                      Settings <ChevronRight className="h-4 w-4" />
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
            <AlertDialogTitle>Delete Event?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-semibold text-foreground">{deleteTarget?.eventName}</span>. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteEvent} 
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}