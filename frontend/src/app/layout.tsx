import type { Metadata, Viewport } from "next";
import { Caveat, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Headings only: a hand-lettered face that suits the chalkboard look
const chalk = Caveat({
  variable: "--font-chalk",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: { default: "CanvasFlow, a shared whiteboard", template: "%s | CanvasFlow" },
  description:
    "Sketch shapes, arrows and notes on an endless board, invite people by email and draw together in real time.",
};

export const viewport: Viewport = {
  themeColor: "#1c2a26",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} ${chalk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
