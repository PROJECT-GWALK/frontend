"use client";

import { useEffect, useMemo, useState } from "react";
import {
  deleteAdminEvent,
  deleteAdminParticipant,
  deleteAdminTeam,
  getAdminEvent,
  getAdminEvents,
  updateAdminEvent,
  updateAdminParticipant,
  updateAdminTeam,
  type AdminEventStatus,
} from "@/utils/apiadmin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { RefreshCw, Trash2, Pencil, Search, Crown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type AdminEventListItem = {
  id: string;
  eventName: string;
  status: AdminEventStatus;
  createdAt: string;
  updatedAt: string;
  startJoinDate: string | null;
  endJoinDate: string | null;
  publicView: boolean;
  publicJoin: boolean;
  isHidden: boolean;
  participantsCount: number;
  teamsCount: number;
};

type AdminParticipant = {
  id: string;
  userId: string;
  eventGroup: "ORGANIZER" | "PRESENTER" | "COMMITTEE" | "GUEST" | null;
  teamId: string | null;
  isLeader: boolean;
  virtualReward: number;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    email: string | null;
    image: string | null;
    role: string;
  };
  team: { id: string; teamName: string } | null;
};

type AdminTeam = {
  id: string;
  teamName: string;
  description: string | null;
  videoLink: string | null;
  imageCover: string | null;
  createdAt: string;
  participants: Array<{
    id: string;
    userId: string;
    isLeader: boolean;
    user: {
      id: string;
      name: string | null;
      username: string | null;
      email: string | null;
      image: string | null;
    };
  }>;
};

type AdminEventDetail = {
  id: string;
  eventName: string;
  status: AdminEventStatus;
  publicView: boolean;
  publicJoin: boolean;
  isHidden: boolean;
  participants: AdminParticipant[];
  teams: AdminTeam[];
};

type StatusFilter = "ALL" | AdminEventStatus;
type ParticipantGroup = Exclude<AdminParticipant["eventGroup"], null>;
type AdminParticipantUpdatePayload = Parameters<typeof updateAdminParticipant>[2];

