# IMPLEMENTATION GUIDE: AI Style Selection & RevenueCat Integration

## OVERVIEW
This guide provides step-by-step instructions for implementing two major features:
1. AI Response Style Selection (Coach vs Reflector modes)
2. RevenueCat subscription integration (freemium model with Google Play)
3. Date display on entry cards

All prompt logic should be consolidated into a single source of truth, eliminating scattered prompts across the codebase.

---

## PHASE 1: CONSOLIDATE PROMPTS & ADD AI STYLE SYSTEM

### Task 1.1: Create Centralized Prompt Configuration File
**Location:** `server/src/config/aiPrompts.js`

**Requirements:**
- Define two personality objects: COACH_PERSONALITY and REFLECTOR_PERSONALITY
- COACH_PERSONALITY should be: strategic, pattern-focused, action-oriented, direct, asks probing questions
- REFLECTOR_PERSONALITY should be: thoughtful, curious, processing-focused, warm, creates space for reflection
- Include example responses for each style (insight, chat, summary examples)
- Create three prompt builder functions:
  1. `getInsightPrompt({ style, entry, moodRating, recentEntries, userPreferences, isPremium })`
  2. `getChatPrompt({ style, message, journalContext, conversationHistory, userPreferences, isPremium })`
  3. `getSummaryPrompt({ style, journalContent, conversationHistory, userPreferences, isPremium })`
- Create `getModelForTier(isPremium)` function: returns claude-3-5-sonnet for premium, claude-3-haiku for free
- Create `getMaxTokens(isPremium, requestType)` function: returns appropriate token limits based on tier and request type (insight/chat/summary)
- All prompts should respect the selected AI style and adjust tone accordingly
- Export all functions and personality objects

**Key Details:**
- Coach style: Focus on patterns, actionable insights, strategic thinking, direct questions
- Reflector style: Focus on clarity, processing, gentle exploration, validating feelings
- Prompts should be concise: 1-3 sentences for chat, 2-4 paragraphs for insights
- Include user context (focus areas, premium status) in prompts
- For insights: request JSON response with {insight, followUpQuestion, confidence}
- For chat: natural conversational responses
- For summary: one sentence with optional keywords for entry card display

---

### Task 1.2: Update AI Service to Use Centralized Prompts
**Location:** `api/_utils/aiService.js` (serverless function)

**Requirements:**
- Import all functions from the centralized aiPrompts configuration
- Add `aiStyle` parameter to all methods: generateClaudeInsight, generateClaudeChatResponse, generateClaudeSummary
- Default aiStyle to 'reflector' if not provided
- Replace ALL inline prompt building with calls to imported prompt functions
- Use getModelForTier() to select Claude model based on subscription status
- Use getMaxTokens() to set appropriate token limits
- Remove the buildUnifiedPrompt() method entirely - it's replaced by the new prompt config
- Remove all hardcoded personality strings and system prompts
- Ensure all Claude API calls use the prompts from the centralized config

**Files that call AI Service methods should pass aiStyle parameter**

---

### Task 1.3: Update Database Schema
**Requirements:**
- Add column to users table: `ai_style VARCHAR(20) DEFAULT 'reflector'`
- Add constraint: CHECK (ai_style IN ('coach', 'reflector'))
- Create index: `idx_users_ai_style` on users(ai_style)
- This column stores the user's selected AI personality preference

---

### Task 1.4: Update API Routes to Pass AI Style
**Locations:** 
- `server/src/routes/journal.js` (insight generation endpoint)
- `server/src/routes/ai.js` (chat endpoint)

**Requirements:**
- Before calling AI service methods, fetch user data from database including: ai_style, subscription_status, focus_areas
- Pass ai_style to all AI service method calls
- Use ai_style from database, default to 'reflector' if null
- Ensure userId is available to fetch user preferences
- Remove any inline prompt building in routes - all prompts come from aiPrompts.js

---

### Task 1.5: Remove or Simplify Frontend AI Service
**Location:** `src/services/aiService.ts`

**Requirements:**
- This file should be deleted OR simplified to only contain helper functions that call backend API endpoints
- ALL Claude API calls must go through the backend for security (API keys should never be in frontend)
- If keeping this file, it should only have wrapper functions like:
  - `generateAIInsight(entryId)` - calls POST /api/journal/insight
  - `sendChatMessage(message, entryId)` - calls POST /api/ai/chat
- No direct Claude API integration in frontend
- No ANTHROPIC_API_KEY or prompt building in frontend code

---

