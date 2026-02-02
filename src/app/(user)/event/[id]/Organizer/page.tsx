"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  getTeams,
  deleteTeam,
} from "@/utils/apievent";
import { toast } from "sonner";
import InformationSection from "../components/InformationSection";
import type { EventData, EventEditSection, EventFormState, Team } from "@/utils/types";
import type { PresenterProject } from "../Presenter/components/types";
import ParticipantsSection from "./components/ParticipantsSection";
import UnifiedProjectList from "../components/UnifiedProjectList";
import { useLanguage } from "@/contexts/LanguageContext";
import ResultSection from "../components/ResultSection";
import FeedbackList from "./components/FeedbackList";

import OrganizerHeader from "./components/OrganizerHeader";
import OrganizerBanner from "./components/OrganizerBanner";
import OrganizerDashboard from "./components/OrganizerDashboard";
import OrganizerEditDialog from "./components/OrganizerEditDialog";

type Props = {
  id: string;
  event: EventData;
};

export default function OrganizerView({ id, event }: Props) {
  const [tab, setTab] = useState<"dashboard" | "information" | "Participants" | "project" | "result">("dashboard");
  const [localEvent, setLocalEvent] = useState<EventData>(event);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<EventEditSection | null>(null);
  const [form, setForm] = useState<EventFormState>({});
  
  const [projects, setProjects] = useState<PresenterProject[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [projectsLoading, setProjectsLoading] = useState(false);

  const { t } = useLanguage();

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
    <div className="w-full justify-center flex">
      <div className="w-full">
        {/* Banner Section */}
        <OrganizerBanner 
          event={localEvent} 
          open={bannerOpen} 
          onOpenChange={setBannerOpen} 
        />

        <div className="max-w-6xl mx-auto mt-6">
          {/* Header Section */}
          <OrganizerHeader 
            id={id} 
            event={localEvent} 
            onEventUpdate={(updated) => setLocalEvent(prev => ({ ...(prev || {}), ...updated }))} 
          />

          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mt-6">
            <TabsList className="w-full flex flex-wrap h-auto p-1 justify-start gap-1 bg-muted/50">
              <TabsTrigger value="dashboard" className="flex-1 min-w-25">Dashboard</TabsTrigger>
              <TabsTrigger value="information" className="flex-1 min-w-25">Information</TabsTrigger>
              <TabsTrigger value="Participants" className="flex-1 min-w-25">Participants</TabsTrigger>
              <TabsTrigger value="project" className="flex-1 min-w-25">Project</TabsTrigger>
              <TabsTrigger value="result" className="flex-1 min-w-25">Result</TabsTrigger>
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
          onEventUpdate={(updated) => setLocalEvent(prev => ({ ...(prev || {}), ...updated }))}
        />
      </div>
    </div>
  );
}
