import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Coins, Trophy, Gift, MessageSquare } from "lucide-react";
import { EventData } from "@/utils/types";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  event: EventData | null;
};

export default function OrganizerDashboard({ event }: Props) {
  const { t, timeFormat } = useLanguage();

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
            <p className="text-xs text-muted-foreground mt-2">{t("organizerDashboard.totalPeopleInEvent")}</p>
          </CardContent>
        </Card>

        {/* Breakdown Cards - Compact Design */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("dashboard.teamCount")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {event?.presenterTeams ?? 0}
              <span className="text-sm font-normal text-muted-foreground ml-2">{t("organizerDashboard.team")}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {t("organizerDashboard.outOfTotalTeams")} {event?.maxTeams ?? 0} {t("organizerDashboard.team")}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("organizerDashboard.guests")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{event?.guestsCount ?? 0}</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {t("organizerDashboard.comments")}: {event?.participantsCommentCount ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("organizerDashboard.committee")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{event?.committeeCount ?? 0}</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {t("organizerDashboard.feedback")}: {event?.opinionsCommittee ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 2: REWARDS & GAMIFICATION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Virtual Rewards - Progress Bar Visualization */}
        <Card className="lg:col-span-1 border-t-4 border-t-amber-500 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <Coins className="h-5 w-5" /> Virtual Rewards
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-3xl font-bold text-amber-600">
                {event?.vrUsed?.toLocaleString(timeFormat) ?? "0"}
              </span>
              <span className="text-sm text-muted-foreground mb-1">
                / {event?.vrTotal?.toLocaleString(timeFormat) ?? "0"} {event?.unitReward ?? "coins"}
              </span>
            </div>

            {/* Custom Progress Bar */}
            <div className="h-2 w-full bg-amber-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{
                  width: `${
                    event?.vrTotal && event.vrTotal > 0 
                    ? ((event?.vrUsed ?? 0) / event.vrTotal) * 100 
                    : 0
                  }%`,
                }}
              />
            </div>

            <div className="text-xs text-muted-foreground pt-1 flex justify-between">
              <span>
                {t("organizerDashboard.used")}{" "}
                {event?.vrUsed && event?.vrTotal && event.vrTotal > 0
                  ? Math.round((event.vrUsed / event.vrTotal) * 100)
                  : 0}
                %
              </span>
              <span>
                {t("organizerDashboard.remaining")} {(event?.vrTotal ?? 0) - (event?.vrUsed ?? 0)} {event?.unitReward ?? "coins"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Special Prizes - Voting Status */}
        <Card className="lg:col-span-1 border-t-4 border-t-purple-500 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Trophy className="h-5 w-5" /> {t("organizerDashboard.votingProgress")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stats Row */}
            <div className="flex justify-between items-end">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-purple-700">
                   {event?.specialPrizeUsed ?? 0}
                </span>
                <span className="text-sm text-muted-foreground">
                  / {(event?.committeeCount ?? 0) * (event?.specialPrizeCount ?? 0)} {t("organizerDashboard.totalVotes")}
                </span>
              </div>
            </div>
            
            {/* Progress Bar */}
             <div className="h-2 w-full bg-purple-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                style={{
                  width: `${
                    ((event?.committeeCount ?? 0) * (event?.specialPrizeCount ?? 0)) > 0 
                    ? ((event?.specialPrizeUsed ?? 0) / ((event?.committeeCount ?? 0) * (event?.specialPrizeCount ?? 0))) * 100 
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
                    <div key={reward.id || i} className="flex items-start gap-3 p-3 bg-purple-50/50 rounded-lg border border-purple-100">
                      {/* Badge Image */}
                      <div className="relative w-10 h-10 shrink-0 rounded-md overflow-hidden bg-white border shadow-sm">
                        {reward.image ? (
                          <img src={reward.image} alt={reward.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full text-purple-300">
                            <Trophy className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-semibold text-purple-900 truncate block pr-2">{reward.name}</span>
                          <span className="text-xs font-medium text-purple-600 shrink-0 bg-white px-2 py-0.5 rounded-full border border-purple-100 shadow-sm">
                            {reward.voteCount ?? 0} votes
                          </span>
                        </div>
                        
                        {/* Mini Progress Bar */}
                        <div className="h-1.5 w-full bg-purple-200 rounded-full overflow-hidden mb-1.5">
                          <div 
                            className="h-full bg-purple-500 rounded-full transition-all duration-500" 
                            style={{ width: `${event?.committeeCount && event.committeeCount > 0 ? Math.min(100, ((reward.voteCount ?? 0) / event.committeeCount) * 100) : 0}%` }}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>
                             Committees: {reward.voteCount ?? 0}/{event?.committeeCount ?? 0}
                          </span>
                          <span>
                             Candidates: {reward.teamCount ?? 0} teams
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                   <span className="text-xs text-muted-foreground italic">No special awards configured</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 3: ENGAGEMENT & OPINIONS */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-full shadow-sm border">
              <MessageSquare className="h-8 w-8 text-slate-700" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{t("organizerDashboard.totalFeedbackReceived")}</h3>
              <p className="text-muted-foreground text-sm">
                {t("organizerDashboard.feedbackSummary")}
              </p>
            </div>
          </div>

          <div className="flex gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-slate-800">
                {event?.opinionsGot ?? 0}
              </div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t("organizerDashboard.total")}
              </div>
            </div>
            <div className="h-10 w-px bg-slate-300"></div> {/* Divider */}
            <div className="grid grid-cols-3 gap-6 text-left">
              <div>
                <div className="text-xl font-bold text-slate-700">
                  {event?.opinionsGuest ?? 0}
                </div>
                <div className="text-[10px] text-muted-foreground">{t("organizerDashboard.guests")}</div>
              </div>
              <div>
                <div className="text-xl font-bold text-slate-700">
                  {event?.opinionsCommittee ?? 0}
                </div>
                <div className="text-[10px] text-muted-foreground">{t("organizerDashboard.committee")}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
