'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Background from '@/components/Background';
import GiftForm from '@/components/GiftForm';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [gifts, setGifts] = useState([]);
  const [editingGift, setEditingGift] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    emoji: '🎄',
    title: 'Christmas Wishlist',
    subtitle: 'Click on any gift to see more details and where to buy',
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [showDataManagement, setShowDataManagement] = useState(false);
  const [exportData, setExportData] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [clearExisting, setClearExisting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Fetch gifts and settings when authenticated (in parallel)
  useEffect(() => {
    if (isAuthenticated) {
      // Fetch both in parallel for better performance
      Promise.all([fetchGifts(), fetchSettings()]).catch((err) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to fetch data:', err);
        }
      });
    }
  }, [isAuthenticated]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(data);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  const saveSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Failed to save settings');
    } finally {
      setSettingsLoading(false);
    }
  };

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/check');
      const data = await res.json();
      setIsAuthenticated(data.authenticated);
    } catch (err) {
      console.error('Auth check failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setActionLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        setIsAuthenticated(true);
        setPassword('');
      } else {
        setLoginError('Invalid password');
      }
    } catch (err) {
      setLoginError('Login failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/login', { method: 'DELETE' });
      setIsAuthenticated(false);
      setGifts([]);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const fetchGifts = async () => {
    try {
      const res = await fetch('/api/gifts');
      const data = await res.json();
      setGifts(data);
    } catch (err) {
      console.error('Failed to fetch gifts:', err);
    }
  };

  const handleSubmit = async (giftData) => {
    setActionLoading(true);
    try {
      // Only update if editingGift has an id (existing gift), otherwise create new
      const url = editingGift?.id ? `/api/gifts/${editingGift.id}` : '/api/gifts';
      const method = editingGift?.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(giftData),
      });

      if (res.ok) {
        await fetchGifts();
        setShowForm(false);
        setEditingGift(null);
      } else {
        const error = await res.json();
        const errorMsg = error.error || 'Failed to save gift';
        console.error('[Admin] Save failed:', errorMsg);
        alert(errorMsg);
      }
    } catch (err) {
      console.error('[Admin] Save failed:', err);
      alert(err.message || 'Failed to save gift. Please check your connection and try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this gift?')) return;

    try {
      const res = await fetch(`/api/gifts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchGifts();
      } else {
        alert('Failed to delete gift');
      }
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete gift');
    }
  };

  const handleEdit = (gift) => {
    setEditingGift(gift);
    setShowForm(true);
  };

  const handleTrackPrice = async (giftId, newPrice) => {
    if (!newPrice || !newPrice.trim()) {
      alert('Please enter a price');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/gifts/${giftId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price: newPrice,
          source: 'manual',
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to track price');
      }

      // Refresh gifts list
      await fetchGifts();
    } catch (err) {
      console.error('Error tracking price:', err);
      alert('Failed to track price. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingGift(null);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingGift(null);
  };

  const handleGetRecommendations = async () => {
    if (gifts.length === 0) {
      alert('Please add some gifts first to get recommendations!');
      return;
    }

    setIsLoadingRecommendations(true);
    setShowRecommendations(true);

    try {
      const res = await fetch('/api/gifts/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gifts }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to get recommendations');
      }

      const data = await res.json();
      setRecommendations(data);
    } catch (err) {
      console.error('Error getting recommendations:', err);
      alert('Failed to get recommendations. Please try again.');
      setShowRecommendations(false);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const handleAddRecommendation = (recommendation) => {
    // Pre-fill form with recommendation data
    const giftData = {
      name: recommendation.name,
      description: recommendation.description,
      price: recommendation.price,
      priority: recommendation.priority || 'medium',
      image: '', // User can add image manually
      stores: [],
    };

    setEditingGift(giftData);
    setShowForm(true);
    // Scroll to form
    setTimeout(() => {
      document.querySelector('.gift-form-container')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 100);
  };

  const handleExportData = async () => {
    setIsExporting(true);
    setImportError('');
    setImportSuccess('');
    try {
      const res = await fetch('/api/export');
      if (!res.ok) {
        throw new Error('Failed to export data');
      }
      const data = await res.json();
      setExportData(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('Export failed:', err);
      setImportError('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (exportData) {
      navigator.clipboard.writeText(exportData);
      setImportSuccess('Copied to clipboard!');
      setTimeout(() => setImportSuccess(''), 3000);
    }
  };

  const handleDownloadJson = () => {
    if (exportData) {
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `christmas-list-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setImportSuccess('File downloaded!');
      setTimeout(() => setImportSuccess(''), 3000);
    }
  };

  const handleImportData = async () => {
    if (!importJson.trim()) {
      setImportError('Please paste JSON data');
      return;
    }

    setIsImporting(true);
    setImportError('');
    setImportSuccess('');

    try {
      const data = JSON.parse(importJson);
      
      if (!data.gifts || !Array.isArray(data.gifts)) {
        throw new Error('Invalid JSON format: gifts must be an array');
      }

      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gifts: data.gifts,
          settings: data.settings || null,
          clearExisting,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to import data');
      }

      const result = await res.json();
      setImportSuccess(`Successfully imported ${result.imported.gifts} gift(s)!`);
      setImportJson('');
      setClearExisting(false);
      
      // Refresh gifts list
      await fetchGifts();
      if (data.settings) {
        await fetchSettings();
      }

      setTimeout(() => {
        setImportSuccess('');
        setShowDataManagement(false);
      }, 3000);
    } catch (err) {
      console.error('Import failed:', err);
      setImportError(err.message || 'Failed to import data. Please check the JSON format.');
    } finally {
      setIsImporting(false);
    }
  };

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Background />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ color: 'var(--text-secondary)' }}
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  // Login form
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', position: 'relative' }}>
        <Background />
        <div
          className="container"
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 10,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'var(--bg-card)',
              borderRadius: '24px',
              padding: '3rem',
              width: '100%',
              maxWidth: '400px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎄</div>
              <h1
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  marginBottom: '0.5rem',
                }}
              >
                Admin Login
              </h1>
              <p style={{ color: 'var(--text-secondary)' }}>
                Enter the password to manage gifts
              </p>
            </div>

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="Password"
                  autoFocus
                />
                {loginError && <p className="form-error">{loginError}</p>}
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={actionLoading}
                style={{ width: '100%', marginTop: '1rem' }}
              >
                {actionLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <a
              href="/"
              style={{
                display: 'block',
                textAlign: 'center',
                marginTop: '1.5rem',
                color: 'var(--text-muted)',
                textDecoration: 'none',
                fontSize: '0.9rem',
              }}
            >
              ← Back to wishlist
            </a>
          </motion.div>
        </div>
      </div>
    );
  }

  // Admin panel
  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <Background />
      <div className="container" style={{ position: 'relative', zIndex: 10 }}>
        {/* Header */}
        <div className="admin-header">
          <div>
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                marginBottom: '0.25rem',
              }}
            >
              🎁 Gift Manager
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              {gifts.length} gift{gifts.length !== 1 ? 's' : ''} in your list
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <a href="/" className="btn-secondary" style={{ textDecoration: 'none' }}>
              View List
            </a>
            <button onClick={handleLogout} className="btn-secondary">
              Logout
            </button>
          </div>
        </div>

        {/* AI Recommendations Section */}
        {gifts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: '2rem' }}
          >
            <div
              style={{
                background: 'var(--bg-card)',
                borderRadius: '16px',
                padding: '1.5rem',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: showRecommendations ? '1rem' : 0,
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      marginBottom: '0.25rem',
                      color: 'var(--text-primary)',
                    }}
                  >
                    🤖 AI Gift Recommendations
                  </h3>
                  <p
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Get personalized gift suggestions based on your wishlist
                  </p>
                </div>
                <button
                  onClick={handleGetRecommendations}
                  disabled={isLoadingRecommendations}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: isLoadingRecommendations
                      ? 'var(--bg-secondary)'
                      : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    cursor: isLoadingRecommendations ? 'wait' : 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    opacity: isLoadingRecommendations ? 0.7 : 1,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isLoadingRecommendations ? (
                    <>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      >
                        ✨
                      </motion.span>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      Get Recommendations
                    </>
                  )}
                </button>
              </div>

              {/* Recommendations Display */}
              <AnimatePresence>
                {showRecommendations && recommendations && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden', marginTop: '1.5rem' }}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '1rem',
                      }}
                    >
                      {recommendations.recommendations?.map((rec, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          style={{
                            background: 'var(--bg-secondary)',
                            borderRadius: '12px',
                            padding: '1.25rem',
                            border: '1px solid var(--border-subtle)',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-accent)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-subtle)';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              marginBottom: '0.75rem',
                            }}
                          >
                            <h4
                              style={{
                                fontSize: '1rem',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                flex: 1,
                                marginRight: '0.5rem',
                              }}
                            >
                              {rec.name}
                            </h4>
                            <span
                              className={`priority-badge priority-${rec.priority || 'medium'}`}
                              style={{ flexShrink: 0 }}
                            >
                              {rec.priority || 'medium'}
                            </span>
                          </div>

                          <p
                            style={{
                              fontSize: '0.85rem',
                              color: 'var(--text-secondary)',
                              marginBottom: '0.75rem',
                              lineHeight: 1.5,
                            }}
                          >
                            {rec.description}
                          </p>

                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '0.75rem',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '1rem',
                                fontWeight: 700,
                                color: 'var(--accent-primary)',
                              }}
                            >
                              {rec.price}
                            </span>
                            {rec.reason && (
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  color: 'var(--text-muted)',
                                  fontStyle: 'italic',
                                }}
                              >
                                {rec.reason}
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => handleAddRecommendation(rec)}
                            style={{
                              width: '100%',
                              padding: '0.65rem 1rem',
                              background: 'var(--accent-primary)',
                              border: 'none',
                              borderRadius: '8px',
                              color: 'white',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.transform = 'scale(1.02)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = 'scale(1)';
                            }}
                          >
                            Add to Wishlist
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Add new gift button or form */}
        <AnimatePresence mode="wait">
          {showForm ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ marginBottom: '2rem', overflow: 'hidden' }}
              className="gift-form-container"
            >
              <GiftForm
                gift={editingGift}
                onSubmit={handleSubmit}
                onCancel={cancelForm}
                isLoading={actionLoading}
              />
            </motion.div>
          ) : (
            <motion.button
              key="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleAddNew}
              className="btn-primary"
              style={{
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>+</span>
              Add New Gift
            </motion.button>
          )}
        </AnimatePresence>

        {/* Gift list */}
        <div style={{ paddingBottom: '2rem' }}>
          {gifts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                color: 'var(--text-muted)',
              }}
            >
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎄</div>
              <p>No gifts yet. Add your first gift!</p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {gifts.map((gift, index) => (
                <motion.div
                  key={gift.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className="gift-list-item"
                >
                  {/* Image */}
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '12px',
                      background: 'var(--bg-secondary)',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    {gift.image ? (
                      <img
                        src={gift.image}
                        alt={gift.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.5rem',
                        }}
                      >
                        🎁
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '0.25rem',
                      }}
                    >
                      <h3
                        style={{
                          fontSize: '1rem',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {gift.name}
                      </h3>
                      <span
                        className={`priority-badge priority-${gift.priority || 'medium'}`}
                        style={{ flexShrink: 0 }}
                      >
                        {gift.priority || 'medium'}
                      </span>
                    </div>
                    <div>
                      <p
                        style={{
                          color: 'var(--accent-primary)',
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          marginBottom: '0.25rem',
                        }}
                      >
                        {gift.price}
                      </p>
                      {gift.priceHistory && gift.priceHistory.length > 0 && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {gift.priceHistory.length} price{gift.priceHistory.length > 1 ? 's' : ''} tracked
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.5rem',
                      flexShrink: 0,
                      flexDirection: 'column',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleEdit(gift)}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '8px',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          transition: 'all 0.2s ease',
                          flex: 1,
                        }}
                        onMouseOver={(e) => {
                          e.target.style.borderColor = 'var(--border-accent)';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.borderColor = 'var(--border-subtle)';
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          const newPrice = prompt('Enter new price (e.g., $99.99):', gift.price);
                          if (newPrice) {
                            handleTrackPrice(gift.id, newPrice);
                          }
                        }}
                        disabled={actionLoading}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '8px',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-primary)',
                          cursor: actionLoading ? 'wait' : 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          transition: 'all 0.2s ease',
                          flex: 1,
                          opacity: actionLoading ? 0.6 : 1,
                        }}
                        onMouseOver={(e) => {
                          if (!actionLoading) {
                            e.target.style.borderColor = 'var(--accent-primary)';
                            e.target.style.background = 'var(--bg-card)';
                          }
                        }}
                        onMouseOut={(e) => {
                          e.target.style.borderColor = 'var(--border-subtle)';
                          e.target.style.background = 'var(--bg-secondary)';
                        }}
                      >
                        📊 Track Price
                      </button>
                    </div>
                    <button
                      onClick={() => handleDelete(gift.id)}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: 'var(--priority-high)',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        transition: 'all 0.2s ease',
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = 'rgba(239, 68, 68, 0.2)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Data Management */}
        <div style={{ paddingBottom: '2rem' }}>
          <button
            onClick={() => setShowDataManagement(!showDataManagement)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 500,
              width: '100%',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📋 Export/Import Data
            </span>
            <span style={{ 
              transform: showDataManagement ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}>
              ▼
            </span>
          </button>

          <AnimatePresence>
            {showDataManagement && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '1.5rem',
                    background: 'var(--bg-card)',
                    borderRadius: '16px',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {/* Export Section */}
                  <div style={{ marginBottom: '2rem' }}>
                    <h3
                      style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        marginBottom: '1rem',
                      }}
                    >
                      📤 Export Data
                    </h3>
                    <p
                      style={{
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '1rem',
                      }}
                    >
                      Export all your gifts and settings as JSON. You can copy it or download as a file.
                    </p>
                    <button
                      onClick={handleExportData}
                      disabled={isExporting}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: isExporting
                          ? 'var(--bg-secondary)'
                          : 'linear-gradient(135deg, var(--accent-primary) 0%, #c49a3a 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        color: 'white',
                        cursor: isExporting ? 'wait' : 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        marginBottom: '1rem',
                        opacity: isExporting ? 0.7 : 1,
                      }}
                    >
                      {isExporting ? 'Exporting...' : 'Export Data'}
                    </button>

                    {exportData && (
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            gap: '0.5rem',
                            marginBottom: '0.75rem',
                          }}
                        >
                          <button
                            onClick={handleCopyToClipboard}
                            style={{
                              padding: '0.5rem 1rem',
                              background: 'var(--bg-secondary)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '8px',
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              fontWeight: 500,
                            }}
                          >
                            📋 Copy to Clipboard
                          </button>
                          <button
                            onClick={handleDownloadJson}
                            style={{
                              padding: '0.5rem 1rem',
                              background: 'var(--bg-secondary)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '8px',
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              fontWeight: 500,
                            }}
                          >
                            💾 Download JSON File
                          </button>
                        </div>
                        <textarea
                          value={exportData}
                          readOnly
                          style={{
                            width: '100%',
                            minHeight: '200px',
                            padding: '1rem',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '12px',
                            color: 'var(--text-primary)',
                            fontFamily: 'monospace',
                            fontSize: '0.85rem',
                            resize: 'vertical',
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Import Section */}
                  <div>
                    <h3
                      style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        marginBottom: '1rem',
                      }}
                    >
                      📥 Import Data
                    </h3>
                    <p
                      style={{
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '1rem',
                      }}
                    >
                      Paste JSON data to import gifts and settings. Make sure the JSON is valid.
                    </p>
                    <div style={{ marginBottom: '1rem' }}>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={clearExisting}
                          onChange={(e) => setClearExisting(e.target.checked)}
                          style={{ cursor: 'pointer' }}
                        />
                        Clear existing data before import
                      </label>
                    </div>
                    <textarea
                      value={importJson}
                      onChange={(e) => {
                        setImportJson(e.target.value);
                        setImportError('');
                        setImportSuccess('');
                      }}
                      placeholder='Paste JSON data here...'
                      style={{
                        width: '100%',
                        minHeight: '200px',
                        padding: '1rem',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '12px',
                        color: 'var(--text-primary)',
                        fontFamily: 'monospace',
                        fontSize: '0.85rem',
                        resize: 'vertical',
                        marginBottom: '1rem',
                      }}
                    />
                    {importError && (
                      <div
                        style={{
                          padding: '0.75rem',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          borderRadius: '8px',
                          color: 'var(--priority-high)',
                          fontSize: '0.85rem',
                          marginBottom: '1rem',
                        }}
                      >
                        ❌ {importError}
                      </div>
                    )}
                    {importSuccess && (
                      <div
                        style={{
                          padding: '0.75rem',
                          background: 'rgba(34, 197, 94, 0.1)',
                          border: '1px solid rgba(34, 197, 94, 0.2)',
                          borderRadius: '8px',
                          color: '#22c55e',
                          fontSize: '0.85rem',
                          marginBottom: '1rem',
                        }}
                      >
                        ✅ {importSuccess}
                      </div>
                    )}
                    <button
                      onClick={handleImportData}
                      disabled={isImporting || !importJson.trim()}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: isImporting || !importJson.trim()
                          ? 'var(--bg-secondary)'
                          : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        color: 'white',
                        cursor: isImporting || !importJson.trim() ? 'not-allowed' : 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        opacity: isImporting || !importJson.trim() ? 0.6 : 1,
                      }}
                    >
                      {isImporting ? 'Importing...' : 'Import Data'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Page Settings */}
        <div style={{ paddingBottom: '3rem' }}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 500,
              width: '100%',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ⚙️ Page Settings
            </span>
            <span style={{ 
              transform: showSettings ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}>
              ▼
            </span>
          </button>

          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '1.5rem',
                    background: 'var(--bg-card)',
                    borderRadius: '16px',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {/* Preview */}
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '1.5rem',
                      marginBottom: '1.5rem',
                      background: 'var(--bg-secondary)',
                      borderRadius: '12px',
                      border: '1px dashed var(--border-subtle)',
                    }}
                  >
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                      {settings.emoji}
                    </div>
                    <h3
                      style={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        marginBottom: '0.25rem',
                      }}
                    >
                      {settings.title}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {settings.subtitle}
                    </p>
                  </div>

                  {/* Emoji */}
                  <div className="form-group">
                    <label className="form-label">Header Emoji</label>
                    <input
                      type="text"
                      value={settings.emoji}
                      onChange={(e) => setSettings({ ...settings, emoji: e.target.value })}
                      className="input"
                      placeholder="🎄"
                      style={{ fontSize: '1.5rem', textAlign: 'center' }}
                    />
                  </div>

                  {/* Title */}
                  <div className="form-group">
                    <label className="form-label">Page Title</label>
                    <input
                      type="text"
                      value={settings.title}
                      onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                      className="input"
                      placeholder="Christmas Wishlist"
                    />
                  </div>

                  {/* Subtitle */}
                  <div className="form-group">
                    <label className="form-label">Subtitle</label>
                    <input
                      type="text"
                      value={settings.subtitle}
                      onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })}
                      className="input"
                      placeholder="Click on any gift to see more details..."
                    />
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={saveSettings}
                    disabled={settingsLoading}
                    className="btn-primary"
                    style={{ width: '100%', marginTop: '0.5rem' }}
                  >
                    {settingsLoading ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

