"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getEventPreview, submitEvent } from "@/utils/apiuser";
import { Button } from "@/components/ui/button";

type Step6Props = {
  event?: any;
  onBack?: () => void;
  onSubmit?: () => void;
};

export default function Step6Preview(props: Step6Props) {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const eventId = params.id;

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);

  // โหลดข้อมูล preview
  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const res = await getEventPreview(eventId);
        setEvent(res.event);
      } catch (err) {
        console.error("Failed to load preview:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPreview();
  }, [eventId]);

  const handleConfirm = async () => {
    try {
      await submitEvent(eventId); // เปลี่ยนเป็น PUBLISHED
      router.push(`/events/${eventId}`); // ไปหน้า event จริง
    } catch (err) {
      console.error("Submit event error:", err);
      alert("Failed to publish event");
    }
  };

    const handleBack = () => {
    if (props.onBack) {
      props.onBack();
    } else {
      router.push(`/createEvent/${eventId}?step=1`);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!event) return <div className="p-6 text-red-600">Event not found</div>;

  return (
    <div className="space-y-6 p-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold">Step 6: Preview & Confirm</h2>

      {/* Basic Info */}
      <div className="border rounded p-4 space-y-2">
        <h3 className="font-semibold">Basic Info</h3>
        <p><b>Name:</b> {event.eventName}</p>
        <p><b>Description:</b> {event.eventDescription || "-"}</p>
        <p><b>Location:</b> {event.locationName} ({event.location})</p>
        {event.imageCover && (
          <img
            src={event.imageCover}
            alt="Cover"
            className="w-full max-h-60 object-cover rounded"
          />
        )}
      </div>

      {/* Participation */}
      <div className="border rounded p-4 space-y-2">
        <h3 className="font-semibold">Participation</h3>
        <p><b>Public Join:</b> {event.publicJoin ? "Yes" : "No"}</p>
        {event.passwordJoin && <p><b>Password Join:</b> {event.passwordJoin}</p>}
        <p><b>Max Teams:</b> {event.maxTeams || "-"}</p>
        <p><b>Max Team Members:</b> {event.maxTeamMembers || "-"}</p>
        <p><b>Public View:</b> {event.publicView ? "Yes" : "No"}</p>
        {event.passwordView && <p><b>Password View:</b> {event.passwordView}</p>}
        <p><b>Show Dashboard:</b> {event.showDashboard ? "Yes" : "No"}</p>
        <div>
          <b>File Types:</b>
          <ul className="list-disc ml-6">
            {event.fileTypes?.map((f: any) => (
              <li key={f.id}>
                {f.name} ({f.allowedFileType || "any"}){" "}
                {f.isRequired ? "(required)" : ""}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Committee + Guest Reward */}
      <div className="border rounded p-4 space-y-2">
        <h3 className="font-semibold">Committee & Rewards</h3>
        <p><b>Has Committee:</b> {event.hasCommittee ? "Yes" : "No"}</p>
        <p><b>Reward Committee:</b> {event.virtualRewardCommittee}</p>
        <p><b>Reward Guest:</b> {event.virtualRewardGuest}</p>
        <p><b>Unit Reward:</b> {event.unitReward || "-"}</p>
      </div>

      {/* Special Rewards */}
      <div className="border rounded p-4 space-y-2">
        <h3 className="font-semibold">Special Rewards</h3>
        {event.specialRewards?.length > 0 ? (
          <ul className="space-y-2">
            {event.specialRewards.map((r: any) => (
              <li key={r.id} className="border p-2 rounded">
                <p><b>{r.name}</b></p>
                {r.description && <p>{r.description}</p>}
                {r.image && (
                  <img
                    src={r.image}
                    alt={r.name}
                    className="w-40 h-24 object-cover rounded"
                  />
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>-</p>
        )}
      </div>

      {/* Timeline */}
      <div className="border rounded p-4 space-y-2">
        <h3 className="font-semibold">Timeline</h3>
        <p><b>Start Join:</b> {event.startJoinDate || "-"}</p>
        <p><b>End Join:</b> {event.endJoinDate || "-"}</p>
        <p><b>Start View:</b> {event.startView || "-"}</p>
        <p><b>Show Dashboard:</b> {event.showDashboard ? "Yes" : "No"}</p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.push(`/createEvent/${eventId}?step=5`)}>
          Back
        </Button>
        <Button onClick={handleConfirm} className="bg-green-600 hover:bg-green-700">
          Confirm & Publish
        </Button>
      </div>
    </div>
  );
}