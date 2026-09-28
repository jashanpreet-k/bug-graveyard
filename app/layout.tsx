import type { Metadata } from "next";

import { gothic, sans } from "./fonts";

// Shared by the site and the embedded Studio, so it stays bare: all graveyard
// styling lives in app/(site)/layout.tsx. The font variables are here so the
// Studio's Tombstone preview can use the site's fonts.

export const metadata: Metadata = {
  title: "Bug Graveyard",
  description: "Where fixed bugs are laid to rest, and where the ones that come back rise as zombies.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${gothic.variable}`}>
      <body>{children}</body>
    </html>
  );
}
