import type { BulletItem, BulletSymbolConfig } from '@/lib/types'

export const BULLET_SYMBOLS: Record<string, BulletSymbolConfig> = {
  // Tasks
  '○': { symbol: '○', type: 'task', status: 'incomplete', description: 'Task (incomplete)' },
  '✓': { symbol: '✓', type: 'task', status: 'complete', description: 'Task (complete)' },
  '✗': { symbol: '✗', type: 'task', status: 'cancelled', description: 'Task (cancelled)' },
  '→': { symbol: '→', type: 'task', status: 'migrated', description: 'Task (migrated)' },
  '<': { symbol: '<', type: 'task', status: 'scheduled', description: 'Task (scheduled)' },
  
  // Events
  '•': { symbol: '•', type: 'event', status: 'incomplete', description: 'Event' },
  
  // Notes
  '-': { symbol: '-', type: 'note', status: 'incomplete', description: 'Note' },
  '!': { symbol: '!', type: 'note', status: 'incomplete', description: 'Important note' },
  '*': { symbol: '*', type: 'note', status: 'incomplete', description: 'Inspiration' },
  '~': { symbol: '~', type: 'note', status: 'incomplete', description: 'Research' },
}

export function getDefaultSymbol(type: BulletItem['bullet_type']): BulletItem['symbol'] {
  switch (type) {
    case 'task':
      return '○'
    case 'event':
      return '•'
    case 'note':
      return '-'
    default:
      return '○'
  }
}

export function getSymbolForStatus(
  type: BulletItem['bullet_type'], 
  status: BulletItem['status']
): BulletItem['symbol'] {
  if (type === 'task') {
    switch (status) {
      case 'complete':
        return '✓'
      case 'cancelled':
        return '✗'
      case 'migrated':
        return '→'
      case 'scheduled':
        return '<'
      default:
        return '○'
    }
  }
  
  // Events and notes don't change symbols based on status
  return getDefaultSymbol(type)
}

export function getTaskSymbols(): BulletSymbolConfig[] {
  return ['○', '✓', '✗', '→', '<'].map(symbol => BULLET_SYMBOLS[symbol])
}

export function getEventSymbols(): BulletSymbolConfig[] {
  return ['•'].map(symbol => BULLET_SYMBOLS[symbol])
}

export function getNoteSymbols(): BulletSymbolConfig[] {
  return ['-', '!', '*', '~'].map(symbol => BULLET_SYMBOLS[symbol])
}

export function getAllSymbols(): BulletSymbolConfig[] {
  return Object.values(BULLET_SYMBOLS)
}