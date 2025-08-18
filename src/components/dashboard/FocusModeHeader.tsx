'use client'

interface FocusModeHeaderProps {
  onExit: () => void
}

export function FocusModeHeader({ onExit }: FocusModeHeaderProps) {
  return (
    <div className="sticky top-0 h-10 z-20 flex items-center justify-center px-3">
      <div className="flex items-center gap-2 text-[rgba(0,0,0,0.44)]">
        <span 
          className="text-sm"
          style={{ 
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            fontWeight: 500,
            lineHeight: '20px'
          }}
        >
          Press
        </span>
        <kbd 
          className="inline-flex items-center justify-center h-5 min-w-[30px] px-1.5 rounded-[5px] text-xs font-semibold bg-[#E8E8E8] text-[#666666]" 
          style={{ 
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '-0.024em',
            lineHeight: '12px'
          }}
        >
          ESC
        </kbd>
        <span 
          className="text-sm"
          style={{ 
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            fontWeight: 500,
            lineHeight: '20px'
          }}
        >
          to exit
        </span>
      </div>
    </div>
  )
}