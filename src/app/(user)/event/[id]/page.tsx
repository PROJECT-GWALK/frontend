"use client";

import { getEvent } from "@/utils/apievent";
import type { EventDetail } from "@/utils/types";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import PublishedView from "./publish/PublishedView";
import DraftView from "./draft/DraftView";

type EventData = EventDetail & { publicView?: boolean };

export default function EventDetail() {
  const params = useParams();
  const id = (params?.id as string) ?? "";
  const [event, setEvent] = useState<EventData | null>(null);
  

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const res = await getEvent(id);
        if (res.message === "ok") {
          setEvent(res.event);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, [id]);

  return (
    <div>
      {event?.status === "DRAFT" && <DraftView />}
      {event?.status === "PUBLISHED" && event && (
        <PublishedView id={id} event={event!} />
      )}
    </div>
  );
}
