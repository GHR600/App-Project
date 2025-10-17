import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKGROUND_IMAGES } from '../components/BackgroundImage';

interface BackgroundContextType {
  backgroundImage: string | undefined;
  setBackgroundImage: (imageKey: keyof typeof BACKGROUND_IMAGES) => Promise<void>;
  backgroundKey: keyof typeof BACKGROUND_IMAGES;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

const BACKGROUND_KEY = '@app_background_image';

export const BackgroundProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [backgroundKey, setBackgroundKey] = useState<keyof typeof BACKGROUND_IMAGES>('none');
  const [backgroundImage, setBackgroundImageState] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadBackground();
  }, []);

  const loadBackground = async () => {
    try {
      const stored = await AsyncStorage.getItem(BACKGROUND_KEY);
      if (stored && stored in BACKGROUND_IMAGES) {
        const key = stored as keyof typeof BACKGROUND_IMAGES;
        setBackgroundKey(key);
        setBackgroundImageState(BACKGROUND_IMAGES[key]);
      }
    } catch (error) {
      console.error('Error loading background:', error);
    }
  };

  const setBackgroundImage = async (imageKey: keyof typeof BACKGROUND_IMAGES) => {
    try {
      await AsyncStorage.setItem(BACKGROUND_KEY, imageKey);
      setBackgroundKey(imageKey);
      setBackgroundImageState(BACKGROUND_IMAGES[imageKey]);
    } catch (error) {
      console.error('Error saving background:', error);
    }
  };

  return (
    <BackgroundContext.Provider value={{ backgroundImage, setBackgroundImage, backgroundKey }}>
      {children}
    </BackgroundContext.Provider>
  );
};

export const useBackground = () => {
  const context = useContext(BackgroundContext);
  if (!context) {
    throw new Error('useBackground must be used within BackgroundProvider');
  }
  return context;
};
