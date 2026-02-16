"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Trash2,
  MessageSquare,
  Eye,
  Award,
  MoreHorizontal,
  Users,
  LayoutGrid,
  RefreshCw,
  CheckCircle2,
  ClipboardCheck,
} from "lucide-react";
import type { PresenterProject } from "../Presenter/components/types";
import type { SpecialReward } from "@/utils/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";

export type ProjectRewardsState = Record<
  string,
  { vrGiven: number; specialGiven: string | null | string[] }
>;

type Props = {
  projects: PresenterProject[];
  role: "COMMITTEE" | "ORGANIZER" | "GUEST" | "PRESENTER";
  eventId: string;
  searchQuery?: string;
  filterStatus?: "all" | "scored" | "unscored";
  projectRewards?: ProjectRewardsState; // For Committee local state
  userVrBalance?: number;
  loading?: boolean;
  onAction?: (
    action:
      | "view"
      | "comment"
      | "give_vr"
      | "give_special"
      | "reset_vr"
      | "reset_special"
      | "delete_team",
    projectId: string,
  ) => void;
  onDeleteTeam?: (projectId: string) => Promise<void> | void;
  onPostComment?: (projectId: string, text: string) => Promise<void> | void;
  onGiveVr?: (projectId: string, amount: number) => Promise<void> | void;
  onGiveSpecial?: (projectId: string, rewardId: string) => Promise<void> | void;
  unusedAwards?: SpecialReward[];
  onRefresh?: () => void;
  unitReward?: string;
};

type ActionType = Parameters<NonNullable<Props["onAction"]>>[0];

