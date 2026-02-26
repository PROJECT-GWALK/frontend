"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Upload,
  Trash2,
  Plus,
  HelpCircle,
  Calendar as CalendarIcon,
  Clock,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import {
  updateEvent,
  createSpecialReward,
  updateSpecialReward,
  deleteSpecialReward,
  getEvent,
} from "@/utils/apievent";
import ImageCropDialog from "@/lib/image-crop-dialog";
import { autoResizeTextarea, toYYYYMMDD, formatDate } from "@/utils/function";
import type {
  EventData,
  EventEditSection,
  EventFormState,
  SpecialRewardEdit,
  EventFileType,
} from "@/utils/types";
import { FileType } from "@/utils/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as DateCalendar } from "@/components/ui/calendar";

type Props = {
  open: boolean;
  onClose: () => void;
  section: EventEditSection | null;
  form: EventFormState;
  setForm: React.Dispatch<React.SetStateAction<EventFormState>>;
  id: string;
  event: EventData | null;
  onEventUpdate: (event: EventData) => void;
};

export default function OrganizerEditDialog({
  open,
  onClose,
  section,
  form,
  setForm,
  id,
  event,
  onEventUpdate,
}: Props) {
  const { t, dateFormat } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [showCommitteeInput, setShowCommitteeInput] = useState(false);

  // Presenter editing state (File Types)
  const [ftList, setFtList] = useState<EventFileType[]>([]);

  // Special rewards editing state
  const [srList, setSrList] = useState<SpecialRewardEdit[]>([]);
  const [srPreviews, setSrPreviews] = useState<Record<string, string | null>>({});
  const rewardFileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [srCropOpen, setSrCropOpen] = useState(false);
  const [srCropSrc, setSrCropSrc] = useState<string | null>(null);
  const [srPendingMeta, setSrPendingMeta] = useState<{
    id: string;
    name: string;
    type: string;
  } | null>(null);
  const [removedRewardIds, setRemovedRewardIds] = useState<string[]>([]);
  const [rewardErrors, setRewardErrors] = useState<Record<string, string>>({});

  // Banner editing state
  const [bannerCropOpen, setBannerCropOpen] = useState(false);
  const [bannerCropSrc, setBannerCropSrc] = useState<string | null>(null);
  const [bannerPendingMeta, setBannerPendingMeta] = useState<{ name: string; type: string } | null>(
    null,
  );
  const [bannerPendingFile, setBannerPendingFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [removeBanner, setRemoveBanner] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [srDragState, setSrDragState] = useState<Record<string, boolean>>({});

  const handleSrDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSrDragState((prev) => ({ ...prev, [id]: true }));
  };

  const handleSrDragLeave = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSrDragState((prev) => ({ ...prev, [id]: false }));
  };

  const handleSrDrop = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSrDragState((prev) => ({ ...prev, [id]: false }));

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const url = URL.createObjectURL(file);
      setSrCropSrc(url);
      setSrPendingMeta({
        id: id,
        name: file.name,
        type: file.type,
      });
      setSrCropOpen(true);
    }
  };

  // Initialize state when section opens
  useEffect(() => {
    if (open) {
      if (section === "description") {
        setBannerPreview(event?.imageCover || null);
        setBannerPendingFile(null);
        setRemoveBanner(false);
      } else if (section === "guest") {
        const showCommittee =
          typeof form.hasCommittee === "boolean"
            ? form.hasCommittee
            : Number(form.committeeReward ?? 0) > 0;
        setShowCommitteeInput(showCommittee);
        setForm((prev) => ({
          ...prev,
          gradingEnabled: prev.gradingEnabled ?? event?.gradingEnabled ?? true,
          vrTeamCapEnabled: prev.vrTeamCapEnabled ?? event?.vrTeamCapEnabled ?? true,
          vrTeamCapGuest: prev.vrTeamCapGuest ?? event?.vrTeamCapGuest ?? 10,
          vrTeamCapCommittee: prev.vrTeamCapCommittee ?? event?.vrTeamCapCommittee ?? 20,
        }));
      } else if (section === "rewards" && event?.specialRewards) {
        // Initialize rewards list from event data
        const initialList: SpecialRewardEdit[] = event.specialRewards.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          image: r.image,
          voteCount: r.voteCount,
          teamCount: r.teamCount,
          _dirty: false,
        }));
        setSrList(initialList);
        setRemovedRewardIds([]);
        setRewardErrors({});
        setSrPreviews({});
      } else if (section === "presenter") {
        // Initialize File Types
        if (event?.fileTypes) {
          // Deep copy to avoid mutating props
          setFtList(JSON.parse(JSON.stringify(event.fileTypes)));
        } else {
          setFtList([]);
        }
      } else if (section === "time") {
        setForm((prev) => ({
          ...prev,
          startView: event?.startView,
          endView: event?.endView,
          startJoinDate: event?.startJoinDate,
          endJoinDate: event?.endJoinDate,
        }));
      } else if (section === "location") {
        setForm((prev) => ({
          ...prev,
          locationName: event?.locationName,
          location: event?.location,
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, section, event, setForm]);

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerPendingMeta({ name: file.name, type: file.type });
    const reader = new FileReader();
    reader.onload = () => {
      setBannerCropSrc(reader.result as string);
      setBannerCropOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = ""; // reset
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const event = {
        target: {
          files: [file],
          value: "dummy",
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleBannerFileChange(event);
    }
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const payload: Partial<EventData> = {};
      if (section === "location") {
        payload.locationName = form.locationName;
        payload.location = form.location;
      } else if (section === "time") {
        const toISO = (d?: string) => (d ? new Date(d).toISOString() : undefined);
        payload.startView = toISO(form.startView);
        payload.endView = toISO(form.endView);
        payload.startJoinDate = toISO(form.startJoinDate);
        payload.endJoinDate = toISO(form.endJoinDate);
      } else if (section === "presenter") {
        payload.maxTeams = form.maxTeams;
        payload.maxTeamMembers = form.maxTeamMembers;
        payload.fileTypes = ftList;
      } else if (section === "description") {
        if (bannerPendingFile || removeBanner) {
          const fd = new FormData();
          fd.append("eventDescription", form.eventDescription || "");
          if (bannerPendingFile) {
            fd.append("file", bannerPendingFile);
          }
          await updateEvent(id, fd, { removeImage: removeBanner });

          const fresh = await getEvent(id);
          if (fresh.message === "ok" && fresh.event) {
            onEventUpdate(fresh.event);
          }
          onClose();
          toast.success(t("toast.updated"));
          setSaving(false);
          return;
        }
        payload.eventDescription = form.eventDescription;
      } else if (section === "guest") {
        payload.virtualRewardGuest = Number(form.guestReward ?? 0);
        payload.virtualRewardCommittee = Number(form.committeeReward ?? 0);
        payload.hasCommittee = showCommitteeInput;
        payload.unitReward = form.unitReward;
        payload.gradingEnabled = form.gradingEnabled ?? true;
        payload.vrTeamCapEnabled = form.vrTeamCapEnabled ?? true;
        payload.vrTeamCapGuest = Math.max(0, Number(form.vrTeamCapGuest ?? 0));
        payload.vrTeamCapCommittee = Math.max(0, Number(form.vrTeamCapCommittee ?? 0));
      } else if (section === "rewards") {
        // handle create / update / delete of special rewards
        try {
          const errs: Record<string, string> = {};
          srList.forEach((r) => {
            if (!r.name || !String(r.name).trim()) errs[r.id] = "Name is required";
          });
          if (Object.keys(errs).length) {
            setRewardErrors(errs);
            toast.error(t("toast.fixRewardErrors"));
            setSaving(false);
            return;
          }

          for (const rid of removedRewardIds) {
            if (!String(rid).startsWith("temp-")) {
              await deleteSpecialReward(id, rid);
            }
          }

          for (const r of srList) {
            if (String(r.id).startsWith("temp-")) {
              if (r.pendingFile) {
                const fd = new FormData();
                fd.append("name", r.name || "");
                fd.append("description", r.description || "");
                fd.append("image", r.pendingFile);
                await createSpecialReward(id, fd);
              } else {
                await createSpecialReward(id, {
                  name: r.name || "",
                  description: r.description || "",
                });
              }
            } else {
              if (r.pendingFile || r.removeImage || r._dirty) {
                if (r.pendingFile) {
                  const fd = new FormData();
                  fd.append("name", r.name || "");
                  fd.append("description", r.description || "");
                  fd.append("image", r.pendingFile);
                  await updateSpecialReward(id, r.id, fd);
                } else {
                  const up: { name: string; description: string; image?: null } = {
                    name: r.name || "",
                    description: r.description || "",
                  };
                  if (r.removeImage) up.image = null;
                  await updateSpecialReward(id, r.id, up);
                }
              }
            }
          }

          try {
            const fresh = await getEvent(id);
            if (fresh.message === "ok" && fresh.event) {
              onEventUpdate(fresh.event);
            }
          } catch (e) {
            console.error("Failed to refresh event after rewards update", e);
          }

          toast.success(t("toast.updated"));
          onClose();
        } catch (e) {
          console.error(e);
          toast.error((e as Error)?.message || t("toast.saveRewardsFailed"));
        } finally {
          setSaving(false);
        }
        return;
      }

      await updateEvent(id, payload);
      if (section === "guest") {
        const fresh = await getEvent(id);
        if (fresh.message === "ok" && fresh.event) {
          onEventUpdate(fresh.event);
        }
        toast.success(t("toast.updated"));
        onClose();
        return;
      }
      if (event) onEventUpdate({ ...event, ...payload });
      toast.success(t("toast.updated"));
      onClose();
    } catch (e) {
      console.error(e);
      toast.error((e as Error)?.message || t("toast.updateFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) {
            onClose();
            setSrCropOpen(false);
            if (srCropSrc && srCropSrc.startsWith("blob:")) URL.revokeObjectURL(srCropSrc);
            setSrCropSrc(null);
            setSrPendingMeta(null);
          }
        }}
      >
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-lg">
          <DialogTitle>{t("eventDraft.editEvent")}</DialogTitle>
          <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto pr-2">
            {section === "location" && (
              <div className="grid grid-cols-1 gap-2">
                <Label>{t("eventInfo.locationVenue")}</Label>
                <Input
                  value={form.locationName || ""}
                  onChange={(e) => setForm((f) => ({ ...f, locationName: e.target.value }))}
                  placeholder={t("eventDraft.placeholderLocationVenue")}
                />
                <div className="flex items-center gap-2">
                  <Label>{t("eventInfo.locationLink")}</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p className="text-sm whitespace-pre-line leading-relaxed">
                          {t("eventInfo.locationLinkHelp")}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  value={form.location || ""}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder={t("eventDraft.placeholderLocationLink")}
                />
              </div>
            )}

            {section === "time" && (
              <div className="space-y-8">
                {(() => {
                  // Parse dates for logic
                  const selectedStart = form.startView ? new Date(form.startView) : undefined;
                  const selectedEnd = form.endView ? new Date(form.endView) : undefined;
                  const selectedSubStart = form.startJoinDate
                    ? new Date(form.startJoinDate)
                    : undefined;
                  const selectedSubEnd = form.endJoinDate ? new Date(form.endJoinDate) : undefined;

                  // Helpers
                  const getTime = (val: string | undefined | null) => {
                    if (!val) return "00:00";
                    const date = new Date(val);
                    if (isNaN(date.getTime())) return "00:00";
                    const hours = date.getHours().toString().padStart(2, "0");
                    const minutes = date.getMinutes().toString().padStart(2, "0");
                    return `${hours}:${minutes}`;
                  };

                  const updateDate = (
                    field: keyof EventFormState,
                    date: Date | undefined,
                    timeStr: string,
                  ) => {
                    if (!date) return;
                    const dStr = toYYYYMMDD(date);
                    setForm((prev) => ({ ...prev, [field]: `${dStr}T${timeStr}` }));
                  };

                  const updateTime = (
                    field: keyof EventFormState,
                    date: Date | undefined,
                    newTime: string,
                  ) => {
                    const dStr = date ? toYYYYMMDD(date) : toYYYYMMDD(new Date());
                    setForm((prev) => ({ ...prev, [field]: `${dStr}T${newTime}` }));
                  };

                  return (
                    <>
                      {/* Event Period Section */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 font-semibold text-lg">
                          <Clock className="h-5 w-5" />
                          {t("eventInfo.eventTimePeriod")}
                        </div>

                        {/* Event Start */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>{t("eventInfo.startDate")}</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start text-left font-normal"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                                  {formatDate(selectedStart, t("eventTime.selectDate"), dateFormat)}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="p-0 flex justify-center">
                                <DateCalendar
                                  mode="single"
                                  captionLayout="dropdown"
                                  className="mx-auto"
                                  fixedWeeks
                                  defaultMonth={selectedStart || new Date()}
                                  selected={selectedStart}
                                  onSelect={(d) =>
                                    updateDate("startView", d, getTime(form.startView))
                                  }
                                  // SubmissionDateEnd > EventStart
                                  disabled={
                                    selectedSubEnd || selectedSubStart
                                      ? (date) => {
                                          // Event can start on same day as Submission end
                                          if (
                                            selectedSubEnd &&
                                            date <= new Date(selectedSubEnd.setHours(0, 0, 0, 0))
                                          )
                                            return true;
                                          if (
                                            selectedSubStart &&
                                            date < new Date(selectedSubStart.setHours(0, 0, 0, 0))
                                          )
                                            return true;
                                          return false;
                                        }
                                      : undefined
                                  }
                                  formatters={{
                                    formatMonthDropdown: (date) =>
                                      date.toLocaleString(dateFormat, { month: "long" }),
                                    formatYearDropdown: (date) =>
                                      date.toLocaleDateString(dateFormat, { year: "numeric" }),
                                  }}
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="space-y-2">
                            <Label>{t("eventInfo.startTime")}</Label>
                            <div className="relative">
                              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="time"
                                value={getTime(form.startView)}
                                onChange={(e) =>
                                  updateTime("startView", selectedStart, e.target.value)
                                }
                                className="pl-10"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Event End */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>{t("eventInfo.endDate")}</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start text-left font-normal"
                                  disabled={!selectedStart}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                                  {formatDate(selectedEnd, t("eventTime.selectDate"), dateFormat)}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="p-0 flex justify-center">
                                <DateCalendar
                                  mode="single"
                                  captionLayout="dropdown"
                                  className="mx-auto"
                                  fixedWeeks
                                  defaultMonth={selectedEnd || selectedStart || new Date()}
                                  selected={selectedEnd}
                                  onSelect={(d) => updateDate("endView", d, getTime(form.endView))}
                                  disabled={
                                    selectedStart
                                      ? (date) =>
                                          date < new Date(selectedStart.setHours(0, 0, 0, 0))
                                      : undefined
                                  }
                                  formatters={{
                                    formatMonthDropdown: (date) =>
                                      date.toLocaleString(dateFormat, { month: "long" }),
                                    formatYearDropdown: (date) =>
                                      date.toLocaleDateString(dateFormat, { year: "numeric" }),
                                  }}
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="space-y-2">
                            <Label>{t("eventInfo.endTime")}</Label>
                            <div className="relative">
                              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="time"
                                value={getTime(form.endView)}
                                onChange={(e) => updateTime("endView", selectedEnd, e.target.value)}
                                className="pl-10"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Submission Period Section */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 font-semibold text-lg">
                          <CalendarIcon className="h-5 w-5" />
                          {t("eventTime.submissionPeriod")}
                        </div>

                        {/* Submission Start */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>{t("eventTime.submissionStartDate")}</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start text-left font-normal"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                                  {formatDate(
                                    selectedSubStart,
                                    t("eventTime.selectDate"),
                                    dateFormat,
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="p-0 flex justify-center">
                                <DateCalendar
                                  mode="single"
                                  captionLayout="dropdown"
                                  className="mx-auto"
                                  fixedWeeks
                                  defaultMonth={selectedSubStart || new Date()}
                                  selected={selectedSubStart}
                                  onSelect={(d) =>
                                    updateDate("startJoinDate", d, getTime(form.startJoinDate))
                                  }
                                  // SubmissionDateStart <= SubmissionDateEnd
                                  disabled={(date) => {
                                    // If submission end is set, start cannot be after end
                                    if (
                                      selectedSubEnd &&
                                      date > new Date(selectedSubEnd.setHours(0, 0, 0, 0))
                                    )
                                      return true;
                                    // If event start is set, submission start cannot be after event start
                                    if (
                                      selectedStart &&
                                      date > new Date(selectedStart.setHours(0, 0, 0, 0))
                                    )
                                      return true;
                                    return false;
                                  }}
                                  formatters={{
                                    formatMonthDropdown: (date) =>
                                      date.toLocaleString(dateFormat, { month: "long" }),
                                    formatYearDropdown: (date) =>
                                      date.toLocaleDateString(dateFormat, { year: "numeric" }),
                                  }}
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="space-y-2">
                            <Label>{t("eventInfo.startTime")}</Label>
                            <div className="relative">
                              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="time"
                                value={getTime(form.startJoinDate)}
                                onChange={(e) =>
                                  updateTime("startJoinDate", selectedSubStart, e.target.value)
                                }
                                className="pl-10"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Submission End */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>{t("eventTime.submissionEndDate")}</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start text-left font-normal"
                                  disabled={!selectedSubStart}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                                  {formatDate(
                                    selectedSubEnd,
                                    t("eventTime.selectDate"),
                                    dateFormat,
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="p-0 flex justify-center">
                                <DateCalendar
                                  mode="single"
                                  captionLayout="dropdown"
                                  className="mx-auto"
                                  fixedWeeks
                                  defaultMonth={selectedSubEnd || selectedSubStart || new Date()}
                                  selected={selectedSubEnd}
                                  onSelect={(d) =>
                                    updateDate("endJoinDate", d, getTime(form.endJoinDate))
                                  }
                                  disabled={
                                    selectedSubStart || selectedStart
                                      ? (date) => {
                                          // Can end on same day as start, but not before
                                          if (
                                            selectedSubStart &&
                                            date < new Date(selectedSubStart.setHours(0, 0, 0, 0))
                                          )
                                            return true;
                                          // Submission end can be on same day as Event start
                                          if (
                                            selectedStart &&
                                            date >= new Date(selectedStart.setHours(0, 0, 0, 0))
                                          )
                                            return true;
                                          return false;
                                        }
                                      : undefined
                                  }
                                  formatters={{
                                    formatMonthDropdown: (date) =>
                                      date.toLocaleString(dateFormat, { month: "long" }),
                                    formatYearDropdown: (date) =>
                                      date.toLocaleDateString(dateFormat, { year: "numeric" }),
                                  }}
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="space-y-2">
                            <Label>{t("eventInfo.endTime")}</Label>
                            <div className="relative">
                              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="time"
                                value={getTime(form.endJoinDate)}
                                onChange={(e) =>
                                  updateTime("endJoinDate", selectedSubEnd, e.target.value)
                                }
                                className="pl-10"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />
                    </>
                  );
                })()}
              </div>
            )}

            {section === "description" && (
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label className="font-semibold text-lg">{t("eventInfo.eventBanner")}</Label>
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden group">
                    {bannerPreview ? (
                      <div className="relative w-full h-full border rounded-lg overflow-hidden">
                        <Image
                          src={bannerPreview}
                          alt="Banner preview"
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => bannerInputRef.current?.click()}
                          >
                            {t("eventInfo.change")}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setBannerPreview(null);
                              setBannerPendingFile(null);
                              setRemoveBanner(true);
                            }}
                          >
                            {t("eventInfo.remove")}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`flex flex-col items-center justify-center w-full h-full cursor-pointer transition-colors border-2 border-dashed rounded-lg ${
                          isDragging
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50 hover:bg-muted/80"
                        }`}
                        onClick={() => bannerInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">
                          {t("eventDraft.cropTitle")}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("eventInfo.clickToUpload")}
                        </p>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={bannerInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleBannerFileChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold text-lg">{t("eventInfo.eventDescription")}</Label>
                  <Textarea
                    ref={(el) => autoResizeTextarea(el)}
                    value={form.eventDescription || ""}
                    onChange={(e) => {
                      autoResizeTextarea(e.target);
                      setForm((f) => ({ ...f, eventDescription: e.target.value }));
                    }}
                    className="resize-none overflow-hidden mb-4"
                    placeholder={t("eventDraft.placeholderEventDescription")}
                  />
                </div>
              </div>
            )}

            {section === "guest" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-2">
                  <Label>{t("configuration.rewardUnit")}</Label>
                  <Input
                    value={form.unitReward || ""}
                    onChange={(e) => setForm((f) => ({ ...f, unitReward: e.target.value }))}
                    placeholder={t("configuration.placeholderUnitReward")}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasCommittee"
                    checked={showCommitteeInput}
                    onCheckedChange={(checked) => setShowCommitteeInput(checked === true)}
                  />
                  <Label htmlFor="hasCommittee">{t("configuration.hasCommittee")}</Label>
                </div>

                {showCommitteeInput && (
                  <div className="grid grid-cols-1 gap-2 pl-6 border-l-2 border-primary/20">
                    <Label>{t("rewardsCard.committeeReward")}</Label>
                    <Input
                      type="number"
                      value={form.committeeReward ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          setForm((f) => ({ ...f, committeeReward: undefined }));
                          return;
                        }
                        const num = Number(val);
                        if (!isNaN(num)) {
                          setForm((f) => ({ ...f, committeeReward: num }));
                        }
                      }}
                      placeholder={t("configuration.placeholderCommitteeReward")}
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                )}
                <div className="grid grid-cols-1 gap-2">
                  <Label>{t("configuration.amountPerGuest")}</Label>
                  <Input
                    type="number"
                    value={form.guestReward ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        setForm((f) => ({ ...f, guestReward: undefined }));
                        return;
                      }
                      const num = Number(val);
                      if (!isNaN(num)) {
                        setForm((f) => ({ ...f, guestReward: num }));
                      }
                    }}
                    placeholder={t("configuration.placeholderGuestReward")}
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div className="space-y-3 rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="text-sm font-semibold">
                        {t("configuration.vrTeamCapTitle")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t("configuration.vrTeamCapSubtitle")}
                      </div>
                    </div>
                    <Checkbox
                      id="vrTeamCapEnabled"
                      checked={form.vrTeamCapEnabled ?? true}
                      onCheckedChange={(checked) =>
                        setForm((f) => ({ ...f, vrTeamCapEnabled: checked === true }))
                      }
                    />
                  </div>

                  {(form.vrTeamCapEnabled ?? true) ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 gap-2">
                        <Label>{t("configuration.vrTeamCapGuest")}</Label>
                        <Input
                          type="number"
                          min={0}
                          value={form.vrTeamCapGuest ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "") {
                              setForm((f) => ({ ...f, vrTeamCapGuest: undefined }));
                              return;
                            }
                            const num = Number(val);
                            if (!isNaN(num)) {
                              setForm((f) => ({ ...f, vrTeamCapGuest: num }));
                            }
                          }}
                          placeholder={t("configuration.placeholderVrTeamCapGuest")}
                          className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>

                      {showCommitteeInput && (
                        <div className="grid grid-cols-1 gap-2">
                          <Label>{t("configuration.vrTeamCapCommittee")}</Label>
                          <Input
                            type="number"
                            min={0}
                            value={form.vrTeamCapCommittee ?? ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "") {
                                setForm((f) => ({
                                  ...f,
                                  vrTeamCapCommittee: undefined,
                                }));
                                return;
                              }
                              const num = Number(val);
                              if (!isNaN(num)) {
                                setForm((f) => ({ ...f, vrTeamCapCommittee: num }));
                              }
                            }}
                            placeholder={t("configuration.placeholderVrTeamCapCommittee")}
                            className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
                <div className="space-y-3 rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="text-sm font-semibold">
                        {t("configuration.gradingEnabled")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t("configuration.gradingEnabledSubtitle")}
                      </div>
                    </div>
                    <Checkbox
                      id="gradingEnabled"
                      checked={form.gradingEnabled ?? true}
                      onCheckedChange={(checked) =>
                        setForm((f) => ({ ...f, gradingEnabled: checked === true }))
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {section === "presenter" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <h3 className="col-span-2 mb-2 font-semibold text-lg">
                    {t("configuration.presenterConfig")}
                  </h3>
                  <div className="space-y-2">
                    <Label>{t("configuration.maxGroups")}</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.maxTeams ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          setForm((f) => ({ ...f, maxTeams: undefined }));
                          return;
                        }
                        const num = Number(val);
                        if (!isNaN(num)) {
                          setForm((f) => ({ ...f, maxTeams: num }));
                        }
                      }}
                      placeholder={t("configuration.placeholderMaxGroups")}
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("configuration.membersPerGroup")}</Label>
                    <Input
                      type="number"
                      min={1}
                      value={form.maxTeamMembers ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          setForm((f) => ({ ...f, maxTeamMembers: undefined }));
                          return;
                        }
                        const num = Number(val);
                        if (!isNaN(num)) {
                          setForm((f) => ({ ...f, maxTeamMembers: num }));
                        }
                      }}
                      placeholder={t("configuration.placeholderMaxPresenters")}
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="font-semibold text-lg">
                      {t("configuration.fileRequirements")}
                    </Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setFtList((prev) => [
                          ...prev,
                          {
                            id: `temp-${Date.now()}`,
                            name: "",
                            description: "",
                            allowedFileTypes: [FileType.pdf],
                            isRequired: true,
                          },
                        ]);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" /> {t("configuration.addFileReq")}
                    </Button>
                  </div>

                  {ftList.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground border border-dashed rounded-lg">
                      {t("projectDetail.files.noRequirements")}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {ftList.map((ft, idx) => (
                        <div
                          key={ft.id || idx}
                          className="p-4 border rounded-lg space-y-3 bg-card relative"
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => setFtList((prev) => prev.filter((_, i) => i !== idx))}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>

                          <div className="space-y-2">
                            <Label>{t("configuration.reqTitle")}</Label>
                            <Input
                              value={ft.name}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFtList((prev) =>
                                  prev.map((item, i) =>
                                    i === idx ? { ...item, name: val } : item,
                                  ),
                                );
                              }}
                              placeholder={t("configuration.placeholderReqName")}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>{t("configuration.reqDescription")}</Label>
                            <Input
                              value={ft.description || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFtList((prev) =>
                                  prev.map((item, i) =>
                                    i === idx ? { ...item, description: val } : item,
                                  ),
                                );
                              }}
                              placeholder={t("configuration.placeholderReqDesc")}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>{t("configuration.allowedTypes")}</Label>
                            <div className="flex flex-wrap gap-4">
                              {Object.values(FileType).map((type) => (
                                <div key={type} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`ft-${idx}-${type}`}
                                    checked={ft.allowedFileTypes.includes(type)}
                                    onCheckedChange={(checked) => {
                                      setFtList((prev) =>
                                        prev.map((item, i) => {
                                          if (i !== idx) return item;
                                          let types = [...item.allowedFileTypes];
                                          if (checked) {
                                            if (type === FileType.url) {
                                              types = [FileType.url];
                                            } else {
                                              types = types.filter((t) => t !== FileType.url);
                                              types.push(type);
                                            }
                                          } else {
                                            if (types.length <= 1) return item;
                                            types = types.filter((t) => t !== type);
                                          }
                                          return { ...item, allowedFileTypes: types };
                                        }),
                                      );
                                    }}
                                  />
                                  <label
                                    htmlFor={`ft-${idx}-${type}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 uppercase"
                                  >
                                    {type}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`req-${idx}`}
                              checked={ft.isRequired}
                              onCheckedChange={(checked) => {
                                setFtList((prev) =>
                                  prev.map((item, i) =>
                                    i === idx ? { ...item, isRequired: checked === true } : item,
                                  ),
                                );
                              }}
                            />
                            <label htmlFor={`req-${idx}`} className="text-sm font-medium">
                              {t("configuration.required")}
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {section === "rewards" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-lg">{t("rewardsSection.specialRewards")}</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const tempId = `temp-${Date.now()}`;
                      setSrList((prev) => [
                        ...prev,
                        { id: tempId, name: "", description: "", _dirty: true },
                      ]);
                    }}
                  >
                    + {t("rewardsSection.addReward")}
                  </Button>
                </div>

                {srList.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    {t("rewardsSection.noRewards")}
                  </div>
                ) : (
                  srList.map((reward) => (
                    <div
                      key={reward.id}
                      className="relative p-4 rounded-lg border bg-card space-y-4"
                    >
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          setSrList((prev) => prev.filter((r) => r.id !== reward.id));
                          if (!String(reward.id).startsWith("temp-")) {
                            setRemovedRewardIds((prev) => [...prev, reward.id]);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>

                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Image Upload for Reward */}
                        <div className="w-full sm:w-32 shrink-0 flex flex-col gap-2">
                          {srPreviews[reward.id] || (reward.image && !reward.removeImage) ? (
                            <>
                              <div className="relative aspect-square w-full rounded-md overflow-hidden border">
                                <Image
                                  src={srPreviews[reward.id] || reward.image || ""}
                                  alt={reward.name || "Reward"}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="flex gap-1 justify-center">
                                <Button
                                  size="icon"
                                  variant="destructive"
                                  aria-label="Remove image"
                                  title="Remove"
                                  className="h-6 w-6"
                                  onClick={() => {
                                    setSrList((prev) =>
                                      prev.map((r) =>
                                        r.id === reward.id
                                          ? {
                                              ...r,
                                              pendingFile: undefined,
                                              preview: null,
                                              removeImage: !!r.image,
                                            }
                                          : r,
                                      ),
                                    );
                                    setSrPreviews((p) => {
                                      const np = { ...p };
                                      delete np[reward.id];
                                      return np;
                                    });
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div
                                className={`relative w-full cursor-pointer rounded-lg ${
                                  srDragState[reward.id] ? "ring-2 ring-primary bg-primary/10" : ""
                                }`}
                                onClick={() => rewardFileRefs.current[reward.id]?.click()}
                                onDragOver={(e) => handleSrDragOver(e, reward.id)}
                                onDragLeave={(e) => handleSrDragLeave(e, reward.id)}
                                onDrop={(e) => handleSrDrop(e, reward.id)}
                              >
                                <div
                                  className={`border-2 border-dashed rounded-lg transition-colors aspect-square overflow-hidden ${
                                    srDragState[reward.id]
                                      ? "border-primary"
                                      : "border-border hover:border-primary/50"
                                  }`}
                                >
                                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3 sm:p-6">
                                    <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground mb-2" />
                                    <p className="text-[10px] sm:text-sm text-muted-foreground hidden sm:block">
                                      {t("eventInfo.clickToUpload")}
                                    </p>
                                    <p className="text-[9px] sm:text-xs text-muted-foreground mt-1 hidden sm:block">
                                      PNG, JPG, GIF
                                    </p>
                                  </div>
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    ref={(el) => {
                                      rewardFileRefs.current[reward.id] = el;
                                      if (el) {
                                        el.onchange = (e: Event) => {
                                          const target = e.target as HTMLInputElement;
                                          const f = target.files?.[0];
                                          if (!f) return;
                                          const url = URL.createObjectURL(f);
                                          setSrCropSrc(url);
                                          setSrPendingMeta({
                                            id: reward.id,
                                            name: f.name,
                                            type: f.type,
                                          });
                                          setSrCropOpen(true);
                                        };
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="mt-2 flex items-center justify-center sm:hidden">
                                <Button
                                  size="icon"
                                  variant="secondary"
                                  aria-label="Upload image"
                                  title={t("eventInfo.clickToUpload")}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    rewardFileRefs.current[reward.id]?.click();
                                  }}
                                >
                                  <Upload className="h-4 w-4" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>

                        <div className="flex-1 space-y-3">
                          <div className="space-y-2">
                            <Label>{t("rewardsSection.rewardName")}</Label>
                            <Input
                              placeholder={t("rewardsSection.placeholderRewardName")}
                              value={reward.name}
                              onChange={(e) =>
                                setSrList((prev) =>
                                  prev.map((r) =>
                                    r.id === reward.id
                                      ? {
                                          ...r,
                                          name: e.target.value,
                                          _dirty: !String(r.id).startsWith("temp-")
                                            ? true
                                            : r._dirty,
                                        }
                                      : r,
                                  ),
                                )
                              }
                            />
                            {rewardErrors && rewardErrors[reward.id] && (
                              <p className="text-xs text-destructive mt-1">
                                {rewardErrors[reward.id]}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <Label>{t("rewardsSection.rewardDescription")}</Label>
                              <span className="text-xs text-muted-foreground">
                                {(reward.description || "").length}/60
                              </span>
                            </div>
                            <Textarea
                              ref={(el) => autoResizeTextarea(el)}
                              placeholder={t("rewardsSection.placeholderRewardDesc")}
                              value={reward.description ?? ""}
                              maxLength={60}
                              onChange={(e) => {
                                autoResizeTextarea(e.target);
                                setSrList((prev) =>
                                  prev.map((r) =>
                                    r.id === reward.id
                                      ? {
                                          ...r,
                                          description: e.target.value,
                                          _dirty: !String(r.id).startsWith("temp-")
                                            ? true
                                            : r._dirty,
                                        }
                                      : r,
                                  ),
                                );
                              }}
                              className="resize-none overflow-hidden"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="secondary" onClick={onClose}>
              {t("dialog.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {t("dialog.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Cropper for Special Rewards */}
      <ImageCropDialog
        open={srCropOpen}
        onOpenChange={setSrCropOpen}
        src={srCropSrc}
        aspect={1} // Square for rewards
        onConfirm={(file, previewUrl) => {
          if (srPendingMeta && file) {
            setSrPreviews((prev) => ({
              ...prev,
              [srPendingMeta.id]: previewUrl,
            }));
            setSrList((prev) =>
              prev.map((r) =>
                r.id === srPendingMeta.id
                  ? {
                      ...r,
                      pendingFile: file,
                      _dirty: !String(r.id).startsWith("temp-"),
                      removeImage: false,
                    }
                  : r,
              ),
            );
          }
          setSrCropOpen(false);
          setSrPendingMeta(null);
        }}
        onCancel={() => {
          setSrCropOpen(false);
          setSrPendingMeta(null);
        }}
      />

      {/* Image Cropper for Event Banner */}
      <ImageCropDialog
        open={bannerCropOpen}
        onOpenChange={setBannerCropOpen}
        src={bannerCropSrc}
        aspect={16 / 9} // 16:9 for banner
        onConfirm={(file, previewUrl) => {
          if (bannerPendingMeta && file) {
            setBannerPendingFile(file);
            setBannerPreview(previewUrl);
            setRemoveBanner(false);
          }
          setBannerCropOpen(false);
          setBannerPendingMeta(null);
        }}
        onCancel={() => {
          setBannerCropOpen(false);
          setBannerPendingMeta(null);
        }}
      />
    </>
  );
}
