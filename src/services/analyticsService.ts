import { supabase } from '../config/supabase';
import { DatabaseJournalEntry, DatabaseAIInsight } from '../config/supabase';

export interface MoodTrend {
  date: string;
  averageMood: number;
  entryCount: number;
}

export interface WordCloudData {
  word: string;
  frequency: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface WritingPattern {
  dayOfWeek: string;
  entryCount: number;
  averageWordCount: number;
  preferredTime: string;
}

export interface EmotionalInsight {
  emotion: string;
  frequency: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  contexts: string[];
}

export interface AdvancedAnalytics {
  moodTrends: MoodTrend[];
  wordCloud: WordCloudData[];
  writingPatterns: WritingPattern[];
  emotionalInsights: EmotionalInsight[];
  streakAnalysis: {
    currentStreak: number;
    longestStreak: number;
    averageGapBetweenEntries: number;
    consistency: number; // 0-1 score
  };
  contentAnalysis: {
    totalWords: number;
    averageWordsPerEntry: number;
    mostProductiveDay: string;
    topTopics: string[];
    readingTime: number; // minutes
  };
  growthMetrics: {
    reflectionDepth: number; // 0-1 score
    selfAwarenessGrowth: number; // trend
    problemSolvingProgress: number; // trend
    emotionalRegulation: number; // trend
  };
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'pdf' | 'txt';
  dateRange: {
    start: Date;
    end: Date;
  };
  includeInsights: boolean;
  includeAnalytics: boolean;
  includeImages: boolean;
}

export class AnalyticsService {
  static async generateAdvancedAnalytics(
    userId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<{ analytics: AdvancedAnalytics; error?: any }> {
    try {
      console.log('Generating advanced analytics for user:', userId);

      // Set default date range if not provided (last 90 days)
      const endDate = dateRange?.end || new Date();
      const startDate = dateRange?.start || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      // Fetch user's streak from users table (authoritative source)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('streak_count')
        .eq('id', userId)
        .maybeSingle();

      const currentStreak = userData?.streak_count || 0;

      // Fetch journal entries and insights
      const { data: entries, error: entriesError } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      if (entriesError) {
        throw entriesError;
      }

      const { data: insights, error: insightsError } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (insightsError) {
        throw insightsError;
      }

      // Generate analytics
      const analytics: AdvancedAnalytics = {
        moodTrends: this.generateMoodTrends(entries || []),
        wordCloud: this.generateWordCloud(entries || []),
        writingPatterns: this.generateWritingPatterns(entries || []),
        emotionalInsights: this.generateEmotionalInsights(entries || [], insights || []),
        streakAnalysis: this.generateStreakAnalysis(entries || [], currentStreak),
        contentAnalysis: this.generateContentAnalysis(entries || []),
        growthMetrics: this.generateGrowthMetrics(entries || [], insights || []),
      };

      return { analytics };
    } catch (error) {
      console.error('Error generating advanced analytics:', error);
      return { analytics: this.getEmptyAnalytics(), error };
    }
  }

  private static generateMoodTrends(entries: DatabaseJournalEntry[]): MoodTrend[] {
    const dailyMoods = new Map<string, { total: number; count: number }>();

    entries.forEach(entry => {
      if (entry.mood_rating) {
        const date = new Date(entry.created_at).toISOString().split('T')[0];
        const existing = dailyMoods.get(date) || { total: 0, count: 0 };
        dailyMoods.set(date, {
          total: existing.total + entry.mood_rating,
          count: existing.count + 1,
        });
      }
    });

    return Array.from(dailyMoods.entries()).map(([date, data]) => ({
      date,
      averageMood: data.total / data.count,
      entryCount: data.count,
    }));
  }

  private static generateWordCloud(entries: DatabaseJournalEntry[]): WordCloudData[] {
    const wordFreq = new Map<string, number>();
    const stopWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'have',
      'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
      'may', 'might', 'must', 'can', 'a', 'an', 'this', 'that', 'these',
      'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him',
      'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their'
    ]);

    entries.forEach(entry => {
      const words = entry.content
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !stopWords.has(word));

      words.forEach(word => {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      });
    });

