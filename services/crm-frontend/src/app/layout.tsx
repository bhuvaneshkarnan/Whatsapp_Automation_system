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
  icons: {
    icon: "/favicon.ico",
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

