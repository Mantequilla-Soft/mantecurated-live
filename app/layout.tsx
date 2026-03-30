import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ManteCurated Live - Hive Curation Dashboard | Mantequilla Soft",
  description: "Real-time Hive blockchain curation dashboard for monitoring voting power, account stats, and vote history. Butter-smooth tools by Mantequilla Soft.",
  icons: {
    icon: '/mantequillaSoftLogo.png',
    apple: '/mantequillaSoftLogo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
