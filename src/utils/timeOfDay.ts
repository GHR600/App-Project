export interface TimeOfDayTheme {
  name: 'morning' | 'afternoon' | 'evening';
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    accent: string;
  };
  prompts: {
    intention: string;
    reflection: string;
    gratitude: string;
  };
}

export const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  return 'evening';
};

export const timeOfDayThemes: Record<'morning' | 'afternoon' | 'evening', TimeOfDayTheme> = {
  morning: {
    name: 'morning',
    colors: {
      primary: '#d97706', // Warm amber-600
      secondary: '#fb923c', // Warm orange
      background: '#fffbeb', // Warm cream
      surface: '#fef3c7', // Light amber
      accent: '#b45309', // Deep amber-700
    },
    prompts: {
      intention: "What intentions do you want to set for today?",
      reflection: "How are you feeling as you start this new day?",
      gratitude: "What are you grateful for this morning?",
    },
  },
  afternoon: {
    name: 'afternoon',
    colors: {
      primary: '#2563eb', // Standard blue
      secondary: '#3b82f6', // Bright blue
      background: '#f8fafc', // Neutral gray
      surface: '#e2e8f0', // Light gray
      accent: '#1d4ed8', // Deep blue
    },
    prompts: {
      intention: "How is your day progressing? Any adjustments needed?",
      reflection: "What has been the highlight of your day so far?",
      gratitude: "What small moments brought you joy today?",
    },
  },
  evening: {
    name: 'evening',
    colors: {
      primary: '#d97706', // Metallic amber-600
      secondary: '#f59e0b', // Bright amber-500
      background: '#fffbeb', // Light amber cream
      surface: '#fef3c7', // Soft amber
      accent: '#a16207', // Deep yellow-800
    },
    prompts: {
      intention: "How do you want to wind down tonight?",
      reflection: "What did you learn about yourself today?",
      gratitude: "What are three things you're grateful for from today?",
    },
  },
};

export const getTimeOfDayTheme = (): TimeOfDayTheme => {
  const timeOfDay = getTimeOfDay();
  return timeOfDayThemes[timeOfDay];
};

export const getContextualPrompt = (type: 'intention' | 'reflection' | 'gratitude' = 'reflection'): string => {
  const theme = getTimeOfDayTheme();
  return theme.prompts[type];
};