"use client";
import { useEffect, useState, useRef, type ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Link as LinkIcon,
  Upload,
  Users,
  Gift,
  Plus,
  Trash2,
  ArrowLeft,
  Info,
  UserCheck,
  Award,
  Check,
  X,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar as DateCalendar } from "@/components/ui/calendar";
import { EventSidebar } from "@/app/(user)/event/[id]/EventSidebar";
import {
  getEvent,
  publishEvent,
  updateEvent,
  checkEventName,
  deleteEvent,
} from "@/utils/apievent";
import { EventDetail } from "@/utils/types";
import { toast } from "sonner";
import ImageCropDialog from "@/lib/image-crop-dialog";
import { AxiosError } from "axios";

type SpecialReward = {
  id: string;
  name: string;
  description: string;
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
  specialRewards: SpecialReward[];
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
  const [selectedStart, setSelectedStart] = useState<Date | undefined>(
    undefined
  );
  const [selectedEnd, setSelectedEnd] = useState<Date | undefined>(undefined);
  const pad = (n: number) => String(n).padStart(2, "0");
  const toDateStr = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const formatThaiBE = (d?: Date) =>
    d
      ? d.toLocaleDateString("th-TH", { day: "numeric", month: "long" }) +
        " " +
        String(d.getFullYear() + 543)
      : "เลือกวันที่";
  const [locationPlace, setLocationPlace] = useState("");
  const [locationLink, setLocationLink] = useState("");

  const [eventVisibility, setEventVisibility] = useState("public");
  const [originalTitle, setOriginalTitle] = useState("");
  const [nameChecked, setNameChecked] = useState<null | boolean>(null);
  const [checkingName, setCheckingName] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteSuccessOpen, setDeleteSuccessOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Presenter Details
  const [maxPresenters, setMaxPresenters] = useState("");
  const [maxGroups, setMaxGroups] = useState("");
  const [submissionStartDate, setSubmissionStartDate] = useState("");
  const [submissionStartTime, setSubmissionStartTime] = useState("");
  const [submissionEndDate, setSubmissionEndDate] = useState("");
  const [submissionEndTime, setSubmissionEndTime] = useState("");
  const [selectedSubStart, setSelectedSubStart] = useState<Date | undefined>(
    undefined
  );
  const [selectedSubEnd, setSelectedSubEnd] = useState<Date | undefined>(
    undefined
  );

  // Committee & Guest
  const [hasCommittee, setHasCommittee] = useState(false);
  const [committeeReward, setCommitteeReward] = useState("");
  const [guestRewardAmount, setGuestRewardAmount] = useState("");

  // Special Rewards
  const [specialRewards, setSpecialRewards] = useState<SpecialReward[]>([
    {
      id: "1",
      name: "Best Presentation",
      description: "Awarded to the most engaging presentation",
    },
    {
      id: "2",
      name: "Innovation Award",
      description: "For the most innovative idea presented",
    },
  ]);

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

  const handleRewardChange = (
    id: string,
    field: "name" | "description",
    value: string
  ) => {
    setSpecialRewards(
      specialRewards.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const toISO = (date: string, time: string) => (date && time ? `${date}T${time}` : null);
  const toDate = (date?: string, time?: string) => (date && time ? new Date(`${date}T${time}`) : null);
  const buildPayload = (opts?: { isoDates?: boolean }): EventUpdatePayload => {
    const iso = Boolean(opts?.isoDates);
    const svDate = iso ? toDate(startDate, startTime) : null;
    const evDate = iso ? toDate(endDate, endTime) : null;
    const sjDate = iso ? toDate(submissionStartDate, submissionStartTime) : null;
    const ejDate = iso ? toDate(submissionEndDate, submissionEndTime) : null;
    const sv = iso ? (svDate ? svDate.toISOString() : null) : toISO(startDate, startTime);
    const ev = iso ? (evDate ? evDate.toISOString() : null) : toISO(endDate, endTime);
    const sj = iso ? (sjDate ? sjDate.toISOString() : null) : toISO(submissionStartDate, submissionStartTime);
    const ej = iso ? (ejDate ? ejDate.toISOString() : null) : toISO(submissionEndDate, submissionEndTime);
    return {
      eventName: eventTitle,
      eventDescription,
      location: locationLink,
      locationName: locationPlace,
      publicView: eventVisibility === "public",
      startView: sv,
      endView: ev,
      startJoinDate: sj,
      endJoinDate: ej,
      maxTeamMembers: maxPresenters ? parseInt(maxPresenters) : null,
      maxTeams: maxGroups ? parseInt(maxGroups) : null,
      virtualRewardGuest: guestRewardAmount ? parseInt(guestRewardAmount) : 0,
      virtualRewardCommittee: hasCommittee && committeeReward ? parseInt(committeeReward) : 0,
      specialRewards,
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
          ? (e as AxiosError<{ message: string }>)?.response?.data?.message as string | undefined
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
  const validatePublish = () => {
    const errors: Record<string, string> = {};

    if (!eventTitle.trim()) {
      errors.eventTitle = "กรุณากรอก Event Title";
    }
    if (!(startDate && startTime)) {
      errors.startDateTime = "กรุณากรอก Start View วันที่และเวลา";
    }
    if (!(endDate && endTime)) {
      errors.endDateTime = "กรุณากรอก End View วันที่และเวลา";
    }
    const sv = toDate(startDate, startTime); // Event Start
    const ev = toDate(endDate, endTime); // Event End
    if (sv && ev && sv > ev) {
      errors.endDateTime = "Start View ต้องอยู่ก่อน End View";
    }
    const hasJoinInput = Boolean(submissionStartDate || submissionStartTime || submissionEndDate || submissionEndTime);
    const sj = toDate(submissionStartDate, submissionStartTime); // Submission Start
    const ej = toDate(submissionEndDate, submissionEndTime); // Submission End
    if (hasJoinInput) {
      if (!(submissionStartDate && submissionStartTime)) {
        errors.submissionStart = "กรุณากรอก Submission Start วันที่และเวลา";
      }
      if (!(submissionEndDate && submissionEndTime)) {
        errors.submissionEnd = "กรุณากรอก Submission End วันที่และเวลา";
      }
      if (sj && ej && sj > ej) {
        errors.submissionEnd = "Submission Start ต้องอยู่ก่อน Submission End";
      }
      // Submission Period ต้องอยู่ก่อน Event
      if (sj && sv && sj > sv) {
        errors.submissionStart = "Submission Start ต้องอยู่ก่อน Event Start";
      }
      if (ej && sv && ej > sv) {
        errors.submissionEnd = "Submission End ต้องอยู่ก่อน Event Start";
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
      toast[ok ? "success" : "error"](
        ok ? "ชื่อ Event ใช้ได้" : "ชื่อ Event ถูกใช้แล้ว"
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

    toast.info("กำลังบันทึก Draft...");

    try {
      const ok = await ensureNameAvailable();
      if (!ok) return;
      const payload = buildPayload({ isoDates: false });
      if (eventBanner) {
        const data = buildFormData(payload, eventBanner);
        await updateEvent(id, data);
      } else {
        await updateEvent(id, payload, { removeImage: bannerRemoved });
      }
      toast.success("บันทึก Draft สำเร็จ");
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "บันทึก Draft ไม่สำเร็จ";
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
      const message =
        err instanceof Error ? err.message : "Error publishing event";
      toast.error(mapEventNameMessage(message));
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

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const res = await getEvent(id);
        const data = res.event;

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
        setStartTime(
          data.startView ? data.startView.split("T")[1]?.slice(0, 5) : ""
        );
        setSelectedEnd(data.endView ? new Date(data.endView) : undefined);
        setEndDate(data.endView ? data.endView.split("T")[0] : "");
        setEndTime(data.endView ? data.endView.split("T")[1]?.slice(0, 5) : "");
        // Visibility
        setEventVisibility(data.publicView ? "public" : "private");

        // ================= PRESENTER =================
        setMaxPresenters(data.maxTeamMembers?.toString() || "");
        setMaxGroups(data.maxTeams?.toString() || "");

        // ================= SUBMISSION PERIOD =================
        setSelectedSubStart(data.startJoinDate ? new Date(data.startJoinDate) : undefined);
        setSubmissionStartDate(
          data.startJoinDate ? data.startJoinDate.split("T")[0] : ""
        );
        setSubmissionStartTime(
          data.startJoinDate
            ? data.startJoinDate.split("T")[1]?.slice(0, 5)
            : ""
        );
        setSelectedSubEnd(data.endJoinDate ? new Date(data.endJoinDate) : undefined);
        setSubmissionEndDate(
          data.endJoinDate ? data.endJoinDate.split("T")[0] : ""
        );
        setSubmissionEndTime(
          data.endJoinDate ? data.endJoinDate.split("T")[1]?.slice(0, 5) : ""
        );

        // ================= COMMITTEE & GUEST =================
        setHasCommittee(Boolean(data.hasCommittee));
        setCommitteeReward(data.virtualRewardCommittee?.toString() || "0");
        setGuestRewardAmount(data.virtualRewardGuest?.toString() || "0");

        // ================= SPECIAL REWARDS =================
        if (data.specialRewards?.length) {
          setSpecialRewards(data.specialRewards);
        } else {
          setSpecialRewards([]);
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
        />

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          {!loading && event && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
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
                <Button
                  onClick={handlePublish}
                  className="px-6 hidden lg:inline-block"
                >
                  Publish / เผยแพร่
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="px-6 hidden lg:inline-block"
                >
                  Delete / ลบ
                </Button>
              </div>

              {/* Event Information Section */}
              <Card id="event-info" className="scroll-mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Info className="h-5 w-5 text-primary" />
                    Event Information / ข้อมูลอีเวนต์
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="eventTitle">
                      Event Title / หัวข้ออีเวนต์{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="eventTitle"
                        placeholder="Enter event title / กรอกหัวข้ออีเวนต์"
                        value={eventTitle}
                        onChange={(e) => {
                          setEventTitle(e.target.value);
                          setNameChecked(null);
                        }}
                      />
                      <Button
                        variant="outline"
                        onClick={handleCheckName}
                        disabled={
                          checkingName ||
                          !eventTitle.trim() ||
                          eventTitle.trim() === originalTitle
                        }
                      >
                        Check / ตรวจสอบ
                      </Button>
                      {eventTitle && nameChecked === true && (
                        <div className="flex items-center gap-2 text-xs text-green-600">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                      {eventTitle && nameChecked === false && (
                        <div className="flex items-center gap-2 text-xs text-destructive">
                          <X className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    {fieldErrors.eventTitle && (
                      <p className="text-xs text-destructive mt-1">
                        {fieldErrors.eventTitle}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">
                      Event Description / รายละเอียดอีเวนต์
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Tell attendees about your event... / บอกผู้เข้าร่วมเกี่ยวกับอีเวนต์ของคุณ"
                      rows={4}
                      value={eventDescription}
                      onChange={(e) => setEventDescription(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Event Banner / แบนเนอร์อีเวนต์</Label>
                    <ImageCropDialog
                      open={cropOpen}
                      src={cropSrc}
                      fileName={pendingFileMeta?.name}
                      fileType={pendingFileMeta?.type}
                      aspect={2}
                      title="Crop to 800x400"
                      outputWidth={800}
                      outputHeight={400}
                      onOpenChange={(o) => {
                        if (!o) handleCropCancel();
                        else setCropOpen(true);
                      }}
                      onCancel={handleCropCancel}
                      onConfirm={handleCropConfirm}
                    />
                    {bannerPreview ? (
                      <div className="relative border rounded-lg overflow-hidden aspect-[2/1] bg-muted">
                        <img
                          src={bannerPreview}
                          alt="Event banner preview"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                        <div className="absolute top-2 right-2 flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={openFilePicker}
                          >
                            Change
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleRemoveBanner}
                          >
                            Remove
                          </Button>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={handleBannerFileChange}
                        />
                      </div>
                    ) : (
                      <div
                        className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer aspect-[2/1] flex flex-col items-center justify-center"
                        onClick={openFilePicker}
                      >
                        <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG, or GIF (crop to 800x400px)
                        </p>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={handleBannerFileChange}
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">
                        Start Date / วันที่เริ่ม{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                            {formatThaiBE(selectedStart)}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0">
                          <DateCalendar
                            mode="single"
                            captionLayout="dropdown"
                            selected={selectedStart}
                            onSelect={(d: Date | undefined) => {
                              if (d) {
                                setSelectedStart(d);
                                setStartDate(toDateStr(d));
                              }
                            }}
                            formatters={{
                              formatMonthDropdown: (date) =>
                                date.toLocaleString("th-TH", { month: "long" }),
                              formatYearDropdown: (date) =>
                                String(date.getFullYear() + 543),
                            }}
                            required
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="startTime">
                        Start Time / เวลาเริ่ม{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="startTime"
                          type="time"
                          step="60"
                          min="00:00"
                          max="23:59"
                          className="pl-10"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  {fieldErrors.startDateTime && (
                    <p className="text-xs text-destructive mt-1">
                      {fieldErrors.startDateTime}
                    </p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="endDate">
                        End Date / วันที่สิ้นสุด{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                            {formatThaiBE(selectedEnd)}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0">
                          <DateCalendar
                            mode="single"
                            captionLayout="dropdown"
                            selected={selectedEnd}
                            onSelect={(d: Date | undefined) => {
                              if (d) {
                                setSelectedEnd(d);
                                setEndDate(toDateStr(d));
                              }
                            }}
                              disabled={
                                selectedStart
                                  ? (date) => date < selectedStart
                                  : undefined
                              }
                            formatters={{
                              formatMonthDropdown: (date: Date) =>
                                date.toLocaleString("th-TH", { month: "long" }),
                              formatYearDropdown: (date: Date) =>
                                String(date.getFullYear() + 543),
                            }}
                            required
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">
                        End Time / เวลาสิ้นสุด{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="endTime"
                          type="time"
                          step="60"
                          min="00:00"
                          max="23:59"
                          className="pl-10"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  {fieldErrors.endDateTime && (
                    <p className="text-xs text-destructive mt-1">
                      {fieldErrors.endDateTime}
                    </p>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="locationPlace">
                      Location / Venue / สถานที่จัดงาน
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="locationPlace"
                        placeholder="e.g. Convention Center, Hall A"
                        className="pl-10"
                        value={locationPlace}
                        onChange={(e) => setLocationPlace(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="locationLink">
                      Location Link (Google Maps) / ลิงก์ตำแหน่ง (Google Maps)
                    </Label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="locationLink"
                        placeholder="https://maps.google.com/..."
                        className="pl-10"
                        value={locationLink}
                        onChange={(e) => setLocationLink(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="visibility">
                      Event Visibility / การมองเห็นอีเวนต์
                    </Label>
                    <Select
                      value={eventVisibility}
                      onValueChange={setEventVisibility}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public / สาธารณะ</SelectItem>
                        <SelectItem value="private">
                          Private / ส่วนตัว
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Presenter Details Section */}
              <Card id="presenter" className="scroll-mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-primary" />
                    Presenter Details / รายละเอียดผู้นำเสนอ
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="maxPresenters">
                      Members per Group / จำนวนต่อกลุ่ม
                    </Label>
                    <Input
                      id="maxPresenters"
                      type="number"
                      placeholder="e.g. 5"
                      value={maxPresenters}
                      onChange={(e) => setMaxPresenters(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxGroups">
                      Maximum Groups / จำนวนกลุ่มสูงสุด
                    </Label>
                    <Input
                      id="maxGroups"
                      type="number"
                      placeholder="e.g. 20"
                      value={maxGroups}
                      onChange={(e) => setMaxGroups(e.target.value)}
                    />
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-medium mb-4">
                      Submission Period / ช่วงการส่งผลงาน
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="subStartDate">
                          Start Date / วันที่เริ่มส่ง{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                              {formatThaiBE(selectedSubStart)}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="p-0">
                            <DateCalendar
                              mode="single"
                              captionLayout="dropdown"
                              selected={selectedSubStart}
                              onSelect={(d: Date | undefined) => {
                                if (d) {
                                  setSelectedSubStart(d);
                                  setSubmissionStartDate(toDateStr(d));
                                }
                              }}
                              disabled={
                                selectedStart
                                  ? (date) => date >= selectedStart
                                  : undefined
                              }
                              formatters={{
                                formatMonthDropdown: (date) =>
                                  date.toLocaleString("th-TH", {
                                    month: "long",
                                  }),
                                formatYearDropdown: (date) =>
                                  String(date.getFullYear() + 543),
                              }}
                              required={false}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subStartTime">
                          Start Time / เวลาเริ่มส่ง{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="subStartTime"
                            type="time"
                            step="60"
                            min="00:00"
                            max="23:59"
                            className="pl-10"
                            value={submissionStartTime}
                            onChange={(e) =>
                              setSubmissionStartTime(e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>
                    {fieldErrors.submissionStart && (
                      <p className="text-xs text-destructive mt-1">
                        {fieldErrors.submissionStart}
                      </p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="subEndDate">
                          End Date / วันที่สิ้นสุดส่ง{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                              {formatThaiBE(selectedSubEnd)}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="p-0">
                            <DateCalendar
                              mode="single"
                              captionLayout="dropdown"
                              selected={selectedSubEnd}
                              onSelect={(d: Date | undefined) => {
                                if (d) {
                                  setSelectedSubEnd(d);
                                  setSubmissionEndDate(toDateStr(d));
                                }
                              }}
                              disabled={
                                selectedSubStart || selectedStart
                                  ? (date) => {
                                      if (selectedSubStart && date < selectedSubStart) {
                                        return true;
                                      }
                                      if (selectedStart && date >= selectedStart) {
                                        return true;
                                      }
                                      return false;
                                    }
                                  : undefined
                              }
                              formatters={{
                                formatMonthDropdown: (date) =>
                                  date.toLocaleString("th-TH", {
                                    month: "long",
                                  }),
                                formatYearDropdown: (date) =>
                                  String(date.getFullYear() + 543),
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subEndTime">
                          End Time / เวลาสิ้นสุดส่ง{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="subEndTime"
                            type="time"
                            step="60"
                            min="00:00"
                            max="23:59"
                            className="pl-10"
                            value={submissionEndTime}
                            onChange={(e) =>
                              setSubmissionEndTime(e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>
                    {fieldErrors.submissionEnd && (
                      <p className="text-xs text-destructive mt-1">
                        {fieldErrors.submissionEnd}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Committee & Guest Section */}
              <Card id="committee" className="scroll-mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <UserCheck className="h-5 w-5 text-primary" />
                    Committee & Guest Details / คณะกรรมการและผู้เข้าร่วม
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hasCommittee"
                        checked={hasCommittee}
                        onCheckedChange={(checked) =>
                          setHasCommittee(checked as boolean)
                        }
                      />
                      <Label htmlFor="hasCommittee" className="cursor-pointer">
                        Event has committee members / มีคณะกรรมการในงาน
                      </Label>
                    </div>

                    {hasCommittee && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-2">
                          <Label htmlFor="committeeReward">
                            Virtual Rewards per Person / รางวัลเสมือนต่อคน
                          </Label>
                          <div className="relative">
                            <Gift className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="committeeReward"
                              type="number"
                              placeholder="e.g. 100"
                              className="pl-10"
                              value={committeeReward}
                              onChange={(e) =>
                                setCommitteeReward(e.target.value)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-6 space-y-4">
                    <div className="space-y-2 max-w-xs">
                      <Label htmlFor="guestRewardAmount">
                        Virtual Rewards Amount per Guest /
                        จำนวนรางวัลเสมือนต่อผู้เข้าร่วม
                      </Label>
                      <div className="relative">
                        <Gift className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="guestRewardAmount"
                          type="number"
                          placeholder="e.g. 50"
                          className="pl-10"
                          value={guestRewardAmount}
                          onChange={(e) => setGuestRewardAmount(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Special Rewards Section */}
              <Card id="rewards" className="scroll-mt-6">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Award className="h-5 w-5 text-primary" />
                    Special Rewards / รางวัลพิเศษ
                  </CardTitle>
                  <Button
                    onClick={handleAddSpecialReward}
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Reward / เพิ่มรางวัล
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {specialRewards.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Gift className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No special rewards added yet / ยังไม่มีรางวัลพิเศษ</p>
                      <p className="text-sm">
                        Click &quot;Add Reward&quot; to create one / คลิก
                        &quot;เพิ่มรางวัล&quot; เพื่อสร้าง
                      </p>
                    </div>
                  ) : (
                    specialRewards.map((reward, index) => (
                      <div
                        key={reward.id}
                        className="border rounded-lg p-4 space-y-4 bg-muted/30"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">
                            Reward #{index + 1}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveReward(reward.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Label>Reward Name / ชื่อรางวัล</Label>
                          <Input
                            placeholder="e.g. Best Presentation"
                            value={reward.name}
                            onChange={(e) =>
                              handleRewardChange(
                                reward.id,
                                "name",
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description / รายละเอียด</Label>
                          <Textarea
                            placeholder="Describe what this reward is for..."
                            value={reward.description}
                            onChange={(e) =>
                              handleRewardChange(
                                reward.id,
                                "description",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent className="sm:max-w-sm">
                  <DialogHeader>
                    <DialogTitle>ยืนยันการลบ</DialogTitle>
                    <DialogDescription>ยืนยันลบ Event ฉบับร่างนี้หรือไม่?</DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="flex flex-col sm:flex-row sm:gap-3 w-full gap-2">
                    <DialogClose asChild>
                      <Button variant="outline" className="w-full sm:w-1/2">Cancel</Button>
                    </DialogClose>
                    <Button
                      variant="destructive"
                      className="w-full sm:w-1/2"
                      onClick={async () => {
                        try {
                          await deleteEvent(id);
                          setDeleteConfirmOpen(false);
                          setDeleteSuccessOpen(true);
                        } catch (e: any) {
                          console.error(e);
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={deleteSuccessOpen} onOpenChange={(o) => { setDeleteSuccessOpen(o); if (!o) router.push("/dashboard"); }}>
                <DialogContent className="sm:max-w-sm flex flex-col items-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <Check className="h-6 w-6 text-green-600" />
                  </div>
                  <DialogHeader className="text-center gap-0">
                    <DialogTitle className="text-center">Deleted successfully</DialogTitle>
                    <DialogDescription className="mt-2 text-center mx-auto sm:max-w-[90%]">
                      Event draft has been deleted.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="flex flex-col sm:flex-row sm:gap-3 w-full gap-2">
                    <DialogClose asChild>
                      <Button variant="default" className="w-full sm:w-1/2" onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button variant="outline" className="w-full sm:w-1/2">Close</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Save Button (Mobile) */}
              <div className="lg:hidden grid grid-cols-3 gap-2">
                <Button
                  variant="secondary"
                  onClick={handleSaveDraft}
                  className="w-full"
                >
                  Save as Draft / บันทึกดราฟต์
                </Button>
                <Button onClick={handlePublish} className="w-full">
                  Publish / เผยแพร่
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="w-full"
                >
                  Delete / ลบ
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
