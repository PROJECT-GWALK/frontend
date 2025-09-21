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

import { getCurrentUser, updateCurrentUser } from "@/utils/api";
import { settingsSchema, User } from "@/utils/types";

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

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
      setUser(current);

      if (current) {
        form.reset({
          username: current.username ?? "",
          name: current.name ?? "",
          description: current.description ?? "",
          image: current.image ?? "",
        });
        setPreview(current.image ?? null);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);

    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const avatarSrc: string | undefined = preview || user?.image || undefined;

  const initialsBase =
    (user?.name && user.name.trim()) || user?.username || user?.email || "NA";
  const avatarFallbackText = initialsBase.slice(0, 2).toUpperCase();

  const handleRemoveImage = () => {
    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
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
      await updateCurrentUser({ ...data, image: preview });

      toast.success("Saved changes successfully");

      const updated = await getCurrentUser();
      setUser(updated);

      if (updated) {
        form.reset({
          username: updated.username ?? "",
          name: updated.name ?? "",
          description: updated.description ?? "",
          image: updated.image ?? "",
        });
        setPreview(updated.image ?? null);
      } else {
        form.reset({
          username: "",
          name: "",
          description: "",
          image: "",
        });
        setPreview(null);
      }
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
            onSubmit={form.handleSubmit(onSubmit, (errors) => {
              console.log("Form errors:", errors);
            })}
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
