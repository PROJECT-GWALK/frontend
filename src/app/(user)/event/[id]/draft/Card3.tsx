"use client";

import { useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Users, FileText, Plus, Trash2, UserCheck, Gift } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { EventFileType, FileType } from "@/utils/types";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  // Presenter Config
  maxPresenters: string;
  setMaxPresenters: (v: string) => void;
  maxGroups: string;
  setMaxGroups: (v: string) => void;
  
  // File Requirements
  fileRequirements: EventFileType[];
  setFileRequirements: (v: EventFileType[]) => void;
  
  // Committee & Guest Rewards
  hasCommittee: boolean;
  setHasCommittee: (v: boolean) => void;
  committeeReward: string;
  setCommitteeReward: (v: string) => void;
  guestRewardAmount: string;
  setGuestRewardAmount: (v: string) => void;
  unitReward: string;
  setUnitReward: (v: string) => void;
};

export default function Card3(props: Props) {
  const {
    maxPresenters,
    setMaxPresenters,
    maxGroups,
    setMaxGroups,
    fileRequirements,
    setFileRequirements,
    hasCommittee,
    setHasCommittee,
    committeeReward,
    setCommitteeReward,
    guestRewardAmount,
    setGuestRewardAmount,
    unitReward,
    setUnitReward,
  } = props;

  const { t } = useLanguage();
  const reqListContainerRef = useRef<HTMLDivElement | null>(null);
  const shouldScrollToBottomRef = useRef(false);

  useEffect(() => {
    if (!shouldScrollToBottomRef.current) return;
    shouldScrollToBottomRef.current = false;
    const el = reqListContainerRef.current;
    el?.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [fileRequirements.length]);

  return (
    <Card id="card3" className="lg:col-span-2 scroll-mt-6 border-none shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg font-semibold">
          <div className="p-2 rounded-lg bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
            <Users className="h-5 w-5" />
          </div>
          <span className="">
            {t("configuration.title")}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Presenter Configuration */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <Users className="h-5 w-5" />
            {t("configuration.presenterConfig")}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxPresenters">{t("configuration.membersPerGroup")}</Label>
              <Input
                id="maxPresenters"
                type="number"
                min="0"
                step="1"
                placeholder={t("configuration.placeholderMaxPresenters")}
                value={maxPresenters}
                onChange={(e) => {
                  const v = e.target.value;
                  const n = Number(v);
                  setMaxPresenters(!v ? v : n < 0 ? "0" : v);
                }}
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxGroups">{t("configuration.maxGroups")}</Label>
              <Input
                id="maxGroups"
                type="number"
                min="0"
                step="1"
                placeholder={t("configuration.placeholderMaxGroups")}
                value={maxGroups}
                onChange={(e) => {
                  const v = e.target.value;
                  const n = Number(v);
                  setMaxGroups(!v ? v : n < 0 ? "0" : v);
                }}
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Committee Configuration */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <UserCheck className="h-5 w-5" />
            {t("configuration.committeeConfig")}
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3 pt-1">
              <Checkbox 
                id="hasCommittee" 
                checked={hasCommittee} 
                onCheckedChange={(checked) => {
                  const isChecked = !!checked;
                  setHasCommittee(isChecked);
                  if (isChecked) {
                    setCommitteeReward("1000");
                  } else {
                    setCommitteeReward("0");
                  }
                }} 
                className="mt-1"
              />
              <Label htmlFor="hasCommittee" className="cursor-pointer font-normal leading-relaxed">
                {t("configuration.hasCommittee")}
              </Label>
            </div>

            {hasCommittee && (
              <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-2 max-w-md">
                <Label htmlFor="committeeReward">{t("configuration.virtualRewardPerPerson")}</Label>
                <div className="relative">
                  <Gift className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="committeeReward"
                    type="number"
                    min="0"
                    step="1"
                    placeholder={t("configuration.placeholderCommitteeReward")}
                    className="pl-10"
                    value={committeeReward}
                    onChange={(e) => {
                      const v = e.target.value;
                      const n = Number(v);
                      setCommitteeReward(!v ? v : n < 0 ? "0" : v);
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Guest Rewards */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <Gift className="h-5 w-5" />
            {t("configuration.guestRewards")}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="guestRewardAmount">{t("configuration.amountPerGuest")}</Label>
              <div className="relative">
                <Gift className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="guestRewardAmount"
                  type="number"
                  min="0"
                  step="1"
                  placeholder={t("configuration.placeholderGuestReward")}
                  className="pl-10"
                  value={guestRewardAmount}
                  onChange={(e) => {
                    const v = e.target.value;
                    const n = Number(v);
                    setGuestRewardAmount(!v ? v : n < 0 ? "0" : v);
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitReward">{t("configuration.rewardUnit")}</Label>
              <Input
                id="unitReward"
                placeholder={t("configuration.placeholderUnitReward")}
                value={unitReward}
                onChange={(e) => setUnitReward(e.target.value.replace(/\s/g, ""))}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* File Requirements Section */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 font-semibold text-lg">
              <FileText className="h-5 w-5" />
              {t("configuration.fileRequirements")}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                shouldScrollToBottomRef.current = true;
                setFileRequirements([
                  ...fileRequirements,
                  {
                    name: "",
                    description: "",
                    allowedFileTypes: [FileType.pdf],
                    isRequired: true,
                  },
                ]);
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> {t("configuration.addFileReq")}
            </Button>
          </div>
          
          {fileRequirements.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground border border-dashed rounded-lg">
              {t("projectDetail.files.noRequirements")}
            </div>
          ) : (
            <div
              ref={reqListContainerRef}
              className="max-h-105 overflow-y-auto custom-scrollbar pr-2 space-y-4"
            >
              {fileRequirements.map((req, index) => (
                <div key={req.id || index} className="p-4 border rounded-lg bg-background space-y-3 relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      const newReqs = [...fileRequirements];
                      newReqs.splice(index, 1);
                      setFileRequirements(newReqs);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center pr-8">
                      <Label>{t("configuration.reqTitle")}</Label>
                      <span className="text-[10px] text-muted-foreground">
                        {req.name.length}/30
                      </span>
                    </div>
                    <Input
                      value={req.name}
                      maxLength={30}
                      onChange={(e) => {
                        const newReqs = [...fileRequirements];
                        newReqs[index].name = e.target.value;
                        setFileRequirements(newReqs);
                      }}
                      placeholder={t("configuration.placeholderReqName")}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>{t("configuration.reqDescription")}</Label>
                      <span className="text-[10px] text-muted-foreground">
                        {(req.description || "").length}/240
                      </span>
                    </div>
                    <Input
                      value={req.description || ""}
                      maxLength={240}
                      onChange={(e) => {
                        const newReqs = [...fileRequirements];
                        newReqs[index].description = e.target.value;
                        setFileRequirements(newReqs);
                      }}
                      placeholder={t("configuration.placeholderReqDesc")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t("configuration.allowedTypes")}</Label>
                    <div className="flex flex-wrap gap-4">
                      {Object.values(FileType).map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={`req-${index}-${type}`}
                            checked={req.allowedFileTypes.includes(type)}
                            onCheckedChange={(checked) => {
                              const newReqs = [...fileRequirements];
                              if (checked) {
                                if (type === FileType.url) {
                                  newReqs[index].allowedFileTypes = [FileType.url];
                                } else {
                                  newReqs[index].allowedFileTypes = newReqs[
                                    index
                                  ].allowedFileTypes.filter(
                                    (t) => t !== FileType.url
                                  );
                                  newReqs[index].allowedFileTypes.push(type);
                                }
                              } else {
                                if (newReqs[index].allowedFileTypes.length <= 1) return;
                                newReqs[index].allowedFileTypes = newReqs[
                                  index
                                ].allowedFileTypes.filter((t) => t !== type);
                              }
                              setFileRequirements(newReqs);
                            }}
                          />
                          <label
                            htmlFor={`req-${index}-${type}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 uppercase"
                          >
                            {type}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      id={`req-${index}-required`}
                      checked={req.isRequired}
                      onCheckedChange={(checked) => {
                        const newReqs = [...fileRequirements];
                        newReqs[index].isRequired = !!checked;
                        setFileRequirements(newReqs);
                      }}
                    />
                    <label htmlFor={`req-${index}-required`} className="text-sm font-medium leading-none">
                      {t("configuration.required")}
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
