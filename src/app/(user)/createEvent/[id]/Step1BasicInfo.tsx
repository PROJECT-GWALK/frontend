"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getEvent, updateEvent } from "@/utils/apiuser";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type Step1Props = {
  eventId?: string;
  defaultValues?: any;
  onSuccess?: (updated: any) => void;
};

export default function Step1BasicInfo(props: Step1Props) {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const eventId = props.eventId ?? params.id;

  const [loading, setLoading] = useState(true);
  const [eventName, setEventName] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationURL, setLocationURL] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await getEvent(eventId);
        const e = res.event;
        setEventName(e.eventName || "");
        setEventDescription(e.eventDescription || "");
        setLocationName(e.locationName || "");
        setLocationURL(e.location || "");
        if (e.imageCover) setPreviewUrl(e.imageCover);
      } catch (err) {
        console.error("Failed to load event:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  const handleSubmit = async () => {
    if (!eventName.trim()) {
      alert("Event name is required");
      return;
    }

    const form = new FormData();
    form.append("eventName", eventName);
    if (eventDescription) form.append("eventDescription", eventDescription);
    if (locationName) form.append("locationName", locationName);
    if (locationURL) form.append("location", locationURL);
    if (imageFile) form.append("imageCover", imageFile);

    try {
      await updateEvent(eventId, form);
      router.push(`/createEvent/${eventId}?step=2`);
    } catch (err) {
      console.error("Update event error:", err);
      alert("Failed to update event");
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-4 p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold">Step 1: ข้อมูลพื้นฐาน (Basic Info)</h2>

      <Input
        placeholder="Event Name *"
        value={eventName}
        onChange={(e) => setEventName(e.target.value)}
        required
      />

      <Textarea
        placeholder="Event Description"
        value={eventDescription}
        onChange={(e) => setEventDescription(e.target.value)}
      />

      <Input
        placeholder="Location Name"
        value={locationName}
        onChange={(e) => setLocationName(e.target.value)}
      />

      <Input
        placeholder="Location URL"
        value={locationURL}
        onChange={(e) => setLocationURL(e.target.value)}
      />

      {/* Upload & preview image */}
      <div>
        <label className="block text-sm font-medium mb-1">Event Cover Image</label>
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0] || null;
            setImageFile(file);
            if (file) setPreviewUrl(URL.createObjectURL(file));
          }}
        />
        {previewUrl && (
          <img
            src={previewUrl}
            alt="Preview"
            className="mt-2 w-full max-h-64 object-cover rounded-md"
          />
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button onClick={handleSubmit}>Next</Button>
      </div>
    </div>
  );
}