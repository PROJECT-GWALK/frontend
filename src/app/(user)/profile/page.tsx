"use client";

import { getCurrentUser } from "@/utils/apiuser";
import { getUserHistory } from "@/utils/apievent";
import { User } from "@/utils/types";
import { useEffect, useState } from "react";
import ProfileView, { ParticipatedEvent, OrganizedEvent } from "./components/ProfileView";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [participatedEvents, setParticipatedEvents] = useState<ParticipatedEvent[]>([]);
  const [organizedEvents, setOrganizedEvents] = useState<OrganizedEvent[]>([]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getCurrentUser();
        setUser(data.user);

        const history = await getUserHistory();
        setParticipatedEvents(history.participated);
        setOrganizedEvents(history.organized);
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  return (
    <ProfileView
      user={user}
      loading={loading}
      participatedEvents={participatedEvents}
      organizedEvents={organizedEvents}
    />
  );
}
