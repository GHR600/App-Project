import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert
} from 'react-native';
import { AnimatedButton } from '../components/AnimatedButton';
import { GradientBackground } from '../components/GradientBackground';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { components } from '../styles/designSystem';
import { useAuth } from '../contexts/AuthContext';

interface SignInScreenProps {
  onSuccess: () => void;
  onSignUpInstead: () => void;
  onBack: () => void;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({
  onSuccess,
  onSignUpInstead,
  onBack
}) => {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { signIn } = useAuth();

  const validateForm = () => {
    if (!email) {
      setError('Email is required');
      return false;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email');
      return false;
    }

    if (!password) {
      setError('Password is required');
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
      const result = await signIn(email, password);

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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <AnimatedButton onPress={onBack} style={styles.backButton} hapticFeedback="light">
            <Text style={[styles.backButtonText, { color: theme.primary }]}>← Back</Text>
          </AnimatedButton>
        </View>

        <View style={styles.content}>
          <View style={styles.hero}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Sign in to continue journaling
            </Text>
          </View>

          <View style={[styles.form, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            {error ? (
              <View style={[styles.errorContainer, { backgroundColor: theme.error + '20', borderColor: theme.error }]}>
                <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Email Address</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={theme.textMuted}
                style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.textPrimary }]}
                editable={!isLoading}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor={theme.textMuted}
                style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.textPrimary }]}
                editable={!isLoading}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <AnimatedButton
              onPress={handleSubmit}
              disabled={isLoading}
              style={styles.submitButton}
              hapticFeedback="medium"
            >
              <GradientBackground
                style={styles.gradientButton}
                colors={isLoading ? [theme.textMuted, theme.textMuted, theme.textMuted] : undefined}
              >
                <Text style={[styles.submitButtonText, { color: theme.white }]}>
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Text>
              </GradientBackground>
            </AnimatedButton>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>
              Don't have an account?{' '}
              <Text onPress={onSignUpInstead} style={[styles.linkText, { color: theme.primary }]}>
                Sign up here
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontSize: 16,
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
  title: {
    fontFamily: 'Yellowtail_400Regular',
    fontSize: 42,
    color: '#eab308',
    lineHeight: 56,
    paddingHorizontal: 8,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  form: {
    borderRadius: components.card.borderRadius,
    borderWidth: 1,
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
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
  },
  submitButton: {
    borderRadius: components.button.borderRadius,
    height: components.button.height,
    overflow: 'hidden',
  },
  gradientButton: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  footerText: {
    fontSize: 16,
    textAlign: 'center',
  },
  linkText: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});