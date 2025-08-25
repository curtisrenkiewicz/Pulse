# Claude Development Guidelines

## Project: Pulse - Bullet Journal App

### 📚 Documentation Structure
Before making changes, consult the appropriate documentation:
- **DESIGN_SYSTEM.md** - UI components, colors, typography, spacing, icons
- **TECHNICAL_SPECS.md** - Database schema, API routes, component patterns, architecture decisions, authentication patterns
- **DEVELOPMENT_PLAN.md** - Feature roadmap and implementation phases
- **PRD.md** - Product requirements and user stories
- **SESSION_NOTES.md** - Recent development decisions and changes

### Commit Message Guidelines
- Do NOT include "🤖 Generated with [Claude Code]" or "Co-Authored-By: Claude" in commit messages
- Keep commit messages clean and professional
- Follow conventional commit format (feat:, fix:, docs:, etc.)

### Testing Commands
When code changes are made, run these commands to ensure quality:
- `npm run lint` - Check for linting issues
- `npm run typecheck` - Check for TypeScript errors

### Key Project Context
- This is a bullet journal/journaling app with focus mode and timeline views
- Uses Supabase for backend and authentication
- AI-powered categorization via OpenAI API
- Pulsey is the AI assistant character
- Design specs come from Figma

### Recent Work
- Fixed timeline connecting lines (1.5px width, 12% opacity)
- Implemented Pulsey smart multi-item input parsing
- Fixed VanishingInput bug where text was cleared before submission
- Added preview modal with Cmd+Shift+R shortcut

### Important Implementation Details
- Always preserve exact indentation when editing files
- Follow existing code patterns and conventions
- Check neighboring files for library usage before adding new dependencies
- Never create documentation files unless explicitly requested