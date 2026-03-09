"use client";

import { useCallback, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getTeams, deleteTeam } from "@/utils/apievent";
import { toast } from "sonner";
import InformationSection from "../components/InformationSection";
import type { EventData, EventEditSection, EventFormState, Team } from "@/utils/types";
import type { PresenterProject } from "../Presenter/components/types";
import ParticipantsSection from "./components/ParticipantsSection";
import UnifiedProjectList from "../components/UnifiedProjectList";
import { useLanguage } from "@/contexts/LanguageContext";
import ResultSection from "../components/ResultSection";
import FeedbackList from "./components/FeedbackList";
import { getEvaluationCriteria } from "@/utils/apievaluation";
import OrganizerHeader from "./components/OrganizerHeader";
import OrganizerBanner from "./components/OrganizerBanner";
import OrganizerDashboard from "./components/OrganizerDashboard";
import OrganizerEditDialog from "./components/OrganizerEditDialog";
import EvaluationCriteriaForm from "./components/EvaluationCriteriaForm";
import GradingDashboard from "./components/GradingDashboard";

type Props = {
  id: string;
  event: EventData;
};

export function OrganizerView({ id, event }: Props) {
  const searchParams = useSearchParams();
  const resolveTab = (value: string | null) => {
    const allowed = [
      "dashboard",
      "information",
      "Participants",
      "project",
      "result",
      "grading",
    ] as const;
    return allowed.includes(value as (typeof allowed)[number])
      ? (value as (typeof allowed)[number])
      : null;
  };
  const [tab, setTab] = useState<
    "dashboard" | "information" | "Participants" | "project" | "result" | "grading"
  >(() => {
    if (typeof window === "undefined") return "dashboard";
    const fromQuery = resolveTab(searchParams?.get("tab") ?? null);
    const fromStorage = resolveTab(sessionStorage.getItem(`eventTab:${id}`));
    return fromQuery || fromStorage || "dashboard";
  });
  const [localEvent, setLocalEvent] = useState<EventData>(event);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<EventEditSection | null>(null);
  const [form, setForm] = useState<EventFormState>({});

  const [projects, setProjects] = useState<PresenterProject[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [evaluationCriteria, setEvaluationCriteria] = useState<
    {
      id?: string;
      name: string;
      description?: string;
      maxScore: number;
      weightPercentage: number;
      sortOrder?: number;
    }[]
  >([]);
  const [gradingRefreshTrigger, setGradingRefreshTrigger] = useState(0);

  const { t } = useLanguage();
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`eventTab:${id}`, tab);
    }
  }, [id, tab]);

  const handleDeleteTeam = async (projectId: string) => {
    try {
      await deleteTeam(id, projectId);
      toast.success(t("toast.teamDeleted"));
      fetchTeamsData();
    } catch (error) {
      console.error(error);
      toast.error(t("toast.teamDeleteFailed"));
    }
  };

  const fetchTeamsData = useCallback(async () => {
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
          members: t.participants?.map((p) => p.user?.name || "Unknown") || [],
          memberUserIds: t.participants?.map((p) => p.userId) || [],
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
  }, [id]);

  useEffect(() => {
    if (event) {
      setLocalEvent(event);
    }
  }, [event]);

  useEffect(() => {
    const gradingEnabled = localEvent?.gradingEnabled ?? true;
    if (!gradingEnabled && tab === "grading") {
      setTab("dashboard");
    }
  }, [localEvent?.gradingEnabled, tab]);

  useEffect(() => {
    fetchTeamsData();
  }, [fetchTeamsData]);

  useEffect(() => {
    const fetchCriteria = async () => {
      try {
        const res = await getEvaluationCriteria(id);
        // Sort by sortOrder to ensure correct display order
        const sortedCriteria = [...(res.criteria || [])].sort(
          (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
        );
        setEvaluationCriteria(sortedCriteria);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load evaluation criteria");
      }
    };
    fetchCriteria();
  }, [id]);

  return (
    <div className="w-full justify-center flex">
      <div className="w-full">
        {/* Banner Section */}
        <OrganizerBanner event={localEvent} open={bannerOpen} onOpenChange={setBannerOpen} />

        <div className="max-w-6xl mx-auto mt-6">
          {/* Header Section */}
          <OrganizerHeader
            id={id}
            event={localEvent}
            onEventUpdate={(updated) => setLocalEvent((prev) => ({ ...(prev || {}), ...updated }))}
          />

          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mt-6">
            <TabsList className="w-full flex flex-wrap h-auto p-1 justify-start gap-1 bg-muted/70 border border-border/60 rounded-xl">
              <TabsTrigger value="dashboard" className="flex-1 min-w-25 font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/30 dark:data-[state=active]:bg-white dark:data-[state=active]:text-black dark:data-[state=active]:shadow-white/30 dark:data-[state=active]:border dark:data-[state=active]:border-white/70">
                {t("eventTab.dashboard")}
              </TabsTrigger>
              <TabsTrigger value="information" className="flex-1 min-w-25 font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/30 dark:data-[state=active]:bg-white dark:data-[state=active]:text-black dark:data-[state=active]:shadow-white/30 dark:data-[state=active]:border dark:data-[state=active]:border-white/70">
                {t("eventTab.information")}
              </TabsTrigger>
              <TabsTrigger value="Participants" className="flex-1 min-w-25 font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/30 dark:data-[state=active]:bg-white dark:data-[state=active]:text-black dark:data-[state=active]:shadow-white/30 dark:data-[state=active]:border dark:data-[state=active]:border-white/70">
                {t("eventTab.participants")}
              </TabsTrigger>
              <TabsTrigger value="project" className="flex-1 min-w-25 font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/30 dark:data-[state=active]:bg-white dark:data-[state=active]:text-black dark:data-[state=active]:shadow-white/30 dark:data-[state=active]:border dark:data-[state=active]:border-white/70">
                {t("eventTab.projects")}
              </TabsTrigger>
              <TabsTrigger value="result" className="flex-1 min-w-25 font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/30 dark:data-[state=active]:bg-white dark:data-[state=active]:text-black dark:data-[state=active]:shadow-white/30 dark:data-[state=active]:border dark:data-[state=active]:border-white/70">
                {t("eventTab.results")}
              </TabsTrigger>
              {(localEvent?.gradingEnabled ?? true) && (
                <TabsTrigger value="grading" className="flex-1 min-w-25 font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/30 dark:data-[state=active]:bg-white dark:data-[state=active]:text-black dark:data-[state=active]:shadow-white/30 dark:data-[state=active]:border dark:data-[state=active]:border-white/70">
                  {t("eventTab.grading")}
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="dashboard">
              <OrganizerDashboard event={localEvent} />
              {/* Feedback Section - Only visible when event is finished */}
              {localEvent?.endView && new Date() > new Date(localEvent.endView) && (
                <FeedbackList eventId={id} />
              )}
            </TabsContent>

            <TabsContent value="information">
              <InformationSection
                id={id}
                event={localEvent}
                editable
                onEdit={(section, initialForm) => {
                  setEditingSection(section);
                  setForm(initialForm);
                }}
                linkLabel="Google Map Link of location"
              />
            </TabsContent>

            <TabsContent value="project">
              <div className="mt-6 space-y-6">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <h2 className="text-lg font-semibold">{t("projectTab.allProjects")}</h2>
                  <Input
                    placeholder={t("projectTab.searchProjects")}
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
                  onPostComment={() => {
                    toast.success(t("projectDetail.comments.posted"));
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

            {(localEvent?.gradingEnabled ?? true) && (
              <TabsContent value="grading">
                <div className="mt-6 space-y-6">
                  <EvaluationCriteriaForm
                    eventId={id}
                    initialCriteria={evaluationCriteria}
                    onUpdate={(criteria) => {
                      setEvaluationCriteria(criteria);
                      setGradingRefreshTrigger((prev) => prev + 1);
                    }}
                  />
                  <GradingDashboard eventId={id} refreshTrigger={gradingRefreshTrigger} />
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Edit Dialog */}
        <OrganizerEditDialog
          open={!!editingSection}
          onClose={() => setEditingSection(null)}
          section={editingSection}
          form={form}
          setForm={setForm}
          id={id}
          event={localEvent}
          onEventUpdate={(updated) => setLocalEvent((prev) => ({ ...(prev || {}), ...updated }))}
        />
      </div>
    </div>
  );
}
