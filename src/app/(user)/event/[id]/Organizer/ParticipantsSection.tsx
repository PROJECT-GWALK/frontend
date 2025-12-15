"use client";

import Image from "next/image";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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
} from "lucide-react";
import { toast } from "sonner";
import {
  getEventParticipants,
  updateEventParticipant,
  deleteEventParticipant,
} from "@/utils/apievent";
import { getCurrentUser } from "@/utils/apiuser";

type EventGroup = "ORGANIZER" | "PRESENTER" | "COMMITTEE" | "GUEST";
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
} | null;
type ParticipantRow = {
  id: string;
  eventGroup: EventGroup;
  isLeader: boolean;
  virtualReward?: number | null;
  user?: ParticipantUser | null;
  team?: ParticipantTeam;
};

type Props = {
  id: string;
  onRefreshCounts?: (list: ParticipantRow[]) => void;
};

const groupConfig = {
  ORGANIZER: {
    title: "🎯 Organizers",
    color: "bg-gradient-to-r from-purple-500 to-pink-500",
    badge:
      "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    icon: Crown,
  },
  COMMITTEE: {
    title: "👥 Committee",
    color: "bg-gradient-to-r from-blue-500 to-cyan-500",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    icon: Users,
  },
  PRESENTER: {
    title: "🎤 Presenters",
    color: "bg-gradient-to-r from-orange-500 to-red-500",
    badge:
      "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    icon: Award,
  },
  GUEST: {
    title: "✨ Guests",
    color: "bg-gradient-to-r from-green-500 to-emerald-500",
    badge: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    icon: Users,
  },
};

const ITEMS_PER_PAGE = 20;

