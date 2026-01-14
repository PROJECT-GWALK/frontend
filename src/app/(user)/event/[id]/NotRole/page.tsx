"use client";

import Image from "next/image";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import InformationSection from "../components/InformationSection";
import type { EventData } from "@/utils/types";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type Props = {
  id: string;
  event: EventData;
  isAuthenticated?: boolean;
};

export default function NotRoleView({ id, event, isAuthenticated }: Props) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full">
        <div className="relative w-full aspect-video md:aspect-2/1 md:h-100 overflow-hidden">
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
          <Card className="border-none shadow-md mb-6">
            <CardHeader className="p-6">
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-3 flex-wrap">
                  <CardTitle className="text-2xl lg:text-3xl font-bold">
                    {event?.eventName || "Event"}
                  </CardTitle>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border shadow-sm">
                    Viewer
                  </span>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Tabs value="information" className="mt-6">
            <TabsList className="w-full flex flex-wrap h-auto p-1 justify-start gap-1 bg-muted/50">
              <TabsTrigger value="information" className="flex-1 min-w-25">Information</TabsTrigger>
            </TabsList>
            <TabsContent value="information">
              <InformationSection id={id} event={event} editable={false} />
            </TabsContent>
          </Tabs>

          {!isAuthenticated && (
            <div className="mt-8 mb-12 flex justify-center">
              <Button 
                size="lg" 
                className="w-full sm:w-auto px-8 py-6 text-lg"
                onClick={() => router.push(`/sign-in?redirectTo=/event/${id}`)}
              >
                Log in to Participate
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
