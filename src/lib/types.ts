export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface DailyLog {
  id: string
  user_id: string
  date: string
  created_at: string
  updated_at: string
}

export interface MonthlyLog {
  id: string
  user_id: string
  month: number
  year: number
  created_at: string
  updated_at: string
}

export interface Collection {
  id: string
  user_id: string
  name: string
  type: 'goals' | 'habits' | 'ideas' | 'projects' | 'custom'
  created_at: string
  updated_at: string
}

export interface BulletItem {
  id: string
  user_id: string
  daily_log_id?: string
  monthly_log_id?: string
  collection_id?: string
  text: string
  bullet_type: 'task' | 'event' | 'note'
  status: 'incomplete' | 'complete' | 'migrated' | 'scheduled' | 'cancelled'
  symbol: '○' | '✓' | '→' | '<' | '✗' | '•' | '-' | '!' | '*' | '~'
  order_index: number
  created_at: string
  updated_at: string
}

export interface AICorrection {
  id: string
  user_id: string
  bullet_item_id: string
  original_text: string
  ai_predicted_type: string
  user_corrected_type: string
  created_at: string
}

export interface BulletSymbolConfig {
  symbol: BulletItem['symbol']
  type: BulletItem['bullet_type']
  status: BulletItem['status']
  description: string
}