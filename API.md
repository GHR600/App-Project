# 🔌 API Documentation

## 📋 Overview

The AI Journaling App uses Supabase as the primary backend with additional services for AI functionality. This document covers all API endpoints, database schema, and integration patterns.

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'premium')),
  free_insights_used INTEGER DEFAULT 0,
  streak_count INTEGER DEFAULT 0,
  last_entry_date DATE,
  onboarding_completed BOOLEAN DEFAULT FALSE
);
```

### User Preferences Table
```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  focus_areas TEXT[] DEFAULT '{}',
  personality_type TEXT,
  preferred_time TEXT,
  reminder_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Journal Entries Table
```sql
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 5),
  voice_memo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  word_count INTEGER GENERATED ALWAYS AS (array_length(string_to_array(content, ' '), 1)) STORED
);
```

### AI Insights Table
```sql
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
  insight_text TEXT NOT NULL,
  follow_up_question TEXT NOT NULL,
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Chat Messages Table
```sql
CREATE TABLE chat_messages (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔐 Authentication

### Supabase Auth Integration

```typescript
// Initialize Supabase client
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
)

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
})

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

// Sign out
const { error } = await supabase.auth.signOut()
```

### Row Level Security (RLS) Policies

```sql
-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Journal entries
CREATE POLICY "Users can view own entries" ON journal_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own entries" ON journal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own entries" ON journal_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own entries" ON journal_entries FOR DELETE USING (auth.uid() = user_id);

-- AI insights
CREATE POLICY "Users can view own insights" ON ai_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own insights" ON ai_insights FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Chat messages
CREATE POLICY "Users can view own chat messages" ON chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chat messages" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## 📝 Journal Service API

### Create Journal Entry

```typescript
interface CreateJournalEntryRequest {
  content: string;
  mood_rating?: number;
  voice_memo_url?: string;
}

// Usage
const { data, error } = await supabase
  .from('journal_entries')
  .insert({
    user_id: userId,
    content: 'Today was a great day...',
    mood_rating: 4
  })
  .select()
  .single();
```

### Get Journal Entries

```typescript
interface GetEntriesOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

// Get user entries
const { data, error } = await supabase
  .from('journal_entries')
  .select(`
    *,
    ai_insights (*)
  `)
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(10);
```

### Update Journal Entry

```typescript
const { data, error } = await supabase
  .from('journal_entries')
  .update({ content: 'Updated content...' })
  .eq('id', entryId)
  .eq('user_id', userId)
  .select()
  .single();
```

### Delete Journal Entry

```typescript
const { error } = await supabase
  .from('journal_entries')
  .delete()
  .eq('id', entryId)
  .eq('user_id', userId);
```

## 🧠 AI Service API

### OpenAI Integration

```typescript
interface InsightGenerationRequest {
  journalContent: string;
  mood?: number;
  previousInsights?: string[];
  userPreferences?: {
    focusAreas: string[];
    personality: string;
  };
}

interface InsightResponse {
  insight: string;
  followUpQuestion: string;
  confidence: number;
}

// Generate insight using OpenAI
const insight = await openAIService.generateInsight({
  journalContent: 'Today I felt overwhelmed...',
  mood: 2,
  userPreferences: {
    focusAreas: ['career', 'stress_management'],
    personality: 'supportive'
  }
});
```

### Chat API

```typescript
interface ChatRequest {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  journalContext?: string;
  maxTokens?: number;
}

// Send chat message
const response = await openAIService.chatWithAI({
  messages: [
    { role: 'user', content: 'How can I manage my stress better?' }
  ],
  journalContext: 'User recently wrote about work stress...',
  maxTokens: 150
});
```

### Save AI Insight

```typescript
const { error } = await supabase
  .from('ai_insights')
  .insert({
    user_id: userId,
    journal_entry_id: entryId,
    insight_text: insight.insight,
    follow_up_question: insight.followUpQuestion,
    confidence: insight.confidence,
    is_premium: userSubscription === 'premium'
  });
```

## 💬 Chat Service API

### Send Message

```typescript
interface SendMessageRequest {
  userId: string;
  journalEntryId: string;
  message: string;
  journalContext?: string;
}

interface SendMessageResponse {
  userMessage: ChatMessage;
  aiResponse: ChatMessage;
  error?: any;
}

// Send chat message
const result = await ChatService.sendMessage(
  userId,
  journalEntryId,
  'How should I approach this situation?',
  'User wrote about workplace conflict...'
);
```

### Get Chat History

```typescript
const { messages, error } = await ChatService.getChatHistory(
  userId,
  journalEntryId
);
```

### Delete Chat History

```typescript
const { error } = await ChatService.deleteChatHistory(
  userId,
  journalEntryId
);
```

## 📊 Analytics Service API

### Generate Analytics

```typescript
interface AnalyticsRequest {
  userId: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

interface AdvancedAnalytics {
  moodTrends: MoodTrend[];
  wordCloud: WordCloudData[];
  writingPatterns: WritingPattern[];
  emotionalInsights: EmotionalInsight[];
  streakAnalysis: StreakAnalysis;
  contentAnalysis: ContentAnalysis;
  growthMetrics: GrowthMetrics;
}

// Generate analytics
const { analytics, error } = await AnalyticsService.generateAdvancedAnalytics(
  userId,
  {
    start: new Date('2024-01-01'),
    end: new Date('2024-12-31')
  }
);
```

### Export Data

```typescript
interface ExportOptions {
  format: 'json' | 'csv' | 'pdf' | 'txt';
  dateRange: {
    start: Date;
    end: Date;
  };
  includeInsights: boolean;
  includeAnalytics: boolean;
  includeImages: boolean;
}

// Export user data
const { data, filename, error } = await AnalyticsService.exportData(
  userId,
  {
    format: 'json',
    dateRange: {
      start: new Date('2024-01-01'),
      end: new Date('2024-12-31')
    },
    includeInsights: true,
    includeAnalytics: true,
    includeImages: false
  }
);
```

## 🎤 Voice Service API

### Record Voice Memo

```typescript
interface VoiceRecordingOptions {
  quality: 'low' | 'medium' | 'high';
  maxDuration?: number;
}

// Start recording
await VoiceMemoService.startRecording({
  quality: 'medium',
  maxDuration: 300000 // 5 minutes
});

// Stop recording
const voiceMemo = await VoiceMemoService.stopRecording();
```

### Transcribe Audio

```typescript
interface VoiceMemo {
  id: string;
  uri: string;
  duration: number;
  createdAt: string;
  transcription?: string;
}

// Transcribe voice memo
const transcription = await VoiceMemoService.transcribeAudio(voiceMemo);
```

### Text-to-Speech

```typescript
interface SpeechOptions {
  rate?: number;
  pitch?: number;
  language?: string;
}

// Read text aloud
await VoiceMemoService.readTextAloud(
  'Your journal entry for today...',
  {
    rate: 0.75,
    pitch: 1.0,
    language: 'en-US'
  }
);
```

## 🔔 Notification Service API

### Configure Notifications

```typescript
interface NotificationSettings {
  dailyReminder: boolean;
  reminderTime: string; // HH:MM format
  streakReminders: boolean;
  insightNotifications: boolean;
  weeklyReflection: boolean;
}

// Get notification settings
const settings = await NotificationService.getNotificationSettings();

// Save notification settings
await NotificationService.saveNotificationSettings({
  dailyReminder: true,
  reminderTime: '20:00',
  streakReminders: true,
  insightNotifications: true,
  weeklyReflection: true
});
```

### Send Notifications

```typescript
// Send local notification
const notificationId = await NotificationService.sendLocalNotification(
  'Time to Journal',
  'Take a moment to reflect on your day',
  { type: 'daily_reminder' },
  0 // immediate
);

// Send insight ready notification
await NotificationService.sendInsightReadyNotification(entryId);

// Send streak celebration
await NotificationService.sendStreakCelebration(7); // 7-day streak
```

## 🔒 Security & Rate Limiting

### Rate Limiting Rules

```typescript
const RATE_LIMITS = {
  AI_INSIGHTS: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour
  CHAT_MESSAGES: { maxRequests: 100, windowMs: 60 * 60 * 1000 }, // 100 per hour
  JOURNAL_ENTRIES: { maxRequests: 50, windowMs: 60 * 60 * 1000 }, // 50 per hour
  LOGIN_ATTEMPTS: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 per 15 minutes
};

// Check rate limit
const isAllowed = rateLimiter.isAllowed(userId, RATE_LIMITS.AI_INSIGHTS);
```

### Input Validation

```typescript
// Sanitize input
const sanitizedContent = sanitizeJournalContent(userInput);

// Validate email
const isValidEmail = validateEmail(email);

// Validate password
const { isValid, errors } = validatePassword(password);
```

### Secure Headers

```typescript
const headers = createSecureHeaders(authToken);
// Returns:
// {
//   'Content-Type': 'application/json',
//   'X-Requested-With': 'XMLHttpRequest',
//   'X-App-Version': '1.0.0',
//   'Authorization': 'Bearer <token>'
// }
```

## 📱 Real-time Features

### Supabase Realtime

```typescript
// Subscribe to new insights
const subscription = supabase
  .channel('ai_insights')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'ai_insights',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      console.log('New insight received:', payload.new);
    }
  )
  .subscribe();

