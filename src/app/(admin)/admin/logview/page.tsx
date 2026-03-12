"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { getSystemLogs, SystemLog } from "@/utils/apiadmin";
import { Search, RefreshCw, FileText, Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { th, enUS } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export default function LogViewPage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-6 flex justify-center">Loading...</div>}>
      <LogViewContent />
    </Suspense>
  );
}

function LogViewContent() {
  const { t, language } = useLanguage();
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const limit = 20;

  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSystemLogs({
        page,
        limit,
        search: debouncedSearch || undefined,
        startDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
        endDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
      });
      setLogs(res.data);
      setTotalPages(res.meta.totalPages);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, dateRange]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("adminSection.systemLogs")}</h1>
          <p className="text-muted-foreground">
            {t("adminSection.viewSystemActivities")}
          </p>
        </div>
        <Button variant="outline" onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          {t("adminSection.refresh")}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("adminSection.searchLogs")}
            className="pl-8"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1); // Reset to first page on search
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-70 justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y", { locale: language === "th" ? th : enUS })} -{" "}
                      {format(dateRange.to, "LLL dd, y", { locale: language === "th" ? th : enUS })}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y", { locale: language === "th" ? th : enUS })
                  )
                ) : (
                  <span>{t("adminSection.pickDateRange")}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={(range) => {
                  setDateRange(range);
                  setPage(1);
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          {dateRange && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setDateRange(undefined);
                setPage(1);
              }}
              title={t("adminSection.clearDateFilter")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-45">{t("adminSection.timestamp")}</TableHead>
              <TableHead className="w-37.5">{t("adminSection.action")}</TableHead>
              <TableHead>{t("adminSection.user")}</TableHead>
              <TableHead>{t("adminSection.details")}</TableHead>
              <TableHead className="w-37.5">{t("adminSection.ipAddress")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {t("homePage.loadingInline")}
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {t("adminSection.noLogsFound")}
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs">
                    {format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{log.action}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.user ? (
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">
                          {log.user.username || t("organizers.unknown")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {log.user.email}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-75 truncate" title={log.details || ""}>
                    {log.details || "-"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {log.ipAddress || "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(page - 1)}
                className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(page - p) <= 1)
              .map((p, i, arr) => {
                const prev = arr[i - 1];
                return (
                  <div key={p} className="flex items-center">
                    {prev && p - prev > 1 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationLink
                        isActive={page === p}
                        onClick={() => handlePageChange(p)}
                        className="cursor-pointer"
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  </div>
                );
              })}

            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(page + 1)}
                className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
