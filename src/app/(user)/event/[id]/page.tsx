"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Assuming you have an Input component
import { Textarea } from "@/components/ui/textarea"; // Assuming you have a Textarea component
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Assuming you have a Select component
import { Checkbox } from "@/components/ui/checkbox"; // Assuming you have a Checkbox component
import { CalendarIcon, Trash2Icon, UploadCloudIcon } from "lucide-react"; // Icons for calendar and upload
import { getEvent } from "@/utils/apievent";
import { StepSidebar } from "@/app/(user)/event/[id]/Sidebar";

// --- Extended Type to include form data based on the image and JSON ---
type EventDetail = {
  id: string;
  eventName: string;
  eventCategory?: string; // Added for the select field
  eventDescription?: string; // Maps to "Description" textarea
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  locationName?: string | null; // Maps to "Venue" input
  isOnlineEvent?: boolean; // Maps to "This is an online event" checkbox
  // Ticketing (Basic Structure)
  generalAdmissionPrice?: number;
  generalAdmissionQuantity?: number;
  vipPassPrice?: number;
  vipPassQuantity?: number;
  // Settings & Visibility
  eventVisibility?: "Public" | "Private";
  eventUrlSlug?: string;
  // Meta
  currentStep: number;
  createdAt: string;
  status?: string;
};

