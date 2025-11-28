'use client';

import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { motion } from 'framer-motion';

// Extract background color using smart algorithm (optimized)
function extractBackgroundColor(img) {
  try {
    // Check if image is loaded
    if (!img || !img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) {
      return '#ffffff';
    }
    
    // Use smaller canvas for faster processing (max 400px)
    const maxSize = 400;
    const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = Math.floor(img.naturalWidth * scale);
    canvas.height = Math.floor(img.naturalHeight * scale);
    
    try {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    } catch (drawError) {
      return '#ffffff';
    }
    
    const w = canvas.width;
    const h = canvas.height;
    
    // Optimize: Sample fewer pixels and batch getImageData calls
    const edgeSamples = [];
    const sampleSize = Math.max(5, Math.floor(Math.min(w, h) * 0.1)); // Sample 10% but with larger steps
    
    try {
      // Batch getImageData calls - get all edge pixels at once
      const edgeWidth = Math.min(3, Math.floor(w * 0.1)); // Sample a strip from edges
      const edgeHeight = Math.min(3, Math.floor(h * 0.1));
      
      // Top edge strip
      const topData = ctx.getImageData(0, 0, w, edgeHeight).data;
      for (let x = 0; x < w; x += sampleSize) {
        const idx = (x + Math.floor(edgeHeight / 2) * w) * 4;
        edgeSamples.push({ r: topData[idx], g: topData[idx + 1], b: topData[idx + 2] });
      }
      
      // Bottom edge strip
      const bottomData = ctx.getImageData(0, h - edgeHeight, w, edgeHeight).data;
      for (let x = 0; x < w; x += sampleSize) {
        const idx = (x + Math.floor(edgeHeight / 2) * w) * 4;
        edgeSamples.push({ r: bottomData[idx], g: bottomData[idx + 1], b: bottomData[idx + 2] });
      }
      
      // Left edge strip
      const leftData = ctx.getImageData(0, 0, edgeWidth, h).data;
      for (let y = 0; y < h; y += sampleSize) {
        const idx = (Math.floor(edgeWidth / 2) + y * edgeWidth) * 4;
        edgeSamples.push({ r: leftData[idx], g: leftData[idx + 1], b: leftData[idx + 2] });
      }
      
      // Right edge strip
      const rightData = ctx.getImageData(w - edgeWidth, 0, edgeWidth, h).data;
      for (let y = 0; y < h; y += sampleSize) {
        const idx = (Math.floor(edgeWidth / 2) + y * edgeWidth) * 4;
        edgeSamples.push({ r: rightData[idx], g: rightData[idx + 1], b: rightData[idx + 2] });
      }
    } catch (getDataError) {
      return '#ffffff';
    }
    
    // Optimized clustering - use simpler approach
    const colorClusters = [];
    const similarityThreshold = 40; // Slightly larger threshold for faster grouping
    
    for (const sample of edgeSamples) {
      let foundCluster = false;
      
      // Use squared distance (faster than sqrt)
      for (const cluster of colorClusters) {
        const dr = sample.r - cluster.avg.r;
        const dg = sample.g - cluster.avg.g;
        const db = sample.b - cluster.avg.b;
        const distanceSq = dr * dr + dg * dg + db * db;
        
        if (distanceSq < similarityThreshold * similarityThreshold) {
          // Update cluster average incrementally (faster)
          const count = cluster.samples.length;
          cluster.samples.push(sample);
          cluster.avg = {
            r: Math.round((cluster.avg.r * count + sample.r) / (count + 1)),
            g: Math.round((cluster.avg.g * count + sample.g) / (count + 1)),
            b: Math.round((cluster.avg.b * count + sample.b) / (count + 1)),
          };
          foundCluster = true;
          break;
        }
      }
      
      if (!foundCluster) {
        colorClusters.push({
          samples: [sample],
          avg: { r: sample.r, g: sample.g, b: sample.b }
        });
      }
    }
    
    // Find the largest cluster (most common color = background)
    // But prefer lighter colors over black/dark colors
    colorClusters.sort((a, b) => {
      // Calculate brightness for each cluster
      const brightnessA = (a.avg.r + a.avg.g + a.avg.b) / 3;
      const brightnessB = (b.avg.r + b.avg.g + b.avg.b) / 3;
      
      // If one is very dark (black) and the other is lighter, prefer the lighter one
      if (brightnessA < 50 && brightnessB > 50) return 1; // b is lighter, prefer it
      if (brightnessB < 50 && brightnessA > 50) return -1; // a is lighter, prefer it
      
      // Otherwise, prefer the cluster with more samples
      return b.samples.length - a.samples.length;
    });
    
    if (colorClusters.length > 0) {
      const dominantColor = colorClusters[0].avg;
      const brightness = (dominantColor.r + dominantColor.g + dominantColor.b) / 3;
      
      // If the dominant color is too dark (likely black), try the next cluster
      if (brightness < 50 && colorClusters.length > 1) {
        // Find the brightest cluster
        let brightestCluster = colorClusters[0];
        for (let i = 1; i < colorClusters.length; i++) {
          const clusterBrightness = (colorClusters[i].avg.r + colorClusters[i].avg.g + colorClusters[i].avg.b) / 3;
          const currentBrightness = (brightestCluster.avg.r + brightestCluster.avg.g + brightestCluster.avg.b) / 3;
          if (clusterBrightness > currentBrightness) {
            brightestCluster = colorClusters[i];
          }
        }
        // Use brightest if it's significantly brighter
        if ((brightestCluster.avg.r + brightestCluster.avg.g + brightestCluster.avg.b) / 3 > 100) {
          return `rgb(${brightestCluster.avg.r}, ${brightestCluster.avg.g}, ${brightestCluster.avg.b})`;
        }
      }
      
      // If still too dark, default to white
      if (brightness < 50) {
        return '#ffffff';
      }
      
      return `rgb(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b})`;
    }
    
    // Fallback: average of all edge samples, but avoid black
    const avg = edgeSamples.reduce(
      (acc, s) => ({ r: acc.r + s.r, g: acc.g + s.g, b: acc.b + s.b }),
      { r: 0, g: 0, b: 0 }
    );
    const count = edgeSamples.length;
    const avgBrightness = (avg.r + avg.g + avg.b) / (count * 3);
    
    // If average is too dark, return white
    if (avgBrightness < 50) {
      return '#ffffff';
    }
    
    return `rgb(${Math.round(avg.r/count)}, ${Math.round(avg.g/count)}, ${Math.round(avg.b/count)})`;
  } catch (e) {
    console.error('Error extracting background color:', e);
    // If CORS blocks us, try a different approach or return a neutral color
    // For now, return white as fallback
    return '#ffffff';
  }
}

