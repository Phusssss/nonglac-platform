import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nông Lạc — Nhật ký canh tác",
  description: "Digital Farm · Nhật ký canh tác có bằng chứng và truy xuất nguồn gốc.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}
