"use client";

import Image from "next/image";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import InformationSection from "../InformationSection";
import type { EventData } from "@/utils/types";

type Props = {
  id: string;
  event: EventData;
};

export default function NotRoleView({ id, event }: Props) {
  return (
    <div className="min-h-screen bg-background">
      <div className="w-full">
        <div className="relative w-full aspect-2/1 md:h-[400px] overflow-hidden">
          <Image
            src={event?.imageCover || "/banner.png"}
            alt={event?.eventName || "Event banner"}
            fill
            sizes="100vw"
            className="object-cover rounded-xl"
          />
          <div className="absolute inset-0 bg-linear-to-t from-background/60 to-transparent pointer-events-none" />
        </div>

        <div className="max-w-6xl mx-auto px-6 lg:px-8 mt-6">
          <div className="bg-card rounded-xl shadow-sm border p-6 flex items-center justify-between gap-6">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
                {event?.eventName || "Event"}
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border">
                Viewer
              </span>
            </div>
          </div>

          <Tabs value="information" className="mt-6">
            <TabsList>
              <TabsTrigger value="information">Information</TabsTrigger>
            </TabsList>
            <TabsContent value="information">
              <InformationSection id={id} event={event} editable={false} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
