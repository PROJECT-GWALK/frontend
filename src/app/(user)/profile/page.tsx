"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCurrentUser } from "@/utils/apiuser";
import { linkify } from "@/utils/function";
import { User } from "@/utils/types";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [modeparticipated, setModeparticipated] = useState(true);

  const fetchUser = async () => {
    try {
      const data = await getCurrentUser();
      setUser(data.user);
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-4xl">
        <CardContent>
          <div className="flex space-x-4 flex-wrap text-center md:text-start">
            <div className="flex items-center justify-center w-full md:w-fit">
              <Avatar className="h-32 w-32 select-none">
                <AvatarImage src={user?.image || ""} />
                <AvatarFallback>
                  {user?.name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex flex-col justify-center w-full md:w-fit">
              <span className="text-2xl font-bold">{user?.name}</span>
              <span className="opacity-75">@{user?.username}</span>
              {user?.description && (
                <div className="mt-3">
                  <span className="block text-sm font-medium text-muted-foreground">
                    Bio
                  </span>
                  <p className="text-sm whitespace-pre-line italic text-gray-700 dark:text-gray-300">
                    {linkify(user.description)}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between mt-10 mb-4">
            <div className="flex space-x-2">
              <Button
                variant={modeparticipated ? "secondary" : "outline"}
                onClick={() => setModeparticipated(true)}
                className={modeparticipated ? "underline" : ""}
              >
                Participated
              </Button>
              <Separator orientation="vertical" />
            </div>
            <div className="flex space-x-2">
              <Separator orientation="vertical" />
              <Button
                variant={modeparticipated ? "outline" : "secondary"}
                onClick={() => setModeparticipated(false)}
                className={modeparticipated ? "" : "underline"}
              >
                Organized
              </Button>
            </div>
          </div>

          {modeparticipated ? (
            <div>
              <Table className="w-full">
                <TableCaption>A list of event your Participated.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead className="text-center">Place</TableHead>
                    <TableHead className="text-right">Special Reward</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">
                      Software Final Project
                    </TableCell>
                    <TableCell>Doctor Web App</TableCell>
                    <TableCell className="text-center">1</TableCell>
                    <TableCell className="text-right">AI ยอดเยี่ยม</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          ) : (
            <div>
              <Table className="w-full ">
                <TableCaption>A list of event your Organized.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead className="text-right">Rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">
                      <Link href="#">Software Final Project Test</Link>
                    </TableCell>
                    <TableCell className="text-right">AI ยอดเยี่ยม</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
