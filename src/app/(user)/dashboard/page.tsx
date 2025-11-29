"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, CalendarPlus, FileEdit, MoreHorizontal, ChevronRight } from "lucide-react";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { createEvent, getMyDraftEvents } from "@/utils/apievent";

type DraftEvent = {
  id: string;
  eventName: string;
  createdAt: string;
  status?: "DRAFT" | "PUBLISHED";
};

export default function DashboardPage() {
  const [drafts, setDrafts] = useState<DraftEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEventName, setNewEventName] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "DRAFT" | "LIVE" | "COMPLETED">("ALL");

  useEffect(() => {
    const fetchDrafts = async () => {
      try {
        const res = await getMyDraftEvents();
        setDrafts(res.events || []);
      } catch (err) {
        console.error("Failed to load drafts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDrafts();
  }, []);

  const handleCreateEvent = async (eventName: string) => {
    try {
      await createEvent(eventName);
      // Refresh drafts after creation
      const res = await getMyDraftEvents();
      setDrafts(res.events || []);
    } catch (err) {
      console.error("Failed to create event:", err);
    }
  };

  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-2xl font-bold">Dashboard</CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Welcome back!</h2>
                  <p className="text-muted-foreground">Here’s a look at what’s happening with your events.</p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="hidden sm:inline-flex">
                      Create New Event
                      <CalendarPlus className="ml-2 h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Event</DialogTitle>
                      <DialogDescription>
                        Enter an event name. The event will be created as a draft and you can finish setup later.
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

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Input
                    placeholder="Search by event name..."
                    className="w-full pl-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex gap-2">
                  <Button variant={filter === "ALL" ? "default" : "secondary"} onClick={() => setFilter("ALL")}>All Events</Button>
                  <Button variant={filter === "DRAFT" ? "default" : "secondary"} onClick={() => setFilter("DRAFT")}>Draft</Button>
                  <Button variant={filter === "LIVE" ? "default" : "secondary"} onClick={() => setFilter("LIVE")}>Live</Button>
                  <Button variant={filter === "COMPLETED" ? "default" : "secondary"} onClick={() => setFilter("COMPLETED")}>Completed</Button>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">My Events</h3>
                {loading && <p>Loading...</p>}
                {!loading && drafts.filter((d) => (filter === "ALL" || (filter === "DRAFT" ? (d.status ? d.status === "DRAFT" : true) : false)) && d.eventName.toLowerCase().includes(search.toLowerCase())).length === 0 && (
                  <p className="text-gray-500">No events found.</p>
                )}
                <div className="space-y-3">
                  {drafts
                    .filter((d) => (filter === "ALL" || (filter === "DRAFT" ? (d.status ? d.status === "DRAFT" : true) : false)) && d.eventName.toLowerCase().includes(search.toLowerCase()))
                    .map((event) => (
                      <Card key={event.id} className="overflow-hidden">
                        <div className="grid grid-cols-[96px_1fr_auto] gap-4 items-center p-4">
                          <div className="relative">
                            <div className="rounded-md bg-gradient-to-br from-brand-tertiary/30 to-brand-primary/30 h-20 w-24" />
                            <span className={`absolute top-2 left-2 px-2 py-1 text-xs font-medium rounded-2xl ${event.status === "PUBLISHED" ? "bg-green-500 text-white" : "bg-amber-500 text-white"}`}>
                              {event.status === "PUBLISHED" ? "Live" : "Draft"}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-semibold">{event.eventName}</h4>
                            <p className="text-sm text-muted-foreground">{new Date(event.createdAt).toLocaleString()}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Link href={`/event/${event.id}`}>
                              <Button>{event.status === "PUBLISHED" ? "View" : "Continue"}</Button>
                            </Link>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/event/${event.id}`}>Open</Link>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader className="text-lg font-semibold">Dashboard at a Glance</CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Drafts</span>
                      <span className="text-2xl font-bold">{drafts.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Upcoming Events</span>
                      <span className="text-2xl font-bold">0</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="text-lg font-semibold">Quick Links</CardHeader>
                <CardContent className="space-y-2">
                  <Link href="/profile">
                    <Button variant="ghost" className="w-full justify-between">View Profile <ChevronRight className="h-4 w-4" /></Button>
                  </Link>
                  <Link href="/settings">
                    <Button variant="ghost" className="w-full justify-between">Account Settings <ChevronRight className="h-4 w-4" /></Button>
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
