"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

import { settingsSchema, User } from "@/utils/types";
import { getCurrentUser, updateCurrentUser } from "@/utils/apiuser";
import Cropper, { Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  // ครอบรูป: state ใหม่
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [pendingFileMeta, setPendingFileMeta] = useState<{ name: string; type: string } | null>(null);
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      username: "",
      name: "",
      description: "",
      image: "",
    },
    mode: "onSubmit",
  });

  useEffect(() => {
    (async () => {
      const current = await getCurrentUser();
      if (current) {
        setUser(current.user);
        form.reset({
          username: current.user.username ?? "",
          name: current.user.name ?? "",
          description: current.user.description ?? "",
          image: current.user.image ?? "",
        });
        setPreview(current.user.image ?? null);
      }
    })();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    // ยกเลิก preview เดิมถ้าเป็น blob
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);

    // เปิด Dialog ให้ครอบรูปก่อน
    const url = URL.createObjectURL(f);
    setCropSrc(url);
    setPendingFileMeta({ name: f.name, type: f.type || "image/png" });
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setCropOpen(true);
  };

  const onCropComplete = (_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  };

  const createImage = (url: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.addEventListener("load", () => resolve(img));
      img.addEventListener("error", (err) => reject(err));
      img.crossOrigin = "anonymous";
      img.src = url;
    });

  const getCroppedImage = async (imageSrc: string, cropPixels: Area, fileType: string) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    const width = Math.round(cropPixels.width);
    const height = Math.round(cropPixels.height);
    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(
      image,
      Math.round(cropPixels.x),
      Math.round(cropPixels.y),
      Math.round(cropPixels.width),
      Math.round(cropPixels.height),
      0,
      0,
      width,
      height
    );

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Canvas is empty"));
          resolve(blob);
        },
        fileType || pendingFileMeta?.type || "image/png",
        0.92
      );
    });
  };

  const cleanupCropState = () => {
    if (cropSrc?.startsWith("blob:")) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setPendingFileMeta(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const handleCancelCrop = () => {
    cleanupCropState();
    setCropOpen(false);
    const input = document.getElementById("imageUpload") as HTMLInputElement | null;
    if (input) input.value = "";
  };

  const handleConfirmCrop = async () => {
    try {
      if (!cropSrc || !croppedAreaPixels) return;
      const blob = await getCroppedImage(cropSrc, croppedAreaPixels, pendingFileMeta?.type || "image/png");
      const filename = (pendingFileMeta?.name && `cropped-${pendingFileMeta.name}`) || "avatar-cropped.png";
      const newFile = new File([blob], filename, { type: blob.type });

      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);

      const url = URL.createObjectURL(newFile);
      setFile(newFile);
      setPreview(url);

      setCropOpen(false);
      cleanupCropState();
    } catch (err) {
      console.error(err);
      toast.error("ครอบรูปไม่สำเร็จ");
    }
  };

  const handleCropOpenChange = (open: boolean) => {
    if (!open) {
      handleCancelCrop();
    } else {
      setCropOpen(true);
    }
  };
  const avatarSrc: string | undefined = preview || user?.image || undefined;

  const initialsBase =
    (user?.name && user.name.trim()) || user?.username || user?.email || "NA";
  const avatarFallbackText = initialsBase.slice(0, 2).toUpperCase();

  const handleRemoveImage = () => {
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview(null);
    setFile(null);
    form.setValue("image", "");

    setUser((prev) => (prev ? { ...prev, image: null } : prev));

    const input = document.getElementById(
      "imageUpload"
    ) as HTMLInputElement | null;
    if (input) input.value = "";
  };

const onSubmit = async (data: SettingsFormValues) => {
  setLoading(true);
  try {
    const formData = new FormData();
    formData.append("username", data.username || "");
    formData.append("name", data.name || "");
    formData.append("description", data.description || "");

    if (file) {
      formData.append("file", file);
    } else {
      if (!preview) {
        formData.append("image", "null");
      } else {
        formData.append("image", preview);
      }
    }

    const updated = await updateCurrentUser(formData);

    toast.success("Saved changes successfully");
    setUser(updated.user);
    setPreview(updated.user.image ?? null);

    form.reset({
      username: updated.user.username ?? "",
      name: updated.user.name ?? "",
      description: updated.user.description ?? "",
      image: updated.user.image ?? "",
    });
  } catch (err) {
    console.error(err);
    toast.error("Failed to update settings");
  } finally {
    setLoading(false);
  }
};


  const handleAutoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Dialog open={cropOpen} onOpenChange={handleCropOpenChange}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Crop to square</DialogTitle>
                </DialogHeader>

                <div className="relative w-full h-[320px] bg-muted rounded-md overflow-hidden">
                  {cropSrc && (
                    <Cropper
                      image={cropSrc}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete}
                      restrictPosition={true}
                      showGrid={false}
                    />
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Label htmlFor="zoom">Zoom</Label>
                  <input
                    id="zoom"
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="secondary" onClick={handleCancelCrop}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleConfirmCrop}>
                    Done
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {/* จบ Dialog ครอบรูป */}

            <div className="flex flex-col items-center space-y-4">
              <Avatar key={avatarSrc || "no-image"} className="h-24 w-24 select-none">
                {avatarSrc ? <AvatarImage src={avatarSrc} /> : null}
                <AvatarFallback delayMs={0}>
                  {avatarFallbackText}
                </AvatarFallback>
              </Avatar>
              <div className="flex gap-2">
                <Input
                  id="imageUpload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    document.getElementById("imageUpload")?.click()
                  }
                >
                  Change
                </Button>

                {(preview || user?.image) && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleRemoveImage}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>

            <div>
              <Label>Email</Label>
              <Input value={user?.email ?? ""} disabled />
            </div>

            <div>
              <Label htmlFor="username">Username</Label>
              <Input id="username" {...form.register("username")} />
              {form.formState.errors.username && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.username.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                onInput={handleAutoResize}
                className="overflow-hidden resize-none"
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}