## PHASE 2: ONBOARDING FLOW WITH AI STYLE SELECTION

### Task 2.1: Create Onboarding Screen
**Location:** `src/screens/OnboardingScreen.tsx` (or .jsx)

**Requirements:**
- Full-screen dark theme interface
- Title: "How should I help you journal?"
- Subtitle: "You can change this anytime in Settings"
- Two large touchable cards side by side (or stacked on mobile):
  
  **Card 1 - Coach:**
  - Emoji: 🎯
  - Title: "Coach"
  - Description: "Strategic and direct. Helps you spot patterns and take action."
  - Example response preview: "This is the third time you've mentioned feeling overlooked. What would speaking up look like?"
  
  **Card 2 - Reflector:**
  - Emoji: 🧘
  - Title: "Reflector"
  - Description: "Thoughtful and curious. Gives you space to process and think clearly."
  - Example response preview: "You're feeling stuck between two options. What part feels most important to sit with?"

- Visual feedback when card is selected (border color change, background shift)
- On selection: save choice to Supabase users.ai_style, then navigate to Home screen
- Loading state while saving
- No skip button - force the choice (they can change later in settings)
- Card selected state should be visually distinct (border highlight, background color change)

**Design Notes:**
- Minimal, clean interface matching existing dark theme
- Cards should be large enough to read example text
- Example text helps user understand the difference between styles
- Use existing app colors and design language

---

### Task 2.2: Add Onboarding to Navigation Flow
**Location:** App.tsx or main navigation file

**Requirements:**
- On app launch, check if user has ai_style set in database
- If ai_style is null or undefined, show OnboardingScreen
- If ai_style is set, proceed to Home screen
- Onboarding should appear after authentication but before main app
- Once completed, user should never see onboarding again (unless they reset their account)
- Check onboarding status on every app launch to handle edge cases

---

### Task 2.3: Add AI Style Setting in Settings Screen
**Location:** `src/screens/SettingsScreen.tsx`

**Requirements:**
- Add new section titled "AI Response Style"
- Display two options: Coach and Reflector (same emoji and descriptions as onboarding)
- Show checkmark or highlight on currently selected style
- When user taps a different style, update users.ai_style in database
- Show confirmation or loading state during update
- Style options should visually match the onboarding cards for consistency
- User should be able to switch between styles at any time

---

## PHASE 3: REVENUECAT INTEGRATION (GOOGLE PLAY)

### Task 3.1: Install RevenueCat SDK
**Requirements:**
- Install package: react-native-purchases
- Run pod install for iOS (if applicable in future)
- No additional native configuration needed for this phase

---

### Task 3.2: Initialize RevenueCat in App
**Location:** App.tsx or main entry point

**Requirements:**
- Import Purchases from 'react-native-purchases'
- In useEffect on app launch:
  - Configure Purchases with Android API key from RevenueCat dashboard
  - Set log level to DEBUG if in development mode
  - After user authenticates, call Purchases.logIn(userId) to link RevenueCat customer to your user
- API key should come from environment variable: REACT_APP_REVENUECAT_ANDROID_KEY

---

### Task 3.3: Create Subscription Service
**Location:** `src/services/subscriptionService.ts`

**Requirements:**
- Export type: SubscriptionStatus = 'free' | 'premium'
- Create function `checkSubscriptionStatus()`: checks RevenueCat customerInfo, returns 'premium' if entitlement 'premium' is active, otherwise 'free'
- Create function `syncSubscriptionStatus()`: reads RevenueCat status, updates users.subscription_status in Supabase
- Create function `getOfferings()`: fetches available subscription packages from RevenueCat
- Create function `purchasePackage(packageToPurchase)`: initiates purchase flow, syncs status after successful purchase
- Create function `restorePurchases()`: restores previous purchases, syncs status
- All functions should handle errors gracefully and log failures

---

### Task 3.4: Create Paywall Screen
**Location:** `src/screens/PaywallScreen.tsx`

**Requirements:**
- Props: onDismiss (close paywall), onSuccess (purchase completed)
- On mount: fetch available subscription offerings from RevenueCat
- Display:
  - Title: "Unlock Premium"
  - Features list with icons:
    - 💬 Unlimited AI chat messages
    - 🧠 Advanced pattern recognition
    - 📊 Detailed analytics & insights
    - ⚡ Faster, smarter AI responses
  - Subscription options (loaded from RevenueCat):
    - Monthly option with price
    - Annual option with price + "Save 33%" badge
  - Large "Start [Plan Name]" button
  - "Continue with free version" link to dismiss
  - Small disclaimer text about cancellation
