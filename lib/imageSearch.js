// Image search fallback using placeholder service
// This is used when no API keys are provided

export async function searchProductImage(searchTerm) {
  try {
    if (!searchTerm || !searchTerm.trim()) {
      return null;
    }

    const query = encodeURIComponent(searchTerm.trim());
    
    // Use a placeholder image service as fallback
    // This provides a simple image based on the search term
    // Note: For better results, use Pexels or Unsplash API keys
    return `https://source.unsplash.com/800x600/?${query}&sig=${Date.now()}`;
    
  } catch (error) {
    console.error('Image search error:', error);
    return null;
  }
}

// Use Pexels API (free, 200 requests/hour)
// Get API key at: https://www.pexels.com/api/
export async function searchProductImagePexels(searchTerm, apiKey) {
  try {
    if (!searchTerm || !searchTerm.trim() || !apiKey) {
      return null;
    }

    const query = encodeURIComponent(searchTerm.trim());
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    try {
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${query}&per_page=1&orientation=landscape`,
        {
          headers: {
            'Authorization': apiKey
          },
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`Pexels API error: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      if (data.photos && data.photos.length > 0) {
        // Prefer large, fallback to medium
        return data.photos[0].src.large || data.photos[0].src.medium || data.photos[0].src.original;
      }

      return null;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('Pexels API request timeout');
      } else {
        console.error('Pexels API fetch error:', fetchError.message);
      }
      return null;
    }
  } catch (error) {
    console.error('Pexels image search error:', error);
    return null;
  }
}

// Use Unsplash API with access key (better quality)
// Free tier: 50 requests per hour
// Get access key at: https://unsplash.com/developers
export async function searchProductImageUnsplash(searchTerm, accessKey) {
  try {
    if (!searchTerm || !searchTerm.trim() || !accessKey) {
      return null;
    }

    const query = encodeURIComponent(searchTerm.trim());
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${query}&per_page=1&orientation=landscape&client_id=${accessKey}`,
        {
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`Unsplash API error: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      if (data.results && data.results.length > 0) {
        // Prefer regular size, fallback to small
        return data.results[0].urls.regular || data.results[0].urls.small || data.results[0].urls.thumb;
      }

      return null;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('Unsplash API request timeout');
      } else {
        console.error('Unsplash API fetch error:', fetchError.message);
      }
      return null;
    }
  } catch (error) {
    console.error('Unsplash image search error:', error);
    return null;
  }
}

