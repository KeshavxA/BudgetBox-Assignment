import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BudgetBox",
  description: "Offline-First Personal Budgeting",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
