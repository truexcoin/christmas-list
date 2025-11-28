// Image search using Unsplash API
// Free tier: 50 requests per hour

export async function searchProductImage(searchTerm) {
  try {
    if (!searchTerm || !searchTerm.trim()) {
      return null;
    }

    // Use Unsplash API (free, no key required for basic usage)
    // Alternative: Use Unsplash Source API which doesn't require authentication
    const query = encodeURIComponent(searchTerm.trim());
    
    // Unsplash Source API - no authentication needed, but limited
    // Using a curated approach with Unsplash's search
    const unsplashUrl = `https://source.unsplash.com/800x600/?${query}`;
    
    // For better results, we can use Unsplash API with a free access key
    // But for now, let's use a simple approach that works without API key
    // We'll use Unsplash's random image API with search terms
    
    // Try to get a relevant image from Unsplash
    // Note: This is a simple approach. For production, consider:
    // 1. Unsplash API with access key (free tier available)
    // 2. Google Custom Search API
    // 3. Pexels API (free)
    
    // For now, return a placeholder that uses Unsplash's source API
    // This will return a random image based on the search term
    return `https://source.unsplash.com/800x600/?${query}&sig=${Date.now()}`;
    
  } catch (error) {
    console.error('Image search error:', error);
    return null;
  }
}

// Alternative: Use Pexels API (free, 200 requests/hour)
export async function searchProductImagePexels(searchTerm, apiKey) {
  try {
    if (!searchTerm || !searchTerm.trim() || !apiKey) {
      return null;
    }

    const query = encodeURIComponent(searchTerm.trim());
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${query}&per_page=1&orientation=landscape`,
      {
        headers: {
          'Authorization': apiKey
        }
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.photos && data.photos.length > 0) {
      return data.photos[0].src.large || data.photos[0].src.medium;
    }

    return null;
  } catch (error) {
    console.error('Pexels image search error:', error);
    return null;
  }
}

// Alternative: Use Unsplash API with access key (better quality)
export async function searchProductImageUnsplash(searchTerm, accessKey) {
  try {
    if (!searchTerm || !searchTerm.trim() || !accessKey) {
      return null;
    }

    const query = encodeURIComponent(searchTerm.trim());
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${query}&per_page=1&orientation=landscape&client_id=${accessKey}`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].urls.regular || data.results[0].urls.small;
    }

    return null;
  } catch (error) {
    console.error('Unsplash API image search error:', error);
    return null;
  }
}

