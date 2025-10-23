/**
 * Frontend AI Service
 * This service provides wrapper functions to call the backend AI API endpoints
 * ALL Claude API calls must go through the backend for security (API keys should never be in frontend)
 */

import { API_CONFIG } from '../utils/env';
import { supabase } from '../config/supabase';

const API_URL = API_CONFIG.baseUrl;

/**
 * Get authorization headers with access token
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  return headers;
}

export interface AIInsightResponse {
  insight: string;
  followUpQuestion?: string;
  confidence?: number;
  source?: string;
  model?: string;
  error?: string;
}

export interface AIInsightRequest {
  content: string;
  moodRating?: number;
  userPreferences?: {
    focusAreas?: string[];
    personalityType?: string;
  };
  recentEntries?: any[];
  subscriptionStatus?: string;
}

/**
 * Generate AI insight for journal entry
 * Calls POST /api/ai/insight endpoint
 */
export async function generateAIInsight(request: AIInsightRequest): Promise<AIInsightResponse> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/ai/insight`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed: ${response.status}`);
    }

    const data = await response.json();

    return {
      insight: data.insight,
      followUpQuestion: data.followUpQuestion,
      confidence: data.confidence,
      source: data.source,
      model: data.model,
    };
  } catch (error: any) {
    console.error('Error generating AI insight:', error);
    return {
      insight: '',
      error: error.message || 'Failed to generate AI insights. Please try again.',
    };
  }
}

/**
 * Send chat message to AI
 * Calls POST /api/ai/chat endpoint
 */
export async function sendChatMessage(
  message: string,
  conversationHistory: any[],
  journalContext?: string
): Promise<{ response: string; error?: string }> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/ai/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messages: [...conversationHistory, { role: 'user', content: message }],
        journalContext,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed: ${response.status}`);
    }

    const data = await response.json();

    return {
      response: data.response,
    };
  } catch (error: any) {
    console.error('Error sending chat message:', error);
    return {
      response: '',
      error: error.message || 'Failed to send chat message. Please try again.',
    };
  }
}

/**
 * Get user's current AI style preference
 * Calls GET /api/ai/style endpoint
 */
export async function getUserAIStyle(): Promise<{ aiStyle: string; error?: string }> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/ai/style`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed: ${response.status}`);
    }

    const data = await response.json();

    return {
      aiStyle: data.aiStyle,
    };
  } catch (error: any) {
    console.error('Error fetching AI style:', error);
    return {
      aiStyle: 'reflector', // Default fallback
      error: error.message || 'Failed to fetch AI style.',
    };
  }
}

/**
 * Update user's AI style preference
 * Calls PUT /api/ai/style endpoint
 */
export async function updateUserAIStyle(
  aiStyle: 'coach' | 'reflector'
): Promise<{ success: boolean; error?: string }> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/ai/style`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ aiStyle }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed: ${response.status}`);
    }

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Error updating AI style:', error);
    return {
      success: false,
      error: error.message || 'Failed to update AI style.',
    };
  }
}

/**
 * Check if AI insights are available
 * This now always returns true since backend handles all AI functionality
 */
export function isAIInsightsAvailable(): boolean {
  return true;
}

/**
 * Get AI insight with retry logic
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
    error: lastError?.message || 'An unexpected error occurred.',
  };
}
