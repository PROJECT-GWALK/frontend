"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as DateCalendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Clock, Users } from "lucide-react";
import { timeFormat } from "@/utils/settings";
import { toYYYYMMDD, formatDate } from "@/utils/function";

type Props = {
  maxPresenters: string;
  setMaxPresenters: (v: string) => void;
  maxGroups: string;
  setMaxGroups: (v: string) => void;
  selectedSubStart?: Date;
  setSelectedSubStart: (d: Date | undefined) => void;
  submissionStartDate: string;
  setSubmissionStartDate: (v: string) => void;
  submissionStartTime: string;
  setSubmissionStartTime: (v: string) => void;
  selectedSubEnd?: Date;
  setSelectedSubEnd: (d: Date | undefined) => void;
  submissionEndDate: string;
  setSubmissionEndDate: (v: string) => void;
  submissionEndTime: string;
  setSubmissionEndTime: (v: string) => void;
  fieldErrors: Record<string, string>;
  calendarStartMonth: Date;
  calendarEndMonth: Date;
  selectedStart?: Date;
};

export default function PresenterSection(props: Props) {
  const {
    maxPresenters,
    setMaxPresenters,
    maxGroups,
    setMaxGroups,
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
    fieldErrors,
    calendarStartMonth,
    calendarEndMonth,
    selectedStart,
  } = props;



  return (
    <>
      <Card id="presenter-config" className="border-none shadow-md bg-gradient-to-br from-background to-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className="p-2 rounded-lg bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
              <Users className="h-5 w-5" />
            </div>
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Presenter Configuration / ตั้งค่าผู้นำเสนอ
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="maxPresenters">Members per Group / จำนวนต่อกลุ่ม</Label>
            <Input
              id="maxPresenters"
              type="number"
              min="0"
              step="1"
              placeholder="e.g. 5"
              value={maxPresenters}
              onChange={(e) => {
                const v = e.target.value;
                const n = Number(v);
                setMaxPresenters(!v ? v : n < 0 ? "0" : v);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxGroups">Maximum Groups / จำนวนกลุ่มสูงสุด</Label>
            <Input
              id="maxGroups"
              type="number"
              min="0"
              step="1"
              placeholder="e.g. 20"
              value={maxGroups}
              onChange={(e) => {
                const v = e.target.value;
                const n = Number(v);
                setMaxGroups(!v ? v : n < 0 ? "0" : v);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card id="submission-period" className="border-none shadow-md bg-gradient-to-br from-background to-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className="p-2 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Submission Period / ช่วงเวลาส่งผลงาน
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subStartDate">
              Start Date / วันที่เริ่มส่ง <span className="text-destructive">*</span>
            </Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 justify-start font-normal min-w-0">
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{formatDate(selectedSubStart, "เลือกวันที่")}</span>
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
              <div className="relative w-full sm:w-32 shrink-0">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="subStartTime"
                  type="time"
                  step="60"
                  className="pl-9"
                  value={submissionStartTime}
                  onChange={(e) => setSubmissionStartTime(e.target.value)}
                />
              </div>
            </div>
          </div>
          {fieldErrors.submissionStart && (
            <p className="text-xs text-destructive">{fieldErrors.submissionStart}</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="subEndDate">
              End Date / วันที่สิ้นสุดส่ง <span className="text-destructive">*</span>
            </Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 justify-start font-normal min-w-0">
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{formatDate(selectedSubEnd, "เลือกวันที่")}</span>
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
              <div className="relative w-full sm:w-32 shrink-0">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="subEndTime"
                  type="time"
                  step="60"
                  className="pl-9"
                  value={submissionEndTime}
                  onChange={(e) => setSubmissionEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>
          {fieldErrors.submissionEnd && (
            <p className="text-xs text-destructive">{fieldErrors.submissionEnd}</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
