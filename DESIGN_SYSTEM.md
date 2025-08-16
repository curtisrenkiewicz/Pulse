# Pulse - Design System

## Brand & Visual Identity

### Name: Pulse
**Concept**: The rhythm and heartbeat of daily mindful productivity

### Design Philosophy
- **Open & Airy**: Generous white space, breathing room, uncluttered layouts
- **Typography-Focused**: Clean, readable text as the primary design element
- **Mindful**: Interfaces that promote focus and intentional journaling
- **Friendly Intelligence**: AI assistance feels approachable and warm, not corporate
- **Minimal Boundaries**: Avoid cards/boxes - let content flow naturally like an open notebook

## Color Palette

### Primary Colors
```
Primary: #6366f1 (indigo-500) - Warm, friendly intelligence
Primary Light: #818cf8 (indigo-400) 
Primary Dark: #4f46e5 (indigo-600)
Accent: #f59e0b (amber-500) - AI assistant character
```

### Neutral Colors
```
Background: #ffffff (white) - Clean, open notebook feeling
Surface: #fafafa (neutral-50) - Minimal when needed
Border: #f5f5f5 (neutral-100) - Barely visible divisions
Text Primary: #171717 (neutral-900) - High contrast reading
Text Secondary: #737373 (neutral-500) - Supporting text
Text Muted: #a3a3a3 (neutral-400) - Placeholder text
```

### Semantic Colors
```
Success: #059669 (emerald-600) - Completed tasks ✓
Warning: #d97706 (amber-600) - Important items !
Danger: #dc2626 (red-600) - Cancelled tasks ✗
Info: #0891b2 (cyan-600) - Migrated tasks →
```

## Typography

### Font Stack
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Type Scale
- **Display**: 32px/40px, font-weight: 700 - Page titles
- **Heading 1**: 24px/32px, font-weight: 600 - Section headers
- **Heading 2**: 20px/28px, font-weight: 600 - Subsection headers
- **Heading 3**: 18px/28px, font-weight: 500 - Component headers
- **Body**: 16px/24px, font-weight: 400 - Main content
- **Body Small**: 14px/20px, font-weight: 400 - Supporting text
- **Caption**: 12px/16px, font-weight: 400 - Labels, metadata

## Bullet Journal Symbols

### Symbol Design
- **Size**: 16px × 16px at body text size
- **Alignment**: Centered with text baseline
- **Style**: Clean, minimalist line art
- **Weight**: 1.5px stroke width

### Symbol Meanings & Colors
```
○ Task (Incomplete) - slate-400
✓ Task (Complete) - emerald-600  
✗ Task (Cancelled) - red-500
→ Task (Migrated) - cyan-600
< Task (Scheduled) - amber-600
• Event - blue-600
- Note - slate-600
! Important - amber-600 (background highlight)
* Inspiration - purple-600
~ Research - indigo-600
```

## Component Specifications

### RapidLogger Component
```
- Clean, minimal input area
- Placeholder: "What's on your mind?"
- Auto-resize, no visible borders at rest
- Subtle focus state with gentle glow
- Real-time bullet symbol detection
- Smooth, organic transitions
```

### BulletItem Component
```
- Symbol + text, natural spacing (16px gap)
- Clean typography, no background containers
- Subtle hover states (no aggressive buttons)
- Status-based styling (gentle strikethrough)
- Minimal interaction hints
```

### AI Assistant Character
```
- Friendly blob/shape design
- Morphing animations for different states
- Amber accent color (#f59e0b)
- Shows processing, thinking, responding
- Lives in overlay panel, not permanent sidebar
```

### ChatAssistant Panel
```
- Slide-in overlay from right
- Clean, spacious messaging
- No hard borders or containers
- Natural conversation flow
- Morphing character for personality
```

### ContextForm Components
```
- Clean form styling consistent with shadcn/ui
- Toggle switches for boolean options
- Range sliders with visible values
- Checkbox groups with clear labels
- Submit buttons with loading states
```

## Layout & Spacing

### Open Layout System
- **Container**: max-width: 900px, generous side margins
- **Sidebar**: 240px minimal navigation (collapsible)
- **Main Content**: Full-width, breathing room
- **Chat Assistant**: Overlay panel, not permanent sidebar

