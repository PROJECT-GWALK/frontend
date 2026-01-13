"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Gift, UserCheck } from "lucide-react";
 

type Props = {
  hasCommittee: boolean;
  setHasCommittee: (v: boolean) => void;
  committeeReward: string;
  setCommitteeReward: (v: string) => void;
  guestRewardAmount: string;
  setGuestRewardAmount: (v: string) => void;
  unitReward: string;
  setUnitReward: (v: string) => void;
};

export default function CommitteeSection({
  hasCommittee,
  setHasCommittee,
  committeeReward,
  setCommitteeReward,
  guestRewardAmount,
  setGuestRewardAmount,
  unitReward,
  setUnitReward,
}: Props) {
  return (
    <>
      <Card id="committee-config" className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              <UserCheck className="h-5 w-5" />
            </div>
            <span className="">
              Committee Configuration / ตั้งค่าคณะกรรมการ
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
              Event has committee members / มีคณะกรรมการในงาน
            </Label>
          </div>

          {hasCommittee && (
            <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-2">
              <Label htmlFor="committeeReward">Virtual Rewards per Person / รางวัลเสมือนต่อคน</Label>
              <div className="relative">
                <Gift className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="committeeReward"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g. 1000"
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
        </CardContent>
      </Card>

      <Card id="guest-rewards" className="border-none shadow-md ">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className="p-2 rounded-lg bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              <Gift className="h-5 w-5" />
            </div>
            <span className="">
              Guest Rewards / รางวัลผู้เข้าร่วม
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="guestRewardAmount">Amount per Guest / จำนวนต่อผู้เข้าร่วม</Label>
            <div className="relative">
              <Gift className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="guestRewardAmount"
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 50"
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
            <Label htmlFor="unitReward">Reward Unit / หน่วยของรางวัล</Label>
            <Input
              id="unitReward"
              placeholder="e.g. THB, Coin, Points"
              value={unitReward}
              onChange={(e) => setUnitReward(e.target.value.replace(/\s/g, ""))}
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
