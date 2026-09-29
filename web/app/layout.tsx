import type { Metadata } from "next";
import { Noto_Sans, Noto_Serif } from "next/font/google";
import "./globals.css";

const sans = Noto_Sans({
  subsets: ["vietnamese", "latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const serif = Noto_Serif({
  subsets: ["vietnamese", "latin"],
  display: "swap",
  variable: "--font-serif",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Nông Lạc — Nhật ký canh tác",
  description: "Digital Farm · Nhật ký canh tác có bằng chứng và truy xuất nguồn gốc.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body className={sans.variable + " " + serif.variable}>{children}</body></html>;
}