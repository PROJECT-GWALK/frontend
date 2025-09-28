"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSpecialRewards, updateSpecialRewards } from "@/utils/apiuser";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Step4Props = {
  eventId?: string;
  onBack?: () => void;
  onSuccess?: (updated: any) => void;
};

export default function Step4SpecialRewards(props: Step4Props) {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const eventId = props.eventId ?? params.id;

  const [loading, setLoading] = useState(true);
  const [rewards, setRewards] = useState<
    {
      name: string;
      description?: string;
      image?: string | null; // URL จาก backend
      file?: File | null; // ไฟล์ใหม่ที่อัปโหลด
      preview?: string | null;
    }[]
  >([]);

  // โหลด rewards เดิม
  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const res = await getSpecialRewards(eventId);
        setRewards(
          (res.rewards || []).map((r: any) => ({
            name: r.name,
            description: r.description,
            image: r.image,
            file: null,
            preview: null,
          }))
        );
      } catch (err) {
        console.error("Failed to load rewards:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRewards();
  }, [eventId]);

  // ✅ ส่งข้อมูลแบบ multipart/form-data
  const handleNext = async () => {
    try {
      const formData = new FormData();

      rewards.forEach((r, idx) => {
        formData.append(`rewards[${idx}][name]`, r.name);
        if (r.description) {
          formData.append(`rewards[${idx}][description]`, r.description);
        }
        if (r.file) {
          formData.append(`rewards[${idx}][file]`, r.file);
        } else if (r.image) {
          formData.append(`rewards[${idx}][image]`, r.image);
        }
      });

      await updateSpecialRewards(eventId, formData);

      // เรียก onSuccess จาก parent ถ้ามี เพื่อให้ parent จัดการ goNext เอง
      if (props.onSuccess) {
        props.onSuccess(rewards);
      } else {
        // fallback: ไม่มี onSuccess ก็ไป step 5 ตรงๆ
        router.push(`/createEvent/${eventId}?step=5`);
      }
    } catch (err) {
      console.error("Update special rewards error:", err);
      alert("Failed to update step 4");
    }
  };

  const handleBack = () => {
    if (props.onBack) {
      props.onBack();
    } else {
      router.push(`/createEvent/${eventId}?step=3`);
    }
  };

  const addReward = () => {
    setRewards([...rewards, { name: "", description: "", image: null, file: null, preview: null }]);
  };

  const updateReward = (index: number, field: string, value: any) => {
    const updated = [...rewards];
    (updated[index] as any)[field] = value;
    setRewards(updated);
  };

  const removeReward = (index: number) => {
    setRewards(rewards.filter((_, i) => i !== index));
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-4 p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold">Step 4: รางวัลพิเศษ (Special Rewards)</h2>

      {rewards.map((r, i) => (
        <div key={i} className="border rounded p-3 mt-2 space-y-2">
          <Input
            placeholder="Reward Name"
            value={r.name}
            onChange={(e) => updateReward(i, "name", e.target.value)}
          />
          <Input
            placeholder="Description"
            value={r.description || ""}
            onChange={(e) => updateReward(i, "description", e.target.value)}
          />
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              const updated = [...rewards];
              updated[i] = {
                ...updated[i],
                file,
                preview: file ? URL.createObjectURL(file) : null,
              };
              setRewards(updated);
            }}
          />
          {(r.preview || r.image) && (
            <img
              src={r.preview ?? r.image ?? ""}
              alt={r.name || "Preview"}
              className="w-40 h-24 object-cover rounded"
            />
          )}
          <Button variant="destructive" onClick={() => removeReward(i)}>
            Remove
          </Button>
        </div>
      ))}
      <Button variant="outline" className="mt-2" onClick={addReward}>
        + Add Reward
      </Button>
      <div className="flex justify-between mt-4">
        <Button variant="outline" onClick={handleBack}>
          Back
        </Button>
        <Button onClick={handleNext}>Next</Button>
      </div>
    </div>
  );
}
