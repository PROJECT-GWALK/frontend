"use client";

import { useEffect, useState } from "react";
import { getGradingResults } from "@/utils/apievaluation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const [selectedResult, setSelectedResult] = useState<GradingResult | null>(null);

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

  const formatPresenterNames = (presenterName: string) => {
    const names = presenterName
      .split(/[\n,]+/g)
      .map((s) => s.trim())
      .filter(Boolean);

    if (names.length <= 1) return presenterName;
    return names.map((name, idx) => `${idx + 1}.${name}`).join(" ");
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
                <th className="text-left p-3 font-semibold whitespace-nowrap">
                  {t("gradingDashboard.presenter")}
                </th>
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
                    {crit.name} ({crit.maxScore})
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedResults.map((result, idx) => (
                <tr
                  key={result.teamId}
                  className={`border-b cursor-pointer hover:bg-muted/50 transition-colors ${idx % 2 === 0 ? "bg-background" : "bg-muted/30"}`}
                  onClick={() => setSelectedResult(result)}
                >
                  <td className="p-3 font-semibold">{result.teamName}</td>
                  <td className="p-3 whitespace-nowrap">
                    {formatPresenterNames(result.presenterName)}
                  </td>
                  <td className="p-3 text-center">
                    <span className="font-bold text-lg">{result.overallAverage.toFixed(2)}</span>
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

        {/* Committee Detail Dialog */}
        <Dialog open={!!selectedResult} onOpenChange={(open) => !open && setSelectedResult(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {t("gradingDashboard.project")}: {selectedResult?.teamName}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {t("gradingDashboard.presenter")}:{" "}
                {selectedResult ? formatPresenterNames(selectedResult.presenterName) : ""}
              </p>
            </DialogHeader>

            {selectedResult && (
              <div className="space-y-4 mt-2">
                {/* Overall Score */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="font-semibold">{t("gradingDashboard.totalScore")}</span>
                  <span className="text-xl font-bold">
                    {selectedResult.overallAverage.toFixed(2)}%
                  </span>
                </div>

                {/* Per Committee Breakdown */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    {t("gradingDashboard.committeeDetail") || "Committee Score Details"}
                  </h4>

                  {selectedResult.committeeScores.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {t("gradingDashboard.noGrade")}
                    </p>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="text-left p-3 font-semibold">
                                {t("gradingDashboard.committeeDetail") || "Committee"}
                              </th>
                              <th className="text-center p-3 font-semibold whitespace-nowrap">
                                {t("gradingDashboard.totalScore") || "Total Score"}
                              </th>
                              {criteria.map((crit) => (
                                <th
                                  key={crit.id}
                                  className="text-center p-3 font-semibold text-sm whitespace-nowrap"
                                >
                                  {crit.name} ({crit.maxScore})
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {selectedResult.committeeScores.map((cs, idx) => (
                              <tr
                                key={cs.committeeId}
                                className={`border-b ${idx % 2 === 0 ? "bg-background" : "bg-muted/30"}`}
                              >
                                <td className="p-3 font-semibold">{cs.committeeName}</td>
                                <td className="p-3 text-center">
                                  <Badge variant="secondary">{cs.avgScore.toFixed(2)}</Badge>
                                </td>
                                {criteria.map((crit) => {
                                  const score = cs.scores[crit.id];
                                  const hasScore =
                                    typeof score === "number" && Number.isFinite(score);
                                  return (
                                    <td key={crit.id} className="p-3 text-center text-sm">
                                      {hasScore ? (
                                        <span className="font-medium">
                                          {score.toFixed(1)}
                                          <span className="text-muted-foreground">
                                            {" "}
                                            / {crit.maxScore}
                                          </span>
                                        </span>
                                      ) : (
                                        <span className="text-muted-foreground">-</span>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Average per Criteria */}
                {selectedResult.committeeScores.length > 1 && (
                  <div className="border rounded-lg p-4 space-y-3 bg-blue-50 dark:bg-blue-950">
                    <h4 className="font-semibold text-sm">
                      {t("gradingDashboard.avgPerCriteria") || "Average per Criteria"}
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b bg-white/50 dark:bg-black/10">
                            <th className="text-left p-3 font-semibold text-sm">
                              {t("gradingSection.criteriaName") || "Criteria"}
                            </th>
                            <th className="text-center p-3 font-semibold text-sm whitespace-nowrap">
                              {t("gradingDashboard.totalScore") || "Avg"}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {criteria.map((crit, idx) => {
                            const avg = getAverageForCriteria(selectedResult.committeeScores, crit.id);
                            return (
                              <tr
                                key={crit.id}
                                className={`border-b ${idx % 2 === 0 ? "bg-transparent" : "bg-white/30 dark:bg-black/10"}`}
                              >
                                <td className="p-3 text-sm">
                                  <span className="text-muted-foreground">
                                    {crit.name} <span className="text-xs">({crit.weightPercentage}%)</span>
                                  </span>
                                </td>
                                <td className="p-3 text-center text-sm">
                                  {avg !== null ? (
                                    <span className="font-semibold">
                                      {avg.toFixed(1)}{" "}
                                      <span className="text-muted-foreground">/ {crit.maxScore}</span>
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
