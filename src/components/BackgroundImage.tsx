import React from 'react';
import { ImageBackground, StyleSheet, View, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

interface BackgroundImageProps {
  imageUri?: string;
  children: React.ReactNode;
  blurIntensity?: number;
  overlayOpacity?: number;
}

export const BackgroundImage: React.FC<BackgroundImageProps> = ({
  imageUri,
  children,
  blurIntensity = 35,
  overlayOpacity = 0.7,
}) => {
  if (!imageUri) {
    return <>{children}</>;
  }

  return (
    <ImageBackground
      source={{ uri: imageUri }}
      style={styles.container}
      blurRadius={blurIntensity}
    >
      {/* Dark gradient overlay for text readability */}
      <LinearGradient
        colors={[
          `rgba(0, 0, 0, ${overlayOpacity})`,
          `rgba(0, 0, 0, ${overlayOpacity * 0.8})`,
          `rgba(0, 0, 0, ${overlayOpacity})`,
        ]}
        style={styles.gradient}
      >
        {children}
      </LinearGradient>
    </ImageBackground>
  );
};

// Preset background images
export const BACKGROUND_IMAGES = {
  nature1: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
  nature2: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
  desert: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800',
  ocean: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800',
  mountains: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
  night: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800',
  forest: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800',
  sunset: 'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?w=800',
  none: undefined,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
  },
});
