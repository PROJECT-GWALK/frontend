"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getEvent, updateParticipation } from "@/utils/apiuser";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

type Step2Props = {
  eventId?: string;
  defaultValues?: any;
  onSuccess?: (updated: any) => void;
  onBack?: () => void;
};

export default function Step2Participation(props: Step2Props) {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const eventId = props.eventId ?? params.id;

  const [loading, setLoading] = useState(true);

  const [publicJoin, setPublicJoin] = useState(true);
  const [passwordJoin, setPasswordJoin] = useState("");
  const [maxTeams, setMaxTeams] = useState<number | null>(null);
  const [maxTeamMembers, setMaxTeamMembers] = useState<number | null>(null);

  const [publicView, setPublicView] = useState(true);
  const [passwordView, setPasswordView] = useState("");
  const [showDashboard, setShowDashboard] = useState(false);

  const [fileTypes, setFileTypes] = useState<
    { name: string; description?: string; allowedFileType?: "jpg" | "png" | "pdf" | "url"; isRequired?: boolean }[]
  >([]);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await getEvent(eventId);
        const e = res.event;

        setPublicJoin(e.publicJoin);
        setPasswordJoin(e.passwordJoin || "");
        setMaxTeams(e.maxTeams);
        setMaxTeamMembers(e.maxTeamMembers);

        setPublicView(e.publicView);
        setPasswordView(e.passwordView || "");
        setShowDashboard(e.showDashboard);

        if (Array.isArray(e.fileTypes)) {
          setFileTypes(e.fileTypes);
        }
      } catch (err) {
        console.error("Failed to load event:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  const handleNext = async () => {
    try {
      await updateParticipation(eventId, {
        publicJoin,
        passwordJoin: passwordJoin || undefined,
        maxTeams: maxTeams ?? undefined,
        maxTeamMembers: maxTeamMembers ?? undefined,
        publicView,
        passwordView: passwordView || undefined,
        showDashboard,
        fileTypes: fileTypes.map(ft => ({
          ...ft,
          allowedFileType: ft.allowedFileType ?? null,
        })),
      });
      router.push(`/createEvent/${eventId}?step=3`);
    } catch (err) {
      console.error("Update participation error:", err);
      alert("Failed to update participation");
    }
  };

  const handleBack = () => {
    if (props.onBack) {
      props.onBack();
    } else {
      router.push(`/createEvent/${eventId}?step=1`);
    }
  };

  const addFileType = () => {
    setFileTypes([
      ...fileTypes,
      { name: "", description: "", allowedFileType: "pdf", isRequired: false },
    ]);
  };

  const updateFileType = (index: number, field: string, value: any) => {
    const updated = [...fileTypes];
    (updated[index] as any)[field] = value;
    setFileTypes(updated);
  };

  const removeFileType = (index: number) => {
    setFileTypes(fileTypes.filter((_, i) => i !== index));
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-4 p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold">Step 2: การเข้าร่วม (Participation Settings)</h2>

      <div className="flex items-center gap-2">
        <Switch checked={publicJoin} onCheckedChange={setPublicJoin} />
        <span>Public Join</span>
      </div>
      {!publicJoin && (
        <Input
          placeholder="Password for joining"
          value={passwordJoin}
          onChange={(e) => setPasswordJoin(e.target.value)}
        />
      )}

      <Input
        type="number"
        placeholder="Max Teams"
        value={maxTeams ?? ""}
        onChange={(e) => setMaxTeams(Number(e.target.value) || null)}
      />

      <Input
        type="number"
        placeholder="Max Team Members"
        value={maxTeamMembers ?? ""}
        onChange={(e) => setMaxTeamMembers(Number(e.target.value) || null)}
      />

      <div className="flex items-center gap-2">
        <Switch checked={publicView} onCheckedChange={setPublicView} />
        <span>Public View</span>
      </div>
      {!publicView && (
        <Input
          placeholder="Password for viewing"
          value={passwordView}
          onChange={(e) => setPasswordView(e.target.value)}
        />
      )}

      <div className="flex items-center gap-2">
        <Switch checked={showDashboard} onCheckedChange={setShowDashboard} />
        <span>Show Dashboard</span>
      </div>

      <div>
        <h3 className="font-medium">File Requirements</h3>
        {fileTypes.map((ft, i) => (
          <div key={i} className="border rounded p-2 mt-2 space-y-2">
            <Input
              placeholder="Name"
              value={ft.name}
              onChange={(e) => updateFileType(i, "name", e.target.value)}
            />
            <Input
              placeholder="Description"
              value={ft.description || ""}
              onChange={(e) => updateFileType(i, "description", e.target.value)}
            />
            <select
              value={ft.allowedFileType || "pdf"}
              onChange={(e) => updateFileType(i, "allowedFileType", e.target.value)}
              className="border rounded p-1"
            >
              <option value="jpg">JPG</option>
              <option value="png">PNG</option>
              <option value="pdf">PDF</option>
              <option value="url">URL</option>
            </select>
            <div className="flex items-center gap-2">
              <Switch
                checked={ft.isRequired || false}
                onCheckedChange={(val) => updateFileType(i, "isRequired", val)}
              />
              <span>Required</span>
            </div>
            <Button variant="destructive" onClick={() => removeFileType(i)}>
              Remove
            </Button>
          </div>
        ))}
        <Button variant="outline" className="mt-2" onClick={addFileType}>
          + Add File Requirement
        </Button>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleBack}>Back</Button>
        <Button onClick={handleNext}>Next</Button>
      </div>
    </div>
  );
}
