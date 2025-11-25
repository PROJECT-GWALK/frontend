"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getEvent } from "@/utils/apievent";

type EventDetail = {
  id: string;
  eventName: string;
  currentStep: number;
  createdAt: string;
  status?: string;
};

export default function EventPage() {
  const params = useParams();
  const id = (params?.id as string) ?? "";
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const res = await getEvent(id);
        setEvent(res.event || null);
      } catch (err) {
        console.error("Failed to load event:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Draft Event</CardTitle>
          <CardDescription>
            {loading ? "Loading..." : event ? "Review and continue setup" : "Not found"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!loading && event && (
            <div className="space-y-2">
              <div className="text-lg font-semibold">{event.eventName}</div>
              <div className="text-sm text-gray-500">
                Step {event.currentStep} • Created {new Date(event.createdAt).toLocaleString()}
              </div>
              {event.status && <div className="text-sm">Status: {event.status}</div>}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Link href="/dashboard">
            <Button variant="outline" className="mr-2">Back</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}