export default function UnifiedProjectList({
  projects,
  role,
  eventId,
  searchQuery = "",
  filterStatus = "all",
  projectRewards = {},
  loading = false,
  onAction,
  onDeleteTeam,
  onPostComment,
  onGiveVr,
  onGiveSpecial,
  unusedAwards = [],
  unitReward,
  onRefresh,
}: Props) {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [teamToDelete, setTeamToDelete] = React.useState<string | null>(null);

  const [commentOpen, setCommentOpen] = React.useState(false);
  const [commentText, setCommentText] = React.useState("");
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null);

  const [vrDialogOpen, setVrDialogOpen] = React.useState(false);
  const [vrAmount, setVrAmount] = React.useState<number>(0);

  const [specialDialogOpen, setSpecialDialogOpen] = React.useState(false);
  const [specialChoice, setSpecialChoice] = React.useState<string | null>(null);

  // Infinite Scroll State
  const [visibleCount, setVisibleCount] = React.useState(30);
  const observerTarget = React.useRef(null);
  const { t } = useLanguage(); // Reset dialog state when closed
  React.useEffect(() => {
    if (!specialDialogOpen) {
      setSpecialChoice(null);
    }
  }, [specialDialogOpen]);

  const handleActionInternal = (action: ActionType, projectId: string) => {
    if (action === "comment" && onPostComment) {
      setSelectedProjectId(projectId);
      setCommentOpen(true);
    } else if (action === "delete_team" && onDeleteTeam) {
      setTeamToDelete(projectId);
      setDeleteDialogOpen(true);
    } else if (action === "give_vr" && onGiveVr) {
      setSelectedProjectId(projectId);
      // Pre-fill with existing amount if available
      const existingAmount = projectRewards[projectId]?.vrGiven || 0;
      setVrAmount(existingAmount);
      setVrDialogOpen(true);
    } else if (action === "give_special" && onGiveSpecial) {
      setSelectedProjectId(projectId);
      setSpecialDialogOpen(true);
    } else {
      onAction?.(action, projectId);
    }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const sorted = React.useMemo(() => {
    let result = [...projects];

    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(
        (p) => p.title.toLowerCase().includes(lower) || p.desc?.toLowerCase().includes(lower),
      );
    }

    if (filterStatus === "scored") {
      result = result.filter((p) => (projectRewards[p.id]?.vrGiven || 0) > 0);
    } else if (filterStatus === "unscored") {
      result = result.filter((p) => (projectRewards[p.id]?.vrGiven || 0) === 0);
    }

    // Sort by createdAt (Oldest -> Newest)
    result.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateA - dateB;
    });

    return result;
  }, [projects, searchQuery, filterStatus, projectRewards]);

  // Infinite Scroll Effect
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 30, sorted.length));
        }
      },
      { threshold: 0.1 },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [sorted.length]);

  // Reset visible count when search or filter changes
  React.useEffect(() => {
    setVisibleCount(30);
  }, [searchQuery, filterStatus]);

  const visibleProjects = sorted.slice(0, visibleCount);

  return (
    <>
      <div className="flex flex-col gap-4">
        {onRefresh && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              className="gap-2 hover:bg-primary/10 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {t("participantSection.refresh")}
            </Button>
          </div>
        )}

        {loading && visibleProjects.length === 0 ? (
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card
                key={i}
                className="group border border-border/50 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm p-4 flex items-start gap-4"
              >
                {/* Image Skeleton */}
                <div className="relative w-32 sm:w-48 aspect-video shrink-0 overflow-hidden bg-muted rounded-lg">
                  <Skeleton className="w-full h-full" />
                </div>

                {/* Content Skeleton */}
                <div className="flex-1 flex flex-col gap-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex gap-3 mt-auto">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 bg-muted/20 rounded-2xl border-2 border-dashed border-muted-foreground/20">
            <div className="p-4 rounded-full bg-muted/50 ring-8 ring-muted/20">
              <LayoutGrid className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">
                {t("projectTab.projectNotFound")}
              </p>
              <p className="text-sm text-muted-foreground">{t("projectTab.ProjectNotFoundDesc")}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleProjects.map((p, index) => {
              const isVrGiven = (projectRewards[p.id]?.vrGiven || 0) > 0;
              const isSpecialGiven = !!projectRewards[p.id]?.specialGiven;
              const isCommented = !!p.myComment;
              const isGraded = !!p.myGraded;

              return (
                <Card
                  key={p.id}
                  className="group relative flex flex-col overflow-hidden hover:shadow-xl transition-all duration-300 border border-border/60 p-0 gap-0"
                >
                  {/* Image Section */}
                  <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    <Link
                      href={`/event/${eventId}/Projects/${p.id}`}
                      className="block w-full h-full"
                    >
                      <Image
                        src={p.img || "/banner.png"}
                        alt={p.title}
                        fill
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </Link>

                    {/* Badge Index */}
                    <Badge className="absolute top-3 left-3 px-2.5 py-1 text-xs font-semibold rounded-full shadow-lg bg-black/60 text-white border border-white/20 backdrop-blur-md z-10">
                      #{index + 1}
                    </Badge>

                    {/* Dropdown Menu (Top Right) */}
                    {role === "ORGANIZER" && (
                      <div className="absolute top-2 right-2 z-20">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 bg-background/50 backdrop-blur-sm hover:bg-background/80 rounded-full text-foreground"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">{t("projectTab.moreOptions")}</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            {role === "ORGANIZER" && (
                              <>
                                <DropdownMenuLabel>
                                  {t("projectTab.manageProject")}
                                </DropdownMenuLabel>
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20 cursor-pointer"
                                  onClick={() => handleActionInternal("delete_team", p.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  {t("projectTab.deleteProject")}
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="flex flex-col flex-1 p-4 gap-3">
                    <div className="space-y-2">
                      <Link href={`/event/${eventId}/Projects/${p.id}`} className="block">
                        <h4 className="font-semibold text-lg line-clamp-1 hover:text-primary transition-colors">
                          {p.title}
                        </h4>
                      </Link>

                      {p.desc && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{p.desc}</p>
                      )}

                      {/* Badges */}
                      {(role === "COMMITTEE" || role === "GUEST") && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {isVrGiven && (
                            <Badge
                              variant="outline"
                              className="border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400 gap-1 pl-1 pr-2 py-0 text-[10px]"
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              {t("projectTab.givenVR")}{" "}
                              {projectRewards[p.id]?.vrGiven?.toLocaleString()} {unitReward}
                            </Badge>
                          )}
                          {isSpecialGiven && (
                            <Badge
                              variant="outline"
                              className="border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1 pl-1 pr-2 py-0 text-[10px]"
                            >
                              <Award className="w-3 h-3 mr-1" />
                              {t("projectTab.givenSR")}
                            </Badge>
                          )}
                          {isCommented && (
                            <Badge
                              variant="outline"
                              className="border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400 gap-1 pl-1 pr-2 py-0 text-[10px]"
                            >
                              <MessageSquare className="w-3 h-3 mr-1" />
                              {t("projectTab.commented")}
                            </Badge>
                          )}
                          {isGraded && (
                            <Badge
                              variant="outline"
                              className="border-purple-500/50 bg-purple-500/10 text-purple-600 dark:text-purple-400 gap-1 pl-1 pr-2 py-0 text-[10px]"
                            >
                              <ClipboardCheck className="w-3 h-3 mr-1" />
                              {t("projectTab.graded")}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Info Row */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          <span>
                            {p.members?.length ?? 0} {t("projectTab.members")}
                          </span>
                        </div>

                        <div className="text-xs font-bold text-primary flex items-center">
                          {role === "ORGANIZER" || role === "PRESENTER" ? (
                            <>
                              <span className="font-normal text-muted-foreground mr-1">
                                {t("projectTab.total")}{" "}
                              </span>
                              {p.totalVr?.toLocaleString() ?? 0} {unitReward}
                            </>
                          ) : (
                            <>
                              <span className="text-green-600 dark:text-green-400 mr-1">
                                {projectRewards[p.id]?.vrGiven?.toLocaleString() ?? 0}
                              </span>
                              <span className="text-muted-foreground mx-1">/</span>
                              <span className="ml-1">
                                {p.totalVr?.toLocaleString() ?? 0} {unitReward}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-auto pt-2 flex gap-2">
                      <Link href={`/event/${eventId}/Projects/${p.id}`} className="flex-1">
                        <Button size="sm" variant="outline" className="w-full">
                          <Eye className="w-3.5 h-3.5 mr-1.5" /> {t("projectTab.viewProject")}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}

            {/* Sentinel for infinite scroll */}
            {visibleCount < sorted.length && (
              <div ref={observerTarget} className="py-4 flex justify-center w-full">
                <div className="flex items-center gap-2 text-muted-foreground text-sm animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {t("projectTab.loadingMoreProjects")}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Drawer open={commentOpen} onOpenChange={setCommentOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>
                {t("projectTab.comments")} {selectedProject ? `- ${selectedProject.title}` : ""}
              </DrawerTitle>
              <DrawerDescription>{t("projectTab.commentsDesc")}</DrawerDescription>
            </DrawerHeader>
            <div className="p-4 pb-0">
              {selectedProject && (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-4 border border-border/50">
                  <Image
                    src={selectedProject.img || "/banner.png"}
                    alt={selectedProject.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full mb-4"
                rows={6}
                placeholder={t("projectTab.writeCommentPlaceholder")}
              />
            </div>
            <DrawerFooter className="pt-2 pb-8">
              <Button
                onClick={() => {
                  if (selectedProjectId && onPostComment) {
                    onPostComment(selectedProjectId, commentText);
                  }
                  setCommentOpen(false);
                  setCommentText("");
                }}
                className="h-11 text-base"
              >
                {t("projectTab.postComment")}
              </Button>
              <DrawerClose asChild>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCommentOpen(false);
                    setCommentText("");
                  }}
                  className="h-11 text-base"
                >
                  {t("projectTab.cancel")}
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      {/* VR Giving Drawer */}
      <Drawer open={vrDialogOpen} onOpenChange={setVrDialogOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>
                {t("projectTab.giveVR")} {selectedProject ? `- ${selectedProject.title}` : ""}
              </DrawerTitle>
              <DrawerDescription>{t("projectTab.giveVRDesc")}</DrawerDescription>
            </DrawerHeader>
            <div className="p-4 pb-0">
              {selectedProject && (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-4 border border-border/50">
                  <Image
                    src={selectedProject.img || "/banner.png"}
                    alt={selectedProject.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <Input
                type="number"
                value={vrAmount}
                onChange={(e) => setVrAmount(Number(e.target.value || 0))}
                className="w-full mb-4"
                placeholder="จำนวน VR"
              />
            </div>
            <DrawerFooter className="pt-2 pb-8">
              <Button
                onClick={() => {
                  if (selectedProjectId && onGiveVr) {
                    onGiveVr(selectedProjectId, vrAmount);
                  }
                  setVrDialogOpen(false);
                  setVrAmount(0);
                }}
                className="h-11 text-base"
              >
                {t("projectTab.confirm")}
              </Button>
              <DrawerClose asChild>
                <Button
                  variant="outline"
                  onClick={() => {
                    setVrDialogOpen(false);
                    setVrAmount(0);
                  }}
                  className="h-11 text-base"
                >
                  {t("projectTab.cancel")}
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Special Reward Drawer */}
      <Drawer open={specialDialogOpen} onOpenChange={setSpecialDialogOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>
                {t("projectTab.giveSR")} {selectedProject ? `- ${selectedProject.title}` : ""}
              </DrawerTitle>
              <DrawerDescription>{t("projectTab.giveSRDesc")}</DrawerDescription>
            </DrawerHeader>
            <div className="p-4 pb-0 space-y-3 mb-4">
              {selectedProject && (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-4 border border-border/50">
                  <Image
                    src={selectedProject.img || "/banner.png"}
                    alt={selectedProject.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              {unusedAwards.length > 0 ? (
                unusedAwards.map((a) => (
                  <label
                    key={a.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card hover:bg-accent cursor-pointer transition-colors"
                  >
                    <input
                      type="radio"
                      name="special"
                      checked={specialChoice === a.id}
                      onChange={() => setSpecialChoice(a.id)}
                      className="h-5 w-5 accent-primary"
                    />
                    <div className="text-base font-medium">{a.name}</div>
                  </label>
                ))
              ) : (
                <div className="text-muted-foreground text-sm text-center py-4 bg-muted/30 rounded-lg">
                  {t("projectTab.noMoreSR")}
                </div>
              )}
            </div>
            <DrawerFooter className="pt-2 pb-8">
              <Button
                disabled={!specialChoice}
                onClick={() => {
                  if (selectedProjectId && specialChoice && onGiveSpecial) {
                    onGiveSpecial(selectedProjectId, specialChoice);
                  }
                  setSpecialDialogOpen(false);
                  setSpecialChoice(null);
                }}
                className="h-11 text-base"
              >
                {t("projectTab.confirm")}
              </Button>
              <DrawerClose asChild>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSpecialDialogOpen(false);
                    setSpecialChoice(null);
                  }}
                  className="h-11 text-base"
                >
                  {t("projectTab.cancel")}
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("projectTab.confirmDeleteProject")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("projectTab.confirmDeleteProjectDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTeamToDelete(null)}>
              {t("projectTab.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (teamToDelete && onDeleteTeam) {
                  onDeleteTeam(teamToDelete);
                }
                setDeleteDialogOpen(false);
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {t("projectTab.deleteProject")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