### Generous Spacing Scale (Tailwind)
- **xs**: 8px (space-2) - Minimum spacing
- **sm**: 16px (space-4) - Component spacing
- **md**: 32px (space-8) - Section spacing
- **lg**: 48px (space-12) - Major sections
- **xl**: 64px (space-16) - Page sections
- **2xl**: 96px (space-24) - Hero/landing spacing

## Interactive States

### Button States
```
Default: bg-primary, text-white
Hover: bg-primary-dark, shadow-md
Active: bg-primary-dark, shadow-sm
Disabled: bg-slate-300, text-slate-500
Loading: bg-primary, opacity-75, spinner
```

### Input States
```
Default: border-slate-200, focus:border-primary
Error: border-red-500, focus:border-red-500
Success: border-emerald-500, focus:border-emerald-500
Disabled: bg-slate-50, border-slate-200
```

### AI States
```
Thinking: Subtle pulsing animation
Processing: Linear progress indicator
Success: Gentle green checkmark animation
Error: Subtle red warning icon
```

## Animations & Transitions

### Micro-interactions
```
Bullet symbol changes: 200ms ease-in-out
Button hovers: 150ms ease-out
Modal open/close: 300ms ease-in-out
Sidebar slide: 250ms ease-in-out
Loading spinners: 1000ms linear infinite
```

### Page Transitions
```
Route changes: 200ms fade
Tab switches: 150ms slide
Accordion expand: 300ms ease-out
Dropdown open: 200ms ease-out
```

## Responsive Design

### Breakpoints (Tailwind)
```
sm: 640px - Mobile landscape
md: 768px - Tablet portrait
lg: 1024px - Tablet landscape / Desktop
xl: 1280px - Desktop
2xl: 1536px - Large desktop
```

### Mobile Adaptations
- **Navigation**: Collapsible hamburger menu
- **Chat Assistant**: Full-screen overlay instead of sidebar
- **Forms**: Single column, larger touch targets
- **Bullet Items**: Swipe gestures for actions

## Accessibility

### Color Contrast
- All text meets WCAG AA standards (4.5:1 ratio)
- Interactive elements meet AAA when possible (7:1 ratio)
- Color is never the only way to convey information

### Keyboard Navigation
- All interactive elements focusable via keyboard
- Logical tab order throughout application
- Skip links for screen reader users
- Escape key closes modals/overlays

### Screen Reader Support
- Semantic HTML elements used throughout
- ARIA labels for complex interactions
- Alternative text for meaningful icons
- Status announcements for AI operations

## Dark Mode (Future Enhancement)

### Dark Palette
```
Background: #0f172a (slate-900)
Surface: #1e293b (slate-800)
Border: #334155 (slate-700)
Text Primary: #f1f5f9 (slate-100)
Text Secondary: #cbd5e1 (slate-300)
```

## Custom Components Beyond Shadcn

### BulletSymbolPicker
- Floating picker with all bullet symbols
- Hover descriptions for each symbol
- Quick keyboard shortcuts (1-9 keys)
- Recently used symbols at top

### MigrationInterface
- Drag-and-drop visual interface
- Clear source and destination areas
- Batch selection capabilities
- Undo/redo functionality

### PatternVisualization
- Charts and graphs for insights
- Habit streak visualizations
- Energy level heatmaps
- Productivity trend lines

### WeeklyReviewWizard
- Step-by-step guided interface
- Progress indicator at top
- Previous/next navigation
- Save draft functionality

## Implementation Notes

### CSS Custom Properties
Define core design tokens as CSS custom properties for easy theme switching:

```css
:root {
  --color-primary: #2563eb;
  --color-surface: #f8fafc;
  --spacing-md: 16px;
  --border-radius: 8px;
  --font-family-base: 'Inter', sans-serif;
}
```

### Component Library Structure
```
components/
├── ui/ (shadcn base components)
├── pulse/ (custom Pulse components)
│   ├── BulletItem/
│   ├── RapidLogger/
│   ├── ChatAssistant/
│   └── MigrationInterface/
└── icons/ (custom icon set)
```