"use client";

import { type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Gift, Plus, Trash2, Award } from "lucide-react";
import ImageCropDialog from "@/lib/image-crop-dialog";
import type { SpecialReward } from "@/utils/types";

type Props = {
  specialRewards: SpecialReward[];
  srPreviews: Record<string, string | null>;
  openRewardFilePicker: (id: string) => void;
  rewardFileRefs: React.MutableRefObject<
    Record<string, HTMLInputElement | null>
  >;
  handleRewardFileChange: (
    id: string,
    e: ChangeEvent<HTMLInputElement>
  ) => void;
  handleRemoveRewardImage: (id: string) => void;
  handleAddSpecialReward: () => void;
  handleRemoveReward: (id: string) => void;
  handleRewardChange: (
    id: string,
    field: "name" | "description",
    value: string
  ) => void;
  rewardErrors?: Record<string, string>;
  srCropOpen: boolean;
  srCropSrc: string | null;
  srPendingMeta: { id: string; name: string; type: string } | null;
  onRewardCropCancel: () => void;
  onRewardCropConfirm: (file: File, previewUrl: string) => void;
};

export default function SpecialRewardsSection({
  specialRewards,
  srPreviews,
  openRewardFilePicker,
  rewardFileRefs,
  handleRewardFileChange,
  handleRemoveRewardImage,
  handleAddSpecialReward,
  handleRemoveReward,
  handleRewardChange,
  rewardErrors,
  srCropOpen,
  srCropSrc,
  srPendingMeta,
  onRewardCropCancel,
  onRewardCropConfirm,
}: Props) {
  return (
    <Card id="rewards" className="scroll-mt-6 lg:col-span-2 border-none shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-3 text-lg font-semibold">
          <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
            <Award className="h-5 w-5" />
          </div>
          <span className="">
            Special Rewards / รางวัลพิเศษ
          </span>
        </CardTitle>
        <Button onClick={handleAddSpecialReward} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          Add Reward / เพิ่มรางวัล
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        <ImageCropDialog
          open={srCropOpen}
          src={srCropSrc}
          fileName={srPendingMeta?.name}
          fileType={srPendingMeta?.type}
          aspect={1}
          title="Crop to square"
          outputWidth={512}
          outputHeight={512}
          onOpenChange={(o) => {
            if (!o) onRewardCropCancel();
          }}
          onCancel={onRewardCropCancel}
          onConfirm={onRewardCropConfirm}
        />

        {specialRewards.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Gift className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No special rewards added yet / ยังไม่มีรางวัลพิเศษ</p>
            <p className="text-sm">
              Click &quot;Add Reward&quot; to create one / คลิก &quot;เพิ่มรางวัล&quot; เพื่อสร้าง
            </p>
          </div>
        ) : (
          specialRewards.map((reward, index) => (
            <div
              key={reward.id}
              className="border rounded-lg p-4 space-y-4 bg-muted/30"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Reward #{index + 1}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleRemoveReward(reward.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-24 sm:w-32">
                  {srPreviews[reward.id] ? (
                    <>
                      <div className="relative border rounded-lg overflow-hidden aspect-square bg-muted w-full">
                        <img
                          src={srPreviews[reward.id] as string}
                          alt="Reward image preview"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          ref={(el) => {
                            rewardFileRefs.current[reward.id] = el;
                          }}
                          onChange={(e) => handleRewardFileChange(reward.id, e)}
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-center gap-2">
                        <Button
                          size="icon"
                          variant="secondary"
                          aria-label="Change image"
                          title="Change"
                          onClick={() => openRewardFilePicker(reward.id)}
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          aria-label="Remove image"
                          title="Remove"
                          onClick={() => handleRemoveRewardImage(reward.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        className="relative w-full cursor-pointer"
                        onClick={() => openRewardFilePicker(reward.id)}
                      >
                        <div className="border-2 border-dashed border-border rounded-lg hover:border-primary/50 transition-colors aspect-square overflow-hidden">
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3 sm:p-6">
                            <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground mb-2" />
                            <p className="text-[10px] sm:text-sm text-muted-foreground hidden sm:block">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-[9px] sm:text-xs text-muted-foreground mt-1 hidden sm:block">
                              PNG, JPG, GIF
                            </p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            ref={(el) => {
                              rewardFileRefs.current[reward.id] = el;
                            }}
                            onChange={(e) => handleRewardFileChange(reward.id, e)}
                          />
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-center">
                        <Button
                          size="icon"
                          variant="secondary"
                          aria-label="Upload image"
                          title="Upload"
                          onClick={() => openRewardFilePicker(reward.id)}
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <div className="space-y-2">
                    <Label>Reward Name / ชื่อรางวัล</Label>
                    <Input
                      placeholder="e.g. Best Presentation"
                      value={reward.name}
                      onChange={(e) =>
                        handleRewardChange(reward.id, "name", e.target.value)
                      }
                    />
                    {rewardErrors && rewardErrors[reward.id] && (
                      <p className="text-xs text-destructive mt-1">{rewardErrors[reward.id]}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Description / รายละเอียด</Label>
                    <Textarea
                      placeholder="Describe what this reward is for..."
                      value={reward.description ?? ""}
                      onChange={(e) =>
                        handleRewardChange(reward.id, "description", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
