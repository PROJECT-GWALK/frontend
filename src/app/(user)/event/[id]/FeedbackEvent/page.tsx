"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getUserRating, submitRating, getEvent } from "@/utils/apievent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Star, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import InformationSection from "../components/InformationSection";
import type { EventData } from "@/utils/types";

export default function FeedbackEventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [eventData, setEventData] = useState<EventData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ratingRes, eventRes] = await Promise.all([
            getUserRating(eventId),
            getEvent(eventId)
        ]);
        if (ratingRes.rating) {
            setRating(ratingRes.rating);
        }
        if (ratingRes.comment) {
            setComment(ratingRes.comment);
        }
        setEventData(eventRes.event);
      } catch (error) {
        console.error("Failed to fetch data", error);
        toast.error("Failed to load event data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [eventId]);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setSubmitting(true);
    try {
      await submitRating(eventId, rating, comment);
      toast.success("Rating submitted successfully");
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Failed to submit rating", error);
      const msg = error?.response?.data?.message || "Failed to submit rating";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!eventData) return null;

  return (
    <div className="min-h-screen bg-muted/20 pb-12">
      {/* Banner Image */}
      <div className="relative h-[200px] sm:h-[300px] w-full bg-muted">
        {eventData.imageCover ? (
          <Image
            src={eventData.imageCover}
            alt={eventData.eventName}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted text-muted-foreground">
            No Cover Image
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        
        <div className="absolute top-4 left-4">
           <Button variant="secondary" size="sm" asChild className="shadow-md">
             <Link href="/dashboard" className="flex items-center gap-2">
               <ArrowLeft className="h-4 w-4" /> Back to Dashboard
             </Link>
           </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-20 relative z-10 space-y-6 max-w-4xl">
        {/* Rating Card */}
        <Card className="shadow-lg border-border/60">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold">Rate Event</CardTitle>
            <CardDescription>
              How was your experience with <span className="font-semibold text-foreground">{eventData.eventName}</span>?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="transition-transform hover:scale-110 focus:outline-none"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={`h-10 w-10 transition-colors ${
                      star <= (hoverRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="comment">Additional Comments (Optional)</Label>
                <Textarea 
                    id="comment"
                    placeholder="Share your thoughts about this event..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="resize-none min-h-[100px]"
                />
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <Button 
                  onClick={handleSubmit} 
                  disabled={submitting || rating === 0}
                  className="w-full"
                  size="lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Rating"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
