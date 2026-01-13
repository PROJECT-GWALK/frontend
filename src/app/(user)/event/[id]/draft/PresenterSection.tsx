"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as DateCalendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Clock, Users, FileText, Plus, Trash2 } from "lucide-react";
import { toYYYYMMDD, formatDate } from "@/utils/function";
import { Checkbox } from "@/components/ui/checkbox";
import { EventFileType, FileType } from "@/utils/types";
import { useLanguage } from "@/contexts/LanguageContext";

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
  fileRequirements: EventFileType[];
  setFileRequirements: (v: EventFileType[]) => void;
};

export default function PresenterSection(props: Props) {
  const { timeFormat } = useLanguage();
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
    fileRequirements,
    setFileRequirements,
  } = props;



  return (
    <>
      <Card id="presenter-config" className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className="p-2 rounded-lg bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
              <Users className="h-5 w-5" />
            </div>
            <span className="">
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
              placeholder="e.g. 3"
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
              placeholder="e.g. 30"
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

      <Card id="submission-period" className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className="p-2 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <span className="">
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
                    <span className="truncate">{formatDate(selectedSubStart, "เลือกวันที่", timeFormat)}</span>
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
                    <span className="truncate">{formatDate(selectedSubEnd, "เลือกวันที่", timeFormat)}</span>
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

      <Card id="file-requirements" className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              <FileText className="h-5 w-5" />
            </div>
            <span className="">
              File Requirements / ข้อกำหนดไฟล์งาน
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {fileRequirements.map((req, index) => (
            <div key={req.id || index} className="p-4 border rounded-lg bg-background space-y-3">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1 mr-4">
                  <Label>Title / หัวข้อสิ่งที่ต้องส่ง</Label>
                  <Input
                    value={req.name}
                    onChange={(e) => {
                      const newReqs = [...fileRequirements];
                      newReqs[index].name = e.target.value;
                      setFileRequirements(newReqs);
                    }}
                    placeholder="e.g. Presentation Slides"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => {
                    const newReqs = [...fileRequirements];
                    newReqs.splice(index, 1);
                    setFileRequirements(newReqs);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Description / คำอธิบายเพิ่มเติม (Optional)</Label>
                <Input
                  value={req.description || ""}
                  onChange={(e) => {
                    const newReqs = [...fileRequirements];
                    newReqs[index].description = e.target.value;
                    setFileRequirements(newReqs);
                  }}
                  placeholder="e.g. PDF format only"
                />
              </div>

              <div className="space-y-2">
                <Label>Allowed Types / ประเภทไฟล์ที่รองรับ</Label>
                <div className="flex flex-wrap gap-4">
                  {Object.values(FileType).map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`req-${index}-${type}`}
                        checked={req.allowedFileTypes.includes(type)}
                        onCheckedChange={(checked) => {
                          const newReqs = [...fileRequirements];
                          if (checked) {
                            if (type === FileType.url) {
                              newReqs[index].allowedFileTypes = [FileType.url];
                            } else {
                              newReqs[index].allowedFileTypes = newReqs[
                                index
                              ].allowedFileTypes.filter(
                                (t) => t !== FileType.url
                              );
                              newReqs[index].allowedFileTypes.push(type);
                            }
                          } else {
                            newReqs[index].allowedFileTypes = newReqs[
                              index
                            ].allowedFileTypes.filter((t) => t !== type);
                          }
                          setFileRequirements(newReqs);
                        }}
                      />
                      <label
                        htmlFor={`req-${index}-${type}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 uppercase"
                      >
                        {type}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id={`req-${index}-required`}
                  checked={req.isRequired}
                  onCheckedChange={(checked) => {
                    const newReqs = [...fileRequirements];
                    newReqs[index].isRequired = !!checked;
                    setFileRequirements(newReqs);
                  }}
                />
                <label htmlFor={`req-${index}-required`} className="text-sm font-medium leading-none">
                  Required / จำเป็นต้องส่ง
                </label>
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            className="w-full border-dashed"
            onClick={() => {
              setFileRequirements([
                ...fileRequirements,
                {
                  name: "",
                  description: "",
                  allowedFileTypes: [FileType.pdf],
                  isRequired: true,
                },
              ]);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Add File Requirement
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
