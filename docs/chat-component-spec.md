# AI Chat Component Technical Specification

## Component Overview
The chat component enables users to have conversations with Claude about their journal entries. It appears below the journal entry section and provides intelligent, contextual responses.

## Core Functionality Requirements

### 1. Initial AI Insight Generation
**Trigger**: Automatically after journal entry is saved
**Process**:
```typescript
// 1. Send journal entry content to Claude API
// 2. Request insightful analysis/question
// 3. Display as first message in chat
// 4. Encourage user engagement with follow-up prompt
```


### 2. Conversational Flow
**User Experience**:
- User sees AI insight appear automatically
- Can respond with their thoughts/questions
- Claude responds contextually, remembering entire conversation
- Natural back-and-forth dialogue about the journal entry

**Context Preservation**:
```typescript
// Each API call includes:
// 1. Original journal entry
// 2. Full conversation history
// 3. User's current response
// This ensures Claude maintains context throughout
```

## Technical Implementation

### State Management
```typescript
interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  hasGeneratedInitialInsight: boolean;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'claude' | 'insight';
  content: string;
  timestamp: Date;
  isLoading?: boolean; // For typing indicators
}
```

### API Integration Points
```typescript
// 1. Initial Insight Generation
POST /api/chat/generate-insight
Body: {
  journalContent: string,
  userId: string,
  entryId: string
}
Response: {
  insight: string,
  followUpQuestion?: string
}

// 2. Conversation Messages  
POST /api/chat/message
Body: {
  message: string,
  conversationHistory: ChatMessage[],
  journalContext: string,
  userId: string,
  entryId: string
}
Response: {
  response: string,
  messageId: string
}

// 3. Generate Summary
POST /api/chat/summarise
Body: {
  journalContent: string,
  conversationHistory: ChatMessage[],
  userId: string,
  entryId: string
}
Response: {
  summary: string
}
```

### Database Schema Requirements
```sql
-- Chat messages table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID REFERENCES journal_entries(id),
  user_id UUID REFERENCES users(id),
  message_type TEXT CHECK (message_type IN ('user', 'claude', 'insight')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Entry summaries table  
CREATE TABLE entry_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID REFERENCES journal_entries(id) UNIQUE,
  user_id UUID REFERENCES users(id),
  summary_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## UI Component Structure

### Chat Message Components
```typescript
// Individual message bubble
const ChatBubble: React.FC<{
  message: ChatMessage;
  isOwn: boolean;
}> = ({ message, isOwn }) => {
  // Styling based on message type:
  // - User messages: Right-aligned, purple bubble
  // - Claude messages: Left-aligned, dark bubble with robot emoji
  // - Insight messages: Special styling, centered or highlighted
};

// Typing indicator for Claude responses
const TypingIndicator: React.FC = () => {
  // Animated dots showing Claude is "thinking"
  // Shows while API call is in progress
};

