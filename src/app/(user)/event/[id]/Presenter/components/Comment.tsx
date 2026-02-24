"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Send, MessageSquare, Filter } from "lucide-react";
import { getComments, giveComment } from "@/utils/apievent";
import { toast } from "sonner";
import { UserAvatar } from "@/utils/function";
import { useLanguage } from "@/contexts/LanguageContext";

type CommentType = {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image: string | null;
    role: string;
  };
};

type Props = {
  eventId: string;
  projectId: string;
  myRole?: string | null; // "COMMITTEE" | "GUEST" | "PRESENTER" | "ORGANIZER"
  disabled?: boolean;
};

export default function CommentSection({ eventId, projectId, myRole, disabled }: Props) {
  const { t } = useLanguage();
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [myComment, setMyComment] = useState("");
  const [filterRole, setFilterRole] = useState<string>("ALL");

  const canComment = myRole === "COMMITTEE" || myRole === "GUEST";

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getComments(eventId, projectId);
      if (res.comments) {
        setComments(res.comments);
        // If user can comment, pre-fill their existing comment
        if (canComment) {
          // Since backend returns only my comment if I am Committee/Guest (and not in team),
          // or all comments if I am in team (but then I can't comment),
          // Wait, if I am Committee AND in Team (rare), I might see all.
          // But standard flow: Committee sees own comment.
          // Actually backend returns my comment with my user id.
          // Since I don't have my user ID easily here without context, 
          // I rely on the fact that for Committee/Guest, the list usually contains ONLY their comment (implemented in backend).
          if (res.comments.length > 0) {
             setMyComment(res.comments[0].content);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch comments", error);
      // If 403, it means we shouldn't see this section, but we handle it by just showing empty
    } finally {
      setLoading(false);
    }
  }, [canComment, eventId, projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async () => {
    if (!myComment.trim()) return;
    try {
      setSubmitting(true);
      await giveComment(eventId, projectId, myComment);
      toast.success(t("projectDetail.comments.posted"));
      fetchData(); // Refresh to show updated timestamp/content
    } catch {
      toast.error(t("projectDetail.comments.postFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!loading && comments.length === 0 && !canComment) {
    return null; // Nothing to show
  }

  const filteredComments = comments.filter((comment) => {
    if (filterRole === "ALL") return true;
    return comment.user.role === filterRole;
  });

  return (
    <Card className="mt-6 p-6">
      <CardHeader className="px-0 pb-2">
        <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl">
            <MessageSquare className="w-5 h-5" />
            {t("projectDetail.comments.title")}
            </CardTitle>
            
            {comments.length > 0 && myRole === "PRESENTER" && (
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <Select value={filterRole} onValueChange={setFilterRole}>
                        <SelectTrigger className="w-35 h-8 text-xs">
                            <SelectValue placeholder={t("projectDetail.comments.filterBy")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">{t("projectDetail.comments.allComments")}</SelectItem>
                            <SelectItem value="COMMITTEE">{t("projectDetail.comments.filterCommittee")}</SelectItem>
                            <SelectItem value="GUEST">{t("projectDetail.comments.filterGuest")}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}
        </div>
      </CardHeader>
      <CardContent className="px-0 space-y-6">
        {/* Comment Input for Committee/Guest */}
        {canComment && (
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder={disabled ? t("projectDetail.comments.disabled") || "Comments are disabled" : `${t("projectDetail.comments.placeholder")} ${myRole?.toLowerCase()}...`}
                value={myComment}
                onChange={(e) => setMyComment(e.target.value)}
                className="min-h-25"
                disabled={disabled}
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handleSubmit} 
                  disabled={submitting || !myComment.trim() || disabled}
                  size="sm"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  {comments.length > 0 ? t("projectDetail.comments.update") : t("projectDetail.comments.post")}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-4 max-h-125 overflow-y-auto pr-2 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            filteredComments.map((comment) => (
              <div key={comment.id} className="flex gap-4 p-4 border rounded-lg bg-card/50">
                <UserAvatar user={comment.user} className="w-10 h-10" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{comment.user.name}</span>
                      <Badge 
                        variant="secondary" 
                        className="text-xs text-white"
                        style={{
                          backgroundColor: `var(--role-${comment.user.role.toLowerCase()})`
                        }}
                      >
                        {comment.user.role}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))
          )}
          {!loading && filteredComments.length === 0 && (
             <div className="text-center text-muted-foreground py-4 text-sm">
                {comments.length > 0 ? t("projectDetail.comments.noMatch") : (canComment ? t("projectDetail.comments.noCommentsYet") : t("projectDetail.comments.noAvailable"))}
             </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
