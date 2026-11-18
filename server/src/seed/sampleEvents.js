import { Event } from '../models/index.js';

// Fictional sample events; venues are generic neighbourhood names.
const CITIES = {
  Istanbul: [
    'Kadıköy Stage',
    'Moda Workshop',
    'Karaköy Art Space',
    'Beşiktaş Hall',
    'Cihangir Studio',
  ],
  Ankara: ['Kızılay Stage', 'Tunalı Studio', 'Çankaya Hall'],
  Izmir: ['Alsancak Stage', 'Kordon Open Air', 'Bornova Studio'],
  Antalya: ['Kaleiçi Courtyard', 'Konyaaltı Beach Stage'],
  Bursa: ['Nilüfer Hall', 'Osmangazi Studio'],
  Eskisehir: ['Odunpazarı Art House', 'Tepebaşı Stage'],
};

const TYPES = {
  concert: {
    titles: [
      'A night of jazz',
      'Acoustic sunset session',
      'Indie rock live',
      'Piano under the stars',
      'Funk & soul night',
    ],
    price: [300, 1200],
    hours: [20, 21],
  },
  theatre: {
    titles: [
      'The quiet apartment',
      'Letters never sent',
      'A comedy of errors',
      'Two chairs, one story',
    ],
    price: [250, 900],
    hours: [19, 20],
  },
  standup: {
    titles: ['Open mic night', 'Laughs after work', 'Stand-up showcase'],
    price: [300, 700],
    hours: [21],
  },
  cinema: {
    titles: ['Classic film night', 'Short film marathon', 'Documentary screening'],
    price: [120, 250],
    hours: [19, 21],
  },
  festival: {
    titles: ['Street food festival', 'Coffee & vinyl fest', 'Spring music festival'],
    price: [600, 2500],
    hours: [12, 14],
  },
  sports: {
    titles: ['Basketball league night', 'Climbing day pass', 'Sunday 10K fun run'],
    price: [200, 1500],
    hours: [10, 18],
  },
  workshop: {
    titles: [
      'Get your hands in clay',
      'Watercolour for beginners',
      'Home barista class',
      'Bookbinding basics',
    ],
    price: [400, 1500],
    hours: [11, 14],
  },
  exhibition: {
    titles: ['A little air, a little art', 'Contemporary photography', 'Illustrators’ showcase'],
    price: [0, 250],
    hours: [11],
    freeChance: 0.5,
  },
  outdoor: {
    titles: ['Guided city walk', 'Sunrise yoga in the park', 'Bike tour by the coast'],
    price: [0, 400],
    hours: [8, 10],
    freeChance: 0.4,
  },
};

/** Small deterministic PRNG so seeds are reproducible. */
function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (random, list) => list[Math.floor(random() * list.length)];
const roundTo = (value, step) => Math.round(value / step) * step;

export function generateSampleEvents({ now = new Date(), perCity = 18, days = 45 } = {}) {
  const random = mulberry32(42);
  const typeNames = Object.keys(TYPES);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const events = [];

  for (const [city, venues] of Object.entries(CITIES)) {
    for (let i = 0; i < perCity; i += 1) {
      const type = typeNames[(i + city.length) % typeNames.length];
      const config = TYPES[type];
      const dayOffset = 1 + Math.floor(random() * days);
      const startsAt = new Date(today + dayOffset * 86_400_000);
      startsAt.setUTCHours(pick(random, config.hours) - 3, random() < 0.5 ? 0 : 30); // Turkey is UTC+3

      const isFree = random() < (config.freeChance ?? 0);
      const unknownPrice = !isFree && random() < 0.05;
      const [low, high] = config.price;
      const minPrice = isFree ? 0 : roundTo(Math.max(low, 50) + random() * (high - low) * 0.6, 50);
      const venue = pick(random, venues);

      events.push({
        title: pick(random, config.titles),
        type,
        city,
        venue,
        startsAt,
        endsAt: new Date(startsAt.getTime() + 2 * 3_600_000),
        minPrice: unknownPrice ? null : minPrice,
        maxPrice: unknownPrice || isFree ? (isFree ? 0 : null) : roundTo(minPrice * 1.6, 50),
        currency: 'TRY',
        imageUrl: `/events/${type}.svg`,
        // Sample data has no real ticket page: link to a web search instead
        url: `https://www.google.com/search?q=${encodeURIComponent(`${venue} ${city} events`)}`,
        source: 'seed',
        externalId: `${city.toLowerCase()}-${i}`,
      });
    }
  }
  return events;
}

/** Replaces seeded events when none are upcoming (e.g. fresh DB or stale dates). */
export async function seedEventsIfNeeded({ force = false, now = new Date() } = {}) {
  const upcoming = await Event.countDocuments({ source: 'seed', startsAt: { $gte: now } });
  if (!force && upcoming > 0) return 0;

  await Event.deleteMany({ source: 'seed' });
  const events = generateSampleEvents({ now });
  await Event.insertMany(events);
  return events.length;
}
