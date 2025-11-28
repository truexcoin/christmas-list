'use client';

import { useEffect, useState, useMemo, memo } from 'react';
import { motion } from 'framer-motion';

// Fast blizzard snowflake with wind effect (memoized for performance)
const BlizzardFlake = memo(({ delay, duration, startX, size, windStrength, opacity }) => {
  // Convert windStrength to vw (assuming average screen width ~1920px, 100px ≈ 5.2vw)
  // Using a fixed conversion for consistency
  const windVw = (windStrength / 1920) * 100;
  
  return (
    <motion.div
      initial={{ 
        y: -20, 
        x: `${startX}vw`, // Start position distributed across full width
        opacity: 0, 
        rotate: 0,
        scale: 0.5,
      }}
      animate={{
        y: '110vh',
        x: `${startX + windVw}vw`, // Animate with wind drift across full screen
        opacity: [0, opacity, opacity, 0],
        rotate: 720,
        scale: [0.5, 1, 1, 0.5],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'linear',
      }}
      style={{
        position: 'absolute',
        left: 0,
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 70%)',
        pointerEvents: 'none',
        filter: size > 4 ? 'blur(0.5px)' : 'none',
      }}
    />
  );
});

BlizzardFlake.displayName = 'BlizzardFlake';

// Horizontal wind streak (memoized for performance)
const WindStreak = memo(({ delay, y, duration }) => {
  return (
    <motion.div
      initial={{ x: '-100%', opacity: 0 }}
      animate={{ 
        x: '200vw', 
        opacity: [0, 0.15, 0.15, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'linear',
      }}
      style={{
        position: 'absolute',
        top: `${y}%`,
        left: 0,
        width: '150px',
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
        pointerEvents: 'none',
      }}
    />
  );
});

WindStreak.displayName = 'WindStreak';

const Background = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate blizzard particles (spread across entire screen)
  const snowflakes = useMemo(() => {
    if (!mounted) return [];
    // Increased to 120 for better coverage, spread across full width
    return Array.from({ length: 120 }, (_, i) => ({
      id: i,
      delay: Math.random() * 8,
      duration: 3 + Math.random() * 4,
      startX: Math.random() * 100, // Full width distribution (0-100vw)
      size: 2 + Math.random() * 6, // Larger for better visibility
      windStrength: 100 + Math.random() * 400, // More wind variation across screen
      opacity: 0.5 + Math.random() * 0.7, // More visible
    }));
  }, [mounted]);

  // Generate wind streaks (spread across full height)
  const windStreaks = useMemo(() => {
    if (!mounted) return [];
    // Increased to 20 for better coverage across full screen
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      delay: Math.random() * 10,
      y: Math.random() * 100, // Full height distribution
      duration: 1.5 + Math.random() * 2,
    }));
  }, [mounted]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {/* Dark stormy gradient background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(ellipse at 30% 0%, rgba(100, 130, 160, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 100%, rgba(80, 100, 140, 0.1) 0%, transparent 50%),
            linear-gradient(180deg, 
              rgba(15, 20, 30, 1) 0%, 
              rgba(10, 15, 25, 1) 50%,
              rgba(8, 12, 20, 1) 100%
            )
          `,
        }}
      />

      {/* Fog/mist overlay */}
      <motion.div
        animate={{
          opacity: [0.3, 0.5, 0.3],
          x: [0, 50, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(ellipse at 20% 30%, rgba(200, 220, 240, 0.08) 0%, transparent 40%),
            radial-gradient(ellipse at 80% 70%, rgba(200, 220, 240, 0.06) 0%, transparent 40%),
            radial-gradient(ellipse at 50% 50%, rgba(180, 200, 220, 0.04) 0%, transparent 60%)
          `,
        }}
      />

      {/* Blowing snow layer 1 - fast (full width) */}
      {snowflakes.slice(0, 60).map((flake) => (
        <BlizzardFlake key={`fast-${flake.id}`} {...flake} />
      ))}

      {/* Blowing snow layer 2 - medium (full width) */}
      {snowflakes.slice(60, 100).map((flake) => (
        <BlizzardFlake 
          key={`med-${flake.id}`} 
          {...flake} 
          duration={flake.duration * 1.5}
          windStrength={flake.windStrength * 0.8}
          size={flake.size * 0.85}
          opacity={flake.opacity * 0.7}
        />
      ))}

      {/* Blowing snow layer 3 - slow/far (full width) */}
      {snowflakes.slice(100).map((flake) => (
        <BlizzardFlake 
          key={`slow-${flake.id}`} 
          {...flake} 
          duration={flake.duration * 2}
          windStrength={flake.windStrength * 0.6}
          size={flake.size * 0.6}
          opacity={flake.opacity * 0.4}
        />
      ))}

      {/* Wind streaks */}
      {windStreaks.map((streak) => (
        <WindStreak key={`streak-${streak.id}`} {...streak} />
      ))}

      {/* Vignette effect */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Subtle cold blue top glow */}
      <div
        style={{
          position: 'absolute',
          top: '-30%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '120%',
          height: '60%',
          background: 'radial-gradient(ellipse at center, rgba(150, 180, 220, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

export default Background;
