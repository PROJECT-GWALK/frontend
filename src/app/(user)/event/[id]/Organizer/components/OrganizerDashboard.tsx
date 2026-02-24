import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Coins, Trophy, Gift } from "lucide-react";
import { EventData } from "@/utils/types";
import { useLanguage } from "@/contexts/LanguageContext";
import Image from "next/image";

type Props = {
  event: EventData | null;
};

export default function OrganizerDashboard({ event }: Props) {
  const { t, timeFormat } = useLanguage();
  const unitReward = event?.unitReward ?? "coins";
  const vrTotal = event?.vrTotal ?? 0;
  const vrUsed = event?.vrUsed ?? 0;
  const vrRemaining = Math.max(0, vrTotal - vrUsed);

  const committeeVrTotal =
    event?.committeeVirtualTotal ??
    (event?.committeeCount ?? 0) * (event?.virtualRewardCommittee ?? 0);
  const committeeVrUsed = event?.committeeVirtualUsed ?? 0;
  const committeeVrRemaining = Math.max(0, committeeVrTotal - committeeVrUsed);

  const guestVrTotal =
    event?.participantsVirtualTotal ?? (event?.guestsCount ?? 0) * (event?.virtualRewardGuest ?? 0);
  const guestVrUsed = event?.participantsVirtualUsed ?? 0;
  const guestVrRemaining = Math.max(0, guestVrTotal - guestVrUsed);

  return (
    <div className="space-y-6 mt-6">
      {/* SECTION 1: PEOPLE & PARTICIPATION */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Participants - Highlighted Card */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-1 border-l-4 border-l-blue-600 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              {t("dashboard.totalParticipants")}
              <Users className="h-4 w-4 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-700">
              {(event?.presentersCount ?? 0) +
                (event?.guestsCount ?? 0) +
                (event?.committeeCount ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {t("organizerDashboard.totalPeopleInEvent")}
            </p>
          </CardContent>
        </Card>

        {/* Presenters Card */}
        <Card className="shadow-sm border-l-4 border-l-green-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("organizerDashboard.presenters")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{event?.presentersCount ?? 0}</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              {t("organizerDashboard.people")}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {event?.presenterTeams ?? 0} {t("organizerDashboard.outOfTotalTeams")}{" "}
              {event?.maxTeams ?? 0} {t("organizerDashboard.team")}
            </div>
          </CardContent>
        </Card>

        {/* Committee Card */}
        <Card className="shadow-sm border-l-4 border-l-purple-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("organizerDashboard.committee")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">{event?.committeeCount ?? 0}</div>
            {/* <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {t("organizerDashboard.feedback")}: {event?.opinionsCommittee ?? 0}
            </div> */}
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              {t("organizerDashboard.people")}
            </div>
          </CardContent>
        </Card>

        {/* Guest Card */}
        <Card className="shadow-sm border-l-4 border-l-orange-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("organizerDashboard.guests")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">{event?.guestsCount ?? 0}</div>
            {/* <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {t("organizerDashboard.comments")}: {event?.participantsCommentCount ?? 0}
            </div> */}
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              {t("organizerDashboard.people")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 2: REWARDS & GAMIFICATION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Virtual Rewards - Progress Bar Visualization */}
        <Card className="lg:col-span-1 border-t-4 border-t-amber-500 shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Coins className="h-5 w-5 text-amber-600 dark:text-amber-400" />{" "}
              {t("organizerDashboard.virtualRewards")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Total Virtual Rewards */}
            <div className="flex justify-between items-end pb-4 border-b border-border/50">
              <span className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                {vrUsed.toLocaleString(timeFormat)}
              </span>
              <span className="text-sm text-muted-foreground mb-1">
                /
                {vrTotal.toLocaleString(timeFormat)} {unitReward}
              </span>
            </div>

            {/* Overall Progress Bar */}
            <div className="h-2 w-full bg-amber-100 dark:bg-amber-900/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{
                  width: `${
                    vrTotal > 0 ? Math.min(100, (vrUsed / vrTotal) * 100) : 0
                  }%`,
                }}
              />
            </div>

            <div className="text-xs text-muted-foreground flex justify-between">
              <span>
                {t("organizerDashboard.used")}{" "}
                {vrTotal > 0 ? Math.round((vrUsed / vrTotal) * 100) : 0}
                %
              </span>
              <span>
                {t("organizerDashboard.remaining")} {vrRemaining.toLocaleString(timeFormat)}{" "}
                {unitReward}
              </span>
            </div>

            {/* Rewards by Role */}
            {(event?.virtualRewardGuest ?? 0) > 0 || (event?.virtualRewardCommittee ?? 0) > 0 ? (
              <div className="space-y-4 pt-2 border-t border-border/50">
                {/* Committee Rewards */}
                {(event?.virtualRewardCommittee ?? 0) > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-purple-700 dark:text-purple-400">
                        {t("organizerDashboard.committeeVR")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {committeeVrUsed.toLocaleString(timeFormat)}/
                        {committeeVrTotal.toLocaleString(timeFormat)} {unitReward}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-purple-100 dark:bg-purple-900/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            committeeVrTotal > 0
                              ? Math.min(100, (committeeVrUsed / committeeVrTotal) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground flex justify-between">
                      <span>
                        {t("organizerDashboard.total")}:{" "}
                        {committeeVrTotal.toLocaleString(timeFormat)} {unitReward} (
                        {event?.virtualRewardCommittee ?? 0} {unitReward}/
                        {t("organizerDashboard.committee")})
                      </span>
                      <span>
                        {t("organizerDashboard.usedPercent")}{" "}
                        {committeeVrTotal > 0 ? Math.round((committeeVrUsed / committeeVrTotal) * 100) : 0}
                        %
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {t("organizerDashboard.remaining")} {committeeVrRemaining.toLocaleString(timeFormat)}{" "}
                      {unitReward}
                    </div>
                  </div>
                )}
                {/* Guest Rewards */}
                {(event?.virtualRewardGuest ?? 0) > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-orange-700 dark:text-orange-400">
                        {t("organizerDashboard.guestVR")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {guestVrUsed.toLocaleString(timeFormat)}/
                        {guestVrTotal.toLocaleString(timeFormat)} {unitReward}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-orange-100 dark:bg-orange-900/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            guestVrTotal > 0 ? Math.min(100, (guestVrUsed / guestVrTotal) * 100) : 0
                          }%`,
                        }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground flex justify-between">
                      <span>
                        {t("organizerDashboard.total")}:{" "}
                        {guestVrTotal.toLocaleString(timeFormat)} {unitReward} (
                        {event?.virtualRewardGuest ?? 0} {unitReward}/
                        {t("organizerDashboard.guests")})
                      </span>
                      <span>
                        {t("organizerDashboard.usedPercent")}{" "}
                        {guestVrTotal > 0 ? Math.round((guestVrUsed / guestVrTotal) * 100) : 0}
                        %
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {t("organizerDashboard.remaining")} {guestVrRemaining.toLocaleString(timeFormat)}{" "}
                      {unitReward}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Special Prizes - Voting Status */}
        <Card className="lg:col-span-1 border-t-4 border-t-purple-500 shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
              <Trophy className="h-5 w-5 text-purple-600 dark:text-purple-400" />{" "}
              {t("organizerDashboard.votingProgress")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stats Row */}
            <div className="flex justify-between items-end">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-purple-700 dark:text-purple-400">
                  {event?.specialPrizeUsed ?? 0}
                </span>
                <span className="text-sm text-muted-foreground">
                  / {(event?.committeeCount ?? 0) * (event?.specialPrizeCount ?? 0)}{" "}
                  {t("organizerDashboard.totalVotes")}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full bg-purple-100 dark:bg-purple-900/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                style={{
                  width: `${
                    (event?.committeeCount ?? 0) * (event?.specialPrizeCount ?? 0) > 0
                      ? ((event?.specialPrizeUsed ?? 0) /
                          ((event?.committeeCount ?? 0) * (event?.specialPrizeCount ?? 0))) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>

            {/* Available Awards List */}
            <div className="pt-2">
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Gift className="h-3 w-3" /> {t("organizerDashboard.availableAwards")}
              </p>
              <div className="space-y-3">
                {event?.specialRewards && event.specialRewards.length > 0 ? (
                  event.specialRewards.map((reward, i) => (
                    <div
                      key={reward.id || i}
                      className="flex items-start gap-3 p-3 bg-purple-50/50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-800"
                    >
                      {/* Badge Image */}
                      <div className="relative w-10 h-10 shrink-0 rounded-md overflow-hidden bg-card border border-border shadow-sm">
                        {reward.image ? (
                          <Image
                            src={reward.image}
                            alt={reward.name}
                            width={40}
                            height={40}
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                            <Trophy className="w-5 h-5" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-semibold text-purple-900 dark:text-purple-100 truncate block pr-2">
                            {reward.name}
                          </span>
                          <span className="text-xs font-medium text-purple-600 dark:text-purple-300 shrink-0 bg-white dark:bg-purple-950/50 px-2 py-0.5 rounded-full border border-purple-100 dark:border-purple-800 shadow-sm">
                            {reward.voteCount ?? 0} {t("organizerDashboard.vote")}
                          </span>
                        </div>

                        {/* Mini Progress Bar */}
                        <div className="h-1.5 w-full bg-purple-200 dark:bg-purple-900/30 rounded-full overflow-hidden mb-1.5">
                          <div
                            className="h-full bg-purple-500 rounded-full transition-all duration-500"
                            style={{
                              width: `${event?.committeeCount && event.committeeCount > 0 ? Math.min(100, ((reward.voteCount ?? 0) / event.committeeCount) * 100) : 0}%`,
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>
                            {t("organizerDashboard.committee")}: {reward.voteCount ?? 0}/
                            {event?.committeeCount ?? 0}
                          </span>
                          <span>
                            {t("organizerDashboard.candidates")}: {reward.teamCount ?? 0}{" "}
                            {t("organizerDashboard.team")}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground italic">
                    No special awards configured
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 3: ENGAGEMENT & OPINIONS */}
      {/* <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-muted/50 rounded-full shadow-sm border border-border">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                {t("organizerDashboard.totalFeedbackReceived")}
              </h3>
              <p className="text-muted-foreground text-sm">
                {t("organizerDashboard.feedbackSummary")}
              </p>
            </div>
          </div>

          <div className="flex gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-foreground">{event?.opinionsGot ?? 0}</div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t("organizerDashboard.total")}
              </div>
            </div>
            <div className="h-10 w-px bg-border"></div>
            <div className="grid grid-cols-3 gap-6 text-left">
              <div>
                <div className="text-xl font-bold text-foreground">{event?.opinionsGuest ?? 0}</div>
                <div className="text-[10px] text-muted-foreground">
                  {t("organizerDashboard.guests")}
                </div>
              </div>
              <div>
                <div className="text-xl font-bold text-foreground">
                  {event?.opinionsCommittee ?? 0}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {t("organizerDashboard.committee")}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
}
