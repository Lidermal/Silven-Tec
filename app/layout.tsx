import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Silven Tec | Gestão de Projetos',
  description: 'Sistema de gestão tecnológica e financeira.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="font-inter antialiased">{children}</body>
    </html>
  );
}
