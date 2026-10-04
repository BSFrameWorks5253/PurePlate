import React from 'react';

/**
 * PurePlate Shimmer Skeleton Loader
 * Ultra-crisp, Apple-style liquid glass skeleton placeholders
 */
export default function SkeletonLoader({ variant = 'card', count = 1, className = '' }) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (variant === 'card') {
    return (
      <div className={`skeleton-container ${className}`}>
        {items.map((i) => (
          <div key={i} className="skeleton-card glass-shimmer">
            <div className="skeleton-header">
              <div className="skeleton-avatar skeleton-shimmer"></div>
              <div className="skeleton-lines">
                <div className="skeleton-line line-title skeleton-shimmer"></div>
                <div className="skeleton-line line-sub skeleton-shimmer"></div>
              </div>
            </div>
            <div className="skeleton-body">
              <div className="skeleton-line line-full skeleton-shimmer"></div>
              <div className="skeleton-line line-75 skeleton-shimmer"></div>
              <div className="skeleton-line line-50 skeleton-shimmer"></div>
            </div>
            <div className="skeleton-footer">
              <div className="skeleton-pill skeleton-shimmer"></div>
              <div className="skeleton-button skeleton-shimmer"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'map') {
    return (
      <div className={`skeleton-map-container glass-shimmer ${className}`}>
        <div className="skeleton-map-radar">
          <div className="skeleton-radar-sweep"></div>
          <div className="skeleton-radar-ring ring-1"></div>
          <div className="skeleton-radar-ring ring-2"></div>
          <div className="skeleton-radar-ring ring-3"></div>
        </div>
        <div className="skeleton-map-badge skeleton-shimmer"></div>
        <div className="skeleton-map-legend skeleton-shimmer"></div>
      </div>
    );
  }

  if (variant === 'stats') {
    return (
      <div className={`skeleton-stats-row ${className}`}>
        {items.map((i) => (
          <div key={i} className="skeleton-stat-pill skeleton-shimmer"></div>
        ))}
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={`skeleton-list ${className}`}>
        {items.map((i) => (
          <div key={i} className="skeleton-list-item skeleton-shimmer">
            <div className="skeleton-avatar-sm"></div>
            <div className="skeleton-lines">
              <div className="skeleton-line line-title"></div>
              <div className="skeleton-line line-sub"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`skeleton-block skeleton-shimmer ${className}`}></div>
  );
}
