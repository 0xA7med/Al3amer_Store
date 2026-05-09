const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://al3amer.store';

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Store',
  name: 'مركز العامر',
  url: SITE_URL,
  logo: 'https://i.ibb.co/KkCv1LF/Logo-Al3amer.png',
  image: 'https://i.ibb.co/KkCv1LF/Logo-Al3amer.png',
  description: 'أجهزة كاشير وأنظمة محاسبة متكاملة',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'شارع عباس العقاد',
    addressLocality: 'مدينة نصر',
    addressRegion: 'القاهرة',
    addressCountry: 'EG',
  },
  telephone: '+20 101 234 5678',
  priceRange: '$$',
  openingHours: 'Mo-Fr 09:00-18:00',
  sameAs: [
    'https://facebook.com/al3amer',
    'https://instagram.com/al3amer',
    'https://wa.me/201012345678',
  ],
};

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
