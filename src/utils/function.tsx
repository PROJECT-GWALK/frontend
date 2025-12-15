import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@/utils/types";

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

export function getInviteLink(
  eventId: string,
  role: "presenter" | "guest" | "committee"
) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const search = new URLSearchParams({ role, invite: "1" });
  return `${origin}/event/${eventId}?${search.toString()}`;
}
