import React from 'react';

export default function Logo({ className = '', width = '200', height = 'auto' }) {
  return (
    <div className={`logo-wrapper ${className}`} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', userSelect: 'none' }}>
      <svg 
        width={width} 
        height={height} 
        viewBox="0 0 400 200" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ maxWidth: '100%' }}
      >
        {/* Outer Concentric Oval */}
        <ellipse cx="200" cy="100" rx="190" ry="90" stroke="var(--color-accent-green)" strokeWidth="1.5" />
        
        {/* Inner Concentric Oval */}
        <ellipse cx="200" cy="100" rx="186" ry="86" stroke="var(--color-accent-green)" strokeWidth="1.0" />
        
        {/* Decorative Top Divider */}
        <line x1="125" y1="65" x2="192" y2="65" stroke="var(--color-accent-green)" strokeWidth="1.0" />
        <path d="M200 61L204 65L200 69L196 65Z" fill="var(--color-accent-green)" />
        <line x1="208" y1="65" x2="275" y2="65" stroke="var(--color-accent-green)" strokeWidth="1.0" />
        
        {/* Wordmark RAÍCES */}
        <text 
          x="202" 
          y="114" 
          fill="var(--color-accent-green)" 
          fontFamily="'Playfair Display', 'Didot', 'Georgia', serif" 
          fontSize="46" 
          fontWeight="500" 
          letterSpacing="12" 
          textAnchor="middle"
        >
          RAÍCES
        </text>
        
        {/* Decorative Bottom Divider */}
        <line x1="125" y1="135" x2="192" y2="135" stroke="var(--color-accent-green)" strokeWidth="1.0" />
        <path d="M200 131L204 135L200 139L196 135Z" fill="var(--color-accent-green)" />
        <line x1="208" y1="135" x2="275" y2="135" stroke="var(--color-accent-green)" strokeWidth="1.0" />
      </svg>
    </div>
  );
}
