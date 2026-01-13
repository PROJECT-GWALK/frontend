'use client';
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gift, MessageSquare, Trophy } from 'lucide-react';

export default function RewardTabs() {
  const [virtualReward, setVirtualReward] = useState('');
  const [comment, setComment] = useState('');
  const [specialReward, setSpecialReward] = useState('');

  const specialRewards = [
    'รางวัลคนเหงาแห่งปี',
    
  ];

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        
        <Tabs defaultValue="virtual" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="virtual" className="flex items-center gap-2">
              <Gift className="w-4 h-4" />
              Virtual Reward
            </TabsTrigger>
            <TabsTrigger value="comment" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              คอมเม้น
            </TabsTrigger>
            <TabsTrigger value="special" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Special Reward
            </TabsTrigger>
          </TabsList>

          <TabsContent value="virtual">
            <Card>
              <CardHeader>
                <CardTitle>Virtual Reward</CardTitle>
                <CardDescription>
                  จัดการรางวัลเสมือนของคุณ
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-6 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">My Virtual Reward</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {virtualReward || '0'} คะแนน
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="virtual-amount">จำนวน Virtual Reward</Label>
                  <Input
                    id="virtual-amount"
                    type="number"
                    placeholder="กรอกจำนวนคะแนน"
                    value={virtualReward}
                    onChange={(e) => setVirtualReward(e.target.value)}
                    className="text-lg"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comment">
            <Card>
              <CardHeader>
                <CardTitle>คอมเม้น</CardTitle>
                <CardDescription>
                  แสดงความคิดเห็นของคุณ
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="comment-text">ข้อความคอมเม้น</Label>
                  <Textarea
                    id="comment-text"
                    placeholder="เขียนคอมเม้นของคุณที่นี่..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[200px] text-base"
                  />
                  <p className="text-sm text-gray-500">
                    {comment.length} ตัวอักษร
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="special">
            <Card>
              <CardHeader>
                <CardTitle>Special Reward</CardTitle>
                <CardDescription>
                  เลือกรางวัลพิเศษของคุณ
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="special-select">เลือกรางวัลพิเศษ</Label>
                  <Select value={specialReward} onValueChange={setSpecialReward}>
                    <SelectTrigger id="special-select" className="text-base">
                      <SelectValue placeholder="-- เลือกรางวัล --" />
                    </SelectTrigger>
                    <SelectContent>
                      {specialRewards.map((reward, index) => (
                        <SelectItem key={index} value={reward}>
                          {reward}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {specialReward && (
                  <div className="p-6 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg border-2 border-yellow-300">
                    <p className="text-sm text-gray-600 mb-2">รางวัลที่เลือก:</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {specialReward}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}