// Alternative: Try to get background color from CSS computed style if canvas fails
function getBackgroundColorFallback(img) {
  // This won't work for external images, but it's a fallback
  return '#ffffff';
}

// Process image to replace black/blank pixels with background color (optimized)
function processImageWithBackground(img, bgColor) {
  try {
    if (!img || !img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) {
      return null;
    }
    
    // Use smaller canvas for processing if image is large (max 800px)
    const maxSize = 800;
    const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = Math.floor(img.naturalWidth * scale);
    canvas.height = Math.floor(img.naturalHeight * scale);
    
    // Parse background color
    const rgbMatch = bgColor.match(/\d+/g);
    if (!rgbMatch || rgbMatch.length < 3) {
      return null;
    }
    const bgR = parseInt(rgbMatch[0]);
    const bgG = parseInt(rgbMatch[1]);
    const bgB = parseInt(rgbMatch[2]);
    
    // Draw image scaled
    try {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    } catch (drawError) {
      return null;
    }
    
    // Get image data
    let imageData;
    try {
      imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } catch (getDataError) {
      return null;
    }
    const data = imageData.data;
    
    // Threshold for detecting black/dark pixels
    const blackThreshold = 30;
    
    // Optimized pixel processing - process all at once but efficiently
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      
      if (a < 128) {
        // Transparent -> white (fast path)
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = 255;
      } else {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Check black (only if not transparent)
        if (r < blackThreshold && g < blackThreshold && b < blackThreshold) {
          // Black -> background color
          data[i] = bgR;
          data[i + 1] = bgG;
          data[i + 2] = bgB;
          data[i + 3] = 255;
        }
      }
    }
    
    // Put processed data back
    ctx.putImageData(imageData, 0, 0);
    
    // Return as data URL
    return canvas.toDataURL('image/png');
  } catch (e) {
    return null;
  }
}

