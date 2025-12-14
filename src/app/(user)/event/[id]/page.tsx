"use client";

import { getEvent, getMyEvents } from "@/utils/apievent";
import type { EventData } from "@/utils/types";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import DraftView from "./draft/DraftView";
import OrganizerView from "./Organizer/page";
import PresenterView from "./Presenter/page";
import NotRoleView from "./NotRole/page";

type Role = "ORGANIZER" | "PRESENTER" | "COMMITTEE" | "GUEST" | null;

export default function EventDetail() {
  const params = useParams();
  const id = (params?.id as string) ?? "";
  const [event, setEvent] = useState<EventData | null>(null);
  const [role, setRole] = useState<Role>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const res = await getEvent(id);
        if (res.message === "ok") {
          setEvent(res.event);
          const evRole = (res.event as { role?: Role })?.role ?? null;
          if (evRole) setRole(evRole as Role);
        }
        try {
          const my = await getMyEvents();
          const meEvent = ((my.events ?? []) as Array<{ id: string; role?: Role }>).find(
            (e) => e.id === id
          );
          if (meEvent?.role) setRole(meEvent.role as Role);
        } catch {}
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
        <>
          {role === "ORGANIZER" ? (
            <OrganizerView id={id} event={event!} />
          ) : role === null ? (
            <NotRoleView id={id} event={event!} />
          ) : (
            <PresenterView id={id} event={event!} />
          )}
        </>
      )}
    </div>
  );
}
