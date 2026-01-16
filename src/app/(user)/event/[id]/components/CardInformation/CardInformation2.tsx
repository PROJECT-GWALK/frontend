"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CalendarIcon, Edit } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDateTime, timeUntil } from "@/utils/function";
import type { EventData } from "@/utils/types";

type Props = {
  event: EventData;
  editable?: boolean;
  onEdit?: (section: "time", initialForm: Record<string, unknown>) => void;
  language?: string;
};

export default function CardInformation2({
  event,
  editable,
  onEdit,
  language = "en",
}: Props) {
  const { t } = useLanguage();
  const locale = language === "th" ? "th-TH" : "en-US";

  return (
    <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300 group">
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold group-hover:text-primary transition-colors">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              <Clock className="h-5 w-5" />
            </div>
            {t("eventTime.timeConfiguration") || t("information.eventDuration")}
          </CardTitle>
          {editable && onEdit && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 rounded-full hover:bg-muted"
              onClick={() => onEdit("time", {})}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {/* Status Display */}
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
            {(() => {
              const now = new Date();
              const sv = event?.startView ? new Date(event.startView) : undefined;
              const ev = event?.endView ? new Date(event.endView) : undefined;

              if (sv && now < sv) {
                return (
                  <div className="text-center">
                    <div className="text-sm font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                      {t("eventStatus.startsIn")}
                    </div>
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {timeUntil(event.startView!, language)}
                    </div>
                  </div>
                );
              }
              if (sv && (!ev || now <= ev)) {
                return (
                  <div className="text-center">
                    <div className="text-sm font-medium text-green-600 dark:text-green-400 uppercase tracking-wide mb-1">
                      {t("eventStatus.endsIn")}
                    </div>
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {event?.endView
                        ? timeUntil(event.endView, language)
                        : t("eventStatus.ongoing")}
                    </div>
                  </div>
                );
              }
              return (
                <div className="text-center">
                  <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    {t("eventStatus.status")}
                  </div>
                  <div className="text-xl font-bold text-muted-foreground">
                    {t("eventStatus.eventEnded")}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Submission Period */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b">
              <CalendarIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold">
                {t("eventTime.submissionPeriod") || "Submission Period"}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex flex-col items-center justify-center text-xs border">
                  <span className="font-bold">
                    {event?.startJoinDate
                      ? new Date(event.startJoinDate).getDate()
                      : "-"}
                  </span>
                  <span className="text-[10px] uppercase text-muted-foreground">
                    {event?.startJoinDate
                      ? new Date(event.startJoinDate).toLocaleString(locale, {
                          month: "short",
                        })
                      : "-"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground uppercase font-medium">
                    {t("information.start")}
                  </span>
                  <span className="font-medium text-sm">
                    {event?.startJoinDate
                      ? formatDateTime(new Date(event.startJoinDate), locale)
                      : "-"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex flex-col items-center justify-center text-xs border">
                  <span className="font-bold">
                    {event?.endJoinDate
                      ? new Date(event.endJoinDate).getDate()
                      : "-"}
                  </span>
                  <span className="text-[10px] uppercase text-muted-foreground">
                    {event?.endJoinDate
                      ? new Date(event.endJoinDate).toLocaleString(locale, {
                          month: "short",
                        })
                      : "-"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground uppercase font-medium">
                    {t("information.end")}
                  </span>
                  <span className="font-medium text-sm">
                    {event?.endJoinDate
                      ? formatDateTime(new Date(event.endJoinDate), locale)
                      : "-"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Event Period */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 pb-1 border-b">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold">
                {t("eventInfo.eventTimePeriod") || "Event Period"}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex flex-col items-center justify-center text-xs border">
                  <span className="font-bold">
                    {event?.startView
                      ? new Date(event.startView).getDate()
                      : "-"}
                  </span>
                  <span className="text-[10px] uppercase text-muted-foreground">
                    {event?.startView
                      ? new Date(event.startView).toLocaleString(locale, {
                          month: "short",
                        })
                      : "-"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground uppercase font-medium">
                    {t("information.start")}
                  </span>
                  <span className="font-medium text-sm">
                    {event?.startView
                      ? formatDateTime(new Date(event.startView), locale)
                      : "-"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex flex-col items-center justify-center text-xs border">
                  <span className="font-bold">
                    {event?.endView
                      ? new Date(event.endView).getDate()
                      : "-"}
                  </span>
                  <span className="text-[10px] uppercase text-muted-foreground">
                    {event?.endView
                      ? new Date(event.endView).toLocaleString(locale, {
                          month: "short",
                        })
                      : "-"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground uppercase font-medium">
                    {t("information.end")}
                  </span>
                  <span className="font-medium text-sm">
                    {event?.endView
                      ? formatDateTime(new Date(event.endView), locale)
                      : "-"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
