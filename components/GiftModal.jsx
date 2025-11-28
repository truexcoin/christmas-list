'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
    return '#ffffff';
  }
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

const GiftModal = ({ gift, isOpen, onClose, initialBgColor }) => {
  const [deals, setDeals] = useState(null);
  const [isLoadingDeals, setIsLoadingDeals] = useState(false);
  const [dealsError, setDealsError] = useState(null);
  const [showDeals, setShowDeals] = useState(false);
  const [bgColor, setBgColor] = useState(initialBgColor || '#ffffff');
  const [processedImageUrl, setProcessedImageUrl] = useState(null);
  const [showPriceHistory, setShowPriceHistory] = useState(false);
  const imgRef = useRef(null);


  const priorityClass = {
    high: 'priority-high',
    medium: 'priority-medium',
    low: 'priority-low',
  };

  const priorityLabel = {
    high: '🔥 Must Have',
    medium: '⭐ Would Love',
    low: '💫 Nice to Have',
  };

  // Update bgColor when initialBgColor changes
  useEffect(() => {
    if (initialBgColor) {
      setBgColor(initialBgColor);
      // Process image if it's already loaded
      if (imgRef.current && imgRef.current.complete) {
        const processedUrl = processImageWithBackground(imgRef.current, initialBgColor);
        if (processedUrl) {
          setProcessedImageUrl(processedUrl);
        }
      }
    }
  }, [initialBgColor]);

  // Reset state when modal closes or gift changes
  useEffect(() => {
    if (!isOpen) {
      setDeals(null);
      setShowDeals(false);
      setDealsError(null);
      setProcessedImageUrl(null);
      setBgColor('#ffffff');
    } else if (gift) {
      // Reset processed image when gift changes
      setProcessedImageUrl(null);
      if (initialBgColor) {
        setBgColor(initialBgColor);
      } else {
        setBgColor('#ffffff');
      }
    }
  }, [isOpen, gift?.id, initialBgColor]);

  // Process image when modal opens and image is ready
  useEffect(() => {
    if (isOpen && gift && imgRef.current) {
      const processImage = () => {
        if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
          requestAnimationFrame(() => {
            try {
              const colorToUse = initialBgColor || extractBackgroundColor(imgRef.current);
              if (!initialBgColor) {
                setBgColor(colorToUse);
              } else {
                setBgColor(initialBgColor);
              }
              
              const processedUrl = processImageWithBackground(imgRef.current, colorToUse);
              if (processedUrl) {
                setProcessedImageUrl(processedUrl);
              }
            } catch (error) {
              console.error('Image processing error:', error);
              if (initialBgColor) {
                setBgColor(initialBgColor);
              }
            }
          });
        }
      };

      // Check if image is already loaded
      if (imgRef.current.complete && imgRef.current.naturalWidth > 0) {
        // Small delay to ensure DOM is ready
        const timeoutId = setTimeout(processImage, 50);
        return () => clearTimeout(timeoutId);
      }
      // Otherwise, onLoad will handle it
    }
  }, [isOpen, gift?.id, gift?.image, initialBgColor]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleImageLoad = () => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      // Use requestAnimationFrame to avoid blocking the UI
      requestAnimationFrame(() => {
        try {
          // Use initialBgColor if provided, otherwise extract it
          const currentInitialBgColor = initialBgColor;
          const colorToUse = currentInitialBgColor || extractBackgroundColor(imgRef.current);
          if (!currentInitialBgColor) {
            setBgColor(colorToUse);
          } else {
            setBgColor(currentInitialBgColor);
          }
          
          // Process image (now optimized and faster)
          const processedUrl = processImageWithBackground(imgRef.current, colorToUse);
          if (processedUrl) {
            setProcessedImageUrl(processedUrl);
          }
        } catch (error) {
          // Silently fallback - use original image
          if (initialBgColor) {
            setBgColor(initialBgColor);
          }
        }
      });
    }
  };

  const findDeals = async () => {
    setIsLoadingDeals(true);
    setDealsError(null);
    setShowDeals(true);

    try {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: gift.name,
          description: gift.description,
          price: gift.price,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to fetch deals');
      }

      const data = await res.json();
      setDeals(data);
    } catch (err) {
      console.error('Error fetching deals:', err);
      setDealsError('Failed to find deals. Please try again.');
    } finally {
      setIsLoadingDeals(false);
    }
  };

  if (!gift) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="modal-overlay"
            onClick={onClose}
            style={{ background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)' }}
          />
          
          {/* Modal Content */}
          <motion.div
            className="modal-wrapper"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          >
            <motion.div
              layoutId={`card-container-${gift.id}`}
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              transition={{
                layout: {
                  type: 'spring',
                  stiffness: 350,
                  damping: 35,
                }
              }}
            >
              {/* Close button */}
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: 0.2 }}
                onClick={onClose}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.5rem',
                  zIndex: 10,
                  backdropFilter: 'blur(10px)',
                }}
              >
                ×
              </motion.button>

              {/* Image */}
              <motion.div 
                className="modal-image" 
                style={{ backgroundColor: bgColor }}
                layoutId={`card-image-container-${gift.id}`}
              >
                {gift.image ? (
                  <>
                    {/* Hidden image for processing */}
                    <img
                      key={`hidden-${gift.id}-${gift.image}`}
                      ref={imgRef}
                      src={gift.image}
                      alt=""
                      crossOrigin="anonymous"
                      onLoad={handleImageLoad}
                      onError={() => {
                        // If image fails to load, use white background
                        setBgColor(initialBgColor || '#ffffff');
                      }}
                      style={{ display: 'none', width: 0, height: 0 }}
                    />
                    {/* Display processed or original image */}
                    {processedImageUrl ? (
                      <motion.img 
                        src={processedImageUrl} 
                        alt={gift.name}
                        layoutId={`card-image-${gift.id}`}
                        style={{ backgroundColor: 'transparent' }}
                      />
                    ) : (
                      <motion.img 
                        src={gift.image} 
                        alt={gift.name}
                        crossOrigin="anonymous"
                        layoutId={`card-image-${gift.id}`}
                        style={{ backgroundColor: 'transparent' }}
                      />
                    )}
                  </>
                ) : (
                  <div className="modal-image-placeholder">
                    <span>🎁</span>
                  </div>
                )}
              </motion.div>

              {/* Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: 0.15, duration: 0.3 }}
                style={{
                  padding: '1.5rem',
                  maxHeight: '55vh',
                  overflowY: 'auto',
                  background: 'var(--bg-card)',
                  marginTop: 0,
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1rem',
                    gap: '1rem',
                  }}
                >
                  <motion.h2
                    layoutId={`card-title-${gift.id}`}
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      lineHeight: 1.2,
                    }}
                  >
                    {gift.name}
                  </motion.h2>
                  <motion.span
                    layoutId={`card-price-${gift.id}`}
                    style={{
                      fontSize: '1.75rem',
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, var(--accent-secondary) 0%, var(--accent-primary) 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {gift.price}
                  </motion.span>
                </div>

                {/* Price History */}
                {gift.priceHistory && gift.priceHistory.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    style={{ marginBottom: '1.25rem' }}
                  >
                    <button
                      onClick={() => setShowPriceHistory(!showPriceHistory)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '10px',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseOver={(e) => {
                        e.target.style.borderColor = 'var(--accent-primary)';
                        e.target.style.background = 'var(--bg-card)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.borderColor = 'var(--border-subtle)';
                        e.target.style.background = 'var(--bg-secondary)';
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>📊</span>
                        Price History ({gift.priceHistory.length} entries)
                      </span>
                      <span style={{ transform: showPriceHistory ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                        ▼
                      </span>
                    </button>

                    {showPriceHistory && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                          style={{
                            marginTop: '0.75rem',
                            background: 'var(--bg-card)',
                            borderRadius: '12px',
                            padding: '1rem',
                            border: '1px solid var(--border-subtle)',
                          maxHeight: '300px',
                          overflowY: 'auto',
                        }}
                      >
                        {/* Price Trend Indicator */}
                        {gift.priceHistory.length >= 2 && (() => {
                          const sortedHistory = [...gift.priceHistory].sort((a, b) => 
                            new Date(a.date) - new Date(b.date)
                          );
                          const oldest = parseFloat(sortedHistory[0].price.replace(/[^0-9.]/g, ''));
                          const newest = parseFloat(gift.price.replace(/[^0-9.]/g, ''));
                          const change = newest - oldest;
                          const percentChange = oldest > 0 ? ((change / oldest) * 100).toFixed(1) : 0;
                          const isIncrease = change > 0;
                          const isDecrease = change < 0;

                          return (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '1rem',
                                padding: '0.75rem',
                                background: isIncrease 
                                  ? 'rgba(239, 68, 68, 0.1)' 
                                  : isDecrease 
                                  ? 'rgba(34, 197, 94, 0.1)' 
                                  : 'rgba(156, 163, 175, 0.1)',
                                borderRadius: '8px',
                                border: `1px solid ${isIncrease 
                                  ? 'rgba(239, 68, 68, 0.2)' 
                                  : isDecrease 
                                  ? 'rgba(34, 197, 94, 0.2)' 
                                  : 'rgba(156, 163, 175, 0.2)'}`,
                              }}
                            >
                              <span style={{ fontSize: '1.2rem' }}>
                                {isIncrease ? '📈' : isDecrease ? '📉' : '➡️'}
                              </span>
                              <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                    Price Change
                                  </div>
                                  <div
                                    style={{
                                      fontSize: '0.9rem',
                                      fontWeight: 600,
                                      color: isIncrease 
                                        ? 'var(--priority-high)' 
                                        : isDecrease 
                                        ? '#22c55e' 
                                        : 'var(--text-secondary)',
                                    }}
                                  >
                                    {isIncrease ? '+' : ''}{change.toFixed(2)} ({percentChange}%)
                                  </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Price History List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {[...gift.priceHistory]
                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                            .slice(0, 10)
                            .map((entry, idx) => (
                              <div
                                key={idx}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '0.6rem',
                                  background: 'var(--bg-secondary)',
                                  borderRadius: '8px',
                                  fontSize: '0.85rem',
                                }}
                              >
                                <div>
                                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                                    {entry.price}
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    {new Date(entry.date).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })}
                                    {entry.source && entry.source !== 'manual' && ` • ${entry.source}`}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* Priority */}
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  style={{ marginBottom: '1.25rem' }}
                >
                  <span className={`priority-badge ${priorityClass[gift.priority] || 'priority-medium'}`}>
                    {priorityLabel[gift.priority] || priorityLabel.medium}
                  </span>
                </motion.div>

                {/* Description */}
                {gift.description && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    style={{ marginBottom: '1.5rem' }}
                  >
                    <h3
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '0.5rem',
                      }}
                    >
                      About this gift
                    </h3>
                    <p
                      style={{
                        color: 'var(--text-secondary)',
                        fontSize: '0.95rem',
                        lineHeight: 1.6,
                      }}
                    >
                      {gift.description}
                    </p>
                  </motion.div>
                )}

                {/* Find Deals Button */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={findDeals}
                  disabled={isLoadingDeals}
                  style={{
                    width: '100%',
                    padding: '0.9rem 1.5rem',
                    marginBottom: '1.25rem',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    cursor: isLoadingDeals ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    opacity: isLoadingDeals ? 0.8 : 1,
                    boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
                  }}
                >
                  {isLoadingDeals ? (
                    <>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      >
                        ✨
                      </motion.span>
                      Finding Best Deals...
                    </>
                  ) : (
                    <>
                      <span>🔍</span>
                      Find Deals with AI
                    </>
                  )}
                </motion.button>

                {/* Deals Results */}
                <AnimatePresence>
                  {showDeals && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      {dealsError ? (
                        <div
                          style={{
                            padding: '1rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            borderRadius: '12px',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: 'var(--priority-high)',
                            marginBottom: '1.25rem',
                          }}
                        >
                          {dealsError}
                        </div>
                      ) : deals ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          style={{
                            background: 'var(--bg-secondary)',
                            borderRadius: '16px',
                            padding: '1.25rem',
                            marginBottom: '1.25rem',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              marginBottom: '1rem',
                            }}
                          >
                            <span style={{ fontSize: '1.25rem' }}>✨</span>
                            <h3
                              style={{
                                fontSize: '1rem',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                              }}
                            >
                              AI Deal Finder Results
                            </h3>
                          </div>

                          {/* Summary */}
                          {deals.summary && (
                            <p
                              style={{
                                color: 'var(--text-secondary)',
                                fontSize: '0.9rem',
                                lineHeight: 1.6,
                                marginBottom: '1rem',
                                paddingBottom: '1rem',
                                borderBottom: '1px solid var(--border-subtle)',
                              }}
                            >
                              {deals.summary}
                            </p>
                          )}

                          {/* Retailers */}
                          {deals.retailers && deals.retailers.length > 0 && (
                            <div style={{ marginBottom: '1rem' }}>
                              <h4
                                style={{
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  color: 'var(--text-muted)',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  marginBottom: '0.6rem',
                                }}
                              >
                                Where to Shop
                              </h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {deals.retailers.map((retailer, idx) => (
                                  <motion.a
                                    key={idx}
                                    href={retailer.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      padding: '0.6rem 0.9rem',
                                      background: 'var(--bg-card)',
                                      borderRadius: '8px',
                                      border: '1px solid var(--border-subtle)',
                                      textDecoration: 'none',
                                      transition: 'all 0.2s ease',
                                      cursor: 'pointer',
                                    }}
                                    onMouseOver={(e) => {
                                      e.currentTarget.style.borderColor = 'var(--accent-primary)';
                                      e.currentTarget.style.background = 'var(--bg-card-hover)';
                                    }}
                                    onMouseOut={(e) => {
                                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                                      e.currentTarget.style.background = 'var(--bg-card)';
                                    }}
                                  >
                                    <div>
                                      <span
                                        style={{
                                          color: 'var(--text-primary)',
                                          fontWeight: 600,
                                          fontSize: '0.85rem',
                                        }}
                                      >
                                        {retailer.name}
                                      </span>
                                      {retailer.note && (
                                        <p
                                          style={{
                                            color: 'var(--text-muted)',
                                            fontSize: '0.75rem',
                                            marginTop: '0.15rem',
                                          }}
                                        >
                                          {retailer.note}
                                        </p>
                                      )}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <span
                                        style={{
                                          color: 'var(--accent-primary)',
                                          fontWeight: 600,
                                          fontSize: '0.85rem',
                                        }}
                                      >
                                        {retailer.priceRange}
                                      </span>
                                      <span style={{ color: 'var(--accent-primary)', fontSize: '0.75rem' }}>→</span>
                                    </div>
                                  </motion.a>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Deals */}
                          {deals.deals && deals.deals.length > 0 && (
                            <div style={{ marginBottom: '1rem' }}>
                              <h4
                                style={{
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  color: 'var(--text-muted)',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  marginBottom: '0.6rem',
                                }}
                              >
                                💰 Deals & Tips
                              </h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {deals.deals.map((deal, idx) => (
                                  <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    style={{
                                      padding: '0.6rem',
                                      background: 'rgba(34, 197, 94, 0.1)',
                                      borderRadius: '8px',
                                      border: '1px solid rgba(34, 197, 94, 0.2)',
                                    }}
                                  >
                                    <span
                                      style={{
                                        color: 'var(--priority-low)',
                                        fontWeight: 600,
                                        fontSize: '0.85rem',
                                      }}
                                    >
                                      {deal.title}
                                    </span>
                                    {deal.description && (
                                      <p
                                        style={{
                                          color: 'var(--text-secondary)',
                                          fontSize: '0.8rem',
                                          marginTop: '0.2rem',
                                        }}
                                      >
                                        {deal.description}
                                      </p>
                                    )}
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Alternatives */}
                          {deals.alternatives && deals.alternatives.length > 0 && (
                            <div>
                              <h4
                                style={{
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  color: 'var(--text-muted)',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  marginBottom: '0.6rem',
                                }}
                              >
                                🔄 Alternatives
                              </h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {deals.alternatives.map((alt, idx) => (
                                  <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    style={{
                                      padding: '0.6rem',
                                      background: 'var(--bg-card)',
                                      borderRadius: '8px',
                                      border: '1px solid var(--border-subtle)',
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                      }}
                                    >
                                      <span
                                        style={{
                                          color: 'var(--text-primary)',
                                          fontWeight: 600,
                                          fontSize: '0.85rem',
                                        }}
                                      >
                                        {alt.name}
                                      </span>
                                      <span
                                        style={{
                                          color: 'var(--accent-primary)',
                                          fontWeight: 600,
                                          fontSize: '0.85rem',
                                        }}
                                      >
                                        {alt.price}
                                      </span>
                                    </div>
                                    {alt.reason && (
                                      <p
                                        style={{
                                          color: 'var(--text-muted)',
                                          fontSize: '0.75rem',
                                          marginTop: '0.2rem',
                                        }}
                                      >
                                        {alt.reason}
                                      </p>
                                    )}
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ) : null}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Where to Buy */}
                {gift.stores && gift.stores.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                  >
                    <h3
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '0.75rem',
                      }}
                    >
                      Saved Store Links
                    </h3>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                      }}
                    >
                      {gift.stores.map((store, index) => (
                        <motion.a
                          key={index}
                          href={store.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.35 + index * 0.05 }}
                          whileHover={{ scale: 1.01, x: 4 }}
                          whileTap={{ scale: 0.99 }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.85rem 1rem',
                            background: 'var(--bg-secondary)',
                            borderRadius: '10px',
                            border: '1px solid var(--border-subtle)',
                            textDecoration: 'none',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-accent)';
                            e.currentTarget.style.background = 'var(--bg-card-hover)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-subtle)';
                            e.currentTarget.style.background = 'var(--bg-secondary)';
                          }}
                        >
                          <span
                            style={{
                              color: 'var(--text-primary)',
                              fontWeight: 600,
                              fontSize: '0.95rem',
                            }}
                          >
                            {store.name}
                          </span>
                          <span
                            style={{
                              color: 'var(--accent-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              fontSize: '0.85rem',
                              fontWeight: 500,
                            }}
                          >
                            Shop Now
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M7 17L17 7M17 7H7M17 7V17" />
                            </svg>
                          </span>
                        </motion.a>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default GiftModal;
