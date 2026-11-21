import type { Metadata, Viewport } from "next";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { getSettings } from "@/lib/server/data";
import "./globals.css";
import "@/styles/photography.css";
import Analytics from "@/components/site/Analytics";
const siteUrl = process.env.APP_URL || "http://localhost:3000";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Reign in Wealth Retreats | Travel with purpose",
    template: "%s | Reign in Wealth Retreats",
  },
  description:
    "Extraordinary destinations. Meaningful connections. Explore luxury international retreats with Reign in Wealth — where travel meets purpose, culture, and possibility.",
  openGraph: {
    type: "website",
    siteName: "Reign in Wealth Retreats",
    title: "Reign in Wealth Retreats",
    description: "Explore the world. Expand your vision. Reign in Wealth.",
    images: [{ url: "/images/retreats-share.jpg", width: 1200, height: 630, alt: "Reign in Wealth guests together in Ghana" }],
  },
  twitter: { card: "summary_large_image" },
  icons: {
    icon: [
      { url: "/favicon.ico?v=2", sizes: "any", type: "image/x-icon" },
      { url: "/icon.png?v=2", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png?v=2", sizes: "180x180", type: "image/png" }],
  },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = {
  themeColor: "#163d34",
  width: "device-width",
  initialScale: 1,
};
export const dynamic = "force-dynamic";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = getSettings();
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <Header />
        <main id="main-content">{children}</main>
        <Footer settings={settings} />
        <Analytics measurementId={settings.analyticsId} />
      </body>
    </html>
  );
}
