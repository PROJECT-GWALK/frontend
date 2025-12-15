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
import { UserAvatar } from "@/utils/function";
import { toast } from "sonner";

import { Skeleton } from "@/components/ui/skeleton";
import { settingsSchema, User } from "@/utils/types";
import { getCurrentUser, updateCurrentUser } from "@/utils/apiuser";
import ImageCropDialog from "@/lib/image-crop-dialog";

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
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
      setFetching(false);
    })();
  }, []);

  if (fetching) {
    return (
      <div className="flex justify-center">
        <Card className="w-full max-w-4xl">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-24 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);

    const url = URL.createObjectURL(f);
    setCropSrc(url);
    setPendingFileMeta({ name: f.name, type: f.type || "image/png" });
    setCropOpen(true);
  };

  const handleCropCancel = () => {
    if (cropSrc?.startsWith("blob:")) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setPendingFileMeta(null);
    setCropOpen(false);
    const input = document.getElementById("imageUpload") as HTMLInputElement | null;
    if (input) input.value = "";
  };

  const handleCropConfirm = (newFile: File, url: string) => {
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setFile(newFile);
    setPreview(url);
    setCropOpen(false);
    if (cropSrc?.startsWith("blob:")) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setPendingFileMeta(null);
  };

  const avatarSrc: string | undefined = preview || user?.image || undefined;

  const handleRemoveImage = () => {
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview(null);
    setFile(null);
    form.setValue("image", "");
    setUser((prev) => (prev ? { ...prev, image: null } : prev));
    const input = document.getElementById("imageUpload") as HTMLInputElement | null;
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
            {/* ใช้ component ครอปภาพเพียงอย่างเดียว */}
            <ImageCropDialog
              open={cropOpen}
              src={cropSrc}
              fileName={pendingFileMeta?.name}
              fileType={pendingFileMeta?.type}
              aspect={1}
              title="Crop to square"
              onOpenChange={(o) => { if (!o) handleCropCancel(); else setCropOpen(true); }}
              onCancel={handleCropCancel}
              onConfirm={handleCropConfirm}
            />

            {/* ลบ DialogContent/Cropper แบบ inline เดิมออก */}
            {/* เดิมมี <DialogContent> ... <Cropper .../> ... </DialogContent> และ </Dialog> ที่ทำให้ ERROR */}
            {/* ส่วน Avatar และฟอร์มยังคงเดิม */}
            <div className="flex flex-col items-center space-y-4">
              <UserAvatar
                key={avatarSrc || "no-image"}
                user={user ? { ...user, image: avatarSrc } : { image: avatarSrc } as any}
                className="h-24 w-24 select-none"
              />
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