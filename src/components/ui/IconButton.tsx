'use client'

import { cn } from '@/lib/utils'

interface IconButtonProps {
  children: React.ReactNode
  onClick?: () => void
  size?: 16 | 20
  className?: string
}

export function IconButton({ children, onClick, size = 16, className }: IconButtonProps) {
  const sizeClasses = size === 16 
    ? 'p-0.5 rounded-md' // 6px radius for 16px icons
    : 'p-1 rounded-lg'    // 8px radius for 20px icons
    
  return (
    <button 
      onClick={onClick}
      className={cn(
        sizeClasses,
        'hover:bg-[rgba(0,0,0,0.04)] transition-colors cursor-pointer',
        className
      )}
    >
      {children}
    </button>
  )
}