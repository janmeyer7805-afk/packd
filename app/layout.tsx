import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Packd — Gemeinsam günstiger einkaufen',
  description: 'Group buying deals in Germany. Join together, save big.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: 'rgba(17,17,17,0.95)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#fff',
                backdropFilter: 'blur(20px)',
                borderRadius: '0.75rem',
                fontSize: '0.8rem',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
