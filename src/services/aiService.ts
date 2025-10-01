import Constants from 'expo-constants';
import { buildAIContext, AIContext, formatAIContextAsText } from './aiContextService';
import { DatabaseJournalEntry } from '../config/supabase';

const ANTHROPIC_API_KEY = Constants.expoConfig?.extra?.anthropicApiKey || process.env.REACT_APP_ANTHROPIC_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022';

// Debug logging for API key configuration
console.log('🔑 Anthropic API Key Configuration:', {
  hasExpoConfigKey: !!Constants.expoConfig?.extra?.anthropicApiKey,
  hasProcessEnvKey: !!process.env.REACT_APP_ANTHROPIC_API_KEY,
  hasKey: !!ANTHROPIC_API_KEY,
  keyPrefix: ANTHROPIC_API_KEY ? ANTHROPIC_API_KEY.substring(0, 10) + '...' : 'not set'
});

// Truncation limits to stay within API token limits
const MAX_CONTENT_LENGTH = 2000; // Max characters per entry/note content
const MAX_ENTRIES_COUNT = 30; // Max number of past entries to include
const MAX_NOTES_COUNT = 20; // Max number of notes to include

/**
 * AI Service for generating insights using Claude API
 */

/**
 * Truncate text content to a maximum length
 */
function truncateContent(content: string, maxLength: number = MAX_CONTENT_LENGTH): string {
  if (content.length <= maxLength) {
    return content;
  }
  return content.substring(0, maxLength) + '... [truncated]';
}

export interface AIInsightResponse {
  insight: string;
  patterns: string[];
  suggestions: string[];
  error?: string;
}

export interface AIInsightRequest {
  userId: string;
  currentEntryId?: string;
  currentEntryContent?: string;
  currentEntryDate?: string;
  currentEntryMood?: number;
}

/**
 * Build a structured prompt for Claude API
 * Formats the AI context into a clear structure with sections
 * Applies truncation to stay within API token limits
 */
function buildAIPrompt(context: AIContext): string {
  let prompt = '';

  // USER'S NOTES SECTION (limit to MAX_NOTES_COUNT most recent)
  const truncatedNotes = context.allNotes.slice(0, MAX_NOTES_COUNT);
  if (truncatedNotes.length > 0) {
    prompt += '=== USER\'S NOTES ===\n\n';
    prompt += `The user has ${context.allNotes.length} saved note(s) for reference`;
    if (truncatedNotes.length < context.allNotes.length) {
      prompt += ` (showing ${truncatedNotes.length} most recent)`;
    }
    prompt += ':\n\n';

    truncatedNotes.forEach((note, index) => {
      prompt += `NOTE ${index + 1}: ${note.title}\n`;
      if (note.category) {
        prompt += `Category: ${note.category}\n`;
      }
      prompt += `Created: ${new Date(note.created_at).toLocaleDateString()}\n`;
      prompt += `Content:\n${truncateContent(note.content)}\n\n`;
      prompt += '---\n\n';
    });
  } else {
    prompt += '=== USER\'S NOTES ===\n\n';
    prompt += 'No saved notes yet.\n\n';
  }

  // ALL PAST ENTRIES SECTION (limit to MAX_ENTRIES_COUNT most recent)
  const truncatedEntries = context.allEntries.slice(0, MAX_ENTRIES_COUNT);
  if (truncatedEntries.length > 0) {
    prompt += '=== PAST JOURNAL ENTRIES ===\n\n';
    prompt += `The user has ${context.allEntries.length} journal entry/entries in total`;
    if (truncatedEntries.length < context.allEntries.length) {
      prompt += ` (showing ${truncatedEntries.length} most recent)`;
    }
    prompt += ':\n\n';

    truncatedEntries.forEach((entry, index) => {
      prompt += `ENTRY ${index + 1} - ${entry.created_at}\n`;
      if (entry.title) {
        prompt += `Title: ${entry.title}\n`;
      }
      if (entry.mood_rating) {
        prompt += `Mood Rating: ${entry.mood_rating}/5\n`;
      }
      prompt += `Content:\n${truncateContent(entry.content)}\n\n`;
      prompt += '---\n\n';
    });
  } else {
    prompt += '=== PAST JOURNAL ENTRIES ===\n\n';
    prompt += 'No past journal entries.\n\n';
  }

  // CURRENT ENTRY SECTION (always include full content for current entry being analyzed)
  if (context.currentEntry) {
    prompt += '=== CURRENT ENTRY (BEING ANALYZED) ===\n\n';
    prompt += `Date: ${context.currentEntry.created_at}\n`;
    if (context.currentEntry.title) {
      prompt += `Title: ${context.currentEntry.title}\n`;
    }
    if (context.currentEntry.mood_rating) {
      prompt += `Mood Rating: ${context.currentEntry.mood_rating}/5\n`;
    }
    // Don't truncate current entry - it's the focus of analysis
    prompt += `Content:\n${context.currentEntry.content}\n\n`;
  }

  return prompt;
}

