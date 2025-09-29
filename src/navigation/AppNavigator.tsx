import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';

// Import screens
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { SignUpScreen } from '../screens/SignUpScreen';
import { SignInScreen } from '../screens/SignInScreen';
import { OnboardingFlow } from '../screens/OnboardingFlow';
import { DashboardHomeScreen } from '../screens/DashboardHomeScreen';
import { JournalEntryScreen } from '../screens/JournalEntryScreen';
import { EntryDetailScreen } from '../screens/EntryDetailScreen';
import { DayDetailScreen } from '../screens/DayDetailScreen';
import { SubscriptionPaywallScreen } from '../screens/SubscriptionPaywallScreen';

// Type definitions for navigation
export type RootStackParamList = {
  Welcome: undefined;
  SignUp: undefined;
  SignIn: undefined;
  Onboarding: undefined;
  Dashboard: undefined;
  JournalEntry: {
    entryId?: string;
    mood?: number;
    prompt?: string;
    mode?: 'create' | 'edit';
    initialDate?: string;
    entryType?: 'journal' | 'note';
    fromScreen?: 'DayDetail' | 'Dashboard';
  };
  EntryDetail: {
    entryId: string;
  };
  DayDetail: {
    date: string;
    dayData: any; // DayCardData type
    userId: string;
  };
  SubscriptionPaywall: {
    source?: 'insights' | 'premium_features';
  };
  Chat: {
    entryId: string;
    journalContext?: string;
  };
};

const Stack = createStackNavigator<RootStackParamList>();

const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      gestureEnabled: true,
      cardStyleInterpolator: ({ current, layouts }) => ({
        cardStyle: {
          transform: [
            {
              translateX: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [layouts.screen.width, 0],
              }),
            },
          ],
        },
      }),
    }}
  >
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="SignUp" component={SignUpScreen} />
    <Stack.Screen name="SignIn" component={SignInScreen} />
    <Stack.Screen name="Onboarding" component={OnboardingFlow} />
  </Stack.Navigator>
);

const MainStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      gestureEnabled: true,
      cardStyleInterpolator: ({ current, layouts }) => ({
        cardStyle: {
          transform: [
            {
              translateX: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [layouts.screen.width, 0],
              }),
            },
          ],
        },
      }),
    }}
  >
    <Stack.Screen name="Dashboard" component={DashboardHomeScreen} />
    <Stack.Screen
      name="DayDetail"
      component={DayDetailScreen}
      options={{
        title: 'Day Entries',
        headerBackTitle: 'Back',
      }}
    />
    <Stack.Screen
      name="JournalEntry"
      component={JournalEntryScreen}
      options={{
        gestureDirection: 'vertical',
        cardStyleInterpolator: ({ current, layouts }) => ({
          cardStyle: {
            transform: [
              {
                translateY: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [layouts.screen.height, 0],
                }),
              },
            ],
          },
        }),
      }}
    />
    <Stack.Screen name="EntryDetail" component={EntryDetailScreen} />
    <Stack.Screen
      name="SubscriptionPaywall"
      component={SubscriptionPaywallScreen}
      options={{
        gestureDirection: 'vertical',
        cardStyleInterpolator: ({ current, layouts }) => ({
          cardStyle: {
            transform: [
              {
                translateY: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [layouts.screen.height, 0],
                }),
              },
            ],
          },
        }),
      }}
    />
  </Stack.Navigator>
);

export const AppNavigator: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Or a loading screen component
  }

  return (
    <NavigationContainer>
      {user ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};