const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://al3amer.store';

export function buildProductSchema(product: any) {
  const url = `${SITE_URL}/product/${product.slug}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description?.slice(0, 500),
    sku: product.sku,
    mpn: product.barcode,
    image: product.images?.map((i: any) => i.url) || [],
    url,
    brand: product.brand ? {
      '@type': 'Brand',
      name: product.brand.name,
    } : undefined,
    category: product.category?.name,
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'EGP',
      price: product.discountPrice || product.price,
      priceValidUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      availability: product.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
    aggregateRating: product.reviewCount ? {
      '@type': 'AggregateRating',
      ratingValue: product.averageRating || 0,
      reviewCount: product.reviewCount,
      bestRating: 5,
    } : undefined,
  };
}

export function buildBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}

export function buildFAQSchema(faqs: { question: string; answer: string }[]) {
  if (!faqs || faqs.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
