'use client'

import { useCallback, useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'

interface VanishingInputProps {
  onSubmit?: (text: string) => void
  placeholder?: string
}

export interface VanishingInputRef {
  focus: () => void
}

export const VanishingInput = forwardRef<VanishingInputRef, VanishingInputProps>(
  ({ onSubmit, placeholder = "What's on your mind?" }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const newDataRef = useRef<any[]>([])
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [value, setValue] = useState('')
  const [animating, setAnimating] = useState(false)
  
  // Expose focus method to parent
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus()
    }
  }))

  // Auto-resize textarea
  useEffect(() => {
    const textarea = inputRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 144)}px`
    }
  }, [value])

  const draw = useCallback(() => {
    if (!inputRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 1600
    canvas.height = 800
    ctx.clearRect(0, 0, 1600, 800)

    // Match exact font specifications from textarea
    ctx.font = `500 32px Inter, system-ui, -apple-system, sans-serif`
    ctx.textBaseline = 'top'
    ctx.letterSpacing = '-0.77px'
    // Use black text for light mode
    ctx.fillStyle = '#000'
    // Draw at position to match textarea location (no avatar now)
    ctx.fillText(value.split('\n')[0], 32, 8)

    const imageData = ctx.getImageData(0, 0, 1600, 800)
    const pixelData = imageData.data
    const newData: any[] = []

    for (let t = 0; t < 800; t++) {
      let i = 4 * t * 1600
      for (let n = 0; n < 1600; n++) {
        let e = i + 4 * n
        // Looking for black pixels in light mode
        const isPixelFilled = (pixelData[e] === 0 && pixelData[e + 1] === 0 && pixelData[e + 2] === 0 && pixelData[e + 3] > 0)
        
        if (isPixelFilled) {
          newData.push({
            x: n,
            y: t,
            color: [
              pixelData[e],
              pixelData[e + 1],
              pixelData[e + 2],
              pixelData[e + 3],
            ],
          })
        }
      }
    }

    newDataRef.current = newData.map(({ x, y, color }) => ({
      x,
      y,
      r: 1,
      color: `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`,
    }))
  }, [value])

  useEffect(() => {
    draw()
  }, [value, draw])

  // Add Cmd+F keyboard shortcut to focus input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const animate = (start: number, textToSubmit: string) => {
    const animateFrame = (pos: number) => {
      requestAnimationFrame(() => {
        const newArr = []
        for (let i = 0; i < newDataRef.current.length; i++) {
          const current = newDataRef.current[i]
          // Send mode: keep right side
          const shouldKeep = current.x > pos
          
          if (shouldKeep) {
            newArr.push(current)
          } else {
            if (current.r <= 0) {
              current.r = 0
              continue
            }
            current.x += Math.random() > 0.5 ? 1.5 : -1.5
            current.y += Math.random() > 0.5 ? 1.5 : -1.5
            current.r -= 0.05 * Math.random()
            newArr.push(current)
          }
        }
        newDataRef.current = newArr
        const ctx = canvasRef.current?.getContext('2d')
        if (ctx) {
          // Clear left side for send animation
          ctx.clearRect(0, 0, pos, 800)
          
          newDataRef.current.forEach((t) => {
            const { x: n, y: i, r: s, color: color } = t
            // Draw particles on left side during send
            if (n < pos) {
              ctx.beginPath()
              ctx.rect(n, i, s, s)
              ctx.fillStyle = color
              ctx.strokeStyle = color
              ctx.stroke()
            }
          })
        }
        if (newDataRef.current.length > 0) {
          // Send: sweep right to left
          const nextPos = pos + 8
          animateFrame(nextPos)
        } else {
          // Now we use the captured text value
          setValue('')
          setAnimating(false)
          if (onSubmit) {
            onSubmit(textToSubmit)
          }
        }
      })
    }
    animateFrame(start)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !animating) {
      e.preventDefault()
      vanishAndSubmit()
    }
    
    // Unfocus input when ESC is pressed
    if (e.key === 'Escape') {
      e.preventDefault()
      inputRef.current?.blur()
    }
  }

  const vanishAndSubmit = () => {
    if (!value.trim()) return
    
    // Capture the value before any state changes
    const textToSubmit = value
    
    setAnimating(true)
    draw()

    if (value && inputRef.current) {
      // Send mode: start from leftmost pixel
      const minX = newDataRef.current.reduce(
        (prev, current) => (current.x < prev ? current.x : prev),
        1600
      )
      animate(minX, textToSubmit)
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    vanishAndSubmit()
  }

  return (
    <div className="w-full relative mx-auto" style={{ maxWidth: '776px' }}>
      {/* Canvas positioned outside form to avoid overflow clipping */}
      <canvas
        className={`absolute pointer-events-none transform scale-50 origin-top-left z-50 ${
          !animating ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ 
          top: '12px', 
          left: '0px'
        }}
        ref={canvasRef}
      />
      
      <form
        className="w-full relative rounded-2xl overflow-hidden transition-all duration-200 flex flex-col bg-[#F8F8F8]"
        style={{ minHeight: '120px', maxHeight: '204px' }}
        onSubmit={handleSubmit}
      >
        
        {/* Top section with textarea */}
        <div className="relative flex-1 flex items-start pt-3 px-4 pb-4">
          {/* Textarea that auto-grows */}
          <textarea
            onChange={(e) => {
              if (!animating) {
                setValue(e.target.value)
              }
            }}
            onKeyDown={handleKeyDown}
            ref={inputRef}
            value={value}
            placeholder={placeholder}
            className={`flex-1 border-none bg-transparent focus:outline-none focus:ring-0 resize-none font-medium overflow-hidden ${
              animating 
                ? 'text-transparent' 
                : 'text-[#1A1A1A] placeholder:text-[#999999]'
            }`}
            style={{ 
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              fontSize: '16px',
              lineHeight: '22px',
              letterSpacing: '-0.024em',
              minHeight: '24px',
              maxHeight: '144px'
            }}
          />
        </div>

        {/* Bottom section with helper text and submit button */}
        <div className="flex items-center justify-between px-4 pb-3">
          {/* Helper text with keyboard shortcut */}
          <div className="flex items-center gap-1 text-[#999999]">
            <span style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontSize: '12px', fontWeight: 500, lineHeight: '17px', letterSpacing: '-0.024em' }}>Press</span>
            <kbd className="inline-flex items-center justify-center h-4 min-w-[16px] px-0.5 rounded-[5px] bg-[#E8E8E8]">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path 
                  d="M4.625 4.625V3.25C4.625 2.49061 4.00939 1.875 3.25 1.875C2.49061 1.875 1.875 2.49061 1.875 3.25C1.875 4.00939 2.49061 4.625 3.25 4.625H4.625ZM4.625 4.625H7.375M4.625 4.625V7.375M7.375 4.625V3.25C7.375 2.49061 7.9906 1.875 8.75 1.875C9.5094 1.875 10.125 2.49061 10.125 3.25C10.125 4.00939 9.5094 4.625 8.75 4.625H7.375ZM7.375 4.625V7.375M4.625 7.375H7.375M4.625 7.375V8.75C4.625 9.5094 4.00939 10.125 3.25 10.125C2.49061 10.125 1.875 9.5094 1.875 8.75C1.875 7.9906 2.49061 7.375 3.25 7.375H4.625ZM7.375 7.375V8.75C7.375 9.5094 7.9906 10.125 8.75 10.125C9.5094 10.125 10.125 9.5094 10.125 8.75C10.125 7.9906 9.5094 7.375 8.75 7.375H7.375Z" 
                  stroke="#BCBCBC"
                  strokeWidth="1.5" 
                  strokeLinecap="square"
                />
              </svg>
            </kbd>
            <kbd className="inline-flex items-center justify-center h-4 min-w-[16px] px-0.5 rounded-[5px] text-[11px] font-semibold bg-[#E8E8E8] text-[#BCBCBC]" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '-0.024em', lineHeight: '12px' }}>F</kbd>
            <span style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontSize: '12px', fontWeight: 500, lineHeight: '17px', letterSpacing: '-0.024em' }}>to enter from anywhere</span>
          </div>
          
          <button
            type="submit"
            disabled={!value}
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
              value 
                ? 'bg-[#20B9F4] hover:bg-[#1BA8E0]' 
                : 'bg-[#D5D5D5] cursor-not-allowed'
            }`}
            aria-label="Submit"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              className={`transition-colors ${
                value 
                  ? 'text-white'
                  : 'text-[#FAFAFA]'
              }`}
            >
              <path
                d="M8.7959 2.1875C9.08416 2.1875 9.34387 2.30974 9.52637 2.50488L14.0225 7.01855C14.4122 7.40989 14.4109 8.04388 14.0195 8.43359C13.6282 8.82318 12.9942 8.82195 12.6045 8.43066L9.7959 5.60938V14.4375C9.79579 14.9897 9.34812 15.4375 8.7959 15.4375C8.24388 15.4373 7.796 14.9895 7.7959 14.4375V5.60742L4.98535 8.43066C4.59572 8.82158 3.96255 8.82291 3.57129 8.43359C3.18028 8.04393 3.17891 7.40982 3.56836 7.01855L8.08594 2.48145C8.14714 2.41998 8.2164 2.36823 8.29004 2.3252C8.32743 2.30319 8.36596 2.2827 8.40625 2.26562C8.42001 2.25984 8.43423 2.25517 8.44824 2.25C8.49557 2.23242 8.54433 2.21734 8.59473 2.20703C8.61341 2.20322 8.63244 2.20099 8.65137 2.19824C8.69858 2.19138 8.74679 2.18752 8.7959 2.1875Z"
                fill="currentColor"
                fillOpacity="0.97"
              />
            </svg>
          </button>
        </div>
      </form>
    </div>
  )
})

VanishingInput.displayName = 'VanishingInput'