"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Users, Gift, ClipboardCopy, Award, Trash2, Calendar as CalendarIcon, Save, X } from "lucide-react";
import { timeUntil, formatDateTime } from "@/utils/function";
import { timeFormat } from "@/utils/settings";
import { toast } from "sonner";
import type { EventData } from "@/utils/types";
import { useEffect, useRef, useState } from "react";
import { getInviteToken, updateEvent } from "@/utils/apievent";
import { deleteSpecialReward, getEvent } from "@/utils/apievent";
import { toPng } from "html-to-image";
import * as QRCode from "qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as DateCalendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

type EditSection = "description" | "time" | "location" | "presenter" | "guest" | "rewards";

type Props = {
  id: string;
  event: EventData;
  editable?: boolean;
  onEdit?: (section: EditSection, initialForm: Record<string, unknown>) => void;
  linkLabel?: string;
};

export default function InformationSection({ id, event, editable, onEdit, linkLabel = "Link" }: Props) {
  const router = useRouter();
  
  // Date/Time Editing State
  const [editTimeOpen, setEditTimeOpen] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | undefined>();
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
  const [updatingPresenter, setUpdatingPresenter] = useState(false);

  const handleEdit = (section: EditSection, initialForm: Record<string, unknown>) => {
    if (section === "time") {
        if (event.startView) {
            const d = new Date(event.startView);
            setSelectedStartDate(d);
            setStartTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
        } else {
            setSelectedStartDate(undefined);
            setStartTime("");
        }
        if (event.endView) {
            const d = new Date(event.endView);
            setSelectedEndDate(d);
            setEndTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
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
            setPresenterStartTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
        } else {
            setPresenterStart(undefined);
            setPresenterStartTime("");
        }
        if (event.endJoinDate) {
            const d = new Date(event.endJoinDate);
            setPresenterEnd(d);
            setPresenterEndTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
        } else {
            setPresenterEnd(undefined);
            setPresenterEndTime("");
        }
        setMaxTeams(event.maxTeams ?? 0);
        setMaxTeamMembers(event.maxTeamMembers ?? 0);
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
            const [h, m] = startTime.split(':').map(Number);
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
            const [h, m] = endTime.split(':').map(Number);
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
            const [h, m] = presenterStartTime.split(':').map(Number);
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
            const [h, m] = presenterEndTime.split(':').map(Number);
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
            maxTeamMembers: maxTeamMembers
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
        const roles: Array<"presenter" | "guest" | "committee"> = ["presenter", "guest", "committee"];
        const results = await Promise.all(
          roles.map((r) => getInviteToken(id, r).catch(() => null))
        );
        const map: { presenter?: string; guest?: string; committee?: string } = {};
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
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const roles: Array<"presenter" | "guest" | "committee"> = ["presenter", "guest", "committee"];
      const thumbMap: { presenter?: string; guest?: string; committee?: string } = {};
      const largeMap: { presenter?: string; guest?: string; committee?: string } = {};
      for (const r of roles) {
        const token = tokens[r];
        if (!token) continue;
        const link = `${origin}/event/${id}?invite=1&token=${encodeURIComponent(token)}`;
        try {
          const large = await QRCode.toDataURL(link, { errorCorrectionLevel: "M", width: 600 });
          const thumb = await QRCode.toDataURL(link, { errorCorrectionLevel: "M", width: 120 });
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
    role === "presenter" ? qrPresenterRef : role === "guest" ? qrGuestRef : qrCommitteeRef;
  const [qrOpen, setQrOpen] = useState(false);
  const [qrSrc, setQrSrc] = useState<string>("");
  const [qrTitle, setQrTitle] = useState<string>("");

  return (
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="lg:col-span-2 border-none shadow-md bg-gradient-to-br from-background to-muted/20">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle className="text-xl font-bold">
              Event Details
            </CardTitle>
            {editable && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleEdit("description", { eventDescription: event?.eventDescription ?? "" })}
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
                const sv = event?.startView ? new Date(event.startView) : undefined;
                const ev = event?.endView ? new Date(event.endView) : undefined;
                if (sv && now < sv) {
                  return (
                    <div className="font-bold text-xl">
                      Starts in
                      <h1 className="text-blue-600">{timeUntil(event.startView)}</h1>
                    </div>
                  );
                }
                if (sv && (!ev || now <= ev)) {
                  return (
                    <div className="font-bold text-xl">
                      Ends in
                      <h1 className="text-red-600">{event?.endView ? timeUntil(event.endView) : "Ongoing"}</h1>
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
                <span>{event?.startView ? formatDateTime(new Date(event.startView)) : "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">End:</span>
                <span>{event?.endView ? formatDateTime(new Date(event.endView)) : "-"}</span>
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
              <a href={(event?.location || "").replace(/`/g, "").trim()} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80 transition-colors">
                {linkLabel}
              </a>
            )}
            {event?.location && (event.location.includes("maps.app.goo.gl") || event.location.includes("google.com/maps")) && event?.locationName && (
              <div className="mt-4 w-full h-64 rounded-lg overflow-hidden border bg-muted shadow-inner">
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(event.locationName.trim())}&t=&z=15&ie=UTF8&output=embed`}
                  title="Location Map"
                ></iframe>
              </div>
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
              <span>{event?.startJoinDate ? formatDateTime(new Date(event.startJoinDate)) : "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Submission End:</span>
              <span>{event?.endJoinDate ? formatDateTime(new Date(event.endJoinDate)) : "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Max Teams:</span>
              <span>{event?.maxTeams ?? "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Members per Group:</span>
              <span>{event?.maxTeamMembers ?? "-"}</span>
            </div>
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
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Guest Reward:</span>
              <span className="font-medium text-amber-600">
                {event?.virtualRewardGuest ?? 0} {event?.unitReward ?? "coins"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Committee Reward:</span>
              <span className="font-medium text-amber-600">
                {event?.virtualRewardCommittee ?? 0} {event?.unitReward ?? "coins"}
              </span>
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
              <div className="text-sm text-muted-foreground">Share invite link for roles</div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {["presenter", "guest", "committee"].map((role) => {
                const r = role as "presenter" | "guest" | "committee";
                const origin = typeof window !== "undefined" ? window.location.origin : "";
                const token = tokens[r];
                const link = token ? `${origin}/event/${id}/invite?token=${encodeURIComponent(token)}` : `${origin}/event/${id}/invite?role=${encodeURIComponent(r)}`;
                const qrRef = refForRole(r);
                const qrThumb = qrThumbs[r] || "";
                const qrLargeUrl = qrLarge[r] || "";
                return (
                  <div key={role} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/30">
                    <div className="capitalize font-medium min-w-[100px]">{role}</div>
                    <div className="flex items-center gap-2" ref={qrRef}>
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
                          <img src={qrThumb} alt={`qr-${role}`} className="h-10 w-10 rounded border" />
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
                                const dataUrl = await toPng(node, { cacheBust: true, pixelRatio: 2 });
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
                        <span className="text-xs text-muted-foreground">Preparing...</span>
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
                                <Button variant="outline" className="flex-1 justify-start font-normal min-w-0">
                                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="truncate">{formatDateTime(selectedStartDate)}</span>
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
                                            date.toLocaleDateString(timeFormat, { year: "numeric" }),
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
                                <Button variant="outline" className="flex-1 justify-start font-normal min-w-0">
                                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="truncate">{formatDateTime(selectedEndDate)}</span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0 flex justify-center">
                                <DateCalendar
                                    mode="single"
                                    captionLayout="dropdown"
                                    className="mx-auto"
                                    fixedWeeks
                                    defaultMonth={selectedEndDate || selectedStartDate || new Date()}
                                    selected={selectedEndDate}
                                    onSelect={(d) => {
                                        if (d) {
                                            setSelectedEndDate(d);
                                        }
                                    }}
                                    disabled={
                                      selectedStartDate
                                        ? (date) => {
                                            if (selectedStartDate && date < selectedStartDate) return true;
                                            return false;
                                          }
                                        : undefined
                                    }
                                    formatters={{
                                        formatMonthDropdown: (date) =>
                                            date.toLocaleString(timeFormat, { month: "long" }),
                                        formatYearDropdown: (date) => String(date.getFullYear()),
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
                <Button variant="outline" onClick={() => setEditTimeOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveTime} disabled={updatingTime}>
                    {updatingTime ? "Saving..." : "Save"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editPresenterOpen} onOpenChange={setEditPresenterOpen}>
        <DialogContent className="max-w-[600px]">
            <DialogHeader>
                <DialogTitle>Edit Presenter Info</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
                <div className="space-y-2">
                    <Label>Submission Start</Label>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="flex-1 justify-start font-normal min-w-0">
                                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="truncate">{formatDateTime(presenterStart)}</span>
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
                                        formatYearDropdown: (date) => String(date.getFullYear()),
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
                </div>

                <div className="space-y-2">
                    <Label>Submission End</Label>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="flex-1 justify-start font-normal min-w-0">
                                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="truncate">{formatDateTime(presenterEnd)}</span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0 flex justify-center">
                                <DateCalendar
                                    mode="single"
                                    captionLayout="dropdown"
                                    className="mx-auto"
                                    fixedWeeks
                                    defaultMonth={presenterEnd || presenterStart || new Date()}
                                    selected={presenterEnd}
                                    onSelect={(d) => {
                                        if (d) {
                                            setPresenterEnd(d);
                                        }
                                    }}
                                    disabled={
                                      (date) => {
                                        if (presenterStart && date < presenterStart) return true;
                                        if (event.startView) {
                                          const d = new Date(event.startView);
                                          if (date >= d) return true;
                                        }
                                        return false;
                                      }
                                    }
                                    formatters={{
                                        formatMonthDropdown: (date) =>
                                            date.toLocaleString(timeFormat, { month: "long" }),
                                        formatYearDropdown: (date) => String(date.getFullYear()),
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
            <DialogFooter>
                <Button variant="outline" onClick={() => setEditPresenterOpen(false)}>Cancel</Button>
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
                    specialRewards: (event?.specialRewards ?? []).map((r) => r.name),
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
                <div key={reward.id} className="border rounded-lg p-4 space-y-4 bg-muted/30">
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
                        <p className="text-muted-foreground text-sm whitespace-pre-wrap">{reward.description || "No description"}</p>
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
