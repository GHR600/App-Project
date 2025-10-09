# Journal Entry Screen 3-Section Layout Transformation

## Current State Analysis
Your `JournalEntryScreen.tsx` currently has:
- ✅ Text input for journal content
- ✅ Mood rating section (1-5 scale)
- ✅ Save functionality with Supabase integration
- ✅ AI insight generation (mock service)
- ✅ Loading and success states

## Target State (3-Section Layout)
Transform into MyDiary style with enhanced AI chat functionality:

```
┌─────────────────────────────────────┐
│ HEADER: X | ••• | [SAVE]             │
├─────────────────────────────────────┤
│ Date: 27 Sept 2025 ▼    😊          │
├─────────────────────────────────────┤
│ SECTION A: JOURNAL ENTRY            │
│ ┌─ Title ─────────────────────────┐ │
│ │ [Title field]                   │ │
│ ├─ Content ───────────────────────┤ │
│ │ [Write more here...            │ │
│ │  Large text area]              │ │
│ └─────────────────────────────────┘ │
│ [🎨📷⭐😊Tt📝🏷️] formatting toolbar │
├─────────────────────────────────────┤
│ SECTION B: AI CHAT AREA             │
│ ┌─ AI Insight ────────────────────┐ │
│ │ 🤖 Based on your entry, I       │ │
│ │    notice you mentioned...      │ │
│ └─────────────────────────────────┘ │
│ ┌─ Chat History ──────────────────┐ │
│ │ 💬 You: Tell me more about...   │ │
│ │ 🤖 Claude: I think what you...  │ │
│ │ 💬 You: Thats helpful...       │ │
│ └─────────────────────────────────┘ │
│ ┌─ Chat Input ────────────────────┐ │
│ │ [Type response...] [Send]       │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│           [SUMMARISE]               │
└─────────────────────────────────────┘
```

## Specific Implementation Requirements

### 1. Header Transformation
**Current**: Complex header with multiple elements
**Target**: MyDiary-style minimal header

**Changes Required:**
```typescript
// Remove: Back navigation (use modal/sheet presentation)
// Keep: Close X, Options menu, Save button
// Style: Dark background, purple Save button
// Layout: 
//   Left: X close icon
//   Center: Empty (clean look)
//   Right: ••• menu, SAVE button (purple)
```

### 2. Date & Mood Row
**Current**: No date picker, mood is separate section
**Target**: Inline date picker + single mood emoji

**Implementation:**
```typescript
// Add date picker component (dropdown style like MyDiary)
// Single mood emoji selector (replace 5-scale rating)
// Layout: Date picker (left) + Mood emoji (right)
// Style: Purple text for date, emoji shows selected mood
```

### 3. Section A: Journal Entry Area
**Current**: Single text input with mood section
**Target**: Title + Content with formatting toolbar

**Structure Required:**
```typescript
// Title input field:
//   - Placeholder: "Title"
//   - Single line, larger font
//   - No border, dark theme styling

// Content text area:
//   - Placeholder: "Write more here..."
//   - Multi-line, auto-expanding
//   - Minimum height: 200px
//   - Dark theme with light text

// Formatting toolbar:
//   - Icons: Bold, Italic, Image, Star, Emoji, Text, Bullet, Tag
//   - Bottom of journal section
//   - Horizontal scroll if needed
//   - Purple accent for active states
```

### 4. Section B: AI Chat Component (New)
**This is entirely new functionality to build:**

**Initial AI Insight:**
```typescript
// Triggers after journal entry is saved
// API call to Claude with journal content
// Display insight in chat bubble format
// Style: Robot emoji + insight text in bubble

// Auto-generate engaging question/follow-up
// Example: "What do you think triggered this feeling?"
```

