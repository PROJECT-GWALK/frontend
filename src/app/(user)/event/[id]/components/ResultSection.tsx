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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Maximize2, Medal, Minimize2, RefreshCw, Trophy } from "lucide-react";
import { getEventRankings } from "@/utils/apievent";
import { generateMockRankings } from "./mockData";
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

  const fetchData = useCallback(async (mode: "initial" | "manual" | "auto" = "manual") => {
    if (mode === "auto") setRefreshing(true);
    else setLoading(true);
    setErrorMessage(null);
    try {
      const res = await getEventRankings(eventId);
      
      // Merge API data with Mock data
      const mockData = generateMockRankings(50);
      let combinedRankings = [...res.rankings, ...mockData];
      
      // Sort by totalReward descending and re-assign rank
      combinedRankings.sort((a, b) => b.totalReward - a.totalReward);
      combinedRankings = combinedRankings.map((team, index) => ({
        ...team,
        rank: index + 1
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
  }, [eventId]);

  useEffect(() => {
    fetchData("initial");
    let interval: NodeJS.Timeout;
    if (role === "ORGANIZER") {
      interval = setInterval(() => fetchData("auto"), 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchData, role]);

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
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    }
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const topLimit = useMemo(() => {
    const parsed = parseInt(topN, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
  }, [topN]);

  const chartData = useMemo(() => {
    return rankings
      .slice(0, topLimit)
      .map((r) => ({
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
      className={`space-y-4 ${
        isFullscreen
          ? "p-6 bg-background h-screen w-screen overflow-hidden flex flex-col"
          : "space-y-8"
      }`}
    >
      <div className="flex flex-col gap-3 shrink-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Event Results</h2>
            <p className="text-sm text-muted-foreground">
              อันดับคะแนน VR และรางวัลพิเศษ
            </p>
          </div>
          <div className="flex items-center gap-2">
            {role !== "ORGANIZER" && (
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
            <Button variant="outline" size="sm" onClick={toggleFullscreen} aria-label="Toggle fullscreen">
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
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-sm text-destructive">{errorMessage}</div>
              {role !== "ORGANIZER" && (
                <Button variant="outline" size="sm" onClick={() => fetchData("manual")} disabled={loading}>
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
            ? "flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0"
            : "space-y-8"
        }`}
      >
        {/* Top Rankings Chart */}
        <Card className={`flex flex-col ${isFullscreen ? (specialRewards.length > 0 ? "lg:col-span-2" : "lg:col-span-3") + " border-none shadow-none" : ""}`}>
          <CardHeader className="shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle>Top Rankings</CardTitle>
              <div className="flex items-center gap-2">
                 <span className="text-sm text-muted-foreground whitespace-nowrap">Show Top:</span>
                 <Input
                    type="number"
                    min="1"
                    max={rankings.length > 0 ? rankings.length : 100}
                    value={topN}
                    onChange={(e) => setTopN(e.target.value)}
                    className="w-[80px]"
                  />
              </div>
            </div>
            <CardDescription>
              Visualizing the top performing teams based on VR points.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-0">
            {loading && rankings.length === 0 ? (
              <div className={`w-full ${isFullscreen ? "h-full" : "min-h-[300px]"} flex flex-col justify-center gap-3`}>
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-6 w-4/5" />
              </div>
            ) : rankings.length === 0 ? (
              <div className={`w-full ${isFullscreen ? "h-full" : "min-h-[300px]"} flex items-center justify-center`}>
                <div className="text-center space-y-2">
                  <div className="text-lg font-semibold">ยังไม่มีข้อมูลอันดับ</div>
                  <div className="text-sm text-muted-foreground">รอการให้คะแนนหรือการอัปเดตจากระบบ</div>
                </div>
              </div>
            ) : (
              <ChartContainer
                config={chartConfig}
                className={`w-full ${isFullscreen ? "h-full" : "min-h-[300px]"}`}
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
                  <YAxis
                    dataKey="name"
                    type="category"
                    hide
                  />
                  <XAxis dataKey="totalReward" type="number" hide />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel={showLabels} />}
                  />
                  <Bar
                    dataKey="totalReward"
                    radius={5}
                    barSize={getBarSize(topLimit)}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
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
                          value.length > 28 ? `${value.slice(0, 28)}...` : value
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

        {/* Special Rewards */}
        {specialRewards.length > 0 && (
          <Card className={`flex flex-col ${isFullscreen ? "lg:col-span-1 border-none shadow-none" : ""}`}>
            <CardHeader className="shrink-0">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                Special Awards
              </CardTitle>
              <CardDescription>
                รางวัลโหวตพิเศษ แยกจากคะแนน VR
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
              {isFullscreen ? (
                <div className="space-y-2">
                  {specialRewards.map((reward) => (
                    <div
                      key={reward.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{reward.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {reward.winner ? `${reward.winner.votes} votes` : "No votes yet"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">
                          {reward.winner ? reward.winner.name : "—"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {specialRewards.map((reward) => (
                    <Card
                      key={reward.id}
                      className="border-yellow-500/50 bg-yellow-500/5"
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Trophy className="h-5 w-5 text-yellow-600" />
                          {reward.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {reward.winner ? (
                          <div className="space-y-1">
                            <div className="text-xl font-bold">
                              {reward.winner.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {reward.winner.votes} Votes
                            </div>
                          </div>
                        ) : (
                          <div className="text-muted-foreground italic">
                            No votes yet
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Full Ranking Table - Hidden in Fullscreen */}
      {!isFullscreen && (
        <Card>
          <CardHeader>
            <CardTitle>Full Leaderboard</CardTitle>
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
                ยังไม่มีข้อมูล leaderboard
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Rank</TableHead>
                    <TableHead>Team Name</TableHead>
                    <TableHead className="text-right">Total VR</TableHead>
                    <TableHead className="text-right">Special Badges</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rankings.map((team) => {
                    const badges = specialRewards
                      .filter((r) => r.winner?.id === team.id)
                      .map((r) => r.name);
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
                          <div className="flex justify-end gap-1 flex-wrap">
                            {badges.map((b) => (
                              <Badge
                                key={b}
                                variant="secondary"
                                className="text-xs bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                              >
                                {b}
                              </Badge>
                            ))}
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
  );
}
