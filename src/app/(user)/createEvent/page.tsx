"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEvent } from "@/utils/apiuser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";

export default function CreateEventPage() {
  const router = useRouter();

  // state ฟอร์ม
  const [eventName, setEventName] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationURL, setLocationURL] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // ✅ handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // ✅ handle next → call API
  const handleNext = async () => {
    if (!eventName.trim()) {
      alert("กรุณากรอกชื่ออีเวนต์");
      return;
    }

    const form = new FormData();
    form.append("eventName", eventName);
    if (eventDescription) form.append("eventDescription", eventDescription);
    if (locationName) form.append("locationName", locationName);
    if (locationURL) form.append("location", locationURL);
    if (imageFile) form.append("imageCover", imageFile);

    try {
      const res = await createEvent(form);
      router.push(`/createEvent/${res.event.id}?step=2`);
    } catch (err) {
      console.error("Create event failed:", err);
      alert("ไม่สามารถสร้าง event ได้");
    }
  };

  return (
    <div className="container mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">Create Event – Step 1: Basic Info</h1>

      <Input
        placeholder="Event name *"
        value={eventName}
        onChange={(e) => setEventName(e.target.value)}
      />

      <Textarea
        placeholder="Event description"
        value={eventDescription}
        onChange={(e) => setEventDescription(e.target.value)}
      />

      <Input
        placeholder="Location name"
        value={locationName}
        onChange={(e) => setLocationName(e.target.value)}
      />

      <Input
        placeholder="Location URL"
        value={locationURL}
        onChange={(e) => setLocationURL(e.target.value)}
      />

      <div className="space-y-2">
        <label className="block text-sm font-medium">Event Cover</label>
        <Input type="file" accept="image/*" onChange={handleFileChange} />
        {imagePreview && (
          <Image
            src={imagePreview}
            alt="Preview"
            width={400}
            height={200}
            className="rounded border"
          />
        )}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleNext}>Next</Button>
      </div>
    </div>
  );
}