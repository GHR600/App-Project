import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SubscriptionPaywallScreen } from './screens/SubscriptionPaywallScreen';
import { JournalEntryScreen } from './screens/JournalEntryScreen';
import { DashboardHomeScreen } from './screens/DashboardHomeScreen';
import { EntryDetailScreen } from './screens/EntryDetailScreen';
import { DayDetailScreen } from './screens/DayDetailScreen';
import { SignUpScreen } from './screens/SignUpScreen';
import { SignInScreen } from './screens/SignInScreen';
import { DatabaseJournalEntry } from './config/supabase';

const MainApp: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [selectedEntry, setSelectedEntry] = useState<DatabaseJournalEntry | null>(null);
  const { user, loading } = useAuth();

  const renderHomeScreen = () => (
    <View style={styles.container}>
      <Text style={styles.title}>🧠 AI Journaling App</Text>
      <Text style={styles.subtitle}>
        {user ? `Welcome back, ${user.email}!` : 'Your AI-powered journaling companion'}
      </Text>

      <View style={styles.buttonContainer}>
        {user ? (
          // Authenticated user buttons
          <>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setCurrentScreen('dashboard')}
            >
              <Text style={styles.primaryButtonText}>📊 Open Dashboard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setCurrentScreen('journal')}
            >
              <Text style={styles.primaryButtonText}>📝 New Journal Entry</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setCurrentScreen('subscription')}
            >
              <Text style={styles.secondaryButtonText}>💎 View Subscription</Text>
            </TouchableOpacity>
          </>
        ) : (
          // Unauthenticated user buttons
          <>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setCurrentScreen('signUp')}
            >
              <Text style={styles.primaryButtonText}>🚀 Create Free Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setCurrentScreen('signIn')}
            >
              <Text style={styles.secondaryButtonText}>🔑 Sign In</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {!user && (
        <View style={styles.benefits}>
          <Text style={styles.benefitsTitle}>What you get for free:</Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>✨</Text>
              <Text style={styles.benefitText}>3 AI-powered insights per month</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>📝</Text>
              <Text style={styles.benefitText}>Unlimited journal entries</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>📊</Text>
              <Text style={styles.benefitText}>Basic mood tracking</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🔒</Text>
              <Text style={styles.benefitText}>Private and secure</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.successBadge}>
        <Text style={styles.successText}>✅ Mobile App Ready!</Text>
      </View>
    </View>
  );

  const renderCurrentScreen = () => {
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
        return <SubscriptionPaywallScreen onBack={() => setCurrentScreen('home')} />;
      case 'journal':
        if (!user) {
          setCurrentScreen('signUp');
          return renderHomeScreen();
        }
        const journalParams = (window as any).journalEntryParams || {};
        return (
          <JournalEntryScreen
            userId={user.id}
            onBack={() => {
              (window as any).journalEntryParams = null;
              const targetScreen = journalParams.fromScreen === 'DayDetail' ? 'dayDetail' : 'dashboard';
              setCurrentScreen(targetScreen);
            }}
            onEntryComplete={(entry, insight) => {
              console.log('Entry completed:', entry, insight);
              (window as any).journalEntryParams = null;
              const targetScreen = journalParams.fromScreen === 'DayDetail' ? 'dayDetail' : 'dashboard';
              setCurrentScreen(targetScreen);
            }}
            onPaywallRequired={() => setCurrentScreen('subscription')}
            mode={journalParams.mode}
            entryId={journalParams.entryId}
            entryType={journalParams.entryType}
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
                (window as any).journalEntryParams = params;
              }
            } else if (screen === 'DayDetail') {
              // Navigate to day detail screen with proper params
              setCurrentScreen('dayDetail');
              // Store the day data for the day detail screen
              if (params) {
                (window as any).dayDetailParams = params;
              }
            }
          },
          goBack: () => setCurrentScreen('home')
        };

        return (
          <DashboardHomeScreen
            userId={user.id}
            onNewEntry={() => setCurrentScreen('journal')}
            onEntryPress={(entry) => {
              setSelectedEntry(entry);
              setCurrentScreen('entryDetail');
            }}
            onBack={() => setCurrentScreen('home')}
            navigation={mockNavigation}
          />
        );
      case 'dayDetail':
        const dayDetailParams = (window as any).dayDetailParams;
        return dayDetailParams && user ? (
          <DayDetailScreen
            route={{ params: dayDetailParams }}
            navigation={{
              navigate: (screen: string, params?: any) => {
                if (screen === 'JournalEntry') {
                  setCurrentScreen('journal');
                  // Store the journal entry params for the journal screen
                  if (params) {
                    (window as any).journalEntryParams = params;
                  }
                }
              },
              goBack: () => setCurrentScreen('dashboard')
            }}
          />
        ) : (
          renderHomeScreen()
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
      default:
        return renderHomeScreen();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>🧠 AI Journaling App</Text>
          <Text style={styles.subtitle}>Loading...</Text>
        </View>
        <StatusBar style="dark" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {renderCurrentScreen()}
      <StatusBar style="dark" />
    </SafeAreaView>
  );
};

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    color: '#2563eb',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    color: '#6b7280',
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
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderColor: '#2563eb',
    borderWidth: 2,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#2563eb',
    fontSize: 18,
    fontWeight: '600',
  },
  successBadge: {
    marginTop: 40,
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  successText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  benefits: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginVertical: 20,
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
    color: '#374151',
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
    color: '#6b7280',
    flex: 1,
  },
});

export default App;
