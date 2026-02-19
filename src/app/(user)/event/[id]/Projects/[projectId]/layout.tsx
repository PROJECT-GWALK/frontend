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

  const fallbackTitle = "Gwalk";
  const fallbackImage = new URL("/banner.png", origin).toString();

  try {
    const [eventRes, teamRes] = await Promise.all([
      fetch(new URL(`/backend/api/events/${id}`, origin), { next: { revalidate: 60 } }),
      fetch(new URL(`/backend/api/events/${id}/teams/${projectId}`, origin), { next: { revalidate: 60 } }),
    ]);

    const eventData = eventRes.ok
      ? ((await eventRes.json()) as {
          event?: { eventName?: string; imageCover?: string | null; eventDescription?: string | null };
        })
      : {};

    const teamData = teamRes.ok
      ? ((await teamRes.json()) as { team?: { teamName?: string; imageCover?: string | null; description?: string | null } })
      : {};

    const eventName = eventData.event?.eventName?.trim() || fallbackTitle;
    const projectName = teamData.team?.teamName?.trim() || "Project";
    const title = `${projectName} - ${eventName}`;
    const description =
      teamData.team?.description?.trim() || eventData.event?.eventDescription?.trim() || undefined;

    const rawImage = teamData.team?.imageCover || eventData.event?.imageCover || "";
    const imageUrl = rawImage
      ? rawImage.startsWith("http")
        ? rawImage
        : new URL(rawImage.startsWith("/") ? rawImage : `/${rawImage}`, origin).toString()
      : fallbackImage;

    return {
      title,
      description,
      metadataBase: new URL(origin),
      openGraph: {
        title,
        description,
        url: `/event/${id}/Projects/${projectId}`,
        images: [imageUrl],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [imageUrl],
      },
    };
  } catch {
    return {
      title: fallbackTitle,
      openGraph: { title: fallbackTitle, images: [fallbackImage] },
      twitter: { card: "summary_large_image", title: fallbackTitle, images: [fallbackImage] },
    };
  }
}

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  return children;
}
