"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, Tooltip } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { userDailyActive } from "@/utils/apiadmin";
import { UserActiveChartData } from "@/utils/types";
import { ChartBar } from "lucide-react";

const chartConfig = {
  active: {
    label: "Active Users",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const generateMonths = () =>
  Array.from({ length: 12 }, (_, i) => ({
    label: new Date(2000, i).toLocaleString("en-US", { month: "long" }),
    value: i + 1,
  }));

const generateDays = (year: number, month: number) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => ({
    label: (i + 1).toString(),
    value: i + 1,
  }));
};

export default function AdminUserChart() {
  const now = new Date();
  const currentYear = now.getFullYear() + 543;

  const [year, setYear] = useState<number | undefined>(undefined);
  const [month, setMonth] = useState<number | undefined>(undefined);
  const [yearOptions, setYearOptions] = useState<number[]>([]);
  const [chartData, setChartData] = useState<UserActiveChartData[]>([]);

  useEffect(() => {
    const init = async () => {
      const res = await userDailyActive();
      setYearOptions(res.data.availableYears);

      if (res.data.availableYears.length > 0 && !year) {
        setYear(res.data.availableYears[0]);
      }
    };
    init();
  }, [year]);

  useEffect(() => {
    const fetchData = async () => {
      if (!year) return;

      const res = await userDailyActive(year, month);
      setYearOptions(res.data.availableYears);

      const rawChart: { label: string; count: number }[] = res.data.chart;
      let filled: { date: string; active: number; fullLabel: string }[] = [];

      if (month) {
        const christianYear = (year ?? currentYear) - 543;
        const days = generateDays(christianYear, month);

        filled = days.map((d) => {
          const found = rawChart.find((c) => c.label === d.label);
          return {
            date: d.label,
            active: found ? found.count : 0,
            fullLabel: `${d.label}/${month.toString().padStart(2, "0")}/${(
              year ?? currentYear
            )
              .toString()
              .slice(-2)}`,
          };
        });
      } else {
        const months = generateMonths();

        filled = months.map((m) => {
          const found = rawChart.find((c) => c.label === m.label);
          return {
            date: m.label,
            active: found ? found.count : 0,
            fullLabel: `${m.value.toString().padStart(2, "0")}/${(
              year ?? currentYear
            )
              .toString()
              .slice(-2)}`,
          };
        });
      }

      setChartData(filled);
    };
    fetchData();
  }, [year, month, currentYear]);

  const monthOptions = generateMonths();

  return (
      <Card className="w-full">
        <CardHeader className="p-4">
          <CardTitle className="text-lg flex gap-2"><ChartBar/>User Active Chart</CardTitle>
          <CardDescription className="text-xs">
            {year
              ? `Year ${year}${
                  month
                    ? ` Month ${
                        monthOptions.find((m) => m.value === month)?.label
                      }`
                    : ""
                }`
              : `Select a year to view data`}
          </CardDescription>
        </CardHeader>

        {/* Year / Month Selectors */}
        <div className="flex gap-4 px-4 pb-2">
          <Select
            onValueChange={(val) => setYear(val ? parseInt(val) : undefined)}
            value={year?.toString()}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            onValueChange={(val) =>
              setMonth(val === "all" ? undefined : parseInt(val))
            }
            value={month?.toString() ?? "all"}
            disabled={!year}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {monthOptions.map((m) => (
                <SelectItem key={m.value} value={m.value.toString()}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bar Chart */}
        <CardContent className="p-4">
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <BarChart
              accessibilityLayer
              data={chartData}
              margin={{ left: 12, right: 12 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value: string) =>
                  value.length > 3 ? value.slice(0, 3) : value
                }
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length > 0) {
                    const item = payload[0].payload;
                    return (
                      <Card className="rounded shadow text-xs p-2">
                        <CardContent>
                          <div>{item.fullLabel}</div>
                          <div>Active Users: {item.active}</div>
                        </CardContent>
                      </Card>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="active"
                fill="var(--color-active)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>

        <CardFooter>
          <span className="opacity-50">Chart showing active users</span>
        </CardFooter>
      </Card>
  );
}
