"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { previewInvite, joinEventWithToken, getMyEvents, getEvent } from "@/utils/apievent";
import type { EventData } from "@/utils/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CalendarIcon, MapPinIcon, Users, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, linkify } from "@/utils/function";
import { useLanguage } from "@/contexts/LanguageContext";
import OrganizerBanner from "../Organizer/components/OrganizerBanner";

type RoleStr = "presenter" | "committee" | "guest";

export default function InviteConfirmPage() {
  const { timeFormat } = useLanguage();
  const { data: session, status } = useSession();
  const params = useParams();
  const id = (params?.id as string) ?? "";
  const searchParams = useSearchParams();
  const router = useRouter();

  const tokenParam = searchParams.get("token") || "";
  const roleParam = searchParams.get("role") as RoleStr | null;

  const [inviteRole, setInviteRole] = useState<RoleStr | null>(null);
  const [event, setEvent] = useState<EventData | null>(null);
  const [joining, setJoining] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bannerOpen, setBannerOpen] = useState(false);
  const {t} = useLanguage();

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
    } catch (e: unknown) {
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
                    Invitation
                  </Badge>
                  <CardTitle className="text-3xl md:text-4xl font-bold">
                    {event?.eventName || "Loading..."}
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
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 text-center">
                    <p className="text-yellow-800 dark:text-yellow-200">
                        {t("inviteSection.already_member")}
                        <Badge 
                            variant="secondary" 
                            className="ml-2 text-white"
                            style={{
                                backgroundColor: `var(--role-${event.myRole.toLowerCase()})`
                            }}
                        >
                            {event.myRole}
                        </Badge>
                    </p>
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
                <div className="p-3 bg-primary/10 rounded-full">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">{t("inviteSection.confirm_title")}</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    {inviteRole 
                      ? `${t("inviteSection.confirm_description")} ${inviteRole} ${t("inviteSection.confirm_description2")}`
                      : `${t("inviteSection.confirm_description2")}`
                    }
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => router.replace(`/event/${id}`)}
                    className="sm:min-w-35 gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {t("inviteSection.button_cancel")}
                  </Button>
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
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
