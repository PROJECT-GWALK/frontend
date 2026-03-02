import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Toaster } from "@/components/ui/sonner";
import { headers } from "next/headers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;

  const title = {
    default: "Gallery Walk",
    template: "%s | Gallery Walk",
  };

  const description =
    "Create your own events and join the events that interest you. Discover new experiences, meet like-minded people, and build lasting connections in your community.";

  const imageUrl = new URL("/og-image.png", origin).toString();

  return {
    title,
    description,
    metadataBase: new URL(origin),
    applicationName: "Gallery Walk",
    manifest: "/manifest.json",
    icons: {
      icon: "/icon.png",
      shortcut: "/icon.png",
      apple: "/icon.png",
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Gallery Walk",
    },
    formatDetection: {
      telephone: false,
    },
    openGraph: {
      title,
      description,
      images: [imageUrl],
      siteName: "Gallery Walk",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
      creator: "@gallery_walk",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SessionProvider>
          <LanguageProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster />
            </ThemeProvider>
          </LanguageProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
