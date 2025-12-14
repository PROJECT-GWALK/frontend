"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";

export default function EventProjectDetailPage() {
  const { id } = useParams();

  // 🔹 mock data (ค่าคงที่)
  const project = {
    title: "01 - Doctor Web App",
    description: "Create Appointment, View Medical Records etc.",
    videoLink: "video link",
    files: ["File 1", "File 2"],
    members: ["Member 1", "Member 2"],
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Cover */}
      <div className="max-w-6xl mx-auto px-6 lg:px-8 mt-6">
        <div className="h-[220px] md:h-[260px] bg-muted rounded-xl flex items-center justify-center overflow-hidden">
          <Image
            src="/project1.png"
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
            <CardTitle className="text-lg">
              My Project : {project.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {project.description}
            </p>
          </CardContent>
        </Card>

        {/* Video */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm">Video Link</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {project.videoLink}
            </p>
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
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="destructive">
              Edit Project Resource
            </Button>
            <Button size="sm" variant="secondary">
              Edit Project Member
            </Button>
            <Button size="sm" variant="outline">
              Shared Link
            </Button>
            <Button size="sm" variant="outline">
              Shared QR
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
