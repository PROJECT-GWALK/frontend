import type { Metadata } from "next";
import { headers } from "next/headers";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; projectId: string }>;
}): Promise<Metadata> {
  const { id, projectId } = await params;

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;

  const fallbackTitle = "Gallery Walk";

  try {
    const [eventRes, teamRes] = await Promise.all([
      fetch(new URL(`/backend/api/events/${id}`, origin), { next: { revalidate: 60 } }),
      fetch(new URL(`/backend/api/events/${id}/teams/${projectId}`, origin), { next: { revalidate: 60 } }),
    ]);

    const eventData = eventRes.ok
      ? ((await eventRes.json()) as {
          event?: { eventName?: string };
        })
      : {};

    const teamData = teamRes.ok
      ? ((await teamRes.json()) as {
          team?: {
            teamName: string;
            imageCover?: string;
            description?: string;
          };
        })
      : {};

    const eventName = eventData.event?.eventName?.trim() || fallbackTitle;
    const projectName = teamData.team?.teamName?.trim() || "Project";
    const description = teamData.team?.description?.trim() || `Project ${projectName} in ${eventName}`;
    const title = `${projectName} - ${eventName}`;

    let images: string[] = [];
    if (teamData.team?.imageCover) {
      // If it's a relative URL, prepend the origin
      if (teamData.team.imageCover.startsWith("/")) {
        images = [`${origin}${teamData.team.imageCover}`];
      } else if (teamData.team.imageCover.startsWith("http")) {
        images = [teamData.team.imageCover];
      }
    } else {
        images = ["/banner.png"];
    }

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images,
      },
    };
  } catch {
    return {
      title: fallbackTitle,
    };
  }
}

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  return children;
}
