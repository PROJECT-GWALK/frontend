"use client";

import { useEffect, useState } from "react";
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
  useEffect(() => {
    const fetchData = async () => {
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
      } catch (error) {
        toast.error(t("committeeGrade.failedLoadGrade"));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId, teamId]);

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
    } catch (error) {
      toast.error(t("committeeGrade.submitGradeFailed"));
    } finally {
      setSubmitting(false);
    }
  };

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
        {/* 1. เพิ่ม gap-4 เพื่อบังคับให้มีช่องว่างระหว่างฝั่งซ้ายและขวาเสมอ */}
        <div className="flex items-start sm:items-center justify-between gap-4">
          {/* 2. เพิ่ม flex-1 และ min-w-0 ให้กล่องข้อความ เพื่อให้มันขยายจนสุดแต่ไม่ล้นไปทับคนอื่น */}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg flex items-start sm:items-center gap-2 text-foreground">
              {/* 3. ใส่ shrink-0 ให้ไอคอน เพื่อไม่ให้ไอคอนเบี้ยวเวลาข้อความยาว */}
              <BookCheck className="w-5 h-5 text-green-600 shrink-0" />
              {/* 4. ใส่ break-words หรือ truncate ให้ข้อความ (ในที่นี้แนะนำ break-words ให้ตัดขึ้นบรรทัดใหม่) */}
              <span className="break-words">
                {t("committeeGrade.title")} {teamName}
              </span>
            </CardTitle>
          </div>

          {/* 5. ใส่ shrink-0 ให้ฝั่งปุ่ม เพื่อรับประกันว่าปุ่มจะไม่ถูกบีบหรือโดนทับเด็ดขาด */}
          {submitted && !isEditing && (
            <div className="flex items-center gap-1 shrink-0">
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
            <div className="flex items-center gap-2 text-red-700 shrink-0">
              <Edit2 className="w-4 h-4 shrink-0" />
              <span className="text-sm font-semibold whitespace-nowrap">
                {t("homePage.actionButton.editing")}
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {criteria.map((c) => (
          <div key={c.id} className="border rounded-lg p-4 bg-card/50">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold">{c.name}</h3>
                {c.description && (
                  <p className="text-sm text-muted-foreground mt-1">{c.description}</p>
                )}

                <div className="text-xs text-muted-foreground mt-2">
                  {t("gradingSection.weight")}: {c.weightPercentage}% |{" "}
                  {t("gradingSection.maxScore")}: {c.maxScore}
                </div>
              </div>
            </div>

            {/* ส่วน Input และ ผลลัพธ์ (Result) อยู่บรรทัดเดียวกัน */}
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max={c.maxScore}
                step="0.1"
                value={grades.get(c.id) === 0 ? "" : (grades.get(c.id) ?? "")}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "") {
                    handleScoreChange(c.id, "");
                  } else {
                    handleScoreChange(c.id, val);
                  }
                }}
                placeholder={`0-${c.maxScore}`}
                disabled={disabled || (submitted && !isEditing)}
                className="w-20 text-center" // ขยายความกว้างนิดหน่อยเพื่อให้ตัวเลขดูไม่อึดอัด
              />
              <span className="text-sm text-muted-foreground">/ {c.maxScore}</span>

              {/* แสดงผลลัพธ์ต่อท้ายตรงนี้ */}
              {grades.has(c.id) && (
                <span className="text-sm text-blue-600 ml-2 font-medium">
                  ({t("committeeGrade.score")}:{" "}
                  {(((grades.get(c.id) || 0) / c.maxScore) * 100).toFixed(1)}%)
                </span>
              )}
            </div>
          </div>
        ))}

        {/* Summary */}
        {grades.size > 0 && (
          <div className="bg-muted/50 p-4 rounded-lg">
            {/* <h4 className="font-semibold mb-3">Grade Summary</h4>
            <div className="space-y-2 text-sm">
              {criteria.map((c) => {
                const score = grades.get(c.id) ?? 0;
                const percentage = ((score / c.maxScore) * 100).toFixed(1);
                return (
                  <div key={c.id} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{c.name}</span>
                    <span className="font-semibold">
                      {score}/{c.maxScore} ({percentage}%)
                    </span>
                  </div>
                );
              })}
            </div> */}

            {/* Calculate weighted average */}
            {grades.size === criteria.length && (
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{t("committeeGrade.finalScore")}:</span>
                  <span className="text-lg font-bold">
                    {(
                      criteria.reduce((sum, c) => {
                        const score = grades.get(c.id) || 0;
                        const normalized = (score / c.maxScore) * 100;
                        return sum + (normalized * c.weightPercentage) / 100;
                      }, 0) /
                      (criteria.reduce((sum, c) => sum + c.weightPercentage, 0) / 100)
                    ).toFixed(2)}
                    %
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
