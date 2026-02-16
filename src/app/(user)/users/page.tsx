"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Trophy, Calendar, Users } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { getUsers } from "@/utils/apiuser";

// Define types
interface UserStats {
  organized: number;
  participated: number;
}

interface User {
  id: string;
  username: string | null;
  name: string | null;
  image: string | null;
  description: string | null;
  role: string;
  stats: UserStats;
}

interface Meta {
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export default function UsersPage() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [page, setPage] = useState(1);

  // Simple debounce logic
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1); // Reset to page 1 on search
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const data = await getUsers({
          q: debouncedQuery,
          page: page,
          limit: 12
        });
        setUsers(data.users);
        setMeta(data.meta);
      } catch (error) {
        console.error("Failed to fetch users", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [debouncedQuery, page]);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("usersPage.title")}</h1>
          <p className="text-muted-foreground mt-2">
            {meta?.total || 0} {t("usersPage.title")}
          </p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder={t("usersPage.searchPlaceholder")} 
            className="pl-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {loading && users.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="p-0">
                <Skeleton className="h-24 w-full" />
              </CardHeader>
              <CardContent className="pt-6 text-center relative">
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                  <Skeleton className="h-24 w-24 rounded-full border-4 border-background" />
                </div>
                <Skeleton className="h-6 w-3/4 mx-auto mt-12 mb-2" />
                <Skeleton className="h-4 w-1/2 mx-auto" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : users.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {users.map((user) => (
              <Card key={user.id} className="hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
                <CardContent className="pt-8 text-center flex-grow">
                  <div className="flex justify-center mb-4">
                    <Avatar className="h-24 w-24 border-4 border-muted">
                      <AvatarImage src={user.image || ""} alt={user.name || "User"} />
                      <AvatarFallback className="text-2xl">
                        {(user.name || user.username || "?").substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <h3 className="text-xl font-semibold truncate px-2" title={user.name || ""}>
                    {user.name || "No Name"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">@{user.username || "unknown"}</p>
                  
                  {user.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 px-2">
                      {user.description}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-4 text-sm bg-muted/30 p-3 rounded-lg">
                    <div className="flex flex-col items-center">
                      <span className="flex items-center text-primary font-medium">
                        <Trophy className="w-4 h-4 mr-1" />
                        {user.stats.organized}
                      </span>
                      <span className="text-xs text-muted-foreground">{t("usersPage.organized")}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="flex items-center text-primary font-medium">
                        <Users className="w-4 h-4 mr-1" />
                        {user.stats.participated}
                      </span>
                      <span className="text-xs text-muted-foreground">{t("usersPage.participated")}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2 pb-6">
                  <Button asChild className="w-full" variant="outline">
                    <Link href={`/profile/${user.username}`}>
                      {t("usersPage.viewProfile")}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex justify-center mt-8 gap-2">
              <Button 
                variant="outline" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <div className="flex items-center px-4">
                Page {page} of {meta.totalPages}
              </div>
              <Button 
                variant="outline" 
                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                disabled={page === meta.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <div className="flex justify-center mb-4">
            <Search className="h-16 w-16 text-muted-foreground/30" />
          </div>
          <h3 className="text-xl font-semibold text-muted-foreground">
            {t("usersPage.noUsersFound")}
          </h3>
        </div>
      )}
    </div>
  );
}
