import type { Metadata, Viewport } from "next";
import "./globals.css";

const APP_URL = "https://astro-xi-three.vercel.app";
const OG_IMAGE = `${APP_URL}/api/og?lagna=%E0%B8%81%E0%B8%A3%E0%B8%81%E0%B8%8E&sun=%E0%B8%AA%E0%B8%B4%E0%B8%87%E0%B8%AB%E0%B9%8C&moon=%E0%B8%81%E0%B8%B8%E0%B8%A1%E0%B8%A0%E0%B9%8C&score=82`;

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "ดาวทำนาย — โหราศาสตร์ไทย AI",
    template: "%s · ดาวทำนาย",
  },
  description: "ดูดวงชาตาที่แม่นยำจากดาราศาสตร์จริง วิเคราะห์มหาดาชา ปัญจางค์ ฤกษ์มงคล และแชทกับอาจารย์ดาว AI โหราศาสตร์อินเดีย-ไทย",
  keywords: "โหราศาสตร์, ดวง, ดาว, ทำนาย, ราศี, ลัคนา, ดาชา, ปัญจางค์, ฤกษ์, โหราศาสตร์อินเดีย, jyotish, vedic astrology, thai astrology, ดวงชาตา",
  authors: [{ name: "ดาวทำนาย" }],
  creator: "ดาวทำนาย",
  publisher: "ดาวทำนาย",
  applicationName: "ดาวทำนาย",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ดาวทำนาย",
  },
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: APP_URL,
    siteName: "ดาวทำนาย",
    title: "ดาวทำนาย — โหราศาสตร์ไทย AI ✨",
    description: "ดูดวงชาตาที่แม่นยำจากดาราศาสตร์จริง วิเคราะห์มหาดาชา ปัญจางค์ ฤกษ์มงคล · อาจารย์ดาว AI รอคุณอยู่",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "ดาวทำนาย — โหราศาสตร์ไทย AI",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@dawtamnai",
    creator: "@dawtamnai",
    title: "ดาวทำนาย — โหราศาสตร์ไทย AI ✨",
    description: "ดูดวงชาตาที่แม่นยำจากดาราศาสตร์จริง · มหาดาชา · ฤกษ์มงคล · อาจารย์ดาว AI",
    images: [OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  alternates: {
    canonical: APP_URL,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Prompt — modern geometric Thai; Kanit — contemporary Thai body; Playfair Display — display accent */}
        <link
          href="https://fonts.googleapis.com/css2?family=Prompt:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Kanit:ital,wght@0,200;0,300;0,400;0,500;0,600;1,300;1,400&family=Playfair+Display:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full overflow-hidden bg-[#06000f]">{children}</body>
    </html>
  );
}
