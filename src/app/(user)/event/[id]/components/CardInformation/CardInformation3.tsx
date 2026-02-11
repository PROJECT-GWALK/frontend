"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Edit, FileText, Gift, Award } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Separator } from "@/components/ui/separator";
import type { EventData } from "@/utils/types";

type Props = {
  event: EventData;
  editable?: boolean;
  onEdit?: (section: "presenter" | "guest", initialForm: Record<string, unknown>) => void;
};

const getRewardFontSize = (val: number | undefined | null) => {
  const v = val ?? 0;
  const s = String(v);
  if (s.length > 12) return "text-xl sm:text-2xl lg:text-3xl"; // 1,000,000,000+
  if (s.length > 10) return "text-2xl sm:text-3xl lg:text-4xl"; // 1,000,000 - 9,999,999
  if (s.length > 7) return "text-3xl sm:text-4xl lg:text-5xl"; // 100,000 - 999,999
  return "text-4xl sm:text-5xl lg:text-6xl"; // 0 - 99,999
};

export default function CardInformation3({ event, editable, onEdit }: Props) {
  const { t, language } = useLanguage();

  return (
    <Card className="lg:col-span-2 border-none dark:border dark:border-white/10 shadow-md hover:shadow-lg transition-all duration-300 group">
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold group-hover:text-(--role-presenter) transition-colors">
            <div className="p-2.5 rounded-xl bg-(--role-presenter)/10 text-(--role-presenter) dark:bg-(--role-presenter)/20">
              <Users className="h-5 w-5" />
            </div>
            {t("configuration.title") || "Participation Guidelines"}
          </CardTitle>
          {editable && onEdit && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 rounded-full hover:bg-(--role-presenter)/10 hover:text-(--role-presenter)"
                title="Edit Presenter Config"
                onClick={() =>
                  onEdit("presenter", {
                    startJoinDate: event?.startJoinDate ?? "",
                    endJoinDate: event?.endJoinDate ?? "",
                    maxTeams: event?.maxTeams ?? 0,
                    maxTeamMembers: event?.maxTeamMembers ?? 0,
                  })
                }
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 rounded-full hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-300"
                title="Edit Rewards"
                onClick={() =>
                  onEdit("guest", {
                    guestReward: event?.virtualRewardGuest ?? 0,
                    committeeReward: event?.virtualRewardCommittee ?? 0,
                    unitReward: event?.unitReward ?? "coins",
                    hasCommittee: event?.hasCommittee ?? false,
                    gradingEnabled: event?.gradingEnabled ?? true,
                    vrTeamCapEnabled: event?.vrTeamCapEnabled ?? true,
                    vrTeamCapGuest: event?.vrTeamCapGuest ?? 10,
                    vrTeamCapCommittee: event?.vrTeamCapCommittee ?? 20,
                  })
                }
              >
                <Gift className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Constraints Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-(--role-presenter) uppercase tracking-wider flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-(--role-presenter)"></span>
              {t("configuration.presenterConfig") || "Team & Member Limits"}
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-(--role-presenter)/5 dark:bg-(--role-presenter)/10 border border-(--role-presenter)/10 dark:border-(--role-presenter)/20 hover:bg-(--role-presenter)/10 transition-colors">
                <div className="text-3xl font-black text-(--role-presenter)">
                  {event?.maxTeams ?? "-"}
                </div>
                <div className="text-xs text-muted-foreground font-bold uppercase mt-2 tracking-wide text-center">
                  {t("information.maxTeams")}
                </div>
              </div>
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-(--role-presenter)/5 dark:bg-(--role-presenter)/10 border border-(--role-presenter)/10 dark:border-(--role-presenter)/20 hover:bg-(--role-presenter)/10 transition-colors">
                <div className="text-3xl font-black text-(--role-presenter)">
                  {event?.maxTeamMembers ?? "-"}
                </div>
                <div className="text-xs text-muted-foreground font-bold uppercase mt-2 tracking-wide text-center">
                  {t("information.memberPerGroup")}
                </div>
              </div>
            </div>
          </div>

          {/* File Requirements Section */}
          {event?.fileTypes && event.fileTypes.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-bold text-(--role-presenter) uppercase tracking-wider flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-(--role-presenter)"></span>
                {t("fileRequirements.title")}
              </h4>
              <div className="grid gap-3">
                {event.fileTypes.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-4 p-4 rounded-xl border bg-card hover:bg-(--role-presenter)/5 hover:border-(--role-presenter)/30 transition-all duration-300 group/file"
                  >
                    <div className="p-2.5 rounded-lg bg-(--role-presenter)/10 text-(--role-presenter) group-hover/file:scale-110 transition-transform">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm">{file.name}</span>
                        {file.isRequired && (
                          <span className="text-[10px] font-extrabold text-white bg-(--role-presenter) px-2 py-0.5 rounded-full shadow-sm">
                            {t("fileRequirements.required")}
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-mono bg-muted/50 px-2 py-1 rounded w-fit text-foreground/70">
                        {file.allowedFileTypes.join(", ").toUpperCase()}
                      </div>
                      {file.description && (
                        <div className="text-xs text-muted-foreground italic border-l-2 border-(--role-presenter)/20 pl-2">
                          {file.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Rewards Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-indigo-500"></span>
              {t("information.rewardPoints") || "Rewards"}
            </h4>
            <div className="flex flex-col gap-4">
              {event?.hasCommittee && (
                <div className="relative overflow-hidden flex flex-col justify-between p-5 rounded-3xl bg-linear-to-br from-(--role-committee) via-(--role-committee)/90 to-(--role-committee) text-white shadow-lg transition-all hover:scale-[1.01] hover:shadow-xl min-h-40 group/card border border-white/10">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/card:opacity-20 transition-opacity duration-500">
                    <Gift className="h-32 w-32 rotate-12 -mr-8 -mt-8" />
                  </div>
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider mb-4 backdrop-blur-md border border-white/10 shadow-sm w-fit max-w-full">
                      <Award className="w-3 h-3 shrink-0" />
                      <span className="truncate">{t("rewardsCard.committeeReward")}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span
                        className={`${getRewardFontSize(
                          event?.virtualRewardCommittee
                        )} font-black tracking-tighter drop-shadow-md leading-none break-all`}
                        title={String(event?.virtualRewardCommittee ?? 0)}
                      >
                        {event?.virtualRewardCommittee ?? 0}
                      </span>
                      <span
                        className="text-lg font-medium opacity-90 capitalize wrap-break-word leading-tight"
                        title={event?.unitReward ?? "coins"}
                      >
                        {event?.unitReward ?? "coins"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs font-medium opacity-75 relative z-10">
                    <div className="h-1 w-6 rounded-full bg-white/40"></div>
                    <span>{t("rewardsCard.basePoints")}</span>
                  </div>
                </div>
              )}

              <div className="relative overflow-hidden flex flex-col justify-between p-5 rounded-3xl bg-linear-to-br from-(--role-guest) via-(--role-guest)/90 to-(--role-guest) text-white shadow-lg transition-all hover:scale-[1.01] hover:shadow-xl min-h-40 group/card border border-white/10">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/card:opacity-20 transition-opacity duration-500">
                  <Gift className="h-32 w-32 rotate-12 -mr-8 -mt-8" />
                </div>
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider mb-4 backdrop-blur-md border border-white/10 shadow-sm w-fit max-w-full">
                    <Users className="w-3 h-3 shrink-0" />
                    <span className="truncate">{t("rewardsCard.guestReward")}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span
                      className={`${getRewardFontSize(
                        event?.virtualRewardGuest
                      )} font-black tracking-tighter drop-shadow-md leading-none break-all`}
                      title={String(event?.virtualRewardGuest ?? 0)}
                    >
                      {event?.virtualRewardGuest ?? 0}
                    </span>
                    <span
                      className="text-lg font-medium opacity-90 capitalize wrap-break-word leading-tight"
                      title={event?.unitReward ?? "coins"}
                    >
                      {event?.unitReward ?? "coins"}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs font-medium opacity-75 relative z-10">
                  <div className="h-1 w-6 rounded-full bg-white/40"></div>
                  <span>{t("rewardsCard.basePoints")}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </CardContent>
    </Card>
  );
}
