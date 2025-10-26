# Vercel Serverless API Functions

This directory contains Vercel serverless functions for the AI-powered journaling app.

## Directory Structure

```
api/
├── _utils/              # Shared utility modules
│   ├── aiPrompts.js     # AI prompt configuration & personalities
│   ├── aiService.js     # Claude AI service integration
│   ├── auth.js          # Supabase authentication helpers
│   ├── rateLimiter.js   # Rate limiting logic
│   └── userService.js   # User data service
└── ai/                  # AI endpoint functions
    ├── chat.js          # POST /api/ai/chat - Chat responses
    ├── insight.js       # POST /api/ai/insight - Single insight
    ├── insights.js      # POST /api/ai/insights - Insights with metadata
    └── summarise.js     # POST /api/ai/summarise - Generate summaries
```

## Environment Variables

Add these to your Vercel project settings:

### Required Variables
```bash
# Anthropic AI
ANTHROPIC_API_KEY=sk-ant-...

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Optional Variables
```bash
# Rate Limiting (defaults provided)
FREE_TIER_LIMIT=10
RATE_LIMIT_WINDOW=86400000  # 24 hours in milliseconds
```

## API Endpoints

### 1. Generate Chat Response
**Endpoint:** `POST /api/ai/chat`

**Authentication:** Required (Bearer token)

**Rate Limiting:** Yes (10 requests/day for free tier)

**Request Body:**
```json
{
  "messages": [
    { "role": "user", "content": "How can I manage my stress better?" },
    { "role": "assistant", "content": "..." },
    { "role": "user", "content": "What specific techniques work best?" }
  ],
  "journalContext": "Today I felt overwhelmed..."
}
```

**Response:**
```json
{
  "success": true,
  "response": "Let's explore what's driving your stress...",
  "source": "claude",
  "model": "claude-sonnet-4-5-20250929"
}
```

### 2. Generate Insight (Singular)
**Endpoint:** `POST /api/ai/insight`

**Authentication:** Required (Bearer token)

**Rate Limiting:** Yes

**Request Body:**
```json
{
  "content": "Today was challenging. I struggled with work deadlines...",
  "moodRating": 3,
  "userPreferences": {
    "focusAreas": ["work", "stress"],
    "personalityType": "supportive"
  },
  "recentEntries": [],
  "subscriptionStatus": "free"
}
```

**Response:**
```json
{
  "success": true,
  "insight": "The work pressure you're experiencing suggests...",
  "followUpQuestion": "What would help you feel more in control?",
  "confidence": 0.85,
  "source": "claude",
  "model": "claude-sonnet-4-5-20250929"
}
```

### 3. Generate Insights (Plural with Metadata)
**Endpoint:** `POST /api/ai/insights`

**Authentication:** Required (Bearer token)

**Rate Limiting:** Yes

**Request Body:**
```json
{
  "content": "Today was challenging...",
  "moodRating": 3
}
```

**Response:**
```json
{
  "success": true,
  "insight": {
    "insight": "Your reflections show...",
    "followUpQuestion": "What patterns are you noticing?",
    "confidence": 0.85,
    "source": "claude",
    "model": "claude-sonnet-4-5-20250929",
    "isPremium": false,
    "createdAt": "2025-01-15T10:30:00.000Z"
  },
  "userContext": {
    "subscriptionStatus": "free",
    "remainingFreeInsights": 2
  }
}
```

### 4. Generate Summary
**Endpoint:** `POST /api/ai/summarise`

**Authentication:** Required (Bearer token)

**Rate Limiting:** Yes

**Request Body:**
```json
{
  "journalContent": "Today I reflected on my goals...",
  "conversationHistory": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "summary": "• Reflected on personal goals and progress\n• Explored challenges with work-life balance\n• Identified need for better time management",
  "confidence": 0.9,
  "source": "claude",
  "model": "claude-sonnet-4-5-20250929"
}
```

## Authentication

All endpoints require authentication via Supabase JWT token. Include the token in the Authorization header:

```
Authorization: Bearer <supabase_jwt_token>
```

The token can also be provided via cookies:
- `sb-access-token`
- `supabase-auth-token`

## Rate Limiting

Free tier users are limited to 10 AI interactions per 24-hour period. Premium users have unlimited access.

Rate limit information is returned in response headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Time when limit resets (ISO 8601)

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### 400 Bad Request
```json
{
  "error": "Validation error",
  "message": "Journal content is required"
}
```

### 429 Rate Limit Exceeded
```json
{
  "error": "Rate limit exceeded",
  "message": "You've reached your daily limit of 10 AI interactions...",
  "code": "RATE_LIMIT_EXCEEDED",
  "limit": 10,
  "remaining": 0,
  "resetAt": "2025-01-16T00:00:00.000Z"
}
```

### 500 Server Error
```json
{
  "error": "AI service error",
  "message": "Failed to generate insight. Please try again.",
  "code": "INSIGHT_GENERATION_FAILED"
}
```

## AI Personalities

The API supports two AI personality styles:

### Coach
- Strategic and direct
- Action-oriented
- Helps spot patterns
- 3 sentences max

### Reflector (Default)
- Thoughtful and curious
- Processing-focused
- Validates feelings
- 5 sentences max

Users can set their preference in their profile, stored in the `users.ai_style` field.

## Local Development

To test these functions locally:

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Link your project:
   ```bash
   vercel link
   ```

3. Pull environment variables:
   ```bash
   vercel env pull .env.local
   ```

4. Run development server:
   ```bash
   vercel dev
   ```

Functions will be available at:
- `http://localhost:3000/api/ai/chat`
- `http://localhost:3000/api/ai/insight`
- `http://localhost:3000/api/ai/insights`
- `http://localhost:3000/api/ai/summarise`

## Deployment

Functions automatically deploy when you push to your connected Git repository or run:

```bash
vercel --prod
```

## Database Schema Requirements

These functions expect the following Supabase tables:

### `users`
- `id` (uuid, primary key)
- `subscription_status` (text: 'free' | 'premium')
- `ai_style` (text: 'coach' | 'reflector')
- `free_insights_used` (integer)

### `journal_entries` (optional, for context)
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `content` (text)
- `mood_rating` (integer)
- `created_at` (timestamp)

### `user_preferences` (optional)
- `user_id` (uuid, foreign key)
- `focus_areas` (text[])
- `personality_type` (text)

## Security Features

- ✅ JWT token verification via Supabase
- ✅ Rate limiting per user
- ✅ Input validation
- ✅ CORS headers configured
- ✅ Environment variable protection
- ✅ Error handling with fallbacks
- ✅ Service role key for admin operations

## Monitoring

Monitor your functions in the Vercel dashboard:
- View logs: `vercel logs <deployment-url>`
- Check analytics: Vercel Dashboard > Analytics
- Monitor errors: Vercel Dashboard > Logs

## Support

For issues or questions:
1. Check the main project README
2. Review Vercel serverless function docs
3. Check Anthropic API documentation
