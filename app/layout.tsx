import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProviderWrapper } from "@/components/SessionProviderWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PPDB Markaz Arabiyah — Pusat Bahasa Arab & Mediator Timur Tengah",
  description: "Penerimaan Peserta Didik Baru Markaz Arabiyah Pare. Pusat bimbingan bahasa Arab intensif dan mediator resmi studi ke Timur Tengah & Eropa.",
  keywords: ["PPDB Markaz Arabiyah", "Kursus Bahasa Arab Pare", "Belajar Bahasa Arab", "Mediator Timur Tengah", "Studi ke Mesir", "Kampung Inggris Pare"],
  authors: [{ name: "Markaz Arabiyah" }],
  openGraph: {
    title: "PPDB Markaz Arabiyah — Pusat Bahasa Arab & Mediator Timur Tengah",
    description: "Penerimaan Peserta Didik Baru Markaz Arabiyah Pare. Pusat bimbingan bahasa Arab intensif dan mediator resmi studi ke Timur Tengah & Eropa.",
    url: "https://ppdb.markazarabiyah.com",
    siteName: "Markaz Arabiyah",
    images: [
      {
        url: "/images/logo.png",
        width: 800,
        height: 600,
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PPDB Markaz Arabiyah — Pusat Bahasa Arab & Mediator Timur Tengah",
    description: "Penerimaan Peserta Didik Baru Markaz Arabiyah Pare. Pusat bimbingan bahasa Arab intensif dan mediator resmi studi ke Timur Tengah & Eropa.",
    images: ["/images/logo.png"],
  },
  icons: {
    icon: "/images/logo.png",
  },
  verification: {
    google: [
      "iNuVFMDtd1omFrP6i4g2hA1gmZxwWTtyyZux3HSf4j8",
      "google0689ffb743e0b7d5"
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" translate="no">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProviderWrapper>
          {children}
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
