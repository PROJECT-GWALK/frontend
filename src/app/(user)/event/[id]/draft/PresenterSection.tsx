"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as DateCalendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Clock, Users } from "lucide-react";

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
  formatThaiBE: (d?: Date) => string;
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
    submissionStartDate,
    setSubmissionStartDate,
    submissionStartTime,
    setSubmissionStartTime,
    selectedSubEnd,
    setSelectedSubEnd,
    submissionEndDate,
    setSubmissionEndDate,
    submissionEndTime,
    setSubmissionEndTime,
    fieldErrors,
    calendarStartMonth,
    calendarEndMonth,
    formatThaiBE,
    selectedStart,
  } = props;

  const toDateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(
      2,
      "0"
    )}`;

  return (
    <Card id="presenter" className="scroll-mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-primary" />
          Presenter Details / รายละเอียดผู้นำเสนอ
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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

        <div className="border-t pt-6">
          <h4 className="font-medium mb-4">Submission Period / ช่วงการส่งผลงาน</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subStartDate">
                Start Date / วันที่เริ่มส่ง <span className="text-destructive">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    {formatThaiBE(selectedSubStart)}
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
                        setSubmissionStartDate(toDateStr(d));
                      }
                    }}
                    disabled={selectedStart ? (date) => date >= selectedStart : undefined}
                    formatters={{
                      formatMonthDropdown: (date) =>
                        date.toLocaleString("th-TH", { month: "long" }),
                      formatYearDropdown: (date) => String(date.getFullYear() + 543),
                    }}
                    required={false}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subStartTime">
                Start Time / เวลาเริ่มส่ง <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="subStartTime"
                  type="time"
                  step="60"
                  min="00:00"
                  max="23:59"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="subEndDate">
                End Date / วันที่สิ้นสุดส่ง <span className="text-destructive">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    {formatThaiBE(selectedSubEnd)}
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
                        setSubmissionEndDate(toDateStr(d));
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
                        date.toLocaleString("th-TH", { month: "long" }),
                      formatYearDropdown: (date) => String(date.getFullYear() + 543),
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subEndTime">
                End Time / เวลาสิ้นสุดส่ง <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="subEndTime"
                  type="time"
                  step="60"
                  min="00:00"
                  max="23:59"
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
      </CardContent>
    </Card>
  );
}
