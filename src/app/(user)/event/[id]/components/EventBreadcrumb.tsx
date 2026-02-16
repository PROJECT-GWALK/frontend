"use client";

import { useEffect, useState } from "react";
import { usePathname, useParams } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getEvent, getTeamById } from "@/utils/apievent";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";

export default function EventBreadcrumb() {
  const pathname = usePathname();
  const params = useParams();
  const { id, projectId } = params as { id: string; projectId?: string };
  const [eventName, setEventName] = useState<string>("");
  const [projectName, setProjectName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    if (id) {
      getEvent(id)
        .then((res) => {
          if (res.message === "ok") {
            setEventName(res.event.eventName);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  useEffect(() => {
    if (id && projectId) {
      getTeamById(id, projectId).then((res) => {
        if (res.message === "ok" && res.team) {
          setProjectName(res.team.teamName);
        }
      });
    } else {
      setProjectName(null);
    }
  }, [id, projectId]);

  // Determine segments
  const segments = pathname.split("/").filter(Boolean);
  // segments[0] = event
  // segments[1] = [id]
  
  // Check if we are at the event root
  // The path for event root is /event/[id] (plus optional query params which are not in pathname)
  // Segments length should be 2 for root.
  const isEventRoot = segments.length === 2;

  // Mapping for known sections
  const getSectionName = (segment: string) => {
    switch (segment.toLowerCase()) {
      case "projects":
        return t("projectDetail.sections.projectWorks") || "Projects";
      case "presenter":
        return "Presenter";
      case "organizer":
        return "Organizer";
      case "committee":
        return "Committee";
      case "guest":
        return "Guest";
      case "invite":
        return "Invite";
      default:
        return segment.charAt(0).toUpperCase() + segment.slice(1);
    }
  };

  if (loading) {
     return <Skeleton className="h-4 w-64 mb-4" />;
  }

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/home">{"Home"}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        
        {isEventRoot ? (
             <BreadcrumbItem>
               <BreadcrumbPage>{eventName || "Event"}</BreadcrumbPage>
             </BreadcrumbItem>
        ) : (
            <>
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/event/${id}`}>{eventName || "Event"}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                
                {/* Handle known sub-routes */}
                {/* Level 3: Section (e.g. Projects, Organizer) */}
                {segments.length > 2 && (
                    <BreadcrumbItem>
                       {/* If there is a 4th segment (like projectId), this should be a link? 
                           Usually /event/[id]/Projects is not a page, but /event/[id]/Projects/[id] is.
                           So maybe text only if no link available, or just skip?
                           Let's assume text for Section.
                       */}
                       {segments.length > 3 ? (
                           // Note: Linking to /event/[id]/Projects might fail if page doesn't exist
                           // Safer to just show text
                           <span className="flex items-center gap-1.5">{getSectionName(segments[2])}</span>
                       ) : (
                           <BreadcrumbPage>{getSectionName(segments[2])}</BreadcrumbPage>
                       )}
                    </BreadcrumbItem>
                )}

                {/* Level 4: Detail (e.g. ProjectId) */}
                {segments.length > 3 && (
                    <>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>
                                {projectId ? (projectName || "Project Detail") : getSectionName(segments[3])}
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </>
                )}
            </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
