"use client";
import { useEffect, useState, useRef, type ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar as CalendarIcon,
  Users,
  ArrowLeft,
  Info,
  UserCheck,
  Award,
  Save,
  Loader2,
  BookOpen,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EventSidebar } from "@/app/(user)/event/[id]/draft/EventSidebar";

import { validateEventTime, toDate, getDateTimeString } from "@/utils/function";
import {
  getEvent,
  publishEvent,
  updateEvent,
  checkEventName,
  deleteEvent,
  createSpecialReward,
  updateSpecialReward,
  deleteSpecialReward,
} from "@/utils/apievent";

import { EventDetail, EventFileType } from "@/utils/types";
import { toast } from "sonner";
import { AxiosError } from "axios";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import DeleteSuccessDialog from "./DeleteSuccessDialog";
import Card1 from "./Card1";
import Card2 from "./Card2";
import Card3 from "./Card3";
import Card4 from "./Card4";
import Card5, { type GradingCriteria } from "./Card5";
import { useLanguage } from "@/contexts/LanguageContext";

type SpecialReward = {
  id: string;
  name: string;
  description: string;
  image?: string | null;
};

type EventUpdatePayload = {
  eventName: string;
  eventDescription: string;
  location: string;
  locationName: string;
  publicView: boolean;
  startView: string | null;
  endView: string | null;
  startJoinDate: string | null;
  endJoinDate: string | null;
  maxTeamMembers: number | null;
  maxTeams: number | null;
  virtualRewardGuest: number;
  virtualRewardCommittee: number;
  hasCommittee: boolean;
  specialRewards: SpecialReward[];
  unitReward?: string | null;
  fileTypes?: EventFileType[];
};

