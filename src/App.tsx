import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  BackHandler
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { useAndroidBackHandler } from './hooks/useAndroidBackHandler';
import { initializeRevenueCat, loginRevenueCat, logoutRevenueCat } from './services/subscriptionService';
import { SubscriptionPaywallScreen } from './screens/SubscriptionPaywallScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { JournalEntryScreen } from './screens/JournalEntryScreen';
import { DashboardHomeScreen } from './screens/DashboardHomeScreen';
import { EntryDetailScreen } from './screens/EntryDetailScreen';
import { DayDetailScreen } from './screens/DayDetailScreen';
import { SignUpScreen } from './screens/SignUpScreen';
import { SignInScreen } from './screens/SignInScreen';
import { CalendarScreen } from './screens/CalendarScreen';
import { StatsScreen } from './screens/StatsScreen';
import { NotesScreen } from './screens/NotesScreen';
import { AccountScreen } from './screens/AccountScreen';
import { DatabaseJournalEntry } from './config/supabase';
import { BottomNavigation } from './components/BottomNavigation';
import { SideMenu } from './components/SideMenu';

const MainApp: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [selectedEntry, setSelectedEntry] = useState<DatabaseJournalEntry | null>(null);
  const [activeTab, setActiveTab] = useState<'calendar' | 'home' | 'stats'>('home');
  const [menuVisible, setMenuVisible] = useState(false);
  const [journalEntryParams, setJournalEntryParams] = useState<any>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const { user, loading } = useAuth();
  const { theme, isDark } = useTheme();

  // Initialize RevenueCat when app mounts
  useEffect(() => {
    const initRevenueCat = async () => {
      try {
        await initializeRevenueCat();
        console.log('RevenueCat initialized');
      } catch (error) {
        console.error('RevenueCat initialization failed:', error);
      }
    };

    initRevenueCat();
  }, []);

  // Log in/out RevenueCat user when auth changes
  useEffect(() => {
    const handleRevenueCatAuth = async () => {
      if (user) {
        try {
          await loginRevenueCat(user.id);
        } catch (error) {
          console.error('RevenueCat login failed:', error);
        }
      } else {
        try {
          await logoutRevenueCat();
        } catch (error) {
          console.error('RevenueCat logout failed:', error);
        }
      }
    };

    handleRevenueCatAuth();
  }, [user]);

  // Check if user needs onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) {
        setCheckingOnboarding(false);
        return;
      }

      try {
        const { supabase } = await import('./config/supabase');
        const { data, error } = await supabase
          .from('users')
          .select('ai_style')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking onboarding status:', error);
          setNeedsOnboarding(false);
        } else {
          // If ai_style is null or undefined, user needs onboarding
          setNeedsOnboarding(!data?.ai_style);
        }
      } catch (error) {
        console.error('Error in onboarding check:', error);
        setNeedsOnboarding(false);
      } finally {
        setCheckingOnboarding(false);
      }
    };

    checkOnboardingStatus();
  }, [user]);

  // Android back button handler
  const handleAndroidBack = useCallback(() => {
    // Handle navigation stack
    if (currentScreen === 'journal' || currentScreen === 'settings' ||
        currentScreen === 'calendar' || currentScreen === 'stats' ||
        currentScreen === 'notes' || currentScreen === 'account' ||
        currentScreen === 'subscription' || currentScreen === 'entryDetail') {
      // Navigate back to dashboard
      setCurrentScreen('dashboard');
      return true; // Prevent default (exit app)
    } else if (currentScreen === 'dashboard' || currentScreen === 'home') {
      // On dashboard or home, allow exit
      return false; // Allow default (exit app)
    } else if (currentScreen === 'signIn' || currentScreen === 'signUp') {
      // On auth screens, go back to home
      setCurrentScreen('home');
      return true; // Prevent default
    }
    return false; // Allow default
  }, [currentScreen]);

  useAndroidBackHandler(handleAndroidBack);

  const renderHomeScreen = () => (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.primary }]}>📝 Journaling App</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        {user ? `Welcome back, ${user.email}!` : 'Your personal journaling companion'}
      </Text>

      <View style={styles.buttonContainer}>
        {user ? (
          // Authenticated user buttons
          <>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.primary }]}
              onPress={() => setCurrentScreen('dashboard')}
            >
              <Text style={[styles.primaryButtonText, { color: theme.white }]}>📊 Open Dashboard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.primary }]}
              onPress={() => setCurrentScreen('journal')}
            >
              <Text style={[styles.primaryButtonText, { color: theme.white }]}>📝 New Journal Entry</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: theme.primary, backgroundColor: theme.surface }]}
              onPress={() => setCurrentScreen('settings')}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>⚙️ Settings</Text>
            </TouchableOpacity>
          </>
        ) : (
          // Unauthenticated user buttons
          <>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.primary }]}
              onPress={() => setCurrentScreen('signUp')}
            >
              <Text style={[styles.primaryButtonText, { color: theme.white }]}>🚀 Create Free Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: theme.primary, backgroundColor: theme.surface }]}
              onPress={() => setCurrentScreen('signIn')}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>🔑 Sign In</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {!user && (
        <View style={[styles.benefits, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <Text style={[styles.benefitsTitle, { color: theme.textPrimary }]}>What you get for free:</Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>✨</Text>
              <Text style={[styles.benefitText, { color: theme.textSecondary }]}>3 AI-powered insights per month</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>📝</Text>
              <Text style={[styles.benefitText, { color: theme.textSecondary }]}>Unlimited journal entries</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>📊</Text>
              <Text style={[styles.benefitText, { color: theme.textSecondary }]}>Basic mood tracking</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🔒</Text>
              <Text style={[styles.benefitText, { color: theme.textSecondary }]}>Private and secure</Text>
            </View>
          </View>
        </View>
      )}

      <View style={[styles.successBadge, { backgroundColor: theme.success }]}>
        <Text style={[styles.successText, { color: theme.white }]}>✅ Mobile App Ready!</Text>
      </View>
    </View>
  );

  const renderCurrentScreen = () => {
    // Show onboarding if user is authenticated and needs it
    if (user && needsOnboarding && !checkingOnboarding) {
      return (
        <OnboardingScreen
          userId={user.id}
          onComplete={() => {
            setNeedsOnboarding(false);
            setCurrentScreen('dashboard');
          }}
        />
      );
    }

    switch (currentScreen) {
      case 'signUp':
        return (
          <SignUpScreen
            onSuccess={() => {
              setCurrentScreen('dashboard');
            }}
            onSignInInstead={() => setCurrentScreen('signIn')}
            onBack={() => setCurrentScreen('home')}
          />
        );
      case 'signIn':
        return (
          <SignInScreen
            onSuccess={() => {
              setCurrentScreen('dashboard');
            }}
            onSignUpInstead={() => setCurrentScreen('signUp')}
            onBack={() => setCurrentScreen('home')}
          />
        );
      case 'subscription':
        return <SubscriptionPaywallScreen onBack={() => setCurrentScreen('dashboard')} />;
      case 'settings':
        return <SettingsScreen onBack={() => setCurrentScreen('dashboard')} />;
      case 'journal':
        if (!user) {
          setCurrentScreen('signUp');
          return renderHomeScreen();
        }
        const journalParams = journalEntryParams || {};
        return (
          <JournalEntryScreen
            userId={user.id}
            onBack={() => {
              setJournalEntryParams(null);
              const targetScreen = journalParams.fromScreen === 'DayDetail' ? 'dayDetail' : 'dashboard';
              setCurrentScreen(targetScreen);
            }}
            onEntryComplete={(entry, insight) => {
              console.log('Entry completed:', entry, insight);
              setJournalEntryParams(null);
              const targetScreen = journalParams.fromScreen === 'DayDetail' ? 'dayDetail' : 'dashboard';
              setCurrentScreen(targetScreen);
            }}
            onPaywallRequired={() => setCurrentScreen('subscription')}
            mode={journalParams.mode}
            entryId={journalParams.entryId}
            fromScreen={journalParams.fromScreen}
            initialDate={journalParams.initialDate}
          />
        );
      case 'dashboard':
        if (!user) {
          setCurrentScreen('signUp');
          return renderHomeScreen();
        }
        // Mock navigation object for standalone app usage
        const mockNavigation = {
          navigate: (screen: string, params?: any) => {
            if (screen === 'JournalEntry') {
              setCurrentScreen('journal');
              // Store the journal entry params for the journal screen
              if (params) {
                setJournalEntryParams(params);
              }
            }
          },
          goBack: () => setCurrentScreen('dashboard')
        };

        return (
          <DashboardHomeScreen
            userId={user.id}
            onNewEntry={() => setCurrentScreen('journal')}
            onEntryPress={(entry) => {
              setSelectedEntry(entry);
              setCurrentScreen('entryDetail');
            }}
            onBack={() => setCurrentScreen('dashboard')}
            onMenuPress={() => setMenuVisible(true)}
            navigation={mockNavigation}
          />
        );
      case 'entryDetail':
        return selectedEntry && user ? (
          <EntryDetailScreen
            entry={selectedEntry}
            userId={user.id}
            onBack={() => setCurrentScreen('dashboard')}
            onEdit={() => {
              // TODO: Implement entry editing
              console.log('Edit entry:', selectedEntry.id);
            }}
          />
        ) : (
          renderHomeScreen()
        );
      case 'calendar':
        if (!user) {
          setCurrentScreen('signUp');
          return renderHomeScreen();
        }
        return (
          <CalendarScreen
            userId={user.id}
            onBack={() => setCurrentScreen('dashboard')}
            onMenuPress={() => setMenuVisible(true)}
            onDateSelect={(date) => console.log('Date selected:', date)}
            onEntryPress={(entry) => {
              // Navigate to edit the entry
              setJournalEntryParams({
                mode: 'edit',
                entryId: entry.id,
                fromScreen: 'Calendar',
                initialDate: new Date(entry.created_at).toISOString().split('T')[0]
              });
              setCurrentScreen('journal');
            }}
            onNewEntry={(date) => {
              setJournalEntryParams({
                mode: 'create',
                fromScreen: 'Calendar',
                initialDate: date.toISOString().split('T')[0]
              });
              setCurrentScreen('journal');
            }}
          />
        );
      case 'stats':
        if (!user) {
          setCurrentScreen('signUp');
          return renderHomeScreen();
        }
        return <StatsScreen userId={user.id} onBack={() => setCurrentScreen('dashboard')} onMenuPress={() => setMenuVisible(true)} />;
      case 'notes':
        if (!user) {
          setCurrentScreen('signUp');
          return renderHomeScreen();
        }
        return <NotesScreen onBack={() => setCurrentScreen('dashboard')} onMenuPress={() => setMenuVisible(true)} />;
      case 'account':
        if (!user) {
          setCurrentScreen('signUp');
          return renderHomeScreen();
        }
        return <AccountScreen onBack={() => setCurrentScreen('dashboard')} onMenuPress={() => setMenuVisible(true)} />;
      default:
        return renderHomeScreen();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <Text style={[styles.title, { color: theme.primary }]}>📝 Journaling App</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Loading...</Text>
        </View>
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </SafeAreaView>
    );
  }

  const handleTabPress = (tab: 'calendar' | 'home' | 'stats') => {
    setActiveTab(tab);
    if (tab === 'calendar') {
      setCurrentScreen('calendar');
    } else if (tab === 'stats') {
      setCurrentScreen('stats');
    }
  };

  const handleMenuNavigate = (screen: 'account' | 'settings' | 'notes' | 'calendar' | 'stats') => {
    setCurrentScreen(screen);
  };

  const shouldShowBottomNav = user && ['dashboard', 'calendar', 'stats', 'notes', 'account'].includes(currentScreen);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {renderCurrentScreen()}
      {shouldShowBottomNav && (
        <BottomNavigation
          activeTab={activeTab}
          onTabPress={handleTabPress}
          onNewEntry={() => setCurrentScreen('journal')}
        />
      )}
      <SideMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onNavigate={handleMenuNavigate}
      />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </SafeAreaView>
  );
};

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <MainApp />
          </SubscriptionProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 26,
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    maxWidth: 280,
  },
  primaryButton: {
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  successBadge: {
    marginTop: 40,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  successText: {
    fontSize: 16,
    fontWeight: '600',
  },
  benefits: {
    borderRadius: 12,
    padding: 20,
    marginVertical: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  benefitsList: {
    // No special styling needed
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  benefitText: {
    fontSize: 14,
    flex: 1,
  },
});

export default App;
