"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getEvent, updateCommitteeGuest } from "@/utils/apiuser";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

type Step3Props = {
  eventId?: string;
  defaultValues?: any;
  onSuccess?: (updated: any) => void;
  onBack?: () => void;
};

export default function Step3CommitteeGuest(props: Step3Props) {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const eventId = props.eventId ?? params.id;

  const [loading, setLoading] = useState(true);

  const [hasCommittee, setHasCommittee] = useState(false);
  const [virtualRewardCommittee, setVirtualRewardCommittee] = useState<number>(0);
  const [virtualRewardGuest, setVirtualRewardGuest] = useState<number>(0);
  const [unitReward, setUnitReward] = useState("");

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await getEvent(eventId);
        const e = res.event;

        setHasCommittee(e.hasCommittee || false);
        setVirtualRewardCommittee(e.virtualRewardCommittee ?? 0);
        setVirtualRewardGuest(e.virtualRewardGuest ?? 0);
        setUnitReward(e.unitReward || "");
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
      await updateCommitteeGuest(eventId, {
        hasCommittee,
        virtualRewardCommittee,
        virtualRewardGuest,
        unitReward: unitReward || null,
      });
      router.push(`/createEvent/${eventId}?step=4`);
    } catch (err) {
      console.error("Update committee/guest error:", err);
      alert("Failed to update step 3");
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

  return (
    <div className="space-y-4 p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold">Step 3: กรรมการ (Committee Settings) + Guest Reward</h2>

      <div className="flex items-center gap-2">
        <Switch checked={hasCommittee} onCheckedChange={setHasCommittee} />
        <span>มีกรรมการหรือไม่?</span>
      </div>

      {hasCommittee && (
        <Input
          type="number"
          placeholder="ค่าตอบแทนกรรมการ"
          value={virtualRewardCommittee}
          onChange={(e) => setVirtualRewardCommittee(Number(e.target.value) || 0)}
        />
      )}

      <Input
        type="number"
        placeholder="ค่าตั้งต้น Reward สำหรับ Guest"
        value={virtualRewardGuest}
        onChange={(e) => setVirtualRewardGuest(Number(e.target.value) || 0)}
      />

      <Input
        placeholder="หน่วยรางวัล เช่น คะแนน / เหรียญ"
        value={unitReward}
        onChange={(e) => setUnitReward(e.target.value)}
      />

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleBack}>Back</Button>
        <Button onClick={handleNext}>Next</Button>
      </div>
    </div>
  );
}
