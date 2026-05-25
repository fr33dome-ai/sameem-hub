import type { Metadata } from 'next';
import { Inter, Tajawal } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { cookies } from 'next/headers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const tajawal = Tajawal({ weight: ['300','400','500','700','800'], subsets: ['arabic'], variable: '--font-tajawal' });

export const metadata: Metadata = {
  title: 'Sameem Hub — Saudi Furniture Marketplace OS',
  description: 'Operating system for the Saudi furniture & interior solutions marketplace.',
  icons: { icon: '/favicon.svg' }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Read locale + theme from cookies (server-side); client overrides via providers.
  const cookieStore = cookies();
  const lang  = (cookieStore.get('lang')?.value === 'ar') ? 'ar' : 'en';
  const theme = (cookieStore.get('theme')?.value === 'light') ? 'light' : 'dark';
  const dir   = lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={lang} dir={dir} data-theme={theme} className={`${inter.variable} ${tajawal.variable}`}>
      <body className={lang === 'ar' ? 'font-arabic' : 'font-sans'}>
        <Providers initialLang={lang} initialTheme={theme}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
