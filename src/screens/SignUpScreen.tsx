import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, components } from '../styles/designSystem';
import { useAuth } from '../contexts/AuthContext';

interface SignUpScreenProps {
  onSuccess: () => void;
  onSignInInstead: () => void;
  onBack: () => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({
  onSuccess,
  onSignInInstead,
  onBack
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { signUp } = useAuth();

  const validateForm = () => {
    if (!email) {
      setError('Email is required');
      return false;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email');
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await signUp(email, password);

      if (result.error) {
        setError(result.error);
      } else {
        onSuccess();
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.hero}>
            <Text style={styles.icon}>📔</Text>
            <Text style={styles.title}>Create Your Account</Text>
            <Text style={styles.subtitle}>
              Join thousands of people improving their mental wellbeing through mindful journaling
            </Text>
          </View>

          <View style={styles.form}>
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                style={styles.input}
                editable={!isLoading}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Create a password (min. 6 characters)"
                style={styles.input}
                editable={!isLoading}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your password"
                style={styles.input}
                editable={!isLoading}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isLoading}
              style={[
                styles.submitButton,
                isLoading ? styles.submitButtonDisabled : {}
              ]}
            >
              <Text style={styles.submitButtonText}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Already have an account?{' '}
              <Text onPress={onSignInInstead} style={styles.linkText}>
                Sign in instead
              </Text>
            </Text>
          </View>

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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray500 || '#f9fafb',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginBottom: 32,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backButtonText: {
    color: colors.primary,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
  },
  content: {
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 32,
  },
  icon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: typography.heading.fontFamily,
    fontWeight: typography.heading.fontWeight as any,
    fontSize: typography.heading.fontSize,
    color: colors.gray900,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    color: colors.gray600,
    lineHeight: 24,
    textAlign: 'center',
  },
  form: {
    backgroundColor: colors.white,
    borderRadius: components.card.borderRadius,
    padding: 32,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  errorContainer: {
    backgroundColor: colors.error + '20',
    borderColor: colors.error,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  errorText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: typography.caption.fontSize,
    color: colors.error,
    fontWeight: 'bold',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.caption.fontSize,
    fontWeight: 'bold',
    color: colors.gray700,
    marginBottom: 8,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderColor: colors.gray300,
    borderWidth: 1,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    color: colors.gray800,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: components.button.borderRadius,
    height: components.button.height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.gray400,
  },
  submitButtonText: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: 'bold',
    color: colors.white,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  footerText: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    color: colors.gray600,
    textAlign: 'center',
  },
  linkText: {
    color: colors.primary,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  benefits: {
    backgroundColor: colors.white,
    borderRadius: components.card.borderRadius,
    padding: 24,
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
    fontFamily: typography.body.fontFamily,
    fontWeight: 'bold',
    fontSize: typography.body.fontSize,
    color: colors.gray900,
    marginBottom: 16,
  },
  benefitsList: {
    // No special styling needed for React Native View
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  benefitText: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.caption.fontSize,
    color: colors.gray700,
    flex: 1,
  },
});