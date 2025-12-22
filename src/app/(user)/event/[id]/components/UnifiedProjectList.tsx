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
  Edit,
  Calendar,
  Users,
  LayoutGrid,
} from "lucide-react";
import type { PresenterProject } from "../Presenter/components/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export type ProjectRewardsState = Record<
  string,
  { vrGiven: number; specialGiven: string | null }
>;

type Props = {
  projects: PresenterProject[];
  role: "COMMITTEE" | "ORGANIZER" | "GUEST" | "PRESENTER";
  eventId: string;
  searchQuery?: string;
  projectRewards?: ProjectRewardsState; // For Committee local state
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
};

export default function UnifiedProjectList({
  projects,
  role,
  eventId,
  searchQuery = "",
  projectRewards = {},
  loading = false,
  onAction,
}: Props) {
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
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase())
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

  return (
    <div className="grid gap-4">
      {filtered.map((p) => (
        <Card
          key={p.id}
          className="group relative overflow-hidden border border-border/60 bg-card/40 hover:bg-card hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 rounded-xl"
        >
          <div className="flex flex-col sm:flex-row p-3 gap-4">
            {/* Project Image Section */}
            <div className="relative shrink-0 w-full sm:w-48 aspect-video overflow-hidden rounded-lg bg-muted border border-border/50 group-hover:border-primary/20 transition-colors">
              <img
                src={p.img || "/banner.png"} // Fallback image
                alt={p.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute top-2 left-2 flex gap-1">
                <Badge
                  variant="secondary"
                  className="bg-background/80 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider shadow-sm border-none px-2 h-5"
                >
                  Team
                </Badge>
              </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-lg font-bold text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-1">
                    {p.title}
                  </h3>
                  {/* Committee Score (Mobile/Tablet view handled via flex-wrap if needed, but here sticking to simple) */}
                </div>
                {p.desc && (
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {p.desc}
                  </p>
                )}
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground font-medium">
                {(p.members?.length ?? 0) > 0 && (
                  <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                    <Users className="w-3.5 h-3.5 text-blue-500/70" />
                    <span>{p.members?.length} Members</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions & Stats Section */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 pl-0 sm:pl-4 sm:border-l border-border/40 min-w-[140px]">
              {/* Committee Reward Display */}
              {role === "COMMITTEE" && (
                <div className="text-right">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                    VR Score
                  </div>
                  <div className="text-xl font-black text-primary tabular-nums leading-none">
                    {projectRewards[p.id]?.vrGiven?.toLocaleString() ?? 0}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 ml-auto sm:ml-0 mt-auto">
                {/* Edit/View Button */}
                <Link href={`/event/${eventId}/Projects/${p.id}`} className="flex-1 sm:flex-none">
                  <Button
                    variant={
                      role === "ORGANIZER" || (role === "PRESENTER" && p.isLeader)
                        ? "default"
                        : "secondary"
                    }
                    size="sm"
                    className="h-8 px-4 font-semibold shadow-sm w-full sm:w-auto"
                  >

                        <Eye className="w-3.5 h-3.5 mr-1.5" /> View
                      
                  </Button>
                </Link>

                {/* Comment Button (Non-Organizer) */}
                {role !== "ORGANIZER" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onAction?.("comment", p.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                    title="แสดงความเห็น"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                )}

                {/* More Options Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                      <span className="sr-only">More options</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {role === "ORGANIZER" && (
                      <>
                        <DropdownMenuLabel>Organizer Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20 cursor-pointer"
                          onClick={() => onAction?.("delete_team", p.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          ลบทีม
                        </DropdownMenuItem>
                      </>
                    )}
                    {role === "COMMITTEE" && (
                      <>
                        <DropdownMenuLabel>Evaluation</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onAction?.("give_vr", p.id)}>
                          <Gift className="w-4 h-4 mr-2 text-primary" /> ให้ VR
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAction?.("give_special", p.id)}>
                          <Award className="w-4 h-4 mr-2 text-yellow-500" /> ให้รางวัลพิเศษ
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onAction?.("reset_vr", p.id)}>
                          <span className="w-4 h-4 mr-2 flex items-center justify-center text-muted-foreground">
                            ↺
                          </span>{" "}
                          ขอคืน VR
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAction?.("reset_special", p.id)}>
                          <span className="w-4 h-4 mr-2 flex items-center justify-center text-muted-foreground">
                            ↺
                          </span>{" "}
                          ขอคืนรางวัลพิเศษ
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
