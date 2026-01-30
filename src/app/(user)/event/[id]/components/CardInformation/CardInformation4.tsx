"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Edit, Gift } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import Image from "next/image";
import type { EventData } from "@/utils/types";

type Props = {
  event: EventData;
  editable?: boolean;
  onEdit?: (section: "rewards", initialForm: Record<string, unknown>) => void;
};

export default function CardInformation4({ event, editable, onEdit }: Props) {
  const { t } = useLanguage();
  const specialRewards = event?.specialRewards ?? [];

  return (
    <Card className="lg:col-span-2 border-none dark:border dark:border-white/10 shadow-md hover:shadow-lg transition-all duration-300 group">
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
              <Award className="h-5 w-5" />
            </div>
            {t("rewardsSection.specialRewards") || "Special Rewards"}
          </CardTitle>
          {editable && onEdit && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 rounded-full hover:bg-amber-100 hover:text-amber-700 dark:hover:bg-amber-900/30 dark:hover:text-amber-300"
              onClick={() => onEdit("rewards", {})}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {specialRewards.length > 0 ? (
          <div className="flex flex-col gap-4">
            {specialRewards.map((reward) => (
              <div
                key={reward.id}
                className="flex items-start gap-4 p-4 rounded-2xl border bg-card dark:bg-card/50 dark:border-white/5 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 hover:border-amber-200 dark:hover:border-amber-500/30 transition-all duration-300 group/reward"
              >
                <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-muted border">
                  {reward.image ? (
                    <Image
                      src={reward.image}
                      alt={reward.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover/reward:scale-110"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full w-full bg-amber-50 text-amber-300 dark:bg-amber-900/20 dark:text-amber-800">
                      <Gift className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <h4 className="font-bold text-base truncate pr-2 group-hover/reward:text-amber-700 dark:group-hover/reward:text-amber-400 transition-colors">
                    {reward.name}
                  </h4>
                  {reward.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed break-all">
                      {reward.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-3 bg-muted/30 rounded-2xl border-2 border-dashed border-muted">
            <div className="p-3 rounded-full bg-muted/50 text-muted-foreground/50">
              <Gift className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {t("rewardsSection.noRewards") || "No special rewards defined"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
