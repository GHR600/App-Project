# Vercel Deployment Instructions

## Step 1: Install Vercel CLI (if not already installed)
```bash
npm i -g vercel
```

## Step 2: Login to Vercel
```bash
vercel login
```

## Step 3: Set Environment Variables on Vercel
You need to add your Claude API key to Vercel's environment variables:

```bash
vercel env add ANTHROPIC_API_KEY
```
When prompted, enter your actual API key (starts with `sk-ant-api03-...`)

## Step 4: Deploy to Vercel
```bash
vercel --prod
```

## Step 5: Test Your Deployment
After deployment, test these endpoints:

1. **Health Check:**
   ```bash
   curl https://your-app.vercel.app/api/health
   ```

2. **AI Insights (with mock auth):**
   ```bash
   curl -X POST https://your-app.vercel.app/api/ai/insights \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer mock-token" \
     -d '{"content": "I feel great today!", "moodRating": 5}'
   ```

## Your Current Vercel URL
https://app-project-l2582ix6l-glebs-projects-dd2e6b15.vercel.app

## Files Added for Vercel:
- `vercel.json` - Vercel configuration
- `api/health.js` - Health check endpoint
- `api/ai/insights.js` - AI insights endpoint
- Updated `package.json` - Added backend dependencies

## Environment Variables Needed:
- `ANTHROPIC_API_KEY` - Your Claude API key (set via Vercel dashboard or CLI)