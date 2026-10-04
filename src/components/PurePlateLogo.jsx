import React from 'react';

/**
 * PurePlate Official Brand Mark
 * Clean, authentic, Apple Health & WHO-grade clinical vector emblem
 * Composed of:
 * 1. Precision circular petri-dish plate rim
 * 2. Minimalist purity shield
 * 3. Clinical droplet & emerald safety leaf
 */
export default function PurePlateLogo({
  size = 32,
  variant = 'icon', // 'icon' (with glass squircle) or 'mark' (pure vector glyph)
  className = '',
  animated = false,
  showGlow = false
}) {
  const uniqueId = React.useId ? React.useId() : `pp-logo-${Math.random().toString(36).substr(2, 9)}`;

  const glyph = (
    <svg
      width={variant === 'icon' ? Math.round(size * 0.65) : size}
      height={variant === 'icon' ? Math.round(size * 0.65) : size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="pureplate-vector-logo"
    >
      <defs>
        {/* Clinical Emerald-Teal Flow */}
        <linearGradient id={`${uniqueId}-teal-grad`} x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="50%" stopColor="#0d9488" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>

        {/* Specular Inner Glaze */}
        <linearGradient id={`${uniqueId}-glass-glaze`} x1="24" y1="8" x2="24" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* 1. Precision Outer Petri-Dish Rim */}
      <circle
        cx="24"
        cy="24"
        r="21"
        stroke={`url(#${uniqueId}-teal-grad)`}
        strokeWidth="2"
        strokeOpacity="0.4"
      />

      {/* 2. Geometric Purity Shield */}
      <path
        d="M24 9C32 9 36 13 36 21C36 30 28 36 24 39C20 36 12 30 12 21C12 13 16 9 24 9Z"
        fill={`url(#${uniqueId}-glass-glaze)`}
        stroke={`url(#${uniqueId}-teal-grad)`}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 3. Pure Droplet Core */}
      <path
        d="M24 16C24 16 18 24 18 27.5C18 30.8 20.7 33.5 24 33.5C27.3 33.5 30 30.8 30 27.5C30 24 24 16 24 16Z"
        fill={`url(#${uniqueId}-teal-grad)`}
      />

      {/* 4. Organic Verified Leaf Accent */}
      <path
        d="M24 23C27 21 29 22 30 24"
        stroke="#ffffff"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* 5. Pure Light Point */}
      <circle cx="22" cy="26" r="1.5" fill="#ffffff" fillOpacity="0.85" />
    </svg>
  );

  if (variant === 'mark') {
    return (
      <div
        className={`pureplate-logo-mark ${animated ? 'logo-animated' : ''} ${showGlow ? 'has-glow' : ''} ${className}`}
        style={{
          width: size,
          height: size,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
      >
        {glyph}
      </div>
    );
  }

  // Variant: 'icon' (Sleek Glass Squircle Container)
  return (
    <div
      className={`pureplate-logo-squircle ${animated ? 'logo-animated' : ''} ${showGlow ? 'has-glow' : ''} ${className}`}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: Math.round(size * 0.28),
        background: 'rgba(13, 148, 136, 0.12)',
        border: '1px solid rgba(13, 148, 136, 0.3)',
        boxShadow: showGlow ? '0 4px 20px rgba(13, 148, 136, 0.25)' : 'none',
        flexShrink: 0
      }}
    >
      {glyph}
    </div>
  );
}
