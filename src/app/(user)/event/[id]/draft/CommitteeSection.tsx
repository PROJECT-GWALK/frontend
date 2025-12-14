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
    <Card id="committee" className="scroll-mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserCheck className="h-5 w-5 text-primary" />
          Committee & Guest Details / คณะกรรมการและผู้เข้าร่วม
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="hasCommittee" checked={hasCommittee} onCheckedChange={(checked) => setHasCommittee(!!checked)} />
            <Label htmlFor="hasCommittee" className="cursor-pointer">Event has committee members / มีคณะกรรมการในงาน</Label>
          </div>

          {hasCommittee && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
              <div className="space-y-2">
                <Label htmlFor="committeeReward">Virtual Rewards per Person / รางวัลเสมือนต่อคน</Label>
                <div className="relative">
                  <Gift className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="committeeReward"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="e.g. 100"
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
            </div>
          )}
        </div>

        <div className="border-t pt-6 space-y-4">
          <div className="space-y-2 max-w-xs">
            <Label htmlFor="guestRewardAmount">Virtual Rewards Amount per Guest / จำนวนรางวัลเสมือนต่อผู้เข้าร่วม</Label>
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
          <div className="space-y-2 max-w-xs">
            <Label>Unit / หน่วย</Label>
            <Input
              placeholder="เช่น บาท, Coin, คะแนน"
              value={unitReward}
              onChange={(e) => setUnitReward(e.target.value.replace(/\s/g, ""))}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
