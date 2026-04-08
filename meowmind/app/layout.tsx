import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MeowMind V2",
  description: "AI per interpretare e generare vocalizzazioni feline"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}