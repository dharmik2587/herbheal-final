import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'HerbHeal Compass',
  description: 'Discover Ayurvedic herbs tailored to your symptoms and dosha. Powered by live research from Wikipedia, PubChem, and PubMed.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <nav className="navbar">
            <div className="navbar-inner">
              <Link href="/" className="navbar-brand">
                <span className="navbar-icon">🌿</span>
                <span>HerbHeal Compass</span>
              </Link>
              <div className="navbar-links">
                <Link href="/" className="nav-link">Herbs</Link>
                <Link href="/compass" className="nav-link nav-link-accent">🧭 Compass</Link>
              </div>
            </div>
          </nav>
          <main>{children}</main>
          <footer className="footer">
            <p>HerbHeal Compass — Ayurvedic wisdom, enriched daily from live sources.</p>
            <p className="footer-disclaimer">For educational purposes only. Consult a healthcare professional before using any herb.</p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