export default function AdminEventManagementPage() {
  const [events, setEvents] = useState<AdminEventListItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingEvent, setLoadingEvent] = useState(false);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const limit = 20;
  const [totalPages, setTotalPages] = useState(1);

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<AdminEventDetail | null>(null);
  const [eventSheetOpen, setEventSheetOpen] = useState(false);

  const [eventNameDraft, setEventNameDraft] = useState("");
  const [eventPublicViewDraft, setEventPublicViewDraft] = useState(false);
  
  const eventDirty = useMemo(() => {
    if (!selectedEvent) return false;
    return (
      eventNameDraft !== selectedEvent.eventName ||
      eventPublicViewDraft !== selectedEvent.publicView
    );
  }, [
    selectedEvent,
    eventNameDraft,
    eventPublicViewDraft,
  ]);

  const [participantEdits, setParticipantEdits] = useState<
    Record<string, { eventGroup?: ParticipantGroup; teamId?: string | null }>
  >({});

  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<AdminTeam | null>(null);
  const [teamNameDraft, setTeamNameDraft] = useState("");
  const [teamDescriptionDraft, setTeamDescriptionDraft] = useState("");
  const { t } = useLanguage();

  const fetchEvents = async (opts?: { page?: number }) => {
    setLoadingEvents(true);
    try {
      const nextPage = opts?.page ?? page;
      const res = await getAdminEvents({
        q: q.trim() || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        page: nextPage,
        limit,
      });
      setEvents(res.events || []);
      setTotalPages(res?.meta?.totalPages || 1);
      if (nextPage !== page) setPage(nextPage);
    } catch (err) {
      console.error("Failed to fetch admin events:", err);
      setEvents([]);
      setTotalPages(1);
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchEventDetail = async (eventId: string) => {
    setLoadingEvent(true);
    try {
      const res = await getAdminEvent(eventId);
      const ev = res.event as AdminEventDetail;
      setSelectedEventId(eventId);
      setSelectedEvent(ev);
      setEventNameDraft(ev.eventName);
      setEventPublicViewDraft(ev.publicView);
      setParticipantEdits({});
    } catch (err) {
      console.error("Failed to fetch admin event:", err);
      setSelectedEventId(null);
      setSelectedEvent(null);
      setParticipantEdits({});
    } finally {
      setLoadingEvent(false);
    }
  };

  useEffect(() => {
    (async () => {
      setLoadingEvents(true);
      try {
        const res = await getAdminEvents({ page: 1, limit });
        setEvents(res.events || []);
        setTotalPages(res?.meta?.totalPages || 1);
        setPage(1);
      } catch (err) {
        console.error("Failed to fetch admin events:", err);
        setEvents([]);
        setTotalPages(1);
        setPage(1);
      } finally {
        setLoadingEvents(false);
      }
    })();
  }, []);

  const onSaveEvent = async () => {
    if (!selectedEvent) return;
    try {
      await updateAdminEvent(selectedEvent.id, {
        eventName: eventNameDraft,
        publicView: eventPublicViewDraft,
      });
      await Promise.all([fetchEventDetail(selectedEvent.id), fetchEvents()]);
    } catch (err) {
      console.error("Failed to update event:", err);
    }
  };

  const onDeleteEvent = async () => {
    if (!selectedEventId) return;
    try {
      await deleteAdminEvent(selectedEventId);
      setEventSheetOpen(false);
      setSelectedEventId(null);
      setSelectedEvent(null);
      setParticipantEdits({});
      await fetchEvents({ page: 1 });
    } catch (err) {
      console.error("Failed to delete event:", err);
    }
  };

  const participantEditFor = (pid: string) => participantEdits[pid] || {};

  const onSaveParticipant = async (p: AdminParticipant) => {
    if (!selectedEventId) return;
    const edit = participantEditFor(p.id);
    const payload: AdminParticipantUpdatePayload = {};
    if (edit.eventGroup !== undefined) payload.eventGroup = edit.eventGroup;
    if (edit.teamId !== undefined) payload.teamId = edit.teamId;
    if (Object.keys(payload).length === 0) return;

    try {
      await updateAdminParticipant(selectedEventId, p.id, payload);
      setParticipantEdits((prev) => {
        const next = { ...prev };
        delete next[p.id];
        return next;
      });
      await Promise.all([fetchEventDetail(selectedEventId), fetchEvents()]);
    } catch (err) {
      console.error("Failed to update participant:", err);
    }
  };

  const onRemoveParticipant = async (pid: string) => {
    if (!selectedEventId) return;
    try {
      await deleteAdminParticipant(selectedEventId, pid);
      setParticipantEdits((prev) => {
        const next = { ...prev };
        delete next[pid];
        return next;
      });
      await Promise.all([fetchEventDetail(selectedEventId), fetchEvents()]);
    } catch (err) {
      console.error("Failed to delete participant:", err);
    }
  };

  const onClearParticipantTeam = async (pid: string) => {
    if (!selectedEventId) return;
    try {
      await updateAdminParticipant(selectedEventId, pid, { teamId: null });
      await Promise.all([fetchEventDetail(selectedEventId), fetchEvents()]);
    } catch (err) {
      console.error("Failed to clear participant team:", err);
    }
  };

  const openEditTeam = (t: AdminTeam) => {
    setEditingTeam(t);
    setTeamNameDraft(t.teamName || "");
    setTeamDescriptionDraft(t.description || "");
    setTeamDialogOpen(true);
  };

  const onSaveTeam = async () => {
    if (!selectedEventId || !editingTeam) return;
    try {
      await updateAdminTeam(selectedEventId, editingTeam.id, {
        teamName: teamNameDraft,
        description: teamDescriptionDraft || undefined,
      });
      setTeamDialogOpen(false);
      setEditingTeam(null);
      await Promise.all([fetchEventDetail(selectedEventId), fetchEvents()]);
    } catch (err) {
      console.error("Failed to update team:", err);
    }
  };

  const onDeleteTeam = async (teamId: string) => {
    if (!selectedEventId) return;
    try {
      await deleteAdminTeam(selectedEventId, teamId);
      await Promise.all([fetchEventDetail(selectedEventId), fetchEvents()]);
    } catch (err) {
      console.error("Failed to delete team:", err);
    }
  };

  const formatDateTime = (value: string | null | undefined) => {
    if (!value) return "-";
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return "-";
    return dt.toLocaleString();
  };

  const statusBadgeVariant = (s: AdminEventStatus) => (s === "PUBLISHED" ? "default" : "secondary");

  const isParticipantGroup = (v: string): v is ParticipantGroup =>
    v === "ORGANIZER" || v === "PRESENTER" || v === "COMMITTEE" || v === "GUEST";

  const openEventSheet = async (eventId: string) => {
    setEventSheetOpen(true);
    await fetchEventDetail(eventId);
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t("adminSection.eventManagement")}</h2>
        <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => fetchEvents()}
              disabled={loadingEvents}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t("adminSection.refresh")}
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("adminSection.events")}</CardTitle>
          <CardDescription>{t("adminSection.manageYourEventsHere")}</CardDescription>
          <div className="flex flex-col gap-3 pt-4 md:flex-row md:items-center md:justify-between">
            <div className="flex w-full items-center gap-2">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search events..."
                className="w-full"
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => fetchEvents({ page: 1 })}
                disabled={loadingEvents}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex w-full items-center gap-2 md:w-auto">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="DRAFT">DRAFT</SelectItem>
                  <SelectItem value="PUBLISHED">PUBLISHED</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="secondary"
                onClick={() => fetchEvents({ page: 1 })}
                disabled={loadingEvents}
                className="shrink-0"
              >
                {t("adminSection.apply")}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("adminSection.event")}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t("adminSection.visibility")}</TableHead>
                  <TableHead className="hidden lg:table-cell text-right">{t("adminSection.participants")}</TableHead>
                  <TableHead className="hidden lg:table-cell text-right">{t("adminSection.teams")}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t("adminSection.status")}</TableHead>
                  <TableHead className="text-right">{t("adminSection.action")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingEvents ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      {t("homePage.loadingInline")}
                    </TableCell>
                  </TableRow>
                ) : events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      {t("noEvents.title")}
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map((e) => (
                    <TableRow
                      key={e.id}
                      className="cursor-pointer"
                      onClick={() => openEventSheet(e.id)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-col">
                            <span>{e.eventName}</span>
                            <span className="text-xs text-muted-foreground">{formatDateTime(e.createdAt)}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 lg:hidden">
                            <Badge variant={statusBadgeVariant(e.status)}>{e.status}</Badge>
                            <Badge variant={e.isHidden ? "destructive" : e.publicView ? "default" : "secondary"}>
                              {e.isHidden ? "Hidden by Admin" : e.publicView ? "Public View" : "Hidden"}
                            </Badge>
                            <Badge variant="outline">{e.participantsCount} Participants</Badge>
                            <Badge variant="outline">{e.teamsCount} Teams</Badge>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="hidden lg:table-cell">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={e.isHidden ? "destructive" : e.publicView ? "default" : "secondary"}>
                            {e.isHidden ? "Hidden by Admin" : e.publicView ? "Public View" : "Hidden"}
                          </Badge>
                        </div>
                      </TableCell>

                      <TableCell className="hidden lg:table-cell text-right">
                        {e.participantsCount}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-right">
                        {e.teamsCount}
                      </TableCell>

                      <TableCell className="hidden sm:table-cell">
                        <Badge variant={statusBadgeVariant(e.status)}>{e.status}</Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(evt) => {
                            evt.stopPropagation();
                            openEventSheet(e.id);
                          }}
                        >
                          {t("adminSection.manage")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Page {page} / {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={loadingEvents || page <= 1}
                onClick={() => fetchEvents({ page: page - 1 })}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={loadingEvents || page >= totalPages}
                onClick={() => fetchEvents({ page: page + 1 })}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Sheet open={eventSheetOpen} onOpenChange={setEventSheetOpen}>
        <SheetContent className="sm:max-w-4xl">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between gap-2">
              <span>{selectedEvent?.eventName || "Event Details"}</span>
              {selectedEvent?.status && (
                <Badge variant={statusBadgeVariant(selectedEvent.status)}>{selectedEvent.status}</Badge>
              )}
            </SheetTitle>
            <SheetDescription>
              {t("adminSection.viewAndEdit")}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-6">
            {!selectedEvent ? (
              <div className="flex h-[240px] shrink-0 items-center justify-center rounded-md border border-dashed">
                <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                  <h3 className="mt-4 text-lg font-semibold">
                    {loadingEvent ? "Loading..." : "No event selected"}
                  </h3>
                  <p className="mb-4 mt-2 text-sm text-muted-foreground">
                    {loadingEvent ? "Fetching event details." : "Select an event to view details."}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={loadingEvent}
                    onClick={() => fetchEventDetail(selectedEventId!)}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {t("adminSection.refresh")}
                  </Button>
                  {selectedEvent?.isHidden ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={loadingEvent}
                      onClick={async () => {
                        if (!selectedEvent) return;
                        try {
                          await updateAdminEvent(selectedEvent.id, { isHidden: false });
                          await Promise.all([fetchEventDetail(selectedEvent.id), fetchEvents()]);
                        } catch (err) {
                          console.error("Failed to unhide event:", err);
                        }
                      }}
                    >
                      ยกเลิกซ่อน
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={loadingEvent}
                      onClick={async () => {
                        if (!selectedEvent) return;
                        try {
                          await updateAdminEvent(selectedEvent.id, { isHidden: true });
                          await Promise.all([fetchEventDetail(selectedEvent.id), fetchEvents()]);
                        } catch (err) {
                          console.error("Failed to hide event:", err);
                        }
                      }}
                    >
                    {t("adminSection.hideEvent")}
                    </Button>
                  )}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" disabled={loadingEvent}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t("dialog.delete")}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this event?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove the event and all related data. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("dialog.cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={onDeleteEvent}>
                          {t("dialog.delete")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <div className="rounded-lg border p-4 space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {t("adminSection.eventName")}
                      </label>
                      <Input
                        value={eventNameDraft}
                        onChange={(e) => setEventNameDraft(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {t("adminSection.publicView")}
                      </label>
                      <Select
                        value={eventPublicViewDraft ? "true" : "false"}
                        onValueChange={(v) => setEventPublicViewDraft(v === "true")}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">{t("adminSection.visible")}</SelectItem>
                          <SelectItem value="false">{t("adminSection.hidden")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{selectedEvent.participants?.length || 0} Participants</Badge>
                    <Badge variant="outline">{selectedEvent.teams?.length || 0} Teams</Badge>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={onSaveEvent} disabled={!eventDirty || loadingEvent}>
                      {t("adminSection.saveChanges")}
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{t("adminSection.participants")}</h3>
                    <Badge variant="secondary">{selectedEvent.participants?.length || 0}</Badge>
                  </div>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("participantSection.user")}</TableHead>
                          <TableHead>{t("participantSection.role")}</TableHead>
                          <TableHead>{t("participantSection.team")}</TableHead>
                          <TableHead className="text-right">{t("adminSection.action")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedEvent.participants.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                              {t("adminSection.noParticipants")}
                            </TableCell>
                          </TableRow>
                        ) : (
                          selectedEvent.participants.map((p) => {
                            const edit = participantEditFor(p.id);
                            const effectiveRole: ParticipantGroup = isParticipantGroup(
                              (edit.eventGroup ?? p.eventGroup ?? "GUEST") as string,
                            )
                              ? ((edit.eventGroup ?? p.eventGroup ?? "GUEST") as ParticipantGroup)
                              : "GUEST";
                            return (
                              <TableRow key={p.id}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                      <AvatarImage src={p.user?.image || ""} alt={p.user?.name || ""} />
                                      <AvatarFallback>
                                        {p.user?.name?.[0]?.toUpperCase() || "U"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                      <div className="flex items-center gap-1">
                                        <span className="font-medium">{p.user?.name || "Unknown"}</span>
                                        {p.isLeader && (
                                          <Crown
                                            className="h-3 w-3 text-yellow-500 fill-yellow-500"
                                            aria-label="Team Leader"
                                          />
                                        )}
                                      </div>
                                      <span className="text-xs text-muted-foreground">
                                        @{p.user?.username || "-"}
                                      </span>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={effectiveRole}
                                    onValueChange={(v) =>
                                      setParticipantEdits((prev) => {
                                        if (!isParticipantGroup(v)) return prev;
                                        return {
                                          ...prev,
                                          [p.id]: { ...prev[p.id], eventGroup: v },
                                        };
                                      })
                                    }
                                  >
                                    <SelectTrigger className="w-[130px] h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="ORGANIZER">ORGANIZER</SelectItem>
                                      <SelectItem value="PRESENTER">PRESENTER</SelectItem>
                                      <SelectItem value="COMMITTEE">COMMITTEE</SelectItem>
                                      <SelectItem value="GUEST">GUEST</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <span className="truncate max-w-[140px] text-sm">
                                      {p.team?.teamName || "-"}
                                    </span>
                                    {p.teamId && (
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                            title="Remove from team"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>{t("adminSection.removeFromTeamTitle")}</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              {t("adminSection.removeFromTeamDescription1")} {p.user?.name} {t("adminSection.removeFromTeamDescription2")} {p.team?.teamName}
                                              {p.team?.teamName}?
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>{t("dialog.cancel")}</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => onClearParticipantTeam(p.id)}>
                                              {t("eventInfo.remove")}
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8"
                                      onClick={() => onSaveParticipant(p)}
                                      disabled={Object.keys(participantEditFor(p.id)).length === 0}
                                    >
                                      {t("dialog.save")}
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button size="icon" variant="destructive" className="h-8 w-8">
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>{t("adminSection.removeParticipantTitle")}</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            {t("adminSection.removeParticipantDescription")}
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>{t("dialog.cancel")}</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => onRemoveParticipant(p.id)}>
                                            {t("eventInfo.remove")}
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{t("adminSection.teams")}</h3>
                    <Badge variant="secondary">{selectedEvent.teams?.length || 0}</Badge>
                  </div>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("adminSection.teams")}</TableHead>
                          <TableHead className="text-right">{t("adminSection.member")}</TableHead>
                          <TableHead className="text-right">{t("adminSection.action")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedEvent.teams.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center">
                              {t("adminSection.noTeams")}
                            </TableCell>
                          </TableRow>
                        ) : (
                          selectedEvent.teams.map((o) => (
                            <TableRow key={o.id}>
                              <TableCell className="font-medium">{o.teamName}</TableCell>
                              <TableCell className="text-right">{o.participants?.length || 0}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                    onClick={() => openEditTeam(o)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 hover:text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>{t("adminSection.deleteTeamTitle")}</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          {t("adminSection.deleteTeamDescription")}
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>{t("dialog.cancel")}</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => onDeleteTeam(o.id)}>
                                          {t("dialog.delete")}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("adminSection.editTeamTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">{t("adminSection.teamName")}</label>
              <Input value={teamNameDraft} onChange={(e) => setTeamNameDraft(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">{t("settingSection.label_description")}</label>
              <Input
                value={teamDescriptionDraft}
                onChange={(e) => setTeamDescriptionDraft(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline">{t("dialog.cancel")}</Button>
            </DialogClose>
            <Button onClick={onSaveTeam} disabled={!editingTeam}>
              {t("dialog.save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
