'use client'

import { cn } from '@/lib/utils'

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  size?: 16 | 20
}

export function IconButton({ children, onClick, size = 16, className, ...props }: IconButtonProps) {
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
      {...props}
    >
      {children}
    </button>
  )
}