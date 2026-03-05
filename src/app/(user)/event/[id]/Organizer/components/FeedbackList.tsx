import { useEffect, useState } from "react";
import { getAllRatings } from "@/utils/apievent";
import { UserAvatar } from "@/utils/function";
import { Star, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";

type Rating = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: {
    name: string | null;
    image: string | null;
    username: string | null;
  };
  role?: string | null;
};

export default function FeedbackList({ eventId }: { eventId: string }) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string>("all");

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const res = await getAllRatings(eventId);
        if (res?.ratings) {
          setRatings(res.ratings);
        }
      } catch (error) {
        console.error("Failed to fetch ratings", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRatings();
  }, [eventId]);

  const getRoleColor = (role?: string | null) => {
    switch (role?.toUpperCase()) {
      case "PRESENTER":
        return "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300";
      case "COMMITTEE":
        return "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300";
      case "GUEST":
        return "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300";
      default:
        return "bg-gray-50 dark:bg-gray-950/30 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300";
    }
  };
  const getFilterButtonClass = (role: string, isSelected: boolean) => {
    const upper = role.toUpperCase();
    if (upper === "ALL") {
      return isSelected
        ? "bg-yellow-500 hover:bg-yellow-600 text-white dark:text-black border-yellow-500"
        : "border-yellow-200 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-800 dark:text-yellow-300 dark:hover:bg-yellow-950/40";
    }
    if (upper === "PRESENTER") {
      return isSelected
        ? "bg-green-600 hover:bg-green-600/90 text-white dark:bg-green-500 dark:hover:bg-green-500/90"
        : "border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-950/40";
    }
    if (upper === "COMMITTEE") {
      return isSelected
        ? "bg-purple-600 hover:bg-purple-600/90 text-white dark:bg-purple-500 dark:hover:bg-purple-500/90"
        : "border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-300 dark:hover:bg-purple-950/40";
    }
    if (upper === "GUEST") {
      return isSelected
        ? "bg-orange-600 hover:bg-orange-600/90 text-white dark:bg-orange-500 dark:hover:bg-orange-500/90"
        : "border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-300 dark:hover:bg-orange-950/40";
    }
    return isSelected ? "bg-primary text-primary-foreground" : "";
  };
  const { t } = useLanguage();
  const filteredRatings =
    selectedRole === "all"
      ? ratings
      : ratings.filter((r) => r.role?.toUpperCase() === selectedRole.toUpperCase());

  const getRoleCount = (role: string) =>
    ratings.filter((r) => r.role?.toUpperCase() === role.toUpperCase()).length;

  const averageRating = ratings.length
    ? (ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length).toFixed(1)
    : "0.0";

  if (loading)
    return (
      <div className="py-4 text-center text-muted-foreground">{t("FeedbackList.loading")}</div>
    );

  // Only render if there are ratings or if we want to show "No ratings yet" state
  if (ratings.length === 0) {
    return (
      <Card className="mt-8 border-t-4 border-t-yellow-500 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-700">
            <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
            {t("FeedbackList.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>{t("FeedbackList.noFeedbackYet")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8 border-t-4 border-t-yellow-500 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-yellow-700">
            <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
            {t("FeedbackList.title")}
          </div>
          <div className="flex items-center gap-2 text-sm font-normal bg-yellow-50 dark:bg-yellow-950/30 px-3 py-1 rounded-full border border-yellow-100 dark:border-yellow-800">
            <span className="font-bold text-yellow-700 dark:text-yellow-400 text-lg">{averageRating}</span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-3 w-3 ${
                    star <= Math.round(Number(averageRating))
                      ? "fill-yellow-500 text-yellow-500"
                      : "fill-gray-200 text-gray-200"
                  }`}
                />
              ))}
            </div>
            <span className="text-muted-foreground border-l pl-2 ml-1">
              {ratings.length} {t("FeedbackList.review")}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Role Filter Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedRole === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedRole("all")}
            className={`text-xs ${getFilterButtonClass("ALL", selectedRole === "all")}`}
          >
            {t("FeedbackList.all")} ({ratings.length})
          </Button>
          <Button
            variant={selectedRole === "PRESENTER" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedRole("PRESENTER")}
            className={`text-xs ${getFilterButtonClass("PRESENTER", selectedRole === "PRESENTER")}`}
          >
            {t("FeedbackList.presenter")} ({getRoleCount("PRESENTER")})
          </Button>
          <Button
            variant={selectedRole === "COMMITTEE" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedRole("COMMITTEE")}
            className={`text-xs ${getFilterButtonClass("COMMITTEE", selectedRole === "COMMITTEE")}`}
          >
            {t("FeedbackList.committee")} ({getRoleCount("COMMITTEE")})
          </Button>
          <Button
            variant={selectedRole === "GUEST" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedRole("GUEST")}
            className={`text-xs ${getFilterButtonClass("GUEST", selectedRole === "GUEST")}`}
          >
            {t("FeedbackList.guest")} ({getRoleCount("GUEST")})
          </Button>
        </div>

        {/* Filtered Feedback List */}
        <div className="space-y-4 pt-4 border-t max-h-125 overflow-y-auto pr-2 custom-scrollbar">
          {filteredRatings.length > 0 ? (
            filteredRatings.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 p-4 rounded-lg bg-muted/30 border hover:bg-muted/50 transition-colors"
              >
                <UserAvatar user={item.user} className="h-10 w-10 border bg-background" />
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">
                          {item.user.name || "Anonymous"}
                        </span>
                        {item.role && (
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getRoleColor(item.role)}`}
                          >
                            {item.role}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3 w-3 ${
                              star <= item.rating
                                ? "fill-yellow-500 text-yellow-500"
                                : "fill-muted text-muted"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </span>
                  </div>

                  {item.comment ? (
                    <p className="text-sm text-foreground/90 leading-relaxed bg-background p-3 rounded-md border text-wrap wrap-break-word">
                      {item.comment}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      {t("FeedbackList.noComment")}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>
                {" "}
                {t("FeedbackList.no")} {selectedRole.toLowerCase()} {t("FeedbackList.yet")}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
