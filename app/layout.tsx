import { GoogleAnalytics } from "@next/third-parties/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const soriaFont = localFont({
  src: "../public/soria-font.ttf",
  variable: "--font-soria",
});

const vercettiFont = localFont({
  src: "../public/Vercetti-Regular.woff",
  variable: "--font-vercetti",
});

export const metadata: Metadata = {
  title: "Winson Chen – Creative",
  description:
    "Portfolio of Winson Chen, a creative focused on launch campaigns and product storytelling.",
  keywords:
    "Winson Chen, Creative, Brand Design, Visual Design, Campaigns, Portfolio, UI-UX",
  authors: [{ name: "Winson Chen" }],
  creator: "Winson Chen",
  publisher: "Winson Chen",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Winson Chen – Creative",
    description:
      "Creative focused on launch campaigns and product storytelling.",
    url: "https://www.winsonchen.digital",
    siteName: "Winson Chen – Portfolio",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Winson Chen – Creative",
    description:
      "Creative focused on launch campaigns and product storytelling.",
  },
  // If you don't need Google verification, you can remove this block.
  // verification: {
  //   google: "YOUR_GOOGLE_SITE_VERIFICATION",
  // },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overscroll-y-none">
      <body
        className={`${soriaFont.variable} ${vercettiFont.variable} font-sans antialiased bg-black text-white`}
      >
        {children}
      </body>
      <GoogleAnalytics gaId={"G-7WD4HM3XRE"} />
      <SpeedInsights />
    </html>
  );
}