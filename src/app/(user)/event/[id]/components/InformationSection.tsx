"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
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
  Edit,
  RefreshCcw,
  Link,
} from "lucide-react";
import { timeUntil, formatDateTime, UserAvatar } from "@/utils/function";
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
import Image from "next/image";

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

const getRewardFontSize = (val: number | undefined | null) => {
  const v = val ?? 0;
  const s = String(v);
  if (s.length > 8) return "text-2xl sm:text-3xl lg:text-4xl";
  if (s.length > 5) return "text-3xl sm:text-4xl lg:text-5xl";
  return "text-4xl sm:text-5xl lg:text-6xl";
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
  const { t, timeFormat } = useLanguage();

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
    } catch (e: unknown) {
      toast.error((e as Error)?.message || "Save failed");
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
    } catch (e: unknown) {
      toast.error((e as Error)?.message || "Save failed");
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
    } catch (e: unknown) {
      toast.error((e as Error)?.message || "Failed to delete reward");
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
      const roles: Array<"committee" | "presenter" | "guest"> = [
        "committee",
        "presenter",
        "guest",
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

  const organizers =
    event.participants?.filter((p) => p.eventGroup === "ORGANIZER") || [];
  const [organizerListOpen, setOrganizerListOpen] = useState(false);

  return (
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="lg:col-span-2 border-none shadow-md bg-linear-to-br from-background to-muted/20">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle className="text-xl font-bold">
              {t("information.eventDetails")}
            </CardTitle>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="h-full border-none shadow-md hover:shadow-lg transition-all duration-300 group flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold group-hover:text-primary transition-colors">
                <div className="p-2.5 rounded-xl bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300">
                  <Users className="h-5 w-5" />
                </div>
                Organizers
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="flex flex-col gap-4 h-full">
              {organizers.length > 0 ? (
                <div className="space-y-3 flex-1">
                  {organizers.slice(0, 3).map((org) => (
                    <div
                      key={org.id}
                      className="flex items-center gap-4 p-3 rounded-2xl"
                    >
                      <UserAvatar
                        user={org.user}
                        className="h-12 w-12 border-2 border-white shadow-sm ring-2 ring-pink-50"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-sm truncate text-foreground/90">
                          {org.user?.name || "Unknown"}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-(--role-organizer)"></span>
                          Event Organizer
                        </span>
                      </div>
                    </div>
                  ))}
                  {organizers.length > 3 && (
                    <div className="pl-4 text-xs font-medium text-(--role-organizer) flex items-center gap-1">
                      <div className="w-6 h-px bg-pink-200"></div>+{" "}
                      {organizers.length - 3} more organizers
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center space-y-4 bg-linear-to-b from-pink-50/50 to-transparent dark:from-pink-900/10 rounded-3xl border-2 border-dashed border-pink-200 dark:border-pink-900/30">
                  <div className="p-4 rounded-full bg-pink-100 dark:bg-pink-900/20 text-pink-500 dark:text-pink-400 shadow-inner">
                    <Users className="h-8 w-8" />
                  </div>
                  <div className="space-y-1 max-w-[200px] mx-auto">
                    <p className="text-base font-semibold text-foreground/80">
                      No organizers listed
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      This event currently has no assigned organizers visible here.
                    </p>
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full justify-between mt-auto border-(--role-organizer) hover:border-(--role-organizer) hover:text-(--role-organizer) hover:bg-(--role-organizer)/50 transition-all duration-300 group/btn"
                onClick={() => setOrganizerListOpen(true)}
              >
                View All Organizers
                <Users className="h-4 w-4 opacity-50 group-hover/btn:opacity-100 transition-opacity" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full border-none shadow-md hover:shadow-lg transition-all duration-300 group">
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold group-hover:text-primary transition-colors">
                <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  <Clock className="h-5 w-5" />
                </div>
                {t("information.eventDuration")}
              </CardTitle>
              {editable && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 rounded-full hover:bg-muted"
                  onClick={() => handleEdit("time", {})}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
                {(() => {
                  const now = new Date();
                  const sv = event?.startView
                    ? new Date(event.startView)
                    : undefined;
                  const ev = event?.endView
                    ? new Date(event.endView)
                    : undefined;

                  if (sv && now < sv) {
                    return (
                      <div className="text-center">
                        <div className="text-sm font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                          Starts In
                        </div>
                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                          {timeUntil(event.startView)}
                        </div>
                      </div>
                    );
                  }
                  if (sv && (!ev || now <= ev)) {
                    return (
                      <div className="text-center">
                        <div className="text-sm font-medium text-green-600 dark:text-green-400 uppercase tracking-wide mb-1">
                          Ends In
                        </div>
                        <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                          {event?.endView
                            ? timeUntil(event.endView)
                            : "Ongoing"}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className="text-center">
                      <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Status
                      </div>
                      <div className="text-xl font-bold text-muted-foreground">
                        Event Ended
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex flex-col items-center justify-center text-xs border">
                      <span className="font-bold">
                        {event?.startView
                          ? new Date(event.startView).getDate()
                          : "-"}
                      </span>
                      <span className="text-[10px] uppercase text-muted-foreground">
                        {event?.startView
                          ? new Date(event.startView).toLocaleString(
                              "default",
                              { month: "short" }
                            )
                          : "-"}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground uppercase font-medium">
                        {t("information.start")}
                      </span>
                      <span className="font-medium text-sm">
                        {event?.startView
                          ? formatDateTime(
                              new Date(event.startView),
                              timeFormat
                            )
                          : "-"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex flex-col items-center justify-center text-xs border">
                      <span className="font-bold">
                        {event?.endView
                          ? new Date(event.endView).getDate()
                          : "-"}
                      </span>
                      <span className="text-[10px] uppercase text-muted-foreground">
                        {event?.endView
                          ? new Date(event.endView).toLocaleString("default", {
                              month: "short",
                            })
                          : "-"}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground uppercase font-medium">
                        {t("information.end")}
                      </span>
                      <span className="font-medium text-sm">
                        {event?.endView
                          ? formatDateTime(new Date(event.endView), timeFormat)
                          : "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300 group overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold group-hover:text-primary transition-colors">
              <div className="p-2.5 rounded-xl bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                <MapPin className="h-5 w-5" />
              </div>
              {t("information.eventLocation")}
            </CardTitle>
            {editable && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 rounded-full hover:bg-muted"
                onClick={() =>
                  handleEdit("location", {
                    locationName: event?.locationName ?? "",
                    location: event?.location ?? "",
                  })
                }
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="font-medium px-1 text-lg">
            {event?.locationName ?? "No location specified"}
          </div>

          {event?.location ? (
            <div className="space-y-3">
              <div>
                <a
                  href={event.location}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline bg-primary/10 px-4 py-2 rounded-full hover:bg-primary/20 transition-colors"
                >
                  <Link className="h-4 w-4" />
                  Open in Link
                </a>
              </div>
            </div>
          ) : (
            <div className="h-48 rounded-xl bg-muted/30 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed">
              <MapPin className="h-10 w-10 mb-3 opacity-30" />
              <span className="text-sm font-medium">
                No map location available
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300 group">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold group-hover:text-(--role-presenter) transition-colors">
              <div className="p-2.5 rounded-xl bg-(--role-presenter)/10 text-(--role-presenter)">
                <Users className="h-5 w-5" />
              </div>
              {t("dashboard.presenterCount")}
            </CardTitle>
            {editable && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 rounded-full hover:bg-(--role-presenter)/10 hover:text-(--role-presenter)"
                onClick={() =>
                  handleEdit("presenter", {
                    startJoinDate: event?.startJoinDate ?? "",
                    endJoinDate: event?.endJoinDate ?? "",
                    maxTeams: event?.maxTeams ?? 0,
                    maxTeamMembers: event?.maxTeamMembers ?? 0,
                  })
                }
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Timeline Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-(--role-presenter) uppercase tracking-wider flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-(--role-presenter)"></span>
                Submission Timeline
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border bg-linear-to-br from-background to-(--role-presenter)/5 flex items-start gap-3 hover:border-(--role-presenter)/30 hover:shadow-md transition-all duration-300">
                  <div className="p-2 rounded-lg bg-white dark:bg-muted border shadow-sm text-(--role-presenter)">
                    <CalendarIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium mb-1">
                      {t("information.submissionStart")}
                    </div>
                    <div className="text-base font-bold text-foreground/90">
                      {event?.startJoinDate
                        ? formatDateTime(
                            new Date(event.startJoinDate),
                            timeFormat
                          )
                        : "-"}
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-xl border bg-linear-to-br from-background to-(--role-presenter)/5 flex items-start gap-3 hover:border-(--role-presenter)/30 hover:shadow-md transition-all duration-300">
                  <div className="p-2 rounded-lg bg-white dark:bg-muted border shadow-sm text-(--role-presenter)">
                    <CalendarIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium mb-1">
                      {t("information.submissionEnd")}
                    </div>
                    <div className="text-base font-bold text-foreground/90">
                      {event?.endJoinDate
                        ? formatDateTime(
                            new Date(event.endJoinDate),
                            timeFormat
                          )
                        : "-"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Constraints Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-(--role-presenter) uppercase tracking-wider flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-(--role-presenter)"></span>
                Constraints
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-(--role-presenter)/5 border border-(--role-presenter)/10 hover:bg-(--role-presenter)/10 transition-colors">
                  <div className="text-3xl font-black text-(--role-presenter)">
                    {event?.maxTeams ?? "-"}
                  </div>
                  <div className="text-xs text-muted-foreground font-bold uppercase mt-2 tracking-wide text-center">
                    {t("information.maxTeams")}
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-(--role-presenter)/5 border border-(--role-presenter)/10 hover:bg-(--role-presenter)/10 transition-colors">
                  <div className="text-3xl font-black text-(--role-presenter)">
                    {event?.maxTeamMembers ?? "-"}
                  </div>
                  <div className="text-xs text-muted-foreground font-bold uppercase mt-2 tracking-wide text-center">
                    {t("information.memberPerGroup")}
                  </div>
                </div>
              </div>
            </div>

            {/* File Requirements Section */}
            {event?.fileTypes && event.fileTypes.length > 0 && (
              <div className="space-y-3 pt-2">
                <h4 className="text-sm font-bold text-(--role-presenter) uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full bg-(--role-presenter)"></span>
                  File Requirements
                </h4>
                <div className="grid gap-3">
                  {event.fileTypes.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-4 p-4 rounded-xl border bg-card hover:bg-(--role-presenter)/5 hover:border-(--role-presenter)/30 transition-all duration-300 group/file"
                    >
                      <div className="p-2.5 rounded-lg bg-(--role-presenter)/10 text-(--role-presenter) group-hover/file:scale-110 transition-transform">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm">{file.name}</span>
                          {file.isRequired && (
                            <span className="text-[10px] font-extrabold text-white bg-(--role-presenter) px-2 py-0.5 rounded-full shadow-sm">
                              REQUIRED
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-mono bg-muted/50 px-2 py-1 rounded w-fit text-foreground/70">
                          {file.allowedFileTypes.join(", ").toUpperCase()}
                        </div>
                        {file.description && (
                          <div className="text-xs text-muted-foreground italic border-l-2 border-(--role-presenter)/20 pl-2">
                            {file.description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300 group">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold group-hover:text-primary transition-colors">
              <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                <Gift className="h-5 w-5" />
              </div>
              {t("information.rewardPoints")}
            </CardTitle>
            {editable && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 rounded-full hover:bg-muted"
                onClick={() =>
                  handleEdit("guest", {
                    guestReward: event?.virtualRewardGuest ?? 0,
                    committeeReward: event?.virtualRewardCommittee ?? 0,
                    unitReward: event?.unitReward ?? "coins",
                    hasCommittee: event?.hasCommittee ?? false,
                  })
                }
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className={`grid grid-cols-1 ${event?.hasCommittee ? "sm:grid-cols-2" : "sm:grid-cols-1"} gap-6`}>
            {event?.hasCommittee && (
            <div className="relative overflow-hidden flex flex-col justify-between p-6 rounded-3xl bg-linear-to-br from-(--role-committee) via-(--role-committee)/80 to-(--role-committee) text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-(--role-committee)/25 min-h-[180px] group/card">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/card:opacity-20 transition-opacity">
                <Gift className="h-40 w-40 rotate-12 -mr-12 -mt-12" />
              </div>
              <div className="relative z-10">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/20 text-xs font-bold uppercase tracking-widest mb-6 backdrop-blur-md border border-white/10">
                  <Award className="w-3 h-3" />
                  Committee Reward
                </span>
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0 overflow-hidden">
                  <span 
                    className={`${getRewardFontSize(event?.virtualRewardCommittee)} font-black tracking-tighter drop-shadow-md`}
                    title={String(event?.virtualRewardCommittee ?? 0)}
                  >
                    {event?.virtualRewardCommittee ?? 0}
                  </span>
                  <span className="text-xl font-bold opacity-90 capitalize shrink-0">
                    {event?.unitReward ?? "coins"}
                  </span>
                </div>
              </div>
              <div className="mt-4 text-xs font-medium opacity-80 relative z-10 flex items-center gap-2">
                <div className="w-8 h-1 rounded-full bg-white/30"></div>
                Base points
              </div>
            </div>
            )}

            <div className="relative overflow-hidden flex flex-col justify-between p-6 rounded-3xl bg-linear-to-br from-(--role-guest) via-(--role-guest)/80 to-(--role-guest) text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-(--role-guest)/25 min-h-[180px] group/card">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/card:opacity-20 transition-opacity">
                <Gift className="h-40 w-40 rotate-12 -mr-12 -mt-12" />
              </div>
              <div className="relative z-10">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/20 text-xs font-bold uppercase tracking-widest mb-6 backdrop-blur-md border border-white/10">
                  <Users className="w-3 h-3" />
                  Guest Reward
                </span>
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0 overflow-hidden">
                  <span 
                    className={`${getRewardFontSize(event?.virtualRewardGuest)} font-black tracking-tighter drop-shadow-md`}
                    title={String(event?.virtualRewardGuest ?? 0)}
                  >
                    {event?.virtualRewardGuest ?? 0}
                  </span>
                  <span className="text-xl font-bold opacity-90 capitalize shrink-0">
                    {event?.unitReward ?? "coins"}
                  </span>
                </div>
              </div>
              <div className="mt-4 text-xs font-medium opacity-80 relative z-10 flex items-center gap-2">
                <div className="w-8 h-1 rounded-full bg-white/30"></div>
                Base points
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {editable && (
        <Card className="lg:col-span-2 border-none shadow-md hover:shadow-lg transition-all duration-300 group">
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold group-hover:text-primary transition-colors">
                <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                  <Users className="h-5 w-5" />
                </div>
                Invite Links
              </CardTitle>
              <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                Share invite link for roles
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {["committee", "presenter", "guest"]
                .filter((r) => event?.hasCommittee || r !== "committee")
                .map((role) => {
                const r = role as "committee" | "presenter" | "guest";
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
                    className="flex flex-col lg:flex-row items-center justify-between gap-4 p-4 rounded-xl border bg-card hover:bg-muted/30 transition-all duration-200 hover:border-primary/20"
                  >
                    <div className="flex items-center gap-4 w-full lg:w-auto">
                      <div
                        className={`
                        w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm
                        ${
                          role === "presenter"
                            ? "bg-orange-500"
                            : role === "committee"
                            ? "bg-blue-500"
                            : "bg-green-500"
                        }
                      `}
                      >
                        {role[0].toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <div className="capitalize font-bold text-base">
                          {role}
                        </div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-xs">
                          {link}
                        </div>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-2 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-3 lg:pt-0 mt-1 lg:mt-0"
                      ref={qrRef}
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 gap-2"
                        onClick={() => {
                          if (!link) {
                            toast.error("Preparing invite link...");
                            return;
                          }
                          navigator.clipboard.writeText(link);
                          toast.success("Copied");
                        }}
                      >
                        <ClipboardCopy className="h-3.5 w-3.5" />
                        Copy Link
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Reset Token"
                        onClick={() => setRefreshRole(r)}
                      >
                        <RefreshCcw className="h-4 w-4" />
                      </Button>

                      <div className="h-8 w-px bg-border mx-1"></div>

                      {qrThumb ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="relative group/qr cursor-pointer"
                            onClick={async () => {
                              if (qrLargeUrl) {
                                setQrSrc(qrLargeUrl);
                                setQrTitle(`QR Code for ${role}`);
                                setQrOpen(true);
                                return;
                              }
                            }}
                          >
                            <Image
                              src={qrThumb}
                              alt={`qr-${role}`}
                              height={10}
                              width={10}
                              className="h-10 w-10 rounded border bg-white p-0.5 shadow-sm hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 rounded flex items-center justify-center opacity-0 group-hover/qr:opacity-100 transition-opacity">
                              <Users className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground animate-pulse">
                          QR...
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

      <Dialog open={organizerListOpen} onOpenChange={setOrganizerListOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Organizers</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2">
            {organizers.map((org) => (
              <div
                key={org.id}
                className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors"
              >
                <UserAvatar user={org.user} />
                <div>
                  <div className="font-medium">
                    {org.user?.name || "Unknown"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    @{org.user?.username}
                  </div>
                </div>
              </div>
            ))}
            {organizers.length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                No organizers found
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{qrTitle || "QR Code"}</DialogTitle>
          </DialogHeader>
          {qrSrc && (
            <Image
              src={qrSrc}
              alt="qr"
              height={300}
              width={300}
              className="w-full h-auto"
            />
          )}
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
        <DialogContent className="max-w-[600px] max-h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-6 pb-2 shrink-0">
            <DialogTitle>Edit Event Duration</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-4">
            <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
              <div className="space-y-1 pb-2 border-b border-border/50">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  ช่วงเวลาจัดงาน (Event Duration)
                </h3>
                <p className="text-xs text-muted-foreground ml-6">
                  กำหนดวันและเวลาเริ่มต้น-สิ้นสุด ของงานอีเวนต์
                </p>
              </div>

              <div className="space-y-2">
                <Label>Start Time (เวลาเริ่มงาน)</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex-1 justify-start font-normal min-w-0"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate">
                          {formatDateTime(selectedStartDate, timeFormat)}
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
                        onSelect={(d) => d && setSelectedStartDate(d)}
                        formatters={{
                          formatMonthDropdown: (date) =>
                            date.toLocaleString(timeFormat, { month: "long" }),
                          formatYearDropdown: (date) =>
                            date.toLocaleString(timeFormat, {
                              year: "numeric",
                            }),
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
                <Label>End Time (เวลาสิ้นสุดงาน)</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex-1 justify-start font-normal min-w-0"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate">
                          {formatDateTime(selectedEndDate, timeFormat)}
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
                        onSelect={(d) => d && setSelectedEndDate(d)}
                        disabled={(date) => {
                          if (selectedStartDate && date < selectedStartDate)
                            return true;
                          return false;
                        }}
                        formatters={{
                          formatMonthDropdown: (date) =>
                            date.toLocaleString(timeFormat, {
                              month: "long",
                            }),
                          formatYearDropdown: (date) =>
                            date.toLocaleString(timeFormat, {
                              year: "numeric",
                            }),
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
          </div>
          <DialogFooter className="p-6 pt-2 shrink-0 bg-background z-10 border-t mt-auto">
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
                          {formatDateTime(presenterStart, timeFormat)}
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
                            date.toLocaleString(timeFormat, {
                              year: "numeric",
                            }),
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
                            {formatDateTime(presenterEnd, timeFormat)}
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
                              date.toLocaleString(timeFormat, {
                                year: "numeric",
                              }),
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
                  <Users className="w-4 h-4 text-primary" /> 2. ข้อมูลทีม (Team
                  Constraints)
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
                    onChange={(e) => setMaxTeamMembers(Number(e.target.value))}
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
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={`req-${index}-${type}`}
                            checked={req.allowedFileTypes.includes(type)}
                            onCheckedChange={(checked) => {
                              const newReqs = [...fileRequirements];
                              if (checked) {
                                if (type === FileType.url) {
                                  newReqs[index].allowedFileTypes = [
                                    FileType.url,
                                  ];
                                } else {
                                  newReqs[index].allowedFileTypes = newReqs[
                                    index
                                  ].allowedFileTypes.filter(
                                    (t) => t !== FileType.url
                                  );
                                  newReqs[index].allowedFileTypes.push(type);
                                }
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

      <Card className="lg:col-span-2 border-none shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold">
              <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                <Award className="h-5 w-5" />
              </div>
              <span>{t("dashboard.specialAwards")}</span>
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
                          <Image
                            src={reward.image}
                            alt={reward.name}
                            fill
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
