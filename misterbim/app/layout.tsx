import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MisterBim | Engenharia Hidrossanitária",
  description: "Apoio técnico para projetos de instalações prediais.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
