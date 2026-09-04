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
  title: "WhatsApp CRM & Automation Platform",
  description: "Enterprise WhatsApp Automation, AI Booking, and Live CRM Platform",
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
      <body className="bg-canvas text-text-primary min-h-screen antialiased font-sans">
        {children}
      </body>
    </html>
  );
}

