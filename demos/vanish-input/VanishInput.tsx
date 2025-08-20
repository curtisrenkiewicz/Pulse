'use client'

import { useState, useRef, useEffect } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  size: number
  color: string
  initialX: number
  initialY: number
}

export function VanishInput() {
  const [inputValue, setInputValue] = useState('')
  const [isAnimating, setIsAnimating] = useState(false)
  const [showCanvas, setShowCanvas] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const animationRef = useRef<number>()
  const particlesRef = useRef<Particle[]>([])

  const createParticlesFromText = () => {
    const canvas = canvasRef.current
    const input = inputRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !input || !inputValue) return

    // Get input dimensions and position
    const rect = input.getBoundingClientRect()
    
    // Set canvas size to match viewport
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    canvas.style.width = `${window.innerWidth}px`
    canvas.style.height = `${window.innerHeight}px`
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Create off-screen canvas to render text
    const offCanvas = document.createElement('canvas')
    const offCtx = offCanvas.getContext('2d')
    if (!offCtx) return
    
    // Size off-screen canvas to match input element
    offCanvas.width = rect.width
    offCanvas.height = rect.height
    
    // Get computed styles from input to match exactly
    const inputStyles = window.getComputedStyle(input)
    const fontSize = parseInt(inputStyles.fontSize)
    const paddingLeft = parseInt(inputStyles.paddingLeft)
    
    // Configure text rendering to match input exactly
    offCtx.font = `${fontSize}px Inter, system-ui, -apple-system, sans-serif`
    offCtx.fillStyle = '#ffffff'
    offCtx.textBaseline = 'middle'
    
    // Draw text at same position as in input
    const textX = paddingLeft
    const textY = offCanvas.height / 2
    offCtx.fillText(inputValue, textX, textY)
    
    // Get pixel data from off-screen canvas
    const imageData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height)
    const pixels = imageData.data
    
    const particles: Particle[] = []
    const gridSize = 3 // Sample every 3 pixels for balanced density
    
    // Calculate offset to position particles over input
    const offsetX = rect.left
    const offsetY = rect.top
    
    // Use white for particles on dark background
    const textColor = '#ffffff'
    
    for (let y = 0; y < offCanvas.height; y += gridSize) {
      for (let x = 0; x < offCanvas.width; x += gridSize) {
        const index = (y * offCanvas.width + x) * 4
        const alpha = pixels[index + 3]
        
        // If pixel is part of text
        if (alpha > 100) {
          const particleX = x + offsetX
          const particleY = y + offsetY
          
          particles.push({
            x: particleX,
            y: particleY,
            initialX: particleX,
            initialY: particleY,
            vx: (Math.random() - 0.5) * 4,
            vy: -Math.random() * 2 - 0.5, // Upward bias
            life: 1.0,
            size: Math.random() * 1.5 + 1,
            color: textColor
          })
        }
      }
    }
    
    particlesRef.current = particles
    console.log(`Created ${particles.length} particles from text: "${inputValue}"`)
    console.log(`Input position: x=${rect.left}, y=${rect.top}, width=${rect.width}, height=${rect.height}`)
    if (particles.length > 0) {
      console.log(`First particle at: x=${particles[0].x}, y=${particles[0].y}`)
    }
  }

  const animate = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    let activeParticles = 0
    
    // Update and draw each particle
    particlesRef.current.forEach((particle, index) => {
      if (particle.life <= 0) return
      
      // Update physics with more dramatic effects
      particle.vy += 0.3 // Stronger gravity
      particle.x += particle.vx
      particle.y += particle.vy
      particle.life -= 0.015 // Slower decay for longer effect
      particle.vx *= 0.98 // Slightly less air resistance
      particle.vy *= 0.98
      
      // Add turbulence based on distance from origin
      const distX = particle.x - particle.initialX
      const distY = particle.y - particle.initialY
      particle.vx += (Math.random() - 0.5) * 0.5
      particle.vy += (Math.random() - 0.5) * 0.3
      
      if (particle.life > 0) {
        activeParticles++
        
        // Draw particle with glow
        ctx.save()
        ctx.globalAlpha = particle.life * 0.9
        ctx.fillStyle = particle.color
        ctx.shadowBlur = 10
        ctx.shadowColor = particle.color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    })
    
    // Continue animation if particles exist
    if (activeParticles > 0) {
      animationRef.current = requestAnimationFrame(animate)
    } else {
      // Clean up when animation ends
      setIsAnimating(false)
      setShowCanvas(false)
      particlesRef.current = []
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inputValue.trim() || isAnimating) return
    
    // Start animation
    setIsAnimating(true)
    setShowCanvas(true)
    
    // Create particles from text
    setTimeout(() => {
      createParticlesFromText()
      
      // Clear input immediately after creating particles
      setInputValue('')
      
      // Start animation loop
      requestAnimationFrame(animate)
    }, 50) // Small delay to ensure canvas is visible
  }

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="relative z-10">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type something and press Enter..."
          className={`
            w-full px-6 py-4 
            bg-neutral-900 
            text-white text-lg
            border border-neutral-800
            rounded-xl
            focus:outline-none focus:border-neutral-700
            placeholder:text-neutral-500
            transition-all duration-200
            ${isAnimating ? 'text-transparent caret-transparent' : ''}
          `}
        />
      </form>
      
      {/* Canvas overlay for particle effect - covers entire viewport */}
      <canvas
        ref={canvasRef}
        className={`
          fixed top-0 left-0 w-full h-full
          pointer-events-none
          transition-opacity duration-200
          ${showCanvas ? 'opacity-100' : 'opacity-0'}
        `}
        style={{
          zIndex: 9999,
        }}
      />
      
      <p className="mt-4 text-neutral-500 text-sm text-center">
        Type something and press Enter to see the vanishing effect
      </p>
      
      {isAnimating && (
        <p className="mt-2 text-neutral-600 text-xs text-center">
          Animating {particlesRef.current.length} particles...
        </p>
      )}
    </div>
  )
}