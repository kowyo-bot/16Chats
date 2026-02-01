import type { Metadata } from 'next';
import './global.css';
import { ThemeProvider } from '@/components/theme-provider';

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
    <html lang="zh" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
