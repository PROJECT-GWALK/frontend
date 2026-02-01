"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Link,
  ClipboardCopy,
  RefreshCcw,
  Users,
  Award,
  Download,
  Share2,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import * as QRCode from "qrcode";
import { getInviteToken, refreshInviteToken } from "@/utils/apievent";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { EventData } from "@/utils/types";
import { UserAvatar } from "@/utils/function";

type Props = {
  event: EventData;
  editable?: boolean;
};

export default function CardInformation5({ event, editable }: Props) {
  const { t } = useLanguage();
  const id = event.id;

  // Organizers State
  const organizers =
    event.participants?.filter((p) => p.eventGroup === "ORGANIZER") || [];
  const [organizerListOpen, setOrganizerListOpen] = useState(false);

  // Invite Links State
  const [tokens, setTokens] = useState<{
    presenter?: string;
    guest?: string;
    committee?: string;
  }>({});
  const [qrThumbs, setQrThumbs] = useState<{
    presenter?: string;
    guest?: string;
    committee?: string;
  }>({});
  const [qrLarge, setQrLarge] = useState<{
    presenter?: string;
    guest?: string;
    committee?: string;
  }>({});

  const [eventQrThumb, setEventQrThumb] = useState<string>("");
  const [eventQrLarge, setEventQrLarge] = useState<string>("");

  // QR Modal State
  const [qrOpen, setQrOpen] = useState(false);
  const [qrSrc, setQrSrc] = useState<string>("");
  const [qrTitle, setQrTitle] = useState<string>("");

  const [refreshRole, setRefreshRole] = useState<
    "presenter" | "guest" | "committee" | null
  >(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/event/${id}`;
      QRCode.toDataURL(url, { margin: 1, width: 64 })
        .then(setEventQrThumb)
        .catch(console.error);
      QRCode.toDataURL(url, { margin: 1, width: 400 })
        .then(setEventQrLarge)
        .catch(console.error);
    }
  }, [id]);

  useEffect(() => {
    const loadTokens = async () => {
      if (!editable) return;
      try {
        const roles: Array<"presenter" | "guest" | "committee"> = [
          "presenter",
          "guest",
          "committee",
        ];
        const results = await Promise.all(
          roles.map((r) => getInviteToken(id, r).catch(() => null))
        );
        const map: { presenter?: string; guest?: string; committee?: string } =
          {};
        results.forEach((res, i) => {
          const role = roles[i];
          if (res?.message === "ok" && res?.token) {
            map[role] = res.token as string;
          }
        });
        setTokens(map);
      } catch {
        toast.error("Failed to load invite links");
      }
    };
    loadTokens();
  }, [id, editable]);

  useEffect(() => {
    const genQrs = async () => {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const roles: Array<"committee" | "presenter" | "guest"> = [
        "committee",
        "presenter",
        "guest",
      ];
      const thumbMap: {
        presenter?: string;
        guest?: string;
        committee?: string;
      } = {};
      const largeMap: {
        presenter?: string;
        guest?: string;
        committee?: string;
      } = {};
      for (const r of roles) {
        const token = tokens[r];
        if (!token) continue;
        const link = `${origin}/event/${id}/invite?token=${encodeURIComponent(
          token
        )}`;
        try {
          const large = await QRCode.toDataURL(link, {
            errorCorrectionLevel: "M",
            width: 600,
          });
          const thumb = await QRCode.toDataURL(link, {
            errorCorrectionLevel: "M",
            width: 120,
          });
          largeMap[r] = large;
          thumbMap[r] = thumb;
        } catch {
          // ignore
        }
      }
      setQrLarge(largeMap);
      setQrThumbs(thumbMap);
    };
    genQrs();
  }, [tokens, id]);

  const handleRefreshToken = async () => {
    if (!refreshRole) return;
    try {
      const res = await refreshInviteToken(id, refreshRole);
      if (res.token) {
        setTokens((prev) => ({ ...prev, [refreshRole]: res.token }));
        toast.success(`Refreshed ${refreshRole} token`);
      }
    } catch {
      toast.error("Failed to refresh token");
    } finally {
      setRefreshRole(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const showQr = (src: string, title: string) => {
    setQrSrc(src);
    setQrTitle(title);
    setQrOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Organizers Card */}
      <Card className="border-none dark:border dark:border-white/10 shadow-md hover:shadow-lg transition-all duration-300 group flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold group-hover:text-primary transition-colors">
              <div className="p-2.5 rounded-xl bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400">
                <Users className="h-5 w-5" />
              </div>
              {t("organizers.title")}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="flex flex-col gap-4 h-full">
            {organizers.length > 0 ? (
              <div className="space-y-3 flex-1">
                {organizers.slice(0, 3).map((org) => (
                  <div
                    key={org.id}
                    className="flex items-center gap-4 p-3 rounded-2xl bg-card border hover:bg-muted/50 transition-colors"
                  >
                    <UserAvatar
                      user={org.user}
                      className="h-12 w-12 border-2 border-white shadow-sm"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-sm truncate text-foreground/90">
                        {org.user?.name || t("organizers.unknown")}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-(--role-organizer)"></span>
                        {t("organizers.role")}
                      </span>
                    </div>
                  </div>
                ))}
                {organizers.length > 3 && (
                  <div className="pl-4 text-xs font-medium text-(--role-organizer) flex items-center gap-1">
                    <div className="w-6 h-px bg-pink-200"></div>+{" "}
                    {organizers.length - 3} {t("organizers.moreOrganizers")}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-8 text-center space-y-4 bg-linear-to-b from-pink-50/50 to-transparent dark:from-pink-900/10 rounded-3xl border-2 border-dashed border-pink-200 dark:border-pink-900/30">
                <div className="p-4 rounded-full bg-pink-100 dark:bg-pink-900/20 text-pink-500 dark:text-pink-400 shadow-inner">
                  <Users className="h-8 w-8" />
                </div>
                <div className="space-y-1 max-w-50 mx-auto">
                  <p className="text-base font-semibold text-foreground/80">
                    {t("organizers.noOrganizersTitle")}
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    {t("organizers.noOrganizersDesc")}
                  </p>
                </div>
              </div>
            )}

            <Button
              variant="outline"
              className="w-full justify-between mt-auto border-(--role-organizer) hover:border-(--role-organizer) hover:text-(--role-organizer) hover:bg-(--role-organizer)/50 transition-all duration-300 group/btn"
              onClick={() => setOrganizerListOpen(true)}
            >
              {t("organizers.viewAll")}
              <Users className="h-4 w-4 opacity-50 group-hover/btn:opacity-100 transition-opacity" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invite Links Card */}
      <Card className="border-none shadow-md bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <div className="p-2.5 rounded-xl bg-muted text-muted-foreground">
              <Link className="h-5 w-5" />
            </div>
            {t("invite.title") || "Invite Links"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {/* Event Page Link */}
            <div className="flex flex-col space-y-3 p-4 rounded-2xl bg-background dark:bg-muted/10 border dark:border-white/10 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                  <Link className="h-4 w-4" />
                </div>
                <span className="font-bold capitalize text-sm">
                  {t("invite.eventPage") || "Event Page"}
                </span>
              </div>

                  <div className="flex items-start gap-3">
                    {eventQrThumb && (
                      <div
                        className="relative group cursor-pointer shrink-0"
                        onClick={() =>
                          showQr(eventQrLarge || eventQrThumb, t("invite.eventPage") || "Event Page")
                        }
                      >
                        <img
                          src={eventQrThumb}
                          alt="Event Page QR"
                          className="w-16 h-16 rounded-lg border-2 border-white shadow-sm transition-transform group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs flex-1 justify-start overflow-hidden text-ellipsis whitespace-nowrap font-mono bg-muted/50"
                          onClick={() =>
                            copyToClipboard(
                              typeof window !== "undefined"
                                ? `${window.location.origin}/event/${id}`
                                : ""
                            )
                          }
                          title={
                            typeof window !== "undefined"
                              ? `${window.location.origin}/event/${id}`
                              : ""
                          }
                        >
                          <span className="truncate">
                            {typeof window !== "undefined"
                              ? `${window.location.origin}/event/${id}`
                              : `/event/${id}`}
                          </span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 shrink-0"
                          onClick={() =>
                            copyToClipboard(
                              typeof window !== "undefined"
                                ? `${window.location.origin}/event/${id}`
                                : ""
                            )
                          }
                          title="Copy Link"
                        >
                          <ClipboardCopy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {editable && (["committee", "presenter", "guest"] as const).map((role) => {
                  if (role === "committee" && !event.hasCommittee) return null;

                  const token = tokens[role];
                  const thumb = qrThumbs[role];
                  const large = qrLarge[role];
                  const inviteLink =
                    typeof window !== "undefined"
                      ? `${window.location.origin}/event/${id}/invite?token=${encodeURIComponent(
                          token || ""
                        )}`
                      : "";

                  return (
                    <div
                      key={role}
                      className="flex flex-col space-y-3 p-4 rounded-2xl bg-background dark:bg-muted/10 border dark:border-white/10 shadow-sm transition-all hover:shadow-md"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`p-2 rounded-lg ${
                            role === "presenter"
                              ? "bg-(--role-presenter)/10 text-(--role-presenter)"
                              : role === "committee"
                              ? "bg-(--role-committee)/10 text-(--role-committee)"
                              : "bg-(--role-guest)/10 text-(--role-guest)"
                          }`}
                        >
                          {role === "presenter" ? (
                            <Users className="h-4 w-4" />
                          ) : role === "committee" ? (
                            <Award className="h-4 w-4" />
                          ) : (
                            <Users className="h-4 w-4" />
                          )}
                        </div>
                        <span className="font-bold capitalize text-sm">
                          {role} {t("invite.inviteSuffix")}
                        </span>
                      </div>

                      {token ? (
                        <div className="flex items-start gap-3">
                          {thumb && (
                            <div
                              className="relative group cursor-pointer shrink-0"
                              onClick={() => showQr(large || thumb, `${role} QR`)}
                            >
                              <img
                                src={thumb}
                                alt={`${role} QR`}
                                className="w-16 h-16 rounded-lg border-2 border-white shadow-sm transition-transform group-hover:scale-105"
                              />
                            </div>
                          )}
                          <div className="flex-1 space-y-2 min-w-0">
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs flex-1 justify-start overflow-hidden text-ellipsis whitespace-nowrap font-mono bg-muted/50"
                                onClick={() => copyToClipboard(inviteLink)}
                                title={inviteLink}
                              >
                                <span className="truncate">{inviteLink}</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 shrink-0"
                                onClick={() => copyToClipboard(inviteLink)}
                                title="Copy Link"
                              >
                                <ClipboardCopy className="h-4 w-4" />
                              </Button>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-full justify-center h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setRefreshRole(role)}
                            >
                              <RefreshCcw className="h-3 w-3 mr-2" />
                              {t("invite.regenerateToken")}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground italic h-16 bg-muted/30 rounded-lg">
                          {t("invite.loading")}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* QR Code Dialog */}
          <Dialog open={qrOpen} onOpenChange={setQrOpen}>
            <DialogContent className="sm:max-w-md flex flex-col items-center">
              <DialogHeader>
                <DialogTitle className="text-center capitalize">
                  {qrTitle}
                </DialogTitle>
              </DialogHeader>
              <div className="p-4 bg-white rounded-xl shadow-inner">
                {qrSrc && (
                  <img
                    src={qrSrc}
                    alt="Large QR"
                    className="w-64 h-64 object-contain"
                  />
                )}
              </div>
              <Button
                className="w-full mt-4"
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = qrSrc;
                  link.download = `${qrTitle.replace(" ", "_")}.png`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                {t("invite.downloadQr")}
              </Button>
            </DialogContent>
          </Dialog>

          {/* Refresh Confirmation Dialog */}
          <Dialog
            open={!!refreshRole}
            onOpenChange={(o) => !o && setRefreshRole(null)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("invite.refreshConfirmTitle")}</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                {t("invite.refreshConfirmDesc")}
              </p>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setRefreshRole(null)}>
                  {t("invite.cancel")}
                </Button>
                <Button variant="destructive" onClick={handleRefreshToken}>
                  {t("invite.refresh")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

      {/* Organizer List Dialog */}
      <Dialog open={organizerListOpen} onOpenChange={setOrganizerListOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("organizers.allOrganizers")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {organizers.map((org) => (
              <div
                key={org.id}
                className="flex items-center gap-4 p-3 rounded-2xl bg-card border"
              >
                <UserAvatar
                  user={org.user}
                  className="h-12 w-12 border-2 border-white shadow-sm ring-2 ring-pink-50"
                />
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-sm truncate text-foreground/90">
                    {org.user?.name || t("organizers.unknown")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {org.user?.email || ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
