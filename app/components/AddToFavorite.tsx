'use client';

import React from 'react';

interface AddToFavoriteProps {
  isFavorite: boolean;
  onClick: () => void;
}

export default function AddToFavorite({ isFavorite, onClick }: AddToFavoriteProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        width: '2.5rem',
        height: '2.5rem',
        backgroundColor: isFavorite ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease'
      }}
    >
      <svg 
        width="20"
        height="20"
        fill={isFavorite ? '#ef4444' : 'none'}
        stroke={isFavorite ? '#ef4444' : 'white'}
        viewBox="0 0 24 24" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth="2"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
        />
      </svg>
    </button>
  );
} 