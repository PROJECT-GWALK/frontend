import EventBreadcrumb from "./components/EventBreadcrumb";
import type { Metadata } from "next";
import { headers } from "next/headers";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;

  const fallbackTitle = "Gwalk";
  const fallbackImage = new URL("/banner.png", origin).toString();

  try {
    const res = await fetch(new URL(`/backend/api/events/${id}`, origin), {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return {
        title: fallbackTitle,
        openGraph: { title: fallbackTitle, images: [fallbackImage] },
        twitter: { card: "summary_large_image", title: fallbackTitle, images: [fallbackImage] },
      };
    }

    const data = (await res.json()) as {
      message?: string;
      event?: { eventName?: string; eventDescription?: string; imageCover?: string | null };
    };

    const eventName = data.event?.eventName?.trim() || fallbackTitle;
    const title = eventName;
    const description = data.event?.eventDescription?.trim() || undefined;

    const rawImage = data.event?.imageCover || "";
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
        url: `/event/${id}`,
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

export default function EventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <div className="w-full px-6 py-4">
         <EventBreadcrumb />
      </div>
      {children}
    </div>
  );
}
