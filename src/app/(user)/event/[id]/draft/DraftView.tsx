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
import SpecialRewardsSection from "./SpecialRewardsSection";
import EventInfoSection from "./EventInfoSection";
import PresenterSection from "./PresenterSection";
import CommitteeSection from "./CommitteeSection";

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

const BANNER_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const BANNER_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const mapEventNameMessage = (message: string) =>
  message === "Event name already exists" ? "ไม่สามารถใช้ชื่อนี้ได้" : message;

export default function EventDraft() {
  const params = useParams();
  const id = (params?.id as string) ?? "";
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("event-info");

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
      toast.error("รองรับเฉพาะไฟล์ JPG, PNG, GIF หรือ WEBP");
      e.target.value = "";
      return;
    }
    if (f.size > BANNER_MAX_SIZE) {
      toast.error("ไฟล์ต้องไม่เกิน 5MB");
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
        toast.error("ตรวจสอบชื่อไม่สำเร็จ");
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
          errors[r.id] = "กรุณากรอกชื่อรางวัล";
        }
      }
    }
    setRewardErrors(errors);
    if (Object.keys(errors).length) {
      setActiveSection("rewards");
      const el = document.getElementById("rewards");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
      toast.error("กรุณากรอกชื่อรางวัลให้ครบ");
      return false;
    }
    return true;
  };
  const validatePublish = () => {
    const errors: Record<string, string> = {};

    if (!eventTitle.trim()) {
      errors.eventTitle = "กรุณากรอกชื่ออีเว้นต์";
      toast.error("กรุณากรอกชื่ออีเว้นต์");
      setActiveSection("event-info");
    }
    if (!(startDate && startTime)) {
      errors.startDateTime = "กรุณากรอกวันที่-เวลาเริ่มของอีเว้นต์";
      toast.error("กรุณากรอกวันที่-เวลาเริ่มของอีเว้นต์");
      setActiveSection("event-info");
    }
    if (!(endDate && endTime)) {
      errors.endDateTime = "กรุณากรอกวันที่-เวลาสิ้นสุดของอีเว้นต์";
      toast.error("กรุณากรอกวันที่-เวลาสิ้นสุดของอีเว้นต์");
      setActiveSection("event-info");
    }

    const timeErrors = validateEventTime(
      startDate,
      startTime,
      endDate,
      endTime,
      submissionStartDate,
      submissionStartTime,
      submissionEndDate,
      submissionEndTime
    );
    Object.assign(errors, timeErrors);

    if (timeErrors.endDateTime) {
      toast.error(timeErrors.endDateTime);
      setActiveSection("event-info");
    }

    const hasJoinInput = Boolean(
      submissionStartDate || submissionStartTime || submissionEndDate || submissionEndTime
    );
    // const sj = toDate(submissionStartDate, submissionStartTime); // Submission Start
    // const ej = toDate(submissionEndDate, submissionEndTime); // Submission End
    if (hasJoinInput) {
      if (!(submissionStartDate && submissionStartTime)) {
        errors.submissionStart = "กรุณากรอกวันที่-เวลาเริ่มส่งผลงาน";
      }
      if (!(submissionEndDate && submissionEndTime)) {
        errors.submissionEnd = "กรุณากรอกวันที่-เวลาสิ้นสุดส่งผลงาน";
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
      toast.error("รองรับเฉพาะไฟล์ JPG, PNG, GIF หรือ WEBP");
      e.target.value = "";
      return;
    }

    if (f.size > BANNER_MAX_SIZE) {
      toast.error("ไฟล์ต้องไม่เกิน 5MB");
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
      toast[ok ? "success" : "error"](ok ? "ชื่อ Event ใช้ได้" : "ชื่อ Event ถูกใช้แล้ว");
    } catch (e) {
      console.error(e);
      setNameChecked(null);
      const backendMessage =
        typeof e === "object" && e && "response" in e
          ? // @ts-expect-error axios error shape
            (e as AxiosError).response?.data?.message
          : null;
      if (backendMessage === "Event name already exists") {
        toast.error("ไม่สามารถใช้ชื่อนี้ได้");
      } else {
        toast.error("ตรวจสอบชื่อไม่สำเร็จ");
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
      submissionEndTime
    );

    if (timeErrors.endDateTime) {
      toast.error(timeErrors.endDateTime);
      setActiveSection("event-info");
      return;
    }

    toast.info("กำลังบันทึก Draft...");

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
      toast.success("บันทึก Draft สำเร็จ");
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "บันทึก Draft ไม่สำเร็จ";
      toast.error(mapEventNameMessage(message));
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
      toast.success("เผยแพร่ Event สำเร็จ");
      window.location.reload();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Error publishing event";
      toast.error(mapEventNameMessage(message));
    }
  };

  const syncSpecialRewards = async () => {
    if (!id) return;
    if (!event) return;
    const existingIds = new Set((event.specialRewards || []).map((r: any) => r.id));
    const removed = (event.specialRewards || []).filter(
      (r: any) => !specialRewards.some((sr) => sr.id === r.id)
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
            const payload: Record<string, any> = { name: r.name };
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
                    : x
                )
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
            const payload: Record<string, any> = { name: r.name };
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
                    : x
                )
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
      id: "event-info",
      label: "Event Information / ข้อมูลอีเวนต์",
      icon: Info,
    },
    {
      id: "presenter",
      label: "Presenter Details / รายละเอียดผู้นำเสนอ",
      icon: Users,
    },
    {
      id: "committee",
      label: "Committee & Guest / คณะกรรมการและผู้เข้าร่วม",
      icon: UserCheck,
    },
    { id: "rewards", label: "Special Rewards / รางวัลพิเศษ", icon: Award },
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
          data.startJoinDate ? data.startJoinDate.split("T")[1]?.slice(0, 5) : "00:01"
        );
        setSelectedSubEnd(data.endJoinDate ? new Date(data.endJoinDate) : undefined);
        setSubmissionEndDate(data.endJoinDate ? data.endJoinDate.split("T")[0] : "");
        setSubmissionEndTime(
          data.endJoinDate ? data.endJoinDate.split("T")[1]?.slice(0, 5) : "23:59"
        );

        // ================= COMMITTEE & GUEST =================
        setHasCommittee(Boolean(data.hasCommittee));
        setCommitteeReward(data.virtualRewardCommittee?.toString() || "0");
        setGuestRewardAmount(data.virtualRewardGuest?.toString() || "0");
        setUnitReward((data as any).unitReward || "Coin");

        // ================= SPECIAL REWARDS =================
        if (data.specialRewards?.length) {
          setSpecialRewards(data.specialRewards);
          const previews: Record<string, string | null> = {};
          data.specialRewards.forEach((r: any) => {
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
      <div className="flex">
        {/* Sidebar */}
        <EventSidebar
          sections={sections}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          eventId={id}
          onSaveDraft={handleSaveDraft}
          completionPercent={completionPercent}
        />

        {/* Main Content */}
        <main className="flex-1 lg:ml-80 p-6 lg:p-8 w-full">
          {loading ? (
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4">
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
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Header */}
              <div className="lg:col-span-2 flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                  <Link href="/dashboard">
                    <Button variant="ghost" size="icon">
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  </Link>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">
                      Edit Event / แก้ไขอีเวนต์
                    </h1>
                    <p className="text-muted-foreground">
                      Update your event details / อัปเดตรายละเอียดอีเวนต์
                    </p>
                  </div>
                </div>
                <div className="space-x-2">
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteConfirmOpen(true)}
                    className="px-6 hidden lg:inline-block"
                  >
                    Delete / ลบ
                  </Button>
                  <Button onClick={handlePublish} className="px-6 hidden lg:inline-block">
                    Publish / เผยแพร่
                  </Button>
                </div>
              </div>

              {/* Event Information Section */}
              <EventInfoSection
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
                selectedStart={selectedStart}
                setSelectedStart={setSelectedStart}
                startDate={startDate}
                setStartDate={setStartDate}
                startTime={startTime}
                setStartTime={setStartTime}
                selectedEnd={selectedEnd}
                setSelectedEnd={setSelectedEnd}
                selectedSubEnd={selectedSubEnd}
                selectedSubStart={selectedSubStart}
                endDate={endDate}
                setEndDate={setEndDate}
                endTime={endTime}
                setEndTime={setEndTime}
                calendarStartMonth={calendarStartMonth}
                calendarEndMonth={calendarEndMonth}
                eventVisibility={eventVisibility}
                setEventVisibility={setEventVisibility}
                fieldErrors={fieldErrors}
                locationPlace={locationPlace}
                setLocationPlace={setLocationPlace}
                locationLink={locationLink}
                setLocationLink={setLocationLink}
              />

              {/* Presenter Details Section */}
              <PresenterSection
                maxPresenters={maxPresenters}
                setMaxPresenters={setMaxPresenters}
                maxGroups={maxGroups}
                setMaxGroups={setMaxGroups}
                selectedSubStart={selectedSubStart}
                setSelectedSubStart={setSelectedSubStart}
                submissionStartDate={submissionStartDate}
                setSubmissionStartDate={setSubmissionStartDate}
                submissionStartTime={submissionStartTime}
                setSubmissionStartTime={setSubmissionStartTime}
                selectedSubEnd={selectedSubEnd}
                setSelectedSubEnd={setSelectedSubEnd}
                submissionEndDate={submissionEndDate}
                setSubmissionEndDate={setSubmissionEndDate}
                submissionEndTime={submissionEndTime}
                setSubmissionEndTime={setSubmissionEndTime}
                fieldErrors={fieldErrors}
                calendarStartMonth={calendarStartMonth}
                calendarEndMonth={calendarEndMonth}
                selectedStart={selectedStart}
                fileRequirements={fileRequirements}
                setFileRequirements={setFileRequirements}
              />

              {/* Committee & Guest Section */}
              <CommitteeSection
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
              <SpecialRewardsSection
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
                  if (!o) router.push("/dashboard");
                }}
                onGoDashboard={() => router.push("/dashboard")}
              />

              {/* Save Button (Mobile) */}
              <div className="lg:col-span-2 lg:hidden flex flex-col gap-3 mt-4 pb-8 border-t pt-6">
                <Button variant="secondary" onClick={handleSaveDraft} className="w-full h-11 text-base shadow-sm">
                  <Save className="mr-2 h-4 w-4" />
                  Save as Draft / บันทึกดราฟต์
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={handlePublish} className="w-full h-11 text-base shadow-sm">
                    Publish / เผยแพร่
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteConfirmOpen(true)}
                    className="w-full h-11 text-base shadow-sm"
                  >
                    Delete / ลบ
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
