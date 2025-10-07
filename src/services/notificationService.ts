import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationSettings {
  dailyReminder: boolean;
  reminderTime: string; // HH:MM format
  streakReminders: boolean;
  insightNotifications: boolean;
  weeklyReflection: boolean;
}

export interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  scheduledTime: Date;
  data?: any;
}

const NOTIFICATION_SETTINGS_KEY = '@notification_settings';
const PUSH_TOKEN_KEY = '@push_token';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationService {
  private static isInitialized = false;
  private static pushToken: string | null = null;

  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        return;
      }

      // Get push token for remote notifications
      if (Device.isDevice) {
        try {
          this.pushToken = await this.fetchPushToken();
          await AsyncStorage.setItem(PUSH_TOKEN_KEY, this.pushToken);
          console.log('Push token obtained:', this.pushToken);
        } catch (error) {
          console.warn('Failed to get push token:', error);
        }
      } else {
        console.warn('Push notifications only work on physical devices');
      }

      // Set up notification response listeners
      this.setupNotificationListeners();

      this.isInitialized = true;
      console.log('Notification service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      throw error;
    }
  }

  private static async fetchPushToken(): Promise<string> {
    if (!Device.isDevice) {
      throw new Error('Must use physical device for push notifications');
    }

    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

      if (!projectId) {
        throw new Error('Project ID not found');
      }

      const token = (await Notifications.getExpoPushTokenAsync({
        projectId,
      })).data;

      return token;
    } catch (error) {
      console.error('Error getting push token:', error);
      throw error;
    }
  }

  private static setupNotificationListeners(): void {
    // Handle notification received while app is in foreground
    Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Handle notification tapped/opened
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);

      const data = response.notification.request.content.data;

      // Handle different notification types
      if (data?.type === 'daily_reminder') {
        // Navigate to journal entry screen
        console.log('Opening journal entry from notification');
      } else if (data?.type === 'streak_reminder') {
        // Navigate to dashboard
        console.log('Opening dashboard from notification');
      } else if (data?.type === 'insight_ready') {
        // Navigate to specific entry
        console.log('Opening entry detail from notification');
      }
    });
  }

  static async getNotificationSettings(): Promise<NotificationSettings> {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }

      // Default settings
      const defaultSettings: NotificationSettings = {
        dailyReminder: true,
        reminderTime: '20:00', // 8 PM
        streakReminders: true,
        insightNotifications: true,
        weeklyReflection: true,
      };

      await this.saveNotificationSettings(defaultSettings);
      return defaultSettings;
    } catch (error) {
      console.error('Error loading notification settings:', error);
      throw error;
    }
  }

  static async saveNotificationSettings(settings: NotificationSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));

      // Reschedule notifications with new settings
      await this.scheduleNotifications(settings);

      console.log('Notification settings saved:', settings);
    } catch (error) {
      console.error('Error saving notification settings:', error);
      throw error;
    }
  }

  static async scheduleNotifications(settings: NotificationSettings): Promise<void> {
    try {
      // Cancel all existing scheduled notifications
      await Notifications.cancelAllScheduledNotificationsAsync();

      const now = new Date();

      // Schedule daily reminder
      if (settings.dailyReminder) {
        const [hours, minutes] = settings.reminderTime.split(':').map(Number);

        await Notifications.scheduleNotificationAsync({
          content: {
            title: '📔 Time to Journal',
            body: 'Take a moment to reflect on your day and capture your thoughts.',
            data: { type: 'daily_reminder' },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: hours,
            minute: minutes,
            repeats: true,
          },
        });

        console.log(`Daily reminder scheduled for ${settings.reminderTime}`);
      }

      // Schedule streak reminders (if user hasn't journaled in 2 days)
      if (settings.streakReminders) {
        const twoDaysFromNow = new Date();
        twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🔥 Keep Your Streak Going!',
            body: "Don't break your journaling streak. Write a quick entry now!",
            data: { type: 'streak_reminder' },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: twoDaysFromNow,
          },
        });
      }

      // Schedule weekly reflection reminder
      if (settings.weeklyReflection) {
        const nextSunday = new Date();
        nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()));
        nextSunday.setHours(19, 0, 0, 0); // 7 PM on Sunday

        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🌟 Weekly Reflection',
            body: 'How was your week? Take some time to reflect on your growth and learnings.',
            data: { type: 'weekly_reflection' },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: nextSunday,
          },
        });

        console.log('Weekly reflection scheduled for next Sunday at 7 PM');
      }
    } catch (error) {
      console.error('Error scheduling notifications:', error);
      throw error;
    }
  }

  static async sendLocalNotification(
    title: string,
    body: string,
    data?: any,
    delay: number = 0
  ): Promise<string> {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger: delay > 0 ? {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: delay,
        } : null,
      });

      console.log('Local notification scheduled:', identifier);
      return identifier;
    } catch (error) {
      console.error('Error sending local notification:', error);
      throw error;
    }
  }

  static async cancelNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
      console.log('Notification cancelled:', identifier);
    } catch (error) {
      console.error('Error cancelling notification:', error);
      throw error;
    }
  }

  static async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  static async clearBadgeCount(): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('Error clearing badge count:', error);
    }
  }

  static async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  static getPushToken(): string | null {
    return this.pushToken;
  }

  static async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  // Predefined notification templates
  static async sendInsightReadyNotification(entryId: string): Promise<void> {
    if (!this.isInitialized) return;

    const settings = await this.getNotificationSettings();
    if (!settings.insightNotifications) return;

    await this.sendLocalNotification(
      '✨ Your AI Insight is Ready!',
      'Discover what your journal entry reveals about your thoughts and feelings.',
      { type: 'insight_ready', entryId },
      5 // 5 second delay
    );
  }

  static async sendStreakCelebration(streakCount: number): Promise<void> {
    if (!this.isInitialized) return;

    const settings = await this.getNotificationSettings();
    if (!settings.streakReminders) return;

    const milestones = [7, 14, 30, 60, 100];
    if (milestones.includes(streakCount)) {
      await this.sendLocalNotification(
        `🎉 ${streakCount} Day Streak!`,
        `Congratulations! You've been journaling for ${streakCount} days straight. Keep it up!`,
        { type: 'streak_celebration', count: streakCount }
      );
    }
  }

  static async sendMotivationalReminder(): Promise<void> {
    if (!this.isInitialized) return;

    const messages = [
      'Your thoughts matter. Take a moment to capture them.',
      'Self-reflection leads to self-improvement. Journal today!',
      'What lessons did today teach you?',
      'Your future self will thank you for journaling today.',
      'Take a pause and check in with yourself.',
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    await this.sendLocalNotification(
      '💭 Moment of Reflection',
      randomMessage,
      { type: 'motivational_reminder' }
    );
  }
}

export default NotificationService;