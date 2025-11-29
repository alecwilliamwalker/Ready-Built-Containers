import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Geist, Geist_Mono, Barlow_Semi_Condensed } from "next/font/google";
import { ToastProvider } from "@/components/providers/ToastProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const barlow = Barlow_Semi_Condensed({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.readybuiltcontainers.com"),
  title: {
    default: "Ready Built Containers",
    template: "%s | Ready Built Containers",
  },
  description:
    "Engineered shipping-container hunting cabins with secure doors, off-grid options, and turnkey delivery across the Midwest from Audubon, Iowa.",
  keywords: [
    "container cabin",
    "hunting cabin",
    "tiny home",
    "off grid cabin",
    "shipping container home",
  ],
  openGraph: {
    title: "Ready Built Containers",
    description:
      "Rugged, secure shipping-container cabins engineered for hunters, outfitters, and rural landowners across the Midwest.",
    type: "website",
    url: "https://www.readybuiltcontainers.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ready Built Containers",
    description:
      "Rugged, secure shipping-container cabins engineered for hunters, outfitters, and rural landowners across the Midwest.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const fontVars = {
    "--font-display": `var(${geistSans.variable})`,
    "--font-heading": `var(${barlow.variable})`,
  } as CSSProperties;

  return (
    <html lang="en" className={`${geistSans.variable} ${barlow.variable}`} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased`}
        style={fontVars}
      >
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
