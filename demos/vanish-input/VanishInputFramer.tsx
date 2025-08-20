'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function VanishInputFramer() {
  const [inputValue, setInputValue] = useState('')
  const [submittedText, setSubmittedText] = useState('')
  const [isVanishing, setIsVanishing] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inputValue.trim()) return
    
    // Set the text to animate
    setSubmittedText(inputValue)
    setIsVanishing(true)
    
    // Clear input immediately
    setInputValue('')
    
    // Reset after animation completes
    setTimeout(() => {
      setIsVanishing(false)
      setSubmittedText('')
    }, 1500)
  }

  // Split text into characters for individual animation
  const characters = submittedText.split('')

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="relative">
        {/* Hidden animated text overlay */}
        {isVanishing && (
          <div className="absolute inset-0 flex items-center px-6 pointer-events-none">
            <AnimatePresence mode="popLayout">
              {characters.map((char, index) => (
                <motion.span
                  key={`${char}-${index}`}
                  initial={{ 
                    opacity: 1, 
                    y: 0,
                    filter: 'blur(0px)'
                  }}
                  animate={{ 
                    opacity: 0,
                    y: -Math.random() * 100 - 20, // Random upward movement
                    x: (Math.random() - 0.5) * 100, // Random horizontal spread
                    filter: 'blur(10px)',
                    scale: 0.5,
                  }}
                  transition={{
                    duration: 0.8,
                    delay: index * 0.03, // Stagger effect
                    ease: [0.16, 1, 0.3, 1], // Custom easing
                  }}
                  className="inline-block text-white text-lg font-normal"
                  style={{
                    transformOrigin: 'center bottom',
                  }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        )}
        
        {/* Actual input */}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type something and press Enter..."
          disabled={isVanishing}
          className={`
            w-full px-6 py-4 
            bg-neutral-900 
            text-white text-lg
            border border-neutral-800
            rounded-xl
            focus:outline-none focus:border-neutral-700
            placeholder:text-neutral-500
            transition-all duration-200
            ${isVanishing ? 'text-transparent caret-transparent' : ''}
          `}
        />
      </form>
      
      <p className="mt-4 text-neutral-500 text-sm text-center">
        Type something and press Enter to see the vanishing effect
      </p>
    </div>
  )
}