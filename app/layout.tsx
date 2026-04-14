import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Seat Booking System | Hybrid Office Management",
  description: "Modern seat booking system for hybrid office environments with batch scheduling, real-time availability, and easy reservations",
  keywords: "seat booking, office management, hybrid work, reservation system",
  authors: [{ name: "Seat Booking System" }],
  creator: "Seat Booking System",
  openGraph: {
    title: "Seat Booking System",
    description: "Manage your office seat bookings efficiently",
    type: "website",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scroll-smooth font-mono`}
    >
      <head>
        <meta name="theme-color" content="#ffffff" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect x='20' y='30' width='60' height='40' fill='%23333' rx='4'/><rect x='25' y='35' width='50' height='30' fill='%23666' rx='2'/></svg>" />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 font-mono">
        {children}
      </body>
    </html>
  );
}
