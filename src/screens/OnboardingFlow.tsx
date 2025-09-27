import React, { useState } from 'react';
import { WelcomeScreen } from './WelcomeScreen';
import { SignUpScreen } from './SignUpScreen';
import { OnboardingPreferencesScreen, OnboardingPreferences } from './OnboardingPreferencesScreen';
import { OnboardingFirstEntryScreen } from './OnboardingFirstEntryScreen';

interface OnboardingFlowProps {
  onComplete: () => void;
}

type OnboardingStep = 'welcome' | 'signup' | 'signin' | 'preferences' | 'first-entry';

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [userPreferences, setUserPreferences] = useState<OnboardingPreferences | null>(null);

  const handleWelcomeGetStarted = () => {
    setCurrentStep('signup');
  };

  const handleWelcomeSignIn = () => {
    setCurrentStep('signin');
  };

  const handleSignUpSuccess = () => {
    setCurrentStep('preferences');
  };

  const handleSignUpToSignIn = () => {
    setCurrentStep('signin');
  };

  const handleBackToWelcome = () => {
    setCurrentStep('welcome');
  };

  const handlePreferencesComplete = (preferences: OnboardingPreferences) => {
    setUserPreferences(preferences);
    setCurrentStep('first-entry');
  };

  const handleFirstEntryComplete = () => {
    onComplete();
  };

  // Render the appropriate screen based on current step
  switch (currentStep) {
    case 'welcome':
      return (
        <WelcomeScreen
          onGetStarted={handleWelcomeGetStarted}
          onSignIn={handleWelcomeSignIn}
        />
      );

    case 'signup':
      return (
        <SignUpScreen
          onSuccess={handleSignUpSuccess}
          onSignInInstead={handleSignUpToSignIn}
          onBack={handleBackToWelcome}
        />
      );

    case 'signin':
      // For now, redirect back to welcome - in real app this would be a sign-in screen
      return (
        <WelcomeScreen
          onGetStarted={handleWelcomeGetStarted}
          onSignIn={handleWelcomeSignIn}
        />
      );

    case 'preferences':
      return (
        <OnboardingPreferencesScreen
          onComplete={handlePreferencesComplete}
        />
      );

    case 'first-entry':
      if (!userPreferences) {
        // Fallback - shouldn't happen in normal flow
        setCurrentStep('preferences');
        return null;
      }
      return (
        <OnboardingFirstEntryScreen
          userPreferences={userPreferences}
          onComplete={handleFirstEntryComplete}
        />
      );

    default:
      return (
        <WelcomeScreen
          onGetStarted={handleWelcomeGetStarted}
          onSignIn={handleWelcomeSignIn}
        />
      );
  }
};