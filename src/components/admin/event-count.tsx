"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { getCountEvent } from "@/utils/apiadmin";
import { CalendarDays } from "lucide-react";

export default function AdminEventCount() {
  const [countEvent, setCountEvent] = useState<number>(0);

  const fetchData = async () => {
    try {
      const data = await getCountEvent();
      setCountEvent(data.totalEvents);
    } catch (err) {
      console.error("Failed to fetch event count:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <CalendarDays />
          Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-4xl font-bold">{countEvent}</p>
        <p className="text-sm text-muted-foreground">Total events</p>
      </CardContent>
    </Card>
  );
}
