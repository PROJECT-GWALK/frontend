"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Building } from "lucide-react";
import { setEventPublicView } from "@/utils/apievent";
import { EventData } from "@/utils/types";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  id: string;
  event: EventData | null;
  onEventUpdate: (updatedEvent: EventData) => void;
};

export default function OrganizerHeader({ id, event, onEventUpdate }: Props) {
  const [updatingPublic, setUpdatingPublic] = useState(false);
  const { t } = useLanguage();
  const isPublic = !!event?.publicView;
  const currentStatusLabel = isPublic
    ? t("publishedEventBanner.publicStatus")
    : t("publishedEventBanner.hiddenStatus");
  const nextStatusLabel = isPublic
    ? t("publishedEventBanner.hidePublic")
    : t("publishedEventBanner.showPublic");

  const togglePublicView = async () => {
    if (!id) return;
    setUpdatingPublic(true);
    try {
      const res = await setEventPublicView(id, !event?.publicView);
      if (res?.event) {
        onEventUpdate(res.event);
      }
    } finally {
      setUpdatingPublic(false);
    }
  };

  return (
    <div
      className="bg-card rounded-xl shadow-sm border p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 transition-all hover:shadow-md relative overflow-hidden"
      style={{ borderLeft: "6px solid var(--role-organizer)" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(to right, var(--role-organizer), transparent)",
          opacity: 0.05,
        }}
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
          <span className="group relative inline-flex items-center">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                isPublic
                  ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-900"
                  : "bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-900/60 dark:text-zinc-200 dark:border-zinc-800"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                  isPublic ? "bg-emerald-600 dark:bg-emerald-400" : "bg-zinc-600 dark:bg-zinc-400"
                }`}
              ></span>
              {currentStatusLabel}
            </span>
            <span className="pointer-events-none absolute left-0 top-full mt-2 whitespace-nowrap rounded-md bg-black/70 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
              {nextStatusLabel}
            </span>
          </span>
        </div>
      </div>

      {/* RIGHT SIDE: Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Visibility Toggle Button */}
        <Button
          variant={isPublic ? "outline" : "default"}
          onClick={togglePublicView}
          disabled={updatingPublic}
          className={`h-10 px-6 font-medium ${
            isPublic
              ? "border-dashed border-gray-300 text-gray-600 hover:bg-gray-50"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isPublic ? (
            <>
              <EyeOff className="mr-2 h-4 w-4" />
              {t("publishedEventBanner.hidePublic")}
            </>
          ) : (
            <>
              <Eye className="mr-2 h-4 w-4" />
              {t("publishedEventBanner.showPublic")}
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
