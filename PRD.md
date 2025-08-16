# Pulse - Product Requirements Document

## Context

**Marketing Statement:**
"The first bullet journal app that enhances your mindful productivity practice with intelligent assistance—preserving the intentionality of traditional bullet journaling while adding AI that meets you where you are."

**Why are we building it now?**
- AI has reached maturity for context understanding and intent-based interactions
- Current digital tools break bullet journaling methodology with rigid structures
- Gap between physical bullet journaling (mindful but limited) and digital productivity tools (powerful but scattered)
- New AI UX patterns enable truly integrated experiences vs. chat-bolt-ons

**Why do we deserve to win with this feature?**
- Deep understanding of bullet journaling methodology - it's about intentionality, not just task management
- Applying cutting-edge AI UX research (generative UI, context extraction, invisible AI) that others aren't using yet
- Human-first approach: familiar UI patterns first, AI woven in second

## Usage Scenarios

**Scenario 1: Monday Morning Brain Dump**
When Curtis sits down Monday morning with his coffee, he opens the app and starts rapid logging his thoughts from the weekend: "buy soap, lunch with ted tomorrow, call ecobee, agent resilience design needs review." As he types each line, the app quietly transforms them into proper bullet symbols - tasks get ○, events get •, notes get -. He doesn't have to think about categorization; he just brain dumps and the AI handles the rest.

**Scenario 2: Evening Reflection with Assistant**
After a busy day, Curtis wants to process his thoughts but feels scattered. He opens the chat assistant and says "help me reflect on today." Instead of just asking generic questions, the assistant generates a quick form with toggles: work focus vs personal, energy level slider, and checkboxes for what went well. Curtis clicks through in seconds, and the assistant provides personalized reflection prompts based on his actual day's entries.

**Scenario 3: Weekly Review Conversation**
Sunday evening, Curtis clicks the assistant chat and says "let's do my weekly review." The assistant, knowing his patterns, immediately generates a contextual form: checkboxes for which areas to focus on (work tasks, personal goals, energy patterns), sliders for depth of analysis. Curtis selects what he wants, and they have a guided conversation - the assistant asks specific questions about his incomplete tasks, helps him think through priorities for next week, and suggests patterns it noticed. Throughout the conversation, it updates his collections in real-time based on their discussion.

## Milestones

### MS1: Core Bullet Journal Foundation (MVP)
- Daily rapid logging with AI auto-detection for bullet symbols
- Monthly log structure 
- Collections system (goals, habits, ideas, etc.)
- Basic migration workflows (daily → monthly, daily → collections, day-to-day)
- Essential bullet symbols (○, ✓, →, <, •, -, !, *, ~)
- Simple review/organization interface for moving items between sections

*De-risk: Prove the foundational BuJo structure works digitally with AI assistance*

### MS2: AI Assistant Integration
- Chat assistant sidebar for conversational interactions
- Context-aware suggestions based on journal patterns
- Guided workflows (weekly reviews, planning sessions)
- Generative UI for context extraction (forms, toggles, sliders)

*De-risk: Validate that dual interaction modes (writing + chat) work together seamlessly*

### MS3: Advanced Intelligence
- Pattern recognition across time (habits, energy, productivity insights)
- Smart date parsing and recurring item detection
- Collections management with AI suggestions
- Migration recommendations and automation

*De-risk: Ensure AI insights add value without being overwhelming*

## Technical Stack

**Frontend:** Next.js + TypeScript + Tailwind CSS + Shadcn/ui
**Backend:** Supabase (authentication + PostgreSQL database)
**State Management:** React Query + Zustand
**AI Integration:** OpenAI API via Next.js API routes
**Testing:** Vitest + React Testing Library
**Development:** Cursor IDE

## AI UX Philosophy

Based on research from Vitaly Friedman and modern AI UX patterns:

- **AI-second, not AI-first:** Use familiar UI patterns first, weave AI in second
- **Front-load intelligence:** Help users craft perfect prompts before sending
- **Generative UI for context extraction:** Create interactive forms instead of text Q&A
- **Real-time clarification:** Allow users to add details while AI is processing
- **Trust through transparency:** Show how AI came to decisions
- **Generative UI for refinement:** Interactive outputs instead of wall-of-text requiring back-and-forth

## Architecture Approach

**Curtis focuses on:**
- UI/UX design and visual customization
- Bullet journal methodology and user experience
- Product decisions and feature priorities

**Claude handles:**
- Technical architecture and database design
- State management patterns and setup
- AI integration and API development
- Testing configuration and implementation

## Resources

- [Bullet Journal Official Methodology](https://bulletjournal.com/)
- [AI UX Patterns](https://aiuxpatterns.com/)
- Linear PRD structure by Nan Yu
- Vitaly Friedman AI UX insights