export default function EventPage() {
  const params = useParams();
  const id = (params?.id as string) ?? "";
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Load the initial data from the API and map it to the form state
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const res = await getEvent(id);
        const apiEvent = res.event;

        // Map API response to the local state structure, filling in missing fields with defaults
        const mappedEvent: EventDetail = {
          id: apiEvent.id,
          eventName: apiEvent.eventName || "Untitled Event",
          eventDescription: apiEvent.eventDescription || "",
          startDate: "10/26/2024", // Placeholder for date/time fields
          endDate: "10/28/2024",
          startTime: "09:00 AM",
          endTime: "05:00 PM",
          locationName: apiEvent.locationName || "",
          isOnlineEvent: false, // Default
          generalAdmissionPrice: 40, // Placeholder for ticketing
          generalAdmissionQuantity: 500,
          vipPassPrice: 100,
          vipPassQuantity: 50,
          eventVisibility: apiEvent.publicView ? "Public" : "Private",
          eventUrlSlug: "annual-tech-summit", // Placeholder
          currentStep: apiEvent.currentStep,
          createdAt: apiEvent.createdAt,
          status: apiEvent.status,
        };

        setEvent(mappedEvent);
      } catch (err) {
        console.error("Failed to load event:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-start pt-20">
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <CardTitle>Loading Event...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex justify-center items-start pt-20">
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <CardTitle>Event Not Found</CardTitle>
          </CardHeader>
          <CardFooter>
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Helper function to handle form changes
  const handleChange = (field: keyof EventDetail, value: any) => {
    setEvent((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* 1. Sidebar */}
      <StepSidebar currentStep={event.currentStep} />

      {/* 2. Main Content Area (Scrollable Form) */}
      <div className="flex-1 p-8 overflow-y-auto">
        {/* --- Form Section: Basic Information --- */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-bold mb-4">Basic Information</h2>

          {/* Event Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
            <Input
              value={event.eventName}
              onChange={(e) => handleChange("eventName", e.target.value)}
              placeholder="Annual Tech Summit 2024"
            />
          </div>

          {/* Event Banner */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Banner</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center cursor-pointer hover:border-blue-400 transition-colors">
              <UploadCloudIcon className="mx-auto h-10 w-10 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-400">JPG, PNG, GIF, or SVG (Max: 800x400px)</p>
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <Textarea
              value={event.eventDescription}
              onChange={(e) => handleChange("eventDescription", e.target.value)}
              placeholder="Tell attendees about your event..."
            />
          </div>
        </div>

        {/* --- Form Section: Date, Time & Location (Partial View) --- */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-bold mb-4">Date, Time & Location</h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <div className="relative">
                <Input value={event.startDate} readOnly className="pr-10" />
                <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <Input value={event.startTime} readOnly />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <div className="relative">
                <Input value={event.endDate} readOnly className="pr-10" />
                <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* End Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <Input value={event.endTime} readOnly />
            </div>
          </div>

          {/* Online Event Checkbox */}
          <div className="flex items-center space-x-2 mb-4">
            <Checkbox
              id="online"
              checked={event.isOnlineEvent}
              onCheckedChange={(checked) => handleChange("isOnlineEvent", checked)}
            />
            <label
              htmlFor="online"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              This is an online event
            </label>
          </div>

          {/* Venue */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
            <Input
              value={event.locationName || ""}
              onChange={(e) => handleChange("locationName", e.target.value)}
              placeholder="e.g. Convention Center Hall A"
            />
          </div>
        </div>

        {/* --- Form Section: Ticketing (Partial View) --- */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Ticketing</h2>
            <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
              Add Ticket Type
            </Button>
          </div>

          {/* General Admission */}
          <div className="border p-4 rounded-lg mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">General Admission</h3>
              <Trash2Icon className="h-4 w-4 text-gray-400 cursor-pointer hover:text-red-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Price</label>
                <Input
                  type="number"
                  value={event.generalAdmissionPrice}
                  onChange={(e) =>
                    handleChange("generalAdmissionPrice", parseFloat(e.target.value))
                  }
                  placeholder="Price"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Quantity</label>
                <Input
                  type="number"
                  value={event.generalAdmissionQuantity}
                  onChange={(e) =>
                    handleChange("generalAdmissionQuantity", parseInt(e.target.value))
                  }
                  placeholder="Quantity"
                />
              </div>
            </div>
          </div>

          {/* VIP Pass */}
          <div className="border p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">VIP Pass</h3>
              <Trash2Icon className="h-4 w-4 text-gray-400 cursor-pointer hover:text-red-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Price</label>
                <Input
                  type="number"
                  value={event.vipPassPrice}
                  onChange={(e) => handleChange("vipPassPrice", parseFloat(e.target.value))}
                  placeholder="Price"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Quantity</label>
                <Input
                  type="number"
                  value={event.vipPassQuantity}
                  onChange={(e) => handleChange("vipPassQuantity", parseInt(e.target.value))}
                  placeholder="Quantity"
                />
              </div>
            </div>
          </div>
        </div>

        {/* --- Form Section: Settings & Visibility (Partial View) --- */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-bold mb-4">Settings & Visibility</h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Event Visibility */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Visibility
              </label>
              <Select
                onValueChange={(value) => handleChange("eventVisibility", value)}
                defaultValue={event.eventVisibility}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Public">Public</SelectItem>
                  <SelectItem value="Private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Event URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event URL</label>
              <div className="flex rounded-md shadow-sm">
                <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500">
                  eventstream.com/
                </span>
                <Input
                  value={event.eventUrlSlug}
                  onChange={(e) => handleChange("eventUrlSlug", e.target.value)}
                  className="rounded-l-none"
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <Input placeholder="Add tags separated by commas (e.g. tech, innovation, future)" />
          </div>
        </div>

        {/* --- Footer/Save Button (Optional, not visible in image but good practice) --- */}
        <div className="flex justify-end pt-4">
          <Link href="/dashboard">
            <Button variant="outline" className="mr-2">
              Cancel
            </Button>
          </Link>
          <Button>Save and Continue</Button>
        </div>
      </div>
    </div>
  );
}

// NOTE: You'll need to install or ensure these Lucide icons are available: CalendarIcon, UploadCloudIcon, Trash2Icon
// `Trash2Icon` is used for the ticketing section.
// The provided `getEvent` function is assumed to be working correctly.
// I took the liberty of adding mock data for fields not present in your JSON but visible in the image (like dates, categories, ticketing).
