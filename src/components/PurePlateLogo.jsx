import React from 'react';

/**
 * PurePlate Official Brand Logo Mark
 * Concept: Minimalist Porcelain Plate Rim + Purity Shield + Organic Leaf / Check Verification
 * Designed for ultra-high clarity from 16px micro-nav to 120px splash hero.
 */
export default function PurePlateLogo({
  size = 24,
  className = '',
  animated = false,
  showGlow = false
}) {
  const gradientId = React.useId ? React.useId() : `pp-logo-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div
      className={`pureplate-logo-container ${animated ? 'logo-animated' : ''} ${showGlow ? 'has-glow' : ''} ${className}`}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="pureplate-svg"
      >
        <defs>
          {/* Brand Primary Linear Gradient (Emerald Purity to High-Tech Teal & Ocean Cyan) */}
          <linearGradient id={`${gradientId}-teal`} x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0df0c0" />
            <stop offset="50%" stopColor="#0d9488" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>

          {/* Golden/Emerald Purity Accent Gradient */}
          <linearGradient id={`${gradientId}-accent`} x1="16" y1="14" x2="34" y2="34" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>

          {/* Inner Specular Fill Gradient */}
          <linearGradient id={`${gradientId}-disc`} x1="24" y1="6" x2="24" y2="42" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* 1. Outer Porcelain Plate Geometry (Rim & Specular Edge) */}
        <circle
          cx="24"
          cy="24"
          r="21.5"
          stroke={`url(#${gradientId}-teal)`}
          strokeWidth="2.5"
          className="plate-outer-rim"
        />

        {/* 2. Inner Plate Bevel Ring */}
        <circle
          cx="24"
          cy="24"
          r="17"
          stroke={`url(#${gradientId}-teal)`}
          strokeWidth="1.2"
          strokeDasharray="2 3"
          strokeOpacity="0.4"
          className="plate-inner-ring"
        />

        {/* 3. Central Scientific Purity Shield (Harmonious Modern Proportions) */}
        <path
          d="M24 10.5C28.8 10.5 33.2 13.8 33.2 18.5C33.2 27.2 26.5 33.5 24 35.8C21.5 33.5 14.8 27.2 14.8 18.5C14.8 13.8 19.2 10.5 24 10.5Z"
          fill={`url(#${gradientId}-disc)`}
          stroke={`url(#${gradientId}-teal)`}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shield-silhouette"
        />

        {/* 4. Organic Purity Leaf Spine & Verified Checkmark */}
        {/* Verification Checkmark / Leaf Base */}
        <path
          d="M19.5 23.2L22.8 26.5L29.5 18.5"
          stroke={`url(#${gradientId}-accent)`}
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="purity-check-mark"
        />

        {/* Natural Organic Leaf Vein Accent */}
        <path
          d="M23 26.5C25.5 25 28 22 28.8 19.2"
          stroke={`url(#${gradientId}-accent)`}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeOpacity="0.8"
        />

        {/* 5. Crystal Purity Sparkle (Top-right of plate) */}
        <circle
          cx="37.5"
          cy="10.5"
          r="2.2"
          fill="#0df0c0"
          className="purity-sparkle"
        />
      </svg>
    </div>
  );
}