const BANNER_MAX_SIZE = 20 * 1024 * 1024; // 20MB
const BANNER_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function EventDraft() {
  const { t } = useLanguage();
  const params = useParams();
  const id = (params?.id as string) ?? "";
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("card1");

  // Event Information
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventBanner, setEventBanner] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [pendingFileMeta, setPendingFileMeta] = useState<{
    name: string;
    type: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bannerRemoved, setBannerRemoved] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedStart, setSelectedStart] = useState<Date | undefined>(undefined);
  const [selectedEnd, setSelectedEnd] = useState<Date | undefined>(undefined);

  const [locationPlace, setLocationPlace] = useState("");
  const [locationLink, setLocationLink] = useState("");
  const calendarStartMonth = new Date(new Date().getFullYear() - 5, 0);
  const calendarEndMonth = new Date(new Date().getFullYear() + 5, 11);

  const [eventVisibility, setEventVisibility] = useState("public");
  const [originalTitle, setOriginalTitle] = useState("");
  const [nameChecked, setNameChecked] = useState<null | boolean>(null);
  const [checkingName, setCheckingName] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteSuccessOpen, setDeleteSuccessOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Presenter Details
  const [maxPresenters, setMaxPresenters] = useState("3");
  const [maxGroups, setMaxGroups] = useState("30");
  const [submissionStartDate, setSubmissionStartDate] = useState("");
  const [submissionStartTime, setSubmissionStartTime] = useState("");
  const [submissionEndDate, setSubmissionEndDate] = useState("");
  const [submissionEndTime, setSubmissionEndTime] = useState("");
  const [selectedSubStart, setSelectedSubStart] = useState<Date | undefined>(undefined);
  const [selectedSubEnd, setSelectedSubEnd] = useState<Date | undefined>(undefined);
  const [fileRequirements, setFileRequirements] = useState<EventFileType[]>([]);

  // Committee & Guest
  const [hasCommittee, setHasCommittee] = useState(false);
  const [committeeReward, setCommitteeReward] = useState("");
  const [guestRewardAmount, setGuestRewardAmount] = useState("");
  const [unitReward, setUnitReward] = useState<string>("Coin");

  // Special Rewards
  const [specialRewards, setSpecialRewards] = useState<SpecialReward[]>([]);

  // Grading Configuration
  const [gradingEnabled, setGradingEnabled] = useState(false);
  const [gradingCriteria, setGradingCriteria] = useState<GradingCriteria[]>([]);

  const handleAddSpecialReward = () => {
    const newReward: SpecialReward = {
      id: Date.now().toString(),
      name: "",
      description: "",
    };
    setSpecialRewards([...specialRewards, newReward]);
  };

  const handleRemoveReward = (id: string) => {
    setSpecialRewards(specialRewards.filter((r) => r.id !== id));
  };

  const handleRewardChange = (id: string, field: "name" | "description", value: string) => {
    setSpecialRewards(specialRewards.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const rewardFileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [srPreviews, setSrPreviews] = useState<Record<string, string | null>>({});
  const [srFiles, setSrFiles] = useState<Record<string, File | null>>({});
  const [srRemoved, setSrRemoved] = useState<Record<string, boolean>>({});
  const [srCropOpen, setSrCropOpen] = useState(false);
  const [srCropSrc, setSrCropSrc] = useState<string | null>(null);
  const [srPendingMeta, setSrPendingMeta] = useState<{
    id: string;
    name: string;
    type: string;
  } | null>(null);
  const [rewardErrors, setRewardErrors] = useState<Record<string, string>>({});

  const openRewardFilePicker = (id: string) => {
    rewardFileRefs.current[id]?.click();
  };

  const handleRewardFileChange = (id: string, e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!BANNER_TYPES.includes(f.type)) {
      toast.error(t("validation.fileTypeNotSupported"));
      e.target.value = "";
      return;
    }
    if (f.size > BANNER_MAX_SIZE) {
      toast.error(t("validation.fileSizeExceeded"));
      e.target.value = "";
      return;
    }
    if (srPreviews[id]?.startsWith("blob:")) URL.revokeObjectURL(srPreviews[id] as string);
    const url = URL.createObjectURL(f);
    setSrCropSrc(url);
    setSrPendingMeta({ id, name: f.name, type: f.type || "image/png" });
    setSrCropOpen(true);
    setSrRemoved((prev) => ({ ...prev, [id]: false }));
  };

  const handleRewardCropCancel = () => {
    setSrCropOpen(false);
    if (srCropSrc && srCropSrc.startsWith("blob:")) URL.revokeObjectURL(srCropSrc);
    setSrCropSrc(null);
    setSrPendingMeta(null);
  };

  const handleRewardCropConfirm = (file: File, previewUrl: string) => {
    if (!srPendingMeta) return;
    const { id } = srPendingMeta;
    setSrFiles((prev) => ({ ...prev, [id]: file }));
    setSrPreviews((prev) => ({ ...prev, [id]: previewUrl }));
    setSrCropOpen(false);
    setSrRemoved((prev) => ({ ...prev, [id]: false }));
  };

  const handleRemoveRewardImage = (id: string) => {
    const prev = srPreviews[id];
    if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
    setSrPreviews((p) => ({ ...p, [id]: null }));
    setSrFiles((p) => ({ ...p, [id]: null }));
    setSrRemoved((p) => ({ ...p, [id]: true }));
  };

  const buildPayload = (opts?: { isoDates?: boolean }): EventUpdatePayload => {
    const iso = Boolean(opts?.isoDates);
    return {
      eventName: eventTitle,
      eventDescription,
      location: locationLink,
      locationName: locationPlace,
      publicView: eventVisibility === "public",
      startView: getDateTimeString(startDate, startTime, iso),
      endView: getDateTimeString(endDate, endTime, iso),
      startJoinDate: getDateTimeString(submissionStartDate, submissionStartTime, iso),
      endJoinDate: getDateTimeString(submissionEndDate, submissionEndTime, iso),
      maxTeamMembers: maxPresenters ? parseInt(maxPresenters) : null,
      maxTeams: maxGroups ? parseInt(maxGroups) : null,
      virtualRewardGuest: guestRewardAmount ? parseInt(guestRewardAmount) : 0,
      virtualRewardCommittee: hasCommittee
        ? committeeReward
          ? parseInt(committeeReward)
          : 1000
        : 0,
      hasCommittee,
      specialRewards,
      unitReward: unitReward || null,
      fileTypes: fileRequirements,
    };
  };
  const buildFormData = (payload: EventUpdatePayload, file: File) => {
    const formData = new FormData();
    Object.entries(payload).forEach(([k, v]) => {
      if (v === null || v === undefined) return;
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
        formData.append(k, String(v));
      } else {
        // For arrays/objects like specialRewards, send as JSON string
        formData.append(k, JSON.stringify(v));
      }
    });
    formData.append("file", file);
    return formData;
  };
  const ensureNameAvailable = async () => {
    if (!eventTitle.trim()) return false;
    if (eventTitle.trim() === originalTitle) return true;
    try {
      setCheckingName(true);
      const res = await checkEventName(eventTitle.trim());
      const ok = Boolean(res?.available);
      setNameChecked(ok);
      if (!ok) toast.error("ชื่อ Event ถูกใช้แล้ว");
      return ok;
    } catch (e) {
      console.error(e);
      setNameChecked(null);
      const backendMessage =
        typeof e === "object" && e && "response" in e
          ? ((e as AxiosError<{ message: string }>)?.response?.data?.message as string | undefined)
          : null;
      if (backendMessage === "Event name already exists") {
        toast.error("ไม่สามารถใช้ชื่อนี้ได้");
      } else {
        toast.error(t("validation.checkNameFailed"));
      }
      return false;
    } finally {
      setCheckingName(false);
    }
  };
  const validateSpecialRewardsDraft = () => {
    const errors: Record<string, string> = {};
    if (specialRewards.length) {
      for (const r of specialRewards) {
        if (!r.name || !r.name.trim()) {
          errors[r.id] = t("validation.rewardNameRequired");
        }
      }
    }
    setRewardErrors(errors);
    if (Object.keys(errors).length) {
      setActiveSection("card4");
      const el = document.getElementById("card4");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
      toast.error(t("validation.rewardNameRequired"));
      return false;
    }
    return true;
  };
  const validatePublish = () => {
    const errors: Record<string, string> = {};

    if (!eventTitle.trim()) {
      errors.eventTitle = t("validation.eventTitleRequired");
      toast.error(t("validation.eventTitleRequired"));
      setActiveSection("card1");
    }
    if (!(startDate && startTime)) {
      errors.startDateTime = t("validation.startDateTimeRequired");
      toast.error(t("validation.startDateTimeRequired"));
      setActiveSection("card2");
    }
    if (!(endDate && endTime)) {
      errors.endDateTime = t("validation.endDateTimeRequired");
      toast.error(t("validation.endDateTimeRequired"));
      setActiveSection("card2");
    }

    const timeErrors = validateEventTime(
      startDate,
      startTime,
      endDate,
      endTime,
      submissionStartDate,
      submissionStartTime,
      submissionEndDate,
      submissionEndTime,
    );
    Object.assign(errors, timeErrors);

    if (timeErrors.endDateTime) {
      toast.error(timeErrors.endDateTime);
      setActiveSection("card2");
    }

    const hasJoinInput = Boolean(
      submissionStartDate || submissionStartTime || submissionEndDate || submissionEndTime,
    );
    // const sj = toDate(submissionStartDate, submissionStartTime); // Submission Start
    // const ej = toDate(submissionEndDate, submissionEndTime); // Submission End
    if (hasJoinInput) {
      if (!(submissionStartDate && submissionStartTime)) {
        errors.submissionStart = t("validation.submissionStartRequired");
      }
      if (!(submissionEndDate && submissionEndTime)) {
        errors.submissionEnd = t("validation.submissionEndRequired");
      }
    }
    return errors;
  };
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleBannerFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (!BANNER_TYPES.includes(f.type)) {
      toast.error(t("validation.fileTypeNotSupported"));
      e.target.value = "";
      return;
    }

    if (f.size > BANNER_MAX_SIZE) {
      toast.error(t("validation.fileSizeExceeded"));
      e.target.value = "";
      return;
    }

    if (bannerPreview?.startsWith("blob:")) URL.revokeObjectURL(bannerPreview);
    const url = URL.createObjectURL(f);
    setCropSrc(url);
    setPendingFileMeta({ name: f.name, type: f.type || "image/png" });
    setCropOpen(true);
    setBannerRemoved(false);
  };

  const handleCropCancel = () => {
    setCropOpen(false);
    if (cropSrc && cropSrc.startsWith("blob:")) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setPendingFileMeta(null);
  };

  const handleCropConfirm = (file: File, previewUrl: string) => {
    setEventBanner(file);
    setBannerPreview(previewUrl);
    setCropOpen(false);
    setBannerRemoved(false);
  };

  const handleRemoveBanner = () => {
    if (bannerPreview?.startsWith("blob:")) URL.revokeObjectURL(bannerPreview);
    setBannerPreview(null);
    setEventBanner(null);
    setBannerRemoved(true);
  };

  const handleCheckName = async () => {
    if (!eventTitle.trim()) return;
    try {
      setCheckingName(true);
      const res = await checkEventName(eventTitle.trim());
      const ok = Boolean(res?.available);
      setNameChecked(ok);
      toast[ok ? "success" : "error"](
        ok ? t("validation.nameAvailable") : t("validation.nameTaken"),
      );
    } catch (e) {
      console.error(e);
      setNameChecked(null);
      const backendMessage =
        typeof e === "object" && e && "response" in e
          ? // @ts-expect-error axios error shape
            (e as AxiosError).response?.data?.message
          : null;
      if (backendMessage === "Event name already exists") {
        toast.error(t("validation.nameTaken"));
      } else {
        toast.error(t("messages.errorLoading"));
      }
    } finally {
      setCheckingName(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!id) return;

    const okRewards = validateSpecialRewardsDraft();
    if (!okRewards) return;

    // Validate start/end
    const timeErrors = validateEventTime(
      startDate,
      startTime,
      endDate,
      endTime,
      submissionStartDate,
      submissionStartTime,
      submissionEndDate,
      submissionEndTime,
    );

    if (timeErrors.endDateTime) {
      toast.error(timeErrors.endDateTime);
      setActiveSection("card2");
      return;
    }

    setIsSaving(true);
    toast.info(t("messages.savingDraft"));

    try {
      const ok = await ensureNameAvailable();
      if (!ok) return;
      const payload = buildPayload({ isoDates: false });
      await syncSpecialRewards();
      if (eventBanner) {
        const data = buildFormData(payload, eventBanner);
        await updateEvent(id, data);
      } else {
        await updateEvent(id, payload, { removeImage: bannerRemoved });
      }
      toast.success(t("messages.draftSaved"));
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : t("messages.draftFailed");
      if (message === "Event name already exists") {
        toast.error(t("validation.nameTaken"));
      } else {
        toast.error(message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!id) return;

    const ok = await ensureNameAvailable();
    if (!ok) return;

    const errors = validatePublish();
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setIsPublishing(true);
    try {
      const payload = buildPayload({ isoDates: false });
      await syncSpecialRewards();
      if (eventBanner) {
        const data = buildFormData(payload, eventBanner);
        await updateEvent(id, data);
      } else {
        await updateEvent(id, payload, { removeImage: bannerRemoved });
      }
      await publishEvent(id);
      toast.success(t("messages.publishSuccess"));
      window.location.reload();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : t("messages.publishFailed");
      if (message === "Event name already exists") {
        toast.error(t("validation.nameTaken"));
      } else {
        toast.error(message);
      }
      setIsPublishing(false);
    }
  };

  const syncSpecialRewards = async () => {
    if (!id) return;
    if (!event) return;
    const existingIds = new Set((event.specialRewards || []).map((r) => r.id));
    const removed = (event.specialRewards || []).filter(
      (r) => !specialRewards.some((sr) => sr.id === r.id),
    );
    for (const r of removed) {
      try {
        await deleteSpecialReward(id, r.id);
      } catch (e) {
        console.error("Failed to delete reward", e);
      }
    }
    for (const r of specialRewards) {
      const file = srFiles[r.id] || null;
      const isRemoved = srRemoved[r.id] || false;
      try {
        if (existingIds.has(r.id)) {
          if (file) {
            const fd = new FormData();
            fd.append("name", r.name);
            if (r.description) fd.append("description", r.description);
            fd.append("file", file);
            await updateSpecialReward(id, r.id, fd);
          } else {
            const payload: { name: string; description?: string; image?: null } = { name: r.name };
            if (r.description) payload.description = r.description;
            if (isRemoved) payload.image = null;
            await updateSpecialReward(id, r.id, payload);
          }
        } else {
          if (file) {
            const fd = new FormData();
            fd.append("name", r.name);
            if (r.description) fd.append("description", r.description);
            fd.append("file", file);
            const res = await createSpecialReward(id, fd);
            if (res?.reward?.id) {
              setSpecialRewards((prev) =>
                prev.map((x) =>
                  x.id === r.id
                    ? {
                        ...x,
                        id: res.reward.id,
                        image: res.reward.image || null,
                      }
                    : x,
                ),
              );
              setSrPreviews((prev) => ({
                ...prev,
                [res.reward.id]: res.reward.image || prev[r.id] || null,
              }));
              setSrFiles((prev) => {
                const { [r.id]: _, ...rest } = prev;
                return { ...rest, [res.reward.id]: null };
              });
            }
          } else {
            const payload: { name: string; description?: string; image?: string | null } = {
              name: r.name,
            };
            if (r.description) payload.description = r.description;
            const res = await createSpecialReward(id, {
              name: r.name,
              description: r.description,
              image: null,
            });
            if (res?.reward?.id) {
              setSpecialRewards((prev) =>
                prev.map((x) =>
                  x.id === r.id
                    ? {
                        ...x,
                        id: res.reward.id,
                        image: res.reward.image || null,
                      }
                    : x,
                ),
              );
            }
          }
        }
      } catch (e) {
        console.error("Failed to sync reward", e);
      }
    }
  };

  const sections = [
    {
      id: "card1",
      label: t("eventInfo.eventInformation"),
      icon: Info,
    },
    {
      id: "card2",
      label: t("eventTime.timeConfiguration"),
      icon: CalendarIcon,
    },
    {
      id: "card3",
      label: t("configuration.title"),
      icon: Users,
    },
    { id: "card4", label: t("rewardsSection.specialRewards"), icon: Award },
    { id: "card5", label: t("gradingSection.title") || "Grading", icon: BookOpen },
  ];

  const completionPercent = (() => {
    const list = [
      eventTitle,
      eventDescription,
      startDate,
      startTime,
      endDate,
      endTime,
      locationPlace,
      locationLink,
      maxPresenters,
      maxGroups,
      submissionStartDate,
      submissionStartTime,
      submissionEndDate,
      submissionEndTime,
      guestRewardAmount,
    ];
    let total = list.length;
    let filled = list.filter((v) => v && v.trim()).length;
    if (hasCommittee) {
      total += 1;
      if (committeeReward && committeeReward.trim()) filled += 1;
    }
    if (bannerPreview) {
      total += 1;
      filled += 1;
    }
    return Math.round((filled / (total || 1)) * 100);
  })();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const res = await getEvent(id);
        const data = res.event;

        if (data.fileTypes) {
          setFileRequirements(data.fileTypes);
        }

        setEvent(data);

        // ================= EVENT INFO =================
        setEventTitle(data.eventName || "");
        setOriginalTitle(data.eventName || "");
        setEventDescription(data.eventDescription || "");
        // For banner, store File as null for now (can be uploaded separately)
        setEventBanner(null);
        setBannerPreview(data.imageCover || null);
        // Location
        setLocationPlace(data.locationName || "");
        setLocationLink(data.location || "");
        // Dates
        setSelectedStart(data.startView ? new Date(data.startView) : undefined);
        setStartDate(data.startView ? data.startView.split("T")[0] : "");
        setStartTime(data.startView ? data.startView.split("T")[1]?.slice(0, 5) : "00:01");
        setSelectedEnd(data.endView ? new Date(data.endView) : undefined);
        setEndDate(data.endView ? data.endView.split("T")[0] : "");
        setEndTime(data.endView ? data.endView.split("T")[1]?.slice(0, 5) : "23:59");
        // Visibility
        setEventVisibility(data.publicView ? "public" : "private");

        // ================= PRESENTER =================
        setMaxPresenters(data.maxTeamMembers?.toString() || "3");
        setMaxGroups(data.maxTeams?.toString() || "30");

        // ================= SUBMISSION PERIOD =================
        setSelectedSubStart(data.startJoinDate ? new Date(data.startJoinDate) : undefined);
        setSubmissionStartDate(data.startJoinDate ? data.startJoinDate.split("T")[0] : "");
        setSubmissionStartTime(
          data.startJoinDate ? data.startJoinDate.split("T")[1]?.slice(0, 5) : "00:01",
        );
        setSelectedSubEnd(data.endJoinDate ? new Date(data.endJoinDate) : undefined);
        setSubmissionEndDate(data.endJoinDate ? data.endJoinDate.split("T")[0] : "");
        setSubmissionEndTime(
          data.endJoinDate ? data.endJoinDate.split("T")[1]?.slice(0, 5) : "23:59",
        );

        // ================= COMMITTEE & GUEST =================
        setHasCommittee(Boolean(data.hasCommittee));
        setCommitteeReward(data.virtualRewardCommittee?.toString() || "0");
        setGuestRewardAmount(data.virtualRewardGuest?.toString() || "0");
        setUnitReward(data.unitReward || "Coin");

        // ================= SPECIAL REWARDS =================
        if (data.specialRewards?.length) {
          setSpecialRewards(data.specialRewards);
          const previews: Record<string, string | null> = {};
          data.specialRewards.forEach((r: SpecialReward) => {
            previews[r.id] = r.image || null;
          });
          setSrPreviews(previews);
        } else {
          setSpecialRewards([]);
          setSrPreviews({});
        }
      } catch (err) {
        console.error("Failed to load event:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex lg:ml-72">
        {/* Sidebar */}
        <EventSidebar
          sections={sections}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          eventId={id}
          onSaveDraft={handleSaveDraft}
          completionPercent={completionPercent}
          isSaving={isSaving}
        />

        {/* Main Content */}
        <main className="flex-1 w-full">
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Header Skeleton */}
              <div className="lg:col-span-2 flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-md" />
                  <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                </div>
                <div className="space-x-2 hidden lg:flex">
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-32" />
                </div>
              </div>

              {/* Event Info Skeleton */}
              <Card className="shadow-sm border-border/60">
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                  <Skeleton className="h-48 w-full rounded-lg" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Other sections skeleton */}
              <div className="space-y-4">
                <Card className="shadow-sm border-border/60">
                  <CardHeader>
                    <Skeleton className="h-6 w-40" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-border/60">
                  <CardHeader>
                    <Skeleton className="h-6 w-40" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-6 w-12" />
                    </div>
                    <Skeleton className="h-px w-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : event ? (
            <div className="w-full max-w-6xl mx-auto py-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Header */}
                <div className="lg:col-span-2 flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4">
                    <Link href="/home">
                      <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                    </Link>
                    <div>
                      <h1 className="text-2xl font-bold text-foreground">
                        {t("eventDraft.editEvent")}
                      </h1>
                      <p className="text-muted-foreground">{t("eventDraft.updateEventDetails")}</p>
                    </div>
                  </div>
                  <div className="space-x-2">
                    <Button
                      variant="destructive"
                      onClick={() => setDeleteConfirmOpen(true)}
                      className="px-6 hidden lg:inline-flex"
                      disabled={isPublishing || isSaving}
                    >
                      {t("eventDraft.delete")}
                    </Button>
                    <Button
                      onClick={handlePublish}
                      className="px-6 hidden lg:inline-flex"
                      disabled={isPublishing || isSaving}
                    >
                      {isPublishing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("eventDraft.publishing")}
                        </>
                      ) : (
                        t("eventDraft.publish")
                      )}
                    </Button>
                  </div>
                </div>

                {/* Event Information Section */}
                <Card1
                  eventTitle={eventTitle}
                  setEventTitle={(v) => {
                    setEventTitle(v);
                    setNameChecked(null);
                  }}
                  checkingName={checkingName}
                  nameChecked={nameChecked}
                  onCheckName={handleCheckName}
                  eventDescription={eventDescription}
                  setEventDescription={setEventDescription}
                  cropOpen={cropOpen}
                  cropSrc={cropSrc}
                  pendingFileMeta={pendingFileMeta}
                  onCropCancel={handleCropCancel}
                  onCropConfirm={handleCropConfirm}
                  bannerPreview={bannerPreview}
                  openFilePicker={openFilePicker}
                  fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
                  onBannerFileChange={handleBannerFileChange}
                  onRemoveBanner={handleRemoveBanner}
                  locationPlace={locationPlace}
                  setLocationPlace={setLocationPlace}
                  locationLink={locationLink}
                  setLocationLink={setLocationLink}
                  eventVisibility={eventVisibility}
                  setEventVisibility={setEventVisibility}
                  fieldErrors={fieldErrors}
                />

                {/* Time Configuration Section */}
                <Card2
                  selectedStart={selectedStart}
                  setSelectedStart={setSelectedStart}
                  setStartDate={setStartDate}
                  startTime={startTime}
                  setStartTime={setStartTime}
                  selectedEnd={selectedEnd}
                  setSelectedEnd={setSelectedEnd}
                  setEndDate={setEndDate}
                  endTime={endTime}
                  setEndTime={setEndTime}
                  calendarStartMonth={calendarStartMonth}
                  calendarEndMonth={calendarEndMonth}
                  fieldErrors={fieldErrors}
                  selectedSubStart={selectedSubStart}
                  setSelectedSubStart={setSelectedSubStart}
                  setSubmissionStartDate={setSubmissionStartDate}
                  submissionStartTime={submissionStartTime}
                  setSubmissionStartTime={setSubmissionStartTime}
                  selectedSubEnd={selectedSubEnd}
                  setSelectedSubEnd={setSelectedSubEnd}
                  setSubmissionEndDate={setSubmissionEndDate}
                  submissionEndTime={submissionEndTime}
                  setSubmissionEndTime={setSubmissionEndTime}
                />

                {/* Configuration Section */}
                <Card3
                  maxPresenters={maxPresenters}
                  setMaxPresenters={setMaxPresenters}
                  maxGroups={maxGroups}
                  setMaxGroups={setMaxGroups}
                  fileRequirements={fileRequirements}
                  setFileRequirements={setFileRequirements}
                  hasCommittee={hasCommittee}
                  setHasCommittee={setHasCommittee}
                  committeeReward={committeeReward}
                  setCommitteeReward={setCommitteeReward}
                  guestRewardAmount={guestRewardAmount}
                  setGuestRewardAmount={setGuestRewardAmount}
                  unitReward={unitReward}
                  setUnitReward={setUnitReward}
                />

                {/* Special Rewards Section */}
                <Card4
                  specialRewards={specialRewards}
                  srPreviews={srPreviews}
                  openRewardFilePicker={openRewardFilePicker}
                  rewardFileRefs={rewardFileRefs}
                  handleRewardFileChange={handleRewardFileChange}
                  handleRemoveRewardImage={handleRemoveRewardImage}
                  handleAddSpecialReward={handleAddSpecialReward}
                  handleRemoveReward={handleRemoveReward}
                  handleRewardChange={handleRewardChange}
                  rewardErrors={rewardErrors}
                  srCropOpen={srCropOpen}
                  srCropSrc={srCropSrc}
                  srPendingMeta={srPendingMeta}
                  onRewardCropCancel={handleRewardCropCancel}
                  onRewardCropConfirm={handleRewardCropConfirm}
                />

                {/* Grading Configuration Section */}
                <Card5
                  gradingEnabled={gradingEnabled}
                  setGradingEnabled={setGradingEnabled}
                  gradingCriteria={gradingCriteria}
                  setGradingCriteria={setGradingCriteria}
                />

                <DeleteConfirmDialog
                  open={deleteConfirmOpen}
                  onOpenChange={setDeleteConfirmOpen}
                  onConfirm={async () => {
                    try {
                      await deleteEvent(id);
                      setDeleteConfirmOpen(false);
                      setDeleteSuccessOpen(true);
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                />

                <DeleteSuccessDialog
                  open={deleteSuccessOpen}
                  onOpenChange={(o) => {
                    setDeleteSuccessOpen(o);
                    if (!o) router.push("/home");
                  }}
                  onGoDashboard={() => router.push("/home")}
                />

                {/* Save Button (Mobile) */}
                <div className="lg:col-span-2 lg:hidden flex flex-col gap-3 mt-4 pb-8 border-t pt-6">
                  <Button
                    variant="secondary"
                    onClick={handleSaveDraft}
                    className="w-full h-11 text-base shadow-sm"
                    disabled={isSaving || isPublishing}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("sidebar.saving")}
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {t("eventDraft.saveAsDraft")}
                      </>
                    )}
                  </Button>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={handlePublish}
                      className="w-full h-11 text-base shadow-sm"
                      disabled={isSaving || isPublishing}
                    >
                      {isPublishing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("eventDraft.publishing")}
                        </>
                      ) : (
                        t("eventDraft.publish")
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setDeleteConfirmOpen(true)}
                      className="w-full h-11 text-base shadow-sm"
                      disabled={isSaving || isPublishing}
                    >
                      {t("eventDraft.delete")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
