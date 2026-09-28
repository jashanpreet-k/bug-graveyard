import type { Metadata } from "next";

// Shared by the site and the embedded Studio, so it stays bare: all graveyard
// styling lives in app/(site)/layout.tsx.

export const metadata: Metadata = {
  title: "Bug Graveyard",
  description: "Where fixed bugs are laid to rest, and where the ones that come back rise as zombies.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
