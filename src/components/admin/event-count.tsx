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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Events</CardTitle>
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{countEvent}</div>
        <p className="text-xs text-muted-foreground">
          All events in the system
        </p>
      </CardContent>
    </Card>
  );
}
