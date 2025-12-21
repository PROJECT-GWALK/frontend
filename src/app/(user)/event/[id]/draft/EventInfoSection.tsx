"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as DateCalendar } from "@/components/ui/calendar";
import ImageCropDialog from "@/lib/image-crop-dialog";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Link as LinkIcon,
  Upload,
  Info,
  Check,
  X,
  Eye,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toYYYYMMDD, formatDate } from "@/utils/function";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  eventTitle: string;
  setEventTitle: (v: string) => void;
  checkingName: boolean;
  nameChecked: boolean | null;
  onCheckName: () => void;
  eventDescription: string;
  setEventDescription: (v: string) => void;
  cropOpen: boolean;
  cropSrc: string | null;
  pendingFileMeta: { name: string; type: string } | null;
  onCropCancel: () => void;
  onCropConfirm: (file: File, previewUrl: string) => void;
  bannerPreview: string | null;
  openFilePicker: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onBannerFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveBanner: () => void;
  selectedStart?: Date;
  setSelectedStart: (d: Date | undefined) => void;
  startDate: string;
  setStartDate: (v: string) => void;
  startTime: string;
  setStartTime: (v: string) => void;
  selectedEnd?: Date;
  setSelectedEnd: (d: Date | undefined) => void;
  selectedSubEnd?: Date;
  selectedSubStart?: Date;
  endDate: string;
  setEndDate: (v: string) => void;
  endTime: string;
  setEndTime: (v: string) => void;
  calendarStartMonth: Date;
  calendarEndMonth: Date;
  eventVisibility: string;
  setEventVisibility: (v: string) => void;
  fieldErrors: Record<string, string>;
  locationPlace: string;
  setLocationPlace: (v: string) => void;
  locationLink: string;
  setLocationLink: (v: string) => void;
};

export default function EventInfoSection(props: Props) {
  const { dateFormat } = useLanguage();
  const {
    eventTitle,
    setEventTitle,
    checkingName,
    nameChecked,
    onCheckName,
    eventDescription,
    setEventDescription,
    cropOpen,
    cropSrc,
    pendingFileMeta,
    onCropCancel,
    onCropConfirm,
    bannerPreview,
    openFilePicker,
    fileInputRef,
    onBannerFileChange,
    onRemoveBanner,
    selectedStart,
    setSelectedStart,
    setStartDate,
    startTime,
    setStartTime,
    selectedEnd,
    setSelectedEnd,
    selectedSubEnd,
    selectedSubStart,
    setEndDate,
    endTime,
    setEndTime,
    calendarStartMonth,
    calendarEndMonth,
    eventVisibility,
    setEventVisibility,
    fieldErrors,
    locationPlace,
    setLocationPlace,
    locationLink,
    setLocationLink,
  } = props;

  return (
    <>
      <Card id="event-info" className="lg:col-span-2 scroll-mt-6 border-none shadow-md bg-gradient-to-br from-background to-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              <Info className="h-5 w-5" />
            </div>
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Event Information / ข้อมูลอีเวนต์
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="eventTitle">
              Event Title / หัวข้ออีเวนต์ <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="eventTitle"
                placeholder="Enter event title / กรอกหัวข้ออีเวนต์"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={onCheckName}
                disabled={checkingName || !eventTitle.trim()}
              >
                Check / ตรวจสอบ
              </Button>
              {eventTitle && nameChecked === true && (
                <div className="flex items-center gap-2 text-xs text-green-600">
                  <Check className="h-4 w-4" />
                </div>
              )}
              {eventTitle && nameChecked === false && (
                <div className="flex items-center gap-2 text-xs text-destructive">
                  <X className="h-4 w-4" />
                </div>
              )}
            </div>
            {fieldErrors.eventTitle && (
              <p className="text-xs text-destructive mt-1">{fieldErrors.eventTitle}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Event Description / รายละเอียดอีเวนต์</Label>
            <Textarea
              id="description"
              placeholder="Tell attendees about your event... / บอกผู้เข้าร่วมเกี่ยวกับอีเวนต์ของคุณ"
              rows={4}
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Event Banner / แบนเนอร์อีเวนต์</Label>
            <ImageCropDialog
              open={cropOpen}
              src={cropSrc}
              fileName={pendingFileMeta?.name}
              fileType={pendingFileMeta?.type}
              aspect={2}
              title="Crop to 800x400"
              outputWidth={800}
              outputHeight={400}
              onOpenChange={(o) => {
                if (!o) onCropCancel();
              }}
              onCancel={onCropCancel}
              onConfirm={onCropConfirm}
            />
            {bannerPreview ? (
              <div className="relative border rounded-lg overflow-hidden aspect-[2/1] bg-muted">
                <img
                  src={bannerPreview}
                  alt="Event banner preview"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button size="sm" variant="secondary" onClick={openFilePicker}>
                    Change
                  </Button>
                  <Button size="sm" variant="destructive" onClick={onRemoveBanner}>
                    Remove
                  </Button>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={onBannerFileChange}
                />
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer aspect-[2/1] flex flex-col items-center justify-center"
                onClick={openFilePicker}
              >
                <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, or GIF (crop to 800x400px)
                </p>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={onBannerFileChange}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Event Time Period / ช่วงเวลาอีเวนต์
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">
              Start Date / วันที่เริ่ม <span className="text-destructive">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                  {formatDate(selectedStart, "เลือกวันที่", dateFormat)}
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
              Start Time / เวลาเริ่ม <span className="text-destructive">*</span>
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
          {fieldErrors.startDateTime && (
            <p className="text-xs text-destructive mt-1">{fieldErrors.startDateTime}</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="endDate">
              End Date / วันที่สิ้นสุด <span className="text-destructive">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                  {formatDate(selectedEnd, "เลือกวันที่", dateFormat)}
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
              End Time / เวลาสิ้นสุด <span className="text-destructive">*</span>
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
          {fieldErrors.endDateTime && (
            <p className="text-xs text-destructive mt-1">{fieldErrors.endDateTime}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location & Visibility
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="locationPlace">Location / Venue / สถานที่จัดงาน</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="locationPlace"
                placeholder="e.g. Convention Center, Hall A"
                className="pl-10"
                value={locationPlace}
                onChange={(e) => setLocationPlace(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="locationLink">
              Location Link (Google Maps) / ลิงก์ตำแหน่ง (Google Maps)
            </Label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="locationLink"
                placeholder="https://maps.google.com/..."
                className="pl-10"
                value={locationLink}
                onChange={(e) => setLocationLink(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-2 border-t mt-4">
            <div className="space-y-2">
              <Label htmlFor="visibility" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Visibility / การมองเห็น
              </Label>
              <Select value={eventVisibility} onValueChange={setEventVisibility}>
                <SelectTrigger>
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public / สาธารณะ</SelectItem>
                  <SelectItem value="private">Private / ส่วนตัว</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
