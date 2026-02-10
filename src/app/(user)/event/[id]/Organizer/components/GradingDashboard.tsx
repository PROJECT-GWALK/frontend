"use client";

import { useEffect, useState } from "react";
import { getGradingResults } from "@/utils/apievaluation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Star } from "lucide-react";
import * as XLSX from "xlsx";
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

  const handleExportToExcel = () => {
    try {
      // Prepare data for export
      const exportData = results.map((result) => {
        const row: Record<string, any> = {
          "Team Name": result.teamName,
          "Presenter Name": result.presenterName,
          "Overall Average": result.overallAverage.toFixed(2),
        };

        // Add individual committee scores
        result.committeeScores.forEach((score) => {
          row[`${score.committeeName} - Average`] = score.avgScore.toFixed(2);

          // Add scores per criteria
          criteria.forEach((crit) => {
            const criteriaScore = score.scores[crit.id];
            if (criteriaScore !== undefined) {
              row[`${score.committeeName} - ${crit.name}`] = criteriaScore.toFixed(2);
            }
          });
        });

        return row;
      });

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Grading Results");

      // Set column widths
      const maxWidth = 30;
      const colWidths = Array(Object.keys(exportData[0] || {}).length).fill(maxWidth);
      worksheet["!cols"] = colWidths.map((width) => ({ wch: width }));

      // Generate filename
      const filename = `Grading_Results_${new Date().toISOString().split("T")[0]}.xlsx`;

      // Export
      XLSX.writeFile(workbook, filename);
      toast.success("Grading results exported successfully");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Failed to export grading results");
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
        <Button onClick={handleExportToExcel} size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export to Excel
        </Button>
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
                      {result.committeeScores.length > 0 ? (
                        <div className="space-y-1">
                          {result.committeeScores.map((score) => {
                            const scoreValue = score.scores[crit.id];
                            return (
                              <div key={score.committeeId} className="text-xs">
                                <span className="text-muted-foreground">
                                  {score.committeeName.split(" ")[0]}:
                                </span>{" "}
                                <span className="font-semibold">
                                  {scoreValue !== undefined ? scoreValue.toFixed(1) : "-"}/
                                  {crit.maxScore}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Committee Summary */}
        {results.length > 0 && (
          <div className="mt-8 pt-6 border-t">
            <h3 className="font-semibold mb-4">Committee Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                ...new Set(results.flatMap((r) => r.committeeScores.map((s) => s.committeeName))),
              ].map((committeeName) => {
                const scores = results
                  .flatMap((r) =>
                    r.committeeScores
                      .filter((s) => s.committeeName === committeeName)
                      .map((s) => s.avgScore),
                  )
                  .filter((score) => score > 0);

                const avgScore =
                  scores.length > 0
                    ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)
                    : "N/A";

                return (
                  <Card key={committeeName} className="bg-muted/50">
                    <CardContent className="pt-4">
                      <p className="text-sm font-semibold text-muted-foreground">{committeeName}</p>
                      <p className="text-2xl font-bold mt-2">{avgScore}</p>
                      <p className="text-xs text-muted-foreground mt-1">Avg Score</p>
                      <p className="text-xs text-muted-foreground">
                        {scores.length} projects graded
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
