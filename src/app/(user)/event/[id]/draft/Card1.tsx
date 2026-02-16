"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ImageCropDialog from "@/lib/image-crop-dialog";
import {
  MapPin,
  Link as LinkIcon,
  Upload,
  Info,
  Check,
  X,
  Eye,
  HelpCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { autoResizeTextarea } from "@/utils/function";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Props = {
  eventTitle: string;
  setEventTitle: (v: string) => void;
  canCheckName: boolean;
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
  locationPlace: string;
  setLocationPlace: (v: string) => void;
  locationLink: string;
  setLocationLink: (v: string) => void;
  eventVisibility: string;
  setEventVisibility: (v: string) => void;
  fieldErrors: Record<string, string>;
};

export default function Card1(props: Props) {
  const {
    eventTitle,
    setEventTitle,
    canCheckName,
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
    locationPlace,
    setLocationPlace,
    locationLink,
    setLocationLink,
    eventVisibility,
    setEventVisibility,
    fieldErrors,
  } = props;

  const { t } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    autoResizeTextarea(textareaRef.current);
  }, [eventDescription]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const event = {
        target: {
          files: [file]
        }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      
      onBannerFileChange(event);
    }
  };

  return (
    <Card id="card1" className="lg:col-span-2 scroll-mt-6 border-none shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg font-semibold">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            <Info className="h-5 w-5" />
          </div>
          <span className="">
            {t("eventInfo.eventInformation")}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Basic Info Section */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="eventTitle">
              {t("eventInfo.eventTitle")} <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="eventTitle"
                placeholder={t("eventDraft.placeholderEventTitle")}
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={onCheckName}
                disabled={checkingName || !eventTitle.trim() || !canCheckName}
              >
                {t("eventInfo.checkName")}
              </Button>
              {canCheckName && eventTitle && nameChecked === true && (
                <div className="flex items-center gap-2 text-xs text-green-600">
                  <Check className="h-4 w-4" />
                </div>
              )}
              {canCheckName && eventTitle && nameChecked === false && (
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
            <Label htmlFor="description">{t("eventInfo.eventDescription")}</Label>
            <Textarea
              ref={textareaRef}
              id="description"
              placeholder={t("eventDraft.placeholderEventDescription")}
              rows={5}
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              className="min-h-30 resize-none overflow-hidden"
              style={{ fieldSizing: "fixed" } as CSSProperties}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("eventInfo.eventBanner")}</Label>
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
              <div className="relative border rounded-lg overflow-hidden aspect-2/1 bg-muted">
                <Image
                  src={bannerPreview}
                  alt="Event banner preview"
                  fill
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
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer aspect-2/1 flex flex-col items-center justify-center ${
                  isDragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                }`}
                onClick={openFilePicker}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">{t("eventInfo.clickToUpload")}</p>
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
        </div>

        <Separator />

        {/* Location & Visibility Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <MapPin className="h-5 w-5" />
            {t("eventDraft.locationVisibility")}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="locationPlace">{t("eventInfo.locationVenue")}</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="locationPlace"
                placeholder={t("eventDraft.placeholderLocationVenue")}
                className="pl-10"
                value={locationPlace}
                onChange={(e) => setLocationPlace(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="locationLink">
                {t("eventInfo.locationLink")}
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p className="text-sm whitespace-pre-line leading-relaxed">{t("eventInfo.locationLinkHelp")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="locationLink"
                placeholder={t("eventDraft.placeholderLocationLink")}
                className="pl-10"
                value={locationLink}
                onChange={(e) => setLocationLink(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="visibility" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              {t("eventInfo.eventVisibility")}
            </Label>
            <Select value={eventVisibility} onValueChange={setEventVisibility}>
              <SelectTrigger>
                <SelectValue placeholder={t("eventDraft.placeholderVisibility")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">{t("eventInfo.public")}</SelectItem>
                <SelectItem value="private">{t("eventInfo.private")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
