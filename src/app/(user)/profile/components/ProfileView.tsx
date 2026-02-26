"use client";

import { UserAvatar } from "@/utils/function";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { linkify } from "@/utils/function";
import { User } from "@/utils/types";
import Link from "next/link";
import { Calendar, Trophy, Star, ExternalLink, Share2, Check } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useState } from "react";

export interface ParticipatedEvent {
  eventId?: string;
  eventName: string;
  teamId?: string;
  teamName: string;
  place: string;
  specialReward: string;
  specialRewards?: { name: string; image: string | null; description: string | null }[];
  userRating?: number;
}

export interface OrganizedEvent {
  eventId?: string;
  eventName: string;
  rating: string;
}

interface ProfileViewProps {
  user: User | null;
  loading: boolean;
  error?: string | null;
  participatedEvents: ParticipatedEvent[];
  organizedEvents: OrganizedEvent[];
}

export default function ProfileView({
  user,
  loading,
  error,
  participatedEvents,
  organizedEvents,
}: ProfileViewProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = user?.username 
      ? `${window.location.origin}/profile/@${user.username}`
      : window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check out ${user?.name}'s profile on GWALK`,
          url: url,
        });
      } catch (err) {
        // Ignore AbortError (user cancelled)
        if ((err as Error).name !== "AbortError") {
          console.error("Error sharing:", err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success(t("toast.profileLinkCopied"));
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error(t("toast.profileLinkCopyFailed"));
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-6">
        <Card className="w-full max-w-4xl shadow-md">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              <Skeleton className="h-32 w-32 rounded-full" />
              <div className="space-y-4 w-full md:w-auto text-center md:text-left">
                <div className="space-y-2">
                  <Skeleton className="h-8 w-48 mx-auto md:mx-0" />
                  <Skeleton className="h-4 w-32 mx-auto md:mx-0" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full md:w-96" />
                  <Skeleton className="h-4 w-2/3 md:w-64" />
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <Skeleton className="h-10 w-full md:w-64" />
              <Skeleton className="h-64 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex justify-center p-6">
        <Card className="w-full max-w-4xl shadow-md p-6 text-center">
          <h2 className="text-2xl font-bold text-red-500">User not found</h2>
          <p className="text-muted-foreground mt-2">
            {error || "The user you are looking for does not exist."}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center p-6 min-h-screen bg-background">
      <Card className="w-full max-w-5xl shadow-lg border-none bg-card">
        <CardContent className="p-6 md:p-10">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start mb-10">
            <div className="relative group">
              <UserAvatar
                user={user}
                className="h-32 w-32 md:h-40 md:w-40 ring-4 ring-background shadow-xl"
              />
            </div>

            <div className="flex-1 text-center md:text-left space-y-4">
              <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    {user?.name}
                  </h1>
                  <p className="text-muted-foreground font-medium">
                    @{user?.username}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-2"
                  onClick={handleShare}
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                  Share
                </Button>
              </div>

              {user?.description && (
                <div className="bg-muted/50 p-4 rounded-xl border border-border">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
                    Bio
                  </h3>
                  <p className="text-sm leading-relaxed whitespace-pre-line text-foreground">
                    {linkify(user.description)}
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator className="my-8" />

          {/* Event History Tabs */}
          <Tabs defaultValue="participated" className="w-full">
            <div className="flex items-center justify-between mb-6">
              <TabsList className="grid w-full md:w-100 grid-cols-2 h-11 p-1 bg-muted">
                <TabsTrigger
                  value="participated"
                  className="rounded-md text-sm font-medium transition-all data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  {t("profileSection.tab_participated")}
                </TabsTrigger>
                <TabsTrigger
                  value="organized"
                  className="rounded-md text-sm font-medium transition-all data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  {t("profileSection.tab_organized")}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value="participated"
              className="mt-0 focus-visible:outline-none focus-visible:ring-0"
            >
              <div className="rounded-xl border border-border overflow-hidden bg-card">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[30%] font-semibold">
                        {t("profileSection.table_header_event")}
                      </TableHead>
                      <TableHead className="w-[30%] font-semibold">
                        {t("profileSection.table_header_team")}
                      </TableHead>
                      <TableHead className="text-center font-semibold">
                        {t("profileSection.table_header_place")}
                      </TableHead>
                      <TableHead className="text-right font-semibold">
                        {t("profileSection.table_header_reward")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participatedEvents.length > 0 ? (
                      participatedEvents.map((event, index) => (
                        <TableRow
                          key={index}
                          className="group hover:bg-muted/50 transition-colors"
                        >
                          <TableCell className="font-medium">
                            {event.eventId ? (
                              <Link
                                href={`/event/${event.eventId}`}
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline decoration-blue-600/30 underline-offset-4"
                              >
                                {event.eventName}
                                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </Link>
                            ) : (
                              <span>{event.eventName}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {event.teamId && event.eventId ? (
                              <Link
                                href={`/event/${event.eventId}/Projects/${event.teamId}`}
                                className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-medium hover:underline decoration-muted-foreground underline-offset-4"
                              >
                                {event.teamName}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">
                                {event.teamName}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {event.place ? (
                              <Badge
                                variant="secondary"
                                className="font-mono rounded-md"
                              >
                                {event.place}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {event.specialRewards &&
                            event.specialRewards.length > 0 ? (
                              <div className="flex justify-end gap-2 flex-wrap">
                                {event.specialRewards.map((reward, i) => (
                                  <TooltipProvider key={i}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="cursor-help inline-flex items-center justify-center">
                                          {reward.image ? (
                                            <div className="relative w-8 h-8 rounded-md overflow-hidden border border-amber-200 dark:border-amber-500/50 shadow-sm hover:scale-110 transition-transform">
                                              <Image
                                                src={reward.image}
                                                alt={reward.name}
                                                fill
                                                className="object-cover"
                                              />
                                            </div>
                                          ) : (
                                            <Badge
                                              variant="default"
                                              className="rounded-md bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"
                                            >
                                              <Trophy className="w-3 h-3 mr-1" />
                                              {reward.name}
                                            </Badge>
                                          )}
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent className="bg-popover text-popover-foreground border-border">
                                        <div className="text-center p-1">
                                          <p className="font-semibold text-amber-600 dark:text-amber-400">
                                            {reward.name}
                                          </p>
                                          {reward.description && (
                                            <p className="text-xs text-muted-foreground max-w-50">
                                              {reward.description}
                                            </p>
                                          )}
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ))}
                              </div>
                            ) : event.specialReward &&
                              event.specialReward !== "-" ? (
                              <Badge
                                variant="default"
                                className="rounded-md bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"
                              >
                                <Trophy className="w-3 h-3 mr-1" />
                                {event.specialReward}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                -
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center">
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <Calendar className="w-8 h-8 mb-2 opacity-20" />
                            <p>{t("profileSection.no_participated_events")}</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent
              value="organized"
              className="mt-0 focus-visible:outline-none focus-visible:ring-0"
            >
              <div className="rounded-xl border border-border overflow-hidden bg-card">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold">
                        {t("profileSection.table_header_event")}
                      </TableHead>
                      <TableHead className="text-right font-semibold">
                        {t("profileSection.table_header_rating")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organizedEvents.length > 0 ? (
                      organizedEvents.map((event, index) => (
                        <TableRow
                          key={index}
                          className="group hover:bg-muted/50 transition-colors"
                        >
                          <TableCell className="font-medium">
                            {event.eventId ? (
                              <Link
                                href={`/event/${event.eventId}`}
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline decoration-blue-600/30 underline-offset-4"
                              >
                                {event.eventName}
                                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </Link>
                            ) : (
                              <span>{event.eventName}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                              <span className="font-medium">
                                {event.rating || "0.0"}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} className="h-32 text-center">
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <Calendar className="w-8 h-8 mb-2 opacity-20" />
                            <p>{t("profileSection.no_organized_events")}</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
