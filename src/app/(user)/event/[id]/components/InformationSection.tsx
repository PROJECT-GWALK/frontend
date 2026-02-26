"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import type { EventData } from "@/utils/types";
import CardInformation1 from "./CardInformation/CardInformation1";
import CardInformation2 from "./CardInformation/CardInformation2";
import CardInformation3 from "./CardInformation/CardInformation3";
import CardInformation4 from "./CardInformation/CardInformation4";
import CardInformation5 from "./CardInformation/CardInformation5";

type EditSection =
  | "description"
  | "time"
  | "location"
  | "presenter"
  | "guest"
  | "rewards";

type Props = {
  id: string;
  event: EventData;
  editable?: boolean;
  onEdit?: (section: EditSection, initialForm: Record<string, unknown>) => void;
  linkLabel?: string;
};

export default function InformationSection({
  event,
  editable,
  onEdit,
}: Props) {
  const { language } = useLanguage();

  const handleEditWrapper = (
    section: EditSection | string,
    initialForm: Record<string, unknown>
  ) => {
    if (onEdit) {
      onEdit(section as EditSection, initialForm);
    }
  };

  return (
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column (2/3) */}
      <div className="lg:col-span-2 space-y-6">
        {/* Part 1: Event Details & Location */}
        <CardInformation1
          event={event}
          editable={editable}
          onEdit={handleEditWrapper}
        />

        {/* Part 3: Presenter/Rewards Config */}
        <CardInformation3
          event={event}
          editable={editable}
          onEdit={handleEditWrapper}
        />
      </div>

      {/* Right Column (1/3) */}
      <div className="lg:col-span-1 space-y-6">
        {/* Part 2: Time Configuration */}
        <CardInformation2
          event={event}
          editable={editable}
          onEdit={handleEditWrapper}
          language={language}
        />

        {/* Part 5: Organizers & Invite Links */}
        <CardInformation5 event={event} editable={editable} />

        {/* Part 4: Special Rewards */}
        <CardInformation4
          event={event}
          editable={editable}
          onEdit={handleEditWrapper}
        />
      </div>
    </div>
  );
}
