"use client";

import * as React from "react";
import { Award, Check, ChevronsUpDown, Gift, Search, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useParams, usePathname, useRouter } from "next/navigation";
import { getTeams } from "@/utils/apievent";
import { Team } from "@/utils/types";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SelectTeam({ className }: { className?: string }) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();
  // Ensure we handle potential array values from params, though usually they are strings
  const eventId = Array.isArray(params.id) ? params.id[0] : params.id;
  const currentProjectId = Array.isArray(params.projectId) ? params.projectId[0] : params.projectId;

  const [open, setOpen] = React.useState(false);
  const [teams, setTeams] = React.useState<Team[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    const fetchTeams = async () => {
      if (!eventId) return;
      setLoading(true);
      try {
        const res = await getTeams(eventId);
        if (res.message === "ok") {
          setTeams(res.teams);
        }
      } catch (error) {
        console.error("Failed to fetch teams", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, [eventId]);

  const filteredTeams = teams.filter((team) =>
    team.teamName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedTeam = teams.find((team) => team.id === currentProjectId);

  const vrTitle = `${t("projectDetail.evaluation.virtualReward")} ✓`;
  const specialTitle = `${t("projectDetail.evaluation.specialReward")} ✓`;
  const gradingTitle = `${t("projectDetail.evaluation.grading")} ✓`;

  const onSelect = (teamId: string) => {
    setOpen(false);
    if (teamId === currentProjectId) return;

    let newPath = "";
    if (pathname.includes("/Scores")) {
         newPath = `/event/${eventId}/Projects/${teamId}/Scores`;
    } else {
         newPath = `/event/${eventId}/Projects/${teamId}`;
    }
    
    router.push(newPath);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-[250px] justify-between", className)}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="truncate">
              {selectedTeam ? selectedTeam.teamName : "Select team..."}
            </span>
            {selectedTeam && (
              <div className="flex items-center gap-1 shrink-0">
                {(selectedTeam.myReward ?? 0) > 0 && (
                  <span title={vrTitle} className="inline-flex">
                    <Gift className="h-4 w-4 text-emerald-600" />
                  </span>
                )}
                {(selectedTeam.mySpecialRewards?.length ?? 0) > 0 && (
                  <span title={specialTitle} className="inline-flex">
                    <Award className="h-4 w-4 text-emerald-600" />
                  </span>
                )}
                {!!selectedTeam.myGraded && (
                  <span title={gradingTitle} className="inline-flex">
                    <Star className="h-4 w-4 text-emerald-600" />
                  </span>
                )}
              </div>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <div className="flex flex-col">
            <div className="flex items-center border-b px-3">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <Input
                    placeholder="Search team..."
                    className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-none focus-visible:ring-0 px-0 shadow-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <div className="max-h-[300px] overflow-y-auto p-1 custom-scrollbar">
                {loading ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">Loading...</div>
                ) : filteredTeams.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">No team found.</div>
                ) : (
                    filteredTeams.map((team) => (
                        <div
                            key={team.id}
                            className={cn(
                                "relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                                team.id === currentProjectId && "bg-accent text-accent-foreground"
                            )}
                            onClick={() => onSelect(team.id)}
                        >
                            <Check
                                className={cn(
                                    "mr-2 h-4 w-4",
                                    team.id === currentProjectId ? "opacity-100" : "opacity-0"
                                )}
                            />
                            <span className="truncate flex-1 min-w-0">{team.teamName}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              {(team.myReward ?? 0) > 0 && (
                                <span title={vrTitle} className="inline-flex">
                                  <Gift className="h-4 w-4 text-emerald-600" />
                                </span>
                              )}
                              {(team.mySpecialRewards?.length ?? 0) > 0 && (
                                <span title={specialTitle} className="inline-flex">
                                  <Award className="h-4 w-4 text-emerald-600" />
                                </span>
                              )}
                              {!!team.myGraded && (
                                <span title={gradingTitle} className="inline-flex">
                                  <Star className="h-4 w-4 text-emerald-600" />
                                </span>
                              )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
