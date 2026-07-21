import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';
import { Providers } from './providers';
import AiChatbot from '@/components/AiChatbot';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'HerbHeal Compass — Ayurvedic Intelligence Platform',
  description: 'Identify plants in real-time, discover Ayurvedic herbs tailored to your symptoms, check drug interactions, and track live market prices. Powered by Plant.id, PubChem, PubMed & live data.',
  keywords: ['Ayurveda', 'Medicinal Plants', 'Herb Identification', 'Drug Interactions', 'Plant.id', 'Herbal Medicine'],
  openGraph: {
    title: 'HerbHeal Compass — Four Compasses, One Platform',
    description: 'Real-time plant identification, Ayurvedic recommendations, live market prices, and drug interaction safety.',
    type: 'website',
  },
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
                <Link href="/identify" className="nav-link nav-link-feature" id="nav-identify">
                  <span className="nav-link-icon">📷</span>
                  <span className="nav-link-text">Identify</span>
                </Link>
                <Link href="/compass" className="nav-link nav-link-feature" id="nav-compass">
                  <span className="nav-link-icon">🧭</span>
                  <span className="nav-link-text">Compass</span>
                </Link>
                <Link href="/market" className="nav-link nav-link-feature" id="nav-market">
                  <span className="nav-link-icon">💰</span>
                  <span className="nav-link-text">Market</span>
                </Link>
                <Link href="/herbs" className="nav-link nav-link-feature" id="nav-herbs">
                  <span className="nav-link-icon">🌿</span>
                  <span className="nav-link-text">Herbs</span>
                </Link>
                <Link href="/login" className="nav-link" id="nav-login">Login</Link>
              </div>
            </div>
          </nav>
          <main>{children}</main>
          <footer className="footer">
            <p>HerbHeal Compass — Four compasses, one platform. Real-time Ayurvedic intelligence.</p>
            <p className="footer-disclaimer">For educational purposes only. Consult a healthcare professional before using any herb.</p>
          </footer>
          <AiChatbot />
        </Providers>
      </body>
    </html>
  );
}
