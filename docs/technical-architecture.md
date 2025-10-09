# Technical Architecture

## Database Schema
### Users Table
- id, email, created_at
- focus_areas (array)
- personality_type
- subscription_status

### Journal Entries Table
- id, user_id, content, mood_rating
- created_at, ai_insight_generated
- voice_memo_url (optional)

## API Structure
- `/auth` - Supabase auth
- `/entries` - CRUD for journal entries
- `/ai/insight` - Generate AI insight
- `/ai/prompt` - Get personalized prompt

## File Structure
/src
  /components (reusable UI)
  /screens (full pages)
  /services (API calls, AI logic)
  /context (global state)


## Screen Structure

### Dashboard/Home Screen
- Top section: Stats widgets (streak, total entries, mood summary)
- Main section: Scrollable entry feed
- Components: StatsHeader, EntryFeed, EntryCard

### Entry Detail Screen
- Full entry text
- Date/time
- AI insights (if generated)
- Edit/delete options

### Diary History Screen
- Complete entry list
- Search functionality
- Date filtering
- Entry previews with tap-to-expand

## Database Queries Needed
- Get recent entries (limit 20, order by date desc)
- Calculate user stats (streak, total count)
- Search entries by content/date
- Get single entry with AI insights

## AI Integration Options
### Claude AI (Anthropic)
- Better at nuanced, empathetic responses
- More reliable for therapy-like conversations
- Cost: ~$0.015 per insight


### Hybrid Approach
- Use Claude for insights (better quality)

## Backend API Structure

### AI Service (Server-Side)
- `/api/ai/generate-insight` - POST endpoint
- Takes: journal entry, user tier (free/premium), user context
- Returns: AI-generated insight
- Handles: API key management, rate limiting, user tier restrictions

### User Tiers
- Free: 3 insights per week, basic responses
- Premium: Unlimited insights, advanced personalization, multiple AI models

### Environment Variables (Server-Side Only)
- ANTHROPIC_API_KEY (server environment)
- OPENAI_API_KEY (backup/free tier)
- User never sees these keys

## Enhanced Database Schema

### Daily Entries Table
- id, user_id, date (YYYY-MM-DD)
- mood_emoji, created_at, updated_at

### Journal Content Table
- id, daily_entry_id, content, draft_content
- auto_save_timestamp, is_published
- entry_template_used

### AI Interactions Table
- id, daily_entry_id, type (insight/chat/summary)
- ai_message, user_message, timestamp
- is_pinned, user_reaction_emoji

### Entry Templates Table
- id, template_name, prompt_text
- time_of_day_category (morning/afternoon/evening)
- user_id (custom templates)

## Component Architecture

### DailyCard Component
- CardHeader (date, mood, expand/collapse)
- CardContent (conditionally rendered sections)
- JournalSection (rich text editor)
- AIInsightSection (display + reactions)
- ChatInterface (message history + input)
- SummarySection (on-demand generation)

### State Management
- Daily entries: grouped by date, sorted newest first
- Draft content: auto-saved every 30 seconds
- Chat history: real-time updates
- UI state: expanded/collapsed card tracking