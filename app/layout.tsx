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
  metadataBase: new URL("https://ppdb.markazarabiyah.site"),
  title: "Markaz Arabiyah — Kursus Bahasa Arab Terbaik di Pare Kampung Inggris Kediri",
  description: "Markaz Arabiyah adalah lembaga pendidikan bahasa Arab intensif terkemuka di Kampung Inggris Pare, Kediri. Dengan lebih dari 25.000 alumni dan metode akselerasi terbukti, kami menyediakan program kursus bahasa Arab mulai dari nol hingga mahir, fasilitas asrama terpadu, serta bimbingan studi resmi ke Timur Tengah dan Eropa.",
  keywords: ["Kursus Bahasa Arab Pare", "Kampung Inggris Pare Bahasa Arab", "Markaz Arabiyah Pare", "PPDB Markaz Arabiyah", "Belajar Bahasa Arab Pare", "Mediator Studi Timur Tengah", "Kuliah di Mesir", "Kursus Bahasa Arab Kediri", "Belajar Bahasa Arab dari Nol", "Asrama Bahasa Arab Pare"],
  authors: [{ name: "Markaz Arabiyah" }],
  openGraph: {
    title: "Markaz Arabiyah — Kursus Bahasa Arab Terbaik di Pare Kampung Inggris",
    description: "Lembaga pendidikan bahasa Arab intensif terkemuka di Kampung Inggris Pare, Kediri. Lebih dari 25.000 alumni, metode akselerasi, asrama terpadu, dan bimbingan studi ke Timur Tengah.",
    url: "https://ppdb.markazarabiyah.site",
    siteName: "Markaz Arabiyah",
    images: [
      {
        url: "/images/logo.png",
        width: 500,
        height: 500,
        alt: "Logo Markaz Arabiyah - Kursus Bahasa Arab Pare",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Markaz Arabiyah — Kursus Bahasa Arab Terbaik di Pare Kampung Inggris",
    description: "Lembaga pendidikan bahasa Arab intensif terkemuka di Kampung Inggris Pare, Kediri. Lebih dari 25.000 alumni, metode akselerasi, asrama terpadu, dan bimbingan studi ke Timur Tengah.",
    images: ["/images/logo.png"],
  },
  icons: {
    icon: [
      { url: "/images/logo.png", sizes: "any" },
    ],
    apple: "/images/logo.png",
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
