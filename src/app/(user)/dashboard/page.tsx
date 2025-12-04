"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Search,
  CalendarPlus,
  MoreHorizontal,
  ChevronRight,
} from "lucide-react";
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
import { createEvent, getMyDraftEvents, getMyEvents } from "@/utils/apievent";
import { DraftEvent, MyEvent } from "@/utils/types";
import { toast } from "sonner";
import { AxiosError } from "axios";

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
  const [filter, setFilter] = useState<"ALL" | "DRAFT" | "LIVE" | "COMPLETED">(
    "ALL"
  );

  useEffect(() => {
    const load = async () => {
      try {
        const [dRes, eRes] = await Promise.all([
          getMyDraftEvents(),
          getMyEvents(),
        ]);
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
        const backendMessage = (err as AxiosError<{ message: string }>)
          ?.response?.data?.message as string | undefined;
        if (backendMessage) {
          message = backendMessage;
        } else if (err instanceof Error && err.message) {
          message = err.message;
        }
      }
      toast.error(mapEventNameMessage(message));
    }
  };

  return (
    <div className="min-h-screen from-background to-muted/40 flex justify-center px-4 py-8">
      <Card className="w-full max-w-5xl shadow-lg border-border/60">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Overview
              </p>
              <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  Create New Event
                  <CalendarPlus className="ml-2 h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Event</DialogTitle>
                  <DialogDescription>
                    Enter an event name. The event will be created as a draft
                    and you can finish setup later.
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
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                <div className="relative flex-1">
                  <Input
                    placeholder="Search by event name..."
                    className="w-full pl-10 bg-background/60 backdrop-blur-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant={filter === "ALL" ? "default" : "outline"}
                    onClick={() => setFilter("ALL")}
                  >
                    All
                  </Button>
                  <Button
                    size="sm"
                    variant={filter === "DRAFT" ? "default" : "outline"}
                    onClick={() => setFilter("DRAFT")}
                  >
                    Draft
                  </Button>
                  <Button
                    size="sm"
                    variant={filter === "LIVE" ? "default" : "outline"}
                    onClick={() => setFilter("LIVE")}
                  >
                    Live
                  </Button>
                  <Button
                    size="sm"
                    variant={filter === "COMPLETED" ? "default" : "outline"}
                    onClick={() => setFilter("COMPLETED")}
                  >
                    Completed
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">My Drafts</h3>
                {loading && <p>Loading...</p>}
                {!loading &&
                  drafts.filter(
                    (d) =>
                      (filter === "ALL" || filter === "DRAFT") &&
                      d.eventName.toLowerCase().includes(search.toLowerCase())
                  ).length === 0 && (
                    <p className="text-gray-500">No drafts found.</p>
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
                      const initials = getInitials(event.eventName);
                      return (
                        <Card
                          key={event.id}
                          className="overflow-hidden hover:shadow-md transition-shadow"
                        >
                          <div className="grid grid-cols-[144px_1fr_auto] gap-4 items-center p-4">
                            <div className="relative h-24 w-36 rounded-md overflow-hidden bg-muted">
                              {hasBanner ? (
                                <img
                                  src={event.imageCover as string}
                                  alt={event.eventName}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-brand-tertiary/40 to-brand-primary/40 text-lg font-semibold text-primary-foreground">
                                  <img
                                    src="/banner.png"
                                    alt={event.eventName}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              )}
                              <span
                                className={`absolute top-2 left-2 px-2 py-1 text-[10px] font-medium rounded-2xl shadow-sm ${
                                  event.status === "PUBLISHED"
                                    ? "bg-emerald-500 text-white"
                                    : "bg-amber-500 text-white"
                                }`}
                              >
                                {event.status === "PUBLISHED"
                                  ? "Live"
                                  : "Draft"}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <h4 className="font-semibold line-clamp-1">
                                {event.eventName}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                Created at{" "}
                                {new Date(event.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Link href={`/event/${event.id}`}>
                                <Button size="sm">
                                  {event.status === "PUBLISHED"
                                    ? "View"
                                    : "Continue"}
                                </Button>
                              </Link>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/event/${event.id}`}>
                                      Open
                                    </Link>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                </div>

                <div className="mt-8">
                  <h3 className="font-semibold mb-3">
                    My Participating Events
                  </h3>
                  {myEvents.filter((e) => {
                    const matchText = e.eventName
                      .toLowerCase()
                      .includes(search.toLowerCase());
                    if (filter === "ALL") return matchText;
                    if (filter === "LIVE")
                      return matchText && e.status === "PUBLISHED";
                    return filter !== "DRAFT" && matchText;
                  }).length === 0 && (
                    <p className="text-gray-500">No events found.</p>
                  )}
                  <div className="space-y-3">
                    {myEvents
                      .filter((e) => {
                        const matchText = e.eventName
                          .toLowerCase()
                          .includes(search.toLowerCase());
                        if (filter === "ALL") return matchText;
                        if (filter === "LIVE")
                          return matchText && e.status === "PUBLISHED";
                        return filter !== "DRAFT" && matchText;
                      })
                      .map((event) => {
                        const hasBanner = Boolean(event.imageCover);
                        const initials = getInitials(event.eventName);
                        return (
                          <Card
                            key={event.id}
                            className="overflow-hidden hover:shadow-md transition-shadow"
                          >
                            <div className="grid grid-cols-[144px_1fr_auto] gap-4 items-center p-4">
                              <div className="relative h-24 w-36 rounded-md overflow-hidden bg-muted">
                                {hasBanner ? (
                                  <img
                                    src={event.imageCover as string}
                                    alt={event.eventName}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-brand-tertiary/40 to-brand-primary/40 text-lg font-semibold text-primary-foreground">
                                    <img
                                      src="/banner.png"
                                      alt={event.eventName}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                )}
                                <span className="absolute top-2 left-2 px-2 py-1 text-[10px] font-medium rounded-2xl bg-emerald-500 text-white shadow-sm">
                                  Live
                                </span>
                              </div>
                              <div className="space-y-1">
                                <h4 className="font-semibold line-clamp-1">
                                  {event.eventName}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  {event.role}
                                  {event.isLeader ? " • Leader" : ""}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Joined at{" "}
                                  {new Date(event.createdAt).toLocaleString()}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Link href={`/event/${event.id}`}>
                                  <Button size="sm">View</Button>
                                </Link>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                      <Link href={`/event/${event.id}`}>
                                        Open
                                      </Link>
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
              </div>
            </div>

            <div className="space-y-4">
              <Card className="bg-muted/40 border-dashed">
                <CardHeader className="text-lg font-semibold">
                  Dashboard at a Glance
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Total Drafts
                      </span>
                      <span className="text-2xl font-bold">
                        {drafts.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Live Events
                      </span>
                      <span className="text-2xl font-bold">
                        {
                          myEvents.filter((e) => e.status === "PUBLISHED")
                            .length
                        }
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="text-lg font-semibold">
                  Quick Links
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href="/profile">
                    <Button variant="ghost" className="w-full justify-between">
                      View Profile <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/settings">
                    <Button variant="ghost" className="w-full justify-between">
                      Account Settings <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
