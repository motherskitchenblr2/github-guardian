import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GitHub Guardian — Autonomous Defense & Maintenance",
  description: "Enterprise mobile dashboard for automated PR reviews, squash merges, fork syncing, secret scanning, and repository hardening.",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#070B14",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-background min-h-screen text-slate-100 flex flex-col antialiased selection:bg-sky-500/20">
        {children}
      </body>
    </html>
  );
}
