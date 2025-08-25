# Pulse - Technical Specifications

## Database Schema

### Users Table
```sql
users (
  id: UUID PRIMARY KEY,
  email: STRING UNIQUE,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
)
```

### Daily Logs Table
```sql
daily_logs (
  id: UUID PRIMARY KEY,
  user_id: UUID FOREIGN KEY,
  date: DATE,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
)
```

### Bullet Items Table
```sql
bullet_items (
  id: UUID PRIMARY KEY,
  user_id: UUID FOREIGN KEY,
  daily_log_id: UUID FOREIGN KEY (nullable),
  monthly_log_id: UUID FOREIGN KEY (nullable),
  collection_id: UUID FOREIGN KEY (nullable),
  text: TEXT,
  bullet_type: ENUM ('task', 'event', 'note'),
  status: ENUM ('incomplete', 'complete', 'migrated', 'scheduled', 'cancelled'),
  symbol: STRING ('○', '✓', '→', '<', '✗', '•', '-', '!', '*', '~'),
  order_index: INTEGER,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
)
```

### Monthly Logs Table
```sql
monthly_logs (
  id: UUID PRIMARY KEY,
  user_id: UUID FOREIGN KEY,
  month: INTEGER,
  year: INTEGER,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
)
```

### Collections Table
```sql
collections (
  id: UUID PRIMARY KEY,
  user_id: UUID FOREIGN KEY,
  name: STRING,
  type: ENUM ('goals', 'habits', 'ideas', 'projects', 'custom'),
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
)
```

## API Endpoints

### Authentication (Supabase handles)
- POST `/auth/login`
- POST `/auth/signup`
- POST `/auth/logout`
- GET `/auth/user`

### Daily Logs
- GET `/api/daily-logs?date=YYYY-MM-DD`
- POST `/api/daily-logs`
- PUT `/api/daily-logs/:id`

### Bullet Items
- GET `/api/bullet-items?daily_log_id=:id`
- POST `/api/bullet-items`
- PUT `/api/bullet-items/:id`
- DELETE `/api/bullet-items/:id`
- POST `/api/bullet-items/:id/migrate` (move to different log/collection)

### AI Integration
- POST `/api/ai/categorize` (auto-detect bullet type from text)
- POST `/api/ai/chat` (conversational assistant)
- POST `/api/ai/analyze-patterns` (pattern recognition for insights)

### Monthly Logs
- GET `/api/monthly-logs?month=:month&year=:year`
- POST `/api/monthly-logs`
- PUT `/api/monthly-logs/:id`

### Collections
- GET `/api/collections`
- POST `/api/collections`
- PUT `/api/collections/:id`
- DELETE `/api/collections/:id`

## Component Architecture

### Icon Implementation Best Practices

**Core Principles:**
- Icons should use `stroke="currentColor"` to inherit color from parent via Tailwind classes
- Never hardcode opacity in the SVG - control it through className prop
- Use consistent prop interface: `className` and `size`
- Default size should match most common usage

**Implementation Pattern:**
```jsx
// ✅ CORRECT - Clean, flexible icon component
export const IconName = ({ className = "", size = 20 }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 20 20" 
    fill="none" 
    className={className}
  >
    <path 
      d="..." 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round"
    />
  </svg>
)

// Usage - control color and opacity via className
<IconName className="text-[rgba(0,0,0,0.44)]" size={20} />
<IconName className="text-black/30" size={16} />
```

**What NOT to do:**
```jsx
// ❌ WRONG - Hardcoded opacity in SVG
<path stroke="currentColor" strokeOpacity="0.32" />

// ❌ WRONG - Fixed colors in SVG
<path stroke="#666666" />
<path stroke="rgba(0,0,0,0.32)" />

// ❌ WRONG - Inconsistent prop interfaces
export const Icon = ({ color, opacity, width, height }) => ...
```

**Standard Icon Sizes:**
- 16px - Small inline icons, compact UI elements
- 20px - Default size for most UI icons
- 36px - Large icons for special sections (like signature)

**Color/Opacity Guidelines:**
- Use Tailwind's opacity utilities: `text-black/30` instead of `text-[rgba(0,0,0,0.3)]`
- Common opacity values in the design:
  - 12% - Subtle connecting lines (`text-black/12`)
  - 32% - Secondary/inactive elements (`text-black/32`)
  - 44% - Semi-prominent UI elements (`text-black/44`)
  - 64% - Body text (`text-black/64`)
  - 88% - Headings/primary text (`text-black/88`)

### Component & Animation Patterns

**When to Create Components vs Inline Solutions:**

**Create separate components when:**
- Animation logic is complex or involves multiple coordinated elements
- Component is reused in multiple places
- Need to encapsulate complex state management
- Business logic is substantial and needs isolation

