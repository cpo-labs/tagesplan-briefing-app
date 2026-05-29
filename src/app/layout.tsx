import type { Metadata } from "next";
import "./globals.css";
import { getLocale } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const de = locale === "de";
  return {
    title: "Tagesplan-Briefing",
    description: de
      ? "Kalender rein, Briefing raus. Web-Recherche pro Termin via Tavily und Claude. Lead-Magnet-Tool von AppSales Labs."
      : "Calendar in, briefing out. Per-meeting web research via Tavily and Claude. Lead-magnet tool by AppSales Labs.",
    metadataBase: new URL("https://tagesplan.labs.appsales-consulting.de"),
    openGraph: {
      title: "Tagesplan-Briefing",
      description: de
        ? "Kalender rein, Briefing raus. Web-Recherche pro Termin."
        : "Calendar in, briefing out. Per-meeting web research.",
      siteName: "AppSales Labs",
      type: "website",
      locale: de ? "de_DE" : "en_US",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
