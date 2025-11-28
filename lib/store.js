// Storage for Christmas List
// Supports both Vercel KV and Redis

let kv = null;
let redis = null;

// Get storage instance (Vercel KV or Redis)
async function getStorage() {
  // Try Vercel KV first
  if (!kv) {
    try {
      const kvModule = await import('@vercel/kv');
      kv = kvModule.kv;
      if (kv) return { type: 'vercel-kv', client: kv };
    } catch (e) {
      // Vercel KV not available
    }
  } else {
    return { type: 'vercel-kv', client: kv };
  }
  
  // Try Redis as fallback
  if (!redis && process.env.REDIS_URL) {
    try {
      const { createClient } = await import('redis');
      redis = createClient({ url: process.env.REDIS_URL });
      if (!redis.isOpen) {
        await redis.connect();
      }
      return { type: 'redis', client: redis };
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Redis connection error:', e.message);
      }
      redis = null;
    }
  } else if (redis) {
    // Check if connection is still open
    if (!redis.isOpen) {
      try {
        await redis.connect();
      } catch (e) {
        redis = null;
        return null;
      }
    }
    return { type: 'redis', client: redis };
  }
  
  return null;
}

// Helper to get value from storage
async function getFromStorage(key) {
  const storage = await getStorage();
  if (!storage) return null;
  
  if (storage.type === 'vercel-kv') {
    return await storage.client.get(key);
  } else if (storage.type === 'redis') {
    const data = await storage.client.get(key);
    return data ? JSON.parse(data) : null;
  }
  
  return null;
}

// Helper to set value in storage
async function setInStorage(key, value) {
  const storage = await getStorage();
  if (!storage) {
    throw new Error('No storage available. Configure Vercel KV or Redis.');
  }
  
  if (storage.type === 'vercel-kv') {
    await storage.client.set(key, value);
  } else if (storage.type === 'redis') {
    await storage.client.set(key, JSON.stringify(value));
  }
}

const GIFTS_KEY = 'christmas-list-gifts';
const SETTINGS_KEY = 'christmas-list-settings';

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
export async function getGifts() {
  try {
    const data = await getFromStorage(GIFTS_KEY);
    if (data) {
      return data;
    }
    // Initialize with sample data if storage is available
    const storage = await getStorage();
    if (storage) {
      await setInStorage(GIFTS_KEY, initialGifts);
      return initialGifts;
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Storage error in getGifts:', error.message);
    }
  }
  
  // Fallback to in-memory for development
  return initialGifts;
}

// Save all gifts
export async function saveGifts(gifts) {
  try {
    await setInStorage(GIFTS_KEY, gifts);
    return;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Storage error in saveGifts:', error.message);
    }
    throw new Error('Failed to save: ' + error.message);
  }
}

// Get single gift
export async function getGift(id) {
  const gifts = await getGifts();
  return gifts.find((g) => g.id === id);
}

// Add gift
export async function addGift(gift) {
  const gifts = await getGifts();
  const newGift = {
    ...gift,
    id: Date.now().toString(),
  };
  gifts.push(newGift);
  await saveGifts(gifts);
  return newGift;
}

// Update gift
export async function updateGift(id, updates) {
  const gifts = await getGifts();
  const index = gifts.findIndex((g) => g.id === id);
  if (index === -1) return null;

  // Ensure priceHistory exists if not present
  if (!gifts[index].priceHistory) {
    gifts[index].priceHistory = [];
  }

  gifts[index] = { ...gifts[index], ...updates, id };
  await saveGifts(gifts);
  return gifts[index];
}

// Track price for a gift
export async function trackPrice(id, price, source = 'manual') {
  const gift = await getGift(id);
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

  await updateGift(id, gift);
  return gift;
}

// Delete gift
export async function deleteGift(id) {
  const gifts = await getGifts();
  const filtered = gifts.filter((g) => g.id !== id);
  if (filtered.length === gifts.length) return false;

  await saveGifts(filtered);
  return true;
}

// Settings functions
const defaultSettings = {
  emoji: '🎄',
  title: 'Christmas Wishlist',
  subtitle: 'Click on any gift to see more details and where to buy',
};

export async function getSettings() {
  try {
    const data = await getFromStorage(SETTINGS_KEY);
    if (data) {
      return data;
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Storage error in getSettings:', error.message);
    }
  }
  
  return defaultSettings;
}

export async function saveSettings(settings) {
  try {
    await setInStorage(SETTINGS_KEY, settings);
    return;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Storage error in saveSettings:', error.message);
    }
    throw new Error('Failed to save settings: ' + error.message);
  }
}
