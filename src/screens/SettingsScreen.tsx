import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';

interface SettingsScreenProps {
  onBack: () => void;
}

type AIStyle = 'coach' | 'reflector';

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const { theme, themeMode, setThemeMode } = useTheme();
  const { user } = useAuth();
  const [aiStyle, setAIStyle] = useState<AIStyle>('reflector');
  const [loadingAIStyle, setLoadingAIStyle] = useState(true);
  const [updatingAIStyle, setUpdatingAIStyle] = useState(false);

  const themeOptions = [
    { value: 'light' as const, label: 'Light', icon: '☀️' },
    { value: 'dark' as const, label: 'Dark', icon: '🌙' },
    { value: 'system' as const, label: 'System', icon: '⚙️' },
  ];

  const aiStyleOptions = [
    {
      value: 'coach' as const,
      emoji: '🎯',
      label: 'Coach',
      description: 'Strategic and direct. Helps you spot patterns and take action.',
    },
    {
      value: 'reflector' as const,
      emoji: '🧘',
      label: 'Reflector',
      description: 'Thoughtful and curious. Gives you space to process and think clearly.',
    },
  ];

  // Load user's AI style preference
  useEffect(() => {
    const loadAIStyle = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('users')
          .select('ai_style')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data?.ai_style) {
          setAIStyle(data.ai_style as AIStyle);
        }
      } catch (error) {
        console.error('Error loading AI style:', error);
      } finally {
        setLoadingAIStyle(false);
      }
    };

    loadAIStyle();
  }, [user]);

  const handleAIStyleChange = async (newStyle: AIStyle) => {
    if (!user || updatingAIStyle) return;

    setUpdatingAIStyle(true);
    const previousStyle = aiStyle;

    try {
      // Optimistically update UI
      setAIStyle(newStyle);

      const { error } = await supabase
        .from('users')
        .update({ ai_style: newStyle })
        .eq('id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating AI style:', error);
      // Revert on error
      setAIStyle(previousStyle);
      Alert.alert('Error', 'Failed to update AI style. Please try again.');
    } finally {
      setUpdatingAIStyle(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.backgroundSecondary, borderBottomColor: theme.cardBorder }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: theme.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Settings</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* AI Response Style Section */}
        {user && (
          <View style={[styles.section, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>AI Response Style</Text>
            <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
              Choose how your AI companion responds to your journaling
            </Text>

            {loadingAIStyle ? (
              <ActivityIndicator color={theme.primary} style={{ marginTop: 20 }} />
            ) : (
              <View style={styles.aiStyleOptions}>
                {aiStyleOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => handleAIStyleChange(option.value)}
                    disabled={updatingAIStyle}
                    style={[
                      styles.aiStyleOption,
                      {
                        backgroundColor: aiStyle === option.value ? theme.primary : theme.surface,
                        borderColor: aiStyle === option.value ? theme.primary : theme.cardBorder,
                        opacity: updatingAIStyle ? 0.6 : 1,
                      }
                    ]}
                  >
                    <Text style={styles.aiStyleEmoji}>{option.emoji}</Text>
                    <View style={styles.aiStyleContent}>
                      <Text
                        style={[
                          styles.aiStyleLabel,
                          {
                            color: aiStyle === option.value ? theme.white : theme.textPrimary,
                          }
                        ]}
                      >
                        {option.label}
                      </Text>
                      <Text
                        style={[
                          styles.aiStyleDescription,
                          {
                            color: aiStyle === option.value ? theme.white : theme.textSecondary,
                          }
                        ]}
                      >
                        {option.description}
                      </Text>
                    </View>
                    {aiStyle === option.value && (
                      <Text style={[styles.checkmark, { color: theme.white }]}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Theme Section */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Appearance</Text>
          <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
            Choose how the app looks on your device
          </Text>

          <View style={styles.themeOptions}>
            {themeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => setThemeMode(option.value)}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor: themeMode === option.value ? theme.primary : theme.surface,
                    borderColor: themeMode === option.value ? theme.primary : theme.cardBorder,
                  }
                ]}
              >
                <Text style={styles.themeIcon}>{option.icon}</Text>
                <Text
                  style={[
                    styles.themeLabel,
                    {
                      color: themeMode === option.value ? theme.white : theme.textPrimary,
                    }
                  ]}
                >
                  {option.label}
                </Text>
                {themeMode === option.value && (
                  <Text style={[styles.checkmark, { color: theme.white }]}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {themeMode === 'system' && (
            <View style={[styles.infoBox, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
              <Text style={[styles.infoIcon, { color: theme.info }]}>ℹ️</Text>
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                System theme matches your device's appearance settings
              </Text>
            </View>
          )}
        </View>

        {/* Additional Settings Sections */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>About</Text>
          <View style={styles.settingItem}>
            <Text style={[styles.settingLabel, { color: theme.textSecondary }]}>Version</Text>
            <Text style={[styles.settingValue, { color: theme.textPrimary }]}>1.0.0</Text>
          </View>
          <View style={styles.settingItem}>
            <Text style={[styles.settingLabel, { color: theme.textSecondary }]}>Build</Text>
            <Text style={[styles.settingValue, { color: theme.textPrimary }]}>2024.01</Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Support</Text>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={[styles.settingLabel, { color: theme.textSecondary }]}>Help Center</Text>
            <Text style={[styles.settingValue, { color: theme.primary }]}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={[styles.settingLabel, { color: theme.textSecondary }]}>Privacy Policy</Text>
            <Text style={[styles.settingValue, { color: theme.primary }]}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={[styles.settingLabel, { color: theme.textSecondary }]}>Terms of Service</Text>
            <Text style={[styles.settingValue, { color: theme.primary }]}>→</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    minWidth: 80,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerRight: {
    minWidth: 80,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  themeOptions: {
    flexDirection: 'column',
    gap: 12,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  themeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  themeLabel: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  checkmark: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  settingLabel: {
    fontSize: 15,
  },
  settingValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  aiStyleOptions: {
    flexDirection: 'column',
    gap: 16,
  },
  aiStyleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  aiStyleEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  aiStyleContent: {
    flex: 1,
  },
  aiStyleLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  aiStyleDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});