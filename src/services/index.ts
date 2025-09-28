// Central export file for all services
export { supabase, isSupabaseConfigured } from './supabaseClient';
export { AuthService } from './authService';
export { UserPreferencesService } from './userPreferencesService';
export { JournalService } from './journalService';
export { AIInsightService } from './aiInsightService';
export { SubscriptionService } from './subscriptionService';

// Type exports
export type { AuthUser, SignUpData, SignInData, AuthResponse } from './authService';
export type { CreatePreferencesData, UpdatePreferencesData } from './userPreferencesService';
export type { CreateJournalEntryData, UpdateJournalEntryData } from './journalService';
export type { JournalEntry, UserContext, AIInsight, ChatMessage } from './aiInsightService';
export type { SubscriptionPlan, PurchaseResult } from './subscriptionService';