    return Array.from(wordFreq.entries())
      .map(([word, frequency]) => ({
        word,
        frequency,
        sentiment: this.analyzeSentiment(word),
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 50); // Top 50 words
  }

  private static generateWritingPatterns(entries: DatabaseJournalEntry[]): WritingPattern[] {
    const patterns = new Map<string, { count: number; totalWords: number; times: number[] }>();

    entries.forEach(entry => {
      const date = new Date(entry.created_at);
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      const hour = date.getHours();
      const wordCount = entry.word_count || entry.content.split(' ').length;

      const existing = patterns.get(dayOfWeek) || { count: 0, totalWords: 0, times: [] };
      patterns.set(dayOfWeek, {
        count: existing.count + 1,
        totalWords: existing.totalWords + wordCount,
        times: [...existing.times, hour],
      });
    });

    return Array.from(patterns.entries()).map(([dayOfWeek, data]) => ({
      dayOfWeek,
      entryCount: data.count,
      averageWordCount: data.totalWords / data.count,
      preferredTime: this.getMostFrequentTime(data.times),
    }));
  }

  private static generateEmotionalInsights(
    entries: DatabaseJournalEntry[],
    insights: DatabaseAIInsight[]
  ): EmotionalInsight[] {
    // This is a simplified version - in a real implementation,
    // you'd use NLP libraries or AI services for emotion detection
    const emotions = [
      'joy', 'gratitude', 'excitement', 'peace', 'love',
      'anxiety', 'stress', 'sadness', 'frustration', 'anger',
      'confusion', 'hope', 'confidence', 'curiosity', 'determination'
    ];

    return emotions.map(emotion => ({
      emotion,
      frequency: Math.floor(Math.random() * 20), // Mock data
      trend: ['increasing', 'decreasing', 'stable'][Math.floor(Math.random() * 3)] as any,
      contexts: ['work', 'relationships', 'personal growth'].slice(0, Math.floor(Math.random() * 3) + 1),
    }));
  }

  private static generateStreakAnalysis(
    entries: DatabaseJournalEntry[],
    currentStreak: number
  ) {
    if (entries.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        averageGapBetweenEntries: 0,
        consistency: 0,
      };
    }

    // Extract unique dates (use UTC date strings to avoid timezone issues)
    const uniqueDates = Array.from(
      new Set(entries.map(entry => entry.created_at.split('T')[0]))
    ).sort();

    let longestStreak = 0;
    let tempStreak = 1;

    // Calculate longest streak by checking consecutive dates
    for (let i = 1; i < uniqueDates.length; i++) {
      const prevDate = new Date(uniqueDates[i - 1] + 'T00:00:00Z');
      const currDate = new Date(uniqueDates[i] + 'T00:00:00Z');
      const dayDiff = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

      if (dayDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    // Average gap and consistency
    const totalDays = uniqueDates.length;
    const firstDate = new Date(uniqueDates[0] + 'T00:00:00Z');
    const lastDate = new Date(uniqueDates[uniqueDates.length - 1] + 'T00:00:00Z');
    const dateRange = Math.round((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
    const averageGapBetweenEntries = totalDays > 1 ? dateRange / (totalDays - 1) : 0;
    const consistency = Math.min(1, totalDays / (dateRange + 1));

    return {
      currentStreak, // Use authoritative streak from users table
      longestStreak,
      averageGapBetweenEntries,
      consistency,
    };
  }

  private static generateContentAnalysis(entries: DatabaseJournalEntry[]) {
    const totalWords = entries.reduce((sum, entry) =>
      sum + (entry.word_count || entry.content.split(' ').length), 0
    );

    const averageWordsPerEntry = entries.length > 0 ? totalWords / entries.length : 0;

    // Group by day of week to find most productive day
    const dayWordCounts = new Map<string, number>();
    entries.forEach(entry => {
      const dayOfWeek = new Date(entry.created_at).toLocaleDateString('en-US', { weekday: 'long' });
      const wordCount = entry.word_count || entry.content.split(' ').length;
      dayWordCounts.set(dayOfWeek, (dayWordCounts.get(dayOfWeek) || 0) + wordCount);
    });

    const mostProductiveDay = Array.from(dayWordCounts.entries())
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

    // Estimate reading time (average 200 words per minute)
    const readingTime = totalWords / 200;

    return {
      totalWords,
      averageWordsPerEntry,
      mostProductiveDay,
      topTopics: ['personal growth', 'work', 'relationships', 'health'], // Mock data
      readingTime,
    };
  }

  private static generateGrowthMetrics(
    entries: DatabaseJournalEntry[],
    insights: DatabaseAIInsight[]
  ) {
    // These would typically be calculated using NLP analysis
    // For now, we'll use mock calculations based on entry patterns

    const reflectionDepth = Math.min(1, entries.length / 30); // Deeper with more entries
    const selfAwarenessGrowth = 0.15; // 15% growth trend
    const problemSolvingProgress = 0.08; // 8% improvement
    const emotionalRegulation = 0.12; // 12% improvement

    return {
      reflectionDepth,
      selfAwarenessGrowth,
      problemSolvingProgress,
      emotionalRegulation,
    };
  }

  private static analyzeSentiment(word: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['happy', 'grateful', 'excited', 'love', 'joy', 'amazing', 'wonderful', 'great'];
    const negativeWords = ['sad', 'angry', 'frustrated', 'worried', 'stressed', 'anxious', 'difficult'];

    if (positiveWords.includes(word.toLowerCase())) return 'positive';
    if (negativeWords.includes(word.toLowerCase())) return 'negative';
    return 'neutral';
  }

  private static getMostFrequentTime(times: number[]): string {
    if (times.length === 0) return 'N/A';

    const timeRanges = {
      'Morning (6-12)': times.filter(t => t >= 6 && t < 12).length,
      'Afternoon (12-17)': times.filter(t => t >= 12 && t < 17).length,
      'Evening (17-22)': times.filter(t => t >= 17 && t < 22).length,
      'Night (22-6)': times.filter(t => t >= 22 || t < 6).length,
    };

    return Object.entries(timeRanges)
      .sort(([,a], [,b]) => b - a)[0][0];
  }

  private static getEmptyAnalytics(): AdvancedAnalytics {
    return {
      moodTrends: [],
      wordCloud: [],
      writingPatterns: [],
      emotionalInsights: [],
      streakAnalysis: {
        currentStreak: 0,
        longestStreak: 0,
        averageGapBetweenEntries: 0,
        consistency: 0,
      },
      contentAnalysis: {
        totalWords: 0,
        averageWordsPerEntry: 0,
        mostProductiveDay: 'N/A',
        topTopics: [],
        readingTime: 0,
      },
      growthMetrics: {
        reflectionDepth: 0,
        selfAwarenessGrowth: 0,
        problemSolvingProgress: 0,
        emotionalRegulation: 0,
      },
    };
  }

  static async exportData(
    userId: string,
    options: ExportOptions
  ): Promise<{ data: string; filename: string; error?: any }> {
    try {
      console.log('Exporting data for user:', userId, 'with options:', options);

      // Fetch data within date range
      const { data: entries, error: entriesError } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', options.dateRange.start.toISOString())
        .lte('created_at', options.dateRange.end.toISOString())
        .order('created_at', { ascending: true });

      if (entriesError) {
        throw entriesError;
      }

      let insights: DatabaseAIInsight[] = [];
      if (options.includeInsights) {
        const { data: insightData, error: insightsError } = await supabase
          .from('ai_insights')
          .select('*')
          .eq('user_id', userId)
          .gte('created_at', options.dateRange.start.toISOString())
          .lte('created_at', options.dateRange.end.toISOString());

        if (insightsError) {
          console.warn('Error fetching insights for export:', insightsError);
        } else {
          insights = insightData || [];
        }
      }

      let analytics: AdvancedAnalytics | null = null;
      if (options.includeAnalytics) {
        const { analytics: analyticsData } = await this.generateAdvancedAnalytics(
          userId,
          options.dateRange
        );
        analytics = analyticsData;
      }

      // Format data based on export format
      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          dateRange: options.dateRange,
          totalEntries: entries?.length || 0,
          totalInsights: insights.length,
        },
        journalEntries: entries || [],
        ...(options.includeInsights && { aiInsights: insights }),
        ...(options.includeAnalytics && { analytics }),
      };

      const filename = this.generateFilename(options.format, options.dateRange);

      switch (options.format) {
        case 'json':
          return {
            data: JSON.stringify(exportData, null, 2),
            filename,
          };

        case 'csv':
          return {
            data: this.convertToCSV(exportData),
            filename,
          };

        case 'txt':
          return {
            data: this.convertToTXT(exportData),
            filename,
          };

        case 'pdf':
          // In a real implementation, you'd use a PDF library like react-native-pdf
          return {
            data: 'PDF export not yet implemented',
            filename,
          };

        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      return {
        data: '',
        filename: '',
        error,
      };
    }
  }

  private static generateFilename(format: string, dateRange: { start: Date; end: Date }): string {
    const startDate = dateRange.start.toISOString().split('T')[0];
    const endDate = dateRange.end.toISOString().split('T')[0];
    return `journal_export_${startDate}_to_${endDate}.${format}`;
  }

  private static convertToCSV(data: any): string {
    const entries = data.journalEntries;
    const headers = ['Date', 'Content', 'Mood Rating', 'Word Count'];

    let csv = headers.join(',') + '\n';

    entries.forEach((entry: DatabaseJournalEntry) => {
      const row = [
        new Date(entry.created_at).toLocaleDateString(),
        `"${entry.content.replace(/"/g, '""')}"`, // Escape quotes
        entry.mood_rating || '',
        entry.word_count || entry.content.split(' ').length
      ];
      csv += row.join(',') + '\n';
    });

    return csv;
  }

  private static convertToTXT(data: any): string {
    let txt = `Journal Export\n`;
    txt += `Export Date: ${new Date(data.metadata.exportDate).toLocaleDateString()}\n`;
    txt += `Total Entries: ${data.metadata.totalEntries}\n\n`;
    txt += '='.repeat(50) + '\n\n';

    data.journalEntries.forEach((entry: DatabaseJournalEntry, index: number) => {
      txt += `Entry ${index + 1}\n`;
      txt += `Date: ${new Date(entry.created_at).toLocaleDateString()}\n`;
      if (entry.mood_rating) {
        txt += `Mood: ${entry.mood_rating}/5\n`;
      }
      txt += `\n${entry.content}\n\n`;
      txt += '-'.repeat(30) + '\n\n';
    });

    return txt;
  }
}

export default AnalyticsService;