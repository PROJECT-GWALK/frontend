"use client";

import { getCurrentUser, getUserByUsername } from "@/utils/apiuser";
import { getUserHistoryByUsername } from "@/utils/apievent";
import { User } from "@/utils/types";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProfileView, { ParticipatedEvent, OrganizedEvent } from "../components/ProfileView";

export default function OtherProfilePage() {
  const params = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [participatedEvents, setParticipatedEvents] = useState<ParticipatedEvent[]>([]);
  const [organizedEvents, setOrganizedEvents] = useState<OrganizedEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);
        const idParam = Array.isArray(params?.id) ? params?.id[0] : params?.id;

        if (!idParam) return;

        // Handle URL encoding (e.g. %40username) and direct @username
        // Decode URI component to handle %40
        const decodedId = decodeURIComponent(idParam);

        const [userData, history, current] = await Promise.all([
          getUserByUsername(decodedId),
          getUserHistoryByUsername(decodedId),
          getCurrentUser().catch(() => null),
        ]);
        setUser(userData.user);
        setParticipatedEvents(history.participated);
        setOrganizedEvents(history.organized);
        if (current?.user) setCurrentUser(current.user);
      } catch (error: unknown) {
        console.error("Error fetching user:", error);
        if (error instanceof Error && error.message) {
          setError(error.message);
        } else {
          setError("User not found");
        }
      } finally {
        setLoading(false);
      }
    };

    if (params?.id) fetchUser();
  }, [params?.id]);

  const isSelf =
    !!currentUser &&
    !!user &&
    (currentUser.id ? currentUser.id === user.id : currentUser.username === user.username);

  return (
    <ProfileView
      user={user}
      loading={loading}
      error={error}
      participatedEvents={participatedEvents}
      organizedEvents={organizedEvents}
      isSelf={isSelf}
    />
  );
}