export default function ParticipantsSection({ id, onRefreshCounts }: Props) {
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPages, setCurrentPages] = useState<Record<EventGroup, number>>({
    ORGANIZER: 1,
    COMMITTEE: 1,
    PRESENTER: 1,
    GUEST: 1,
  });
  const onRefreshCountsRef = useRef<typeof onRefreshCounts | undefined>(
    onRefreshCounts
  );
  const vrTimersRef = useRef<
    Record<string, ReturnType<typeof setTimeout> | undefined>
  >({});

  useEffect(() => {
    onRefreshCountsRef.current = onRefreshCounts;
  }, [onRefreshCounts]);

  const isOrganizerLeader =
    participants.some(
      (p) =>
        p.eventGroup === "ORGANIZER" &&
        p.user?.id === currentUserId &&
        Boolean(p.isLeader)
    ) || false;

  const applyUpdate = useCallback(
    async (
      pid: string,
      data: {
        eventGroup?: EventGroup;
        isLeader?: boolean;
        virtualReward?: number;
        teamId?: string | null;
      }
    ) => {
      try {
        const res = await updateEventParticipant(id, pid, data);
        if (res?.participant) {
          setParticipants((all) => {
            const next = all.map((it) =>
              it.id === pid ? res.participant : it
            );
            onRefreshCountsRef.current?.(next);
            return next;
          });
          toast.success("บันทึกสำเร็จ");
        }
      } catch {
        toast.error("บันทึกไม่สำเร็จ");
      }
    },
    [id]
  );

  const loadParticipants = useCallback(async () => {
    if (!id) return;
    setLoadingParticipants(true);
    try {
      const res = await getEventParticipants(id);
      if (res?.participants) {
        const list = res.participants as ParticipantRow[];
        setParticipants(list);
        onRefreshCountsRef.current?.(list);
      }
    } catch {
      toast.error("โหลดรายชื่อผู้เข้าร่วมไม่สำเร็จ");
    } finally {
      setLoadingParticipants(false);
    }
  }, [id]);

  useEffect(() => {
    loadParticipants();
    getCurrentUser()
      .then((u) => setCurrentUserId(u?.user?.id || null))
      .catch(() => setCurrentUserId(null));
  }, [id, loadParticipants]);

  const filteredParticipants = useMemo(() => {
    if (!searchQuery) return participants;
    const query = searchQuery.toLowerCase();
    return participants.filter(
      (p) =>
        p.user?.name?.toLowerCase().includes(query) ||
        p.user?.username?.toLowerCase().includes(query) ||
        p.user?.email?.toLowerCase().includes(query) ||
        p.team?.name?.toLowerCase().includes(query)
    );
  }, [participants, searchQuery]);

  const totalCount = participants.length;

  const getPaginatedList = (group: EventGroup) => {
    const list = filteredParticipants.filter((p) => p.eventGroup === group);
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
      <Card className="border-none shadow-lg bg-gradient-to-br from-background to-muted/20">
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                จัดการผู้เข้าร่วม
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                ทั้งหมด {totalCount} คน
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
              รีเฟรช
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาผู้เข้าร่วม..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/50 border-muted-foreground/20"
            />
          </div>
        </CardHeader>

        <CardContent>
          {!participants || participants.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {loadingParticipants ? "กำลังโหลด..." : "ยังไม่มีผู้เข้าร่วม"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {(
                ["ORGANIZER", "COMMITTEE", "PRESENTER", "GUEST"] as EventGroup[]
              ).map((g) => {
                const config = groupConfig[g];
                const { items, total, totalPages, currentPage } =
                  getPaginatedList(g);
                const Icon = config.icon;

                return (
                  <Card
                    key={g}
                    className="overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300"
                  >
                    <div className={`h-2 ${config.color}`} />
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${config.badge}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-lg font-semibold">
                              {config.title}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {total} คน
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className={`${config.badge} border-none`}
                        >
                          {total}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent>
                      {total === 0 ? (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                          {searchQuery
                            ? "ไม่พบผู้เข้าร่วมที่ค้นหา"
                            : "ยังไม่มีผู้เข้าร่วมกลุ่มนี้"}
                        </div>
                      ) : (
                        <>
                          <div className="rounded-lg border border-border/50 overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="bg-muted/50 border-b border-border/50">
                                  <th className="text-left p-3 font-semibold text-sm">
                                    ผู้ใช้
                                  </th>
                                  <th className="text-left p-3 font-semibold text-sm">
                                    บทบาท
                                  </th>
                                  {g === "PRESENTER" && (
                                    <th className="text-left p-3 font-semibold text-sm">
                                      ทีม
                                    </th>
                                  )}
                                  {g === "PRESENTER" && (
                                    <th className="text-left p-3 font-semibold text-sm">
                                      หัวหน้าทีม
                                    </th>
                                  )}
                                  {g !== "ORGANIZER" && g !== "PRESENTER" && (
                                    <th className="text-left p-3 font-semibold text-sm">
                                      Leader
                                    </th>
                                  )}
                                  {g !== "ORGANIZER" && (
                                    <th className="text-left p-3 font-semibold text-sm">
                                      Virtual Reward
                                    </th>
                                  )}
                                  <th className="text-right p-3 font-semibold text-sm">
                                    การจัดการ
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
                                        <div className="relative flex-shrink-0">
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
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-background">
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
                                    <td className="p-3">
                                      <Select
                                        value={p.eventGroup}
                                        onValueChange={(v) => {
                                          setParticipants((all) =>
                                            all.map((it) =>
                                              it.id === p.id
                                                ? {
                                                    ...it,
                                                    eventGroup: v as EventGroup,
                                                  }
                                                : it
                                            )
                                          );
                                          applyUpdate(p.id, {
                                            eventGroup: v as EventGroup,
                                          });
                                        }}
                                        disabled={g === "ORGANIZER"}
                                      >
                                        <SelectTrigger className="w-[130px]">
                                          <SelectValue placeholder="เลือกบทบาท" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {isOrganizerLeader && (
                                            <SelectItem value="ORGANIZER">
                                              Organizer
                                            </SelectItem>
                                          )}
                                          <SelectItem value="PRESENTER">
                                            Presenter
                                          </SelectItem>
                                          <SelectItem value="COMMITTEE">
                                            Committee
                                          </SelectItem>
                                          <SelectItem value="GUEST">
                                            Guest
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </td>
                                    {g === "PRESENTER" && (
                                      <td className="p-3">
                                        <Badge
                                          variant="outline"
                                          className="font-normal"
                                        >
                                          {p.team?.name || "-"}
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
                                              Boolean(it.isLeader)
                                          );
                                          const u = leader?.user;
                                          return (
                                            <div className="flex items-center gap-2">
                                              <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                                              <span className="text-sm truncate max-w-[150px]">
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
                                    {g !== "ORGANIZER" && g !== "PRESENTER" && (
                                      <td className="p-3">
                                        <Switch
                                          checked={Boolean(p.isLeader)}
                                          onCheckedChange={(checked) => {
                                            setParticipants((all) =>
                                              all.map((it) =>
                                                it.id === p.id
                                                  ? { ...it, isLeader: checked }
                                                  : it
                                              )
                                            );
                                            applyUpdate(p.id, {
                                              isLeader: checked,
                                            });
                                          }}
                                        />
                                      </td>
                                    )}
                                    {g !== "ORGANIZER" && (
                                      <td className="p-3">
                                        <Input
                                          type="number"
                                          min={0}
                                          step={1}
                                          value={
                                            typeof p.virtualReward === "number"
                                              ? p.virtualReward
                                              : 0
                                          }
                                          onChange={(e) => {
                                            const raw = Number(e.target.value);
                                            const val = Number.isFinite(raw)
                                              ? Math.max(0, raw)
                                              : 0;
                                            setParticipants((all) =>
                                              all.map((it) =>
                                                it.id === p.id
                                                  ? {
                                                      ...it,
                                                      virtualReward: val,
                                                    }
                                                  : it
                                              )
                                            );
                                            const t = vrTimersRef.current[p.id];
                                            if (t) clearTimeout(t);
                                            vrTimersRef.current[p.id] =
                                              setTimeout(() => {
                                                applyUpdate(p.id, {
                                                  virtualReward: val,
                                                });
                                              }, 500);
                                          }}
                                          className="w-24"
                                        />
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
                                              ลบผู้เข้าร่วม
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                              ต้องการลบผู้เข้าร่วมคนนี้ออกจากงานหรือไม่
                                              การกระทำนี้ไม่สามารถย้อนกลับได้
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>
                                              ยกเลิก
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={async () => {
                                                const pid = deleteTarget;
                                                if (!pid) return;
                                                try {
                                                  await deleteEventParticipant(
                                                    id,
                                                    pid
                                                  );
                                                  setParticipants((all) => {
                                                    const next = all.filter(
                                                      (it) => it.id !== pid
                                                    );
                                                    onRefreshCountsRef.current?.(
                                                      next
                                                    );
                                                    return next;
                                                  });
                                                  toast.success("ลบแล้ว");
                                                } catch {
                                                  toast.error("ลบไม่สำเร็จ");
                                                } finally {
                                                  setDeleteTarget(null);
                                                }
                                              }}
                                              className="bg-destructive hover:bg-destructive/90"
                                            >
                                              ลบ
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

                          {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4">
                              <div className="text-sm text-muted-foreground">
                                แสดง {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
                                {Math.min(currentPage * ITEMS_PER_PAGE, total)}{" "}
                                จาก {total} คน
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => changePage(g, currentPage - 1)}
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
                                  onClick={() => changePage(g, currentPage + 1)}
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
    </div>
  );
}
