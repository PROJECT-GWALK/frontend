"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { previewInvite, joinEventWithToken, getMyEvents, getEvent } from "@/utils/apievent";
import type { EventData } from "@/utils/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CalendarIcon, MapPinIcon, Users, ArrowLeft, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, linkify } from "@/utils/function";
import { useLanguage } from "@/contexts/LanguageContext";
import OrganizerBanner from "../Organizer/components/OrganizerBanner";

type RoleStr = "presenter" | "committee" | "guest" | "organizer";

export default function InviteConfirmPage() {
  const { timeFormat } = useLanguage();
  const { status } = useSession();
  const params = useParams();
  const id = (params?.id as string) ?? "";
  const searchParams = useSearchParams();
  const router = useRouter();

  const tokenParam = searchParams.get("token") || "";

  const [inviteRole, setInviteRole] = useState<RoleStr | null>(null);
  const [event, setEvent] = useState<EventData | null>(null);
  const [joining, setJoining] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [now, setNow] = useState<Date>(new Date());
  const {t} = useLanguage();
  const formatText = (key: string, values: Record<string, string>) => {
    let text = t(key);
    for (const [name, value] of Object.entries(values)) {
      text = text.replaceAll(`{${name}}`, value);
    }
    return text;
  };
  const isAlreadyMember = Boolean(event?.myRole);
  const inviteNeedsJoinWindow =
    inviteRole === "presenter" || inviteRole === "guest" || inviteRole === "committee";
  const presenterJoinStart = event?.startJoinDate
    ? new Date(event.startJoinDate)
    : null;
  const presenterJoinEnd = event?.endJoinDate
    ? new Date(event.endJoinDate)
    : null;
  const guestBaseStart = event?.startView ? new Date(event.startView) : null;
  const guestJoinStart = guestBaseStart
    ? new Date(guestBaseStart.getTime() - 60 * 60 * 1000)
    : null;
  const guestJoinEnd = event?.endView ? new Date(event.endView) : null;
  const committeeJoinEnd = event?.endView
    ? new Date(event.endView)
    : event?.endJoinDate
      ? new Date(event.endJoinDate)
      : null;
  const joinStart =
    inviteRole === "presenter"
      ? presenterJoinStart
      : inviteRole === "guest"
        ? guestJoinStart
        : inviteRole === "committee"
          ? null
        : null;
  const joinEnd =
    inviteRole === "presenter"
      ? presenterJoinEnd
      : inviteRole === "guest"
        ? guestJoinEnd
        : inviteRole === "committee"
          ? committeeJoinEnd
        : null;
  const isBeforeJoinStart = Boolean(
    inviteNeedsJoinWindow && joinStart && now < joinStart,
  );
  const isAfterJoinEnd = Boolean(
    inviteNeedsJoinWindow && joinEnd && now > joinEnd,
  );
  const canJoinNow = !isBeforeJoinStart && !isAfterJoinEnd;
  const countdownMs =
    isBeforeJoinStart && joinStart ? Math.max(0, joinStart.getTime() - now.getTime()) : 0;
  const countdown = (() => {
    const totalSeconds = Math.floor(countdownMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { days, hours, minutes, seconds };
  })();

  useEffect(() => {
    if (!isBeforeJoinStart) return;
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isBeforeJoinStart]);

  useEffect(() => {
    if (!id) return;
    if (status === "unauthenticated") {
      const currentUrl = typeof window !== "undefined" ? window.location.href : `/event/${id}/invite`;
      router.replace(`/sign-in?redirectTo=${encodeURIComponent(currentUrl)}`);
      return;
    }
    if (status === "loading") return;
    
    (async () => {
      try {
        // Fetch event details
        const resEvent = await getEvent(id);
        if (resEvent.message === "ok" && resEvent.event) {
          setEvent(resEvent.event);
        }

        if (tokenParam) {
          const res = await previewInvite(id, { token: tokenParam });
          if (res?.message === "ok" && res?.role) {
            setInviteRole(res.role as RoleStr);
          } else {
            setInviteRole(null);
          }
        } else {
          setInviteRole(null);
        }
      } catch {
        setInviteRole(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, status, tokenParam, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-12 w-full justify-center flex">
        <div className="w-full">
        <div className="relative w-full aspect-21/9 md:h-100">
          <Skeleton className="w-full h-full" />
        </div>
        <div className="max-w-6xl mx-auto -mt-20 relative z-10">
          <Card className="border-none shadow-xl">
            <CardHeader className="p-6 md:p-8 space-y-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div className="space-y-4 flex-1">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-10 w-3/4" />
                  <div className="flex gap-4">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-8 w-32" />
                  </div>
                </div>
                <Skeleton className="h-24 w-40" />
              </div>
            </CardHeader>
            <CardContent className="p-6 md:p-8 pt-0 space-y-8">
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <Skeleton className="h-48 w-full rounded-xl" />
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    );
  }

  const doJoin = async () => {
    if (!id) return;
    if (status !== "authenticated") return;
    if (!canJoinNow) {
      if (isBeforeJoinStart && joinStart) {
        toast.message(
          formatText("inviteSection.join_not_started_toast", {
            date: formatDateTime(joinStart, timeFormat),
          }),
        );
      } else if (isAfterJoinEnd) {
        toast.message(t("inviteSection.join_closed_toast"));
      }
      return;
    }
    setJoining(true);
    try {
      if (tokenParam) {
        const resJoin = await joinEventWithToken(id, tokenParam);
        if (resJoin?.message === "ok") {
          toast.success(t("toast.joinEventSuccess"));
        } else {
          toast.error(resJoin?.message || t("toast.joinEventFailed"));
        }
      } else {
         toast.error(t("toast.invalidInviteLink"));
      }
      try {
        await getMyEvents();
      } catch {}
      router.replace(`/event/${id}`);
    } catch {
      toast.error(t("toast.joinEventFailed"));
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Banner Section */}
      <OrganizerBanner 
        event={event} 
        open={bannerOpen} 
        onOpenChange={setBannerOpen} 
      />

      <div className="max-w-6xl mx-auto mt-6 relative z-10">
        <Card className="border-none shadow-xl bg-linear-to-br from-background/95 to-muted/20 backdrop-blur-sm overflow-hidden">
          <div className="h-2 bg-linear-to-r from-primary to-primary/60" />
          <CardHeader className="p-6 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="space-y-4 flex-1">
                <div className="space-y-2">
                  <Badge variant="secondary" className="mb-2">
                    {t("inviteSection.badge_invitation")}
                  </Badge>
                  <CardTitle className="text-3xl md:text-4xl font-bold">
                    {event?.eventName || t("inviteSection.loading_event")}
                  </CardTitle>
                </div>
                
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {event?.startView && (
                    <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
                      <CalendarIcon className="w-4 h-4 text-primary" />
                      <span>
                        {formatDateTime(new Date(event.startView), timeFormat)}
                      </span>
                    </div>
                  )}
                  {event?.locationName && (
                    <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
                      <MapPinIcon className="w-4 h-4 text-primary" />
                      <span>{event.locationName}</span>
                    </div>
                  )}
                </div>
              </div>

              {inviteRole && (
                <div className="shrink-0">
                  <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-center min-w-40">
                    <p className="text-sm text-muted-foreground mb-1">{t("inviteSection.your_role")}</p>
                    <Badge 
                      variant="secondary" 
                      className="text-xl font-bold text-white px-3 py-1"
                      style={{
                        backgroundColor: `var(--role-${inviteRole.toLowerCase()})`
                      }}
                    >
                      {inviteRole}
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            {event?.myRole && (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900 rounded-2xl p-5 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">
                      ✓
                    </div>
                    <div className="min-w-0">
                      <div className="text-emerald-900 dark:text-emerald-100 font-semibold text-base">
                        {t("inviteSection.already_member")}
                      </div>
                      <div className="text-sm text-emerald-800/80 dark:text-emerald-200/80">
                        {t("inviteSection.already_member_hint")}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center md:justify-end">
                    <Badge
                      variant="secondary"
                      className="text-sm font-bold text-white px-3 py-1.5"
                      style={{
                        backgroundColor: `var(--role-${event.myRole.toLowerCase()})`,
                      }}
                    >
                      {event.myRole}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent className="p-6 md:p-8 pt-0 space-y-8">
            {event?.eventDescription && (
              <div className="prose dark:prose-invert max-w-none max-h-60 overflow-y-auto pr-2">
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {linkify(event.eventDescription)}
                </p>
              </div>
            )}

            <div className="bg-muted/30 rounded-xl p-6 md:p-8 border border-border/50">
              <div className="flex flex-col items-center text-center space-y-4">
                <div
                  className={`p-3 rounded-full ${
                    isBeforeJoinStart
                      ? "bg-amber-100 dark:bg-amber-900/30"
                      : isAfterJoinEnd
                        ? "bg-red-100 dark:bg-red-900/30"
                        : "bg-primary/10"
                  }`}
                >
                  <Users
                    className={`w-8 h-8 ${
                      isBeforeJoinStart
                        ? "text-amber-600 dark:text-amber-400"
                        : isAfterJoinEnd
                          ? "text-red-600 dark:text-red-400"
                          : "text-primary"
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <h3
                    className={`text-lg font-semibold ${
                      isBeforeJoinStart
                        ? "text-amber-700 dark:text-amber-300"
                        : isAfterJoinEnd
                          ? "text-red-700 dark:text-red-300"
                          : ""
                    }`}
                  >
                    {isBeforeJoinStart
                      ? t("inviteSection.join_not_started_title")
                      : isAfterJoinEnd
                        ? t("inviteSection.join_closed_title")
                        : t("inviteSection.confirm_title")}
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    {isBeforeJoinStart && joinStart
                      ? formatText("inviteSection.join_not_started_desc", {
                          role: inviteRole || "-",
                          date: formatDateTime(joinStart, timeFormat),
                          note:
                            inviteRole === "guest"
                              ? t("inviteSection.note_guest_early")
                              : inviteRole === "presenter"
                                ? t("inviteSection.note_presenter_window")
                                : "",
                        })
                      : isAfterJoinEnd
                        ? t("inviteSection.join_closed_desc")
                        : inviteRole
                          ? `${t("inviteSection.confirm_description")} ${inviteRole} ${t("inviteSection.confirm_description2")}${inviteRole === "committee" && joinEnd ? ` (${formatText("inviteSection.note_committee_until", { date: formatDateTime(joinEnd, timeFormat) })})` : ""}`
                          : `${t("inviteSection.confirm_description2")}`}
                  </p>
                </div>
                {isBeforeJoinStart && (
                  <div className="w-full max-w-md rounded-xl border bg-background/70 p-4">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
                      <Clock3 className="w-4 h-4" />
                      <span>{t("inviteSection.countdown_label")}</span>
                    </div>
                    <div className="text-center text-lg md:text-xl font-semibold">
                      {countdown.days > 0 ? `${countdown.days} วัน ` : ""}
                      {String(countdown.hours).padStart(2, "0")}:
                      {String(countdown.minutes).padStart(2, "0")}:
                      {String(countdown.seconds).padStart(2, "0")}
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => router.replace(`/event/${id}`)}
                    className="sm:min-w-35 gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {t("inviteSection.button_cancel")}
                  </Button>
                  {!isAlreadyMember && canJoinNow && (
                    <Button 
                      onClick={doJoin} 
                      disabled={joining}
                      className="sm:min-w-35 bg-linear-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    >
                      {joining ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          {t("inviteSection.ongoing")}
                        </>
                      ) : (
                        t("inviteSection.button_confirm")
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
