'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const GiftForm = ({ gift, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    image: '',
    description: '',
    priority: 'medium',
    stores: [{ name: '', url: '' }],
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');

  useEffect(() => {
    if (gift) {
      setFormData({
        name: gift.name || '',
        price: gift.price || '',
        image: gift.image || '',
        description: gift.description || '',
        priority: gift.priority || 'medium',
        stores: gift.stores?.length > 0 ? gift.stores : [{ name: '', url: '' }],
      });
    }
  }, [gift]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setGenerateError('');
  };

  const handleStoreChange = (index, field, value) => {
    const newStores = [...formData.stores];
    newStores[index] = { ...newStores[index], [field]: value };
    setFormData((prev) => ({ ...prev, stores: newStores }));
  };

  const addStore = () => {
    setFormData((prev) => ({
      ...prev,
      stores: [...prev.stores, { name: '', url: '' }],
    }));
  };

  const removeStore = (index) => {
    if (formData.stores.length > 1) {
      const newStores = formData.stores.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, stores: newStores }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Filter out empty stores
    const validStores = formData.stores.filter((s) => s.name && s.url);
    onSubmit({
      ...formData,
      stores: validStores,
    });
  };

  const generateWithAI = async () => {
    if (!formData.name.trim()) {
      setGenerateError('Please enter a product name first');
      return;
    }

    setIsGenerating(true);
    setGenerateError('');

    try {
      const res = await fetch('/api/gifts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to generate');
      }

      const data = await res.json();
      
      setFormData({
        name: data.name || formData.name,
        price: data.price || '',
        image: data.image || '',
        description: data.description || '',
        priority: data.priority || 'medium',
        stores: data.stores?.length > 0 ? data.stores : [{ name: '', url: '' }],
      });
    } catch (err) {
      console.error('Generate error:', err);
      setGenerateError(err.message || 'Failed to generate. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      style={{
        background: 'var(--bg-card)',
        borderRadius: '20px',
        padding: '2rem',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <h3
        style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          marginBottom: '1.5rem',
          color: 'var(--text-primary)',
        }}
      >
        {gift ? 'Edit Gift' : 'Add New Gift'}
      </h3>

      {/* AI Generate Section */}
      {!gift && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: '16px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.75rem',
            }}
          >
            <span style={{ fontSize: '1.25rem' }}>✨</span>
            <span
              style={{
                fontWeight: 600,
                color: 'var(--text-primary)',
                fontSize: '0.95rem',
              }}
            >
              AI Auto-Fill
            </span>
          </div>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
              marginBottom: '1rem',
            }}
          >
            Type a product name below and click the magic button to auto-fill all details!
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input"
              placeholder="e.g., AirPods Pro, Nintendo Switch, Dyson Airwrap..."
              style={{ flex: 1 }}
            />
            <motion.button
              type="button"
              onClick={generateWithAI}
              disabled={isGenerating || !formData.name.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '0 1.5rem',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: isGenerating || !formData.name.trim() ? 'not-allowed' : 'pointer',
                opacity: isGenerating || !formData.name.trim() ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                whiteSpace: 'nowrap',
              }}
            >
              {isGenerating ? (
                <>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  >
                    ✨
                  </motion.span>
                  Generating...
                </>
              ) : (
                <>
                  <span>🪄</span>
                  Auto-Fill
                </>
              )}
            </motion.button>
          </div>
          {generateError && (
            <p
              style={{
                color: 'var(--priority-high)',
                fontSize: '0.85rem',
                marginTop: '0.75rem',
              }}
            >
              {generateError}
            </p>
          )}
        </div>
      )}

      {/* Name field - only show separately when editing */}
      {gift && (
        <div className="form-group">
          <label className="form-label">Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="input"
            placeholder="e.g., Sony WH-1000XM5 Headphones"
            required
          />
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Price *</label>
        <input
          type="text"
          name="price"
          value={formData.price}
          onChange={handleChange}
          className="input"
          placeholder="e.g., $299"
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">Image URL</label>
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '0.5rem',
          }}
        >
          <input
            type="url"
            name="image"
            value={formData.image}
            onChange={handleChange}
            className="input"
            placeholder="Paste image URL here..."
            style={{ flex: 1 }}
          />
          <a
            href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(formData.name || 'product')}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '0 1rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-accent)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            🔍 Find Image
          </a>
        </div>
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.8rem',
            marginBottom: '0.75rem',
          }}
        >
          Tip: Click "Find Image", right-click an image → "Copy image address", then paste above
        </p>
        {formData.image ? (
          <div
            style={{
              borderRadius: '12px',
              overflow: 'hidden',
              background: 'var(--bg-secondary)',
              maxHeight: '150px',
            }}
          >
            <img
              src={formData.image}
              alt="Preview"
              style={{
                width: '100%',
                height: '150px',
                objectFit: 'cover',
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        ) : (
          <div
            style={{
              borderRadius: '12px',
              background: 'var(--bg-secondary)',
              height: '100px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed var(--border-subtle)',
            }}
          >
            <span style={{ fontSize: '2rem' }}>🎁</span>
          </div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="input"
          rows={3}
          placeholder="Tell more about why you want this gift..."
          style={{ resize: 'vertical', minHeight: '80px' }}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Priority</label>
        <select
          name="priority"
          value={formData.priority}
          onChange={handleChange}
          className="input"
          style={{ cursor: 'pointer' }}
        >
          <option value="high">🔥 High - Must Have</option>
          <option value="medium">⭐ Medium - Would Love</option>
          <option value="low">💫 Low - Nice to Have</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Where to Buy</label>
        {formData.stores.map((store, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              gap: '0.75rem',
              marginBottom: '0.75rem',
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              value={store.name}
              onChange={(e) => handleStoreChange(index, 'name', e.target.value)}
              className="input"
              placeholder="Store name"
              style={{ flex: 1 }}
            />
            <input
              type="url"
              value={store.url}
              onChange={(e) => handleStoreChange(index, 'url', e.target.value)}
              className="input"
              placeholder="https://..."
              style={{ flex: 2 }}
            />
            {formData.stores.length > 1 && (
              <button
                type="button"
                onClick={() => removeStore(index)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: 'var(--priority-high)',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addStore}
          style={{
            background: 'transparent',
            border: '1px dashed var(--border-accent)',
            color: 'var(--accent-primary)',
            padding: '0.75rem',
            borderRadius: '10px',
            cursor: 'pointer',
            width: '100%',
            fontSize: '0.9rem',
            fontWeight: 500,
            marginTop: '0.5rem',
          }}
        >
          + Add Another Store
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '1rem',
          marginTop: '2rem',
        }}
      >
        <button
          type="submit"
          className="btn-primary"
          disabled={isLoading || isGenerating}
          style={{
            flex: 1,
            opacity: isLoading || isGenerating ? 0.7 : 1,
          }}
        >
          {isLoading ? 'Saving...' : gift ? 'Update Gift' : 'Add Gift'}
        </button>
        {onCancel && (
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
            disabled={isLoading || isGenerating}
          >
            Cancel
          </button>
        )}
      </div>
    </motion.form>
  );
};

export default GiftForm;
