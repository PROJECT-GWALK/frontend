import Image from "next/image";
import Link from "next/link";
import { SAMPLE_PROJECTS } from "../../components/mockProjects";

type Props = {
  params: { id: string; projectId: string };
};

export default function ProjectDetailPage({ params }: Props) {
  const { projectId, id } = params;
  const project = SAMPLE_PROJECTS.find((p) => p.id === projectId);

  if (!project) {
    return (
      <div className="p-6">
        <Link href={`../`} className="text-sm text-blue-600 underline">
          Back to Projects
        </Link>
        <div className="mt-4 text-muted-foreground">Project not found.</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-start gap-6">
        <div className="w-48 h-32 relative rounded-lg overflow-hidden bg-slate-100">
          {project.img ? (
            <Image src={project.img} alt={project.title} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-300 text-4xl font-bold">
              {project.title.charAt(0)}
            </div>
          )}
        </div>

        <div className="flex-1">
          <h1 className="text-2xl font-bold">{project.title}</h1>
          <p className="text-sm text-muted-foreground mt-2">{project.desc}</p>

          <div className="mt-4 flex gap-3 text-sm text-muted-foreground">
            <div>Members: {project.members?.length ?? 0}</div>
            <div>Files: {project.files?.length ?? 0}</div>
          </div>

          <div className="mt-4">
            <Link href={`../../`} className="text-sm text-blue-600 underline">
              Back to Projects
            </Link>
          </div>
        </div>
      </div>

      {project.videoLink ? (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Project Video</h3>
          <div className="aspect-video">
            <iframe
              src={project.videoLink}
              title={project.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full rounded"
            />
          </div>
        </div>
      ) : null}

      {project.files && project.files.length > 0 ? (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Files</h3>
          <ul className="space-y-2">
            {project.files.map((f) => (
              <li key={f.url}>
                <a href={f.url} className="text-blue-600 underline">
                  {f.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {project.members && project.members.length > 0 ? (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Members</h3>
          <div className="flex gap-2 flex-wrap">
            {project.members.map((m) => (
              <div key={m} className="px-3 py-1 rounded-full bg-muted text-sm">
                {m}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
