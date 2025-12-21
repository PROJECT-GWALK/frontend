"use client";

import React from "react";
import type { PresenterProject } from "./types";
import ProjectCard from "./ProjectCard";

type Props = {
  projects?: PresenterProject[];
  searchQuery?: string;
  eventId: string;
  basePath?: string;
};

export default function ProjectsList({
  projects = [],
  searchQuery = "",
  eventId,
  basePath,
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
        <ProjectCard key={p.id} project={p} eventId={eventId} basePath={basePath} />
      ))}
    </div>
  );
}
