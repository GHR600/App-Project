import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
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
      // Mobile: Use new File API to save to cache and share
      // Create a file in the cache directory
      const file = new File(Paths.cache, filename);

      // Write the data to the file
      await file.create();
      await file.write(data);

      // Check if sharing is available
      if (!(await Sharing.isAvailableAsync())) {
        throw new Error('Sharing is not available on this device');
      }

      // Share the file using its URI
      await Sharing.shareAsync(file.uri, {
        mimeType: filename.endsWith('.csv') ? 'text/csv' : 'text/plain',
        dialogTitle: 'Export Data',
        UTI: filename.endsWith('.csv') ? 'public.comma-separated-values-text' : 'public.plain-text',
      });

      return { success: true };
    }
  } catch (error) {
    console.error('File export error:', error);
    return { success: false, error };
  }
};
