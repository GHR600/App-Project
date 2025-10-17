import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Animated
} from 'react-native';
import { AnimatedButton } from './AnimatedButton';
import { colors } from '../styles/designSystem';
import { VoiceMemoService, VoiceMemo } from '../services/voiceMemoService';

interface VoiceRecorderProps {
  onRecordingComplete: (voiceMemo: VoiceMemo) => void;
  onTranscriptionReady?: (transcription: string) => void;
  maxDuration?: number; // in seconds
  style?: any;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  onTranscriptionReady,
  maxDuration = 300, // 5 minutes default
  style
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pulseAnimation] = useState(new Animated.Value(1));

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1;
          if (newDuration >= maxDuration) {
            handleStopRecording();
          }
          return newDuration;
        });
      }, 1000);

      // Start pulse animation
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
    } else {
      pulseAnimation.setValue(1);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, isPaused, maxDuration, pulseAnimation]);

  const handleStartRecording = async () => {
    try {
      await VoiceMemoService.startRecording({
        quality: 'medium',
        maxDuration: maxDuration * 1000,
      });

      setIsRecording(true);
      setIsPaused(false);
      setRecordingDuration(0);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert(
        'Recording Error',
        'Failed to start recording. Please check your microphone permissions.'
      );
    }
  };

  const handlePauseRecording = async () => {
    try {
      if (isPaused) {
        await VoiceMemoService.resumeRecording();
        setIsPaused(false);
      } else {
        await VoiceMemoService.pauseRecording();
        setIsPaused(true);
      }
    } catch (error) {
      console.error('Failed to pause/resume recording:', error);
      Alert.alert('Error', 'Failed to pause recording');
    }
  };

  const handleStopRecording = async () => {
    try {
      setIsProcessing(true);

      const voiceMemo = await VoiceMemoService.stopRecording();

      if (voiceMemo) {
        setIsRecording(false);
        setIsPaused(false);
        setRecordingDuration(0);

        // Notify parent component
        onRecordingComplete(voiceMemo);

        // Start transcription if requested
        if (onTranscriptionReady) {
          try {
            const transcription = await VoiceMemoService.transcribeAudio(voiceMemo);
            onTranscriptionReady(transcription);
          } catch (error) {
            console.error('Transcription failed:', error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRemainingTime = (): string => {
    const remaining = maxDuration - recordingDuration;
    return formatDuration(remaining);
  };

  if (isProcessing) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.processingContainer}>
          <Text style={styles.processingText}>Processing recording...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {!isRecording ? (
        <AnimatedButton
          style={styles.startButton}
          onPress={handleStartRecording}
          hapticFeedback="medium"
        >
          <Text style={styles.micIcon}>🎤</Text>
          <Text style={styles.startButtonText}>Start Voice Recording</Text>
        </AnimatedButton>
      ) : (
        <View style={styles.recordingContainer}>
          <View style={styles.recordingHeader}>
            <Animated.View
              style={[
                styles.recordingIndicator,
                { transform: [{ scale: pulseAnimation }] }
              ]}
            >
              <Text style={styles.recordingDot}>●</Text>
            </Animated.View>
            <Text style={styles.recordingText}>
              {isPaused ? 'PAUSED' : 'RECORDING'}
            </Text>
          </View>

          <View style={styles.timeContainer}>
            <Text style={styles.currentTime}>
              {formatDuration(recordingDuration)}
            </Text>
            <Text style={styles.remainingTime}>
              {getRemainingTime()} remaining
            </Text>
          </View>

          <View style={styles.controlsContainer}>
            <AnimatedButton
              style={[styles.controlButton, styles.pauseButton]}
              onPress={handlePauseRecording}
              hapticFeedback="light"
            >
              <Text style={styles.controlButtonText}>
                {isPaused ? '▶️' : '⏸️'}
              </Text>
            </AnimatedButton>

            <AnimatedButton
              style={[styles.controlButton, styles.stopButton]}
              onPress={handleStopRecording}
              hapticFeedback="heavy"
            >
              <Text style={styles.controlButtonText}>⏹️</Text>
            </AnimatedButton>
          </View>

          <Text style={styles.instructionText}>
            Tap stop when finished, or pause to take a break
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    minWidth: 200,
  },
  micIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  startButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  recordingContainer: {
    alignItems: 'center',
    width: '100%',
  },
  recordingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  recordingIndicator: {
    marginRight: 8,
  },
  recordingDot: {
    fontSize: 20,
    color: colors.error,
  },
  recordingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.error,
  },
  timeContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  currentTime: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.gray900,
    marginBottom: 4,
  },
  remainingTime: {
    fontSize: 14,
    color: colors.gray600,
  },
  controlsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseButton: {
    backgroundColor: colors.warning,
  },
  stopButton: {
    backgroundColor: colors.error,
  },
  controlButtonText: {
    fontSize: 24,
  },
  instructionText: {
    fontSize: 14,
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: 20,
  },
  processingContainer: {
    paddingVertical: 40,
  },
  processingText: {
    fontSize: 16,
    color: colors.gray600,
    textAlign: 'center',
  },
});