import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Palet — Dijital Menü',
  description: 'Palet Restaurant Dijital QR Menüsü',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
