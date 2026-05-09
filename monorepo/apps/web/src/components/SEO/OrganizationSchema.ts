const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://al3amer.store';

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Store',
  name: 'متجر العامر',
  url: SITE_URL,
  logo: 'https://i.ibb.co/KkCv1LF/Logo-Al3amer.png',
  image: 'https://i.ibb.co/KkCv1LF/Logo-Al3amer.png',
  description: 'متجر العامر لأنظمة الكاشير',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'EG',
  },
  priceRange: '$$',
  sameAs: [],
};

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'متجر العامر',
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
