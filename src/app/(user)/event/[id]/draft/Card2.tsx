"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as DateCalendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { toYYYYMMDD, formatDate } from "@/utils/function";
import { useLanguage } from "@/contexts/LanguageContext";
import { Separator } from "@/components/ui/separator";

type Props = {
  selectedStart?: Date;
  setSelectedStart: (d: Date | undefined) => void;
  setStartDate: (v: string) => void;
  startTime: string;
  setStartTime: (v: string) => void;
  selectedEnd?: Date;
  setSelectedEnd: (d: Date | undefined) => void;
  setEndDate: (v: string) => void;
  endTime: string;
  setEndTime: (v: string) => void;
  calendarStartMonth: Date;
  calendarEndMonth: Date;
  fieldErrors: Record<string, string>;

  selectedSubStart?: Date;
  setSelectedSubStart: (d: Date | undefined) => void;
  setSubmissionStartDate: (v: string) => void;
  submissionStartTime: string;
  setSubmissionStartTime: (v: string) => void;
  selectedSubEnd?: Date;
  setSelectedSubEnd: (d: Date | undefined) => void;
  setSubmissionEndDate: (v: string) => void;
  submissionEndTime: string;
  setSubmissionEndTime: (v: string) => void;
};

export default function Card2(props: Props) {
  const { dateFormat, timeFormat, t } = useLanguage();
  const {
    selectedStart,
    setSelectedStart,
    setStartDate,
    startTime,
    setStartTime,
    selectedEnd,
    setSelectedEnd,
    setEndDate,
    endTime,
    setEndTime,
    calendarStartMonth,
    calendarEndMonth,
    fieldErrors,
    selectedSubStart,
    setSelectedSubStart,
    setSubmissionStartDate,
    submissionStartTime,
    setSubmissionStartTime,
    selectedSubEnd,
    setSelectedSubEnd,
    setSubmissionEndDate,
    submissionEndTime,
    setSubmissionEndTime,
  } = props;

  return (
    <Card id="card2" className="lg:col-span-2 scroll-mt-6 border-none shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg font-semibold">
          <div className="p-2 rounded-lg bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
            <Clock className="h-5 w-5" />
          </div>
          <span className="">{t("eventTime.timeConfiguration")}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Event Time Period Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <Clock className="h-5 w-5" />
            {t("eventInfo.eventTimePeriod")}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">
                {t("eventInfo.startDate")} <span className="text-destructive">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    {formatDate(selectedStart, t("eventTime.selectDate"), dateFormat)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 flex justify-center">
                  <DateCalendar
                    mode="single"
                    captionLayout="dropdown"
                    className="mx-auto"
                    fixedWeeks
                    defaultMonth={selectedStart || new Date()}
                    startMonth={calendarStartMonth}
                    endMonth={calendarEndMonth}
                    selected={selectedStart}
                    onSelect={(d: Date | undefined) => {
                      if (d) {
                        setSelectedStart(d);
                        setStartDate(toYYYYMMDD(d));
                      }
                    }}
                    disabled={
                      selectedSubEnd || selectedSubStart
                        ? (date) => {
                            if (selectedSubEnd && date <= selectedSubEnd) return true;
                            if (selectedSubStart && date <= selectedSubStart) return true;
                            return false;
                          }
                        : undefined
                    }
                    formatters={{
                      formatMonthDropdown: (date) =>
                        date.toLocaleString(dateFormat, { month: "long" }),
                      formatYearDropdown: (date) =>
                        date.toLocaleDateString(dateFormat, { year: "numeric" }),
                    }}
                    required
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime">
                {t("eventInfo.startTime")} <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="startTime"
                  type="time"
                  step="60"
                  min="00:00"
                  max="23:59"
                  className="pl-10"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
            </div>
          </div>
          {fieldErrors.startDateTime && (
            <p className="text-xs text-destructive mt-1">{fieldErrors.startDateTime}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="endDate">
                {t("eventInfo.endDate")} <span className="text-destructive">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    disabled={!selectedStart}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    {formatDate(selectedEnd, t("eventTime.selectDate"), dateFormat)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 flex justify-center">
                  <DateCalendar
                    mode="single"
                    captionLayout="dropdown"
                    className="mx-auto"
                    fixedWeeks
                    defaultMonth={selectedEnd || selectedStart || new Date()}
                    startMonth={calendarStartMonth}
                    endMonth={calendarEndMonth}
                    selected={selectedEnd}
                    onSelect={(d: Date | undefined) => {
                      if (d) {
                        setSelectedEnd(d);
                        setEndDate(toYYYYMMDD(d));
                      }
                    }}
                    disabled={selectedStart ? (date) => date < selectedStart : undefined}
                    formatters={{
                      formatMonthDropdown: (date: Date) =>
                        date.toLocaleString(dateFormat, { month: "long" }),
                      formatYearDropdown: (date: Date) =>
                        date.toLocaleDateString(dateFormat, { year: "numeric" }),
                    }}
                    required
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">
                {t("eventInfo.endTime")} <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="endTime"
                  type="time"
                  step="60"
                  min="00:00"
                  max="23:59"
                  className="pl-10"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>
          {fieldErrors.endDateTime && (
            <p className="text-xs text-destructive mt-1">{fieldErrors.endDateTime}</p>
          )}
        </div>
        {/* Submission Period Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <CalendarIcon className="h-5 w-5" />
            {t("eventTime.submissionPeriod")}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subStartDate">
                {t("eventTime.submissionStartDate")} <span className="text-destructive">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    {formatDate(selectedSubStart, t("eventTime.selectDate"), timeFormat)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 flex justify-center">
                  <DateCalendar
                    mode="single"
                    captionLayout="dropdown"
                    className="mx-auto"
                    fixedWeeks
                    defaultMonth={selectedSubStart || new Date()}
                    startMonth={calendarStartMonth}
                    endMonth={calendarEndMonth}
                    selected={selectedSubStart}
                    onSelect={(d: Date | undefined) => {
                      if (d) {
                        setSelectedSubStart(d);
                        setSubmissionStartDate(toYYYYMMDD(d));
                      }
                    }}
                    disabled={selectedStart ? (date) => date >= selectedStart : undefined}
                    formatters={{
                      formatMonthDropdown: (date) =>
                        date.toLocaleString(timeFormat, { month: "long" }),
                      formatYearDropdown: (date) =>
                        date.toLocaleDateString(timeFormat, { year: "numeric" }),
                    }}
                    required={false}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subStartTime">
                {t("eventInfo.startTime")} <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="subStartTime"
                  type="time"
                  step="60"
                  className="pl-10"
                  value={submissionStartTime}
                  onChange={(e) => setSubmissionStartTime(e.target.value)}
                />
              </div>
            </div>
          </div>
          {fieldErrors.submissionStart && (
            <p className="text-xs text-destructive mt-1">{fieldErrors.submissionStart}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subEndDate">
                {t("eventTime.submissionEndDate")} <span className="text-destructive">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    disabled={!selectedSubStart}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    {formatDate(selectedSubEnd, t("eventTime.selectDate"), timeFormat)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 flex justify-center">
                  <DateCalendar
                    mode="single"
                    captionLayout="dropdown"
                    className="mx-auto"
                    fixedWeeks
                    defaultMonth={selectedSubEnd || selectedSubStart || new Date()}
                    startMonth={calendarStartMonth}
                    endMonth={calendarEndMonth}
                    selected={selectedSubEnd}
                    onSelect={(d: Date | undefined) => {
                      if (d) {
                        setSelectedSubEnd(d);
                        setSubmissionEndDate(toYYYYMMDD(d));
                      }
                    }}
                    disabled={
                      selectedSubStart || selectedStart
                        ? (date) => {
                            if (selectedSubStart && date < selectedSubStart) return true;
                            if (selectedStart && date >= selectedStart) return true;
                            return false;
                          }
                        : undefined
                    }
                    formatters={{
                      formatMonthDropdown: (date) =>
                        date.toLocaleString(timeFormat, { month: "long" }),
                      formatYearDropdown: (date) =>
                        date.toLocaleDateString(timeFormat, { year: "numeric" }),
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subEndTime">
                {t("eventInfo.endTime")} <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="subEndTime"
                  type="time"
                  step="60"
                  className="pl-10"
                  value={submissionEndTime}
                  onChange={(e) => setSubmissionEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>
          {fieldErrors.submissionEnd && (
            <p className="text-xs text-destructive mt-1">{fieldErrors.submissionEnd}</p>
          )}
        </div>

        <Separator />
      </CardContent>
    </Card>
  );
}
