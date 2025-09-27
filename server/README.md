# AI Journaling Server

Backend API server for the AI Journaling App. Handles secure Anthropic Claude AI integration and user tier management.

## Features

- **Secure AI Integration**: Claude API calls handled server-side with proper authentication
- **User Tier Management**: Free vs Premium subscription checking and usage tracking
- **Authentication**: Supabase integration for user validation
- **Rate Limiting**: Prevents API abuse with configurable limits
- **Error Handling**: Comprehensive error handling with fallback mechanisms
- **CORS Support**: Configurable CORS for frontend integration

## Setup

1. **Install Dependencies**:
   ```bash
   cd server
   npm install
   ```

2. **Environment Configuration**:
   ```bash
   cp .env.example .env
   ```

   Configure the following variables in `.env`:
   - `ANTHROPIC_API_KEY`: Your Claude API key from Anthropic Console
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_ANON_KEY`: Your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (for admin operations)

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

   Or for production:
   ```bash
   npm start
   ```

## API Endpoints

### AI Insights
- `POST /api/ai/insights` - Generate AI insight for journal entry
- `GET /api/ai/usage` - Get user's AI usage statistics
- `GET /api/ai/health` - Check AI service health

### Health Check
- `GET /health` - Server health check

## User Tiers

### Free Tier
- 3 AI insights per month
- Claude Haiku model (cost-effective)
- Basic insights (50-100 words)

### Premium Tier
- Unlimited AI insights
- Claude Sonnet model (higher quality)
- Advanced insights with pattern analysis (75-150 words)

## Security Features

- **Server-side API Keys**: Claude API key never exposed to client
- **Authentication**: Bearer token validation with Supabase
- **Rate Limiting**: Configurable request limits
- **Error Masking**: Generic error messages to prevent information disclosure
- **CORS Protection**: Restricted to configured origins

## Error Handling

The server provides comprehensive error handling:
- Authentication errors (401)
- Subscription limit errors (403)
- Validation errors (400)
- Rate limit errors (429)
- Claude API errors (502)
- Generic server errors (500)

## Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Configure secure environment variables
3. Use a process manager like PM2
4. Set up SSL/TLS termination
5. Configure proper CORS origins
6. Monitor logs and error rates

## Development

```bash
# Install dependencies
npm install

# Run in development mode (with nodemon)
npm run dev

# Run tests (when available)
npm test

# Start production server
npm start
```

## Architecture

```
server/
├── src/
│   ├── index.js              # Express app setup
│   ├── routes/               # API route handlers
│   │   ├── ai.js            # AI insight endpoints
│   │   └── health.js        # Health check
│   ├── middleware/           # Express middleware
│   │   ├── auth.js          # Authentication
│   │   └── errorHandler.js  # Error handling
│   ├── services/             # Business logic
│   │   ├── aiService.js     # Claude AI integration
│   │   └── userService.js   # User tier management
│   └── utils/               # Utility functions
├── .env.example             # Environment template
└── package.json            # Dependencies & scripts
```