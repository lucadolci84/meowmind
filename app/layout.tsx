import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MeowMind",
  description: "Capisci il tuo gatto in tempo reale."
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
