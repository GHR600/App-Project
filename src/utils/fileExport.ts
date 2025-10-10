import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export const saveAndShareFile = async (
  data: string,
  filename: string
): Promise<{ success: boolean; error?: any }> => {
  try {
    if (Platform.OS === 'web') {
      // Web: Trigger download using browser APIs
      // @ts-ignore - Web APIs not available in RN types
      const blob = new Blob([data], {
        type: filename.endsWith('.csv') ? 'text/csv' : 'text/plain'
      });
      // @ts-ignore - Web APIs not available in RN types
      const url = URL.createObjectURL(blob);
      // @ts-ignore - Web APIs not available in RN types
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      // @ts-ignore - Web APIs not available in RN types
      document.body.appendChild(a);
      a.click();
      // @ts-ignore - Web APIs not available in RN types
      document.body.removeChild(a);
      // @ts-ignore - Web APIs not available in RN types
      URL.revokeObjectURL(url);
      return { success: true };
    } else {
      // Mobile: Save and share
      const fileUri = (FileSystem.documentDirectory || '') + filename;
      await FileSystem.writeAsStringAsync(fileUri, data);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: filename.endsWith('.csv') ? 'text/csv' : 'text/plain',
          dialogTitle: 'Export Data',
          UTI: filename.endsWith('.csv') ? 'public.comma-separated-values-text' : 'public.plain-text',
        });
      }

      return { success: true };
    }
  } catch (error) {
    console.error('File export error:', error);
    return { success: false, error };
  }
};
