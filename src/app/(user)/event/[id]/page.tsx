"use client";

import {
  getEvent,
  getMyEvents,
  joinEventWithToken,
  previewInvite,
} from "@/utils/apievent";
import type { EventData } from "@/utils/types";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DraftView from "./draft/DraftView";
import { OrganizerView } from "./Organizer/page";
import { PresenterView } from "./Presenter/page";
import { NotRoleView } from "./NotRole/page";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { useSession } from "next-auth/react";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CommitteeView } from "./Committee/page";
import { GuestView } from "./Guest/page";
import { useLanguage } from "@/contexts/LanguageContext";
import { AlertCircle } from "lucide-react";

type Role = "ORGANIZER" | "PRESENTER" | "COMMITTEE" | "GUEST" | null;

export default function EventDetail() {
  const { status } = useSession();
  const params = useParams();
  const id = (params?.id as string) ?? "";
  const searchParams = useSearchParams();
  const router = useRouter();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState<
    "presenter" | "committee" | "guest" | "organizer" | null
  >(null);
  const [joining, setJoining] = useState(false);
  const {t} = useLanguage();

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
              setInviteRole(res.role as "presenter" | "committee" | "guest" | "organizer");
            } else {
              setInviteRole(null);
            }
          } else if (roleParam && ["presenter", "committee", "guest", "organizer"].includes(roleParam)) {
            setInviteRole(roleParam as "presenter" | "committee" | "guest" | "organizer");
          } else {
            setInviteRole(null);
          }
        } catch {
          setInviteRole(null);
        }
      })();
    }

    const fetchData = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const res = await getEvent(id);
        if (res?.message === "ok" && res?.event) {
          setEvent(res.event);
          const evRole = (res.event as { role?: Role })?.role ?? null;
          if (evRole) setRole(evRole as Role);
        } else {
          setEvent(null);
        }
        try {
          const my = await getMyEvents();
          const meEvent = ((my.events ?? []) as Array<{ id: string; role?: Role }>).find(
            (e) => e.id === id
          );
          if (meEvent?.role) setRole(meEvent.role as Role);
        } catch {}
    } catch {
        setEvent(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, status, searchParams, confirmOpen, router, t]);

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

  if (!event) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto w-fit rounded-full bg-muted/30 p-5 mb-6">
            <AlertCircle className="h-12 w-12 text-muted-foreground/60" />
          </div>
          <div className="text-2xl font-semibold">{t("eventsPage.noEvents.title")}</div>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="secondary" onClick={() => router.push("/event")}>
              {t("eventsPage.noEvents.backToEvents")}
            </Button>
            <Button onClick={() => router.refresh()}>{t("eventsPage.noEvents.retry")}</Button>
          </div>
        </div>
      </div>
    );
  }

  const doJoin = async () => {
    if (!id || !event || event.status !== "PUBLISHED") return;
    const inviteFlag = searchParams.get("invite");
    const tokenParam = searchParams.get("token");
    if (inviteFlag !== "1") return;
    if (status !== "authenticated") return;
    setJoining(true);
    try {
      if (tokenParam) {
        const resJoin = await joinEventWithToken(id, tokenParam);
        if (resJoin?.message === "ok") {
          toast.success(t("toast.joinEventSuccess"));
          try {
            const my = await getMyEvents();
            const meEvent = ((my.events ?? []) as Array<{ id: string; role?: Role }>).find(
              (e) => e.id === id
            );
            if (meEvent?.role) setRole(meEvent.role as Role);
          } catch {}
        } else {
          toast.error(resJoin?.message || t("toast.joinEventFailed"));
        }
      } else {
         toast.error(t("toast.invalidInviteLink"));
      }
    } catch (err) {
      let message = t("toast.joinEventFailed");
      const ax = err as AxiosError<{ message?: string }>;
      const backendMessage = ax?.response?.data?.message;
      if (backendMessage) message = backendMessage;
      toast.error(message);
    } finally {
      setJoining(false);
      setConfirmOpen(false);
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
              <DialogTitle>{t("inviteSection.confirm_title")}</DialogTitle>
              <div className="text-sm text-muted-foreground mt-2">
                {inviteRole
                  ? `${t("inviteSection.joinQuestionPrefix")} ${t("inviteSection.joinQuestionRolePrefix")} ${
                      inviteRole === "presenter"
                        ? t("roles.presenter")
                        : inviteRole === "committee"
                          ? t("roles.committee")
                          : inviteRole === "organizer"
                            ? t("roles.organizer")
                          : t("roles.guest")
                    } ${t("inviteSection.joinQuestionSuffix")}`
                  : `${t("inviteSection.joinQuestionPrefix")} ${t("inviteSection.joinQuestionSuffix")}`}
              </div>
              <DialogFooter className="mt-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setConfirmOpen(false);
                    router.replace(`/event/${id}`);
                  }}
                >
                  {t("inviteSection.button_cancel")}
                </Button>
                <Button onClick={doJoin} disabled={joining}>
                  {joining ? t("inviteSection.ongoing") : t("inviteSection.confirm_short")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {role === "ORGANIZER" ? (
            <OrganizerView id={id} event={event!} />
          ) : role === "PRESENTER" ? (
            <PresenterView id={id} event={event!} />
          ) : role === "COMMITTEE" ? (
            <CommitteeView id={id} event={event!} />
          ) : role === "GUEST" ? (
            <GuestView id={id} event={event!} />
          ) : (
            <NotRoleView id={id} event={event!} isAuthenticated={status === "authenticated"} />
          )}
        </>
      )}
    </div>
  );
}
