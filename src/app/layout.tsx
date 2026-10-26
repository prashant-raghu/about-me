import type { Metadata, Viewport } from "next";
import { profile } from "@/content/profile";
import "./globals.css";

export const metadata: Metadata = {
  title: profile.name,
  description: profile.tagline,
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
