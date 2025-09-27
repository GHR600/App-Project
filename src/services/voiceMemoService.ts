import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { Alert, Platform } from 'react-native';

export interface VoiceMemo {
  id: string;
  uri: string;
  duration: number;
  createdAt: string;
  transcription?: string;
}

export interface VoiceRecordingOptions {
  quality: 'low' | 'medium' | 'high';
  maxDuration?: number; // in milliseconds
}

export class VoiceMemoService {
  private static recording: Audio.Recording | null = null;
  private static isInitialized = false;

  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Request audio permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Audio recording permission not granted');
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });

      this.isInitialized = true;
      console.log('Voice memo service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize voice memo service:', error);
      throw error;
    }
  }

  static async startRecording(options: VoiceRecordingOptions = { quality: 'medium' }): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (this.recording) {
        throw new Error('Recording already in progress');
      }

      console.log('Starting voice recording...');

      const recordingOptions = this.getRecordingOptions(options.quality);
      this.recording = new Audio.Recording();

      await this.recording.prepareToRecordAsync(recordingOptions);
      await this.recording.startAsync();

      // Set up max duration if specified
      if (options.maxDuration) {
        setTimeout(async () => {
          if (this.recording) {
            await this.stopRecording();
            Alert.alert('Recording Stopped', 'Maximum recording duration reached');
          }
        }, options.maxDuration);
      }

      console.log('Voice recording started successfully');
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.recording = null;
      throw error;
    }
  }

  static async stopRecording(): Promise<VoiceMemo | null> {
    try {
      if (!this.recording) {
        throw new Error('No recording in progress');
      }

      console.log('Stopping voice recording...');

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      const status = await this.recording.getStatusAsync();

      this.recording = null;

      if (!uri) {
        throw new Error('Failed to get recording URI');
      }

      const voiceMemo: VoiceMemo = {
        id: `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        uri,
        duration: status.durationMillis || 0,
        createdAt: new Date().toISOString(),
      };

      console.log('Voice recording stopped successfully:', voiceMemo);
      return voiceMemo;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      this.recording = null;
      return null;
    }
  }

  static async pauseRecording(): Promise<void> {
    try {
      if (!this.recording) {
        throw new Error('No recording in progress');
      }

      await this.recording.pauseAsync();
      console.log('Recording paused');
    } catch (error) {
      console.error('Failed to pause recording:', error);
      throw error;
    }
  }

  static async resumeRecording(): Promise<void> {
    try {
      if (!this.recording) {
        throw new Error('No recording in progress');
      }

      await this.recording.startAsync();
      console.log('Recording resumed');
    } catch (error) {
      console.error('Failed to resume recording:', error);
      throw error;
    }
  }

  static async playVoiceMemo(voiceMemo: VoiceMemo): Promise<Audio.Sound> {
    try {
      console.log('Playing voice memo:', voiceMemo.id);

      const { sound } = await Audio.Sound.createAsync(
        { uri: voiceMemo.uri },
        { shouldPlay: true }
      );

      return sound;
    } catch (error) {
      console.error('Failed to play voice memo:', error);
      throw error;
    }
  }

  static async transcribeAudio(voiceMemo: VoiceMemo): Promise<string> {
    // This is a mock implementation
    // In a real app, you would integrate with services like:
    // - Google Speech-to-Text
    // - Azure Speech Services
    // - AWS Transcribe
    // - OpenAI Whisper API

    try {
      console.log('Transcribing audio (mock):', voiceMemo.id);

      // Mock transcription based on duration
      const durationSeconds = voiceMemo.duration / 1000;

      if (durationSeconds < 5) {
        return "This is a brief voice note about my day.";
      } else if (durationSeconds < 30) {
        return "Today was an interesting day. I had some challenges but also some good moments. I'm feeling grateful for the people in my life.";
      } else {
        return "I've been reflecting on my goals and where I want to be in the future. There are some areas where I want to grow and improve. I think journaling is helping me become more self-aware and intentional about my choices. I'm looking forward to seeing how this practice develops over time.";
      }
    } catch (error) {
      console.error('Failed to transcribe audio:', error);
      return "Transcription failed. Please try again.";
    }
  }

  static async readTextAloud(text: string, options: {
    rate?: number;
    pitch?: number;
    language?: string;
  } = {}): Promise<void> {
    try {
      const speakOptions = {
        rate: options.rate || 0.75,
        pitch: options.pitch || 1.0,
        language: options.language || 'en-US',
      };

      await Speech.speak(text, speakOptions);
      console.log('Text-to-speech started');
    } catch (error) {
      console.error('Failed to read text aloud:', error);
      throw error;
    }
  }

  static async stopSpeaking(): Promise<void> {
    try {
      await Speech.stop();
      console.log('Text-to-speech stopped');
    } catch (error) {
      console.error('Failed to stop speaking:', error);
      throw error;
    }
  }

  static isRecording(): boolean {
    return this.recording !== null;
  }

  static async getRecordingStatus(): Promise<Audio.RecordingStatus | null> {
    if (!this.recording) return null;

    try {
      return await this.recording.getStatusAsync();
    } catch (error) {
      console.error('Failed to get recording status:', error);
      return null;
    }
  }

  private static getRecordingOptions(quality: 'low' | 'medium' | 'high'): Audio.RecordingOptions {
    const baseOptions = {
      android: {
        extension: '.m4a',
        outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
        audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
        numberOfChannels: 1,
        bitRate: 128000,
      },
      ios: {
        extension: '.m4a',
        outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
        audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
        numberOfChannels: 1,
        bitRate: 128000,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
    };

    switch (quality) {
      case 'low':
        return {
          ...baseOptions,
          android: {
            ...baseOptions.android,
            sampleRate: 8000,
            bitRate: 64000,
          },
          ios: {
            ...baseOptions.ios,
            sampleRate: 8000,
            bitRate: 64000,
          },
        };
      case 'high':
        return {
          ...baseOptions,
          android: {
            ...baseOptions.android,
            sampleRate: 44100,
            bitRate: 256000,
          },
          ios: {
            ...baseOptions.ios,
            sampleRate: 44100,
            bitRate: 256000,
          },
        };
      default: // medium
        return {
          ...baseOptions,
          android: {
            ...baseOptions.android,
            sampleRate: 22050,
            bitRate: 128000,
          },
          ios: {
            ...baseOptions.ios,
            sampleRate: 22050,
            bitRate: 128000,
          },
        };
    }
  }
}

export default VoiceMemoService;