// Re-export the supabase client from services
export { supabase } from '../services/supabaseClient';

// Database Schema Configuration
export const DATABASE_SCHEMA = {
  TABLES: {
    USERS: 'users',
    JOURNAL_ENTRIES: 'journal_entries',
    AI_INSIGHTS: 'ai_insights',
    USER_PREFERENCES: 'user_preferences',
    CHAT_MESSAGES: 'chat_messages',
    ENTRY_SUMMARIES: 'entry_summaries'
  }
};

// SQL Schema for reference (would be run in Supabase dashboard)
export const SCHEMA_SQL = `
-- Users table (extends Supabase auth.users)
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

-- User preferences table
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

-- Journal entries table
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

-- AI insights table
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

-- Chat messages table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant')) NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Entry summaries table
CREATE TABLE entry_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE UNIQUE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  summary_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE entry_summaries ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own preferences" ON user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON user_preferences FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own entries" ON journal_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own entries" ON journal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own entries" ON journal_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own entries" ON journal_entries FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own insights" ON ai_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own insights" ON ai_insights FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own chat messages" ON chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chat messages" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own chat messages" ON chat_messages FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own summaries" ON entry_summaries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own summaries" ON entry_summaries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own summaries" ON entry_summaries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own summaries" ON entry_summaries FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_journal_entries_user_id_created_at ON journal_entries(user_id, created_at DESC);
CREATE INDEX idx_ai_insights_user_id_created_at ON ai_insights(user_id, created_at DESC);
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_chat_messages_user_id_journal_entry_id ON chat_messages(user_id, journal_entry_id);
CREATE INDEX idx_chat_messages_timestamp ON chat_messages(timestamp DESC);
CREATE INDEX idx_entry_summaries_user_id ON entry_summaries(user_id);
CREATE INDEX idx_entry_summaries_journal_entry_id ON entry_summaries(journal_entry_id);

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_entry_summaries_updated_at BEFORE UPDATE ON entry_summaries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

// Type definitions for database tables
export interface DatabaseUser {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  subscription_status: 'free' | 'premium';
  free_insights_used: number;
  streak_count: number;
  last_entry_date?: string;
  onboarding_completed: boolean;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  focus_areas: string[];
  personality_type?: string;
  preferred_time?: string;
  reminder_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseJournalEntry {
  id: string;
  user_id: string;
  content: string;
  mood_rating?: number;
  voice_memo_url?: string;
  created_at: string;
  updated_at: string;
  word_count: number;
  title?: string;
  entry_type?: 'journal' | 'note';
}

export interface DatabaseAIInsight {
  id: string;
  user_id: string;
  journal_entry_id: string;
  insight_text: string;
  follow_up_question: string;
  confidence: number;
  is_premium: boolean;
  created_at: string;
}

export interface DatabaseChatMessage {
  id: string;
  journal_entry_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseEntrySummary {
  id: string;
  journal_entry_id: string;
  user_id: string;
  summary_content: string;
  created_at: string;
  updated_at: string;
}