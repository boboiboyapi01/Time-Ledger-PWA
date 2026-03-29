import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Time Ledger - PWA Time Tracker",
  description: "Track your productive and distracting activities with a fast, offline-first PWA",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Time Ledger",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/sand-clock.png",
    apple: "/sand-clock.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${inter.variable}`}
    >
      <head>
        <meta name="theme-color" content="#f8fafc" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 font-sans text-slate-800 selection:bg-blue-500/30 relative">
        {/* Clean, minimalist light background */}
        <div className="fixed inset-0 z-[-1] bg-slate-50"></div>
        {children}
      </body>
    </html>
  );
}
