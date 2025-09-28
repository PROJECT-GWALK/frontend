"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { updateTimeline, getEvent } from "@/utils/apiuser";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

type Step5Props = {
  eventId?: string;
  defaultValues?: any;
  onSuccess?: (updated: any) => void;
  onBack?: () => void;
};

export default function Step5Timeline(props: Step5Props) {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const eventId = props.eventId ?? params.id;

  const [loading, setLoading] = useState(true);
  const [startJoinDate, setStartJoinDate] = useState<Date | undefined>();
  const [endJoinDate, setEndJoinDate] = useState<Date | undefined>();
  const [startView, setStartView] = useState<Date | undefined>();
  const [showDashboard, setShowDashboard] = useState(true);

  // โหลดข้อมูล event เดิม
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await getEvent(eventId);
        const ev = res.event;
        if (ev.startJoinDate) setStartJoinDate(new Date(ev.startJoinDate));
        if (ev.endJoinDate) setEndJoinDate(new Date(ev.endJoinDate));
        if (ev.startView) setStartView(new Date(ev.startView));
        if (typeof ev.showDashboard === "boolean") setShowDashboard(ev.showDashboard);
      } catch (err) {
        console.error("Failed to load event:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  const handleNext = async () => {
    try {
      await updateTimeline(eventId, {
        startJoinDate: startJoinDate?.toISOString(),
        endJoinDate: endJoinDate?.toISOString(),
        startView: startView?.toISOString(),
        showDashboard,
      });
      router.push(`/createEvent/${eventId}?step=6`);
    } catch (err) {
      console.error("Update timeline error:", err);
      alert("Failed to update timeline");
    }
  };

  const handleBack = () => {
    if (props.onBack) {
      props.onBack();
    } else {
      router.push(`/createEvent/${eventId}?step=1`);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6 p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold">Step 5: Timeline & Dates</h2>

      {/* Start Join Date */}
      <div className="flex flex-col space-y-2">
        <label className="font-medium">Start Join Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startJoinDate ? format(startJoinDate, "PPP HH:mm") : "Pick date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={startJoinDate}
              onSelect={setStartJoinDate}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* End Join Date */}
      <div className="flex flex-col space-y-2">
        <label className="font-medium">End Join Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endJoinDate ? format(endJoinDate, "PPP HH:mm") : "Pick date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={endJoinDate}
              onSelect={setEndJoinDate}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Start View */}
      <div className="flex flex-col space-y-2">
        <label className="font-medium">Start View Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startView ? format(startView, "PPP HH:mm") : "Pick date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={startView}
              onSelect={setStartView}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Show Dashboard */}
      <div className="flex items-center space-x-2">
        <Switch
          checked={showDashboard}
          onCheckedChange={setShowDashboard}
        />
        <label>Show Dashboard</label>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleBack}>Back</Button>
        <Button onClick={handleNext}>Next</Button>
      </div>
    </div>
  );
}