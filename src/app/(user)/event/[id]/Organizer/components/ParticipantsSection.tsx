"use client";

import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  RefreshCw,
  Users,
  Crown,
  Award,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getParticipants,
  updateParticipant,
  deleteParticipant,
  addParticipant,
  searchCandidates,
} from "@/utils/apievent";
import { getCurrentUser } from "@/utils/apiuser";
import type { EventGroup, Candidate } from "@/utils/types";
import { UserAvatar } from "@/utils/function";

type ParticipantUser = {
  id: string;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  image?: string | null;
};
type ParticipantTeam = {
  id: string;
  name?: string | null;
  teamName?: string | null;
} | null;
type ParticipantRow = {
  id: string;
  eventGroup: EventGroup;
  isLeader: boolean;
  virtualReward?: number | null;
  virtualUsed?: number;
  user?: ParticipantUser | null;
  team?: ParticipantTeam;
};

type Props = {
  id: string;
  hasCommittee?: boolean;
  unitReward?: string;
  onRefreshCounts?: (list: ParticipantRow[]) => void;
};

const groupConfig = {
  ORGANIZER: {
    title: "🎯 Organizers",
    badge: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
    icon: Crown,
    roleVar: "var(--role-organizer)",
  },
  COMMITTEE: {
    title: "👥 Committee",
    badge:
      "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    icon: Users,
    roleVar: "var(--role-committee)",
  },
  PRESENTER: {
    title: "🎤 Presenters",
    badge: "bg-lime-100 text-lime-700 dark:bg-lime-900 dark:text-lime-300",
    icon: Award,
    roleVar: "var(--role-presenter)",
  },
  GUEST: {
    title: "✨ Guests",
    badge:
      "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    icon: Users,
    roleVar: "var(--role-guest)",
  },
};

const ITEMS_PER_PAGE = 10;

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null) {
    const response = (error as { response?: unknown }).response;
    if (typeof response === "object" && response !== null) {
      const data = (response as { data?: unknown }).data;
      if (typeof data === "object" && data !== null) {
        const msg = (data as { message?: unknown }).message;
        if (typeof msg === "string" && msg.trim()) return msg;
      }
    }
    const msg = (error as { message?: unknown }).message;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  return fallback;
};

