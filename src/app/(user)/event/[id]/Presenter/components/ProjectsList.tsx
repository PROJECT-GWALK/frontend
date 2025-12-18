"use client";

import React from "react";
import ProjectCard from "./ProjectCard";
import type { PresenterProject } from "./types";

export const SAMPLE_PROJECTS: PresenterProject[] = [
  {
    id: "01",
    title: "Doctor Web App",
    desc: "Create Appointment, View Medical Records etc.",
    img: "/project1.png",
  },
  {
    id: "02",
    title: "Restaurant Application",
    desc: "Create Reservation, View Menu etc.",
    img: "/project2.png",
  },
  {
    id: "03",
    title: "CMU Hub",
    desc: "Hub for every CMU students.",
    img: "/project3.png",
  },
];

type Props = {
  projects?: PresenterProject[];
  searchQuery?: string;
  eventId: string;
};

export default function ProjectsList({
  projects = SAMPLE_PROJECTS,
  searchQuery = "",
  eventId,
}: Props) {
  const filtered = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filtered.length === 0) {
    return <div className="text-sm text-muted-foreground">No projects found.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {filtered.map((p) => (
        <ProjectCard key={p.id} project={p} eventId={eventId} />
      ))}
    </div>
  );
}
