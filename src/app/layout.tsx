import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SentinelBrain — AI-Native DevOps Copilot",
  description:
    "Your Second Brain for infrastructure. Diagnose incidents, visualize metrics, and execute remediation — powered by AI.",
  keywords: ["DevOps", "AI", "Infrastructure", "Monitoring", "Incident Response"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable} dark h-full antialiased`}>
      <body className="h-full bg-[#050709] font-sans text-slate-200">{children}</body>
    </html>
  );
}
