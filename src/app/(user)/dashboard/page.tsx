"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react"; // ✅ import icon
import { CalendarPlus } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-2xl font-bold">Dashboard</CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="relative w-full col-span-3">
              <Input
                placeholder="Search events"
                className="w-full pr-10"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5" />
            </div>
            <div className="col-span-1">
              <Button className="w-full">
                Create Event!
                <CalendarPlus />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}