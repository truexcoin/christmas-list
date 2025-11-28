'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import Background from '@/components/Background';
import GiftCard from '@/components/GiftCard';
import GiftModal from '@/components/GiftModal';

export default function Home() {
  const [gifts, setGifts] = useState([]);
  const [selectedGift, setSelectedGift] = useState(null);
  const [selectedBgColor, setSelectedBgColor] = useState('#ffffff');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState({
    emoji: '🎄',
    title: 'Christmas Wishlist',
    subtitle: 'Click on any gift to see more details and where to buy',
  });
  
  // Sort state
  const [sortBy, setSortBy] = useState('priority'); // priority, price-high, price-low, name-asc, name-desc

  // Fetch data in parallel for better performance
  useEffect(() => {
    let timeoutId;
    
    const fetchData = async () => {
      try {
        // Fetch both in parallel
        const [giftsRes, settingsRes] = await Promise.all([
          fetch('/api/gifts'),
          fetch('/api/settings'),
        ]);
        
        const [giftsData, settingsData] = await Promise.all([
          giftsRes.json(),
          settingsRes.json(),
        ]);
        
        setGifts(giftsData);
        setSettings(settingsData);
      } catch (err) {
        // Silently handle errors in production
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to fetch data:', err);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // Memoize callbacks to prevent unnecessary re-renders
  const openModal = useCallback((gift, bgColor) => {
    setSelectedGift(gift);
    setSelectedBgColor(bgColor || '#f5f5f7');
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    // Don't clear selectedGift immediately - let animation complete
    setTimeout(() => {
      setSelectedGift(null);
      setSelectedBgColor('#ffffff');
    }, 600);
  }, []);

  // Helper function to extract numeric price from string like "$348" or "$139.99"
  const extractPrice = (priceStr) => {
    if (!priceStr) return 0;
    const match = priceStr.match(/\$?(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };

  // Sort gifts
  const sortedGifts = useMemo(() => {
    let sorted = [...gifts];

    // Apply sorting
    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        
        case 'price-high':
          return extractPrice(b.price) - extractPrice(a.price);
        
        case 'price-low':
          return extractPrice(a.price) - extractPrice(b.price);
        
        case 'name-asc':
          return (a.name || '').localeCompare(b.name || '');
        
        case 'name-desc':
          return (b.name || '').localeCompare(a.name || '');
        
        default:
          return 0;
      }
    });

    return sorted;
  }, [gifts, sortBy]);

  return (
    <LayoutGroup>
      <div style={{ minHeight: '100vh', position: 'relative' }}>
        <Background />

        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="header"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              style={{ fontSize: '4rem', marginBottom: '1rem' }}
            >
              {settings.emoji}
            </motion.div>
            <h1>
              <span className="text-gradient">{settings.title}</span>
            </h1>
            <p>{settings.subtitle}</p>
          </motion.header>

          {/* Sort Options */}
          {!isLoading && gifts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                marginBottom: '2rem',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
              }}
            >
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  fontWeight: 500,
                  minWidth: '180px',
                  transition: 'all 0.2s ease',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--accent-primary)';
                  e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-subtle)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <option value="priority">Sort: Priority</option>
                <option value="price-high">Sort: Price (High to Low)</option>
                <option value="price-low">Sort: Price (Low to High)</option>
                <option value="name-asc">Sort: Name (A-Z)</option>
                <option value="name-desc">Sort: Name (Z-A)</option>
              </select>
            </motion.div>
          )}

          {/* Loading state */}
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '40vh',
              }}
            >
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                  style={{ fontSize: '3rem', marginBottom: '1rem' }}
                >
                  ❄️
                </motion.div>
                Loading gifts...
              </div>
            </motion.div>
          ) : gifts.length === 0 ? (
            /* Empty state */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                textAlign: 'center',
                padding: '6rem 2rem',
                color: 'var(--text-muted)',
              }}
            >
              <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>🎁</div>
              <h2
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  marginBottom: '0.75rem',
                  color: 'var(--text-secondary)',
                }}
              >
                No gifts yet
              </h2>
              <p style={{ marginBottom: '2rem' }}>
                The wishlist is empty. Check back soon!
              </p>
              <a
                href="/admin"
                style={{
                  color: 'var(--accent-primary)',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                Admin? Add gifts →
              </a>
            </motion.div>
          ) : (
            /* Gift grid */
            <div className="gift-grid">
              {sortedGifts.map((gift, index) => (
                <GiftCard
                  key={gift.id}
                  gift={gift}
                  index={index}
                  onClick={openModal}
                />
              ))}
            </div>
          )}

          {/* Footer */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{
              textAlign: 'center',
              padding: '2rem 0 3rem',
              color: 'var(--text-muted)',
              fontSize: '0.875rem',
            }}
          >
            <a
              href="/admin"
              style={{
                color: 'var(--text-muted)',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseOver={(e) => (e.target.style.color = 'var(--accent-primary)')}
              onMouseOut={(e) => (e.target.style.color = 'var(--text-muted)')}
            >
              Admin Panel
            </a>
          </motion.footer>
        </div>

        {/* Gift Modal */}
        <GiftModal 
          gift={selectedGift} 
          isOpen={isModalOpen} 
          onClose={closeModal}
          initialBgColor={selectedBgColor}
        />
      </div>
    </LayoutGroup>
  );
}
