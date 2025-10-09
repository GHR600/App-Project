# User Flows

## Onboarding Flow
1. Welcome screen → Explains value prop
2. Email signup → Quick registration
3. Preferences → Select focus areas (career, relationships, etc.)
4. First entry → Guided journal prompt
5. AI insight → Show personalized response
6. Setup complete → Encourage daily habit

## Enhanced Daily Usage Flow
1. Open app → See diary-style home page with daily entry cards
2. Current day card → Expanded by default, shows empty journal entry area
3. Write entry → Auto-saves drafts, optional entry templates available
4. Submit entry → AI insight appears in dedicated section
5. Chat interface → Unlocks after insight, enables conversation with AI
6. Day summary → User can request summary of entire days content
7. Previous days → Collapsed cards with date/mood headers, expandable on tap

## Daily Card Structure
### Card Header (Always Visible)
- Date display (Today, Yesterday, Dec 23, etc.)
- Mood emoji indicator from entry
- Expand/collapse toggle

### Card Content (Expandable)
1. **Journal Entry Section**
   - Rich text editor with formatting
   - Auto-save functionality
   - Entry templates/prompts
   - Privacy quick-hide button

2. **AI Insight Section** 
   - Appears after entry submission
   - Professional therapeutic response
   - Emoji reaction buttons

3. **Chat Interface**
   - Unlocks after insight generation
   - Clear user/AI message distinction
   - Typing indicators for AI responses
   - Ability to pin meaningful exchanges

4. **Day Summary Section**
   - Generated on-demand
   - Synthesizes entry + chat + insights

## Diary/History Flow
1. From dashboard → Tap "View All" or diary icon
2. Entry list → All entries chronologically (newest first)
3. Search/filter → Find entries by date or keyword
4. Tap entry → Read full entry with AI insights
5. Navigate back → Return to main feed

## Subscription Flow
1. Hit paywall → After 3 free insights
2. Value explanation → Show what premium unlocks
3. Pricing page → $4.99/week or $99/year
4. Payment → RevenueCat handles
5. Premium unlocked → Advanced insights available

## AI Insight Generation Flow
1. User saves journal entry
2. App sends entry to YOUR backend API
3. Backend determines user tier (free/premium)
4. Backend calls appropriate AI service with YOUR API keys
5. Backend returns insight to app
6. App displays insight to user

## Freemium AI Strategy
- Free users: 3 insights/week, shorter responses, basic prompts
- Premium users: Unlimited insights, detailed responses, personalized prompts, pattern analysis