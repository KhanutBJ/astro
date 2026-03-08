import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ดาวทำนาย — ที่ปรึกษาดวงดาวของคุณ",
  description: "สอบถามดวงดาว โชคชะตา และคำทำนายที่แม่นยำด้วย AI โหราศาสตร์",
  keywords: "โหราศาสตร์, ดวง, ดาว, ทำนาย, ราศี",
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
