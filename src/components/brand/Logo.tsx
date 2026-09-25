// FinPilot Brand Logo Component
// Renders the compass logo mark, matching public/logo.svg (favicon).
import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 32, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="FinPilot logo"
  >
    <defs>
      <linearGradient id="fpLogoG" x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
        <stop stopColor="#34D399" />
        <stop offset="1" stopColor="#0D9488" />
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="60" height="60" rx="16" fill="#0A0A0A" />
    <rect
      x="2.75"
      y="2.75"
      width="58.5"
      height="58.5"
      rx="15.25"
      stroke="url(#fpLogoG)"
      strokeOpacity="0.55"
      strokeWidth="1.5"
    />
    <circle cx="32" cy="32" r="19" stroke="url(#fpLogoG)" strokeWidth="2.5" />
    <path d="M32 17 L38 32 L32 29 Z" fill="url(#fpLogoG)" />
    <path d="M32 47 L26 32 L32 35 Z" fill="#34D399" fillOpacity="0.25" />
    <circle cx="32" cy="32" r="2.6" fill="#0A0A0A" />
    <circle cx="32" cy="32" r="1.4" fill="#34D399" />
  </svg>
);