**Use inline solutions when:**
- Simple state toggles (like menu open/close)
- Used in one place only
- Animation is just CSS transitions
- Logic is easy to understand at a glance

**Example: Icon Animation Pattern**
```jsx
// ✅ GOOD - Simple inline solution for icon state change
<IconButton onClick={() => setIsOpen(!isOpen)}>
  <svg>
    <path 
      d={isOpen ? "M6.875 4.166..." : "M5.875 7.166..."}
      style={{ transition: 'all 0.2s ease-in-out' }}
    />
  </svg>
</IconButton>

// ❌ AVOID - Over-engineering simple animations
<AnimatedIcon isOpen={isOpen} /> // Unnecessary component for simple state
```

### Authentication Patterns

**Key Principles:**
- Keep authentication simple and isolated from other operations
- Don't add aggressive timeouts that clear user state
- Profile fetching should never block authentication
- Always ensure loading states are properly managed

**useAuth Hook Pattern:**
```jsx
// ✅ GOOD - Simple, reliable authentication
useEffect(() => {
  let mounted = true
  
  const initAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (!mounted) return
      
      setUser(session?.user ?? null)
      
      // Profile fetch doesn't block auth
      if (session?.user) {
        ensureUserProfile(session.user.id).catch(console.warn)
      }
      
      setLoading(false)
    } catch (err) {
      if (mounted) {
        setUser(null)
        setLoading(false)
      }
    }
  }
  
  initAuth()
  return () => { mounted = false }
}, [])

// ❌ AVOID - Aggressive timeouts and dependent operations
const result = await Promise.race([
  supabase.auth.getSession(),
  timeout(10000) // Don't clear user state on slow connections
])
```

**Common Pitfalls to Avoid:**
- Don't make authentication dependent on profile fetch success
- Don't have multiple code paths where loading might not get set to false
- Don't create circular dependencies (auth → profile → auth)
- Don't ignore React Strict Mode double execution in development

### Core Components
```
src/
├── components/
│   ├── ui/ (shadcn components)
│   ├── bullet-journal/
│   │   ├── DailyLog.tsx
│   │   ├── MonthlyLog.tsx
│   │   ├── Collections.tsx
│   │   ├── BulletItem.tsx
│   │   ├── RapidLogger.tsx
│   │   └── MigrationInterface.tsx
│   ├── ai/
│   │   ├── ChatAssistant.tsx
│   │   ├── ContextForm.tsx
│   │   └── SuggestionCard.tsx
│   └── layout/
│       ├── Navigation.tsx
│       ├── Sidebar.tsx
│       └── MainLayout.tsx
├── pages/
│   ├── api/ (Next.js API routes)
│   ├── daily/
│   ├── monthly/
│   ├── collections/
│   └── index.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useBulletItems.ts
│   ├── useAI.ts
│   └── useMigration.ts
├── lib/
│   ├── supabase.ts
│   ├── openai.ts
│   ├── types.ts
│   └── utils.ts
└── stores/
    ├── authStore.ts
    ├── uiStore.ts
    └── journalStore.ts
```

## State Management

### React Query (Server State)
- Bullet items (CRUD operations)
- Daily/Monthly logs
- Collections
- AI responses
- User data

### Zustand (Client State)
- Current view (daily/monthly/collections)
- UI state (sidebar open/closed, modal states)
- Draft bullet items (before saving)
- AI chat interface state

## AI Integration Patterns

### Auto-Detection Flow
1. User types line of text
2. On line completion/blur, send to `/api/ai/categorize`
3. Receive bullet type prediction
4. Update UI with suggested symbol
5. Allow one-click correction if wrong

### Chat Assistant Flow
1. User opens chat sidebar
2. Context gathered from recent journal entries
3. Generate contextual forms for common tasks
4. Process responses through conversation
5. Update journal data in real-time

### Context Extraction
- Use generative UI for forms (React components)
- Pre-populate based on journal patterns
- Allow real-time clarification during processing

## Development Environment

### Required Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
```

### Potential UI Libraries for MS2/MS3
- **Prompt Kit** (https://www.prompt-kit.com/) - React components for AI chat interfaces
  - File Upload, Prompt Input, Message components
  - Code blocks, markdown rendering, response streaming
  - Could be useful for chat assistant in MS2

### Development Setup
1. Next.js 14+ with TypeScript
2. Supabase CLI for local development
3. Tailwind CSS + Shadcn/ui
4. Vitest for testing
5. Cursor IDE recommended

## Performance Considerations

### Optimization Strategies
- React Query caching for bullet items
- Lazy loading for monthly/collection views
- Debounced AI auto-detection calls
- Optimistic updates for better UX
- Virtual scrolling for long lists

### AI Rate Limiting
- Debounce auto-detection calls (500ms)
- Cache common categorization results
- Implement retry logic with exponential backoff
- Show loading states for AI operations