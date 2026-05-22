const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://al3amer.store';

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'ElectronicsStore',
  name: 'مركز العامر',
  url: SITE_URL,
  logo: 'https://i.ibb.co/KkCv1LF/Logo-Al3amer.png',
  image: 'https://i.ibb.co/KkCv1LF/Logo-Al3amer.png',
  description: 'المركز الرائد في مصر لتوريد وتركيب أجهزة الكاشير، أنظمة نقاط البيع، كاميرات المراقبة، والحلول التقنية للمحلات التجارية والمطاعم',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'EG',
  },
  areaServed: 'EG',
  currenciesAccepted: 'EGP',
  priceRange: '$$',
  sameAs: [],
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
