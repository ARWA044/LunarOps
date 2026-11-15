import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LunarOps — The Moon, made easier to explore",
  description:
    "NASA Space Apps Challenge 2026: CLPS Lunar Landing-Site Sunlight Availability & Direct-to-Earth Line-of-Sight Visibility Telemetry Browser.",
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
    <html lang="en" className="dark">
      <body className="bg-black text-white antialiased overflow-x-hidden min-h-screen font-sans selection:bg-amber-500/30 selection:text-amber-200">
        {children}
      </body>
    </html>
  );
}
