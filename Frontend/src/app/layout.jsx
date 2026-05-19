import '../index.css';
import { Cinzel, Cinzel_Decorative, Outfit } from 'next/font/google';

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-cinzel',
  display: 'swap',
});

const cinzelDecorative = Cinzel_Decorative({
  subsets: ['latin'],
  weight: ['700', '900'],
  variable: '--font-cinzel-decorative',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700', '900'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata = {
  title: 'ZEUS LEGACY',
  description: 'ZEUS LEGACY — Premium Cascading Slot', // Refreshed styles
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${cinzelDecorative.variable} ${outfit.variable}`}
    >
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