export default function ParticipantsSection({
  id,
  hasCommittee,
  unitReward,
  onRefreshCounts,
}: Props) {
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { t } = useLanguage();
  const [searchQueries, setSearchQueries] = useState<
    Record<EventGroup, string>
  >({
    ORGANIZER: "",
    COMMITTEE: "",
    PRESENTER: "",
    GUEST: "",
  });
  const [currentPages, setCurrentPages] = useState<Record<EventGroup, number>>({
    ORGANIZER: 1,
    COMMITTEE: 1,
    PRESENTER: 1,
    GUEST: 1,
  });
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addTargetRole, setAddTargetRole] = useState<EventGroup | null>(null);
  const [addIdentifier, setAddIdentifier] = useState("");
  const [addingParticipantId, setAddingParticipantId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const onRefreshCountsRef = useRef<typeof onRefreshCounts | undefined>(
    onRefreshCounts,
  );

  useEffect(() => {
    onRefreshCountsRef.current = onRefreshCounts;
  }, [onRefreshCounts]);

  useEffect(() => {
    onRefreshCountsRef.current?.(participants);
  }, [participants]);

  // Search Candidates for Adding
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (addIdentifier.length >= 2) {
        setIsSearching(true);
        try {
          const res = await searchCandidates(id, addIdentifier);
          setCandidates(res.candidates || []);
        } catch (e) {
          console.error(e);
        } finally {
          setIsSearching(false);
        }
      } else {
        setCandidates([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [addIdentifier, id]);

  const isOrganizerLeader =
    participants.some(
      (p) =>
        p.eventGroup === "ORGANIZER" &&
        p.user?.id === currentUserId &&
        Boolean(p.isLeader),
    ) || false;

  const isOrganizer =
    participants.some(
      (p) => p.eventGroup === "ORGANIZER" && p.user?.id === currentUserId,
    ) || false;

  const handleAddParticipant = async (identifier: string) => {
    if (!id || !addTargetRole || !identifier.trim()) return;
    setAddingParticipantId(identifier);
    try {
      const res = await addParticipant(id, identifier.trim(), addTargetRole);
      if (res?.participant) {
        setParticipants((all) => [...all, res.participant]);
        toast.success(t("toast.saveSuccess"));
      }
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, t("toast.saveFailed")));
    } finally {
      setAddingParticipantId(null);
    }
  };

  const applyUpdate = useCallback(
    async (
      pid: string,
      data: {
        eventGroup?: EventGroup;
        isLeader?: boolean;
        virtualReward?: number;
        teamId?: string | null;
      },
    ) => {
      try {
        const res = await updateParticipant(id, pid, data);
        if (res?.participant) {
          setParticipants((all) => {
            const next = all.map((it) =>
              it.id === pid ? res.participant : it,
            );
            return next;
          });
          toast.success(t("toast.saveSuccess"));
        }
      } catch {
        toast.error(t("toast.saveFailed"));
      }
    },
    [id, t],
  );

  const loadParticipants = useCallback(async () => {
    if (!id) return;
    setLoadingParticipants(true);
    try {
      const res = await getParticipants(id);
      if (res?.participants) {
        const list = res.participants as ParticipantRow[];
        setParticipants(list);
      }
    } catch {
      toast.error(t("toast.loadParticipantsFailed"));
    } finally {
      setLoadingParticipants(false);
    }
  }, [id, t]);

  useEffect(() => {
    loadParticipants();
    getCurrentUser()
      .then((u) => setCurrentUserId(u?.user?.id || null))
      .catch(() => setCurrentUserId(null));
  }, [id, loadParticipants]);

  const getFilteredList = (group: EventGroup) => {
    const query = searchQueries[group].toLowerCase();
    const filtered = participants.filter(
      (p) =>
        p.eventGroup === group &&
        (p.user?.name?.toLowerCase().includes(query) ||
          p.user?.username?.toLowerCase().includes(query) ||
          p.user?.email?.toLowerCase().includes(query) ||
          p.team?.name?.toLowerCase().includes(query) ||
          p.team?.teamName?.toLowerCase().includes(query)),
    );
    if (group !== "ORGANIZER") return filtered;

    return [...filtered].sort((a, b) => {
      const leaderDiff = Number(Boolean(b.isLeader)) - Number(Boolean(a.isLeader));
      if (leaderDiff !== 0) return leaderDiff;
      const an = (a.user?.name || a.user?.username || a.user?.email || "").toLowerCase();
      const bn = (b.user?.name || b.user?.username || b.user?.email || "").toLowerCase();
      return an.localeCompare(bn);
    });
  };

  const totalCount = participants.length;

  const getPaginatedList = (group: EventGroup) => {
    const list = getFilteredList(group);
    const page = currentPages[group];
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return {
      items: list.slice(startIndex, endIndex),
      total: list.length,
      totalPages: Math.ceil(list.length / ITEMS_PER_PAGE),
      currentPage: page,
    };
  };

  const changePage = (group: EventGroup, newPage: number) => {
    setCurrentPages((prev) => ({ ...prev, [group]: newPage }));
  };

  return (
    <div className="mt-8 space-y-6">
      <Card className="border-none shadow-lg">
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">
                {t("participantSection.management")}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {t("participantSection.all")} {totalCount}{" "}
                {t("participantSection.count_unit")}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadParticipants}
              disabled={loadingParticipants}
              className="gap-2 hover:bg-primary/10 transition-colors"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  loadingParticipants ? "animate-spin" : ""
                }`}
              />
              {t("participantSection.refresh")}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loadingParticipants &&
          (!participants || participants.length === 0) ? (
            <div className="grid grid-cols-1 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="overflow-hidden border-none shadow-md">
                  <Skeleton className="h-2 w-full" />
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="space-y-2">
                          <Skeleton className="h-6 w-32" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-8 rounded-full" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !participants || participants.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {t("participantSection.empty")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {(
                ["ORGANIZER", "COMMITTEE", "PRESENTER", "GUEST"] as EventGroup[]
              )
                .filter((g) => hasCommittee || g !== "COMMITTEE")
                .map((g) => {
                  const config = groupConfig[g];
                  const { items, total, totalPages, currentPage } =
                    getPaginatedList(g);
                  const Icon = config.icon;
                  const canAdd =
                    g === "ORGANIZER" ? isOrganizerLeader : isOrganizer;

                  return (
                    <Card
                      key={g}
                      className="overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 relative group"
                    >
                      {/* Left Border Strip */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1.5"
                        style={{ backgroundColor: config.roleVar }}
                      />

                      {/* Background Gradient Tint */}
                      <div
                        className="absolute inset-0 opacity-[0.03] pointer-events-none transition-opacity group-hover:opacity-[0.05]"
                        style={{
                          background: `linear-gradient(to right, ${config.roleVar}, transparent)`,
                        }}
                      />

                      <CardHeader className="pb-3 pl-6">
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${config.badge}`}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <div>
                                <CardTitle
                                  className="text-lg font-semibold"
                                  style={{ color: config.roleVar }}
                                >
                                  {config.title}
                                </CardTitle>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {total} {t("participantSection.count_unit")}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {canAdd && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-background/80"
                                  onClick={() => {
                                    setAddTargetRole(g);
                                    setAddDialogOpen(true);
                                  }}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              )}
                              <Badge
                                variant="secondary"
                                className={`${config.badge} border-none`}
                              >
                                {total}
                              </Badge>
                            </div>
                          </div>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder={`ค้นหาใน ${config.title}...`}
                              value={searchQueries[g]}
                              onChange={(e) =>
                                setSearchQueries((prev) => ({
                                  ...prev,
                                  [g]: e.target.value,
                                }))
                              }
                              className="pl-10 bg-background/50 border-muted-foreground/20 h-9"
                            />
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent>
                        {total === 0 ? (
                          <div className="text-center py-8 text-sm text-muted-foreground">
                            {searchQueries[g]
                              ? t("participantSection.noSearchResults")
                              : t("participantSection.noParticipantsInGroup")}
                          </div>
                        ) : (
                          <>
                            <div className="rounded-lg border border-border/50 overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className="bg-muted/50 border-b border-border/50">
                                    <th className="text-left p-3 font-semibold text-sm">
                                      {t("participantSection.user")}
                                    </th>
                                    {(g !== "ORGANIZER" ||
                                      isOrganizerLeader) && (
                                      <th className="text-left p-3 font-semibold text-sm">
                                        {t("participantSection.role")}
                                      </th>
                                    )}
                                    {g === "PRESENTER" && (
                                      <th className="text-left p-3 font-semibold text-sm">
                                        {t("participantSection.team")}
                                      </th>
                                    )}
                                    {g === "PRESENTER" && (
                                      <th className="text-left p-3 font-semibold text-sm">
                                        {t("participantSection.team_leader")}
                                      </th>
                                    )}
                                    {g !== "ORGANIZER" && g !== "PRESENTER" && (
                                      <th className="text-left p-3 font-semibold text-sm">
                                        Virtual Reward ({unitReward})
                                      </th>
                                    )}
                                    <th className="text-right p-3 font-semibold text-sm">
                                      {t("participantSection.management")}
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {items.map((p) => (
                                    <tr
                                      key={p.id}
                                      className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                                    >
                                      <td className="p-3">
                                        <div className="flex items-center gap-3">
                                          <div className="relative shrink-0">
                                            {p.user?.image ? (
                                              <Image
                                                src={p.user.image}
                                                alt={
                                                  p.user?.name ||
                                                  p.user?.username ||
                                                  "user"
                                                }
                                                width={40}
                                                height={40}
                                                className="rounded-full ring-2 ring-background shadow-sm"
                                              />
                                            ) : (
                                              <div className="h-10 w-10 rounded-full flex items-center justify-center ring-2 ring-background">
                                                <Users className="h-5 w-5 text-primary" />
                                              </div>
                                            )}
                                            {p.isLeader && (
                                              <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                                                <Crown className="h-3 w-3 text-white" />
                                              </div>
                                            )}
                                          </div>
                                          <div className="min-w-0">
                                            <div className="font-medium text-sm truncate">
                                              {p.user?.name ||
                                                p.user?.username ||
                                                p.user?.email ||
                                                p.user?.id}
                                            </div>
                                            {p.user?.email && p.user?.name && (
                                              <div className="text-xs text-muted-foreground truncate">
                                                {p.user.email}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </td>
                                      {(g !== "ORGANIZER" ||
                                        isOrganizerLeader) && (
                                        <td className="p-3">
                                          <Select
                                            value={p.eventGroup}
                                            onValueChange={(v) => {
                                              setParticipants((all) =>
                                                all.map((it) =>
                                                  it.id === p.id
                                                    ? {
                                                        ...it,
                                                        eventGroup:
                                                          v as EventGroup,
                                                      }
                                                    : it,
                                                ),
                                              );
                                              applyUpdate(p.id, {
                                                eventGroup: v as EventGroup,
                                              });
                                            }}
                                            disabled={
                                              g === "ORGANIZER" &&
                                              !isOrganizerLeader
                                            }
                                          >
                                            <SelectTrigger className="w-32.5">
                                              <SelectValue placeholder="เลือกบทบาท" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {isOrganizerLeader && (
                                                <SelectItem value="ORGANIZER">
                                                  Organizer
                                                </SelectItem>
                                              )}
                                              {hasCommittee && (
                                                <SelectItem value="COMMITTEE">
                                                  Committee
                                                </SelectItem>
                                              )}
                                              <SelectItem value="PRESENTER">
                                                Presenter
                                              </SelectItem>
                                              <SelectItem value="GUEST">
                                                Guest
                                              </SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </td>
                                      )}
                                      {g === "PRESENTER" && (
                                        <td className="p-3">
                                          <Badge
                                            variant="outline"
                                            className="font-normal"
                                          >
                                            {p.team?.name ||
                                              p.team?.teamName ||
                                              "-"}
                                          </Badge>
                                        </td>
                                      )}
                                      {g === "PRESENTER" && (
                                        <td className="p-3">
                                          {(() => {
                                            if (!p.team?.id)
                                              return (
                                                <span className="text-muted-foreground text-sm">
                                                  -
                                                </span>
                                              );
                                            const leader = participants.find(
                                              (it) =>
                                                it.eventGroup === "PRESENTER" &&
                                                it.team?.id === p.team?.id &&
                                                Boolean(it.isLeader),
                                            );
                                            const u = leader?.user;
                                            return (
                                              <div className="flex items-center gap-2">
                                                <Crown className="h-4 w-4 text-yellow-500 shrink-0" />
                                                <span className="text-sm truncate max-w-37.5">
                                                  {u?.name ||
                                                    u?.username ||
                                                    u?.email ||
                                                    leader?.id ||
                                                    "-"}
                                                </span>
                                              </div>
                                            );
                                          })()}
                                        </td>
                                      )}

                                      {g !== "ORGANIZER" &&
                                        g !== "PRESENTER" && (
                                          <td className="p-3">
                                            <div className="flex items-center gap-2">
                                              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                                                {p.virtualUsed || 0} /
                                              </span>
                                              <Input
                                                  type="number"
                                                  min={0}
                                                  step={1}
                                                  value={
                                                    typeof p.virtualReward ===
                                                    "number"
                                                      ? p.virtualReward === 0
                                                        ? ""
                                                        : p.virtualReward
                                                      : ""
                                                  }
                                                  onChange={(e) => {
                                                    const rawValue =
                                                      e.target.value;
                                                    if (rawValue === "") {
                                                      setParticipants((all) =>
                                                        all.map((it) =>
                                                          it.id === p.id
                                                            ? {
                                                                ...it,
                                                                virtualReward: 0,
                                                              }
                                                            : it,
                                                        ),
                                                      );
                                                      applyUpdate(p.id, {
                                                        virtualReward: 0,
                                                      });
                                                      return;
                                                    }
                                                    const raw = Number(rawValue);
                                                    if (!isNaN(raw)) {
                                                      const val = Math.max(0, raw);
                                                      setParticipants((all) =>
                                                        all.map((it) =>
                                                          it.id === p.id
                                                            ? {
                                                                ...it,
                                                                virtualReward:
                                                                  val,
                                                              }
                                                            : it,
                                                        ),
                                                      );
                                                      applyUpdate(p.id, {
                                                        virtualReward: val,
                                                      });
                                                    }
                                                  }}
                                                  onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                      e.currentTarget.blur();
                                                    }
                                                  }}
                                                  className="w-24 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                              <span className="text-sm text-muted-foreground">
                                                {unitReward}
                                              </span>
                                            </div>
                                          </td>
                                        )}
                                      <td className="p-3 text-right">
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() =>
                                                setDeleteTarget(p.id)
                                              }
                                              disabled={
                                                g === "ORGANIZER" &&
                                                (!isOrganizerLeader ||
                                                  p.user?.id === currentUserId)
                                              }
                                              className="hover:bg-destructive/10 hover:text-destructive transition-colors"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>
                                                {t(
                                                  "removeParticipantModal.title",
                                                )}
                                              </AlertDialogTitle>
                                              <AlertDialogDescription>
                                                {t(
                                                  "removeParticipantModal.description",
                                                )}
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>
                                                {t(
                                                  "removeParticipantModal.cancel_button",
                                                )}
                                              </AlertDialogCancel>
                                              <AlertDialogAction
                                                onClick={async () => {
                                                  const pid = deleteTarget;
                                                  if (!pid) return;
                                                  try {
                                                    await deleteParticipant(
                                                      id,
                                                      pid,
                                                    );
                                                    setParticipants((all) => {
                                                      const next = all.filter(
                                                        (it) => it.id !== pid,
                                                      );
                                                      return next;
                                                    });
                                                    toast.success(
                                                      t(
                                                        "toast.participantDeleted",
                                                      ),
                                                    );
                                                  } catch {
                                                    toast.error(
                                                      t(
                                                        "toast.participantDeleteFailed",
                                                      ),
                                                    );
                                                  } finally {
                                                    setDeleteTarget(null);
                                                  }
                                                }}
                                                className="bg-destructive hover:bg-destructive/90"
                                              >
                                                {t(
                                                  "removeParticipantModal.confirm_button",
                                                )}
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {total >= 10 && totalPages > 1 && (
                              <div className="flex items-center justify-between mt-4">
                                <div className="text-sm text-muted-foreground">
                                  แสดง {(currentPage - 1) * ITEMS_PER_PAGE + 1}{" "}
                                  -{" "}
                                  {Math.min(
                                    currentPage * ITEMS_PER_PAGE,
                                    total,
                                  )}{" "}
                                  จาก {total} คน
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      changePage(g, currentPage - 1)
                                    }
                                    disabled={currentPage === 1}
                                  >
                                    <ChevronLeft className="h-4 w-4" />
                                  </Button>
                                  <div className="text-sm font-medium px-2">
                                    หน้า {currentPage} / {totalPages}
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      changePage(g, currentPage + 1)
                                    }
                                    disabled={currentPage === totalPages}
                                  >
                                    <ChevronRight className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-4 pb-2 border-b relative overflow-hidden">
            {addTargetRole && (
              <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundColor: groupConfig[addTargetRole].roleVar }}
              />
            )}
            <DialogTitle className="relative flex items-center gap-2">
              {addTargetRole && (
                <div
                  className={`p-1.5 rounded-md ${groupConfig[addTargetRole].badge}`}
                >
                  {(() => {
                    const Icon = groupConfig[addTargetRole].icon;
                    return <Icon className="w-4 h-4" />;
                  })()}
                </div>
              )}
              <span className="flex items-center gap-1">
                {t("participantSection.add")}{" "}
                <span
                  style={{
                    color: addTargetRole
                      ? groupConfig[addTargetRole].roleVar
                      : undefined,
                  }}
                >
                  {addTargetRole
                    ? groupConfig[addTargetRole].title
                    : t("participantSection.participant")}
                </span>
              </span>
            </DialogTitle>
            <DialogDescription className="relative">
              {t("participantSection.addDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("projectDetail.member.searchPlaceholder")}
                className="pl-9 bg-muted/50 border-border focus-visible:ring-1"
                value={addIdentifier}
                onChange={(e) => setAddIdentifier(e.target.value)}
                autoFocus
              />
            </div>

            <div className="h-75 overflow-y-auto rounded-lg border bg-muted/30 p-2">
              {isSearching ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-primary/50" />
                  <span className="text-xs">
                    {t("projectDetail.member.searching")}
                  </span>
                </div>
              ) : candidates.length > 0 ? (
                <div className="space-y-1">
                  {candidates.map((c) => {
                    const isAdded = participants.some(
                      (p) => p.user?.id === c.userId,
                    );
                    const isAdding = addingParticipantId === c.userId;

                    return (
                      <div
                        key={c.userId}
                        className="flex items-center justify-between p-2 hover:bg-card hover:shadow-sm rounded-lg transition-all group border border-transparent hover:border-border"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <UserAvatar
                            user={c}
                            className="w-9 h-9 border bg-card"
                          />
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate text-foreground">
                              {c.name}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              @{c.username}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={isAdded ? "ghost" : "secondary"}
                          className={`h-8 px-3 shadow-sm transition-all ${
                            !isAdded && !isAdding && addTargetRole
                              ? "text-white hover:opacity-90"
                              : ""
                          }`}
                          style={{
                            backgroundColor:
                              !isAdded && !isAdding && addTargetRole
                                ? groupConfig[addTargetRole].roleVar
                                : undefined,
                          }}
                          onClick={() => handleAddParticipant(c.userId)}
                          disabled={!!addingParticipantId || isAdded}
                        >
                          {isAdding ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : isAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5 mr-1.5" />
                              {t("participantSection.added")}
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5 mr-1.5" />
                              {t("participantSection.add")}
                            </>
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : addIdentifier.length >= 2 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 opacity-50">
                  <Users className="w-8 h-8" />
                  <span className="text-sm">
                    {t("projectDetail.member.noUsers")}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 opacity-50">
                  <Search className="w-8 h-8" />
                  <span className="text-sm">
                    {t("projectDetail.member.typeToSearch")}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="p-3 bg-muted border-t flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAddDialogOpen(false)}
            >
              {t("projectDetail.buttons.cancel")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
