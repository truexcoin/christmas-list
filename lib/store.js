// Cloudflare KV storage for Christmas List
// Works with Cloudflare Pages Functions

const GIFTS_KEY = 'christmas-list-gifts';
const SETTINGS_KEY = 'christmas-list-settings';

// Get KV namespace from environment (Cloudflare Pages)
function getKV() {
  // In Cloudflare Pages, KV is available via env.KV
  // This will be passed from the API routes
  if (typeof process !== 'undefined' && process.env && process.env.KV) {
    return process.env.KV;
  }
  // For runtime access, we'll pass it from the request context
  return null;
}

// Sample initial data
const initialGifts = [
  {
    id: '1',
    name: 'Sony WH-1000XM5 Headphones',
    price: '$348',
    image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800',
    description: 'Industry-leading noise canceling wireless headphones with exceptional sound quality and 30-hour battery life.',
    priority: 'high',
    stores: [
      { name: 'Amazon', url: 'https://amazon.com' },
      { name: 'Best Buy', url: 'https://bestbuy.com' },
    ],
    priceHistory: [],
  },
  {
    id: '2',
    name: 'Kindle Paperwhite',
    price: '$139',
    image: 'https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=800',
    description: 'The thinnest, lightest Kindle Paperwhite yet with a flush-front design and 300 ppi glare-free display.',
    priority: 'medium',
    stores: [
      { name: 'Amazon', url: 'https://amazon.com' },
    ],
    priceHistory: [],
  },
];

// Get all gifts
export async function getGifts(kv = null) {
  try {
    if (kv) {
      const data = await kv.get(GIFTS_KEY);
      if (data) {
        return JSON.parse(data);
      }
      // Initialize with sample data
      await kv.put(GIFTS_KEY, JSON.stringify(initialGifts));
      return initialGifts;
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('KV error in getGifts:', error.message);
    }
  }
  
  // Fallback to in-memory for development
  return initialGifts;
}

// Save all gifts
export async function saveGifts(gifts, kv = null) {
  if (!kv) {
    throw new Error('KV not available. Make sure KV binding is configured in wrangler.toml');
  }
  
  try {
    await kv.put(GIFTS_KEY, JSON.stringify(gifts));
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('KV error in saveGifts:', error.message);
    }
    throw new Error('Failed to save: ' + error.message);
  }
}

// Get single gift
export async function getGift(id, kv = null) {
  const gifts = await getGifts(kv);
  return gifts.find((g) => g.id === id);
}

// Add gift
export async function addGift(gift, kv = null) {
  const gifts = await getGifts(kv);
  const newGift = {
    ...gift,
    id: Date.now().toString(),
  };
  gifts.push(newGift);
  await saveGifts(gifts, kv);
  return newGift;
}

// Update gift
export async function updateGift(id, updates, kv = null) {
  const gifts = await getGifts(kv);
  const index = gifts.findIndex((g) => g.id === id);
  if (index === -1) return null;

  // Ensure priceHistory exists if not present
  if (!gifts[index].priceHistory) {
    gifts[index].priceHistory = [];
  }

  gifts[index] = { ...gifts[index], ...updates, id };
  await saveGifts(gifts, kv);
  return gifts[index];
}

// Track price for a gift
export async function trackPrice(id, price, source = 'manual', kv = null) {
  const gift = await getGift(id, kv);
  if (!gift) return null;

  // Ensure priceHistory exists
  if (!gift.priceHistory) {
    gift.priceHistory = [];
  }

  // Add new price entry
  const priceEntry = {
    price: price,
    date: new Date().toISOString(),
    source: source,
  };

  gift.priceHistory.push(priceEntry);
  
  // Keep only last 50 entries to prevent unbounded growth
  if (gift.priceHistory.length > 50) {
    gift.priceHistory = gift.priceHistory.slice(-50);
  }

  // Update the current price if provided
  if (price) {
    gift.price = price;
  }

  await updateGift(id, gift, kv);
  return gift;
}

// Delete gift
export async function deleteGift(id, kv = null) {
  const gifts = await getGifts(kv);
  const filtered = gifts.filter((g) => g.id !== id);
  if (filtered.length === gifts.length) return false;

  await saveGifts(filtered, kv);
  return true;
}

// Settings functions
const defaultSettings = {
  emoji: '🎄',
  title: 'Christmas Wishlist',
  subtitle: 'Click on any gift to see more details and where to buy',
};

export async function getSettings(kv = null) {
  try {
    if (kv) {
      const data = await kv.get(SETTINGS_KEY);
      if (data) {
        return JSON.parse(data);
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('KV error in getSettings:', error.message);
    }
  }
  
  return defaultSettings;
}

export async function saveSettings(settings, kv = null) {
  if (!kv) {
    throw new Error('KV not available. Make sure KV binding is configured in wrangler.toml');
  }
  
  try {
    await kv.put(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('KV error in saveSettings:', error.message);
    }
    throw new Error('Failed to save settings: ' + error.message);
  }
}
