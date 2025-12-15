"use client";

import { getEvent, getMyEvents, signInvite, joinEvent, joinEventWithToken, previewInvite } from "@/utils/apievent";
import type { EventData } from "@/utils/types";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DraftView from "./draft/DraftView";
import OrganizerView from "./Organizer/page";
import PresenterView from "./Presenter/page";
import NotRoleView from "./NotRole/page";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { useSession } from "next-auth/react";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type Role = "ORGANIZER" | "PRESENTER" | "COMMITTEE" | "GUEST" | null;

export default function EventDetail() {
  const { data: session, status } = useSession();
  const params = useParams();
  const id = (params?.id as string) ?? "";
  const searchParams = useSearchParams();
  const router = useRouter();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role>(null);
  const [inviteProcessed, setInviteProcessed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState<"presenter" | "committee" | "guest" | null>(null);
  const [joining, setJoining] = useState(false);

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
      if (!confirmOpen) setConfirmOpen(true);
      const tokenParam = searchParams.get("token");
      const roleParam = searchParams.get("role");
      (async () => {
        try {
          if (tokenParam) {
            const res = await previewInvite(id, { token: tokenParam });
            if (res?.message === "ok" && res?.role) {
              setInviteRole(res.role as "presenter" | "committee" | "guest");
            } else {
              setInviteRole(null);
            }
          } else if (roleParam && ["presenter", "committee", "guest"].includes(roleParam)) {
            setInviteRole(roleParam as "presenter" | "committee" | "guest");
          } else {
            setInviteRole(null);
          }
        } catch {
          setInviteRole(null);
        }
      })();
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
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, status, searchParams, confirmOpen]);

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-background">
        <div className="flex h-full">
          <div className="hidden md:block w-64 p-4 border-r">
             <div className="space-y-4">
               <Skeleton className="h-10 w-full" />
               <Skeleton className="h-8 w-3/4" />
               <Skeleton className="h-8 w-3/4" />
               <Skeleton className="h-8 w-3/4" />
             </div>
          </div>
          <div className="flex-1 p-6 space-y-6">
             <Skeleton className="h-48 w-full rounded-xl" />
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                   <Skeleton className="h-10 w-1/2" />
                   <Skeleton className="h-4 w-full" />
                   <Skeleton className="h-4 w-full" />
                   <Skeleton className="h-4 w-3/4" />
                   <Skeleton className="h-64 w-full rounded-xl mt-4" />
                </div>
                <div className="space-y-4">
                   <Skeleton className="h-40 w-full rounded-xl" />
                   <Skeleton className="h-40 w-full rounded-xl" />
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  }

  const doJoin = async () => {
    if (!id || !event || event.status !== "PUBLISHED") return;
    const inviteFlag = searchParams.get("invite");
    const tokenParam = searchParams.get("token");
    const roleParam = searchParams.get("role");
    if (inviteFlag !== "1") return;
    if (status !== "authenticated") return;
    setJoining(true);
    try {
      if (tokenParam) {
        const resJoin = await joinEventWithToken(id, tokenParam);
        if (resJoin?.message === "ok") {
          toast.success("เข้าร่วมอีเวนต์สำเร็จ");
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
      setJoining(false);
      setConfirmOpen(false);
      setInviteProcessed(true);
      router.replace(`/event/${id}`);
    }
  };

  return (
    <div>
      {event?.status === "DRAFT" && <DraftView />}
      {event?.status === "PUBLISHED" && event && (
        <>
          <Dialog open={confirmOpen} onOpenChange={(o) => setConfirmOpen(o)}>
            <DialogContent>
              <DialogTitle>ยืนยันการเข้าร่วมอีเวนต์</DialogTitle>
              <div className="text-sm text-muted-foreground mt-2">
                ต้องการเข้าร่วมอีเวนต์นี้{inviteRole ? `ในบทบาท ${inviteRole}` : ""} หรือไม่?
              </div>
              <DialogFooter className="mt-4">
                <Button variant="secondary" onClick={() => { setConfirmOpen(false); router.replace(`/event/${id}`); }}>
                  ยกเลิก
                </Button>
                <Button onClick={doJoin} disabled={joining}>
                  {joining ? "กำลังเข้าร่วม..." : "ยืนยัน"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
