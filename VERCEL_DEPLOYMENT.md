# Secure Vercel Deployment Guide

## 🚨 CRITICAL SECURITY WARNING

**🔐 NEVER EVER commit real API keys, secrets, or tokens to this file or any file in your repository!**

- Use placeholder values like `your-actual-api-key` in documentation
- Real secrets should ONLY exist in:
  - Local `.env.local` files (git-ignored)
  - Vercel dashboard environment variables
  - Your secure password manager

**⚠️ GITHUB WILL BLOCK PUSHES containing real API keys for your protection.**

## 🚀 Deployment Steps

### 1. Set Environment Variables in Vercel Dashboard

**Go to your Vercel project dashboard > Settings > Environment Variables and add:**

```bash
# Production Environment Variables
NODE_ENV=production

# Anthropic API
ANTHROPIC_API_KEY=your-actual-anthropic-api-key

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-actual-anon-key
```

### 2. Deploy Without Secrets in Code

The `vercel.json` file should NOT contain any secrets:

```json
{
  "version": 2,
  "build": {
    "env": {
      "NODE_ENV": "production"
    }
  },
  "functions": {
    "app.js": {
      "memory": 128
    }
  }
}
```

### 3. Deployment Command

```bash
# Deploy to Vercel
vercel --prod

# Or link and deploy
vercel link
vercel --prod
```

## 🔒 Security Checklist

- [ ] All environment variables set in Vercel dashboard
- [ ] No API keys in `vercel.json`
- [ ] No secrets in `.env.example` files
- [ ] `.env.local` in `.gitignore`
- [ ] Repository is private or secrets are properly excluded

## 🛠️ Local Development

For local development, copy the example file and add your real secrets:

```bash
cp .env.example .env.local
# Edit .env.local with your actual values
```

## 📋 Required Environment Variables

### Frontend (React)
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`
- `REACT_APP_API_BASE_URL` (your backend URL)

### Backend (Server)
- `ANTHROPIC_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`

## 🔄 Updating Secrets

To rotate API keys:

1. Update keys in your service providers (Supabase, Anthropic)
2. Update environment variables in Vercel dashboard
3. Redeploy: `vercel --prod`

## ⚠️ If Secrets Were Exposed

If you accidentally committed secrets:

1. **Immediately rotate all exposed keys**
2. Update your `.env.example` files to use placeholders
3. Remove secrets from `vercel.json`
4. Force push the cleaned repository
5. Update environment variables in Vercel dashboard

## 🆘 Emergency Response

If GitHub blocks your push due to secrets:

1. Run this security scan: `grep -r "sk-\|eyJ" . --exclude-dir=node_modules`
2. Replace any found secrets with placeholders
3. Update `.gitignore` to exclude sensitive files
4. Use `git filter-branch` to remove secrets from history if needed