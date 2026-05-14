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
  title: "Markaz Arabiyah — Kursus Bahasa Arab Pare Kampung Inggris & Mediator Timur Tengah",
  description: "Pusat bimbingan dan kursus bahasa Arab intensif terbaik di Pare Kampung Inggris Kediri. Melayani pendaftaran PPDB offline/online serta mediator resmi studi ke Timur Tengah & Eropa.",
  keywords: ["Kursus Bahasa Arab Pare", "Kampung Inggris Pare Bahasa Arab", "Markaz Arabiyah Pare", "PPDB Markaz Arabiyah", "Belajar Bahasa Arab Pare", "Mediator Studi Timur Tengah", "Kuliah di Mesir"],
  authors: [{ name: "Markaz Arabiyah" }],
  openGraph: {
    title: "Markaz Arabiyah — Kursus Bahasa Arab Pare Kampung Inggris",
    description: "Pusat bimbingan dan kursus bahasa Arab intensif terbaik di Pare Kampung Inggris Kediri. Melayani pendaftaran PPDB serta mediator resmi studi ke Timur Tengah.",
    url: "https://ppdb.markazarabiyah.site",
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
    title: "Markaz Arabiyah — Kursus Bahasa Arab Pare Kampung Inggris",
    description: "Pusat bimbingan dan kursus bahasa Arab intensif terbaik di Pare Kampung Inggris Kediri. Melayani pendaftaran PPDB serta mediator resmi studi ke Timur Tengah.",
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