- When user selects package and taps purchase button:
  - Call purchasePackage() from subscription service
  - Show loading state during purchase
  - On success: call onSuccess()
  - On cancel: just return to previous screen
  - On error: show error message
- Close button in top right
- Should be presented as modal or full screen

**Design:**
- Dark theme matching app
- Clear pricing presentation
- Highlight annual plan as better value
- Professional, clean layout

---

### Task 3.5: Create Subscription Context
**Location:** `src/context/SubscriptionContext.tsx`

**Requirements:**
- Create context that provides:
  - status: SubscriptionStatus ('free' | 'premium' | 'loading')
  - isPremium: boolean
  - refresh: () => Promise<void>
- Provider component should:
  - Load subscription status on mount
  - Listen to Purchases.addCustomerInfoUpdateListener for subscription changes
  - Auto-sync status to backend when changed
  - Expose subscription state to entire app
- Wrap entire app with SubscriptionProvider in App.tsx

---

### Task 3.6: Implement Rate Limiting Middleware
**Location:** `server/src/middleware/rateLimiter.js`

**Requirements:**
- Create middleware function `checkAIRateLimit(req, res, next)`
- On each request:
  - Get userId from request
  - Fetch user's subscription_status from database
  - If subscription_status === 'premium', bypass rate limiting (call next())
  - If free tier:
    - Track AI interactions per user per day using in-memory object or Redis
    - Free tier limit: 10 AI interactions per day
    - If limit exceeded: return 429 status with error message and resetAt timestamp
    - If under limit: increment counter and call next()
- Rate limit should reset every 24 hours
- Add periodic cleanup of old rate limit entries
- Attach rate limit headers to response: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset

**Apply this middleware to:**
- POST /api/ai/chat
- POST /api/journal/insight
- Any other AI-related endpoints

---

### Task 3.7: Handle Rate Limiting in Frontend
**Locations:** Chat components and insight generation flows

**Requirements:**
- When making AI API calls, check response status
- If status === 429 (rate limited):
  - Parse error message from response
  - Show paywall modal/screen
  - Display message about upgrading to premium for unlimited access
- After successful upgrade:
  - Refresh subscription status
  - Allow user to retry their action
- Use subscription context to check isPremium before showing paywall
- Premium users should never see rate limit errors

---

## PHASE 4: ADD DATES TO ENTRY CARDS

### Task 4.1: Update Entry Card Component
**Location:** `src/components/EntryCard.tsx` (or wherever entry cards are rendered)

**Requirements:**
- Add date display in TOP LEFT corner of each entry card
- Date should be formatted intelligently:
  - If today: show "Today"
  - If yesterday: show "Yesterday"
  - If within last 7 days: show relative time ("2 days ago")
  - If older: show formatted date ("Jan 15, 2025")
- Use date-fns library for formatting (install if needed)
- Date text should be small, subtle, lower opacity than main content
- Date should be the first element user sees (top left position)
- Entry card should show:
  1. Date (top left)
  2. Title (if exists)
  3. Summary (if exists) OR content excerpt (first ~150 characters)
  4. Mood rating (if exists)

