"use client";

import React, { useCallback, useState } from "react";
import Cropper, { Area, MediaSize } from "react-easy-crop";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCw, RotateCcw, RefreshCcw, Check, X } from "lucide-react";

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

function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

export default function ImageCropDialog({
  open,
  src,
  onOpenChange,
  onCancel,
  onConfirm,
  fileName,
  fileType,
  aspect = 1,
  title = "Adjust Image",
  quality = 0.92,
  outputWidth,
  outputHeight,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
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
    setRotation(0);
  }, []);

  const createImage = (url: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.addEventListener("load", () => resolve(img));
      img.addEventListener("error", (err) => reject(err));
      img.crossOrigin = "anonymous";
      img.src = url;
    });

  const getCroppedBlob = async (
    imageSrc: string,
    pixelCrop: Area,
    rotation = 0,
    mime: string,
    outW?: number,
    outH?: number
  ) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    const rotRad = getRadianAngle(rotation);

    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(image.width, image.height, rotation);

    canvas.width = bBoxWidth;
    canvas.height = bBoxHeight;

    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.translate(-image.width / 2, -image.height / 2);

    ctx.drawImage(image, 0, 0);

    const data = ctx.getImageData(pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height);

    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = pixelCrop.width;
    cropCanvas.height = pixelCrop.height;
    const cropCtx = cropCanvas.getContext("2d");
    if (!cropCtx) return null;

    cropCtx.putImageData(data, 0, 0);

    if (outW && outH) {
      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = outW;
      finalCanvas.height = outH;
      const finalCtx = finalCanvas.getContext("2d");
      if (!finalCtx) return null;

      finalCtx.drawImage(cropCanvas, 0, 0, outW, outH);

      return new Promise<Blob>((resolve, reject) => {
        finalCanvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Canvas is empty"));
            resolve(blob);
          },
          mime,
          quality
        );
      });
    }

    return new Promise<Blob>((resolve, reject) => {
      cropCanvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Canvas is empty"));
          resolve(blob);
        },
        mime,
        quality
      );
    });
  };

  const handleConfirm = async () => {
    if (!src || !croppedAreaPixels) return;
    try {
      const mime = fileType || "image/png";
      const blob = await getCroppedBlob(src, croppedAreaPixels, rotation, mime, outputWidth, outputHeight);
      if (!blob) return;
      
      const name = (fileName && `cropped-${fileName}`) || "image-cropped.png";
      const newFile = new File([blob], name, { type: blob.type });
      const url = URL.createObjectURL(newFile);
      onConfirm(newFile, url);
    } catch (e) {
      console.error(e);
    }
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setCrop({ x: 0, y: 0 });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden bg-card">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-medium">{title}</DialogTitle>
            <Button type="button" variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="relative w-full h-[50vh] min-h-100 bg-[#141414]">
          {src && (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              minZoom={minZoom}
              maxZoom={maxZoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={onCropComplete}
              onMediaLoaded={handleMediaLoaded}
              restrictPosition={false}
              showGrid
              cropShape="rect"
              zoomWithScroll
              objectFit="contain"
            />
          )}
        </div>

        <div className="p-4 space-y-4 bg-background">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <ZoomOut className="w-4 h-4 text-muted-foreground" />
              <input
                type="range"
                min={minZoom}
                max={maxZoom}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 h-1.5 bg-secondary rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
              />
              <ZoomIn className="w-4 h-4 text-muted-foreground" />
              <span className="w-12 text-right text-xs text-muted-foreground tabular-nums">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            <div className="flex items-center gap-4">
              <RotateCcw className="w-4 h-4 text-muted-foreground" />
              <input
                type="range"
                min={-180}
                max={180}
                step={1}
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="flex-1 h-1.5 bg-secondary rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
              />
              <RotateCw className="w-4 h-4 text-muted-foreground" />
              <span className="w-12 text-right text-xs text-muted-foreground tabular-nums">
                {rotation}°
              </span>
            </div>
          </div>
        </div>
        <DialogFooter className="p-4 border-t flex items-center justify-between">
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={handleReset}
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="button" onClick={handleConfirm}>
              <Check className="w-4 h-4 mr-2" />
              Apply
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
