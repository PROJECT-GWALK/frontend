"use client";

import AdminEventCount from "@/components/admin/event-count";
import AdminUserChart from "@/components/admin/user-chart";
import AdminUserCount from "@/components/admin/user-count";

export default function AdminDashboardPage() {
  return (
    <div className="flex justify-center">
      <div className="space-y-4 w-full max-w-6xl">
        <div className="flex space-x-4">
          <AdminUserCount />
          <AdminEventCount />
        </div>

        <AdminUserChart />
      </div>
    </div>
  );
}
