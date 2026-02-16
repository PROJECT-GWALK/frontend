"use client";

import { useEffect, useState } from "react";
import { getGradingResults } from "@/utils/apievaluation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Star, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

type GradingResult = {
  teamId: string;
  teamName: string;
  presenterName: string;
  overallAverage: number;
  committeeScores: {
    committeeId: string;
    committeeName: string;
    avgScore: number;
    scores: Record<string, number>;
  }[];
};

type Criteria = {
  id: string;
  name: string;
  maxScore: number;
  weightPercentage: number;
};

type SortField = "teamName" | "overallAverage";
type SortDirection = "asc" | "desc";

type Props = {
  eventId: string;
};

export default function GradingDashboard({ eventId }: Props) {
  const { t } = useLanguage();
  const [results, setResults] = useState<GradingResult[]>([]);
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const getAverageForCriteria = (
    committeeScores: GradingResult["committeeScores"],
    criteriaId: string,
  ) => {
    const values = committeeScores
      .map((s) => s.scores[criteriaId])
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v));

    if (values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field with ascending by default (or descending for score)
      setSortField(field);
      setSortDirection(field === "overallAverage" ? "desc" : "asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-4 h-4 ml-1" />
    ) : (
      <ArrowDown className="w-4 h-4 ml-1" />
    );
  };

  const sortedResults = [...results].sort((a, b) => {
    if (!sortField) return 0;

    let comparison = 0;
    if (sortField === "teamName") {
      comparison = a.teamName.localeCompare(b.teamName);
    } else if (sortField === "overallAverage") {
      comparison = a.overallAverage - b.overallAverage;
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const data = await getGradingResults(eventId);
        setResults(data.results || []);
        setCriteria(data.criteria || []);
      } catch (error) {
        console.error("Failed to fetch grading results:", error);
        toast.error("Failed to load grading results");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [eventId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("gradingDashboard.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            {t("gradingDashboard.noGrade")}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>{t("gradingDashboard.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-semibold">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("teamName")}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    {t("gradingDashboard.project")}
                    {getSortIcon("teamName")}
                  </Button>
                </th>
                <th className="text-left p-3 font-semibold">{t("gradingDashboard.presenter")}</th>
                <th className="text-center p-3 font-semibold">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("overallAverage")}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    {t("gradingDashboard.totalScore")}
                    {getSortIcon("overallAverage")}
                  </Button>
                </th>
                {criteria.map((crit) => (
                  <th key={crit.id} className="text-center p-3 font-semibold text-sm">
                    {crit.name} ({t("gradingDashboard.max")}: {crit.maxScore})
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedResults.map((result, idx) => (
                <tr
                  key={result.teamId}
                  className={`border-b ${idx % 2 === 0 ? "bg-background" : "bg-muted/30"}`}
                >
                  <td className="p-3 font-semibold">{result.teamName}</td>
                  <td className="p-3">{result.presenterName}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="font-bold text-lg">{result.overallAverage.toFixed(2)}</span>
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    </div>
                  </td>
                  {criteria.map((crit) => (
                    <td key={crit.id} className="p-3 text-center text-sm">
                      {(() => {
                        const avg = getAverageForCriteria(result.committeeScores, crit.id);
                        if (avg === null) return <span className="text-muted-foreground">-</span>;
                        return <span className="font-semibold">{avg.toFixed(1)}</span>;
                      })()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
