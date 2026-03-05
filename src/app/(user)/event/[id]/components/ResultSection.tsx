"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Maximize2,
  Medal,
  Minimize2,
  RefreshCw,
  Trophy,
  User as UserIcon,
  Gift,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getEventRankings, getTeamById, getEvent } from "@/utils/apievent";
// import { generateMockRankings } from "./mockData";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { Team, EventDetail } from "@/utils/types";
import { UserAvatar } from "@/utils/function";
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";

type Ranking = {
  id: string;
  name: string;
  totalReward: number;
  imageCover: string | null;
  rank: number;
};

type SpecialReward = {
  id: string;
  name: string;
  description?: string;
  image?: string | null;
  winner: {
    id: string;
    name: string;
    votes: number;
  } | null;
  winners?: {
    id: string;
    name: string;
    votes: number;
  }[];
  votes?: {
    id: string;
    name: string;
    votes: number;
  }[];
};

type Props = {
  eventId: string;
  role: "COMMITTEE" | "ORGANIZER" | "GUEST" | "PRESENTER";
  eventStartView?: string | null;
};

type ChartEntry = {
  id: string;
  name: string;
  totalReward: number;
};

type BarNameLabelProps = {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  height?: number | string;
  value?: string | number;
};

export default function ResultSection({ eventId, role, eventStartView }: Props) {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [specialRewards, setSpecialRewards] = useState<SpecialReward[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [topN, setTopN] = useState("5");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [eventInfo, setEventInfo] = useState<EventDetail | null>(null);
  const [expandedVotedTeams, setExpandedVotedTeams] = useState<Record<string, boolean>>({});
  const [expandedRewardDetails, setExpandedRewardDetails] = useState<Record<string, boolean>>({});

  const now = new Date();
  const eventStarted = !eventStartView || now >= new Date(eventStartView);

  const chartConfig = useMemo(
    () => ({
      totalReward: {
        label: `${eventInfo?.unitReward ?? "coins"}`,
        color: "hsl(var(--chart-1))",
      },
    }),
    [eventInfo?.unitReward],
  ) satisfies ChartConfig;

  // Team Selection State
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [loadingTeam, setLoadingTeam] = useState(false);

  const handleBarClick = async (entry: ChartEntry) => {
    const teamId = entry.id;
    if (!teamId) return;

    // If clicking the same team, toggle off
    if (teamId === selectedTeamId) {
      setSelectedTeamId(null);
      setSelectedTeam(null);
      return;
    }

    setSelectedTeamId(teamId);
    setLoadingTeam(true);
    setSelectedTeam(null); // Clear previous team data

    try {
      const res = await getTeamById(eventId, teamId);
      if (res.message === "ok") {
        setSelectedTeam(res.team);
      } else {
        // Fallback for mock data or errors
        console.warn("Could not fetch team details:", res.message);
        // Try to find in rankings if it's a mock team, but mock teams don't have full details usually.
        // We can just show what we have in rankings if fetch fails?
        // But for now let's just leave it empty or show error.
      }
    } catch (error) {
      console.error("Failed to fetch team details", error);
    } finally {
      setLoadingTeam(false);
    }
  };

  // Dynamic bar size based on topN
  const getBarSize = (
    count: number,
    isFullscreenMode: boolean,
    isMobileView: boolean,
  ): number | string => {
    if (isFullscreenMode && !isMobileView) {
      return "65%";
    }

    if (count <= 1) return isMobileView ? 110 : 300;
    if (count <= 2) return isMobileView ? 88 : 180;
    if (count <= 3) return isMobileView ? 72 : 150;
    if (count <= 5) return isMobileView ? 56 : 120;
    if (count <= 8) return isMobileView ? 44 : 100;
    if (count <= 10) return isMobileView ? 38 : 80;
    if (count <= 15) return isMobileView ? 32 : 60;
    if (count <= 20) return isMobileView ? 28 : 56;
    return isMobileView ? 24 : 52;
  };

  const isUserScrollingRef = useRef(false);

  // Detect scroll to pause auto-updates
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 50 || (containerRef.current?.scrollTop || 0) > 50;
      isUserScrollingRef.current = scrolled;
    };

    window.addEventListener("scroll", handleScroll);
    const container = containerRef.current;
    if (container) container.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (container) container.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const fetchData = useCallback(
    async (mode: "initial" | "manual" | "auto" = "manual") => {
      if (mode === "auto") {
        // Skip update if user is scrolling to prevent jumping, unless fullscreen (fixed view)
        if (isUserScrollingRef.current && !document.fullscreenElement) {
          return;
        }
      } else {
        setLoading(true);
      }
      setErrorMessage(null);
      try {
        const res = await getEventRankings(eventId);
        setRankings(res.rankings as Ranking[]);
        setSpecialRewards(res.specialRewards);
      } catch (error) {
        console.error("Failed to fetch rankings", error);
        setErrorMessage(t("resultsTab.loadFailed"));
      } finally {
        setLoading(false);
      }
    },
    [eventId, t],
  );

  useEffect(() => {
    fetchData("initial");
    let interval: NodeJS.Timeout;
    if (role === "ORGANIZER" && isFullscreen) {
      interval = setInterval(() => fetchData("auto"), 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchData, role, isFullscreen]);

  useEffect(() => {
    const fetchEventInfo = async () => {
      try {
        const res = await getEvent(eventId);
        if (res.event) {
          setEventInfo(res.event);
        }
      } catch (err) {
        console.error("Failed to fetch event info", err);
      }
    };
    fetchEventInfo();
  }, [eventId]);

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;

    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
      return;
    }

    el.requestFullscreen?.().catch((err) => {
      console.error(`Error attempting to enable fullscreen: ${err.message}`);
    });
  };

  // Listen to fullscreen change
  useEffect(() => {
    const handleFsChange = () => {
      const isFs = document.fullscreenElement === containerRef.current;
      setIsFullscreen(isFs);
      if (!isFs) {
        setSelectedTeamId(null);
        setSelectedTeam(null);
      }
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const topLimit = useMemo(() => {
    const parsed = parseInt(topN, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
  }, [topN]);

  const chartData = useMemo(() => {
    return rankings.slice(0, topLimit).map((r) => ({
      id: r.id,
      name: `#${r.rank} ${r.name}`,
      totalReward: r.totalReward,
    }));
  }, [rankings, topLimit]);

  const mobileChartHeight = useMemo(() => {
    if (!isMobile) return undefined;
    const rowHeight = isFullscreen ? 42 : 46;
    const minHeight = isFullscreen ? 360 : 420;
    return Math.max(minHeight, chartData.length * rowHeight + 40);
  }, [chartData.length, isFullscreen, isMobile]);

  const showLabels = chartData.length <= 30;
  const hasRightPanel = specialRewards.length > 0 || Boolean(selectedTeamId);

  const renderBarNameLabel = ({ x, y, width, height, value }: BarNameLabelProps) => {
    const barX = Number(x ?? 0);
    const barY = Number(y ?? 0);
    const barWidth = Number(width ?? 0);
    const barHeight = Number(height ?? 0);
    const rawLabel = typeof value === "string" ? value : "";

    if (!rawLabel || !Number.isFinite(barWidth) || !Number.isFinite(barHeight)) {
      return null;
    }

    const safeWidth = Math.max(0, barWidth - 20);
    if (safeWidth < 64) {
      return null;
    }

    const maxChars = Math.max(6, Math.floor(safeWidth / 7));
    const displayLabel =
      rawLabel.length > maxChars ? `${rawLabel.slice(0, Math.max(0, maxChars - 3))}...` : rawLabel;

    return (
      <text
        x={barX + 10}
        y={barY + barHeight / 2}
        fill="white"
        fontSize={14}
        fontWeight={600}
        textAnchor="start"
        dominantBaseline="middle"
      >
        <title>{rawLabel}</title>
        {displayLabel}
      </text>
    );
  };

  // ชุดสีที่ดูทันสมัยและสดใส (Modern Vibrant Palette)
  const CHART_COLORS = [
    "#4361ee", // Blue
    "#3a0ca3", // Indigo
    "#7209b7", // Purple
    "#f72585", // Pink
    "#4cc9f0", // Light Blue
    "#f3722c", // Orange
    "#f8961e", // Yellow-Orange
    "#f9c74f", // Yellow
    "#90be6d", // Green
    "#277da1", // Teal
  ];

  if (!eventStarted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Trophy className="h-16 w-16 mb-4 opacity-20" />
        <h3 className="text-xl font-semibold mb-2">
          {t("resultsTab.notStartedTitle") || "Event Not Started"}
        </h3>
        <p className="text-sm">
          {t("resultsTab.notStartedDesc") ||
            "Rankings will be available once the event starts."}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`${
        isFullscreen
          ? "bg-background min-h-screen w-full overflow-y-auto flex flex-col relative lg:h-screen lg:overflow-hidden"
          : "space-y-8"
      }`}
    >
      {isFullscreen && (
        <div className="inset-0 z-0 lg:absolute fixed h-full">
          {eventInfo?.imageCover ? (
            <div className="relative h-full w-full">
              <Image
                src={eventInfo.imageCover || "/banner.png"}
                alt="Background"
                fill
                className="object-cover opacity-20 blur-md scale-105"
              />
            </div>
          ) : (
            <div className="absolute inset-0 bg-linear-to-br from-background to-muted" />
          )}
        </div>
      )}

      <div
        className={`relative z-10 flex flex-col lg:h-full space-y-4 ${isFullscreen ? "p-6 w-full max-w-full overflow-x-hidden lg:h-full lg:overflow-hidden" : ""}`}
      >
        <div className="flex flex-col gap-3 shrink-0">
          {isFullscreen && eventInfo && (
            <Card className="shrink-0 flex items-start justify-between  rounded-xl p-4 shadow-lg">
              <div className="flex items-start gap-4">
                {eventInfo.imageCover && (
                  <div className="relative h-16 md:h-20 aspect-2/1 rounded-lg overflow-hidden shrink-0 border border-white/20 shadow-sm">
                    <Image
                      src={eventInfo.imageCover}
                      alt={eventInfo.eventName}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex flex-col">
                  <h1 className="text-xl md:text-3xl font-bold text-foreground tracking-tight drop-shadow-sm">
                    {eventInfo.eventName}
                  </h1>
                  {eventInfo.eventDescription && (
                    <p className="text-foreground/80 text-sm md:text-base line-clamp-1 max-w-2xl">
                      {eventInfo.eventDescription}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Right side controls if needed, or just keep it clean */}
              </div>
            </Card>
          )}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">{t("resultsTab.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("resultsTab.resultsDesc")}</p>
            </div>
            <div className="flex items-center gap-2">
              {!isFullscreen && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchData("manual")}
                  disabled={loading}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  {t("resultsTab.refresh")}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                aria-label="Toggle fullscreen"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 h-1">
            {/* Status indicators removed as requested */}
          </div>

          {errorMessage && (
            <div className="rounded-lg  px-4 py-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-sm text-destructive">{errorMessage}</div>
                {!isFullscreen && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchData("manual")}
                    disabled={loading}
                  >
                    {t("resultsTab.tryAgain")}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        <div
          className={`${
            isFullscreen
              ? `lg:flex-1 grid grid-cols-1 ${hasRightPanel ? "lg:grid-cols-2" : "lg:grid-cols-1"} gap-6 lg:min-h-0 lg:overflow-hidden`
              : "space-y-8"
          }`}
        >
          {/* Top Rankings Chart */}
          <Card
            className={`flex flex-col ${
              isFullscreen ? "lg:col-span-1 lg:min-h-0" : ""
            }`}
          >
            <CardHeader className="shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle>{t("resultsTab.topProjects")}</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {t("resultsTab.showTop")}:
                  </span>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    // max={rankings.length > 0 ? rankings.length : 100}
                    value={topN}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "") {
                        setTopN("");
                        return;
                      }
                      const num = parseInt(value, 10);
                      if (!isNaN(num)) {
                        if (num > 30) {
                          setTopN("30");
                        } else {
                          setTopN(value);
                        }
                      }
                    }}
                    className="w-20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-sm"
                  />
                </div>
              </div>
              <CardDescription>
                {t("resultsTab.topProjectsDesc")} ({eventInfo?.unitReward ?? "Points"}).
              </CardDescription>
            </CardHeader>
            <CardContent className="lg:flex-1 lg:min-h-0">
              {loading && rankings.length === 0 ? (
                <div
                  className={`w-full ${
                    isFullscreen ? "h-full min-h-0" : "min-h-75"
                  } flex flex-col justify-center gap-3`}
                >
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-6 w-4/5" />
                </div>
              ) : rankings.length === 0 ? (
                <div
                  className={`w-full ${
                    isFullscreen ? "h-full min-h-0" : "min-h-75"
                  } flex items-center justify-center`}
                >
                  <div className="text-center space-y-2">
                    <div className="text-lg font-semibold">{t("resultsTab.noData")}</div>
                    <div className="text-sm text-muted-foreground">
                      {t("resultsTab.noDataDesc")}
                    </div>
                  </div>
                </div>
              ) : (
                <ChartContainer
                  config={chartConfig}
                  className={`w-full ${isFullscreen ? "lg:h-full lg:min-h-0" : "min-h-75"}`}
                  style={mobileChartHeight ? { height: `${mobileChartHeight}px` } : undefined}
                >
                  <BarChart
                    accessibilityLayer
                    data={chartData}
                    layout="vertical"
                    margin={{
                      left: 0,
                      right: 56,
                      top: 0,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid horizontal={false} />
                    <YAxis dataKey="name" type="category" hide />
                    <XAxis dataKey="totalReward" type="number" hide />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          hideLabel
                          formatter={(value, _name, _item, _index, payload) => {
                            const teamName =
                              payload &&
                              typeof payload === "object" &&
                              "name" in payload &&
                              typeof payload.name === "string"
                                ? payload.name
                                : "-";

                            return (
                              <div className="flex w-full items-center justify-between gap-2">
                                <span className="text-muted-foreground">{teamName}</span>
                                <span className="text-foreground font-mono font-medium tabular-nums">
                                  {typeof value === "number"
                                    ? value.toLocaleString()
                                    : Number(value || 0).toLocaleString()}
                                </span>
                              </div>
                            );
                          }}
                        />
                      }
                    />
                    <Bar
                      dataKey="totalReward"
                      radius={5}
                      barSize={getBarSize(topLimit, isFullscreen, isMobile)}
                      onClick={(data) => {
                        if (!isFullscreen) return;
                        const payload = (data as { payload?: ChartEntry }).payload;
                        if (!payload) return;
                        handleBarClick(payload);
                      }}
                      cursor={isFullscreen ? "pointer" : "default"}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                          className={
                            selectedTeamId === entry.id
                              ? "stroke-primary stroke-[4px] opacity-100 filter drop-shadow-lg"
                              : `transition-all duration-300 ${
                                  selectedTeamId
                                    ? "opacity-50 hover:opacity-60"
                                    : "hover:opacity-80"
                                }`
                          }
                        />
                      ))}
                      {showLabels && (
                        <LabelList
                          dataKey="name"
                          content={renderBarNameLabel}
                        />
                      )}
                      {showLabels && (
                        <LabelList
                          dataKey="totalReward"
                          position="right"
                          offset={10}
                          className="fill-foreground font-bold"
                          fontSize={14}
                          formatter={(value: number) => value.toLocaleString()}
                        />
                      )}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Right Side Panel (Team Details & Special Rewards) */}
          {isFullscreen && hasRightPanel ? (
            <div className="lg:col-span-1 flex flex-col gap-4 lg:min-h-0">
              {/* Special Rewards Section */}
              {specialRewards.length > 0 && (
                <Card
                  className={`flex flex-col ${
                    selectedTeamId ? "lg:flex-4 lg:min-h-0" : "lg:h-full"
                  } border-none shadow-none `}
                >
                  <CardHeader className="shrink-0">
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                        <Trophy className="h-5 w-5" />
                      </div>
                      {t("resultsTab.SR")}
                    </CardTitle>
                    <CardDescription>{t("resultsTab.SRDesc")}</CardDescription>
                  </CardHeader>
                  <CardContent className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto custom-scrollbar">
                    <div className="space-y-4">
                      {specialRewards.map((reward, index) => {
                        const detailsExpanded = expandedRewardDetails[reward.id] === true;
                        const toggleDetails = () => {
                          setExpandedRewardDetails((prev) => ({
                            ...prev,
                            [reward.id]: !detailsExpanded,
                          }));
                        };

                        return (
                          <div
                            key={reward.id}
                            className="border rounded-lg p-3 space-y-3 bg-muted/30"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-muted-foreground">
                                {t("resultsTab.SRRanking")} {index + 1}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={toggleDetails}
                              >
                                {detailsExpanded
                                  ? t("resultsTab.collapseRewardDetails")
                                  : t("resultsTab.expandRewardDetails")}
                                {detailsExpanded ? (
                                  <ChevronUp className="h-3.5 w-3.5 ml-1" />
                                ) : (
                                  <ChevronDown className="h-3.5 w-3.5 ml-1" />
                                )}
                              </Button>
                            </div>
                          <div className="flex items-start gap-4">
                            <div className="w-24 sm:w-32 shrink-0">
                              {reward.image ? (
                                <div className="relative border rounded-lg overflow-hidden aspect-square bg-muted w-full">
                                  <Image
                                    src={reward.image}
                                    alt={reward.name}
                                    fill
                                    className="absolute inset-0 h-full w-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="border-2 border-dashed border-border rounded-lg aspect-square bg-muted flex items-center justify-center">
                                  <Gift className="h-8 w-8 text-muted-foreground/50" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 space-y-2">
                              <div>
                                <div className="text-xs text-muted-foreground">
                                  {t("resultsTab.SRName")}
                                </div>
                                <div className="font-semibold text-sm truncate" title={reward.name}>
                                  {reward.name}
                                </div>
                              </div>
                              {reward.description && (
                                <div>
                                  <div className="text-xs text-muted-foreground">
                                    {t("resultsTab.SRDescCol")}
                                  </div>
                                  <div
                                    className="text-xs text-muted-foreground line-clamp-2"
                                    title={reward.description}
                                  >
                                    {reward.description}
                                  </div>
                                </div>
                              )}

                              {detailsExpanded && (
                                <>
                                  <div className="pt-2 border-t mt-2">
                                    <div className="text-xs text-muted-foreground">
                                      {t("resultsTab.winner")}
                                    </div>
                                    {(() => {
                                      const winners =
                                        reward.winners && reward.winners.length > 0
                                          ? reward.winners
                                          : reward.winner
                                            ? [reward.winner]
                                            : [];
                                      if (winners.length === 0) {
                                        return (
                                          <div className="font-bold text-primary truncate text-sm">
                                            —
                                          </div>
                                        );
                                      }
                                      return (
                                        <div className="flex flex-wrap gap-1">
                                          {winners.map((w) => (
                                            <Badge
                                          key={w.id}
                                          variant="secondary"
                                          className="text-xs bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:hover:bg-yellow-800"
                                          title={w.name}
                                        >
                                          {w.name} ({w.votes} {t("resultsTab.votes")})
                                        </Badge>
                                          ))}
                                        </div>
                                      );
                                    })()}
                                  </div>

                                  <div className="pt-2 border-t">
                                    {(() => {
                                      const previewCount = 4;
                                      const votedTeams =
                                        reward.votes && reward.votes.length > 0
                                          ? reward.votes
                                          : reward.winner
                                            ? [reward.winner]
                                            : [];
                                      const maxVotes =
                                        votedTeams.length > 0 ? votedTeams[0].votes : 0;
                                      const expanded = expandedVotedTeams[reward.id] === true;
                                      const canToggle = votedTeams.length > previewCount;
                                      const visible = expanded
                                        ? votedTeams
                                        : votedTeams.slice(0, previewCount);

                                      const toggle = () => {
                                        setExpandedVotedTeams((prev) => ({
                                          ...prev,
                                          [reward.id]: !expanded,
                                        }));
                                      };

                                      if (votedTeams.length === 0) {
                                        return (
                                          <>
                                            <div className="flex items-center justify-between">
                                              <div className="text-xs text-muted-foreground">
                                                {t("resultsTab.votedTeams")}
                                              </div>
                                            </div>
                                            <div className="text-xs text-muted-foreground italic">
                                              {t("resultsTab.noVotes")}
                                            </div>
                                          </>
                                        );
                                      }
                                      return (
                                        <>
                                          <div className="flex items-center justify-between gap-2">
                                            <div className="text-xs text-muted-foreground">
                                              {t("resultsTab.votedTeams")}
                                            </div>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              className="h-6 px-2 text-xs"
                                              onClick={toggle}
                                              disabled={!canToggle}
                                            >
                                              {expanded
                                                ? t("resultsTab.collapseVotedTeams")
                                                : t("resultsTab.expandVotedTeams")}
                                              {expanded ? (
                                                <ChevronUp className="h-3.5 w-3.5 ml-1" />
                                              ) : (
                                                <ChevronDown className="h-3.5 w-3.5 ml-1" />
                                              )}
                                            </Button>
                                          </div>

                                          <div
                                            className={`mt-1 ${
                                              expanded
                                                ? "max-h-40 overflow-y-auto custom-scrollbar pr-1"
                                                : ""
                                            }`}
                                          >
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                                              {visible.map((v) => (
                                                <div
                                                  key={v.id}
                                                  className="flex items-baseline justify-between gap-2 text-xs"
                                                >
                                                  <div
                                                    className={`min-w-0 truncate ${
                                                      maxVotes > 0 && v.votes === maxVotes
                                                        ? "font-semibold text-primary"
                                                        : "text-foreground"
                                                    }`}
                                                    title={v.name}
                                                  >
                                                    {v.name}
                                                  </div>
                                                  <div className="shrink-0 text-muted-foreground">
                                                    {v.votes} {t("resultsTab.votes")}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        </>
                                      );
                                    })()}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedTeamId && (
                <Card className="lg:flex-6 lg:min-h-0 flex flex-col">
                  <CardHeader className="py-2 px-4 shrink-0">
                    <div className="flex items-start justify-between mt-[-2]">
                      <div className="min-w-0">
                        <CardTitle className="text-base font-bold leading-tight">
                          {t("resultsTab.projectDetail")}
                        </CardTitle>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={() => {
                              setSelectedTeamId(null);
                              setSelectedTeam(null);
                            }}
                            aria-label={t("resultsTab.closeProjectDetail")}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" sideOffset={6}>
                          {t("resultsTab.closeProjectDetail")}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </CardHeader>
                  <CardContent className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto custom-scrollbar px-4 pb-3 pt-0 -mt-10">
                    {loadingTeam ? (
                      <div className="space-y-2">
                        <Skeleton className="h-24 w-full rounded-md" />
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    ) : selectedTeam ? (
                      <div className="flex flex-col gap-4 min-h-full">
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="relative w-[80%] mx-auto md:w-1/2 md:mx-0 aspect-video bg-muted rounded-md overflow-hidden">
                            <Image
                              src={selectedTeam.imageCover || "/banner.png"}
                              alt={selectedTeam.teamName}
                              fill
                              className="object-contain"
                            />
                          </div>

                          <div className="flex-1 min-w-0 flex flex-col">
                            <h3 className="text-lg font-bold text-primary leading-tight line-clamp-2 mb-2">
                              {selectedTeam.teamName}
                            </h3>

                            {selectedTeam.description ? (
                              <div className="flex-1 min-h-0">
                                <div className="text-xs text-muted-foreground line-clamp-4">
                                  {selectedTeam.description}
                                </div>
                                {selectedTeam.description.length > 150 && (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="link"
                                        size="sm"
                                        className="h-auto p-0 text-xs mt-1 text-blue-500 font-semibold"
                                      >
                                        {t("resultsTab.seeMore")}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent align="start" className="w-80 max-w-[90vw]">
                                      <div className="text-sm font-semibold mb-2">
                                        {selectedTeam.teamName}
                                      </div>
                                      <div className="text-xs text-muted-foreground whitespace-pre-wrap max-h-64 overflow-y-auto custom-scrollbar">
                                        {selectedTeam.description}
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                )}
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground italic">
                                {t("resultsTab.noProjectDesc")}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col">
                          <div className="flex items-center justify-between gap-2 shrink-0">
                            <div className="font-semibold text-xs flex items-center gap-1 text-muted-foreground uppercase tracking-wider">
                              <UserIcon className="h-3 w-3" /> {t("resultsTab.member")}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {selectedTeam.participants?.length || 0}
                            </div>
                          </div>

                          {selectedTeam.participants?.length ? (
                            (() => {
                              const maxVisible = 8;
                              const visible = selectedTeam.participants.slice(0, maxVisible);
                              const hidden = selectedTeam.participants.slice(maxVisible);

                              return (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {/* {leader?.user?.name && (
                                  <Badge variant="secondary" className="h-6 px-2 text-[11px]">
                                    Leader: {leader.user.name}
                                  </Badge>
                                )} */}

                                  {visible.map((p) => {
                                    const displayName =
                                      p.user?.name || p.user?.username || "Unknown";
                                    const tooltipText = p.user?.username
                                      ? `@${p.user.username}`
                                      : displayName;
                                    return (
                                      <Tooltip key={p.userId}>
                                        <TooltipTrigger asChild>
                                          <div className="flex items-center gap-1.5 h-6 px-2 rounded-full border bg-background shadow-xs hover:bg-muted/40 transition-colors">
                                            <UserAvatar
                                              user={p.user}
                                              className="h-4 w-4 shrink-0 border text-[9px]"
                                            />
                                            <div className="text-[11px] font-medium max-w-30 truncate">
                                              {displayName}
                                            </div>
                                            {p.isLeader && (
                                              <div className="text-[10px] text-primary/80 font-semibold">
                                                {t("resultsTab.leader")}
                                              </div>
                                            )}
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" sideOffset={6}>
                                          {tooltipText}
                                        </TooltipContent>
                                      </Tooltip>
                                    );
                                  })}

                                  {hidden.length > 0 && (
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="h-6 px-2 rounded-full text-[11px]"
                                        >
                                          +{hidden.length}
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent align="start" className="w-80 max-w-[90vw]">
                                        <div className="text-sm font-semibold mb-2">
                                          {t("resultsTab.allMembers")} (
                                          {selectedTeam.participants.length})
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto custom-scrollbar">
                                          {hidden.map((p) => {
                                            const displayName =
                                              p.user?.name || p.user?.username || "Unknown";
                                            return (
                                              <div
                                                key={p.userId}
                                                className="flex items-center gap-2 p-2 rounded-md border bg-background"
                                              >
                                                <UserAvatar
                                                  user={p.user}
                                                  className="h-7 w-7 shrink-0 border text-[10px]"
                                                />
                                                <div className="min-w-0">
                                                  <div className="text-xs font-medium truncate">
                                                    {displayName}
                                                  </div>
                                                  <div className="text-[11px] text-muted-foreground truncate">
                                                    {p.user?.username ? `@${p.user.username}` : "—"}
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </PopoverContent>
                                    </Popover>
                                  )}
                                </div>
                              );
                            })()
                          ) : (
                            <div className="mt-2 text-xs text-muted-foreground italic">
                              {t("resultsTab.noMembers")}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
                        <p>{t("resultsTab.noProjectDetail")}</p>
                        <p className="text-xs mt-1">{t("resultsTab.noProjectDetailDesc")}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            // Non-Fullscreen Mode
            specialRewards.length > 0 && (
              <Card className="flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                      <Trophy className="h-5 w-5" />
                    </div>
                    {t("resultsTab.SR")}
                  </CardTitle>
                  <CardDescription>{t("resultsTab.SRDesc")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                    {specialRewards.map((reward, index) => {
                      const detailsExpanded = expandedRewardDetails[reward.id] === true;
                      const toggleDetails = () => {
                        setExpandedRewardDetails((prev) => ({
                          ...prev,
                          [reward.id]: !detailsExpanded,
                        }));
                      };

                      return (
                        <div
                          key={reward.id}
                          className="border rounded-lg p-3 space-y-3 bg-muted/30"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">
                              {t("resultsTab.SRRanking")} {index + 1}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={toggleDetails}
                            >
                              {detailsExpanded
                                ? t("resultsTab.collapseRewardDetails")
                                : t("resultsTab.expandRewardDetails")}
                              {detailsExpanded ? (
                                <ChevronUp className="h-3.5 w-3.5 ml-1" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5 ml-1" />
                              )}
                            </Button>
                          </div>
                        <div className="flex items-start gap-3">
                          <div className="w-20 shrink-0">
                            {reward.image ? (
                              <div className="relative border rounded-lg overflow-hidden aspect-square bg-muted w-full">
                                <Image
                                  src={reward.image}
                                  alt={reward.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="border-2 border-dashed border-border rounded-lg aspect-square bg-muted flex items-center justify-center">
                                <Gift className="h-8 w-8 text-muted-foreground/50" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 space-y-2">
                            <div>
                              <div className="text-xs text-muted-foreground">
                                {t("resultsTab.SRName")}
                              </div>
                              <div className="font-semibold text-sm truncate" title={reward.name}>
                                {reward.name}
                              </div>
                            </div>
                            {reward.description && (
                              <div>
                                <div className="text-xs text-muted-foreground">
                                  {t("resultsTab.SRDescCol")}
                                </div>
                                <div
                                  className="text-xs text-muted-foreground line-clamp-2"
                                  title={reward.description}
                                >
                                  {reward.description}
                                </div>
                              </div>
                            )}

                            {detailsExpanded && (
                              <>
                                <div className="pt-2 border-t mt-2">
                                  <div className="text-xs text-muted-foreground">
                                    {t("resultsTab.winner")}
                                  </div>
                                  {(() => {
                                    const winners =
                                      reward.winners && reward.winners.length > 0
                                        ? reward.winners
                                        : reward.winner
                                          ? [reward.winner]
                                          : [];
                                    if (winners.length === 0) {
                                      return (
                                        <div className="font-bold text-primary truncate text-sm">
                                          —
                                        </div>
                                      );
                                    }
                                    return (
                                      <div className="flex flex-wrap gap-1">
                                        {winners.map((w) => (
                                          <Badge
                                            key={w.id}
                                            variant="secondary"
                                            className="text-xs bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:hover:bg-yellow-800"
                                            title={w.name}
                                          >
                                            {w.name} ({w.votes} {t("resultsTab.votes")})
                                          </Badge>
                                        ))}
                                      </div>
                                    );
                                  })()}
                                </div>

                                <div className="pt-2 border-t">
                                  {(() => {
                                    const previewCount = 4;
                                    const votedTeams =
                                      reward.votes && reward.votes.length > 0
                                        ? reward.votes
                                        : reward.winner
                                          ? [reward.winner]
                                          : [];
                                    const maxVotes =
                                      votedTeams.length > 0 ? votedTeams[0].votes : 0;
                                    const expanded = expandedVotedTeams[reward.id] === true;
                                    const canToggle = votedTeams.length > previewCount;
                                    const visible = expanded
                                      ? votedTeams
                                      : votedTeams.slice(0, previewCount);

                                    const toggle = () => {
                                      setExpandedVotedTeams((prev) => ({
                                        ...prev,
                                        [reward.id]: !expanded,
                                      }));
                                    };

                                    if (votedTeams.length === 0) {
                                      return (
                                        <>
                                          <div className="flex items-center justify-between">
                                            <div className="text-xs text-muted-foreground">
                                              {t("resultsTab.votedTeams")}
                                            </div>
                                          </div>
                                          <div className="text-xs text-muted-foreground italic">
                                            {t("resultsTab.noVotes")}
                                          </div>
                                        </>
                                      );
                                    }
                                    return (
                                      <>
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="text-xs text-muted-foreground">
                                            {t("resultsTab.votedTeams")}
                                          </div>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-xs"
                                            onClick={toggle}
                                            disabled={!canToggle}
                                          >
                                            {expanded
                                              ? t("resultsTab.collapseVotedTeams")
                                              : t("resultsTab.expandVotedTeams")}
                                            {expanded ? (
                                              <ChevronUp className="h-3.5 w-3.5 ml-1" />
                                            ) : (
                                              <ChevronDown className="h-3.5 w-3.5 ml-1" />
                                            )}
                                          </Button>
                                        </div>

                                        <div
                                          className={`mt-1 ${
                                            expanded
                                              ? "max-h-40 overflow-y-auto custom-scrollbar pr-1"
                                              : ""
                                          }`}
                                        >
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                                            {visible.map((v) => (
                                              <div
                                                key={v.id}
                                                className="flex items-baseline justify-between gap-2 text-xs"
                                              >
                                                <div
                                                  className={`min-w-0 truncate ${
                                                    maxVotes > 0 && v.votes === maxVotes
                                                      ? "font-semibold text-primary"
                                                      : "text-foreground"
                                                  }`}
                                                  title={v.name}
                                                >
                                                  {v.name}
                                                </div>
                                                <div className="shrink-0 text-muted-foreground">
                                                  {v.votes} {t("resultsTab.votes")}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </>
                                    );
                                  })()}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>

        {/* Full Ranking Table - Hidden in Fullscreen */}
        {!isFullscreen && (
          <Card>
            <CardHeader>
              <CardTitle>{t("resultsTab.OARanking")}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading && rankings.length === 0 ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : rankings.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">
                  {t("resultsTab.noOARanking")}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">{t("resultsTab.rank")}</TableHead>
                      <TableHead>{t("resultsTab.project")}</TableHead>
                      <TableHead className="text-right">{t("resultsTab.VR")}</TableHead>
                      <TableHead className="text-right">{t("resultsTab.SR")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rankings.map((team) => {
                      const teamRewards = specialRewards.filter((r) => {
                        const winners =
                          r.winners && r.winners.length > 0 ? r.winners : r.winner ? [r.winner] : [];
                        return winners.some((w) => w.id === team.id);
                      });
                      return (
                        <TableRow key={team.id}>
                          <TableCell className="font-medium">
                            {team.rank === 1 && (
                              <Medal className="h-5 w-5 text-yellow-500 inline mr-1" />
                            )}
                            {team.rank === 2 && (
                              <Medal className="h-5 w-5 text-gray-400 inline mr-1" />
                            )}
                            {team.rank === 3 && (
                              <Medal className="h-5 w-5 text-amber-600 inline mr-1" />
                            )}
                            #{team.rank}
                          </TableCell>
                          <TableCell>{team.name}</TableCell>
                          <TableCell className="text-right font-bold text-primary">
                            {team.totalReward.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1 flex-wrap items-center">
                              {teamRewards.map((reward) =>
                                reward.image ? (
                                  <div
                                    key={reward.id}
                                    className="relative h-8 w-8 overflow-hidden rounded-md border border-border shadow-sm"
                                    title={reward.name}
                                  >
                                    <Image
                                      src={reward.image}
                                      alt={reward.name}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                ) : (
                                  <Badge
                                    key={reward.id}
                                    variant="secondary"
                                    className="text-xs bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                  >
                                    {reward.name}
                                  </Badge>
                                ),
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
