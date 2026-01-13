"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useParams, useSearchParams } from "next/navigation";

export default function EventProjectDetailPage() {
  const { id } = useParams();

  // 🔹 mock data (ค่าคงที่)
  const projects = [
    {
      id: "01",
      title: "01 - Doctor Web App",
      description: "Create Appointment, View Medical Records etc.",
      img: "/banner.png",
      videoLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      files: ["Proposal.pdf", "Slides.pdf"],
      members: ["Member 1", "Member 2"],
    },
    {
      id: "02",
      title: "02 - Restaurant Application",
      description: "Create Reservation, View Menu etc.",
      img: "/banner.png",
      videoLink: "",
      files: ["Report.pdf"],
      members: ["Member A", "Member B"],
    },
  ];

  const searchParams = useSearchParams();
  const teamId = searchParams?.get("team");

  const project = projects.find((p) => p.id === teamId) || projects[0];

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Cover */}
      <div className="max-w-6xl mx-auto px-6 lg:px-8 mt-6">
        <div className="h-[220px] md:h-[260px] bg-muted rounded-xl flex items-center justify-center overflow-hidden">
          <Image
            src={project.img || "/banner.png"}
            alt="project cover"
            width={220}
            height={220}
            className="object-contain"
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 lg:px-8 mt-6 space-y-4">
        {/* Title */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">My Project : {project.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{project.description}</p>
          </CardContent>
        </Card>

        {/* Video */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm">Video Link</CardTitle>
          </CardHeader>
          <CardContent>
            {project.videoLink ? (
              project.videoLink.includes("youtube") || project.videoLink.includes("youtu.be") ? (
                // embed YouTube video
                (() => {
                  const ytRegex = /(?:v=|\/)([0-9A-Za-z_-]{11})/;
                  const match = project.videoLink.match(ytRegex);
                  const vid = match ? match[1] : null;
                  return vid ? (
                    <div className="w-full aspect-video">
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${vid}`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <a
                      href={project.videoLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-primary"
                    >
                      Open video link
                    </a>
                  );
                })()
              ) : (
                <a
                  href={project.videoLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary"
                >
                  Open video link
                </a>
              )
            ) : (
              <div className="text-sm text-muted-foreground">No video provided</div>
            )}
          </CardContent>
        </Card>

        {/* Files */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm">File</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {project.files.map((file, index) => (
              <p key={index} className="text-sm text-muted-foreground">
                {file}
              </p>
            ))}
          </CardContent>
        </Card>

        {/* Members */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm">Member</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {project.members.map((m, index) => (
              <p key={index} className="text-sm text-muted-foreground">
                {m}
              </p>
            ))}
          </CardContent>
        </Card>

        {/* Gallery */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm">Gallery Image</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40 rounded-lg bg-muted flex items-center justify-center text-sm text-muted-foreground">
              Gallery Image
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button size="sm" variant="destructive" className="w-full">
              Edit Project Resource
            </Button>
            <Button size="sm" variant="secondary" className="w-full">
              Edit Project Member
            </Button>
            <Button size="sm" variant="outline" className="w-full">
              Shared Link
            </Button>
            <Button size="sm" variant="outline" className="w-full">
              Shared QR
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
