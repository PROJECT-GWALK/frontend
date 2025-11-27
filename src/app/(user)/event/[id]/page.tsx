"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  MapPin,
  Link as LinkIcon,
  Upload,
  Users,
  Gift,
  Plus,
  Trash2,
  ArrowLeft,
  Info,
  UserCheck,
  Award,
} from "lucide-react";
import { EventSidebar } from "@/app/(user)/event/[id]/EventSidebar";
import { getEvent, updateEvent } from "@/utils/apievent";

type SpecialReward = {
  id: string;
  name: string;
  description: string;
};

type EventDetail = {
  id: string;
  eventName: string;
  eventDescription?: string;
  bannerUrl?: string;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  locationPlace?: string;
  locationLink?: string;
  isOnline?: boolean;
  meetingLink?: string;
  visibility?: "public" | "private";

  maxPresenters?: number;
  isIndividual?: boolean;
  maxGroups?: number;
  maxPeoplePerGroup?: number;
  submissionStartDate?: string;
  submissionStartTime?: string;
  submissionEndDate?: string;
  submissionEndTime?: string;
  fileRequirement?: string;
  linkRequirement?: string;

  hasCommittee?: boolean;
  committeeCount?: number;
  committeeReward?: number;
  hasGuestRewards?: boolean;
  guestRewardAmount?: number;

  specialRewards?: SpecialReward[];
};

