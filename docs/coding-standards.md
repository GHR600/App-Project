# Coding Standards

# PUSH COMMIT AFTER EVERY CHANGE

## TypeScript Rules
- Always use TypeScript
- Define interfaces for all data structures
- Use strict mode

## Component Standards
- Functional components only
- Use hooks for state management
- Props interfaces required

## File Naming
- Components: PascalCase (JournalEntry.tsx)
- Utilities: camelCase (aiService.ts)
- Screens: PascalCase (OnboardingScreen.tsx)

## API Patterns
- Use React Query for data fetching
- Error boundaries for all screens
- Loading states for async operations

## Navigation Patterns
- Use React Navigation stack
- Save entry: navigate back with success state
- Entry cards: navigate to detail with entry ID
- Always show loading states for AI generation

## State Management
- Dashboard stats: cache for performance
- Entry feed: lazy loading for large lists  
- AI insights: loading spinner while generating
- Success messages: toast notifications, auto-dismiss

## Enhanced Component Standards

### Daily Card Architecture
- **DailyCard.tsx**: Main container component
- **CardHeader.tsx**: Date + mood display
- **JournalSection.tsx**: Rich text editor component
- **ChatInterface.tsx**: Message history + input
- **AIInsightDisplay.tsx**: Insight presentation

### Animation Standards
- Use React Native Reanimated 3 for smooth transitions
- Card expand/collapse: spring animation (damping: 15, stiffness: 150)
- Section reveals: fade + slide combination
- Loading states: skeleton placeholders, not spinners

### Auto-save Implementation
- Debounced save: 500ms delay after last keystroke
- Draft indicators: subtle visual feedback
- Conflict resolution: always prefer latest local draft

### Chat Interface Standards
- Message components: reusable for different content types
- Real-time updates: use Supabase real-time subscriptions
- Offline support: queue messages for later sending
- Message status: sent/delivered/read indicators

## Data Persistence Patterns
- **Daily entries**: Optimistic updates with rollback
- **Chat history**: Append-only with soft deletes
- **Drafts**: Local storage with cloud sync
- **Summaries**: Cache with expiration timestamps