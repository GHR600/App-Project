// Centralized AI Prompt Configuration
// Single source of truth for all AI personalities and prompt building
// Cache-busting timestamp: 2025-10-31-17:30:00 UTC (FIXED: Removed stray brace)

// AI Personality Definitions
const COACH_PERSONALITY = {
  style: 'coach',
  description: 'Strategic and direct. Helps you spot patterns and take action. 3 sentences max.',
  tone: [
    'Strategic',
    'Action-oriented and direct',
  ],
};

const REFLECTOR_PERSONALITY = {
  style: 'reflector',
  description: 'Thoughtful and curious. Gives you space to process and think clearly. 3 sentences max.',
  tone: [
    'Processing-focused and gentle',
    'Creates space for reflection',
    'Validates feelings',
  ],
};

// Model Selection Based on Subscription Tier
function getModelForTier(isPremium) {
  return 'claude-sonnet-4-5-20250929';
}

// Token Limits Based on Subscription Tier and Request Type
function getMaxTokens(isPremium, requestType) {
  const limits = {
    insight: {
      premium: 500,
      free: 300
    },
    chat: {
      premium: 400,
      free: 250
    },
    summary: {
      premium: 150,
      free: 100
    }
  };

  const tier = isPremium ? 'premium' : 'free';
  return limits[requestType]?.[tier] || 300;
}

// Prompt Builder: Insight Generation
function getInsightPrompt({ style = 'reflector', entry, moodRating, recentEntries, userPreferences, isPremium, userStats }) {
  const personality = style === 'coach' ? COACH_PERSONALITY : REFLECTOR_PERSONALITY;

  // Build context from recent entries if available
  let contextSection = '';
  if (recentEntries && recentEntries.length > 0) {
    const recentContext = recentEntries.slice(0, 3).map(e =>
      `- ${e.content?.substring(0, 100)}...`
    ).join('\n');
    contextSection = `\n\nRecent journal context:\n${recentContext}`;
  }

  // Build user preferences section
  let preferencesSection = '';
  if (userPreferences?.focus_areas && userPreferences.focus_areas.length > 0) {
    preferencesSection = `\n\nUser's focus areas: ${userPreferences.focus_areas.join(', ')}`;
  }

  // Build user stats section
  let statsSection = '';
  if (userStats) {
    const statsParts = [];
    if (userStats.totalEntries > 0) statsParts.push(`${userStats.totalEntries} total entries`);
    if (userStats.currentStreak > 0) statsParts.push(`${userStats.currentStreak}-day streak`);
    if (userStats.avgMood !== null) statsParts.push(`avg mood: ${userStats.avgMood}/10`);
    if (userStats.totalWords > 0) statsParts.push(`${userStats.totalWords.toLocaleString()} words written`);

    if (statsParts.length > 0) {
      statsSection = `\n\nUser's journaling stats: ${statsParts.join(', ')}`;
    }
  }

  const systemPrompt = `You are a ${personality.style}. Your personality is: ${personality.tone.join(', ')}.

Keep responses concise: 2-3 concise constructive sentences maximum.${preferencesSection}${statsSection}${contextSection}

Respond with JSON in this exact format:
{
  "insight": "Your ${personality.style}-style insight (1-2 sentences max)",
  "followUpQuestion": "A thoughtful question to deepen their reflection"
}`;

  const userMessage = `Journal entry: "${entry}"${moodRating ? `\nMood rating: ${moodRating}/10` : ''}

Provide a ${personality.style}-style insight.`;

  return {
    systemPrompt,
    userMessage,
    model: getModelForTier(isPremium),
    maxTokens: getMaxTokens(isPremium, 'insight')
  };
}

// Prompt Builder: Chat Response
function getChatPrompt({ style = 'reflector', message, journalContext, conversationHistory, userPreferences, isPremium, userStats }) {
  const personality = style === 'coach' ? COACH_PERSONALITY : REFLECTOR_PERSONALITY;

  // Build conversation history
  let historySection = '';
  if (conversationHistory && conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-5).map(msg =>
      `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`
    ).join('\n');
    historySection = `\n\nConversation history:\n${recentHistory}`;
  }

  // Build journal context
  let contextSection = '';
  if (journalContext) {
    contextSection = `\n\nCurrent journal entry: "${journalContext.substring(0, 300)}..."`;
  }

  // Build user preferences section
  let preferencesSection = '';
  if (userPreferences?.focus_areas && userPreferences.focus_areas.length > 0) {
    preferencesSection = `\n\nUser's focus areas: ${userPreferences.focus_areas.join(', ')}`;
  }

  // Build user stats section
  let statsSection = '';
  if (userStats) {
    const statsParts = [];
    if (userStats.totalEntries > 0) statsParts.push(`${userStats.totalEntries} total entries`);
    if (userStats.currentStreak > 0) statsParts.push(`${userStats.currentStreak}-day streak`);
    if (userStats.avgMood !== null) statsParts.push(`avg mood: ${userStats.avgMood}/10`);
    if (userStats.totalWords > 0) statsParts.push(`${userStats.totalWords.toLocaleString()} words written`);

    if (statsParts.length > 0) {
      statsSection = `\n\nUser's journaling stats: ${statsParts.join(', ')}`;
    }
  }

  const systemPrompt = `You are a ${personality.style}. Your personality is: ${personality.tone.join(', ')}.

Respond in 1-2 sentences. Be concise and direct.${preferencesSection}${statsSection}${contextSection}${historySection}

Respond naturally and conversationally while maintaining ${personality.style} voice.`;

  return {
    systemPrompt,
    userMessage: message,
    model: getModelForTier(isPremium),
    maxTokens: getMaxTokens(isPremium, 'chat')
  };
}

// Prompt Builder: Summary Generation
function getSummaryPrompt({ style = 'reflector', journalContent, conversationHistory, userPreferences, isPremium }) {
  const personality = style === 'coach' ? COACH_PERSONALITY : REFLECTOR_PERSONALITY;

  // Build conversation context if available
  let conversationSection = '';
  if (conversationHistory && conversationHistory.length > 0) {
    const chatSummary = conversationHistory.slice(-3).map(msg =>
      `${msg.role}: ${msg.content.substring(0, 100)}`
    ).join('\n');
    conversationSection = `\n\nRelated conversation:\n${chatSummary}`;
  }

  const systemPrompt = `Summarise this journal entry and chat in bullet points.

- Do not begin with "Summary:" or any other preamble.
- Begin directly with the content - no labels, no headers, no prefixes.
- Keep it concise and to the point (3-5 bullet points).
- Use ${personality.style} voice: ${style === 'coach' ? 'focus on patterns and actions' : 'focus on feelings and processing'}
- Make it useful for quick scanning later${conversationSection}`;

  return {
    systemPrompt,
    userMessage: journalContent,
    model: getModelForTier(isPremium),
    maxTokens: getMaxTokens(isPremium, 'summary')
  };
}

// Export all functions and personalities
module.exports = {
  COACH_PERSONALITY,
  REFLECTOR_PERSONALITY,
  getModelForTier,
  getMaxTokens,
  getInsightPrompt,
  getChatPrompt,
  getSummaryPrompt
};