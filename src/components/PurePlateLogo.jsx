import React from 'react';

/**
 * PurePlate Official Brand Mark
 * Clean, prestigious, Swiss-designed clinical vector mark
 * Designed with geometric precision:
 * - Outer precision porcelain ring (culinary testing plate)
 * - Inner purity shield with botanical droplet cross
 * - Crisp, professional, non-AI aesthetic
 */
export default function PurePlateLogo({
  size = 32,
  variant = 'icon', // 'icon' (with glass squircle) or 'mark' (pure vector glyph)
  className = '',
  animated = false,
  showGlow = false
}) {
  const glyph = (
    <svg
      width={variant === 'icon' ? Math.round(size * 0.64) : size}
      height={variant === 'icon' ? Math.round(size * 0.64) : size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="pureplate-brand-svg"
    >
      {/* Precision Circular Plate Rim */}
      <circle
        cx="16"
        cy="16"
        r="14"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.35"
      />

      {/* Symmetrical Purity Shield */}
      <path
        d="M16 6.5C21.5 6.5 24.5 9.5 24.5 15C24.5 21 19 25 16 26.5C13 25 7.5 21 7.5 15C7.5 9.5 10.5 6.5 16 6.5Z"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      {/* Central Droplet of Purity */}
      <path
        d="M16 11C16 11 12.5 15.5 12.5 18C12.5 19.9 14.1 21.5 16 21.5C17.9 21.5 19.5 19.9 19.5 18C19.5 15.5 16 11 16 11Z"
        fill="currentColor"
      />

      {/* White Specular Core Refraction */}
      <circle cx="15" cy="16.5" r="1" fill="#ffffff" />
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
          color: 'var(--brand-teal, #0d9488)',
          position: 'relative'
        }}
      >
        {glyph}
      </div>
    );
  }

  // Variant: 'icon'
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
        background: 'rgba(13, 148, 136, 0.1)',
        border: '1.5px solid rgba(13, 148, 136, 0.25)',
        color: 'var(--brand-teal, #0d9488)',
        boxShadow: showGlow ? '0 4px 16px rgba(13, 148, 136, 0.25)' : 'none',
        flexShrink: 0
      }}
    >
      {glyph}
    </div>
  );
}
