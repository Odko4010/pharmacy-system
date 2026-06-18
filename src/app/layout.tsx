import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import { Providers } from "@/components/providers/Providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "ЭмСан — Эмийн сангийн бүртгэлийн систем",
  description: "Эмийн сангийн бараа, захиалга, нөөц, борлуулалтын удирдлагын систем",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="mn"
      className={`${inter.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
