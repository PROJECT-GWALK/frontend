"use client";

import { useEffect, useState } from "react";
import { getGradingResults } from "@/utils/apievaluation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";

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

type Props = {
  eventId: string;
};

export default function GradingDashboard({ eventId }: Props) {
  const [results, setResults] = useState<GradingResult[]>([]);
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [loading, setLoading] = useState(true);

  const getAverageForCriteria = (committeeScores: GradingResult["committeeScores"], criteriaId: string) => {
    const values = committeeScores
      .map((s) => s.scores[criteriaId])
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v));

    if (values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  };

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
          <CardTitle>Grading Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No grading results available yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Grading Results Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-semibold">Team Name</th>
                <th className="text-left p-3 font-semibold">Presenter</th>
                <th className="text-center p-3 font-semibold">Overall Average</th>
                {criteria.map((crit) => (
                  <th key={crit.id} className="text-center p-3 font-semibold text-sm">
                    {crit.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((result, idx) => (
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
                        return (
                          <span className="font-semibold">
                            {avg.toFixed(1)}/{crit.maxScore}
                          </span>
                        );
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
