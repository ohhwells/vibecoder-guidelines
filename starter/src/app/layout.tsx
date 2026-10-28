import { Suspense } from 'react';
import { OhhwellsBridge, OhwLoaderSurface } from '@ohhwells/bridge';
import { BrandProvider } from '@/components/layout/BrandProvider';
import { Navbar } from '@/components/layout/Navbar';
import { FooterLayouts } from '@/components/layout/Footer';
import { globalContent } from '@/content/global';
import { fontClasses } from '@/lib/fonts';
import { buildMetadata } from '@/lib/seo';
import '@/styles/globals.css';
import '@ohhwells/bridge/styles';

export const metadata = buildMetadata({
  title: 'Home',
  description: 'A minimal base template for every vibe-coded OhhWells site.',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const Footer = FooterLayouts[globalContent.footer.layout].component;

  return (
    <html lang="en" className={fontClasses}>
      <body>
        {/* Covers the template from first paint until the bridge applies this site's content.
            Shared from the bridge (OHH-850) — the local copy this replaced could not detect a
            branded custom domain, so the flash it exists to hide was fully visible there. */}
        <OhwLoaderSurface />
        <Suspense>
          <OhhwellsBridge />
        </Suspense>
        <BrandProvider>
          <Navbar
            items={globalContent.navItems}
            logo={globalContent.logo}
            ctaButton={globalContent.ctaButton}
          />
          <main>{children}</main>
          <Footer content={globalContent.footer.content} logo={globalContent.logo} />
        </BrandProvider>
      </body>
    </html>
  );
}
