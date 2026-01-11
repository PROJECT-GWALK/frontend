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
} from "lucide-react";
import type { PresenterProject } from "../Presenter/components/types";
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

export type ProjectRewardsState = Record<
  string,
  { vrGiven: number; specialGiven: string | null }
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
  onGiveSpecial?: (projectId: string, rewardName: string) => Promise<void> | void;
  unusedAwards?: string[];
};
import { Input } from "@/components/ui/input";

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

  if (loading) {
    return (
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
    );
  }

  const filtered = projects.filter(
    (p) => {
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filterStatus === "all") return true;

      const reward = projectRewards[p.id];
      const hasGivenReward = reward && (reward.vrGiven > 0 || reward.specialGiven !== null);

      if (filterStatus === "scored") return hasGivenReward;
      if (filterStatus === "unscored") return !hasGivenReward;

      return true;
    }
  );

  if (filtered.length === 0) {
    return (
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
    );
  }

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <>
      <div className="grid gap-4">
      {filtered.map((p) => (
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
                <Badge
                  variant="secondary"
                  className="bg-background/90 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider shadow-sm border-none px-2 h-6 flex items-center"
                >
                  Team
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
                        {p.totalVr?.toLocaleString() ?? 0}
                      </div>
                    </div>
                    {/* My Contribution */}
                    {role !== "ORGANIZER" && (
                      <div className="text-[10px] text-muted-foreground border-l border-primary/20 pl-4 text-right">
                        You gave
                        <div className="font-bold text-foreground tabular-nums">
                          {projectRewards[p.id]?.vrGiven?.toLocaleString() ?? 0}
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
                className="w-full sm:w-auto sm:mr-auto"
              >
                <Button
                  variant={
                    role === "ORGANIZER" || (role === "PRESENTER" && p.isLeader)
                      ? "default"
                      : "secondary"
                  }
                  size="sm"
                  className="h-9 px-4 font-semibold w-full sm:w-auto min-w-[96px]"
                >
                  <Eye className="w-4 h-4 mr-2" /> View
                </Button>
              </Link>

              <div className="flex flex-wrap items-center justify-end gap-2">
                {role !== "ORGANIZER" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleActionInternal("comment", p.id)}
                    className="h-9 px-3"
                    title="แสดงความเห็น"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    คอมเมนต์
                  </Button>
                )}

                {(role === "COMMITTEE" || role === "GUEST") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleActionInternal("give_vr", p.id)}
                    className="h-9 px-3 font-medium text-primary hover:text-primary hover:bg-primary/10 border-primary/20"
                    title="ให้ VR"
                  >
                    <Gift className="w-4 h-4 mr-2" />
                    VR
                  </Button>
                )}

                {role === "COMMITTEE" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleActionInternal("give_special", p.id)}
                    className="h-9 px-3 font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
                    title="ให้รางวัลพิเศษ"
                  >
                    <Award className="w-4 h-4 mr-2" />
                    Special
                  </Button>
                )}

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
      ))}
      </div>

      <Drawer open={commentOpen} onOpenChange={setCommentOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>แสดงความคิดเห็น {selectedProject ? `- ${selectedProject.title}` : ""}</DrawerTitle>
              <DrawerDescription>เขียนความคิดเห็นของคุณเกี่ยวกับทีมนี้</DrawerDescription>
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
              <DrawerTitle>ให้ Virtual Reward {selectedProject ? `- ${selectedProject.title}` : ""}</DrawerTitle>
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
              <DrawerTitle>ให้รางวัลพิเศษ {selectedProject ? `- ${selectedProject.title}` : ""}</DrawerTitle>
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
                    key={a}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card hover:bg-accent cursor-pointer transition-colors"
                  >
                    <input
                      type="radio"
                      name="special"
                      checked={specialChoice === a}
                      onChange={() => setSpecialChoice(a)}
                      className="h-5 w-5 accent-primary"
                    />
                    <div className="text-base font-medium">{a}</div>
                  </label>
                ))
              ) : (
                <div className="text-muted-foreground text-sm text-center py-4 bg-muted/30 rounded-lg">ไม่มีรางวัลที่เหลืออยู่</div>
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
              การกระทำนี้ไม่สามารถย้อนกลับได้ ข้อมูลทีมและสมาชิกทั้งหมดจะถูกลบออกจากกิจกรรมนี้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTeamToDelete(null)}>ยกเลิก</AlertDialogCancel>
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
