import "./globals.css";
import type { Metadata } from "next";
import { Urbanist, Open_Sans } from "next/font/google";

const urbanist = Urbanist({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-headline",
  display: "swap",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Boldlabs CRM | Enterprise WhatsApp Platform",
  description: "Boldlabs CRM — Enterprise WhatsApp Automation, AI Booking, and Live Customer Inbox",
  manifest: "/manifest.json",
  themeColor: "#090d16",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Boldlabs CRM",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${urbanist.variable} ${openSans.variable}`}>
      <head>
        <meta name="theme-color" content="#090d16" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Boldlabs CRM" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body className="bg-canvas text-text-primary min-h-screen antialiased font-sans">
        {children}
      </body>
    </html>
  );
}