/**
 * Generate AI insights for a journal entry using Claude API
 * @param request - Request containing userId and entry information
 * @returns AI-generated insights with patterns and suggestions
 */
export async function generateAIInsight(request: AIInsightRequest): Promise<AIInsightResponse> {
  try {
    // Validate API key
    if (!ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key is not configured');
    }

    // Build context
    const { context, error: contextError } = await buildAIContext(
      request.userId,
      request.currentEntryId
    );

    if (contextError || !context) {
      throw new Error('Failed to build AI context');
    }

    // If we have currentEntryContent but no currentEntry in context, add it manually
    // Note: Don't truncate the current entry content as it's the focus of analysis
    if (request.currentEntryContent && !context.currentEntry) {
      context.currentEntry = {
        id: request.currentEntryId || 'temp',
        user_id: request.userId,
        date: request.currentEntryDate || new Date().toISOString().split('T')[0],
        content: request.currentEntryContent, // Full content, not truncated
        mood_rating: request.currentEntryMood,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        word_count: request.currentEntryContent.split(' ').length,
      };
    }

    // Log truncation statistics
    const totalNotes = context.allNotes.length;
    const totalEntries = context.allEntries.length;
    const notesIncluded = Math.min(totalNotes, MAX_NOTES_COUNT);
    const entriesIncluded = Math.min(totalEntries, MAX_ENTRIES_COUNT);

    console.log('🔍 Context truncation stats:', {
      totalNotes,
      notesIncluded,
      notesTruncated: totalNotes - notesIncluded,
      totalEntries,
      entriesIncluded,
      entriesTruncated: totalEntries - entriesIncluded,
      maxContentLength: MAX_CONTENT_LENGTH
    });

    // Build the prompt
    const contextPrompt = buildAIPrompt(context);

    // System prompt for Claude
    const systemPrompt = `You are an empathetic and insightful AI journaling companion. Your role is to analyze the user's journal entries and notes to provide meaningful insights.

INSTRUCTIONS:
1. Analyze the CURRENT ENTRY in the context of the user's NOTES and RECENT ENTRIES
2. Identify patterns, themes, and emotional trends across all provided context
3. Provide thoughtful insights that help the user understand their thoughts and emotions
4. Suggest actionable ways to support their well-being and personal growth
5. Be compassionate, non-judgmental, and encouraging
6. Keep your response concise but meaningful (2-4 paragraphs)

RESPONSE FORMAT:
Provide your response in a natural, conversational tone. Focus on:
- Key insights about their current state of mind
- Patterns you notice across their recent entries and notes
- Gentle suggestions for reflection or action

Do not use bullet points or structured lists. Write in a warm, supportive narrative style.`;

    // Call Claude API
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: contextPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Claude API error:', errorData);
      throw new Error(`Claude API request failed: ${response.status}`);
    }

    const data = await response.json();

    // Extract the insight text
    const insightText = data.content?.[0]?.text || 'Unable to generate insights at this time.';

    // Parse patterns and suggestions (simplified for now)
    // In a more advanced version, you could ask Claude to structure the response
    const patterns: string[] = [];
    const suggestions: string[] = [];

    return {
      insight: insightText,
      patterns,
      suggestions,
    };
  } catch (error: any) {
    console.error('Error generating AI insight:', error);
    return {
      insight: '',
      patterns: [],
      suggestions: [],
      error: error.message || 'Failed to generate AI insights. Please try again.',
    };
  }
}

/**
 * Check if AI insights are available (API key configured)
 */
export function isAIInsightsAvailable(): boolean {
  return !!ANTHROPIC_API_KEY;
}

/**
 * Get AI insight with retry logic
 * @param request - Request containing userId and entry information
 * @param maxRetries - Maximum number of retry attempts (default: 2)
 */
export async function generateAIInsightWithRetry(
  request: AIInsightRequest,
  maxRetries: number = 2
): Promise<AIInsightResponse> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await generateAIInsight(request);

      // If no error, return the response
      if (!response.error) {
        return response;
      }

      // If there's an error, store it and potentially retry
      lastError = new Error(response.error);

      // If it's the last attempt, return the error response
      if (attempt === maxRetries) {
        return response;
      }

      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    } catch (error) {
      lastError = error;

      // If it's the last attempt, return error response
      if (attempt === maxRetries) {
        return {
          insight: '',
          patterns: [],
          suggestions: [],
          error: 'Failed to generate AI insights after multiple attempts. Please try again later.',
        };
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
  }

  // Fallback (shouldn't reach here, but just in case)
  return {
    insight: '',
    patterns: [],
    suggestions: [],
    error: lastError?.message || 'An unexpected error occurred.',
  };
}
