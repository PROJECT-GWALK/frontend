"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import InformationSection from "../components/InformationSection";
import type { EventData } from "@/utils/types";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import OrganizerBanner from "../Organizer/components/OrganizerBanner";
import { useState } from "react";
import { getInviteToken } from "@/utils/apievent";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  id: string;
  event: EventData;
  isAuthenticated?: boolean;
};

export function NotRoleView({ id, event, isAuthenticated }: Props) {
  const router = useRouter();
  const [bannerOpen, setBannerOpen] = useState(false);
  const { t } = useLanguage();
  const now = new Date();
  const presenterJoinStart = event?.startJoinDate
    ? new Date(event.startJoinDate)
    : null;
  const presenterJoinEnd = event?.endJoinDate
    ? new Date(event.endJoinDate)
    : null;
  const eventStart = event?.startView ? new Date(event.startView) : null;
  const eventEnd = event?.endView ? new Date(event.endView) : null;
  const guestJoinStart = eventStart
    ? new Date(eventStart.getTime() - 60 * 60 * 1000)
    : null;
  const canJoinPresenter =
    !!presenterJoinStart &&
    !!presenterJoinEnd &&
    now >= presenterJoinStart &&
    now <= presenterJoinEnd;
  const canJoinGuest =
    !!guestJoinStart && now >= guestJoinStart && (!eventEnd || now <= eventEnd);

  const handleJoin = async (role: "presenter" | "guest") => {
    if (!isAuthenticated) {
      router.push(`/sign-in?redirectTo=/event/${id}`);
      return;
    }
    try {
      const token = await getInviteToken(id, role);
      if (token?.message !== "ok" || !token?.token) {
        toast.error(t.eventsPage.toast.joinError);
        return;
      }
      router.push(
        `/event/${id}/invite?token=${encodeURIComponent(token.token)}`,
      );
    } catch (err) {
      let message = t.eventsPage.toast.joinFail;
      const ax = err as { response?: { data?: { message?: string } } };
      const backendMessage = ax?.response?.data?.message;
      if (backendMessage) message = backendMessage;
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-background w-full justify-center flex">
      <div className="w-full">
        <OrganizerBanner
          event={event}
          open={bannerOpen}
          onOpenChange={setBannerOpen}
        />

        <div className="max-w-6xl mx-auto mt-6">
          <Card className="border-none shadow-md mb-6">
            <CardHeader className="p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-3 flex-wrap">
                    <CardTitle className="text-2xl lg:text-3xl font-bold">
                      {event?.eventName || "Event"}
                    </CardTitle>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border shadow-sm">
                      Viewer
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {isAuthenticated && (canJoinPresenter || canJoinGuest) && (
            <div className="mt-6 mb-12 flex flex-col sm:flex-row gap-3 justify-center">
              {canJoinPresenter && (
                <Button
                  size="lg"
                  className="w-full sm:w-auto px-8 py-6 text-base text-white"
                  onClick={() => handleJoin("presenter")}
                  style={{ backgroundColor: "var(--role-presenter)" }}
                >
                  {t.eventsPage.joinAsPresenter}
                </Button>
              )}
              {canJoinGuest && (
                <Button
                  size="lg"
                  className="w-full sm:w-auto px-8 py-6 text-base text-white"
                  onClick={() => handleJoin("guest")}
                  style={{ backgroundColor: "var(--role-guest)" }}
                >
                  {t.eventsPage.joinAsGuest}
                </Button>
              )}
            </div>
          )}

          {!isAuthenticated && (
            <div className="mt-6 mb-12 flex justify-center">
              <Button
                size="lg"
                className="w-full sm:w-auto px-8 py-6 text-lg"
                onClick={() => router.push(`/sign-in?redirectTo=/event/${id}`)}
              >
                Log in to Participate
              </Button>
            </div>
          )}

          <Tabs value="information" className="mt-6">
            <TabsList className="w-full flex flex-wrap h-auto p-1 justify-start gap-1 bg-muted/50">
              <TabsTrigger value="information" className="flex-1 min-w-25">
                Information
              </TabsTrigger>
            </TabsList>
            <TabsContent value="information">
              <InformationSection id={id} event={event} editable={false} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
