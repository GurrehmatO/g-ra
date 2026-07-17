import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "G-ra — Board",
  description: "A free, self-hostable Jira board alternative.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
