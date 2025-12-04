"use client";

import React, { useCallback, useState } from "react";
import Cropper, { Area, MediaSize } from "react-easy-crop";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type ImageCropDialogProps = {
  open: boolean;
  src: string | null;
  onOpenChange?: (open: boolean) => void;
  onCancel: () => void;
  onConfirm: (file: File, previewUrl: string) => void;
  fileName?: string;
  fileType?: string;
  aspect?: number; // default 1 (square)
  title?: string;
  quality?: number;
  outputWidth?: number;
  outputHeight?: number;
};

export default function ImageCropDialog({
  open,
  src,
  onOpenChange,
  onCancel,
  onConfirm,
  fileName,
  fileType,
  aspect = 1,
  title = "Crop to square",
  quality = 0.92,
  outputWidth,
  outputHeight,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(1);
  const [maxZoom, setMaxZoom] = useState(8);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = (_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  };

  const handleMediaLoaded = useCallback((mediaSize: MediaSize) => {
    const { naturalWidth, naturalHeight } = mediaSize;
    if (!naturalWidth || !naturalHeight) {
      setMinZoom(1);
      setMaxZoom(8);
      return;
    }
    setMinZoom(1);
    setMaxZoom(8);
    setZoom(1);
  }, []);

  const createImage = (url: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.addEventListener("load", () => resolve(img));
      img.addEventListener("error", (err) => reject(err));
      img.crossOrigin = "anonymous";
      img.src = url;
    });

  const getCroppedBlob = async (imageSrc: string, cropPixels: Area, mime: string, outW?: number, outH?: number) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    const srcW = Math.round(cropPixels.width);
    const srcH = Math.round(cropPixels.height);
    const targetW = outW ?? srcW;
    const targetH = outH ?? srcH;
    canvas.width = targetW;
    canvas.height = targetH;

    ctx.drawImage(
      image,
      Math.round(cropPixels.x),
      Math.round(cropPixels.y),
      Math.round(cropPixels.width),
      Math.round(cropPixels.height),
      0,
      0,
      targetW,
      targetH
    );

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Canvas is empty"));
          resolve(blob);
        },
        mime || "image/png",
        quality
      );
    });
  };

  const handleConfirm = async () => {
    if (!src || !croppedAreaPixels) return;
    const mime = fileType || "image/png";
    const blob = await getCroppedBlob(src, croppedAreaPixels, mime, outputWidth, outputHeight);
    const name = (fileName && `cropped-${fileName}`) || "banner-cropped.png";
    const newFile = new File([blob], name, { type: blob.type });
    const url = URL.createObjectURL(newFile);
    onConfirm(newFile, url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="relative w-full h-[420px] sm:h-[480px] bg-muted rounded-md overflow-hidden">
          {src && (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              minZoom={minZoom}
              maxZoom={maxZoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              onMediaLoaded={handleMediaLoaded}
              restrictPosition
              showGrid
              cropShape="rect"
              zoomWithScroll
            />
          )}
        </div>

        <div className="flex items-center gap-3">
          <Label htmlFor="zoom">Zoom</Label>
          <input
            id="zoom"
            type="range"
            min={minZoom}
            max={maxZoom}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" variant="outline" onClick={() => setZoom(1)}>
            Reset
          </Button>
          <Button type="button" onClick={handleConfirm}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
