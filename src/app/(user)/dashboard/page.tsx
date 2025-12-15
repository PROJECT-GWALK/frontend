"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, CalendarPlus, MoreHorizontal, ChevronRight, Trash2 } from "lucide-react";
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
import { AxiosError } from "axios";
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
import { Skeleton } from "@/components/ui/skeleton";

const mapEventNameMessage = (message: string) =>
  message === "Event name already exists" ? "ไม่สามารถใช้ชื่อนี้ได้" : message;

const getInitials = (name: string) => {
  const parts = name.trim().split(" ");
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (parts[0]!.charAt(0) + parts[1]!.charAt(0)).toUpperCase();
};

export default function DashboardPage() {
  const [drafts, setDrafts] = useState<DraftEvent[]>([]);
  const [myEvents, setMyEvents] = useState<MyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEventName, setNewEventName] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "DRAFT" | "UPCOMING" | "LIVE" | "COMPLETED">("ALL");
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

      // ถ้าชื่ออีเวนต์ซ้ำ ให้ toast แจ้งเตือนทันที (สำหรับเคสที่ backend ส่ง 200 แต่มี message)
      if (resCreate?.message === "Event name already exists") {
        toast.error(mapEventNameMessage(resCreate.message));
        return;
      }

      const resDrafts = await getMyDraftEvents();
      setDrafts(resDrafts.events || []);
    } catch (err) {
      let message = "Failed to create event";
      if (typeof err === "object" && err) {
        const backendMessage = (err as AxiosError<{ message: string }>)?.response?.data?.message as
          | string
          | undefined;
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
        const backendMessage = (err as AxiosError<{ message: string }>)?.response?.data?.message as
          | string
          | undefined;
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

  return (
    <div className="min-h-screen from-background to-muted/40 flex justify-center px-4 py-8">
      <Card className="w-full max-w-6xl shadow-xl border-border/60 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-6 border-b border-border/40">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                จัดการอีเวนต์และกิจกรรมทั้งหมดของคุณ
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground border-0 transition-all duration-300">
                  <CalendarPlus className="mr-2 h-5 w-5" />
                  Create New Event
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Event</DialogTitle>
                  <DialogDescription>
                    Enter an event name. The event will be created as a draft and you can finish
                    setup later.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="grid gap-3">
                    <Label htmlFor="name-1">Event Name</Label>
                    <Input
                      id="name-1"
                      name="name"
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
                      Save changes
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4 items-stretch">
                <div className="relative flex-1 group">
                  <Input
                    placeholder="Search by event name..."
                    className="w-full pl-10 bg-background/50 border-muted-foreground/20 focus:bg-background transition-colors"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex gap-2 justify-end overflow-x-auto pb-2 sm:pb-0">
                  {[
                    { label: "All", value: "ALL" },
                    { label: "Draft", value: "DRAFT" },
                    { label: "Upcoming", value: "UPCOMING" },
                    { label: "Live", value: "LIVE" },
                    { label: "Completed", value: "COMPLETED" },
                  ].map((f) => (
                    <Button
                      key={f.value}
                      size="sm"
                      variant={filter === f.value ? "default" : "outline"}
                      onClick={() => setFilter(f.value as any)}
                      className={`whitespace-nowrap ${
                        filter === f.value
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {f.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* My Drafts Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <span className="w-1 h-6 bg-amber-500 rounded-full"></span>
                    My Drafts
                  </h3>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    {drafts.filter(d => (filter === "ALL" || filter === "DRAFT") && d.eventName.toLowerCase().includes(search.toLowerCase())).length} items
                  </span>
                </div>
                
                {loading && (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, index) => (
                      <Card key={index} className="overflow-hidden border-border/40">
                        <div className="grid grid-cols-[120px_1fr_auto] gap-4 items-center p-3">
                          <Skeleton className="h-20 w-full rounded-md" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                          <Skeleton className="h-8 w-20" />
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
                
                {!loading &&
                  drafts.filter(
                    (d) =>
                      (filter === "ALL" || filter === "DRAFT") &&
                      d.eventName.toLowerCase().includes(search.toLowerCase())
                  ).length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-muted rounded-xl bg-muted/20">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                        <CalendarPlus className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground font-medium">No drafts found</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">Create a new event to get started</p>
                    </div>
                  )}
                  
                <div className="space-y-3">
                  {drafts
                    .filter(
                      (d) =>
                        (filter === "ALL" || filter === "DRAFT") &&
                        d.eventName.toLowerCase().includes(search.toLowerCase())
                    )
                    .map((event) => {
                      const hasBanner = Boolean(event.imageCover);
                      return (
                        <Card
                          key={event.id}
                          className="overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 group bg-card/50 hover:bg-card"
                        >
                          <div className="grid grid-cols-[120px_1fr_auto] sm:grid-cols-[160px_1fr_auto] gap-4 p-3">
                            {/* Image Section */}
                            <div className="relative h-24 rounded-lg overflow-hidden bg-muted group-hover:scale-[1.02] transition-transform duration-500">
                              {hasBanner ? (
                                <img
                                  src={event.imageCover as string}
                                  alt={event.eventName}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-500/10 to-orange-500/10">
                                  <img
                                    src="/banner.png"
                                    alt={event.eventName}
                                    className="h-full w-full object-cover opacity-80 hover:opacity-100 transition-opacity"
                                  />
                                </div>
                              )}
                              <div className="absolute top-2 left-2">
                                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm ${
                                  event.status === "PUBLISHED"
                                    ? "bg-emerald-500/90 text-white backdrop-blur-sm"
                                    : "bg-amber-500/90 text-white backdrop-blur-sm"
                                }`}>
                                  {event.status === "PUBLISHED" ? "Live" : "Draft"}
                                </span>
                              </div>
                            </div>
                            
                            {/* Content Section */}
                            <div className="flex flex-col justify-center min-w-0 py-1">
                              <h4 className="font-bold text-lg truncate group-hover:text-primary transition-colors">
                                {event.eventName}
                              </h4>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <CalendarPlus className="h-3 w-3" />
                                Created {new Date(event.createdAt).toLocaleDateString("th-TH")}
                              </p>
                            </div>
                            
                            {/* Actions Section */}
                            <div className="flex items-center gap-2 self-center pr-2">
                              <Link href={`/event/${event.id}`}>
                                <Button size="sm" className="hidden sm:flex shadow-sm hover:shadow-primary/20 transition-all">
                                  {event.status === "PUBLISHED" ? "View" : "Continue"}
                                </Button>
                              </Link>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/event/${event.id}`} className="cursor-pointer">Open</Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                                    onClick={() =>
                                      openDeleteConfirm({ id: event.id, eventName: event.eventName })
                                    }
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                </div>
              </div>

              {/* My Participating Events Section */}
              <div className="space-y-4 pt-4 border-t border-border/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
                    My Participating Events
                  </h3>
                  <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}>
                    <SelectTrigger className="w-full sm:w-40 bg-background/50 border-muted-foreground/20 h-8 text-xs">
                      <SelectValue placeholder="All Roles" />
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

                {loading && (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, index) => (
                      <Card key={index} className="overflow-hidden border-border/40">
                        <div className="grid grid-cols-[120px_1fr_auto] gap-4 items-center p-3">
                          <Skeleton className="h-20 w-full rounded-md" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {!loading &&
                  myEvents.filter((e) => {
                    const matchText = e.eventName.toLowerCase().includes(search.toLowerCase());
                    const matchRole = roleFilter === "ALL" || e.role === roleFilter;
                    if (filter === "ALL") return matchText && matchRole;
                    if (filter === "LIVE") return matchText && matchRole && e.status === "PUBLISHED";
                    return filter !== "DRAFT" && matchText && matchRole;
                  }).length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-muted rounded-xl bg-muted/20">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                        <Search className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground font-medium">No events found</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">Try adjusting your filters</p>
                    </div>
                  )}

                <div className="space-y-3">
                  {myEvents
                    .filter((e) => {
                      const matchText = e.eventName.toLowerCase().includes(search.toLowerCase());
                      const matchRole = roleFilter === "ALL" || e.role === roleFilter;
                      if (filter === "ALL") return matchText && matchRole;
                      if (filter === "LIVE") return matchText && matchRole && e.status === "PUBLISHED";
                      return filter !== "DRAFT" && matchText && matchRole;
                    })
                    .map((event) => {
                      const hasBanner = Boolean(event.imageCover);
                      return (
                        <Card
                          key={event.id}
                          className="overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 group bg-card/50 hover:bg-card"
                        >
                          <div className="grid grid-cols-[120px_1fr_auto] sm:grid-cols-[160px_1fr_auto] gap-4 p-3">
                            <div className="relative h-24 rounded-lg overflow-hidden bg-muted group-hover:scale-[1.02] transition-transform duration-500">
                              {hasBanner ? (
                                <img
                                  src={event.imageCover as string}
                                  alt={event.eventName}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-500/10 to-teal-500/10">
                                  <img
                                    src="/banner.png"
                                    alt={event.eventName}
                                    className="h-full w-full object-cover opacity-80 hover:opacity-100 transition-opacity"
                                  />
                                </div>
                              )}
                              <div className="absolute top-2 left-2">
                                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-500/90 text-white backdrop-blur-sm shadow-sm">
                                  Live
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex flex-col justify-center min-w-0 py-1">
                              <h4 className="font-bold text-lg truncate group-hover:text-primary transition-colors">
                                {event.eventName}
                              </h4>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${
                                  event.role === 'ORGANIZER' 
                                    ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800'
                                    : event.role === 'PRESENTER'
                                    ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800'
                                    : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
                                }`}>
                                  {event.role}
                                </span>
                                {event.isLeader && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800 flex items-center gap-1">
                                    Leader
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                <CalendarPlus className="h-3 w-3" />
                                Joined {new Date(event.createdAt).toLocaleDateString("th-TH")}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-2 self-center pr-2">
                              <Link href={`/event/${event.id}`}>
                                <Button size="sm" className="hidden sm:flex shadow-sm hover:shadow-primary/20 transition-all">View</Button>
                              </Link>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/event/${event.id}`} className="cursor-pointer">Open</Link>
                                  </DropdownMenuItem>
                                  {event.role === "ORGANIZER" && event.isLeader && (
                                    <DropdownMenuItem
                                      className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                                      onClick={() =>
                                        openDeleteConfirm({
                                          id: event.id,
                                          eventName: event.eventName,
                                        })
                                      }
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <Card className="bg-muted/30 border-dashed border-2 shadow-none">
                <CardHeader className="text-lg font-semibold pb-2">Overview</CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border/50 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                          <CalendarPlus className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium">Total Drafts</span>
                      </div>
                      <span className="text-xl font-bold">{drafts.length}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border/50 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                          <Search className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium">Live Events</span>
                      </div>
                      <span className="text-xl font-bold">
                        {myEvents.filter((e) => e.status === "PUBLISHED").length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="overflow-hidden border-border/50 shadow-sm">
                <CardHeader className="text-lg font-semibold pb-2 bg-muted/20">Quick Links</CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/40">
                    <Link href="/profile" className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group">
                      <span className="text-sm font-medium group-hover:text-primary transition-colors">View Profile</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link href="/settings" className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group">
                      <span className="text-sm font-medium group-hover:text-primary transition-colors">Account Settings</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-semibold text-foreground">{deleteTarget?.eventName}</span>.
              <br/>This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteEvent} 
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? "Deleting..." : "Delete Event"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
