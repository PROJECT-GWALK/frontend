"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { getCountUser } from "@/utils/apiadmin";
import { User2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";


export default function AdminUserCount() {
  const [countUser, setCountUser] = useState<number>(0);
  const { t } = useLanguage();

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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{t("adminSection.totalUsers")}</CardTitle>
        <User2 className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{countUser}</div>
        <p className="text-xs text-muted-foreground">
          {t("adminSection.registeredUsers")}
        </p>
      </CardContent>
    </Card>
  );
}
