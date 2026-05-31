const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://al3amer.store';

const MERCHANT_RETURN_POLICY = {
  '@type': 'MerchantReturnPolicy',
  applicableCountry: 'EG',
  returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
  merchantReturnDays: 14,
  returnMethod: 'https://schema.org/ReturnByMail',
  returnFees: 'https://schema.org/FreeReturn',
  url: `${SITE_URL}/return-policy`,
};

const SHIPPING_DETAILS = {
  '@type': 'OfferShippingDetails',
  shippingDestination: {
    '@type': 'DefinedRegion',
    addressCountry: 'EG',
  },
  shippingRate: {
    '@type': 'MonetaryAmount',
    value: 0,
    currency: 'EGP',
  },
  deliveryTime: {
    '@type': 'ShippingDeliveryTime',
    businessDays: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'https://schema.org/Saturday',
        'https://schema.org/Sunday',
        'https://schema.org/Monday',
        'https://schema.org/Tuesday',
        'https://schema.org/Wednesday',
        'https://schema.org/Thursday',
      ],
    },
    handlingTime: {
      '@type': 'QuantitativeValue',
      minValue: 1,
      maxValue: 2,
      unitCode: 'DAY',
    },
    transitTime: {
      '@type': 'QuantitativeValue',
      minValue: 1,
      maxValue: 5,
      unitCode: 'DAY',
    },
  },
};

export function buildProductSchema(product: any) {
  const url = `${SITE_URL}/product/${product.slug}`;
  const barcode = product.barcode?.toString() || '';

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description?.slice(0, 500),
    sku: product.sku?.toString().slice(0, 40) || undefined,
    mpn: barcode.slice(0, 30) || undefined,
    gtin13: /^\d{13}$/.test(barcode) ? barcode : undefined,
    gtin12: /^\d{12}$/.test(barcode) ? barcode : undefined,
    image: product.images?.map((i: any) => i.url) || [],
    url,
    brand: {
      '@type': 'Brand',
      name: product.brand?.name || 'مركز العامر',
    },
    category: product.category?.name,
    hasMerchantReturnPolicy: MERCHANT_RETURN_POLICY,
    shippingDetails: SHIPPING_DETAILS,
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
      hasMerchantReturnPolicy: MERCHANT_RETURN_POLICY,
      shippingDetails: SHIPPING_DETAILS,
    },
    aggregateRating: product.reviewCount ? {
      '@type': 'AggregateRating',
      ratingValue: product.averageRating || 0,
      reviewCount: product.reviewCount,
      bestRating: 5,
    } : undefined,
    review: product.reviews?.length > 0 ? product.reviews.map((r: any) => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: r.customerName || r.user?.name || 'عميل مركز العامر',
      },
      datePublished: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : undefined,
      reviewBody: r.text || undefined,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: r.rating || 5,
        bestRating: 5,
      },
    })) : undefined,
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
