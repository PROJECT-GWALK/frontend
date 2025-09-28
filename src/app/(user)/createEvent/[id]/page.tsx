"use client";

// imports ด้านบนไฟล์
import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getEvent, updateEvent, submitEvent } from "@/utils/apiuser";
import Step1BasicInfo from "./Step1BasicInfo";

import Step2Participation from "./Step2Participation";
import Step4SpecialRewards from "./Step4SpecialRewards";
import Step5Timeline from "./Step5Timeline";
import Step6Preview from "./Step6Preview";
import Step3CommitteeGuest from "./Step3CommitteeGuest";

type Step = {
  number: number;
  title: string;
  description: string;
};

const steps: Step[] = [
  { number: 1, title: "Basic Info", description: "ข้อมูลทั่วไป" },
  { number: 2, title: "Participation", description: "การเข้าร่วม" },
  { number: 3, title: "Committee", description: "กรรมการ + Guest reward" },
  { number: 4, title: "Special Rewards", description: "รางวัลพิเศษ" },
  { number: 5, title: "Timeline", description: "วันเวลา" },
  { number: 6, title: "Preview", description: "ตรวจสอบและยืนยัน" },
];

export default function EventWizardPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const eventId = params?.id as string;

  const [step, setStep] = useState(1);
  const [eventData, setEventData] = useState<any>(null);

  // ซิงก์ step จาก query string (?step=...)
  useEffect(() => {
    const raw = searchParams.get("step");
    const sp = parseInt(raw ?? "1", 10);
    setStep(Math.min(6, Math.max(1, isNaN(sp) ? 1 : sp)));
  }, [searchParams]);

  // โหลดข้อมูล event เดิม
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await getEvent(eventId);
        setEventData(res.event);
      } catch (err) {
        console.error("Failed to load event:", err);
      }
    }
    if (eventId) fetchData();
  }, [eventId]);

  // ปรับการเปลี่ยนขั้นตอนให้เปลี่ยน URL เพื่อให้ stepper อัปเดตตาม
  const goNext = () => {
    const next = Math.min(6, step + 1);
    router.push(`/createEvent/${eventId}?step=${next}`);
  };
  const goBack = () => {
    const prev = Math.max(1, step - 1);
    router.push(`/createEvent/${eventId}?step=${prev}`);
  };

  const handleSubmit = async () => {
    try {
      await submitEvent(eventId);
      router.push(`/events/${eventId}`);
    } catch (err) {
      console.error("Submit event failed:", err);
    }
  };

  if (!eventData) return <p className="p-6">Loading...</p>;

  return (
    <div className="container mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">Edit Event Wizard</h1>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-6">
        {steps.map((s) => (
          <div key={s.number} className="flex-1 text-center">
            <div
              className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full border-2 ${
                step === s.number
                  ? "border-blue-600 text-blue-600"
                  : step > s.number
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-gray-300 text-gray-400"
              }`}
            >
              {s.number}
            </div>
            <div className="mt-1 text-sm">{s.title}</div>
          </div>
        ))}
      </div>

      {/* Step Content */}
      {step === 1 && (
        <Step1BasicInfo
          eventId={eventId}
          onSuccess={(updated) => {
            setEventData(updated);
            goNext();
          }}
        />
      )}
      {step === 2 && (
        <Step2Participation
          eventId={eventId}
          onSuccess={(updated) => {
            setEventData(updated);
            goNext();
          }}
          onBack={goBack}
        />
      )}
      {step === 3 && (
        <Step3CommitteeGuest
          eventId={eventId}
          onSuccess={(updated) => {
            setEventData(updated);
            goNext();
          }}
          onBack={goBack}
        />
      )}
      {step === 4 && (
        <Step4SpecialRewards
          eventId={eventId}
          onSuccess={(updated) => {
            setEventData(updated);
            goNext();
          }}
          onBack={goBack}
        />
      )}
      {step === 5 && (
        <Step5Timeline
          eventId={eventId}
          onSuccess={(updated) => {
            setEventData(updated);
            goNext();
          }}
          onBack={goBack}
        />
      )}
      {step === 6 && (
        <Step6Preview
          onBack={goBack}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
