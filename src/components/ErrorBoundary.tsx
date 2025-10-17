import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Dimensions
} from 'react-native';
import { AnimatedButton } from './AnimatedButton';
import { colors } from '../styles/designSystem';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call the optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error to analytics/crash reporting service
    this.logErrorToService(error, errorInfo);
  }

  private logErrorToService = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      // In a real app, you'd send this to your error reporting service
      // like Sentry, Bugsnag, or Firebase Crashlytics
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: 'React Native App',
        version: '1.0.0', // App version
      };

      console.log('Error report:', errorReport);

      // Example: Send to your backend error reporting endpoint
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorReport),
      // });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  private handleRestart = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleShowDetails = () => {
    const { error, errorInfo } = this.state;
    const details = `Error: ${error?.message}\n\nStack: ${error?.stack}\n\nComponent Stack: ${errorInfo?.componentStack}`;

    Alert.alert(
      'Error Details',
      details,
      [
        { text: 'Copy to Clipboard', onPress: () => {
          // In a real app, you'd copy to clipboard
          console.log('Copied to clipboard:', details);
        }},
        { text: 'Close', style: 'cancel' },
      ]
    );
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>⚠️</Text>
            </View>

            <Text style={styles.title}>Oops! Something went wrong</Text>

            <Text style={styles.message}>
              The app encountered an unexpected error. Don't worry, your data is safe.
            </Text>

            <View style={styles.actions}>
              <AnimatedButton
                style={styles.primaryButton}
                onPress={this.handleRestart}
                hapticFeedback="medium"
              >
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </AnimatedButton>

              <AnimatedButton
                style={styles.secondaryButton}
                onPress={this.handleShowDetails}
                hapticFeedback="light"
              >
                <Text style={styles.secondaryButtonText}>Show Details</Text>
              </AnimatedButton>
            </View>

            <Text style={styles.footer}>
              If this problem persists, please contact support with the error details.
            </Text>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

// Higher-order component wrapper for easier usage
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorHandler?: (error: Error, errorInfo: ErrorInfo) => void
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary onError={errorHandler}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    maxWidth: Dimensions.get('window').width - 40,
    width: '100%',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.red600 + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray900,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  actions: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.gray700,
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    fontSize: 14,
    color: colors.gray500,
    textAlign: 'center',
    lineHeight: 20,
  },
});