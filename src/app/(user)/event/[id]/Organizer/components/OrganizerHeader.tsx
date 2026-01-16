"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Building } from "lucide-react";
import { setEventPublicView } from "@/utils/apievent";
import { EventData } from "@/utils/types";

type Props = {
  id: string;
  event: EventData | null;
  onEventUpdate: (updatedEvent: EventData) => void;
};

export default function OrganizerHeader({ id, event, onEventUpdate }: Props) {
  const [updatingPublic, setUpdatingPublic] = useState(false);

  return (
    <div 
      className="bg-card rounded-xl shadow-sm border p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 transition-all hover:shadow-md relative overflow-hidden"
      style={{ borderLeft: "6px solid var(--role-organizer)" }}
    >
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{ background: "linear-gradient(to right, var(--role-organizer), transparent)", opacity: 0.05 }} 
      />
      {/* LEFT SIDE: Title & Status */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 
            className="text-2xl lg:text-3xl font-bold tracking-tight"
            style={{ color: "var(--role-organizer)" }}
          >
            {event?.eventName || "Event"}
          </h1>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
            <span className="w-1.5 h-1.5 rounded-full bg-green-600 mr-1.5"></span>
            เผยแพร่แล้ว
          </span>
        </div>
      </div>

      {/* RIGHT SIDE: Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Visibility Toggle Button */}
        <Button
          variant={event?.publicView ? "outline" : "default"}
          onClick={async () => {
            if (!id) return;
            setUpdatingPublic(true);
            try {
              const res = await setEventPublicView(id, !event?.publicView);
              if (res?.event) {
                onEventUpdate(res.event);
              }
            } catch {
              // error handling if needed
            } finally {
              setUpdatingPublic(false);
            }
          }}
          disabled={updatingPublic}
          className={`h-10 px-6 font-medium ${
            event?.publicView
              ? "border-dashed border-gray-300 text-gray-600 hover:bg-gray-50"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {event?.publicView ? (
            <>
              <EyeOff className="mr-2 h-4 w-4" />
              ซ่อนจากสาธารณะ
            </>
          ) : (
            <>
              <Eye className="mr-2 h-4 w-4" />
              เปิดให้สาธารณะเห็น
            </>
          )}
        </Button>

        {/* Organizer Label */}
        <div className="h-10 inline-flex items-center justify-center gap-2 px-5 rounded-lg bg-(--role-organizer) text-white font-medium shadow-sm select-none">
          <Building className="h-4 w-4" />
          <span>Organizer</span>
        </div>
      </div>
    </div>
  );
}
