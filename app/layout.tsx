import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "PrepHub — Master Your Technical Interview",
  description:
    "All-in-one platform for technical interview prep: curated Q&A, timed quizzes, and live AI mock interviews.",
  keywords: ["interview prep", "DSA", "OOPS", "DBMS", "coding interview", "AI interview"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
