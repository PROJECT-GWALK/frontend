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
  Gift,
  MoreHorizontal,
  Users,
  LayoutGrid,
  RefreshCw,
  Check,
  CheckCircle2,
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
    projectId: string
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

  // Reset dialog state when closed
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
        (p) =>
          p.title.toLowerCase().includes(lower) ||
          p.desc?.toLowerCase().includes(lower)
      );
    }

    if (filterStatus === "scored") {
      result = result.filter((p) => (projectRewards[p.id]?.vrGiven || 0) > 0);
    } else if (filterStatus === "unscored") {
      result = result.filter((p) => (projectRewards[p.id]?.vrGiven || 0) === 0);
    }

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
      { threshold: 0.1 }
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
              Refresh
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
                ไม่พบผลงานที่ค้นหา
              </p>
              <p className="text-sm text-muted-foreground">
                ลองค้นหาด้วยคำค้นอื่น หรือยังไม่มีทีมที่สร้างขึ้น
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {visibleProjects.map((p, index) => {
              const isVrGiven = (projectRewards[p.id]?.vrGiven || 0) > 0;
              const isSpecialGiven = !!projectRewards[p.id]?.specialGiven;
              const isCommented = !!p.myComment;

              return (
                <Card
                  key={p.id}
                  className="group relative overflow-hidden border border-border/60 bg-card/40 hover:bg-card hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 rounded-xl flex flex-col"
                >
                  <div className="flex flex-col sm:flex-row p-4 gap-4 sm:gap-6">
                    {/* Project Image Section */}
                    <div className="relative shrink-0 w-full sm:w-56 aspect-video overflow-hidden rounded-lg bg-muted border border-border/50 group-hover:border-primary/20 transition-colors shadow-sm">
                      <Image
                        src={p.img || "/banner.png"} // Fallback image
                        alt={p.title}
                        fill
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute top-2 left-2 flex gap-1">
                        <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-md text-[10px] font-bold shadow-sm border-none px-2 h-6 flex items-center">
                          #{index + 1}
                        </Badge>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="text-xl sm:text-lg font-bold text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-2">
                            {p.title}
                          </h3>
                        </div>
                        {p.desc && (
                          <p className="text-sm text-muted-foreground line-clamp-3 sm:line-clamp-2 leading-relaxed">
                            {p.desc}
                          </p>
                        )}
                        
                        {/* Status Badges for Committee/Guest */}
                        {(role === "COMMITTEE" || role === "GUEST") && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {isVrGiven && (
                                <Badge variant="outline" className="border-green-500/50 bg-green-500/10 text-green-600 gap-1.5 pl-1.5 pr-2.5 py-0.5">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Given VR
                                </Badge>
                            )}
                            {isSpecialGiven && (
                                <Badge variant="outline" className="border-amber-500/50 bg-amber-500/10 text-amber-600 gap-1.5 pl-1.5 pr-2.5 py-0.5">
                                    <Award className="w-3.5 h-3.5" />
                                    Given Award
                                </Badge>
                            )}
                            {isCommented && (
                                <Badge variant="outline" className="border-blue-500/50 bg-blue-500/10 text-blue-600 gap-1.5 pl-1.5 pr-2.5 py-0.5">
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    Commented
                                </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Metadata & Stats Row */}
                      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mt-4">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                          {(p.members?.length ?? 0) > 0 && (
                            <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1.5 rounded-full border border-border/50">
                              <Users className="w-3.5 h-3.5 text-blue-500/70" />
                              <span>{p.members?.length} Members</span>
                            </div>
                          )}
                        </div>

                        {/* VR Score Display - Moved inside content area */}
                        {(role === "COMMITTEE" || role === "GUEST" || role === "ORGANIZER") && (
                          <div className="w-full sm:w-auto flex items-center justify-between gap-4 bg-primary/5 px-3 py-2 rounded-lg border border-primary/10">
                            <div className="flex flex-col">
                              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                VR Score
                              </div>
                              <div className="text-xl font-black text-primary tabular-nums leading-none">
                                {p.totalVr?.toLocaleString() ?? 0} <span className="text-xs font-normal text-muted-foreground">{unitReward}</span>
                              </div>
                            </div>
                            {/* My Contribution */}
                            {role !== "ORGANIZER" && (
                              <div className="text-[10px] text-muted-foreground border-l border-primary/20 pl-4 text-right">
                                You gave
                                <div className="font-bold text-foreground tabular-nums">
                                  {projectRewards[p.id]?.vrGiven?.toLocaleString() ?? 0} {unitReward}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-auto border-t border-border/50 bg-muted/30 p-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <Link
                        href={`/event/${eventId}/Projects/${p.id}`}
                        target="_blank"
                        className="w-full sm:w-auto sm:mr-auto"
                      >
                        <Button
                          variant={
                            role === "ORGANIZER" || (role === "PRESENTER" && p.isLeader)
                              ? "default"
                              : "secondary"
                          }
                          size="sm"
                          className="h-9 px-4 font-semibold w-full sm:w-auto min-w-24"
                        >
                          <Eye className="w-4 h-4 mr-2" /> View
                        </Button>
                      </Link>

                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {/* Evaluate button removed for Committee/Guest as requested */}
                        
                        {(role === "ORGANIZER" || role === "COMMITTEE" || role === "GUEST") && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                                <span className="sr-only">More options</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              {role === "ORGANIZER" && (
                                <>
                                  <DropdownMenuLabel>จัดการทีม</DropdownMenuLabel>
                                  <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20 cursor-pointer"
                                    onClick={() => handleActionInternal("delete_team", p.id)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    ลบทีม
                                  </DropdownMenuItem>
                                </>
                              )}

                              {(role === "COMMITTEE" || role === "GUEST") && (
                                <>
                                  <DropdownMenuLabel>การให้คะแนน</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => onAction?.("reset_vr", p.id)}>
                                    <span className="w-4 h-4 mr-2 flex items-center justify-center text-muted-foreground">
                                      ↺
                                    </span>
                                    ขอคืน VR
                                  </DropdownMenuItem>
                                  {role === "COMMITTEE" && (
                                    <DropdownMenuItem onClick={() => onAction?.("reset_special", p.id)}>
                                      <span className="w-4 h-4 mr-2 flex items-center justify-center text-muted-foreground">
                                        ↺
                                      </span>
                                      ขอคืนรางวัลพิเศษ
                                    </DropdownMenuItem>
                                  )}
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
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
                        Loading more teams...
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
                แสดงความคิดเห็น {selectedProject ? `- ${selectedProject.title}` : ""}
              </DrawerTitle>
              <DrawerDescription>
                เขียนความคิดเห็นของคุณเกี่ยวกับทีมนี้
              </DrawerDescription>
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
                placeholder="เขียนความคิดเห็น..."
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
                ส่งความคิดเห็น
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
                  ยกเลิก
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
                ให้ Virtual Reward {selectedProject ? `- ${selectedProject.title}` : ""}
              </DrawerTitle>
              <DrawerDescription>ระบุจำนวน VR ที่ต้องการให้</DrawerDescription>
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
                ยืนยัน
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
                  ยกเลิก
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
                ให้รางวัลพิเศษ {selectedProject ? `- ${selectedProject.title}` : ""}
              </DrawerTitle>
              <DrawerDescription>เลือกรางวัลพิเศษที่ต้องการมอบให้</DrawerDescription>
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
                  ไม่มีรางวัลที่เหลืออยู่
                  (ท่านอาจใช้สิทธิ์โหวตไปแล้ว หรือยังไม่มีการตั้งค่ารางวัล)
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
                ยืนยัน
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
                  ยกเลิก
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบทีม?</AlertDialogTitle>
            <AlertDialogDescription>
              การกระทำนี้ไม่สามารถย้อนกลับได้
              ข้อมูลทีมและสมาชิกทั้งหมดจะถูกลบออกจากกิจกรรมนี้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTeamToDelete(null)}>
              ยกเลิก
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
              ยืนยันการลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
