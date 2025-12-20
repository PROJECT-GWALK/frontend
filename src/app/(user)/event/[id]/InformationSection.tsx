"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Clock,
  MapPin,
  Users,
  Gift,
  ClipboardCopy,
  Award,
  Trash2,
  Calendar as CalendarIcon,
  Save,
  X,
  Plus,
  FileText,
} from "lucide-react";
import { timeUntil, formatDateTime, getMapEmbedUrl } from "@/utils/function";
import { timeFormat } from "@/utils/settings";
import { toast } from "sonner";
import type { EventData, EventFileType } from "@/utils/types";
import { FileType } from "@/utils/types";
import { useEffect, useRef, useState } from "react";
import {
  getInviteToken,
  updateEvent,
  refreshInviteToken,
} from "@/utils/apievent";
import { deleteSpecialReward, getEvent } from "@/utils/apievent";
import { toPng } from "html-to-image";
import * as QRCode from "qrcode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as DateCalendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
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

type EditSection =
  | "description"
  | "time"
  | "location"
  | "presenter"
  | "guest"
  | "rewards";

type Props = {
  id: string;
  event: EventData;
  editable?: boolean;
  onEdit?: (section: EditSection, initialForm: Record<string, unknown>) => void;
  linkLabel?: string;
};

export default function InformationSection({
  id,
  event,
  editable,
  onEdit,
  linkLabel = "Link",
}: Props) {
  const router = useRouter();

  // Date/Time Editing State
  const [editTimeOpen, setEditTimeOpen] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState<
    Date | undefined
  >();
  const [startTime, setStartTime] = useState("");
  const [selectedEndDate, setSelectedEndDate] = useState<Date | undefined>();
  const [endTime, setEndTime] = useState("");
  const [updatingTime, setUpdatingTime] = useState(false);

  // Presenter Editing State
  const [editPresenterOpen, setEditPresenterOpen] = useState(false);
  const [presenterStart, setPresenterStart] = useState<Date | undefined>();
  const [presenterStartTime, setPresenterStartTime] = useState("");
  const [presenterEnd, setPresenterEnd] = useState<Date | undefined>();
  const [presenterEndTime, setPresenterEndTime] = useState("");
  const [maxTeams, setMaxTeams] = useState<number>(0);
  const [maxTeamMembers, setMaxTeamMembers] = useState<number>(0);
  const [fileRequirements, setFileRequirements] = useState<EventFileType[]>([]);
  const [updatingPresenter, setUpdatingPresenter] = useState(false);

  const handleEdit = (
    section: EditSection,
    initialForm: Record<string, unknown>
  ) => {
    if (section === "time") {
      if (event.startView) {
        const d = new Date(event.startView);
        setSelectedStartDate(d);
        setStartTime(
          `${String(d.getHours()).padStart(2, "0")}:${String(
            d.getMinutes()
          ).padStart(2, "0")}`
        );
      } else {
        setSelectedStartDate(undefined);
        setStartTime("");
      }
      if (event.endView) {
        const d = new Date(event.endView);
        setSelectedEndDate(d);
        setEndTime(
          `${String(d.getHours()).padStart(2, "0")}:${String(
            d.getMinutes()
          ).padStart(2, "0")}`
        );
      } else {
        setSelectedEndDate(undefined);
        setEndTime("");
      }
      setEditTimeOpen(true);
      return;
    }
    if (section === "presenter") {
      if (event.startJoinDate) {
        const d = new Date(event.startJoinDate);
        setPresenterStart(d);
        setPresenterStartTime(
          `${String(d.getHours()).padStart(2, "0")}:${String(
            d.getMinutes()
          ).padStart(2, "0")}`
        );
      } else {
        setPresenterStart(undefined);
        setPresenterStartTime("");
      }
      if (event.endJoinDate) {
        const d = new Date(event.endJoinDate);
        setPresenterEnd(d);
        setPresenterEndTime(
          `${String(d.getHours()).padStart(2, "0")}:${String(
            d.getMinutes()
          ).padStart(2, "0")}`
        );
      } else {
        setPresenterEnd(undefined);
        setPresenterEndTime("");
      }
      setMaxTeams(event.maxTeams ?? 0);
      setMaxTeamMembers(event.maxTeamMembers ?? 0);
      setFileRequirements(event.fileTypes ?? []);
      setEditPresenterOpen(true);
      return;
    }
    if (editable && onEdit) onEdit(section, initialForm);
  };

  const handleSaveTime = async () => {
    setUpdatingTime(true);
    try {
      let startIso = null;
      if (selectedStartDate && startTime) {
        const [h, m] = startTime.split(":").map(Number);
        const d = new Date(selectedStartDate);
        d.setHours(h, m);
        startIso = d.toISOString();
      } else if (selectedStartDate) {
        // Default to 00:00 if no time? Or error?
        // Assuming time is required if date is selected
        const d = new Date(selectedStartDate);
        d.setHours(0, 0);
        startIso = d.toISOString();
      }

      let endIso = null;
      if (selectedEndDate && endTime) {
        const [h, m] = endTime.split(":").map(Number);
        const d = new Date(selectedEndDate);
        d.setHours(h, m);
        endIso = d.toISOString();
      } else if (selectedEndDate) {
        const d = new Date(selectedEndDate);
        d.setHours(23, 59);
        endIso = d.toISOString();
      }

      await updateEvent(id, { startView: startIso, endView: endIso });
      toast.success("Time saved successfully");
      setEditTimeOpen(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
    } finally {
      setUpdatingTime(false);
    }
  };

  const handleSavePresenter = async () => {
    setUpdatingPresenter(true);
    try {
      let startIso = null;
      if (presenterStart && presenterStartTime) {
        const [h, m] = presenterStartTime.split(":").map(Number);
        const d = new Date(presenterStart);
        d.setHours(h, m);
        startIso = d.toISOString();
      } else if (presenterStart) {
        const d = new Date(presenterStart);
        d.setHours(0, 0);
        startIso = d.toISOString();
      }

      let endIso = null;
      if (presenterEnd && presenterEndTime) {
        const [h, m] = presenterEndTime.split(":").map(Number);
        const d = new Date(presenterEnd);
        d.setHours(h, m);
        endIso = d.toISOString();
      } else if (presenterEnd) {
        const d = new Date(presenterEnd);
        d.setHours(23, 59);
        endIso = d.toISOString();
      }

      await updateEvent(id, {
        startJoinDate: startIso,
        endJoinDate: endIso,
        maxTeams: maxTeams,
        maxTeamMembers: maxTeamMembers,
        fileTypes: fileRequirements,
      });
      toast.success("Presenter info saved successfully");
      setEditPresenterOpen(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
    } finally {
      setUpdatingPresenter(false);
    }
  };

  const [rewards, setRewards] = useState(event.specialRewards ?? []);
  useEffect(() => {
    setRewards(event.specialRewards ?? []);
  }, [event.specialRewards]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const handleDeleteReward = async (rid: string) => {
    if (!editable) return;
    setDeletingId(rid);
    try {
      await deleteSpecialReward(id, rid);
      setRewards((prev) => prev.filter((r) => r.id !== rid));
      toast.success("Reward deleted");
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete reward");
    } finally {
      setDeletingId(null);
    }
  };

  const [tokens, setTokens] = useState<{
    presenter?: string;
    guest?: string;
    committee?: string;
  }>({});
  const [qrThumbs, setQrThumbs] = useState<{
    presenter?: string;
    guest?: string;
    committee?: string;
  }>({});
  const [qrLarge, setQrLarge] = useState<{
    presenter?: string;
    guest?: string;
    committee?: string;
  }>({});

  useEffect(() => {
    const loadTokens = async () => {
      try {
        const roles: Array<"presenter" | "guest" | "committee"> = [
          "presenter",
          "guest",
          "committee",
        ];
        const results = await Promise.all(
          roles.map((r) => getInviteToken(id, r).catch(() => null))
        );
        const map: { presenter?: string; guest?: string; committee?: string } =
          {};
        results.forEach((res, i) => {
          const role = roles[i];
          if (res?.message === "ok" && res?.token) {
            map[role] = res.token as string;
          }
        });
        setTokens(map);
      } catch {
        toast.error("Failed to load invite links");
      }
    };
    if (editable) loadTokens();
  }, [id, editable]);

  useEffect(() => {
    const genQrs = async () => {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const roles: Array<"presenter" | "guest" | "committee"> = [
        "presenter",
        "guest",
        "committee",
      ];
      const thumbMap: {
        presenter?: string;
        guest?: string;
        committee?: string;
      } = {};
      const largeMap: {
        presenter?: string;
        guest?: string;
        committee?: string;
      } = {};
      for (const r of roles) {
        const token = tokens[r];
        if (!token) continue;
        const link = `${origin}/event/${id}?invite=1&token=${encodeURIComponent(
          token
        )}`;
        try {
          const large = await QRCode.toDataURL(link, {
            errorCorrectionLevel: "M",
            width: 600,
          });
          const thumb = await QRCode.toDataURL(link, {
            errorCorrectionLevel: "M",
            width: 120,
          });
          largeMap[r] = large;
          thumbMap[r] = thumb;
        } catch {
          // ignore
        }
      }
      setQrLarge(largeMap);
      setQrThumbs(thumbMap);
    };
    genQrs();
  }, [tokens, id]);

  const qrPresenterRef = useRef<HTMLDivElement>(null);
  const qrGuestRef = useRef<HTMLDivElement>(null);
  const qrCommitteeRef = useRef<HTMLDivElement>(null);
  const refForRole = (role: "presenter" | "guest" | "committee") =>
    role === "presenter"
      ? qrPresenterRef
      : role === "guest"
      ? qrGuestRef
      : qrCommitteeRef;
  const [qrOpen, setQrOpen] = useState(false);
  const [qrSrc, setQrSrc] = useState<string>("");
  const [qrTitle, setQrTitle] = useState<string>("");

  const [refreshRole, setRefreshRole] = useState<
    "presenter" | "guest" | "committee" | null
  >(null);
  const handleRefreshToken = async () => {
    if (!refreshRole) return;
    try {
      const res = await refreshInviteToken(id, refreshRole);
      if (res.token) {
        setTokens((prev) => ({ ...prev, [refreshRole]: res.token }));
        toast.success(`Refreshed ${refreshRole} token`);
      }
    } catch {
      toast.error("Failed to refresh token");
    } finally {
      setRefreshRole(null);
    }
  };

  return (
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="lg:col-span-2 border-none shadow-md bg-gradient-to-br from-background to-muted/20">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle className="text-xl font-bold">Event Details</CardTitle>
            {editable && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  handleEdit("description", {
                    eventDescription: event?.eventDescription ?? "",
                  })
                }
              >
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {event?.eventDescription || "No description"}
          </p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                <Clock className="h-5 w-5" />
              </div>
              Event Duration
            </CardTitle>
            {editable && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  handleEdit("time", {
                    startView: event?.startView ?? "",
                    endView: event?.endView ?? "",
                    startTime: event?.startJoinDate ?? "",
                    endTime: event?.endJoinDate ?? "",
                  })
                }
              >
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 items-center">
            <div>
              {(() => {
                const now = new Date();
                const sv = event?.startView
                  ? new Date(event.startView)
                  : undefined;
                const ev = event?.endView ? new Date(event.endView) : undefined;
                if (sv && now < sv) {
                  return (
                    <div className="font-bold text-xl">
                      Starts in
                      <h1 className="text-blue-600">
                        {timeUntil(event.startView)}
                      </h1>
                    </div>
                  );
                }
                if (sv && (!ev || now <= ev)) {
                  return (
                    <div className="font-bold text-xl">
                      Ends in
                      <h1 className="text-red-600">
                        {event?.endView ? timeUntil(event.endView) : "Ongoing"}
                      </h1>
                    </div>
                  );
                }
                if (ev && now > ev) {
                  return (
                    <div className="font-bold text-xl text-muted-foreground">
                      Ended
                    </div>
                  );
                }
                return null;
              })()}
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Start:</span>
                <span>
                  {event?.startView
                    ? formatDateTime(new Date(event.startView))
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">End:</span>
                <span>
                  {event?.endView
                    ? formatDateTime(new Date(event.endView))
                    : "-"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <div className="p-2 rounded-lg bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                <MapPin className="h-5 w-5" />
              </div>
              Event Location
            </CardTitle>
            {editable && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  handleEdit("location", {
                    locationName: event?.locationName ?? "",
                    location: event?.location ?? "",
                  })
                }
              >
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="font-medium">{event?.locationName ?? "-"}</div>
            {event?.location && (
              <a
                href={(event?.location || "").replace(/`/g, "").trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:text-primary/80 transition-colors"
              >
                {linkLabel}
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <div className="p-2 rounded-lg bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                <Users className="h-5 w-5" />
              </div>
              Presenter
            </CardTitle>
            {editable && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  handleEdit("presenter", {
                    startJoinDate: event?.startJoinDate ?? "",
                    endJoinDate: event?.endJoinDate ?? "",
                    maxTeams: event?.maxTeams ?? 0,
                    maxTeamMembers: event?.maxTeamMembers ?? 0,
                  })
                }
              >
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Submission Start:</span>
              <span>
                {event?.startJoinDate
                  ? formatDateTime(new Date(event.startJoinDate))
                  : "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Submission End:</span>
              <span>
                {event?.endJoinDate
                  ? formatDateTime(new Date(event.endJoinDate))
                  : "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Max Teams:</span>
              <span>{event?.maxTeams ?? "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Members per Group:</span>
              <span>{event?.maxTeamMembers ?? "-"}</span>
            </div>

            {event?.fileTypes && event.fileTypes.length > 0 && (
              <div className="pt-4 border-t mt-4">
                <div className="font-semibold mb-2">File Requirements</div>
                <ul className="space-y-2">
                  {event.fileTypes.map((file, idx) => (
                    <li key={idx} className="bg-muted/30 p-2 rounded text-xs">
                      <div className="flex justify-between font-medium">
                        <span>{file.name}</span>
                        {file.isRequired && (
                          <span className="text-red-500 text-[10px] border border-red-200 px-1 rounded bg-red-50">
                            Required
                          </span>
                        )}
                      </div>
                      <div className="text-muted-foreground mt-1">
                        {file.allowedFileTypes.join(", ").toUpperCase()}
                      </div>
                      {file.description && (
                        <div className="text-muted-foreground italic mt-0.5">
                          {file.description}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <div className="p-2 rounded-lg bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300">
                <Gift className="h-5 w-5" />
              </div>
              Rewards and Points
            </CardTitle>
            {editable && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  handleEdit("guest", {
                    guestReward: event?.virtualRewardGuest ?? 0,
                    committeeReward: event?.virtualRewardCommittee ?? 0,
                    unitReward: event?.unitReward ?? "coins",
                  })
                }
              >
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900/50 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600/70 dark:text-indigo-400 mb-1">
                Committee Reward
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                  {event?.virtualRewardCommittee ?? 0}
                </span>
                <span className="text-sm font-medium text-indigo-600/80 dark:text-indigo-500">
                  {event?.unitReward ?? "coins"}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-100 dark:border-amber-900/50 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600/70 dark:text-amber-400 mb-1">
                Guest Reward
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
                  {event?.virtualRewardGuest ?? 0}
                </span>
                <span className="text-sm font-medium text-amber-600/80 dark:text-amber-500">
                  {event?.unitReward ?? "coins"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {editable && (
        <Card className="lg:col-span-2 border-none shadow-md hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <div className="p-2 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                  <Users className="h-5 w-5" />
                </div>
                Invite Links
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                Share invite link for roles
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {["presenter", "guest", "committee"].map((role) => {
                const r = role as "presenter" | "guest" | "committee";
                const origin =
                  typeof window !== "undefined" ? window.location.origin : "";
                const token = tokens[r];
                const link = token
                  ? `${origin}/event/${id}/invite?token=${encodeURIComponent(
                      token
                    )}`
                  : `${origin}/event/${id}/invite?role=${encodeURIComponent(
                      r
                    )}`;
                const qrRef = refForRole(r);
                const qrThumb = qrThumbs[r] || "";
                const qrLargeUrl = qrLarge[r] || "";
                return (
                  <div
                    key={role}
                    className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="capitalize font-medium min-w-[80px]">
                        {role}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        title="Reset Token"
                        onClick={() => setRefreshRole(r)}
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    </div>
                    <div
                      className="flex items-center gap-2 w-full sm:w-auto justify-end"
                      ref={qrRef}
                    >
                      <Button
                        size="sm"
                        variant="ghost"
                        className="hover:bg-background"
                        onClick={() => {
                          if (!link) {
                            toast.error("Preparing invite link...");
                            return;
                          }
                          navigator.clipboard.writeText(link);
                          toast.success("Copied");
                        }}
                      >
                        <ClipboardCopy className="h-4 w-4 mr-2" />
                        Copy Link
                      </Button>
                      {qrThumb ? (
                        <>
                          <img
                            src={qrThumb}
                            alt={`qr-${role}`}
                            className="h-10 w-10 rounded border"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              if (qrLargeUrl) {
                                setQrSrc(qrLargeUrl);
                                setQrTitle(`QR Code for ${role}`);
                                setQrOpen(true);
                                return;
                              }
                              const node = qrRef.current;
                              if (!node) {
                                toast.error("Preparing QR...");
                                return;
                              }
                              try {
                                const dataUrl = await toPng(node, {
                                  cacheBust: true,
                                  pixelRatio: 2,
                                });
                                setQrSrc(dataUrl);
                                setQrTitle(`QR Code for ${role}`);
                                setQrOpen(true);
                              } catch {
                                toast.error("Failed to display QR");
                              }
                            }}
                          >
                            View QR
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Preparing...
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{qrTitle || "QR Code"}</DialogTitle>
          </DialogHeader>
          {qrSrc && <img src={qrSrc} alt="qr" className="w-full h-auto" />}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!refreshRole}
        onOpenChange={(open) => !open && setRefreshRole(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Refresh Invite Token?</AlertDialogTitle>
            <AlertDialogDescription>
              This will invalidate the existing invite link and QR code for{" "}
              {refreshRole}. Users attempting to use the old link will no longer
              be able to join.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRefreshToken}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editTimeOpen} onOpenChange={setEditTimeOpen}>
        <DialogContent className="max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Event Duration</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1 justify-start font-normal min-w-0"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate">
                        {formatDateTime(selectedStartDate)}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 flex justify-center">
                    <DateCalendar
                      mode="single"
                      captionLayout="dropdown"
                      className="mx-auto"
                      fixedWeeks
                      defaultMonth={selectedStartDate || new Date()}
                      selected={selectedStartDate}
                      onSelect={(d) => {
                        if (d) {
                          setSelectedStartDate(d);
                        }
                      }}
                      formatters={{
                        formatMonthDropdown: (date) =>
                          date.toLocaleString(timeFormat, { month: "long" }),
                        formatYearDropdown: (date) =>
                          date.toLocaleDateString(timeFormat, {
                            year: "numeric",
                          }),
                      }}
                      disabled={(date) => {
                        if (event.endJoinDate) {
                          const d = new Date(event.endJoinDate);
                          if (date <= d) return true;
                        }
                        if (event.startJoinDate) {
                          const d = new Date(event.startJoinDate);
                          if (date <= d) return true;
                        }
                        return false;
                      }}
                    />
                  </PopoverContent>
                </Popover>
                <div className="relative w-full sm:w-32 shrink-0">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="time"
                    step="60"
                    className="pl-9"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1 justify-start font-normal min-w-0"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate">
                        {formatDateTime(selectedEndDate)}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 flex justify-center">
                    <DateCalendar
                      mode="single"
                      captionLayout="dropdown"
                      className="mx-auto"
                      fixedWeeks
                      defaultMonth={
                        selectedEndDate || selectedStartDate || new Date()
                      }
                      selected={selectedEndDate}
                      onSelect={(d) => {
                        if (d) {
                          setSelectedEndDate(d);
                        }
                      }}
                      disabled={
                        selectedStartDate
                          ? (date) => {
                              if (selectedStartDate && date < selectedStartDate)
                                return true;
                              return false;
                            }
                          : undefined
                      }
                      formatters={{
                        formatMonthDropdown: (date) =>
                          date.toLocaleString(timeFormat, { month: "long" }),
                        formatYearDropdown: (date) =>
                          String(date.getFullYear()),
                      }}
                    />
                  </PopoverContent>
                </Popover>
                <div className="relative w-full sm:w-32 shrink-0">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="time"
                    step="60"
                    className="pl-9"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTimeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTime} disabled={updatingTime}>
              {updatingTime ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editPresenterOpen} onOpenChange={setEditPresenterOpen}>
        <DialogContent className="max-w-[600px] max-h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-6 pb-2 shrink-0">
            <DialogTitle>Edit Presenter Info</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-4">
            {/* Zone 1: Submission Period */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
              <div className="space-y-1 pb-2 border-b border-border/50">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-primary" /> 1.
                  ช่วงเวลารับสมัคร (Submission Period)
                </h3>
                <p className="text-xs text-muted-foreground ml-6">
                  กำหนดวันและเวลาเริ่มต้น-สิ้นสุด ที่เปิดให้ผู้สมัคร (Presenter)
                  ส่งผลงานหรือลงทะเบียน
                </p>
              </div>

              <div className="space-y-2">
                <Label>Submission Start</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex-1 justify-start font-normal min-w-0"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate">
                          {formatDateTime(presenterStart)}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 flex justify-center">
                      <DateCalendar
                        mode="single"
                        captionLayout="dropdown"
                        className="mx-auto"
                        fixedWeeks
                        defaultMonth={presenterStart || new Date()}
                        selected={presenterStart}
                        onSelect={(d) => {
                          if (d) {
                            setPresenterStart(d);
                          }
                        }}
                        formatters={{
                          formatMonthDropdown: (date) =>
                            date.toLocaleString(timeFormat, { month: "long" }),
                          formatYearDropdown: (date) =>
                            String(date.getFullYear()),
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  <div className="relative w-full sm:w-32 shrink-0">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="time"
                      step="60"
                      className="pl-9"
                      value={presenterStartTime}
                      onChange={(e) => setPresenterStartTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Submission End</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex-1 justify-start font-normal min-w-0"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="truncate">
                            {formatDateTime(presenterEnd)}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 flex justify-center">
                        <DateCalendar
                          mode="single"
                          captionLayout="dropdown"
                          className="mx-auto"
                          fixedWeeks
                          defaultMonth={
                            presenterEnd || presenterStart || new Date()
                          }
                          selected={presenterEnd}
                          onSelect={(d) => {
                            if (d) {
                              setPresenterEnd(d);
                            }
                          }}
                          disabled={(date) => {
                            if (presenterStart && date < presenterStart)
                              return true;
                            if (event.startView) {
                              const d = new Date(event.startView);
                              if (date >= d) return true;
                            }
                            return false;
                          }}
                          formatters={{
                            formatMonthDropdown: (date) =>
                              date.toLocaleString(timeFormat, {
                                month: "long",
                              }),
                            formatYearDropdown: (date) =>
                              String(date.getFullYear()),
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    <div className="relative w-full sm:w-32 shrink-0">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="time"
                        step="60"
                        className="pl-9"
                        value={presenterEndTime}
                        onChange={(e) => setPresenterEndTime(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

              {/* Zone 2: Team Constraints */}
              <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                <div className="space-y-1 pb-2 border-b border-border/50">
                  <h3 className="font-semibold text-base flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" /> 2. ข้อมูลทีม
                    (Team Constraints)
                  </h3>
                  <p className="text-xs text-muted-foreground ml-6">
                    กำหนดจำนวนทีมที่รับสมัครสูงสุด และจำนวนสมาชิกต่อกลุ่ม
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Max Teams</Label>
                    <Input
                      type="number"
                      min="0"
                      value={maxTeams}
                      onChange={(e) => setMaxTeams(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Members per Group</Label>
                    <Input
                      type="number"
                      min="0"
                      value={maxTeamMembers}
                      onChange={(e) =>
                        setMaxTeamMembers(Number(e.target.value))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Zone 3: File Requirements */}
              <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                <div className="space-y-1 pb-2 border-b border-border/50">
                  <h3 className="font-semibold text-base flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" /> 3.
                    เอกสารที่ต้องส่ง (File Requirements)
                  </h3>
                  <p className="text-xs text-muted-foreground ml-6">
                    กำหนดรายการไฟล์ที่ผู้สมัครจำเป็นต้องอัปโหลด เช่น สไลด์นำเสนอ
                    หรือเอกสารประกอบ
                  </p>
                </div>

                {fileRequirements.map((req, index) => (
                  <div
                    key={req.id || index}
                    className="p-4 border rounded-lg bg-background space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1 mr-4">
                        <Label>Title</Label>
                        <Input
                          value={req.name}
                          onChange={(e) => {
                            const newReqs = [...fileRequirements];
                            newReqs[index].name = e.target.value;
                            setFileRequirements(newReqs);
                          }}
                          placeholder="e.g. Presentation Slides"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => {
                          const newReqs = [...fileRequirements];
                          newReqs.splice(index, 1);
                          setFileRequirements(newReqs);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>Description (Optional)</Label>
                      <Input
                        value={req.description || ""}
                        onChange={(e) => {
                          const newReqs = [...fileRequirements];
                          newReqs[index].description = e.target.value;
                          setFileRequirements(newReqs);
                        }}
                        placeholder="e.g. PDF format only"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Allowed Types</Label>
                      <div className="flex flex-wrap gap-4">
                        {Object.values(FileType).map((type) => (
                          <div
                            key={type}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`req-${index}-${type}`}
                              checked={req.allowedFileTypes.includes(type)}
                              onCheckedChange={(checked) => {
                                const newReqs = [...fileRequirements];
                                if (checked) {
                                  newReqs[index].allowedFileTypes.push(type);
                                } else {
                                  newReqs[index].allowedFileTypes = newReqs[
                                    index
                                  ].allowedFileTypes.filter((t) => t !== type);
                                }
                                setFileRequirements(newReqs);
                              }}
                            />
                            <label
                              htmlFor={`req-${index}-${type}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 uppercase"
                            >
                              {type}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                      <Checkbox
                        id={`req-${index}-required`}
                        checked={req.isRequired}
                        onCheckedChange={(checked) => {
                          const newReqs = [...fileRequirements];
                          newReqs[index].isRequired = !!checked;
                          setFileRequirements(newReqs);
                        }}
                      />
                      <label
                        htmlFor={`req-${index}-required`}
                        className="text-sm font-medium leading-none"
                      >
                        Required
                      </label>
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={() => {
                    setFileRequirements([
                      ...fileRequirements,
                      {
                        name: "",
                        description: "",
                        allowedFileTypes: [FileType.pdf],
                        isRequired: true,
                      },
                    ]);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add File Requirement
                </Button>
              </div>
            </div>
          <DialogFooter className="p-6 pt-2 shrink-0 bg-background z-10 border-t mt-auto">
            <Button
              variant="outline"
              onClick={() => setEditPresenterOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSavePresenter} disabled={updatingPresenter}>
              {updatingPresenter ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="lg:col-span-2 border-none shadow-md bg-gradient-to-br from-background to-muted/20">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold">
              <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                <Award className="h-5 w-5" />
              </div>
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Special Rewards
              </span>
            </CardTitle>
            {editable && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  handleEdit("rewards", {
                    specialRewards: (event?.specialRewards ?? []).map(
                      (r) => r.name
                    ),
                  })
                }
              >
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {rewards && rewards.length > 0 ? (
            <div className="space-y-4">
              {rewards.map((reward, index) => (
                <div
                  key={reward.id}
                  className="border rounded-lg p-4 space-y-4 bg-muted/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      Reward #{index + 1}
                    </span>
                    {editable && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteReward(reward.id)}
                        disabled={deletingId === reward.id}
                        title="Delete Reward"
                        aria-label="Delete Reward"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-24 sm:w-32">
                      {reward.image ? (
                        <div className="relative border rounded-lg overflow-hidden aspect-square bg-muted w-full">
                          <img
                            src={reward.image}
                            alt={reward.name}
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-border rounded-lg aspect-square bg-muted flex items-center justify-center">
                          <Gift className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="space-y-2">
                        <Label>Reward Name</Label>
                        <p className="font-medium text-base">{reward.name}</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                          {reward.description || "No description"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No special rewards added yet</p>
              <p className="text-sm">Contact organizer to add rewards</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
