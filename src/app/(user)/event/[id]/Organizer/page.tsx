"use client";


import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Gift,
  Upload,
  Trash2,
  Plus,
  Building,
  EyeOff,
  Eye,
  AlertCircle,
  Trophy,
  Coins,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import {
  setEventPublicView,
  updateEvent,
  createSpecialReward,
  updateSpecialReward,
  deleteSpecialReward,
  getEvent,
  getTeams,
  deleteTeam,
} from "@/utils/apievent";
import ImageCropDialog from "@/lib/image-crop-dialog";
import { toast } from "sonner";
import InformationSection from "../components/InformationSection";
import type { EventData, EventEditSection, SpecialRewardEdit, EventFormState, Team } from "@/utils/types";
import type { PresenterProject } from "../Presenter/components/types";
import ParticipantsSection from "./ParticipantsSection";
import UnifiedProjectList from "../components/UnifiedProjectList";
import { toLocalDatetimeValue, toISOStringFromLocal } from "@/utils/function";
import { useLanguage } from "@/contexts/LanguageContext";
import { Checkbox } from "@/components/ui/checkbox";
import ResultSection from "../components/ResultSection";
import FeedbackList from "./components/FeedbackList";

type Props = {
  id: string;
  event: EventData;
};

export default function OrganizerView({ id, event }: Props) {
  const { timeFormat } = useLanguage();
  const [tab, setTab] = useState<"dashboard" | "information" | "Participants" | "project" | "result">("dashboard");
  const [updatingPublic, setUpdatingPublic] = useState(false);
  const [localEvent, setLocalEvent] = useState<EventData>(event);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<EventEditSection | null>(null);
  const [form, setForm] = useState<EventFormState>({});
  const [showCommitteeInput, setShowCommitteeInput] = useState(false);
  const [saving, setSaving] = useState(false);
  const {t} = useLanguage();

  // Special rewards editing state
  const [srList, setSrList] = useState<SpecialRewardEdit[]>([]);
  const [srPreviews, setSrPreviews] = useState<Record<string, string | null>>({});
  const rewardFileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [srCropOpen, setSrCropOpen] = useState(false);
  const [srCropSrc, setSrCropSrc] = useState<string | null>(null);
  const [srPendingMeta, setSrPendingMeta] = useState<{
    id: string;
    name: string;
    type: string;
  } | null>(null);
  const [removedRewardIds, setRemovedRewardIds] = useState<string[]>([]);
  const [rewardErrors, setRewardErrors] = useState<Record<string, string>>({});
  
  // Banner editing state
  const [bannerCropOpen, setBannerCropOpen] = useState(false);
  const [bannerCropSrc, setBannerCropSrc] = useState<string | null>(null);
  const [bannerPendingMeta, setBannerPendingMeta] = useState<{name: string, type: string} | null>(null);
  const [bannerPendingFile, setBannerPendingFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [removeBanner, setRemoveBanner] = useState(false);

  const [projects, setProjects] = useState<PresenterProject[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [projectsLoading, setProjectsLoading] = useState(false);

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerPendingMeta({ name: file.name, type: file.type });
    const reader = new FileReader();
    reader.onload = () => {
      setBannerCropSrc(reader.result as string);
      setBannerCropOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = ""; // reset
  };

  const handleDeleteTeam = async (projectId: string) => {
    try {
      await deleteTeam(id, projectId);
      toast.success("ลบทีมเรียบร้อยแล้ว");
      fetchTeamsData();
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการลบทีม");
    }
  };

  const fetchTeamsData = async () => {
    setProjectsLoading(true);
    try {
      const res = await getTeams(id);
      if (res.message === "ok") {
        const teams = res.teams as Team[];
        const mappedProjects: PresenterProject[] = teams.map((t) => ({
          id: t.id,
          title: t.teamName,
          desc: t.description || "",
          img: t.imageCover || "/banner.png",
          videoLink: t.videoLink,
          files:
            t.files?.map((f) => ({
              name: f.fileUrl.split("/").pop() || "File",
              url: f.fileUrl,
              fileTypeId: f.fileTypeId,
            })) || [],
          members:
            t.participants?.map((p) => p.user?.name || "Unknown") || [],
          createdAt: t.createdAt,
          totalVr: t.totalVr,
        }));
        setProjects(mappedProjects);
      }
    } catch (error) {
      console.error("Failed to fetch teams:", error);
    } finally {
      setProjectsLoading(false);
    }
  };

  useEffect(() => {
    if (event) {
      setLocalEvent(event);
    }
  }, [event]);

  useEffect(() => {
    fetchTeamsData();
  }, [id]);

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full">
        <div
          className="relative w-full aspect-video md:aspect-2/1 md:h-100 overflow-hidden cursor-zoom-in"
          onClick={() => setBannerOpen(true)}
        >
          {localEvent?.imageCover ? (
            <Image
              src={localEvent.imageCover}
              alt={localEvent.eventName || "Event banner"}
              fill
              sizes="100vw"
              className="object-cover rounded-xl"
            />
          ) : (
            <Image
              src="/banner.png"
              alt="Default banner"
              fill
              sizes="100vw"
              className="object-cover rounded-xl"
            />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-background/60 to-transparent pointer-events-none" />
        </div>
        <Dialog open={bannerOpen} onOpenChange={setBannerOpen}>
          <DialogContent
            showCloseButton={false}
            className="sm:max-w-3xl md:max-w-5xl bg-transparent border-none p-0"
            aria-label="Event banner"
          >
            <DialogTitle className="sr-only">Event banner</DialogTitle>
            <Image
              src={localEvent?.imageCover || "/banner.png"}
              alt={localEvent.eventName || "Event banner"}
              width={800}
              height={400}
              className="w-full h-auto rounded-xl"
            />
            <DialogClose
              aria-label="Close banner"
              className="absolute top-3 right-3 z-50 rounded-full bg-black/60 text-white hover:bg-black/80 p-2 shadow"
            >
              <X className="h-4 w-4" />
            </DialogClose>
          </DialogContent>
        </Dialog>
        <div className="max-w-6xl mx-auto px-6 lg:px-8 mt-6">
          <div 
            className="bg-card rounded-xl shadow-sm border p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 transition-all hover:shadow-md relative overflow-hidden"
            style={{ borderLeft: "6px solid var(--role-organizer)" }}
          >
            <div 
              className="absolute inset-0 pointer-events-none" 
              style={{ background: "linear-gradient(to right, var(--role-organizer), transparent)", opacity: 0.05 }} 
            />
            {/* LEFT SIDE: Title & Status */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 
                  className="text-2xl lg:text-3xl font-bold tracking-tight"
                  style={{ color: "var(--role-organizer)" }}
                >
                  {localEvent?.eventName || "Event"}
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-600 mr-1.5"></span>
                  เผยแพร่แล้ว
                </span>
              </div>
            </div>

            {/* RIGHT SIDE: Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Visibility Toggle Button */}
              <Button
                variant={localEvent?.publicView ? "outline" : "default"} // Changed logic: Solid when action is needed (to publish), Outline when already public
                onClick={async () => {
                  if (!id) return;
                  setUpdatingPublic(true);
                  try {
                    const res = await setEventPublicView(id, !localEvent?.publicView);
                    if (res?.event)
                      setLocalEvent(
                        (prev) =>
                          ({
                            ...(prev || {}),
                            publicView: res.event.publicView,
                          } as EventData)
                      );
                  } catch {
                  } finally {
                    setUpdatingPublic(false);
                  }
                }}
                disabled={updatingPublic}
                className={`h-10 px-6 font-medium ${
                  localEvent?.publicView
                    ? "border-dashed border-gray-300 text-gray-600 hover:bg-gray-50"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {localEvent?.publicView ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    ซ่อนจากสาธารณะ
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    เปิดให้สาธารณะเห็น
                  </>
                )}
              </Button>

              {/* Organizer Label - Styled to match Button height/shape exactly */}
              <div className="h-10 inline-flex items-center justify-center gap-2 px-5 rounded-lg bg-(--role-organizer) text-white font-medium shadow-sm select-none">
                <Building className="h-4 w-4" />
                <span>Organizer</span>
              </div>
            </div>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mt-6">
            <TabsList className="w-full flex flex-wrap h-auto p-1 justify-start gap-1 bg-muted/50">
              <TabsTrigger value="dashboard" className="flex-1 min-w-25">Dashboard</TabsTrigger>
              <TabsTrigger value="information" className="flex-1 min-w-25">Information</TabsTrigger>
              <TabsTrigger value="Participants" className="flex-1 min-w-25">Participants</TabsTrigger>
              <TabsTrigger value="project" className="flex-1 min-w-25">Project</TabsTrigger>
              <TabsTrigger value="result" className="flex-1 min-w-25">Result</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6 mt-6">
              {/* SECTION 1: PEOPLE & PARTICIPATION */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Participants - Highlighted Card */}
                <Card className="col-span-1 md:col-span-2 lg:col-span-1 border-l-4 border-l-blue-600 shadow-sm hover:shadow-md transition-all">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                      {t("dashboard.totalParticipants")}
                      <Users className="h-4 w-4 text-blue-600" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-blue-700">
                      {(localEvent?.presentersCount ?? 0) +
                        (localEvent?.guestsCount ?? 0) +
                        (localEvent?.committeeCount ?? 0)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{t("organizerDashboard.totalPeopleInEvent")}</p>
                  </CardContent>
                </Card>

                {/* Breakdown Cards - Compact Design */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {t("dashboard.teamCount")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {localEvent?.presenterTeams ?? 0}
                      <span className="text-sm font-normal text-muted-foreground ml-2">{t("organizerDashboard.team")}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {t("organizerDashboard.outOfTotalTeams")} {localEvent?.maxTeams ?? 0} {t("organizerDashboard.team")}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {t("organizerDashboard.guests")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{localEvent?.guestsCount ?? 0}</div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {t("organizerDashboard.comments")}: {localEvent?.participantsCommentCount ?? 0}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {t("organizerDashboard.committee")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{localEvent?.committeeCount ?? 0}</div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {t("organizerDashboard.feedback")}: {localEvent?.opinionsCommittee ?? 0}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* SECTION 2: REWARDS & GAMIFICATION */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Virtual Rewards - Progress Bar Visualization */}
                <Card className="lg:col-span-1 border-t-4 border-t-amber-500 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-700">
                      <Coins className="h-5 w-5" /> Virtual Rewards
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-3xl font-bold text-amber-600">
                        {localEvent?.vrUsed?.toLocaleString(timeFormat) ?? "0"}
                      </span>
                      <span className="text-sm text-muted-foreground mb-1">
                        / {localEvent?.vrTotal?.toLocaleString(timeFormat) ?? "0"} {localEvent?.unitReward ?? "coins"}
                      </span>
                    </div>

                    {/* Custom Progress Bar */}
                    <div className="h-2 w-full bg-amber-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            localEvent?.vrTotal && localEvent.vrTotal > 0 
                            ? ((localEvent?.vrUsed ?? 0) / localEvent.vrTotal) * 100 
                            : 0
                          }%`,
                        }}
                      />
                    </div>

                    <div className="text-xs text-muted-foreground pt-1 flex justify-between">
                      <span>
                        {t("organizerDashboard.used")}{" "}
                        {localEvent?.vrUsed && localEvent?.vrTotal && localEvent.vrTotal > 0
                          ? Math.round((localEvent.vrUsed / localEvent.vrTotal) * 100)
                          : 0}
                        %
                      </span>
                      <span>
                        {t("organizerDashboard.remaining")} {(localEvent?.vrTotal ?? 0) - (localEvent?.vrUsed ?? 0)} {localEvent?.unitReward ?? "coins"}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Special Prizes - Voting Status */}
                <Card className="lg:col-span-1 border-t-4 border-t-purple-500 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-700">
                      <Trophy className="h-5 w-5" /> {t("organizerDashboard.votingProgress")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Stats Row */}
                    <div className="flex justify-between items-end">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-purple-700">
                           {localEvent?.specialPrizeUsed ?? 0}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          / {(localEvent?.committeeCount ?? 0) * (localEvent?.specialPrizeCount ?? 0)} {t("organizerDashboard.totalVotes")}
                        </span>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                     <div className="h-2 w-full bg-purple-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            ((localEvent?.committeeCount ?? 0) * (localEvent?.specialPrizeCount ?? 0)) > 0 
                            ? ((localEvent?.specialPrizeUsed ?? 0) / ((localEvent?.committeeCount ?? 0) * (localEvent?.specialPrizeCount ?? 0))) * 100 
                            : 0
                          }%`,
                        }}
                      />
                    </div>

                    {/* Available Awards List */}
                    <div className="pt-2">
                      <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                        <Gift className="h-3 w-3" /> {t("organizerDashboard.availableAwards")}
                      </p>
                      <div className="space-y-3">
                        {localEvent?.specialRewards && localEvent.specialRewards.length > 0 ? (
                          localEvent.specialRewards.map((reward, i) => (
                            <div key={reward.id || i} className="flex items-start gap-3 p-3 bg-purple-50/50 rounded-lg border border-purple-100">
                              {/* Badge Image */}
                              <div className="relative w-10 h-10 shrink-0 rounded-md overflow-hidden bg-white border shadow-sm">
                                {reward.image ? (
                                  <Image src={reward.image} alt={reward.name} fill className="object-cover" />
                                ) : (
                                  <div className="flex items-center justify-center w-full h-full text-purple-300">
                                    <Trophy className="w-5 h-5" />
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                  <span className="text-sm font-semibold text-purple-900 truncate block pr-2">{reward.name}</span>
                                  <span className="text-xs font-medium text-purple-600 shrink-0 bg-white px-2 py-0.5 rounded-full border border-purple-100 shadow-sm">
                                    {reward.voteCount ?? 0} votes
                                  </span>
                                </div>
                                
                                {/* Mini Progress Bar */}
                                <div className="h-1.5 w-full bg-purple-200 rounded-full overflow-hidden mb-1.5">
                                  <div 
                                    className="h-full bg-purple-500 rounded-full transition-all duration-500" 
                                    style={{ width: `${localEvent?.committeeCount && localEvent.committeeCount > 0 ? Math.min(100, ((reward.voteCount ?? 0) / localEvent.committeeCount) * 100) : 0}%` }}
                                  />
                                </div>
                                
                                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                  <span>
                                     Committees: {reward.voteCount ?? 0}/{localEvent?.committeeCount ?? 0}
                                  </span>
                                  <span>
                                     Candidates: {reward.teamCount ?? 0} teams
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                           <span className="text-xs text-muted-foreground italic">No special awards configured</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* SECTION 3: ENGAGEMENT & OPINIONS */}
              <Card className="bg-slate-50 border-slate-200">
                <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-full shadow-sm border">
                      <MessageSquare className="h-8 w-8 text-slate-700" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{t("organizerDashboard.totalFeedbackReceived")}</h3>
                      <p className="text-muted-foreground text-sm">
                        {t("organizerDashboard.feedbackSummary")}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-8 text-center">
                    <div>
                      <div className="text-3xl font-bold text-slate-800">
                        {localEvent?.opinionsGot ?? 0}
                      </div>
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {t("organizerDashboard.total")}
                      </div>
                    </div>
                    <div className="h-10 w-px bg-slate-300"></div> {/* Divider */}
                    <div className="grid grid-cols-3 gap-6 text-left">
                      <div>
                        <div className="text-xl font-bold text-slate-700">
                          {localEvent?.opinionsGuest ?? 0}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{t("organizerDashboard.guests")}</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-slate-700">
                          {localEvent?.opinionsCommittee ?? 0}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{t("organizerDashboard.committee")}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="information">
              <InformationSection
                id={id}
                event={localEvent}
                editable
                onEdit={(section, initialForm) => {
                  setEditingSection(section);
                  const formState = initialForm as EventFormState;
                  setForm(formState);
                  if (section === "description") {
                    setBannerPreview(localEvent.imageCover || null);
                    setBannerPendingFile(null);
                    setRemoveBanner(false);
                  }
                  if (section === "guest") {
                    const showCommittee =
                      typeof formState.hasCommittee === "boolean"
                        ? formState.hasCommittee
                        : Number(formState.committeeReward ?? 0) > 0;
                    setShowCommitteeInput(showCommittee);
                  }
                }}
                linkLabel="Google Map Link of location"
              />
            </TabsContent>

            <TabsContent value="project">
              <div className="mt-6 space-y-6">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <h2 className="text-lg font-semibold">Projects</h2>
                  <Input
                    placeholder="Search projects by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <UnifiedProjectList
                  projects={projects}
                  role="ORGANIZER"
                  eventId={id}
                  searchQuery={searchQuery}
                  loading={projectsLoading}
                  onDeleteTeam={handleDeleteTeam}
                  onPostComment={(_projectId, _text) => {
                    toast.success("ส่งความคิดเห็นเรียบร้อย");
                  }}
                  onRefresh={fetchTeamsData}
                  unitReward={localEvent?.unitReward ?? "coins"}
                />
              </div>
            </TabsContent>

            <TabsContent value="Participants">
              <ParticipantsSection
                id={id}
                hasCommittee={localEvent?.hasCommittee}
                unitReward={localEvent?.unitReward}
                onRefreshCounts={(list) => {
                  setLocalEvent((prev) => ({
                    ...prev,
                    presentersCount: list.filter((p) => p.eventGroup === "PRESENTER").length,
                    guestsCount: list.filter((p) => p.eventGroup === "GUEST").length,
                    committeeCount: list.filter((p) => p.eventGroup === "COMMITTEE").length,
                  }));
                }}
              />
            </TabsContent>

            <TabsContent value="result">
              <ResultSection eventId={id} role="ORGANIZER" />
            </TabsContent>
          </Tabs>

          {/* Feedback Section - Only visible when event is finished */}
          {localEvent?.endView && new Date() > new Date(localEvent.endView) && (
            <FeedbackList eventId={id} />
          )}
        </div>
        {/* Edit Dialog */}
        <Dialog
          open={Boolean(editingSection)}
          onOpenChange={(o) => {
            if (!o) {
              setEditingSection(null);
              setSrCropOpen(false);
              if (srCropSrc && srCropSrc.startsWith("blob:")) URL.revokeObjectURL(srCropSrc);
              setSrCropSrc(null);
              setSrPendingMeta(null);
            }
          }}
        >
          <DialogContent className="max-w-lg">
            <DialogTitle>แก้ไขข้อมูล</DialogTitle>
            <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto pr-2">
              {editingSection === "location" && (
                <div className="grid grid-cols-1 gap-2">
                  <Label>Location Name</Label>
                  <Input
                    value={form.locationName || ""}
                    onChange={(e) => setForm((f) => ({ ...f, locationName: e.target.value }))}
                  />
                  <Label>Location Link</Label>
                  <Input
                    value={form.location || ""}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  />
                </div>
              )}

              {editingSection === "time" && (
                <div className="grid grid-cols-1 gap-2">
                  <Label>Start Time</Label>
                  <Input
                    type="datetime-local"
                    value={form.startView ? toLocalDatetimeValue(form.startView) : ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        startView: toISOStringFromLocal(e.target.value),
                      }))
                    }
                  />
                  <Label>End Time</Label>
                  <Input
                    type="datetime-local"
                    value={form.endView ? toLocalDatetimeValue(form.endView) : ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        endView: toISOStringFromLocal(e.target.value),
                      }))
                    }
                  />
                </div>
              )}

              {editingSection === "description" && (
                <div className="grid grid-cols-1 gap-2">
                  <div className="space-y-2 mb-4">
                     <Label>Event Banner</Label>
                     <ImageCropDialog
                       open={bannerCropOpen}
                       src={bannerCropSrc}
                       fileName={bannerPendingMeta?.name}
                       fileType={bannerPendingMeta?.type}
                       aspect={2}
                       title="Crop Banner (800x400)"
                       outputWidth={800}
                       outputHeight={400}
                       onOpenChange={(o) => {
                         if (!o) {
                           setBannerCropOpen(false);
                           setBannerCropSrc(null);
                           setBannerPendingMeta(null);
                         }
                       }}
                       onCancel={() => {
                         setBannerCropOpen(false);
                         setBannerCropSrc(null);
                         setBannerPendingMeta(null);
                       }}
                       onConfirm={(file, previewUrl) => {
                         setBannerCropOpen(false);
                         setBannerPreview(previewUrl);
                         setBannerPendingFile(file);
                         setRemoveBanner(false);
                       }}
                     />
                     
                     {bannerPreview ? (
                        <div className="relative border rounded-lg overflow-hidden aspect-2/1 bg-muted shadow-sm group">
                          <Image
                            src={bannerPreview}
                            alt="Event banner"
                            fill
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                          <div className="absolute top-2 right-2 flex gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => bannerInputRef.current?.click()}
                            >
                              Change
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setBannerPreview(null);
                                setBannerPendingFile(null);
                                setRemoveBanner(true);
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                     ) : (
                        <div
                          className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer aspect-2/1 flex flex-col items-center justify-center bg-muted/30"
                          onClick={() => bannerInputRef.current?.click()}
                        >
                          <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Click to upload banner</p>
                        </div>
                     )}
                     <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        ref={bannerInputRef}
                        onChange={handleBannerFileChange}
                     />
                  </div>
                  <Label>Description</Label>
                  <Textarea
                    value={form.eventDescription || ""}
                    onChange={(e) => setForm((f) => ({ ...f, eventDescription: e.target.value }))}
                  />
                </div>
              )}

              {editingSection === "guest" && (
                <div className="grid grid-cols-1 gap-2">
                  <Label>Guest Reward per person</Label>
                  <Input
                    type="number"
                    value={form.guestReward ?? 0}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, guestReward: Number(e.target.value) }))
                    }
                  />
                  
                  <div className="flex items-center space-x-2 my-2">
                    <Checkbox
                      id="hasCommittee"
                      checked={showCommitteeInput}
                      onCheckedChange={(checked) => {
                        const isChecked = checked === true;
                        setShowCommitteeInput(isChecked);
                        if (!isChecked) {
                          setForm((f) => ({ ...f, committeeReward: 0 }));
                        } else if ((form.committeeReward ?? 0) === 0) {
                          setForm((f) => ({ ...f, committeeReward: 1000 })); // Default value
                        }
                      }}
                    />
                    <Label
                      htmlFor="hasCommittee"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      มีกรรมการตัดสิน / Have Committee
                    </Label>
                  </div>

                  {showCommitteeInput && (
                    <>
                      <Label>Committee Reward per person</Label>
                      <Input
                        type="number"
                        value={form.committeeReward ?? 0}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            committeeReward: Number(e.target.value),
                          }))
                        }
                      />
                    </>
                  )}

                  <Label>Reward Unit (e.g. coins, points)</Label>
                  <Input
                    type="text"
                    value={form.unitReward ?? "coins"}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, unitReward: e.target.value }))
                    }
                  />
                </div>
              )}

              {editingSection === "rewards" && (
                <div className="space-y-4">
                  <ImageCropDialog
                    open={srCropOpen}
                    src={srCropSrc}
                    fileName={srPendingMeta?.name}
                    fileType={srPendingMeta?.type}
                    aspect={1}
                    title="Crop reward image"
                    outputWidth={512}
                    outputHeight={512}
                    onOpenChange={(o) => {
                      if (!o) {
                        setSrCropOpen(false);
                        setSrPendingMeta(null);
                        if (srCropSrc && srCropSrc.startsWith("blob:")) {
                          URL.revokeObjectURL(srCropSrc);
                        }
                        setSrCropSrc(null);
                      }
                    }}
                    onCancel={() => {
                      setSrCropOpen(false);
                      setSrPendingMeta(null);
                      if (srCropSrc && srCropSrc.startsWith("blob:")) {
                        URL.revokeObjectURL(srCropSrc);
                      }
                      setSrCropSrc(null);
                    }}
                    onConfirm={(file, previewUrl) => {
                      if (!srPendingMeta) return;
                      setSrList((prev) =>
                        prev.map((r) =>
                          r.id === srPendingMeta.id
                            ? { ...r, pendingFile: file, preview: previewUrl }
                            : r
                        )
                      );
                      setSrPreviews((p) => ({ ...p, [srPendingMeta.id]: previewUrl }));
                      if (srCropSrc && srCropSrc.startsWith("blob:"))
                        URL.revokeObjectURL(srCropSrc);
                      setSrCropOpen(false);
                      setSrPendingMeta(null);
                      setSrCropSrc(null);
                    }}
                  />

                  <div className="flex items-center justify-between">
                    <Label>Special Rewards</Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const id = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
                        setSrList((s) => [
                          ...s,
                          {
                            id,
                            name: "",
                            description: "",
                            image: null,
                            pendingFile: undefined,
                            preview: null,
                          },
                        ]);
                        setTimeout(() => {
                          rewardFileRefs.current[id] = null;
                        }, 0);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Reward / เพิ่มรางวัล
                    </Button>
                  </div>

                  {srList.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Gift className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No special rewards added yet / ยังไม่มีรางวัลพิเศษ</p>
                    </div>
                  ) : (
                    srList.map((reward, index) => (
                      <div key={reward.id} className="border rounded-lg p-4 space-y-4 bg-muted/30">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">
                            Reward #{index + 1}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => {
                              if (!String(reward.id).startsWith("temp-")) {
                                setRemovedRewardIds((r) => [...r, reward.id]);
                              }
                              setSrList((list) => list.filter((x) => x.id !== reward.id));
                              setSrPreviews((p) => {
                                const np = { ...p };
                                delete np[reward.id];
                                return np;
                              });
                              if (
                                reward.preview &&
                                typeof reward.preview === "string" &&
                                reward.preview.startsWith("blob:")
                              )
                                URL.revokeObjectURL(reward.preview);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex items-start gap-4">
                          <div className="w-24 sm:w-32">
                            {srPreviews[reward.id] ? (
                              <>
                                <div className="relative border rounded-lg overflow-hidden aspect-square bg-muted w-full">
                                  <Image
                                    src={srPreviews[reward.id] as string}
                                    alt="Reward image preview"
                                    fill
                                    className="absolute inset-0 h-full w-full object-cover"
                                  />
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    ref={(el) => {
                                      rewardFileRefs.current[reward.id] = el;
                                      if (el) {
                                        el.onchange = (e: Event) => {
                                          const target = e.target as HTMLInputElement;
                                          const f = target.files?.[0];
                                          if (!f) return;
                                          const url = URL.createObjectURL(f);
                                          setSrCropSrc(url);
                                          setSrPendingMeta({
                                            id: reward.id,
                                            name: f.name,
                                            type: f.type,
                                          });
                                          setSrCropOpen(true);
                                        };
                                      }
                                    }}
                                  />
                                </div>
                                <div className="mt-2 flex items-center justify-center gap-2">
                                  <Button
                                    size="icon"
                                    variant="secondary"
                                    aria-label="Change image"
                                    title="Change"
                                    onClick={() => rewardFileRefs.current[reward.id]?.click()}
                                  >
                                    <Upload className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="destructive"
                                    aria-label="Remove image"
                                    title="Remove"
                                    onClick={() => {
                                      setSrList((prev) =>
                                        prev.map((r) =>
                                          r.id === reward.id
                                            ? {
                                                ...r,
                                                pendingFile: undefined,
                                                preview: null,
                                                removeImage: !!r.image,
                                              }
                                            : r
                                        )
                                      );
                                      setSrPreviews((p) => {
                                        const np = { ...p };
                                        delete np[reward.id];
                                        return np;
                                      });
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <>
                                <div
                                  className="relative w-full cursor-pointer"
                                  onClick={() => rewardFileRefs.current[reward.id]?.click()}
                                >
                                  <div className="border-2 border-dashed border-border rounded-lg hover:border-primary/50 transition-colors aspect-square overflow-hidden">
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3 sm:p-6">
                                      <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground mb-2" />
                                      <p className="text-[10px] sm:text-sm text-muted-foreground hidden sm:block">
                                        Click to upload or drag and drop
                                      </p>
                                      <p className="text-[9px] sm:text-xs text-muted-foreground mt-1 hidden sm:block">
                                        PNG, JPG, GIF
                                      </p>
                                    </div>
                                    <input
                                      type="file"
                                      className="hidden"
                                      accept="image/*"
                                      ref={(el) => {
                                        rewardFileRefs.current[reward.id] = el;
                                        if (el) {
                                          el.onchange = (e: Event) => {
                                            const target = e.target as HTMLInputElement;
                                            const f = target.files?.[0];
                                            if (!f) return;
                                            const url = URL.createObjectURL(f);
                                            setSrCropSrc(url);
                                            setSrPendingMeta({
                                              id: reward.id,
                                              name: f.name,
                                              type: f.type,
                                            });
                                            setSrCropOpen(true);
                                          };
                                        }
                                      }}
                                    />
                                  </div>
                                </div>
                                <div className="mt-2 flex items-center justify-center">
                                  <Button
                                    size="icon"
                                    variant="secondary"
                                    aria-label="Upload image"
                                    title="Upload"
                                    onClick={() => rewardFileRefs.current[reward.id]?.click()}
                                  >
                                    <Upload className="h-4 w-4" />
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                          <div className="flex-1 space-y-3">
                            <div className="space-y-2">
                              <Label>Reward Name / ชื่อรางวัล</Label>
                              <Input
                                placeholder="e.g. Best Presentation"
                                value={reward.name}
                                onChange={(e) =>
                                  setSrList((prev) =>
                                    prev.map((r) =>
                                      r.id === reward.id
                                        ? {
                                            ...r,
                                            name: e.target.value,
                                            _dirty: !String(r.id).startsWith("temp-")
                                              ? true
                                              : r._dirty,
                                          }
                                        : r
                                    )
                                  )
                                }
                              />
                              {rewardErrors && rewardErrors[reward.id] && (
                                <p className="text-xs text-destructive mt-1">
                                  {rewardErrors[reward.id]}
                                </p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label>Description / รายละเอียด</Label>
                              <Textarea
                                placeholder="Describe what this reward is for..."
                                value={reward.description ?? ""}
                                onChange={(e) =>
                                  setSrList((prev) =>
                                    prev.map((r) =>
                                      r.id === reward.id
                                        ? {
                                            ...r,
                                            description: e.target.value,
                                            _dirty: !String(r.id).startsWith("temp-")
                                              ? true
                                              : r._dirty,
                                          }
                                        : r
                                    )
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              <div className="flex justify-end items-center gap-2">
                <Button variant="secondary" onClick={() => setEditingSection(null)}>
                  ยกเลิก
                </Button>
                <Button
                  onClick={async () => {
                    if (!id) return;
                    setSaving(true);
                    try {
                      const payload: Partial<EventData> = {};
                      if (editingSection === "location") {
                        payload.locationName = form.locationName;
                        payload.location = form.location;
                      } else if (editingSection === "time") {
                        payload.startView = form.startView;
                        payload.endView = form.endView;
                      } else if (editingSection === "description") {
                        if (bannerPendingFile || removeBanner) {
                          const fd = new FormData();
                          fd.append("eventDescription", form.eventDescription || "");
                          if (bannerPendingFile) {
                            fd.append("file", bannerPendingFile);
                          }
                          await updateEvent(id, fd, { removeImage: removeBanner });

                          const fresh = await getEvent(id);
                          if (fresh.message === "ok") {
                            setLocalEvent(
                              (prev) =>
                                ({ ...(prev || {}), ...(fresh.event || {}) } as EventData)
                            );
                          }
                          toast.success("Updated");
                          setEditingSection(null);
                          setSaving(false);
                          return;
                        }
                        payload.eventDescription = form.eventDescription;
                      } else if (editingSection === "guest") {
                        payload.virtualRewardGuest = Number(form.guestReward ?? 0);
                        payload.virtualRewardCommittee = Number(form.committeeReward ?? 0);
                        payload.hasCommittee = showCommitteeInput;
                        payload.unitReward = form.unitReward;
                      } else if (editingSection === "rewards") {
                        // handle create / update / delete of special rewards
                        try {
                          // client-side validation
                          const errs: Record<string, string> = {};
                          srList.forEach((r) => {
                            if (!r.name || !String(r.name).trim()) errs[r.id] = "Name is required";
                          });
                          if (Object.keys(errs).length) {
                            setRewardErrors(errs);
                            toast.error("Please fix reward errors");
                            setSaving(false);
                            return;
                          }

                          // delete removed rewards (server-side ids only)
                          for (const rid of removedRewardIds) {
                            if (!String(rid).startsWith("temp-")) {
                              await deleteSpecialReward(id, rid);
                            }
                          }

                          // create new and update existing
                          for (const r of srList) {
                            if (String(r.id).startsWith("temp-")) {
                              // new
                              if (r.pendingFile) {
                                const fd = new FormData();
                                fd.append("name", r.name || "");
                                fd.append("description", r.description || "");
                                fd.append("image", r.pendingFile);
                                await createSpecialReward(id, fd);
                              } else {
                                await createSpecialReward(id, {
                                  name: r.name || "",
                                  description: r.description || "",
                                });
                              }
                            } else {
                              // existing - update if needed
                              if (r.pendingFile || r.removeImage || r._dirty) {
                                if (r.pendingFile) {
                                  const fd = new FormData();
                                  fd.append("name", r.name || "");
                                  fd.append("description", r.description || "");
                                  fd.append("image", r.pendingFile);
                                  await updateSpecialReward(id, r.id, fd);
                                } else {
                                  const up: { name: string; description: string; image?: null } = {
                                    name: r.name || "",
                                    description: r.description || "",
                                  };
                                  if (r.removeImage) up.image = null;
                                  await updateSpecialReward(id, r.id, up);
                                }
                              }
                            }
                          }

                          // Refresh event from server to get canonical state
                          try {
                            const fresh = await getEvent(id);
                            if (fresh.message === "ok") {
                              setLocalEvent(
                                (prev) =>
                                  ({ ...(prev || {}), ...(fresh.event || {}) } as EventData)
                              );
                            }
                          } catch (e) {
                            // ignore refresh errors
                            console.error("Failed to refresh event after rewards update", e);
                          }

                          toast.success("Updated");
                          setEditingSection(null);
                        } catch (e) {
                          console.error(e);
                          toast.error((e as Error)?.message || "Failed to save rewards");
                        } finally {
                          setSaving(false);
                        }
                        return;
                      }

                      await updateEvent(id, payload);
                      // optimistic update
                      setLocalEvent(
                        (prev) => ({ ...(prev || {}), ...payload } as EventData)
                      );
                      toast.success("Updated");
                      setEditingSection(null);
                    } catch (e) {
                      console.error(e);
                      toast.error((e as Error)?.message || "Update failed");
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving}
                >
                  บันทึก
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      
      </div>
    </div>
  );
}
