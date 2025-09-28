"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, CalendarPlus, FileEdit } from "lucide-react";
import { getMyDraftEvents } from "@/utils/apiuser";

type DraftEvent = {
  id: string;
  eventName: string;
  currentStep: number;
  createdAt: string;
};

export default function DashboardPage() {
  const [drafts, setDrafts] = useState<DraftEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDrafts = async () => {
      try {
        const res = await getMyDraftEvents();
        setDrafts(res.events || []);
      } catch (err) {
        console.error("Failed to load drafts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDrafts();
  }, []);

  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-2xl font-bold">Dashboard</CardHeader>
        <CardContent>
          {/* Search + Create */}
          <div className="sm:grid sm:grid-cols-4 gap-4 flex flex-wrap mb-6">
            <div className="relative w-full sm:col-span-3">
              <Input placeholder="Search events" className="w-full pr-10" />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5" />
            </div>
            <div className="sm:col-span-1 w-full">
              <Link href="/createEvent">
                <Button className="w-full">
                  Create Event!
                  <CalendarPlus className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Draft Events */}
          <div>
            <h3 className="font-semibold mb-3">My Draft Events</h3>
            {loading && <p>Loading...</p>}
            {!loading && drafts.length === 0 && (
              <p className="text-gray-500">No draft events yet.</p>
            )}
            <div className="space-y-3">
              {drafts.map((event) => (
                <Card key={event.id} className="p-4 flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold">{event.eventName}</h4>
                    <p className="text-sm text-gray-500">
                      Step {event.currentStep} • Created{" "}
                      {new Date(event.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Link href={`/createEvent/${event.id}?step=${event.currentStep}`}>
                    <Button variant="outline">
                      <FileEdit className="h-4 w-4 mr-2" />
                      Continue
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}