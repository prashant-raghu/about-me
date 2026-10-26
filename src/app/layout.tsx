import type { Metadata, Viewport } from "next";
import { profile } from "@/content/profile";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

// The share image comes from opengraph-image.tsx and the favicon from icon.svg;
// Next adds their tags itself.
export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: profile.name,
  description: profile.tagline,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: profile.name,
    title: profile.name,
    description: profile.tagline,
  },
  twitter: {
    card: "summary_large_image",
    title: profile.name,
    description: profile.tagline,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

// Runs while <head> parses, before first paint: the stored choice wins,
// otherwise the system theme. ThemeToggle keeps the same rules after hydration.
const themeScript = `(function(){var t;try{t=localStorage.getItem("theme")}catch(e){}if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.classList.add(t)})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-bg font-sans text-[16px] leading-[1.6] text-fg antialiased">
        {children}
      </body>
    </html>
  );
}
