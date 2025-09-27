# 🚀 Setup Guide for AI Journaling App

## 📋 Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier is fine)
- Git (for version control)

## 🔧 Environment Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. **Create a Supabase Project:**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose your organization and create a project
   - Wait for the project to be set up (takes ~2 minutes)

2. **Get Your Supabase Credentials:**
   - In your Supabase dashboard, go to **Settings > API**
   - Copy the **Project URL** and **anon/public key**

3. **Configure Environment Variables:**
   - Open `.env.local` in your project root
   - Replace the placeholder values:
   ```env
   REACT_APP_SUPABASE_URL=https://your-actual-project-id.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-actual-anon-key-here
   ```

### 3. Set Up Database Schema

1. **Open Supabase SQL Editor:**
   - In your Supabase dashboard, go to **SQL Editor**
   - Click "New Query"

2. **Run the Schema Setup:**
   - Copy the entire SQL schema from `src/config/supabase.ts` (lines after `export const SCHEMA_SQL = \``)
   - Paste it into the SQL editor
   - Click "Run" to create all tables and policies

3. **Verify Setup:**
   - Go to **Database > Tables** in Supabase
   - You should see: `users`, `user_preferences`, `journal_entries`, `ai_insights`

## 🏃‍♂️ Running the App

### Development Mode

```bash
npm start
```

The app will open at `http://localhost:3000`

### First Time Setup Check

1. **Open browser console** (F12)
2. **Look for warnings** about Supabase configuration
3. **If configured correctly**, you'll see no warnings
4. **If misconfigured**, you'll see helpful error messages

## 🧪 Testing the Setup

### Test User Registration

1. **Go to the app** in your browser
2. **Click "Get Started Free"**
3. **Fill out the signup form**
4. **Complete the onboarding flow**
5. **Write your first journal entry**
6. **Verify you get an AI insight**

### Verify Database

1. **Check Supabase dashboard**
2. **Go to Database > Tables**
3. **Look at the `users` table** - you should see your new user
4. **Look at `journal_entries`** - you should see your first entry

## 🔍 Troubleshooting

### Common Issues

**"Supabase not configured" warning:**
- Check that `.env.local` has the correct URL and key
- Make sure the URL includes `.supabase.co`
- Restart the development server after changing env vars

**Database errors:**
- Verify you ran the SQL schema setup
- Check that Row Level Security is enabled
- Make sure your user has the right permissions

**Auth errors:**
- Confirm your Supabase project allows user registration
- Check that email confirmations are disabled for development

### Getting Help

1. **Check browser console** for detailed error messages
2. **Check Supabase logs** in your dashboard under Logs
3. **Verify environment variables** are loading correctly

## 🎯 Next Steps

Once everything is working:

1. **Invite others to test** the onboarding flow
2. **Set up OpenAI API** for real AI insights (optional)
3. **Configure RevenueCat** for subscription payments (optional)
4. **Deploy to production** using Vercel, Netlify, or similar

## 📂 Project Structure

```
src/
├── components/          # Reusable UI components
├── screens/            # Full page screens
├── services/           # API and business logic
├── contexts/           # React contexts (auth, etc.)
├── config/            # Configuration files
├── styles/            # Design system
└── utils/             # Helper functions
```

## 🔐 Security Notes

- **Never commit `.env.local`** - it's in `.gitignore`
- **Use environment variables** for all secrets
- **Row Level Security** is enabled on all tables
- **Users can only access their own data**

---

**🎉 You're all set! Start journaling and get personalized AI insights.**