// Chat input area
const ChatInput: React.FC<{
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}> = ({ onSendMessage, isLoading }) => {
  // Text input + send button
  // Disabled while waiting for Claude response
  // Auto-focus after insight appears
};
```

### Main Chat Component
```typescript
const ChatSection: React.FC<{
  journalContent: string;
  entryId: string;
  onSummaryGenerated: (summary: string) => void;
}> = ({ journalContent, entryId, onSummaryGenerated }) => {
  
  // Component lifecycle:
  // 1. Mounts after journal entry is saved
  // 2. Automatically generates initial insight
  // 3. Displays chat interface
  // 4. Handles user interactions
  // 5. Persists messages to database
  
  return (
    <View style={styles.chatContainer}>
      <ScrollView style={styles.messagesContainer}>
        {messages.map(message => (
          <ChatBubble key={message.id} message={message} />
        ))}
        {isLoading && <TypingIndicator />}
      </ScrollView>
      
      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
      />
    </View>
  );
};
```

## Styling Specifications

### Chat Container
```typescript
const styles = StyleSheet.create({
  chatContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    minHeight: 200,
    maxHeight: 400, // Scrollable if content exceeds
  },
  
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  
  chatHeaderIcon: {
    fontSize: 20,
    marginRight: 8,
    color: '#A855F7', // Purple accent
  },
  
  chatHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E2E8F0',
  },
});
```

### Message Bubbles
```typescript
const messageStyles = StyleSheet.create({
  // User messages (right-aligned)
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#7C3AED',
    borderRadius: 18,
    borderBottomRightRadius: 4,
    padding: 12,
    marginBottom: 8,
    maxWidth: '80%',
  },
  
  userMessageText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
  },
  
  // Claude messages (left-aligned)
  claudeMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#374151',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    padding: 12,
    marginBottom: 8,
    maxWidth: '80%',
  },
  
  claudeMessageText: {
    color: '#E2E8F0',
    fontSize: 14,
    lineHeight: 20,
  },
  
  // Initial insight (special styling)
  insightMessage: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderWidth: 1,
    borderColor: '#A855F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignSelf: 'stretch',
  },
  
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  insightIcon: {
    fontSize: 18,
    marginRight: 8,
    color: '#A855F7',
  },
  
  insightLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A855F7',
    textTransform: 'uppercase',
  },
  
  insightText: {
    fontSize: 14,
    color: '#E2E8F0',
    lineHeight: 20,
  },
});
```

### Chat Input
```typescript
const inputStyles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    color: '#E2E8F0',
    fontSize: 14,
    maxHeight: 80, // Auto-expand up to limit
  },
  
  sendButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  sendButtonDisabled: {
    backgroundColor: '#6B7280',
  },
  
  sendIcon: {
    fontSize: 16,
    color: '#FFFFFF',
  },
});
```

## Implementation Phases

### Phase 1: Basic Chat UI (2-3 hours)
1. Create ChatSection component structure
2. Implement ChatBubble components
3. Add ChatInput with basic functionality
4. Apply dark theme styling

### Phase 2: Message State Management (1-2 hours)
1. Implement ChatMessage interface
2. Add message state management
3. Handle user input and display
4. Add typing indicators

### Phase 3: AI Integration (2-3 hours)
1. Connect to Claude API endpoints
2. Implement initial insight generation
3. Add conversational responses
4. Handle API loading states

### Phase 4: Database Persistence (1-2 hours)
1. Save messages to Supabase
2. Load conversation history
3. Handle offline scenarios
4. Implement data synchronization

### Phase 5: Advanced Features (1-2 hours)
1. Add summary generation
2. Implement error handling
3. Add retry mechanisms
4. Optimize performance

## Error Handling & Edge Cases

### Network Issues
```typescript
// Handle API failures gracefully
const handleNetworkError = (error: Error) => {
  // Show user-friendly error message
  // Offer retry option
  // Save draft message locally
  // Resume when connection restored
};
```

### Long Conversations
```typescript
// Manage memory and performance
const MAX_MESSAGES_IN_MEMORY = 50;
const optimizeMessageHistory = (messages: ChatMessage[]) => {
  // Keep recent messages in memory
  // Paginate older messages
  // Implement virtual scrolling if needed
};
```

### Rate Limiting
```typescript
// Respect API rate limits
const handleRateLimit = () => {
  // Show appropriate feedback
  // Queue messages if needed
  // Implement exponential backoff
};
```

## Performance Considerations

### Message Rendering
- Use React.memo for ChatBubble components
- Implement virtual scrolling for long conversations
- Lazy load message history
- Optimize re-renders with proper key props

### API Optimization
- Debounce rapid message sending (500ms)
- Compress conversation context for API calls
- Cache responses where appropriate
- Implement request cancellation

### Memory Management
- Limit stored message history (last 100 messages)
- Clean up old conversations periodically
- Use efficient state updates
- Avoid memory leaks in timers/listeners

## Accessibility Requirements

### Screen Reader Support
```typescript
// Proper accessibility labels
const accessibilityProps = {
  accessibilityRole: 'text',
  accessibilityLabel: `Message from ${message.type === 'user' ? 'you' : 'Claude'}`,
  accessibilityHint: 'Double tap to interact with message',
};
```

### Visual Accessibility
- Ensure 4.5:1 contrast ratio for text
- Support dynamic text sizing
- Clear focus indicators for keyboard navigation
- High contrast mode compatibility

### Keyboard Navigation
- Tab through chat messages
- Enter key sends messages
- Escape key cancels input
- Arrow keys navigate message history

## Testing Strategy

### Unit Tests
```typescript
// Test message rendering
describe('ChatBubble', () => {
  it('renders user messages correctly', () => {
    // Test user message styling and content
  });
  
  it('renders Claude messages correctly', () => {
    // Test Claude message styling and content
  });
});

// Test state management
describe('ChatSection', () => {
  it('manages message state correctly', () => {
    // Test adding/removing messages
  });
  
  it('handles API responses correctly', () => {
    // Test API integration
  });
});
```

### Integration Tests
- Test full conversation flow
- Test API error scenarios
- Test offline/online transitions
- Test message persistence

### User Acceptance Tests
- Verify natural conversation flow
- Test insight quality and relevance
- Ensure smooth user experience
- Validate accessibility compliance

## Success Metrics

### Engagement Metrics
✅ Users engage with AI insights (>70% response rate)
✅ Average conversation length >3 exchanges
✅ Users find insights helpful (subjective feedback)
✅ Low abandonment rate during conversations

### Technical Metrics
✅ Message delivery success rate >99%
✅ Response time <3 seconds average
✅ No data loss during conversation
✅ Smooth scrolling and interactions
✅ Memory usage stays within limits

### UX Metrics
✅ Chat feels natural and conversational
✅ Visual hierarchy is clear
✅ Loading states provide good feedback
✅ Error recovery is smooth
✅ Accessibility standards met

## Integration with Existing App

### Journal Entry Screen Integration
- Chat component appears after journal save
- Maintains journal context throughout conversation
- Preserves chat history with journal entry
- Smooth transition between writing and chatting

### Data Flow
```typescript
// Journal Entry Save → AI Insight → Chat Interface
JournalEntryScreen
  ↓ (saves entry)
  ↓ (triggers AI insight)
ChatSection
  ↓ (displays insight)
  ↓ (enables user response)
  ↓ (continues conversation)
```

### Backend Requirements
- Extend journal entry API to include chat messages
- Add Claude API integration endpoints
- Implement conversation context management
- Add summary generation endpoints