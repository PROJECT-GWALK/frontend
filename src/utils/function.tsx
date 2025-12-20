import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@/utils/types";
import { timeFormat, dateFormat } from "@/utils/settings";

export function UserAvatar({
  user,
  className,
}: {
  user: Partial<User> | null | undefined;
  className?: string;
}) {
  const fallback = user?.name?.trim() || user?.username || user?.email || "??";
  return (
    <Avatar className={className}>
      <AvatarImage src={user?.image || ""} />
      <AvatarFallback>{fallback.slice(0, 2).toUpperCase()}</AvatarFallback>
    </Avatar>
  );
}

export function linkify(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part, index) =>
    urlRegex.test(part) ? (
      <a
        key={index}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline hover:opacity-80"
      >
        {part}
      </a>
    ) : (
      part
    )
  );
}

export function timeUntil(iso?: string) {
  if (!iso) return "";
  const now = new Date();
  const target = new Date(iso);
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return "เริ่มแล้ว";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  if (days > 0) return `${days} วัน ${hours} ชม.`;
  if (hours > 0) return `${hours} ชม. ${mins} นาที`;
  return `${mins} นาที`;
}

export function toLocalDatetimeValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const YYYY = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const DD = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${YYYY}-${MM}-${DD}T${hh}:${mm}`;
}

export function toISOStringFromLocal(localVal: string) {
  const d = new Date(localVal);
  return d.toISOString();
}

export function formatDateTime(d?: Date) {
  if (!d) return "-";
  return d.toLocaleString(timeFormat, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function toYYYYMMDD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatDate(d?: Date, emptyText: string = "-") {
  if (!d) return emptyText;
  return d.toLocaleDateString(dateFormat, { day: "numeric", month: "long", year: "numeric" });
}

export const toDate = (date?: string, time?: string) =>
  date && time ? new Date(`${date}T${time}`) : null;

export const getDateTimeString = (
  date: string,
  time: string,
  asIso: boolean = false
) => {
  if (!date || !time) return null;
  if (asIso) {
    const d = new Date(`${date}T${time}`);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  return `${date}T${time}`;
};

export const validateEventTime = (
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string,
  submissionStartDate: string,
  submissionStartTime: string,
  submissionEndDate: string,
  submissionEndTime: string
) => {
  const errors: Record<string, string> = {};
  const startPresenter = toDate(submissionStartDate, submissionStartTime);
  const endPresenter = toDate(submissionEndDate, submissionEndTime);
  const startView = toDate(startDate, startTime);
  const endView = toDate(endDate, endTime);

  // วันที่เข้าชมต้องอยู่ก่อนวันที่-เวลาสิ้นสุด
  if (startView && endView) {
    if (startView.getTime() >= endView.getTime()) {
      errors.endDateTime = "วันที่-เวลาเริ่มต้องอยู่ก่อนวันที่-เวลาสิ้นสุด";
    }
  }

  // วันที่-เวลาเริ่มส่งผลงานต้องอยู่ก่อนวันที่-เวลาสิ้นสุดส่งผลงาน
  if (startPresenter && endPresenter) {
    if (startPresenter.getTime() >= endPresenter.getTime()) {
      errors.submissionEnd =
        "วันที่-เวลาเริ่มส่งผลงานต้องอยู่ก่อนวันที่-เวลาสิ้นสุดส่งผลงาน";
    }
  }

  // วันที่-เวลาเริ่มส่งผลงานต้องอยู่ก่อนวันที่-เวลาเริ่มอีเว้นต์
  if (startPresenter && startView) {
    if (startPresenter.getTime() >= startView.getTime()) {
      errors.submissionStart =
        "วันที่-เวลาเริ่มส่งผลงานต้องอยู่ก่อนวันที่-เวลาเริ่มอีเว้นต์";
    }
  }

  // วันที่-เวลาสิ้นสุดส่งผลงานต้องอยู่ก่อนวันที่-เวลาเริ่มอีเว้นต์
  if (endPresenter && startView) {
    if (endPresenter.getTime() >= startView.getTime()) {
      errors.submissionEnd =
        "วันที่-เวลาสิ้นสุดส่งผลงานต้องอยู่ก่อนวันที่-เวลาเริ่มอีเว้นต์";
    }
  }

  return errors;
};

export function getMapEmbedUrl(locationUrl: string | undefined, locationName: string | undefined): string {
  let query = locationName || "";
  
  if (locationUrl) {
    try {
      const urlStr = locationUrl.trim();
      // Try to extract coordinates from @lat,lng
      const coordMatch = urlStr.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (coordMatch) {
        query = `${coordMatch[1]},${coordMatch[2]}`;
      } else {
        // Try to parse URL
        if (urlStr.includes("google.com/maps") || urlStr.includes("maps.google.com")) {
             const url = new URL(urlStr.startsWith("http") ? urlStr : `https://${urlStr}`);
             const q = url.searchParams.get("q");
             if (q) {
                 query = q;
             } else if (url.pathname.includes("/place/")) {
                 const parts = url.pathname.split("/place/");
                 if (parts[1]) {
                     query = decodeURIComponent(parts[1].split("/")[0].replace(/\+/g, " "));
                 }
             }
        }
      }
    } catch (e) {
      // ignore
    }
  }
  
  query = query.trim();
  if (!query) return "";
  
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&output=embed`;
}