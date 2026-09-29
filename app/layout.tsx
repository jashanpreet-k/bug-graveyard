import type { Metadata } from "next";

import { openGraph, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/metadata";

import { gothic, sans } from "./fonts";

// Shared by the site and the embedded Studio, so it stays bare: all graveyard
// styling lives in app/(site)/layout.tsx. The font variables are here so the
// Studio's Tombstone preview can use the site's fonts.

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  openGraph: openGraph(SITE_NAME, SITE_DESCRIPTION),
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${gothic.variable}`}>
      <body>{children}</body>
    </html>
  );
}
