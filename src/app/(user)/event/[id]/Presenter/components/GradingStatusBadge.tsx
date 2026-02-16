"use client";

import { useEffect, useState } from "react";
import { getGradingStatus } from "@/utils/apievaluation";
import { CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Props = {
  eventId: string;
  teamId: string;
};

export default function GradingStatusBadge({ eventId, teamId }: Props) {
  const [status, setStatus] = useState<{
    isGraded: boolean;
    gradesSubmitted: number;
    totalCriteria: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const data = await getGradingStatus(eventId, teamId);
        setStatus(data);
      } catch (error) {
        console.error("Failed to fetch grading status:", error);
        setStatus(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [eventId, teamId]);

  if (loading || !status) {
    return null;
  }

  if (status.totalCriteria === 0) {
    return null; // No evaluation criteria defined
  }

  return (
    <Badge
      variant={status.isGraded ? "default" : "secondary"}
      className={`flex items-center gap-1 w-fit ${
        status.isGraded ? "bg-green-600 hover:bg-green-700" : ""
      }`}
    >
      {status.isGraded ? (
        <>
          <CheckCircle2 className="w-3 h-3" />
          <span>Graded</span>
        </>
      ) : (
        <>
          <Clock className="w-3 h-3" />
          <span>
            Pending ({status.gradesSubmitted}/{status.totalCriteria})
          </span>
        </>
      )}
    </Badge>
  );
}
