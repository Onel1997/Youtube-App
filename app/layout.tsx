import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "YouTube Generator | Gaming & Entertainment",
  description:
    "Automatischer YouTube Video Generator – Skripte, Titel, Tags & mehr für deinen Gaming Kanal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
