'use client'

import { useState } from 'react'
import { VanishInputAceternity } from './VanishInputAceternity'

export default function VanishDemo() {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right'>('left')

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-black' : 'bg-white'} flex items-center justify-center transition-colors duration-200`}>
      {/* Mode toggle in top right */}
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className={`fixed top-4 right-4 p-2 rounded-lg transition-colors ${
          isDarkMode 
            ? 'bg-neutral-800 hover:bg-neutral-700 text-white' 
            : 'bg-gray-100 hover:bg-gray-200 text-black'
        }`}
        aria-label="Toggle dark mode"
      >
        {isDarkMode ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M10 2V4M10 16V18M18 10H16M4 10H2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M15.66 4.34L14.24 5.76M5.76 14.24L4.34 15.66M15.66 15.66L14.24 14.24M5.76 5.76L4.34 4.34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 3C6.13 3 3 6.13 3 10C3 13.87 6.13 17 10 17C11.93 17 13.68 16.22 14.94 14.94C13.32 14.63 12 13.26 12 11.5C12 9.51 13.51 8 15.5 8C16.25 8 16.92 8.26 17.45 8.68C16.97 5.5 14.21 3 10 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {/* Direction toggle in top left */}
      <button
        onClick={() => setAnimationDirection(prev => prev === 'left' ? 'right' : 'left')}
        className={`fixed top-4 left-4 px-3 py-2 rounded-lg transition-colors text-sm ${
          isDarkMode 
            ? 'bg-neutral-800 hover:bg-neutral-700 text-white' 
            : 'bg-gray-100 hover:bg-gray-200 text-black'
        }`}
        aria-label="Toggle animation direction"
      >
        Animation: {animationDirection === 'left' ? '← Delete' : '→ Send'}
      </button>

      {/* Centered input with 16px padding */}
      <div className="w-full px-4">
        <VanishInputAceternity isDarkMode={isDarkMode} animationDirection={animationDirection} />
      </div>
    </div>
  )
}