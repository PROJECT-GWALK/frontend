"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Info, MapPin, Link as LinkIcon, Eye, Edit, Globe, Lock, HelpCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Separator } from "@/components/ui/separator";
import { EventData } from "@/utils/types";
import { linkify } from "@/utils/function";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Props = {
  event: EventData;
  editable?: boolean;
  onEdit?: (section: "description" | "location", initialForm: Record<string, unknown>) => void;
  linkLabel?: string;
};

export default function CardInformation1({ event, editable, onEdit, linkLabel = "Link" }: Props) {
  const { t } = useLanguage();

  return (
    <Card
      className="border-none dark:border dark:border-white/10 shadow-md scroll-mt-20"
      id="info-card-1"
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-3 text-lg font-semibold">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
            <Info className="h-5 w-5" />
          </div>
          <span>{t("eventInfo.eventInformation")}</span>
        </CardTitle>
        {editable && onEdit && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    onEdit("description", {
                      eventDescription: event.eventDescription,
                    })
                  }
                  className="h-8 px-2 lg:px-3"
                >
                  <Edit className="h-4 w-4 mr-2" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p className="text-sm whitespace-pre-line leading-relaxed">
                  {t("toolTip.eventInfo")}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Description Section */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-base font-semibold">{t("eventInfo.eventDescription")}</Label>
            <div className="prose dark:prose-invert max-w-none text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-75 overflow-y-auto pr-2">
              {linkify(event.eventDescription || t("eventInfo.noDescription"))}
            </div>
          </div>
        </div>

        <Separator />

        {/* Location Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-lg">
              <MapPin className="h-5 w-5" />
              {t("eventDraft.locationVisibility")}
            </div>
            {editable && onEdit && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        onEdit("location", {
                          locationName: event.locationName,
                          location: event.location,
                        })
                      }
                      className="h-8 px-2 lg:px-3"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p className="text-sm whitespace-pre-line leading-relaxed">
                      {t("toolTip.eventLocation")}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                {t("eventInfo.locationVenue")}
              </Label>
              <div className="flex items-center gap-2 font-medium">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span>{event.locationName || "-"}</span>
              </div>
            </div>

            <div
              className={`space-y-1 ${event.location?.trim().startsWith("<iframe") ? "md:col-span-2" : ""}`}
            >
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                {t("eventInfo.locationLink")}
              </Label>
              {event.location?.trim().startsWith("<iframe") ? (
                <div
                  className="mt-2 relative w-full aspect-video rounded-lg overflow-hidden border bg-muted/10 dark:bg-muted/20 [&>iframe]:absolute [&>iframe]:top-0 [&>iframe]:left-0 [&>iframe]:w-full [&>iframe]:h-full"
                  dangerouslySetInnerHTML={{ __html: event.location || "" }}
                />
              ) : (
                <div className="flex items-center gap-2 font-medium truncate">
                  <LinkIcon className="h-4 w-4 text-primary shrink-0" />
                  {event.location ? (
                    <a
                      href={event.location}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate block"
                    >
                      {event.location}
                    </a>
                  ) : (
                    <span>-</span>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                {t("eventInfo.eventVisibility")}
              </Label>
              <div className="flex items-center gap-2 font-medium">
                {event.publicView ? (
                  <>
                    <Globe className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">{t("eventInfo.public")}</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 text-amber-600" />
                    <span className="text-amber-600">{t("eventInfo.private")}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
