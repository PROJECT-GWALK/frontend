"use client";

import { useEffect, useState } from "react";
import { getEvaluationCriteria, getTeamGrades, submitGrade } from "@/utils/apievaluation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

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
          gradesRes.grades?.length === (criteriaRes.criteria?.length || 0) && criteria.length > 0,
        );
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error("Failed to load grading form");
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
        toast.error("Please provide scores for all criteria");
        return;
      }

      // Validate scores don't exceed max
      const allValid = criteria.every((c) => {
        const score = grades.get(c.id) || 0;
        return score >= 0 && score <= c.maxScore;
      });

      if (!allValid) {
        toast.error("Some scores exceed the maximum allowed");
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
      toast.success("Grades submitted successfully");
    } catch (error) {
      console.error("Error submitting grades:", error);
      toast.error("Failed to submit grades");
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
          <CardTitle>Grading Form</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No evaluation criteria defined for this event
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Grade Project: {teamName}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Please rate this project based on the following criteria
            </p>
          </div>
          {submitted && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-semibold">Submitted</span>
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
                <p className="text-xs text-muted-foreground mt-2">
                  Weight: {c.weightPercentage}% | Max Score: {c.maxScore}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max={c.maxScore}
                step="0.1"
                value={grades.get(c.id) ?? ""}
                onChange={(e) => handleScoreChange(c.id, e.target.value)}
                placeholder={`0 - ${c.maxScore}`}
                disabled={disabled || submitted}
                className="w-32"
              />
              <span className="text-sm text-muted-foreground">/ {c.maxScore}</span>
            </div>

            {grades.has(c.id) && (
              <div className="mt-2 text-xs">
                <span className="text-muted-foreground">Score: </span>
                <span className="font-semibold">
                  {(((grades.get(c.id) || 0) / c.maxScore) * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        ))}

        {/* Summary */}
        {grades.size > 0 && (
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3">Grade Summary</h4>
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
            </div>

            {/* Calculate weighted average */}
            {grades.size === criteria.length && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Weighted Average Score:</span>
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
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={submitting || grades.size !== criteria.length || disabled || submitted}
            className="flex-1"
          >
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {submitted ? "Grades Submitted" : "Submit Grades"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
