const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://al3amer.store';

export function buildOrganizationSchema(settings: any) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ElectronicsStore',
    name: settings.storeNameAr || 'مركز العامر',
    url: SITE_URL,
    logo: settings.logoUrl || 'https://i.ibb.co/KkCv1LF/Logo-Al3amer.png',
    image: settings.logoUrl || 'https://i.ibb.co/KkCv1LF/Logo-Al3amer.png',
    description: settings.metaDescription || 'المركز الرائد في مصر لتوريد وتركيب أجهزة الكاشير، أنظمة نقاط البيع، كاميرات المراقبة، والحلول التقنية للمحلات التجارية والمطاعم',
    telephone: settings.supportPhone || undefined,
    email: settings.supportEmail || undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: settings.address || 'مصر',
      addressLocality: 'Cairo',
      addressRegion: 'Cairo Governorate',
      addressCountry: 'EG',
    },
    areaServed: 'EG',
    currenciesAccepted: 'EGP',
    priceRange: '$$',
    sameAs: [
      settings.facebook,
      settings.instagram,
      settings.twitterX,
      settings.whatsapp ? `https://wa.me/${String(settings.whatsapp).replace(/\D/g, '')}` : undefined,
    ].filter(Boolean),
  };
}

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'مركز العامر',
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/shop?search={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};
