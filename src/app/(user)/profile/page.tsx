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
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCurrentUser } from "@/utils/apiuser";
import { getUserHistory } from "@/utils/apievent";
import { linkify } from "@/utils/function";
import { User } from "@/utils/types";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Calendar, Trophy, Star, ExternalLink } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "next/image";

import { Skeleton } from "@/components/ui/skeleton";

interface ParticipatedEvent {
  eventId?: string;
  eventName: string;
  teamId?: string;
  teamName: string;
  place: string;
  specialReward: string;
  specialRewards?: { name: string; image: string | null; description: string | null }[];
  userRating?: number;
}

interface OrganizedEvent {
  eventId?: string;
  eventName: string;
  rating: string;
}

export default function ProfilePage() {
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [participatedEvents, setParticipatedEvents] = useState<ParticipatedEvent[]>([]);
  const [organizedEvents, setOrganizedEvents] = useState<OrganizedEvent[]>([]);

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

  useEffect(() => {
    fetchUser();
  }, []);

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

  return (
    <div className="flex justify-center p-6 min-h-screen bg-gray-50/50 dark:bg-zinc-900/50">
      <Card className="w-full max-w-5xl shadow-lg border-none bg-white dark:bg-zinc-950">
        <CardContent className="p-6 md:p-10">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start mb-10">
            <div className="relative group">
              <UserAvatar user={user} className="h-32 w-32 md:h-40 md:w-40 ring-4 ring-white dark:ring-zinc-900 shadow-xl" />
            </div>
            
            <div className="flex-1 text-center md:text-left space-y-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">{user?.name}</h1>
                <p className="text-muted-foreground font-medium">@{user?.username}</p>
              </div>
              
              {user?.description && (
                <div className="bg-gray-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-gray-100 dark:border-zinc-800">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Bio</h3>
                  <p className="text-sm leading-relaxed whitespace-pre-line text-gray-700 dark:text-gray-300">
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
              <TabsList className="grid w-full md:w-100 grid-cols-2 h-11 p-1 bg-gray-100 dark:bg-zinc-900">
                <TabsTrigger value="participated" className="rounded-md text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800">
                  {t("profileSection.tab_participated")}
                </TabsTrigger>
                <TabsTrigger value="organized" className="rounded-md text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800">
                  {t("profileSection.tab_organized")}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="participated" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <div className="rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950">
                <Table>
                  <TableHeader className="bg-gray-50 dark:bg-zinc-900">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[30%] font-semibold">{t("profileSection.table_header_event")}</TableHead>
                      <TableHead className="w-[30%] font-semibold">{t("profileSection.table_header_team")}</TableHead>
                      <TableHead className="text-center font-semibold">{t("profileSection.table_header_place")}</TableHead>
                      <TableHead className="text-right font-semibold">{t("profileSection.table_header_reward")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participatedEvents.length > 0 ? (
                      participatedEvents.map((event, index) => (
                        <TableRow key={index} className="group hover:bg-gray-50/50 dark:hover:bg-zinc-900/50 transition-colors">
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
                                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 font-medium hover:underline decoration-gray-400 underline-offset-4"
                              >
                                {event.teamName}
                              </Link>
                            ) : (
                              <span className="text-gray-600 dark:text-gray-400">{event.teamName}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {event.place ? (
                              <Badge variant="secondary" className="font-mono rounded-md">
                                {event.place}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {event.specialRewards && event.specialRewards.length > 0 ? (
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
                            ) : event.specialReward && event.specialReward !== "-" ? (
                              <Badge
                                variant="default"
                                className="rounded-md bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"
                              >
                                <Trophy className="w-3 h-3 mr-1" />
                                {event.specialReward}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
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

            <TabsContent value="organized" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <div className="rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950">
                <Table>
                  <TableHeader className="bg-gray-50 dark:bg-zinc-900">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold">{t("profileSection.table_header_event")}</TableHead>
                      <TableHead className="text-right font-semibold">{t("profileSection.table_header_rating")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organizedEvents.length > 0 ? (
                      organizedEvents.map((event, index) => (
                        <TableRow key={index} className="group hover:bg-gray-50/50 dark:hover:bg-zinc-900/50 transition-colors">
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
                              <span className="font-medium">{event.rating || "0.0"}</span>
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
