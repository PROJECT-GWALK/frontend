"use client";

import { useCallback, useEffect, useState } from "react";
import { getEvaluationCriteria, getTeamGrades, submitGrade } from "@/utils/apievaluation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2, Edit2, BookCheck } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

type Criteria = {
  id: string;
  name: string;
  description?: string;
  maxScore: number;
  weightPercentage: number;
};

type Grade = {
  id: string;
  criteriaId: string;
  score: number;
};

type Props = {
  eventId: string;
  teamId: string;
  teamName: string;
  disabled?: boolean;
};

export default function CommitteeGradingForm({
  eventId,
  teamId,
  teamName,
  disabled = false,
}: Props) {
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [grades, setGrades] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { t } = useLanguage();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch criteria
      const criteriaRes = await getEvaluationCriteria(eventId);
      setCriteria(criteriaRes.criteria || []);

      // Fetch existing grades
      const gradesRes = await getTeamGrades(eventId, teamId);
      const gradeMap = new Map<string, number>();
      gradesRes.grades?.forEach((g: Grade) => {
        gradeMap.set(g.criteriaId, g.score);
      });
      setGrades(gradeMap);
      setSubmitted(
        gradesRes.grades?.length === (criteriaRes.criteria?.length || 0) &&
          (criteriaRes.criteria?.length || 0) > 0,
      );
    } catch {
      toast.error(t("committeeGrade.failedLoadGrade"));
    } finally {
      setLoading(false);
    }
  }, [eventId, teamId, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleScoreChange = (criteriaId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setGrades(new Map(grades).set(criteriaId, numValue));
  };

  const handleSubmit = async () => {
    try {
      // Validate all criteria have scores
      const allScoresSet = criteria.every((c) => grades.has(c.id));
      if (!allScoresSet) {
        toast.error(t("committeeGrade.provideAllGrades"));
        return;
      }

      // Validate scores don't exceed max
      const allValid = criteria.every((c) => {
        const score = grades.get(c.id) || 0;
        return score >= 0 && score <= c.maxScore;
      });

      if (!allValid) {
        toast.error(t("committeeGrade.invalidScore"));
        return;
      }

      setSubmitting(true);

      // Submit each grade
      for (const c of criteria) {
        const score = grades.get(c.id) || 0;
        await submitGrade(eventId, teamId, {
          criteriaId: c.id,
          score,
        });
      }

      setSubmitted(true);
      setIsEditing(false);
      toast.success(t("committeeGrade.submitGradeSuccess"));
    } catch {
      toast.error(t("committeeGrade.submitGradeFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const totalWeight = criteria.reduce((sum, c) => sum + c.weightPercentage, 0);
  const finalScore =
    grades.size === criteria.length && criteria.length > 0
      ? (() => {
          if (totalWeight <= 0) return 0;
          const weightedSum = criteria.reduce((sum, c) => {
            const score = grades.get(c.id) || 0;
            const normalized = c.maxScore > 0 ? (score / c.maxScore) * 100 : 0;
            return sum + (normalized * c.weightPercentage) / 100;
          }, 0);
          return weightedSum / (totalWeight / 100);
        })()
      : null;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (criteria.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-foreground">
            <BookCheck className="w-5 h-5 text-green-600" />
            {t("committeeGrade.title")} {teamName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            {t("gradingSection.noCriteria")}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg flex items-start sm:items-center gap-2 text-foreground">
              <BookCheck className="w-5 h-5 text-green-600 shrink-0" />
              <span className="break-words">
                {t("committeeGrade.title")} {teamName}
              </span>
            </CardTitle>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {submitted && !isEditing && (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-semibold">{t("committeeGrade.gradeSummitted")}</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  disabled={disabled}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  {t("homePage.actionButton.edit")}
                </Button>
              </div>
            )}

            {isEditing && (
              <div className="flex items-center gap-2 text-red-700">
                <Edit2 className="w-4 h-4 shrink-0" />
                <span className="text-sm font-semibold whitespace-nowrap">
                  {t("homePage.actionButton.editing")}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="border rounded-lg divide-y overflow-hidden">
          {criteria.map((c) => {
            const score = grades.get(c.id) ?? null;

            return (
              <div key={c.id} className="p-4 bg-card/50">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold break-words leading-snug">
                      {c.name}
                      <span className="font-light"> ({c.weightPercentage}%)</span>
                      {c.description ? (
                        <span className="text-sm text-muted-foreground font-normal">
                          {" "}
                          - {c.description}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 shrink-0">
                    <Input
                      type="number"
                      min="0"
                      max={c.maxScore}
                      step="0.1"
                      value={score === 0 ? "" : (score ?? "")}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.includes("e") || val.includes("E") || val.includes("-")) {
                          return;
                        }
                        if (val === "") {
                          handleScoreChange(c.id, "");
                        } else {
                          handleScoreChange(c.id, val);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "e" || e.key === "E" || e.key === "-") {
                          e.preventDefault();
                        }
                      }}
                      placeholder="0"
                      disabled={disabled || (submitted && !isEditing)}
                      className="w-24 text-center"
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      / {c.maxScore}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        {grades.size > 0 && (
          <div className="bg-muted/50 p-4 rounded-lg">
            {finalScore !== null && (
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{t("committeeGrade.finalScore")}:</span>
                  <span className="text-lg font-bold">
                    {finalScore.toFixed(2)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-2">
          {isEditing && (
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              disabled={submitting}
              className="flex-1"
            >
              {t("gradingSection.cancel")}
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={
              submitting || grades.size !== criteria.length || disabled || (submitted && !isEditing)
            }
            className="flex-1 bg-green-500 hover:bg-green-600 text-white"
          >
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {submitted && !isEditing
              ? t("committeeGrade.gradeSummitted")
              : isEditing
                ? t("committeeGrade.updateGrade")
                : t("committeeGrade.submitGrade")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
