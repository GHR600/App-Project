import { useState, useEffect, useRef } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface AutoSaveHookProps {
  onSave: (content: string) => Promise<void>;
  debounceMs?: number;
  showStatusFor?: number; // How long to show 'saved' status in ms
}

export const useAutoSave = ({
  onSave,
  debounceMs = 2000,
  showStatusFor = 2000
}: AutoSaveHookProps) => {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const statusTimeoutRef = useRef<NodeJS.Timeout>();

  const save = async (content: string) => {
    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Clear any pending status reset
    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
    }

    // Set debounced save
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setSaveStatus('saving');
        await onSave(content);
        setSaveStatus('saved');
        setLastSaved(new Date());

        // Reset status after specified time
        statusTimeoutRef.current = setTimeout(() => {
          setSaveStatus('idle');
        }, showStatusFor);
      } catch (error) {
        console.error('Auto-save error:', error);
        setSaveStatus('error');

        // Reset error status after specified time
        statusTimeoutRef.current = setTimeout(() => {
          setSaveStatus('idle');
        }, showStatusFor);
      }
    }, debounceMs);
  };

  const forceSave = async (content: string) => {
    // Clear any pending saves
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    try {
      setSaveStatus('saving');
      await onSave(content);
      setSaveStatus('saved');
      setLastSaved(new Date());

      statusTimeoutRef.current = setTimeout(() => {
        setSaveStatus('idle');
      }, showStatusFor);
    } catch (error) {
      console.error('Force save error:', error);
      setSaveStatus('error');

      statusTimeoutRef.current = setTimeout(() => {
        setSaveStatus('idle');
      }, showStatusFor);
    }
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
    };
  }, []);

  const getSaveStatusText = (): string => {
    switch (saveStatus) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return 'Saved';
      case 'error':
        return 'Save failed';
      default:
        return lastSaved ? `Last saved ${formatLastSaved(lastSaved)}` : '';
    }
  };

  const formatLastSaved = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return 'just now';
    if (diffMinutes === 1) return '1 minute ago';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;

    return date.toLocaleDateString();
  };

  return {
    saveStatus,
    lastSaved,
    save,
    forceSave,
    getSaveStatusText,
  };
};