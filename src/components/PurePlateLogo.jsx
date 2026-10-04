import React from 'react';

/**
 * PurePlate Official Brand Mark (v3.0 Master Identity)
 * A fusion of:
 * 1. The Porcelain Plate (circular rim & culinary clarity)
 * 2. The Purity Shield (food safety & chemical protection)
 * 3. The Letter "P" Monogram (PurePlate identity)
 * 4. The Organic Leaf & Verified Checkmark (unadulterated, pure living food)
 */
export default function PurePlateLogo({
  size = 28,
  variant = 'icon', // 'icon' (with glass squircle) or 'mark' (pure vector glyph)
  className = '',
  animated = false,
  showGlow = false
}) {
  const uniqueId = React.useId ? React.useId() : `pp-logo-${Math.random().toString(36).substr(2, 9)}`;

  // The PurePlate vector glyph
  const glyph = (
    <svg
      width={variant === 'icon' ? Math.round(size * 0.72) : size}
      height={variant === 'icon' ? Math.round(size * 0.72) : size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="pureplate-glyph-svg"
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Primary PurePlate Cyan-Teal Gradient */}
        <linearGradient id={`${uniqueId}-teal-flow`} x1="12" y1="10" x2="52" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0df0c0" />
          <stop offset="35%" stopColor="#06b6d4" />
          <stop offset="70%" stopColor="#0d9488" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>

        {/* Organic Emerald Leaf Gradient */}
        <linearGradient id={`${uniqueId}-leaf-glow`} x1="24" y1="20" x2="42" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#0df0c0" />
        </linearGradient>

        {/* Shield Glass Surface Gradient */}
        <linearGradient id={`${uniqueId}-shield-glass`} x1="32" y1="12" x2="32" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#0df0c0" stopOpacity="0.03" />
        </linearGradient>

        {/* Drop Glow Filter */}
        <filter id={`${uniqueId}-soft-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0df0c0" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* ── 1. Outer Plate Rim (Porcelain Geometric Ring) ── */}
      <circle
        cx="32"
        cy="32"
        r="28"
        stroke={`url(#${uniqueId}-teal-flow)`}
        strokeWidth="2.5"
        strokeOpacity="0.45"
        className="plate-rim-circle"
      />

      {/* ── 2. Purity Shield Silhouette (Harmonious Plate-Shield Curve) ── */}
      <path
        d="M32 12.5C43.5 12.5 49 18 49 28C49 39.2 38.2 46.8 32 50.8C25.8 46.8 15 39.2 15 28C15 18 20.5 12.5 32 12.5Z"
        fill={`url(#${uniqueId}-shield-glass)`}
        stroke={`url(#${uniqueId}-teal-flow)`}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shield-contour"
      />

      {/* ── 3. The Letter "P" Monogram + Botanical Purity Leaf ── */}
      {/* Left Pillar / Spine of P */}
      <path
        d="M24.5 21V41.5"
        stroke={`url(#${uniqueId}-teal-flow)`}
        strokeWidth="4.2"
        strokeLinecap="round"
        className="p-spine"
      />

      {/* Purity Leaf Bowl of "P" */}
      <path
        d="M24.5 21C31.5 21 38.5 22.2 38.5 28.5C38.5 34.8 31.5 36 24.5 36"
        stroke={`url(#${uniqueId}-teal-flow)`}
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="p-bowl"
      />

      {/* Central Verification Check & Leaf Vein */}
      <path
        d="M28.5 28.5L31.8 31.8L37.5 24.5"
        stroke={`url(#${uniqueId}-leaf-glow)`}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${uniqueId}-soft-glow)`}
        className="leaf-check"
      />

      {/* ── 4. Luminous Purity Sparkle (Top-Right Accent) ── */}
      <circle
        cx="44.5"
        cy="15.5"
        r="2.2"
        fill="#0df0c0"
        className="purity-glint"
      />
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

  // Variant: 'icon' (Apple-grade Luxury Squircle Glass Container)
  return (
    <div
      className={`pureplate-app-icon ${animated ? 'logo-animated' : ''} ${showGlow ? 'has-glow' : ''} ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        borderRadius: Math.round(size * 0.28),
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        flexShrink: 0
      }}
    >
      {/* Specular Inner Bevel Ring */}
      <div
        className="icon-specular-bevel"
        style={{
          borderRadius: Math.round(size * 0.28)
        }}
      />
      {glyph}
    </div>
  );
}
