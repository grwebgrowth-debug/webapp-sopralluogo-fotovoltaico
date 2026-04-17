import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Web App Sopralluogo Fotovoltaico",
  description: "Base progetto V1 per sopralluoghi fotovoltaici",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