export default function EventEdit() {
  const params = useParams();
  const id = (params?.id as string) ?? "";
  const [activeSection, setActiveSection] = useState("event-info");

  // Event Information
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventBanner, setEventBanner] = useState<File | null>(null);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [locationPlace, setLocationPlace] = useState("");
  const [locationLink, setLocationLink] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const [meetingLink, setMeetingLink] = useState("");
  const [eventVisibility, setEventVisibility] = useState("public");

  // Presenter Details
  const [maxPresenters, setMaxPresenters] = useState("");
  const [isIndividual, setIsIndividual] = useState(true);
  const [maxGroups, setMaxGroups] = useState("");
  const [maxPeoplePerGroup, setMaxPeoplePerGroup] = useState("");
  const [submissionStartDate, setSubmissionStartDate] = useState("");
  const [submissionStartTime, setSubmissionStartTime] = useState("");
  const [submissionEndDate, setSubmissionEndDate] = useState("");
  const [submissionEndTime, setSubmissionEndTime] = useState("");
  const [fileRequirement, setFileRequirement] = useState("");
  const [linkRequirement, setLinkRequirement] = useState("");

  // Committee & Guest
  const [hasCommittee, setHasCommittee] = useState(false);
  const [committeeCount, setCommitteeCount] = useState("");
  const [committeeReward, setCommitteeReward] = useState("");
  const [hasGuestRewards, setHasGuestRewards] = useState(false);
  const [guestRewardAmount, setGuestRewardAmount] = useState("");

  // Special Rewards
  const [specialRewards, setSpecialRewards] = useState<SpecialReward[]>([
    {
      id: "1",
      name: "Best Presentation",
      description: "Awarded to the most engaging presentation",
    },
    { id: "2", name: "Innovation Award", description: "For the most innovative idea presented" },
  ]);

  const handleAddSpecialReward = () => {
    const newReward: SpecialReward = {
      id: Date.now().toString(),
      name: "",
      description: "",
    };
    setSpecialRewards([...specialRewards, newReward]);
  };

  const handleRemoveReward = (id: string) => {
    setSpecialRewards(specialRewards.filter((r) => r.id !== id));
  };

  const handleRewardChange = (id: string, field: "name" | "description", value: string) => {
    setSpecialRewards(specialRewards.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const handleSave = async () => {
    if (!id) return;

    try {
      const payload: any = {
        eventName: eventTitle,
        eventDescription,
        location: locationLink,
        locationName: locationPlace,
        publicView: eventVisibility === "public",
        startView: startDate && startTime ? `${startDate}T${startTime}` : null,
        endJoinDate: endDate && endTime ? `${endDate}T${endTime}` : null,
        maxTeamMembers: maxPresenters ? parseInt(maxPresenters) : null,
        maxTeams: !isIndividual && maxGroups ? parseInt(maxGroups) : null,
        virtualRewardGuest: hasGuestRewards && guestRewardAmount ? parseInt(guestRewardAmount) : 0,
        virtualRewardCommittee: hasCommittee && committeeReward ? parseInt(committeeReward) : 0,
        fileTypes: fileRequirement ? fileRequirement.split(",").map((f) => f.trim()) : [],
        specialRewards: specialRewards.map((r) => ({ name: r.name, description: r.description })),
        // add other fields as needed
      };

      await updateEvent(id, payload);

      // toast({
      //   title: "Event Updated",
      //   description: "Your event details have been saved successfully.",
      // });
    } catch (err: any) {
      console.error(err);
      // toast({
      //   title: "Update Failed",
      //   description: err.message || "Something went wrong while saving.",
      //   variant: "destructive",
      // });
    }
  };

  const sections = [
    { id: "event-info", label: "Event Information", icon: Info },
    { id: "presenter", label: "Presenter Details", icon: Users },
    { id: "committee", label: "Committee & Guest", icon: UserCheck },
    { id: "rewards", label: "Special Rewards", icon: Award },
  ];

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const res = await getEvent(id);
        const data = res.event;

        setEvent(data);

        // ================= EVENT INFO =================
        setEventTitle(data.eventName || "");
        setEventDescription(data.eventDescription || "");
        // For banner, store File as null for now (can be uploaded separately)
        setEventBanner(null);
        // Location
        setLocationPlace(data.locationName || "");
        setLocationLink(data.location || "");
        // Dates
        setStartDate(data.startView ? data.startView.split("T")[0] : "");
        setStartTime(data.startView ? data.startView.split("T")[1]?.slice(0, 5) : "");
        setEndDate(data.endJoinDate ? data.endJoinDate.split("T")[0] : "");
        setEndTime(data.endJoinDate ? data.endJoinDate.split("T")[1]?.slice(0, 5) : "");
        // Visibility
        setEventVisibility(data.publicView ? "public" : "private");
        // Online / Meeting
        setIsOnline(false);
        setMeetingLink("");

        // ================= PRESENTER =================
        setMaxPresenters(data.maxTeamMembers?.toString() || "");
        setIsIndividual(true);
        setMaxGroups(data.maxTeams?.toString() || "");
        setMaxPeoplePerGroup("");

        setSubmissionStartDate(data.startJoinDate ? data.startJoinDate.split("T")[0] : "");
        setSubmissionStartTime(
          data.startJoinDate ? data.startJoinDate.split("T")[1]?.slice(0, 5) : ""
        );
        setSubmissionEndDate(data.endJoinDate ? data.endJoinDate.split("T")[0] : "");
        setSubmissionEndTime(data.endJoinDate ? data.endJoinDate.split("T")[1]?.slice(0, 5) : "");
        setFileRequirement(data.fileTypes?.join(", ") || "");
        setLinkRequirement("");

        // ================= COMMITTEE & GUEST =================
        setHasCommittee(Boolean(data.hasCommittee));
        setCommitteeCount("");
        setCommitteeReward(data.virtualRewardCommittee?.toString() || "0");
        setHasGuestRewards(Boolean(data.virtualRewardGuest && data.virtualRewardGuest > 0));
        setGuestRewardAmount(data.virtualRewardGuest?.toString() || "0");

        // ================= SPECIAL REWARDS =================
        if (data.specialRewards?.length) {
          setSpecialRewards(data.specialRewards);
        } else {
          setSpecialRewards([]);
        }
      } catch (err) {
        console.error("Failed to load event:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <EventSidebar
          sections={sections}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          eventId={id}
        />

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          {!loading && event && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Link href="/dashboard">
                    <Button variant="ghost" size="icon">
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  </Link>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">Edit Event</h1>
                    <p className="text-muted-foreground">Update your event details</p>
                  </div>
                </div>
                <Button onClick={handleSave} className="px-6">
                  Save Changes
                </Button>
              </div>

              {/* Event Information Section */}
              <Card id="event-info" className="scroll-mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Info className="h-5 w-5 text-primary" />
                    Event Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="eventTitle">Event Title</Label>
                    <Input
                      id="eventTitle"
                      placeholder="Enter event title"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Event Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Tell attendees about your event..."
                      rows={4}
                      value={eventDescription}
                      onChange={(e) => setEventDescription(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Event Banner</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                      <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG, or GIF (max. 800x400px)
                      </p>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => setEventBanner(e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="startDate"
                          type="date"
                          className="pl-10"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="startTime"
                          type="time"
                          className="pl-10"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="endDate"
                          type="date"
                          className="pl-10"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="endTime"
                          type="time"
                          className="pl-10"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="locationPlace">Location / Venue</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="locationPlace"
                        placeholder="e.g. Convention Center, Hall A"
                        className="pl-10"
                        value={locationPlace}
                        onChange={(e) => setLocationPlace(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="locationLink">Location Link (Google Maps)</Label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="locationLink"
                        placeholder="https://maps.google.com/..."
                        className="pl-10"
                        value={locationLink}
                        onChange={(e) => setLocationLink(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isOnline"
                      checked={isOnline}
                      onCheckedChange={(checked) => setIsOnline(checked as boolean)}
                    />
                    <Label htmlFor="isOnline" className="cursor-pointer">
                      This is an online event
                    </Label>
                  </div>

                  {isOnline && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                      <Label htmlFor="meetingLink">Meeting Link</Label>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="meetingLink"
                          placeholder="https://meet.google.com/..."
                          className="pl-10"
                          value={meetingLink}
                          onChange={(e) => setMeetingLink(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="visibility">Event Visibility</Label>
                    <Select value={eventVisibility} onValueChange={setEventVisibility}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Presenter Details Section */}
              <Card id="presenter" className="scroll-mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-primary" />
                    Presenter Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="maxPresenters">Maximum Presenters in Event</Label>
                    <Input
                      id="maxPresenters"
                      type="number"
                      placeholder="e.g. 50"
                      value={maxPresenters}
                      onChange={(e) => setMaxPresenters(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isIndividual"
                      checked={isIndividual}
                      onCheckedChange={(checked) => setIsIndividual(checked as boolean)}
                    />
                    <Label htmlFor="isIndividual" className="cursor-pointer">
                      Individual presenters only
                    </Label>
                  </div>

                  {!isIndividual && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                      <div className="space-y-2">
                        <Label htmlFor="maxGroups">Maximum Groups</Label>
                        <Input
                          id="maxGroups"
                          type="number"
                          placeholder="e.g. 20"
                          value={maxGroups}
                          onChange={(e) => setMaxGroups(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxPeoplePerGroup">Max People per Group</Label>
                        <Input
                          id="maxPeoplePerGroup"
                          type="number"
                          placeholder="e.g. 5"
                          value={maxPeoplePerGroup}
                          onChange={(e) => setMaxPeoplePerGroup(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-6">
                    <h4 className="font-medium mb-4">Submission Period</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="subStartDate">Start Date</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="subStartDate"
                            type="date"
                            className="pl-10"
                            value={submissionStartDate}
                            onChange={(e) => setSubmissionStartDate(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subStartTime">Start Time</Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="subStartTime"
                            type="time"
                            className="pl-10"
                            value={submissionStartTime}
                            onChange={(e) => setSubmissionStartTime(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="subEndDate">End Date</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="subEndDate"
                            type="date"
                            className="pl-10"
                            value={submissionEndDate}
                            onChange={(e) => setSubmissionEndDate(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subEndTime">End Time</Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="subEndTime"
                            type="time"
                            className="pl-10"
                            value={submissionEndTime}
                            onChange={(e) => setSubmissionEndTime(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-medium mb-4">Submission Requirements</h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="fileRequirement">File Requirement</Label>
                        <Textarea
                          id="fileRequirement"
                          placeholder="e.g. PDF presentation, max 10MB, landscape orientation"
                          value={fileRequirement}
                          onChange={(e) => setFileRequirement(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="linkRequirement">Link Requirement</Label>
                        <Textarea
                          id="linkRequirement"
                          placeholder="e.g. YouTube video link, Google Drive folder"
                          value={linkRequirement}
                          onChange={(e) => setLinkRequirement(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Committee & Guest Section */}
              <Card id="committee" className="scroll-mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <UserCheck className="h-5 w-5 text-primary" />
                    Committee & Guest Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hasCommittee"
                        checked={hasCommittee}
                        onCheckedChange={(checked) => setHasCommittee(checked as boolean)}
                      />
                      <Label htmlFor="hasCommittee" className="cursor-pointer">
                        Event has committee members
                      </Label>
                    </div>

                    {hasCommittee && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-2">
                          <Label htmlFor="committeeCount">Number of Committee Members</Label>
                          <Input
                            id="committeeCount"
                            type="number"
                            placeholder="e.g. 10"
                            value={committeeCount}
                            onChange={(e) => setCommitteeCount(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="committeeReward">Virtual Rewards per Person</Label>
                          <div className="relative">
                            <Gift className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="committeeReward"
                              type="number"
                              placeholder="e.g. 100"
                              className="pl-10"
                              value={committeeReward}
                              onChange={(e) => setCommitteeReward(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-6 space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hasGuestRewards"
                        checked={hasGuestRewards}
                        onCheckedChange={(checked) => setHasGuestRewards(checked as boolean)}
                      />
                      <Label htmlFor="hasGuestRewards" className="cursor-pointer">
                        Provide virtual rewards for guests
                      </Label>
                    </div>

                    {hasGuestRewards && (
                      <div className="pl-6 animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-2 max-w-xs">
                          <Label htmlFor="guestRewardAmount">
                            Virtual Rewards Amount per Guest
                          </Label>
                          <div className="relative">
                            <Gift className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="guestRewardAmount"
                              type="number"
                              placeholder="e.g. 50"
                              className="pl-10"
                              value={guestRewardAmount}
                              onChange={(e) => setGuestRewardAmount(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Special Rewards Section */}
              <Card id="rewards" className="scroll-mt-6">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Award className="h-5 w-5 text-primary" />
                    Special Rewards
                  </CardTitle>
                  <Button onClick={handleAddSpecialReward} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Reward
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {specialRewards.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Gift className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No special rewards added yet</p>
                      <p className="text-sm">Click "Add Reward" to create one</p>
                    </div>
                  ) : (
                    specialRewards.map((reward, index) => (
                      <div key={reward.id} className="border rounded-lg p-4 space-y-4 bg-muted/30">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">
                            Reward #{index + 1}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveReward(reward.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Label>Reward Name</Label>
                          <Input
                            placeholder="e.g. Best Presentation"
                            value={reward.name}
                            onChange={(e) => handleRewardChange(reward.id, "name", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            placeholder="Describe what this reward is for..."
                            value={reward.description}
                            onChange={(e) =>
                              handleRewardChange(reward.id, "description", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Save Button (Mobile) */}
              <div className="lg:hidden">
                <Button onClick={handleSave} className="w-full">
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
