import type { Metadata } from 'next';
import './global.css';

export const metadata: Metadata = {
  title: '16Chats',
  description: 'Chat with 16 MBTI-style personas + 5-turn lightweight typing.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
