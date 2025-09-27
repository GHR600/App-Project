-- Chat Messages and Entry Summaries Migration
-- Run this SQL in your Supabase SQL Editor to add chat functionality

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
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE entry_summaries ENABLE ROW LEVEL SECURITY;

-- Chat messages policies
CREATE POLICY "Users can view own chat messages" ON chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chat messages" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own chat messages" ON chat_messages FOR DELETE USING (auth.uid() = user_id);

-- Entry summaries policies
CREATE POLICY "Users can view own summaries" ON entry_summaries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own summaries" ON entry_summaries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own summaries" ON entry_summaries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own summaries" ON entry_summaries FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_chat_messages_user_id_journal_entry_id ON chat_messages(user_id, journal_entry_id);
CREATE INDEX idx_chat_messages_timestamp ON chat_messages(timestamp DESC);
CREATE INDEX idx_entry_summaries_user_id ON entry_summaries(user_id);
CREATE INDEX idx_entry_summaries_journal_entry_id ON entry_summaries(journal_entry_id);

-- Triggers for automatic timestamp updates (assumes update_updated_at_column function exists)
CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_entry_summaries_updated_at BEFORE UPDATE ON entry_summaries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();