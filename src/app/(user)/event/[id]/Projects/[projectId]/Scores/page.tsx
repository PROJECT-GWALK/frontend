"use client";
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Gift, MessageSquare, Trophy } from 'lucide-react';
import { useParams } from 'next/navigation';
import { getEvent, getTeamById, giveVr, giveSpecial, giveComment } from '@/utils/apievent';
import { EventData, Team } from '@/utils/types';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function ScorePage() {
  const params = useParams();
  const eventId = params.id as string;
  const projectId = params.projectId as string;

  const [event, setEvent] = useState<EventData | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  const [virtualReward, setVirtualReward] = useState<number>(0); // Current input
  const [comment, setComment] = useState('');
  const [selectedSpecialRewards, setSelectedSpecialRewards] = useState<string[]>([]);
  
  const [savingVr, setSavingVr] = useState(false);
  const [savingComment, setSavingComment] = useState(false);
  const [savingSpecial, setSavingSpecial] = useState(false);

  // Derived state
  const myVirtualTotal = event?.myVirtualTotal || 0;
  const myVirtualUsed = event?.myVirtualUsed || 0;
  const myRole = event?.myRole;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [eventRes, teamRes] = await Promise.all([
            getEvent(eventId),
            getTeamById(eventId, projectId)
        ]);
        
        setEvent(eventRes.event);
        setTeam(teamRes.team);
        
        // Initialize inputs
        setVirtualReward(teamRes.team.myReward || 0);
        setComment(teamRes.team.myComment || "");
        setSelectedSpecialRewards(teamRes.team.mySpecialRewards || []);

      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    if (eventId && projectId) {
        fetchData();
    }
  }, [eventId, projectId]);

  const handleSaveVr = async () => {
    if (!event || !team) return;
    try {
        setSavingVr(true);
        const res = await giveVr(eventId, projectId, Number(virtualReward));
        
        // Update local state directly from response
        setEvent(prev => prev ? ({
            ...prev,
            myVirtualTotal: res.totalLimit,
            myVirtualUsed: res.totalUsed
        }) : prev);

        toast.success("Virtual Reward saved");
    } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to save VR");
    } finally {
        setSavingVr(false);
    }
  };

  const handleSaveComment = async () => {
    try {
        setSavingComment(true);
        await giveComment(eventId, projectId, comment);
        toast.success("Comment saved");
    } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to save comment");
    } finally {
        setSavingComment(false);
    }
  };

  const handleSaveSpecial = async () => {
    try {
        setSavingSpecial(true);
        await giveSpecial(eventId, projectId, selectedSpecialRewards);
        toast.success("Special Rewards saved");
    } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to save special rewards");
    } finally {
        setSavingSpecial(false);
    }
  };

  const toggleSpecialReward = (rewardId: string) => {
    setSelectedSpecialRewards(prev => {
        if (prev.includes(rewardId)) {
            return prev.filter(id => id !== rewardId);
        } else {
            return [...prev, rewardId];
        }
    });
  };

  const isRewardDisabled = (rewardId: string) => {
    // A reward is disabled if it's NOT currently assigned to this team (server state)
    // AND it's NOT in the list of unused awards.
    // This means it's used by another team.
    const assignedToThisTeam = team?.mySpecialRewards?.includes(rewardId);
    const isUnused = event?.awardsUnused?.some(r => r.id === rewardId);
    return !assignedToThisTeam && !isUnused;
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!event || !team) return <div className="p-8 text-center">Project not found</div>;

  // Check access
  if (myRole !== "COMMITTEE" && myRole !== "GUEST") {
      return <div className="p-8 text-center text-red-500">Access Restricted: Committee and Guest only</div>;
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        
          <div className="relative w-full aspect-video md:aspect-2/1 md:h-[400px] overflow-hidden rounded-xl mb-6 group">
            <img 
              src={team.imageCover || "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&q=80"}
              alt={team.teamName} 
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"></div>
            <div className="absolute bottom-6 left-6 text-white">
              <h3 className="text-3xl font-bold mb-2">{team.teamName}</h3>
              <p className="text-gray-200 line-clamp-2 max-w-2xl">{team.description}</p>
            </div>
          </div>
        
        <Tabs defaultValue="virtual" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 h-auto p-1 bg-gray-100/50">
            <TabsTrigger value="virtual" className="flex items-center gap-2 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Gift className="w-4 h-4" />
              <span className="hidden sm:inline">Virtual Reward</span>
              <span className="sm:hidden">VR</span>
            </TabsTrigger>
            <TabsTrigger value="comment" className="flex items-center gap-2 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Comment</span>
              <span className="sm:hidden">Comment</span>
            </TabsTrigger>
            
            {myRole === "COMMITTEE" && (
                <TabsTrigger value="special" className="flex items-center gap-2 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Trophy className="w-4 h-4" />
                <span className="hidden sm:inline">Special Reward</span>
                <span className="sm:hidden">Special</span>
                </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="virtual" className="mt-0">
            <Card className="border-0 shadow-lg bg-white/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-purple-600" />
                    Virtual Reward
                </CardTitle>
                <CardDescription>
                  Give your Virtual Rewards to this team.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">Virtual Reward Usage</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-purple-600">{myVirtualUsed}</span>
                                <span className="text-lg text-slate-400 font-medium">/ {myVirtualTotal}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium text-slate-500 mb-1">Remaining</p>
                            <p className="text-xl font-bold text-slate-700">{myVirtualTotal - myVirtualUsed}</p>
                        </div>
                    </div>
                    
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
                        <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${Math.min(100, (myVirtualUsed / (myVirtualTotal || 1)) * 100)}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                        <span>0</span>
                        <span>{Math.round((myVirtualUsed / (myVirtualTotal || 1)) * 100)}% Used</span>
                        <span>{myVirtualTotal}</span>
                    </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="virtual-amount">Amount (Points)</Label>
                  <div className="flex gap-2">
                    <Input
                        id="virtual-amount"
                        type="number"
                        placeholder="0"
                        min="0"
                        value={virtualReward}
                        onChange={(e) => setVirtualReward(Number(e.target.value))}
                        className="text-lg"
                    />
                    <Button variant="outline" onClick={() => setVirtualReward(0)}>Reset</Button>
                  </div>
                </div>
                
                <Button 
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white" 
                    onClick={handleSaveVr}
                    disabled={savingVr}
                >
                    {savingVr ? "Saving..." : "Save Virtual Reward"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comment" className="mt-0">
            <Card className="border-0 shadow-lg bg-white/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    Comment
                </CardTitle>
                <CardDescription>
                  Share your feedback for the team.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="comment-text">Your Comment</Label>
                  <Textarea
                    id="comment-text"
                    placeholder="Write your feedback here..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[200px] text-base resize-y"
                  />
                  <p className="text-sm text-gray-500 text-right">
                    {comment.length} characters
                  </p>
                </div>
                
                <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white" 
                    onClick={handleSaveComment}
                    disabled={savingComment}
                >
                    {savingComment ? "Saving..." : "Send Comment"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {myRole === "COMMITTEE" && (
            <TabsContent value="special" className="mt-0">
                <Card className="border-0 shadow-lg bg-white/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        Special Reward
                    </CardTitle>
                    <CardDescription>
                    Select special rewards for this team (Multi-select allowed).
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <Label>Select Rewards</Label>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full justify-between">
                                    {selectedSpecialRewards.length > 0 
                                        ? `${selectedSpecialRewards.length} Selected` 
                                        : "Select Rewards"}
                                    <Trophy className="ml-2 h-4 w-4 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[200px]">
                                <DropdownMenuLabel>Available Rewards</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {event.specialRewards?.map((reward) => {
                                    const disabled = isRewardDisabled(reward.id);
                                    return (
                                    <DropdownMenuCheckboxItem
                                        key={reward.id}
                                        checked={selectedSpecialRewards.includes(reward.id)}
                                        onCheckedChange={() => toggleSpecialReward(reward.id)}
                                        disabled={disabled}
                                    >
                                        <span className={disabled ? "text-gray-400" : ""}>
                                            {reward.name} {disabled && "(Used)"}
                                        </span>
                                    </DropdownMenuCheckboxItem>
                                    );
                                })}
                                {(!event.specialRewards || event.specialRewards.length === 0) && (
                                    <div className="p-2 text-sm text-gray-500">No special rewards available</div>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Selected Tags */}
                        {selectedSpecialRewards.length > 0 && (
                             <div className="flex flex-wrap gap-2 mt-4">
                                {selectedSpecialRewards.map(id => {
                                    const r = event.specialRewards?.find(sr => sr.id === id);
                                    return r ? (
                                        <div key={id} className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm border border-yellow-200">
                                            <Trophy className="w-3 h-3" />
                                            {r.name}
                                        </div>
                                    ) : null;
                                })}
                             </div>
                        )}
                    </div>
                    
                    <Button 
                        className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white" 
                        onClick={handleSaveSpecial}
                        disabled={savingSpecial}
                    >
                        {savingSpecial ? "Saving..." : "Save Special Rewards"}
                    </Button>
                </CardContent>
                </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
