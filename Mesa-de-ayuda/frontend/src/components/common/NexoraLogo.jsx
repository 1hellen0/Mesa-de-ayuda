import React from 'react';

export function NexoraLogo({ variant = 'dark', size = 'default', showSubtitle = true }) {
  const isLight = variant === 'light'; // Light text for dark pine/charcoal backgrounds
  const iconSize = size === 'large' ? 'h-9 w-9' : size === 'small' ? 'h-6 w-6' : 'h-7 w-7';
  const titleSize = size === 'large' ? 'text-xl' : size === 'small' ? 'text-sm' : 'text-base';
  const subSize = size === 'large' ? 'text-[9px]' : 'text-[8px]';

  return (
    <div className="flex items-center gap-2.5 tracking-tight select-none">
      {/* Geometric N Icon with Pine, Bronze, and Sage */}
      <div className={`relative flex items-center justify-center rounded-lg ${iconSize} bg-[#202C2A] border border-[#C49A6C]/40 shadow-sm overflow-hidden`}>
        <svg viewBox="0 0 32 32" fill="none" className="h-4/5 w-4/5">
          {/* Stylized N with bronze and sage accents */}
          <path
            d="M8 24V8L24 24V8"
            stroke="#C49A6C"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="8" cy="8" r="2" fill="#A9B8A5" />
          <circle cx="24" cy="24" r="2" fill="#A9B8A5" />
          <path
            d="M8 16L24 16"
            stroke="#A9B8A5"
            strokeWidth="1.2"
            strokeDasharray="2 2"
            opacity="0.6"
          />
        </svg>
      </div>

      <div>
        <div className={`font-extrabold tracking-[0.14em] uppercase ${titleSize} ${isLight ? 'text-white' : 'text-[#202C2A]'}`}>
          NEXORA
        </div>
        {showSubtitle && (
          <div className={`font-semibold tracking-[0.25em] uppercase ${subSize} ${isLight ? 'text-[#A9B8A5]' : 'text-[#C49A6C]'}`}>
            INTELLIGENCE OPERATIONS
          </div>
        )}
      </div>
    </div>
  );
}
