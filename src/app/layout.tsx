import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BLACKSHIELD — Critical Infrastructure Cyber Defense Platform",
  description: "Centralized incident-response, website availability monitoring, and controlled load testing platform for national emergency infrastructure.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-soc-void text-soc-text antialiased selection:bg-soc-cyan selection:text-soc-void bg-grid-pattern">
        {children}
      </body>
    </html>
  );
}
