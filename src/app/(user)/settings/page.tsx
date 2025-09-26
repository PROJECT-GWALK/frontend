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

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

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

    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);

    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
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
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
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