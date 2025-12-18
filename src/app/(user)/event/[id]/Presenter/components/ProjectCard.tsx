"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";
import type { PresenterProject } from "./types";
import { Button } from "@/components/ui/button";

type Props = {
  project: PresenterProject;
  eventId: string;
};

export default function ProjectCard({ project, eventId }: Props) {
  return (
    <div className="group flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1">
      <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
        {project.img ? (
          <Image
            src={project.img}
            alt={project.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300 text-4xl font-bold">
            {project.title.charAt(0)}
          </div>
        )}

        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-slate-700 shadow-sm">
          #{project.id}
        </div>
      </div>

      <div className="flex flex-col flex-1 p-5">
        <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors">
          {project.title}
        </h3>
        <p className="text-sm text-slate-500 line-clamp-3 mb-4 flex-1">{project.desc}</p>

        <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            View Project
          </span>
          <Link href={`./${eventId}/project/${project.id}`} className="inline-flex items-center">
            <Button size="sm">Open</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