const GiftCard = memo(({ gift, onClick, index }) => {
  const [imageError, setImageError] = useState(false);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [processedImageUrl, setProcessedImageUrl] = useState(null);
  const imgRef = useRef(null);
  
  const priorityClass = {
    high: 'priority-high',
    medium: 'priority-medium',
    low: 'priority-low',
  };

  const handleImageLoad = useCallback(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      // Use requestAnimationFrame to avoid blocking the UI
      requestAnimationFrame(() => {
        try {
          const color = extractBackgroundColor(imgRef.current);
          setBgColor(color);
          
          // Process image (now optimized and faster)
          const processedUrl = processImageWithBackground(imgRef.current, color);
          if (processedUrl) {
            setProcessedImageUrl(processedUrl);
          }
        } catch (error) {
          // Silently fallback to white background
          setBgColor('#ffffff');
        }
      });
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(gift, bgColor)}
      className="gift-card"
      layoutId={`card-container-${gift.id}`}
    >
      {/* Image container */}
      <motion.div 
        className="gift-card-image"
        style={{ backgroundColor: bgColor }}
        layoutId={`card-image-container-${gift.id}`}
      >
        {gift.image && !imageError ? (
          <>
            {/* Hidden image for processing - load this first */}
            <img
              ref={imgRef}
              src={gift.image}
              alt=""
              crossOrigin="anonymous"
              onLoad={handleImageLoad}
              onError={(e) => {
                console.error('Image load error:', e);
                setImageError(true);
              }}
              style={{ display: 'none', width: 0, height: 0 }}
            />
            {/* Display processed or original image */}
            {processedImageUrl ? (
              <motion.img
                key="processed"
                src={processedImageUrl}
                alt={gift.name}
                layoutId={`card-image-${gift.id}`}
                style={{ backgroundColor: 'transparent' }}
              />
            ) : (
              <motion.img
                key="original"
                src={gift.image}
                alt={gift.name}
                crossOrigin="anonymous"
                layoutId={`card-image-${gift.id}`}
                style={{ backgroundColor: 'transparent' }}
              />
            )}
          </>
        ) : (
          <div className="gift-card-placeholder">
            <span>🎁</span>
          </div>
        )}

        {/* Priority badge */}
        <motion.div 
          className="gift-card-badge"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.08 + 0.3 }}
        >
          <span className={`priority-badge ${priorityClass[gift.priority] || 'priority-medium'}`}>
            {gift.priority || 'medium'}
          </span>
        </motion.div>
      </motion.div>

      {/* Content */}
      <div className="gift-card-content">
        <motion.h3 
          className="gift-card-title"
          layoutId={`card-title-${gift.id}`}
        >
          {gift.name}
        </motion.h3>

        {gift.description && (
          <p className="gift-card-description">{gift.description}</p>
        )}

        <div className="gift-card-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <motion.span 
              className="gift-card-price"
              layoutId={`card-price-${gift.id}`}
            >
              {gift.price}
            </motion.span>
            {gift.priceHistory && gift.priceHistory.length >= 2 && (() => {
              const sortedHistory = [...gift.priceHistory].sort((a, b) => 
                new Date(a.date) - new Date(b.date)
              );
              const oldest = parseFloat(sortedHistory[0].price.replace(/[^0-9.]/g, ''));
              const newest = parseFloat(gift.price.replace(/[^0-9.]/g, ''));
              const change = newest - oldest;
              const isIncrease = change > 0;
              const isDecrease = change < 0;
              
              if (isIncrease || isDecrease) {
                return (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: isIncrease ? 'var(--priority-high)' : '#22c55e',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                    title={`Price ${isIncrease ? 'increased' : 'decreased'} by $${Math.abs(change).toFixed(2)}`}
                  >
                    {isIncrease ? '📈' : '📉'}
                  </span>
                );
              }
              return null;
            })()}
          </div>

          {gift.stores && gift.stores.length > 0 && (
            <span className="gift-card-stores">
              {gift.stores.length} store{gift.stores.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  return (
    prevProps.gift.id === nextProps.gift.id &&
    prevProps.gift.image === nextProps.gift.image &&
    prevProps.gift.name === nextProps.gift.name &&
    prevProps.gift.price === nextProps.gift.price &&
    prevProps.index === nextProps.index
  );
});

GiftCard.displayName = 'GiftCard';

export default GiftCard;