**Visual requirements:**
- Date color: subtle gray (#888)
- Date font size: smaller than title
- Date should not dominate the card, just provide context

---

## PHASE 5: TESTING REQUIREMENTS

### What to Test:

**Prompt System:**
- Generate insights with Coach style - should be strategic, direct, action-focused
- Generate insights with Reflector style - should be thoughtful, curious, processing-focused
- Change AI style in settings and verify next insight uses new style
- Verify chat conversations maintain style throughout
- Check that premium users get Sonnet model and free users get Haiku model

**Onboarding:**
- First launch shows onboarding screen
- Selecting Coach saves to database and navigates to home
- Selecting Reflector saves to database and navigates to home
- Subsequent launches skip onboarding
- Settings screen correctly shows current AI style
- Changing style in settings persists across app restart

**RevenueCat:**
- Free users can use AI features (limited to 10/day)
- After 10 interactions, rate limit triggers
- Rate limit shows paywall with clear messaging
- Purchase flow completes successfully on test device
- Subscription status syncs to backend
- Premium users have unlimited AI access
- Premium users get better AI model (Sonnet)
- Restore purchases button works
- Subscription persists across app restarts

**UI:**
- Entry cards show dates in top left
- Date formatting is human-readable
- Cards show summary if available, otherwise content excerpt
- All screens maintain dark theme consistency
- Layouts work on different screen sizes

---

## PHASE 6: DEPLOYMENT CHECKLIST

### Environment Variables to Set:

**Backend (.env):**
```
ANTHROPIC_API_KEY=your_claude_api_key_from_anthropic_console
REVENUECAT_API_KEY=your_revenuecat_api_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Frontend:**
```
REACT_APP_REVENUECAT_ANDROID_KEY=your_android_key_from_revenuecat_dashboard
REACT_APP_API_URL=your_backend_api_url
```

### Google Play Setup Required:
1. Google Play Console account created
2. App listing created in Play Console
3. Navigate to Monetization > Products > Subscriptions
4. Create two subscription products:
   - Product ID: premium_monthly, Price: $4.99/month
   - Product ID: premium_annual, Price: $39.99/year
5. Products must be in "Active" status

### RevenueCat Setup Required:
1. Account created at revenuecat.com
2. Project created for your app
3. Android app added with correct package name
4. Google Play linked via service account JSON key
5. Entitlement created: name "premium"
6. Offering created with both subscription products added
7. API keys copied to environment variables

---

## FILE STRUCTURE SUMMARY

### New Files to Create:
1. `server/src/config/aiPrompts.js` - All AI prompts and personalities
2. `server/src/middleware/rateLimiter.js` - Rate limiting for free tier
3. `src/screens/OnboardingScreen.tsx` - AI style selection onboarding
4. `src/screens/PaywallScreen.tsx` - Subscription purchase screen
5. `src/services/subscriptionService.ts` - RevenueCat integration helpers
6. `src/context/SubscriptionContext.tsx` - App-wide subscription state

### Existing Files to Modify:
1. `server/src/services/aiService.js` - Use centralized prompts, add aiStyle parameter
2. `server/src/routes/ai.js` - Remove inline prompts, add rate limiting, pass aiStyle
3. `server/src/routes/journal.js` - Add rate limiting, pass aiStyle
4. `src/components/EntryCard.tsx` - Add date display
5. `App.tsx` - Initialize RevenueCat, add SubscriptionProvider, add onboarding check
6. `src/screens/SettingsScreen.tsx` - Add AI style switcher

### Files to Delete or Simplify:
1. `src/services/aiService.ts` - Delete or simplify to only call backend APIs (no direct Claude calls)

### Database Changes:
```sql
ALTER TABLE users ADD COLUMN ai_style VARCHAR(20) DEFAULT 'reflector' CHECK (ai_style IN ('coach', 'reflector'));
CREATE INDEX idx_users_ai_style ON users(ai_style);
```

---

## IMPORTANT IMPLEMENTATION NOTES

### Security:
- NEVER expose ANTHROPIC_API_KEY in frontend code
- All Claude API calls must go through backend
- RevenueCat API key for backend webhooks should be server-side only
- Frontend only needs RevenueCat SDK public key

### Best Practices:
- All prompts come from single source: aiPrompts.js
- No inline prompt strings anywhere in routes or services
- AI style preference is user-specific and stored in database
- Subscription status is synced between RevenueCat and Supabase
- Rate limiting is enforced server-side, not client-side
- Premium status determines both API access and AI model quality

### User Experience:
- Onboarding is mandatory on first launch (no skip)
- User can change AI style anytime in settings
- Free users get clear messaging about premium benefits
- Paywall appears contextually when hitting limits
- Premium users never see rate limiting or paywalls
- All AI responses respect the user's chosen style

### Error Handling:
- Gracefully handle failed AI API calls
- Fall back to mock responses if Claude API fails
- Handle RevenueCat purchase cancellations smoothly
- Show user-friendly error messages
- Log all errors for debugging

---

## ESTIMATED TIMELINE

- Phase 1 (Prompt consolidation): 4-6 hours
- Phase 2 (Onboarding): 4-6 hours
- Phase 3 (RevenueCat): 8-12 hours
- Phase 4 (Entry dates): 1-2 hours
- Phase 5 (Testing): 4-6 hours
- Phase 6 (Deployment prep): 2-4 hours

**Total: 23-36 hours** (3-5 days focused development)

---

## SUPPORT RESOURCES

- RevenueCat Documentation: https://docs.revenuecat.com/
- Anthropic Claude API Docs: https://docs.anthropic.com/
- React Native Purchases: https://github.com/RevenueCat/react-native-purchases
- Google Play Console: https://play.google.com/console
- Supabase Documentation: https://supabase.com/docs

---

END OF IMPLEMENTATION GUIDE