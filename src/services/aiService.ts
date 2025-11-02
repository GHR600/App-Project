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

  console.log('🔐 Session:', session ? 'EXISTS' : 'MISSING');
  console.log('🔐 Token:', session?.access_token ? 'EXISTS' : 'MISSING');

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

    // ADD THESE DEBUG LOGS:
    console.log('🔗 API URL being used:', `${API_URL}/api/ai/insight`);
    console.log('🔐 Auth headers:', headers);
    console.log('📤 Request body:', JSON.stringify(request, null, 2));

    const response = await fetch(`${API_URL}/api/ai/insight`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    // ADD THIS DEBUG LOG:
    console.log('📥 Response status:', response.status, response.statusText);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error response body:', errorText);
      throw new Error(`Request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Success response:', data);

    return {
      insight: data.insight,
      followUpQuestion: data.followUpQuestion,
      confidence: data.confidence,
      source: data.source,
      model: data.model,
    };
  } catch (error: any) {
    console.error('❌ Error generating AI insight:', error);
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
        messages: [
          ...conversationHistory,
          { role: 'user', content: message }
        ],
        journalContext
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed: ${response.status}`);
    }

    const data = await response.json();
    return { response: data.response };
  } catch (error: any) {
    console.error('Error sending chat message:', error);
    return {
      response: '',
      error: error.message || 'Failed to send message. Please try again.',
    };
  }
}