**Chat Interface:**
```typescript
// Chat message components:
//   - User messages: Right-aligned, blue/purple bubbles
//   - Claude messages: Left-aligned, dark bubbles with robot emoji
//   - Timestamps: Optional, subtle

// Chat input:
//   - Text input at bottom
//   - Send button (purple)
//   - Auto-focus after insight appears
//   - Handles multi-line input

// Chat history:
//   - Scrollable area
//   - Persists with journal entry
//   - Shows loading states for Claude responses
```

### 5. Section C: Summarise Feature
**New functionality to implement:**

**Summarise Button:**
```typescript
// Position: Well below chat area, centered
// Style: Secondary button style (outlined, not filled)
// Functionality: Sends entire entry + chat history to Claude
// Response: Clean summary in modal/alert or new chat message
```

## Technical Implementation Details

### State Management Required
```typescript
interface EntryScreenState {
  // Existing
  content: string;
  mood: string; // Change from number to emoji string
  isLoading: boolean;
  
  // New additions
  title: string;
  selectedDate: Date;
  chatMessages: ChatMessage[];
  aiInsight: string | null;
  isChatLoading: boolean;
  summary: string | null;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'claude';
  content: string;
  timestamp: Date;
}
```

### API Integration Points
```typescript
// 1. Save journal entry (existing, modify to include title)
// 2. Generate AI insight (existing, call after save)
// 3. Chat with Claude (new endpoint needed)
// 4. Generate summary (new endpoint needed)
```

### Component Architecture
```typescript
// Main component: JournalEntryScreen
//   ├── Header component
//   ├── DateMoodRow component  
//   ├── JournalSection component
//   │   ├── TitleInput
//   │   ├── ContentTextArea
//   │   └── FormattingToolbar
//   ├── ChatSection component (NEW)
//   │   ├── AIInsightBubble
//   │   ├── ChatHistory
//   │   └── ChatInput
//   └── SummariseButton component
```

## Styling Requirements (Dark Theme)

### Colors
```typescript
// Background: Dark gradient matching MyDiary
// Text inputs: Dark with light text
// Chat bubbles: 
//   - User: Purple (#7C3AED)
//   - Claude: Dark gray (#374151)
// Buttons: Purple accents
// Placeholders: Light gray (#9CA3AF)
```

### Typography
```typescript
// Title input: 18px, medium weight
// Content area: 16px, regular weight  
// Chat messages: 14px, regular weight
// Timestamps: 12px, light weight
// Button text: 16px, medium weight
```

### Spacing
```typescript
// Section gaps: 24px between major sections
// Internal padding: 16px within sections
// Chat messages: 8px gap between messages
// Input padding: 12px internal padding
```

## Implementation Phases

### Phase 1: Layout Structure (2-3 hours)
1. Restructure existing screen into 3 main sections
2. Add title input field above content
3. Implement date/mood row
4. Apply dark theme styling

### Phase 2: Chat Component (3-4 hours)
1. Create chat message components
2. Build chat input interface
3. Implement state management for messages
4. Add AI insight generation trigger

### Phase 3: API Integration (2-3 hours)
1. Connect chat to Claude API
2. Implement conversation flow
3. Add loading states and error handling
4. Test end-to-end functionality

### Phase 4: Summarise Feature (1-2 hours)
1. Add summarise button component
2. Implement summary API call
3. Display summary results
4. Handle edge cases

### Phase 5: Polish & Testing (1-2 hours)
1. Fine-tune spacing and styling
2. Add micro-interactions
3. Test with various content lengths
4. Ensure responsive behavior

## Success Criteria
✅ Visual layout matches MyDiary aesthetic
✅ Journal entry section is clean and focused
✅ AI chat flows naturally after entry creation
✅ Users can have multi-turn conversations about their entries
✅ Summarise provides concise overview of entry + discussion
✅ All interactions feel smooth and responsive
✅ Dark theme is consistent throughout
✅ Entry data persists correctly to Supabase

## Next Dependencies
- Chat API endpoints in your backend
- Message persistence in Supabase
- Enhanced Claude integration for conversational responses