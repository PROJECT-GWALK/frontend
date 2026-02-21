"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
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
import { useLanguage } from "@/contexts/LanguageContext";

const generateMonths = (locale: string) =>
  Array.from({ length: 12 }, (_, i) => ({
    label: new Date(2000, i).toLocaleString(locale, { month: "long" }),
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
  const { timeFormat, t } = useLanguage();
  const now = new Date();
  const currentYear = now.getFullYear() + 543;

  const chartConfig = {
    active: {
      label: t("adminSection.activeUsersLabel"),
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

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
      const christianYear = (year ?? currentYear) - 543;

      if (month) {
        const days = generateDays(christianYear, month);

        filled = days.map((d) => {
          const found = rawChart.find((c) => c.label === d.label);
          return {
            date: d.label,
            active: found ? found.count : 0,
            fullLabel: new Date(christianYear, month - 1, parseInt(d.label)).toLocaleDateString(timeFormat),
          };
        });
      } else {
        const months = generateMonths(timeFormat);
        const monthLabelToValue = new Map(
          generateMonths("en-US").map((m) => [m.label, m.value]),
        );
        const countsByMonthValue = new Map<number, number>();
        rawChart.forEach((c) => {
          const v = monthLabelToValue.get(c.label);
          if (v) countsByMonthValue.set(v, c.count);
        });

        filled = months.map((m) => {
          return {
            date: m.label,
            active: countsByMonthValue.get(m.value) ?? 0,
            fullLabel: new Date(christianYear, m.value - 1).toLocaleDateString(timeFormat, { month: 'long', year: 'numeric' }),
          };
        });
      }

      setChartData(filled);
    };
    fetchData();
  }, [year, month, currentYear, timeFormat]);

  const monthOptions = generateMonths(timeFormat);

  return (
      <Card className="col-span-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                    <ChartBar className="h-4 w-4 text-muted-foreground"/>
                    {t("adminSection.userActiveChart")}
                </CardTitle>
                <CardDescription>
                    {year
                    ? `${t("adminSection.showingActiveUsersFor")}${year}${
                        month ? ` - ${monthOptions.find((m) => m.value === month)?.label}` : ""
                      }`
                    : t("adminSection.selectYearToViewData")}
                </CardDescription>
            </div>
            <div className="flex gap-2">
                <Select
                    onValueChange={(val) => setYear(val ? parseInt(val) : undefined)}
                    value={year?.toString()}
                >
                    <SelectTrigger className="w-25">
                        <SelectValue placeholder={t("adminSection.year")} />
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
                    <SelectTrigger className="w-30">
                        <SelectValue placeholder={t("adminSection.month")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t("adminSection.allMonths")}</SelectItem>
                        {monthOptions.map((m) => (
                            <SelectItem key={m.value} value={m.value.toString()}>
                                {m.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pl-2">
          <ChartContainer config={chartConfig} className="h-75 w-full">
            <BarChart
              accessibilityLayer
              data={chartData}
              margin={{ left: 12, right: 12, top: 12, bottom: 12 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value: string) =>
                  value.length > 3 ? value.slice(0, 3) : value
                }
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="active"
                fill="var(--color-active)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
  );
}
