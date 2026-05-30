function normalizeString(value, fallback = '') {
  if (value === undefined || value === null) {
    return fallback;
  }

  return String(value).trim();
}

function pickFirst(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function normalizeDestinationRecord(record) {
  const category = pickFirst(record.category, record.cat);
  const ecoScore = pickFirst(record.ecoScore, record.eco);
  const description = pickFirst(record.description, record.desc);
  const imageUrl = pickFirst(record.imageUrl, record.image);
  const priceLabel = pickFirst(record.priceLabel, record.price);
  const co2ImpactLabel = pickFirst(record.co2ImpactLabel, record.co2ImpactLabel, record.co2Impact, record.co2);

  return {
    id: Number(record.id),
    name: normalizeString(record.name),
    location: normalizeString(record.location),
    country: normalizeString(record.country, 'Malaysia') || 'Malaysia',
    category: normalizeString(category),
    ecoScore: Number(ecoScore),
    description: normalizeString(description),
    imageUrl: normalizeString(imageUrl),
    priceLabel: normalizeString(priceLabel),
    co2ImpactLabel: normalizeString(co2ImpactLabel),
    icon: normalizeString(record.icon),
    rating: record.rating === undefined || record.rating === null ? undefined : Number(record.rating),
    sustainability: normalizeString(record.sustainability),
    lat: record.lat === undefined || record.lat === null ? undefined : Number(record.lat),
    lon: record.lon === undefined || record.lon === null ? undefined : Number(record.lon)
  };
}

function mapDestinationForClient(record) {
  const normalized = normalizeDestinationRecord(record);

  return {
    ...normalized,
    cat: normalized.category,
    eco: normalized.ecoScore,
    desc: normalized.description,
    image: normalized.imageUrl,
    co2: normalized.co2ImpactLabel,
    price: normalized.priceLabel,
    co2Impact: normalized.co2ImpactLabel
  };
}

function extractPriceValue(priceLabel) {
  const match = String(priceLabel || '').match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : 0;
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildDestinationMongoQuery({ search, category, minEco, id } = {}) {
  const query = {};
  const andConditions = [];

  if (id !== undefined) {
    andConditions.push({ id: Number(id) });
  }

  if (category && category !== 'all') {
    andConditions.push({
      $or: [
        { category: String(category).trim().toLowerCase() },
        { cat: String(category).trim().toLowerCase() }
      ]
    });
  }

  if (minEco !== undefined && minEco !== null && minEco !== '') {
    const minEcoValue = Number.parseFloat(minEco);
    if (!Number.isNaN(minEcoValue)) {
      andConditions.push({
        $or: [
          { ecoScore: { $gte: minEcoValue } },
          { eco: { $gte: minEcoValue } }
        ]
      });
    }
  }

  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    andConditions.push({
      $or: [
        { name: regex },
        { location: regex },
        { category: regex },
        { cat: regex },
        { description: regex },
        { desc: regex }
      ]
    });
  }

  if (andConditions.length === 1) {
    return andConditions[0];
  }

  if (andConditions.length > 1) {
    query.$and = andConditions;
  }

  return query;
}

module.exports = {
  buildDestinationMongoQuery,
  extractPriceValue,
  mapDestinationForClient,
  normalizeDestinationRecord
};