// Unsubscribe
supabase.removeChannel(subscription);
```

### Live Chat Updates

```typescript
// Subscribe to new chat messages
const chatSubscription = supabase
  .channel(`chat:${journalEntryId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'chat_messages',
      filter: `journal_entry_id=eq.${journalEntryId}`
    },
    (payload) => {
      // Update chat UI with new message
      setChatMessages(prev => [...prev, payload.new]);
    }
  )
  .subscribe();
```

## 🚨 Error Handling

### Standard Error Response

```typescript
interface ApiError {
  error: {
    message: string;
    code: string;
    details?: any;
  };
  success: false;
}

interface ApiSuccess<T> {
  data: T;
  success: true;
}

type ApiResponse<T> = ApiSuccess<T> | ApiError;
```

### Error Types

```typescript
// Authentication errors
const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'invalid_credentials',
  EMAIL_NOT_CONFIRMED: 'email_not_confirmed',
  USER_NOT_FOUND: 'user_not_found',
  SESSION_EXPIRED: 'session_expired'
};

// Rate limiting errors
const RATE_LIMIT_ERRORS = {
  TOO_MANY_REQUESTS: 'too_many_requests',
  QUOTA_EXCEEDED: 'quota_exceeded'
};

// Validation errors
const VALIDATION_ERRORS = {
  INVALID_INPUT: 'invalid_input',
  MISSING_REQUIRED_FIELD: 'missing_required_field',
  CONTENT_TOO_LONG: 'content_too_long'
};
```

## 📈 Performance Optimization

### Query Optimization

```typescript
// Efficient query with proper indexing
const { data, error } = await supabase
  .from('journal_entries')
  .select(`
    id,
    content,
    mood_rating,
    created_at,
    ai_insights!inner (
      insight_text,
      follow_up_question,
      confidence
    )
  `)
  .eq('user_id', userId)
  .gte('created_at', startDate)
  .lte('created_at', endDate)
  .order('created_at', { ascending: false })
  .limit(20);
```

### Caching Strategy

```typescript
// Cache API responses
const cachedResponse = cacheManager.get(`entries:${userId}`);
if (cachedResponse) {
  return cachedResponse;
}

const response = await fetchEntries(userId);
cacheManager.set(`entries:${userId}`, response, 5 * 60 * 1000); // 5 minutes
return response;
```

### Database Indexes

```sql
-- Optimize common queries
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_created ON journal_entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_insights_entry_id ON ai_insights(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_entry_timestamp ON chat_messages(journal_entry_id, timestamp);
```

This API documentation provides complete coverage of all backend services and integration patterns used in the AI Journaling App! 🔌