import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tagesplan-Briefing — AppSales Labs",
  description:
    "Kalender rein, Briefing raus. Web-Recherche pro Termin via Tavily und Claude. Lead-Magnet-Tool von AppSales Labs.",
  metadataBase: new URL("https://tagesplan.labs.appsales-consulting.de"),
  openGraph: {
    title: "Tagesplan-Briefing",
    description: "Kalender rein, Briefing raus. Web-Recherche pro Termin.",
    type: "website",
    locale: "de_DE",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
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
