"use client";
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Gift, MessageSquare, Trophy, ArrowLeft, Loader2, Share2, ClipboardCopy } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import * as QRCode from "qrcode";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import SelectTeam from '../../../components/selectTeam';
import { generateQrCode } from "@/utils/function";

export default function ScorePage() {
  const params = useParams();
  const router = useRouter();
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

  const [shareOpen, setShareOpen] = useState(false);
  const [shareQrSrc, setShareQrSrc] = useState<string | null>(null);

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

  // Generate QR Code
  useEffect(() => {
    const gen = async () => {
      const url = `${window.location.origin}/event/${eventId}/Projects/${projectId}/Scores`;
      try {
        const qr = await generateQrCode(url);
        setShareQrSrc(qr);
      } catch (e) {
        // ignore
      }
    };
    if (typeof window !== 'undefined') {
        gen();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
         <div className="max-w-4xl mx-auto space-y-6">
           <div className="flex justify-between items-center">
             <div className="flex gap-4">
                <Skeleton className="h-10 w-10 rounded-md" />
                <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                </div>
             </div>
             <Skeleton className="h-10 w-48" />
           </div>
           <Skeleton className="h-64 w-full rounded-xl" />
           <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-64 w-full" />
           </div>
         </div>
      </div>
    );
  }

  if (!event || !team) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Project not found</h2>
                <Button variant="outline" onClick={() => router.back()}>
                    Go Back
                </Button>
            </div>
        </div>
    );
  }

  // Check access
  if (myRole !== "COMMITTEE" && myRole !== "GUEST") {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Access Restricted</h2>
                <p className="text-muted-foreground">Only Committee and Guests can access this page.</p>
                <Button variant="outline" onClick={() => router.push(`/event/${eventId}`)}>
                    Back to Event
                </Button>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="flex items-center gap-3">
              <Link href={`/event/${eventId}/Projects/${projectId}`}>
                 <Button variant="outline" size="icon" className="h-10 w-10 shrink-0">
                    <ArrowLeft className="w-4 h-4" />
                 </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Evaluate</h1>
                <p className="text-sm text-muted-foreground">Manage rewards and feedback for {team.teamName}</p>
              </div>
           </div>
           <div className="flex items-center gap-2 w-full md:w-auto">
               <Button
                 variant="secondary"
                 size="sm"
                 className="shadow-sm"
                 onClick={() => setShareOpen(true)}
               >
                 <Share2 className="w-4 h-4 mr-2" />
                 Share Evaluation
               </Button>
               <SelectTeam className="w-full md:w-[250px]" />
           </div>
        </div>

        {/* Hero Section */}
        <div className="relative w-full aspect-video md:aspect-[21/9] overflow-hidden rounded-xl shadow-sm bg-black group ring-1 ring-border">
            <Image 
              src={team.imageCover || "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&q=80"}
              alt={team.teamName} 
              width={800}
              height={450}
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105 opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 p-6 md:p-8 text-white w-full">
              <h3 className="text-3xl font-bold mb-2 tracking-tight">{team.teamName}</h3>
              <p className="text-gray-200 line-clamp-2 max-w-2xl text-sm md:text-base opacity-90">{team.description}</p>
            </div>
        </div>
        
        {/* Content Tabs */}
        <Tabs defaultValue="virtual" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-card border shadow-sm rounded-lg mb-6">
            <TabsTrigger 
                value="virtual" 
                className="flex items-center gap-2 py-3 data-[state=active]:bg-purple-50 dark:data-[state=active]:bg-purple-900/20 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-300 data-[state=active]:border-purple-200 dark:data-[state=active]:border-purple-800"
            >
              <Gift className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Virtual Reward</span>
              <span className="sm:hidden font-medium">VR</span>
            </TabsTrigger>
            <TabsTrigger 
                value="comment" 
                className="flex items-center gap-2 py-3 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300 data-[state=active]:border-blue-200 dark:data-[state=active]:border-blue-800"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Comment</span>
              <span className="sm:hidden font-medium">Comment</span>
            </TabsTrigger>
            
            {myRole === "COMMITTEE" && (
                <TabsTrigger 
                    value="special" 
                    className="flex items-center gap-2 py-3 data-[state=active]:bg-yellow-50 dark:data-[state=active]:bg-yellow-900/20 data-[state=active]:text-yellow-700 dark:data-[state=active]:text-yellow-300 data-[state=active]:border-yellow-200 dark:data-[state=active]:border-yellow-800"
                >
                <Trophy className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">Special Reward</span>
                <span className="sm:hidden font-medium">Special</span>
                </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="virtual" className="mt-0 focus-visible:outline-none">
            <Card className="border shadow-sm bg-card">
              <CardHeader className="pb-4 border-b bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Gift className="w-5 h-5 text-purple-600" />
                            Virtual Reward
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Allocate Virtual Reward points to this team.
                        </CardDescription>
                    </div>
                    <div className="text-right hidden md:block">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Remaining Points</p>
                        <p className="text-2xl font-bold text-foreground">{myVirtualTotal - myVirtualUsed}</p>
                    </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-8 pt-6">
                
                {/* Usage Stats */}
                <div className="space-y-3">
                    <div className="flex justify-between items-end">
                        <p className="text-sm font-medium text-muted-foreground">Budget Usage</p>
                        <div className="flex items-baseline gap-1 md:hidden">
                            <span className="text-sm text-muted-foreground">Remaining:</span>
                            <span className="font-bold text-foreground">{myVirtualTotal - myVirtualUsed}</span>
                        </div>
                    </div>
                    
                    <div className="relative h-4 w-full bg-muted rounded-full overflow-hidden shadow-inner">
                        <div 
                            className="absolute top-0 left-0 h-full bg-purple-600 transition-all duration-500 ease-out rounded-full"
                            style={{ width: `${Math.min(100, (myVirtualUsed / (myVirtualTotal || 1)) * 100)}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground font-medium">
                        <span>0 Used</span>
                        <span>{Math.round((myVirtualUsed / (myVirtualTotal || 1)) * 100)}% Budget Used</span>
                        <span>{myVirtualTotal} Total</span>
                    </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="virtual-amount" className="text-base font-semibold text-foreground">Points Amount</Label>
                    <p className="text-sm text-muted-foreground">Enter the amount of points you want to award this team.</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                      {[100, 500, 1000].map(amount => (
                          <Button 
                            key={amount} 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setVirtualReward(amount)}
                            className="h-8 text-xs font-medium hover:border-purple-300 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 dark:hover:text-purple-300 dark:hover:border-purple-800 transition-colors"
                          >
                            {amount}
                          </Button>
                      ))}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setVirtualReward(myVirtualTotal - myVirtualUsed)}
                        className="h-8 text-xs font-medium text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
                      >
                        Max ({myVirtualTotal - myVirtualUsed})
                      </Button>
                  </div>

                  <div className="flex gap-3">
                    <div className="relative flex-1">
                        <Input
                            id="virtual-amount"
                            type="number"
                            placeholder="0"
                            min="0"
                            value={virtualReward}
                            onChange={(e) => setVirtualReward(Number(e.target.value))}
                            className="pl-4 h-12 text-lg font-medium"
                        />
                    </div>
                    <Button 
                        variant="outline" 
                        onClick={() => setVirtualReward(0)}
                        className="h-12 px-6"
                    >
                        Reset
                    </Button>
                  </div>
                </div>
                
                <div className="pt-2">
                    <Button 
                        className="w-full h-11 text-base font-medium bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700 text-white shadow-md transition-all hover:shadow-lg" 
                        onClick={handleSaveVr}
                        disabled={savingVr}
                    >
                        {savingVr ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : "Confirm Allocation"}
                    </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comment" className="mt-0 focus-visible:outline-none">
            <Card className="border shadow-sm bg-card">
              <CardHeader className="pb-4 border-b bg-muted/50">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Comment
                </CardTitle>
                <CardDescription className="mt-1">
                  Share your feedback and suggestions for the team.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-3">
                  <Label htmlFor="comment-text" className="text-base font-semibold text-foreground">Your Feedback</Label>
                  <Textarea
                    id="comment-text"
                    placeholder="Write your feedback here... (What did you like? What can be improved?)"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[200px] text-base leading-relaxed resize-y p-4 shadow-sm focus-visible:ring-blue-500 bg-background"
                  />
                  <div className="flex justify-end">
                    <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">
                        {comment.length} characters
                    </span>
                  </div>
                </div>
                
                <Button 
                    className="w-full h-11 text-base font-medium bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white shadow-md transition-all hover:shadow-lg" 
                    onClick={handleSaveComment}
                    disabled={savingComment}
                >
                    {savingComment ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : "Submit Feedback"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {myRole === "COMMITTEE" && (
            <TabsContent value="special" className="mt-0 focus-visible:outline-none">
                <Card className="border shadow-sm bg-card">
                <CardHeader className="pb-4 border-b bg-muted/50">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Trophy className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                        Special Reward
                    </CardTitle>
                    <CardDescription className="mt-1">
                    Select special awards to nominate this team for (Multi-select allowed).
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 pt-6">
                    <div className="space-y-4">
                        <Label className="text-base font-semibold text-foreground">Select Rewards</Label>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full justify-between h-12 text-left font-normal px-4">
                                    <span className="truncate">
                                        {selectedSpecialRewards.length > 0 
                                            ? `${selectedSpecialRewards.length} rewards selected` 
                                            : "Select special rewards..."}
                                    </span>
                                    <Trophy className="ml-2 h-4 w-4 opacity-50 shrink-0" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[200px]" align="start">
                                <DropdownMenuLabel>Available Rewards</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                    {event.specialRewards?.map((reward) => {
                                        const disabled = isRewardDisabled(reward.id);
                                        return (
                                        <DropdownMenuCheckboxItem
                                            key={reward.id}
                                            checked={selectedSpecialRewards.includes(reward.id)}
                                            onCheckedChange={() => toggleSpecialReward(reward.id)}
                                            disabled={disabled}
                                            className="cursor-pointer py-2.5"
                                        >
                                            <span className={disabled ? "text-muted-foreground line-through opacity-70" : "font-medium"}>
                                                {reward.name} {disabled && "(Already awarded)"}
                                            </span>
                                        </DropdownMenuCheckboxItem>
                                        );
                                    })}
                                    {(!event.specialRewards || event.specialRewards.length === 0) && (
                                        <div className="p-4 text-center text-sm text-muted-foreground">No special rewards available</div>
                                    )}
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Selected Tags Display */}
                        <div className="min-h-[60px] p-4 rounded-lg bg-muted/50 border border-dashed border-border">
                            {selectedSpecialRewards.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {selectedSpecialRewards.map(id => {
                                        const r = event.specialRewards?.find(sr => sr.id === id);
                                        return r ? (
                                            <div key={id} className="animate-in fade-in zoom-in duration-200 flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-full text-sm font-medium border border-yellow-200 dark:border-yellow-800 shadow-sm">
                                                <Trophy className="w-3.5 h-3.5" />
                                                {r.name}
                                                <button 
                                                    onClick={() => toggleSpecialReward(id)}
                                                    className="ml-1 rounded-full hover:bg-yellow-200 dark:hover:bg-yellow-800 p-0.5 focus:outline-none"
                                                >
                                                    <span className="sr-only">Remove</span>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                                </button>
                                            </div>
                                        ) : null;
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm py-2">
                                    <Trophy className="w-8 h-8 opacity-20 mb-1" />
                                    <span>No rewards selected yet</span>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <Button 
                        className="w-full h-11 text-base font-medium bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-md transition-all hover:shadow-lg" 
                        onClick={handleSaveSpecial}
                        disabled={savingSpecial}
                    >
                        {savingSpecial ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : "Save Special Rewards"}
                    </Button>
                </CardContent>
                </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
        {/* Share Dialog */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Evaluation Link</DialogTitle>
            <DialogDescription>
              Scan the QR code or copy the link to invite others to evaluate this project.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-6 py-4">
            {shareQrSrc ? (
              <div className="relative group/qr">
                 <Image 
                    src={shareQrSrc} 
                    alt="Project QR" 
                    width={240} 
                    height={240} 
                    className="rounded-lg border shadow-sm" 
                 />
              </div>
            ) : (
              <Skeleton className="w-[240px] h-[240px] rounded-lg" />
            )}
            
            <div className="flex w-full gap-2">
              <Input 
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/event/${eventId}/Projects/${projectId}/Scores`} 
                readOnly 
                className="bg-muted text-sm font-mono"
              />
              <Button size="icon" variant="outline" onClick={() => {
                const url = `${window.location.origin}/event/${eventId}/Projects/${projectId}/Scores`;
                navigator.clipboard.writeText(url);
                toast.success("Copied to clipboard");
              }}>
                <ClipboardCopy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

