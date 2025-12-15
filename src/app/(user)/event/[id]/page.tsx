"use client";

import { getEvent, getMyEvents, signInvite, joinEvent, joinEventWithToken } from "@/utils/apievent";
import type { EventData } from "@/utils/types";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import DraftView from "./draft/DraftView";
import OrganizerView from "./Organizer/page";
import PresenterView from "./Presenter/page";
import NotRoleView from "./NotRole/page";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { useSession } from "next-auth/react";

type Role = "ORGANIZER" | "PRESENTER" | "COMMITTEE" | "GUEST" | null;

export default function EventDetail() {
  const { data: session, status } = useSession();
  const params = useParams();
  const id = (params?.id as string) ?? "";
  const searchParams = useSearchParams();
  const [event, setEvent] = useState<EventData | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [inviteProcessed, setInviteProcessed] = useState(false);

  useEffect(() => {
    const inviteFlag = searchParams.get("invite");
    if (inviteFlag === "1") {
      if (status === "unauthenticated") {
        const currentUrl =
          typeof window !== "undefined" ? window.location.href : `/event/${id}?invite=1`;
        window.location.href = `/sign-in?redirectTo=${encodeURIComponent(currentUrl)}`;
        return;
      }
      if (status === "loading") {
        return;
      }
    }

    const fetchData = async () => {
      if (!id) return;
      try {
        const res = await getEvent(id);
        if (res.message === "ok") {
          setEvent(res.event);
          const evRole = (res.event as { role?: Role })?.role ?? null;
          if (evRole) setRole(evRole as Role);
        }
        try {
          const my = await getMyEvents();
          const meEvent = ((my.events ?? []) as Array<{ id: string; role?: Role }>).find(
            (e) => e.id === id
          );
          if (meEvent?.role) setRole(meEvent.role as Role);
        } catch {}
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, [id, status, searchParams]);

  useEffect(() => {
    const joinViaInvite = async () => {
      if (!id || !event || event.status !== "PUBLISHED") return;
      if (inviteProcessed) return;
      if (status !== "authenticated") return;

      const inviteFlag = searchParams.get("invite");
      const tokenParam = searchParams.get("token");
      const roleParam = searchParams.get("role");
      if (inviteFlag !== "1") return;

      if (role && role !== null) {
        setInviteProcessed(true);
        return;
      }

      try {
        if (tokenParam) {
          const resJoin = await joinEventWithToken(id, tokenParam);
          if (resJoin?.message === "ok") {
            toast.success("เข้าร่วมอีเวนต์สำเร็จ");
            // ต้องโหลด role ใหม่จาก API เพื่อให้ตรงกับ token
            try {
              const my = await getMyEvents();
              const meEvent = ((my.events ?? []) as Array<{ id: string; role?: Role }>).find((e) => e.id === id);
              if (meEvent?.role) setRole(meEvent.role as Role);
            } catch {}
          } else {
            toast.error(resJoin?.message || "เข้าร่วมอีเวนต์ไม่สำเร็จ");
          }
        } else if (roleParam && ["presenter", "committee", "guest"].includes(roleParam)) {
          const resSign = await signInvite(id, roleParam as "presenter" | "committee" | "guest");
          if (resSign?.message !== "ok" || !resSign?.sig) {
            toast.error("ไม่สามารถเข้าร่วมอีเวนต์ได้");
            setInviteProcessed(true);
            return;
          }
          const resJoin = await joinEvent(id, roleParam as "presenter" | "committee" | "guest", resSign.sig);
          if (resJoin?.message === "ok") {
            toast.success("เข้าร่วมอีเวนต์สำเร็จ");
            const upper = roleParam.toUpperCase() as Exclude<Role, null>;
            setRole(upper);
          } else {
            toast.error(resJoin?.message || "เข้าร่วมอีเวนต์ไม่สำเร็จ");
          }
        }
      } catch (err) {
        let message = "เข้าร่วมอีเวนต์ไม่สำเร็จ";
        const ax = err as AxiosError<{ message?: string }>;
        const backendMessage = ax?.response?.data?.message;
        if (backendMessage) message = backendMessage;
        toast.error(message);
      } finally {
        setInviteProcessed(true);
      }
    };
    joinViaInvite();
  }, [id, event, searchParams, role, inviteProcessed, status]);

  return (
    <div>
      {event?.status === "DRAFT" && <DraftView />}
      {event?.status === "PUBLISHED" && event && (
        <>
          {role === "ORGANIZER" ? (
            <OrganizerView id={id} event={event!} />
          ) : role === null ? (
            <NotRoleView id={id} event={event!} />
          ) : (
            <PresenterView id={id} event={event!} />
          )}
        </>
      )}
    </div>
  );
}
