"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { getCountUser } from "@/utils/apiadmin";
import { User2 } from "lucide-react";

export default function AdminUserCount() {
  const [countUser, setCountUser] = useState<number>(0);

  const fetchData = async () => {
    try {
      const data = await getCountUser();
      setCountUser(data.totalUsers);
    } catch (err) {
      console.error("Failed to fetch user count:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <User2 /> Users
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-4xl font-bold">{countUser}</p>
        <p className="text-sm text-muted-foreground">Total registered users</p>
      </CardContent>
    </Card>
  );
}
