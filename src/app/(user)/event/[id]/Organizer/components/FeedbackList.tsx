import { useEffect, useState } from "react";
import { getAllRatings } from "@/utils/apievent";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

type Rating = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: {
    name: string | null;
    image: string | null;
  };
};

export default function FeedbackList({ eventId }: { eventId: string }) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);

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

  const averageRating = ratings.length
    ? (ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length).toFixed(1)
    : "0.0";

  if (loading) return <div className="py-4 text-center text-muted-foreground">Loading feedback...</div>;
  
  // Only render if there are ratings or if we want to show "No ratings yet" state
  if (ratings.length === 0) {
      return (
        <Card className="mt-8 border-t-4 border-t-yellow-500 shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-700">
                    <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                    Feedback & Ratings
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No feedback received yet.</p>
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
                Feedback & Ratings
            </div>
            <div className="flex items-center gap-2 text-sm font-normal bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100">
                <span className="font-bold text-yellow-700 text-lg">{averageRating}</span>
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
                    {ratings.length} reviews
                </span>
            </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {ratings.map((item) => (
            <div key={item.id} className="flex gap-4 p-4 rounded-lg bg-muted/30 border hover:bg-muted/50 transition-colors">
              <Avatar className="h-10 w-10 border bg-background">
                <AvatarImage src={item.user.image || ""} />
                <AvatarFallback>{item.user.name?.[0] || "?"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1.5">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                      <span className="font-semibold text-sm">{item.user.name || "Anonymous"}</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                            key={star}
                            className={`h-3 w-3 ${
                                star <= item.rating ? "fill-yellow-500 text-yellow-500" : "fill-muted text-muted"
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
                  <p className="text-sm text-foreground/90 leading-relaxed bg-background p-3 rounded-md border text-wrap break-words">
                    {item.comment}
                  </p>
                ) : (
                   <p className="text-xs text-muted-foreground italic">No written comment</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
