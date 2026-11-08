import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LUNAR LANDING SITE NAVIGATOR",
  description:
    "An intuitive tool for evaluating lunar landing sites — visualizing Sun and Earth positions, power generation potential, and communication windows for mission planning.",
  keywords: [
    "NASA",
    "Moon",
    "Lunar",
    "Landing Site",
    "Space Apps",
    "Artemis",
    "CLPS",
    "Ephemeris",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-space-black text-text-primary">
        {children}
      </body>
    </html>
  );
}

