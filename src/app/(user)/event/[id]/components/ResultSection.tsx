"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
} from "lucide-react";
import { getEventRankings, getTeamById, getEvent } from "@/utils/apievent";
// import { generateMockRankings } from "./mockData";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
};

type Props = {
  eventId: string;
  role: "COMMITTEE" | "ORGANIZER" | "GUEST" | "PRESENTER";
};

type ChartEntry = {
  id: string;
  name: string;
  totalReward: number;
};

const chartConfig = {
  totalReward: {
    label: "VR Points",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export default function ResultSection({ eventId, role }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [specialRewards, setSpecialRewards] = useState<SpecialReward[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [topN, setTopN] = useState("5");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [eventInfo, setEventInfo] = useState<EventDetail | null>(null);

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
  const getBarSize = (count: number) => {
    if (count <= 1) return 300;
    if (count <= 2) return 180;
    if (count <= 3) return 150;
    if (count <= 5) return 120;
    if (count <= 8) return 100;
    if (count <= 10) return 80;
    return 60;
  };

  const isUserScrollingRef = useRef(false);

  // Detect scroll to pause auto-updates
  useEffect(() => {
    const handleScroll = () => {
      const scrolled =
        window.scrollY > 50 || (containerRef.current?.scrollTop || 0) > 50;
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
        setRefreshing(true);
      } else setLoading(true);
      setErrorMessage(null);
      try {
        const res = await getEventRankings(eventId);

        // Merge API data with Mock data
        let combinedRankings = [...res.rankings];
        // const mockData = generateMockRankings(50);
        // let combinedRankings = [...res.rankings, ...mockData];

        // Sort by totalReward descending and re-assign rank
        combinedRankings.sort((a, b) => b.totalReward - a.totalReward);
        combinedRankings = combinedRankings.map((team, index) => ({
          ...team,
          rank: index + 1,
        }));

        setRankings(combinedRankings);
        setSpecialRewards(res.specialRewards);
        setLastUpdatedAt(Date.now());
      } catch (error) {
        console.error("Failed to fetch rankings", error);
        setErrorMessage("โหลดผลการจัดอันดับไม่สำเร็จ");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [eventId]
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
    return () =>
      document.removeEventListener("fullscreenchange", handleFsChange);
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

  const showLabels = chartData.length <= 30;

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

  return (
    <div
      ref={containerRef}
      className={`${
        isFullscreen
          ? "bg-background min-h-screen w-screen lg:h-screen lg:overflow-hidden flex flex-col relative overflow-y-auto"
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
        className={`relative z-10 flex flex-col lg:h-full space-y-4 ${
          isFullscreen ? "p-6" : ""
        }`}
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
              <h2 className="text-2xl font-bold tracking-tight">
                Event Results
              </h2>
              <p className="text-sm text-muted-foreground">
                อันดับคะแนน VR และรางวัลพิเศษ
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!isFullscreen && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchData("manual")}
                  disabled={loading}
                >
                  <RefreshCw
                    className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh
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
                    ลองใหม่
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        <div
          className={`${
            isFullscreen
              ? `lg:flex-1 grid grid-cols-1 ${
                  selectedTeamId ? "lg:grid-cols-2" : "lg:grid-cols-3"
                } gap-6 lg:min-h-0`
              : "space-y-8"
          }`}
        >
          {/* Top Rankings Chart */}
          <Card
            className={`flex flex-col ${
              isFullscreen
                ? "" +
                  (selectedTeamId
                    ? "lg:col-span-1"
                    : specialRewards.length > 0
                    ? "lg:col-span-2"
                    : "lg:col-span-3")
                : ""
            }`}
          >
            <CardHeader className="shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle>Top Rankings</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    Show Top:
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
                    className="w-20"
                  />
                </div>
              </div>
              <CardDescription>
                Visualizing the top performing teams based on VR points.
              </CardDescription>
            </CardHeader>
            <CardContent className="lg:flex-1 lg:min-h-0">
              {loading && rankings.length === 0 ? (
                <div
                  className={`w-full ${
                    isFullscreen ? "lg:h-full min-h-[300px]" : "min-h-[300px]"
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
                    isFullscreen ? "lg:h-full min-h-[300px]" : "min-h-[300px]"
                  } flex items-center justify-center`}
                >
                  <div className="text-center space-y-2">
                    <div className="text-lg font-semibold">
                      ยังไม่มีข้อมูลอันดับ
                    </div>
                    <div className="text-sm text-muted-foreground">
                      รอการให้คะแนนหรือการอัปเดตจากระบบ
                    </div>
                  </div>
                </div>
              ) : (
                <ChartContainer
                  config={chartConfig}
                  className={`w-full ${
                    isFullscreen ? "lg:h-full min-h-[500px]" : "min-h-[300px]"
                  }`}
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
                      content={<ChartTooltipContent hideLabel={showLabels} />}
                    />
                    <Bar
                      dataKey="totalReward"
                      radius={5}
                      barSize={getBarSize(topLimit)}
                      onClick={(data) => {
                        if (!isFullscreen) return;
                        const payload = (data as { payload?: ChartEntry })
                          .payload;
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
                          position="insideLeft"
                          offset={10}
                          className="fill-white font-semibold"
                          fontSize={14}
                          formatter={(value: string) =>
                            value.length > 28
                              ? `${value.slice(0, 28)}...`
                              : value
                          }
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
          {isFullscreen ? (
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
                      Special Awards
                    </CardTitle>
                    <CardDescription>
                      รางวัลโหวตพิเศษ แยกจากคะแนน VR
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto custom-scrollbar">
                    <div className="space-y-4">
                      {specialRewards.map((reward, index) => (
                        <div
                          key={reward.id}
                          className="border rounded-lg p-3 space-y-3 bg-muted/30"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">
                              Reward #{index + 1}
                            </span>
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
                                  Reward Name
                                </div>
                                <div
                                  className="font-semibold text-sm truncate"
                                  title={reward.name}
                                >
                                  {reward.name}
                                </div>
                              </div>
                              {reward.description && (
                                <div>
                                  <div className="text-xs text-muted-foreground">
                                    Description
                                  </div>
                                  <div
                                    className="text-xs text-muted-foreground line-clamp-2"
                                    title={reward.description}
                                  >
                                    {reward.description}
                                  </div>
                                </div>
                              )}

                              <div className="pt-2 border-t mt-2">
                                <div className="text-xs text-muted-foreground">
                                  Winner
                                </div>
                                <div className="flex justify-between items-baseline">
                                  <div className="font-bold text-primary truncate text-sm">
                                    {reward.winner ? reward.winner.name : "—"}
                                  </div>
                                  {reward.winner && (
                                    <div className="text-xs text-muted-foreground">
                                      {reward.winner.votes} votes
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
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
                          Team Details
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
                            aria-label="ปิดรายละเอียดทีม"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" sideOffset={6}>
                          ปิดรายละเอียดทีม
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
                                        ดูเพิ่มเติม
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                      align="start"
                                      className="w-80 max-w-[90vw]"
                                    >
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
                                No description provided.
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col">
                          <div className="flex items-center justify-between gap-2 shrink-0">
                            <div className="font-semibold text-xs flex items-center gap-1 text-muted-foreground uppercase tracking-wider">
                              <UserIcon className="h-3 w-3" /> Members
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {selectedTeam.participants?.length || 0}
                            </div>
                          </div>

                          {selectedTeam.participants?.length ? (
                            (() => {
                              const maxVisible = 8;
                              const visible = selectedTeam.participants.slice(
                                0,
                                maxVisible
                              );
                              const hidden =
                                selectedTeam.participants.slice(maxVisible);
                              const leader = selectedTeam.participants.find(
                                (p) => p.isLeader
                              );

                              return (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {/* {leader?.user?.name && (
                                  <Badge variant="secondary" className="h-6 px-2 text-[11px]">
                                    Leader: {leader.user.name}
                                  </Badge>
                                )} */}

                                  {visible.map((p) => {
                                    const displayName =
                                      p.user?.name ||
                                      p.user?.username ||
                                      "Unknown";
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
                                            <div className="text-[11px] font-medium max-w-[120px] truncate">
                                              {displayName}
                                            </div>
                                            {p.isLeader && (
                                              <div className="text-[10px] text-primary/80 font-semibold">
                                                Leader
                                              </div>
                                            )}
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent
                                          side="top"
                                          sideOffset={6}
                                        >
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
                                      <PopoverContent
                                        align="start"
                                        className="w-80 max-w-[90vw]"
                                      >
                                        <div className="text-sm font-semibold mb-2">
                                          สมาชิกทั้งหมด (
                                          {selectedTeam.participants.length})
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto custom-scrollbar">
                                          {hidden.map((p) => {
                                            const displayName =
                                              p.user?.name ||
                                              p.user?.username ||
                                              "Unknown";
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
                                                    {p.user?.username
                                                      ? `@${p.user.username}`
                                                      : "—"}
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
                              ยังไม่มีสมาชิก
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
                        <p>ไม่พบข้อมูลทีม</p>
                        <p className="text-xs mt-1">
                          (อาจเป็นข้อมูล Mock หรือถูกลบไปแล้ว)
                        </p>
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
                    Special Awards
                  </CardTitle>
                  <CardDescription>
                    รางวัลโหวตพิเศษ แยกจากคะแนน VR
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {specialRewards.map((reward, index) => (
                      <div
                        key={reward.id}
                        className="border rounded-lg p-3 space-y-3 bg-muted/30"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">
                            Reward #{index + 1}
                          </span>
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
                                Reward Name
                              </div>
                              <div
                                className="font-semibold text-sm truncate"
                                title={reward.name}
                              >
                                {reward.name}
                              </div>
                            </div>
                            {reward.description && (
                              <div>
                                <div className="text-xs text-muted-foreground">
                                  Description
                                </div>
                                <div
                                  className="text-xs text-muted-foreground line-clamp-2"
                                  title={reward.description}
                                >
                                  {reward.description}
                                </div>
                              </div>
                            )}

                            <div className="pt-2 border-t mt-2">
                              <div className="text-xs text-muted-foreground">
                                Winner
                              </div>
                              <div className="flex justify-between items-baseline">
                                <div className="font-bold text-primary truncate text-sm">
                                  {reward.winner ? reward.winner.name : "—"}
                                </div>
                                {reward.winner && (
                                  <div className="text-xs text-muted-foreground">
                                    {reward.winner.votes} votes
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
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
              <CardTitle>Overall Ranking</CardTitle>
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
                  ยังไม่มีข้อมูล Ranking
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Rank</TableHead>
                      <TableHead>Team Name</TableHead>
                      <TableHead className="text-right">Reward</TableHead>
                      <TableHead className="text-right">
                        Special Reward
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rankings.map((team) => {
                      const teamRewards = specialRewards.filter(
                        (r) => r.winner?.id === team.id
                      );
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
                                )
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
