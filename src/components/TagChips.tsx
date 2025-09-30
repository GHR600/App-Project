import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { PRESET_TAGS } from '../types';

interface TagChipsProps {
  tags: string[];
  small?: boolean;
}

export const TagChips: React.FC<TagChipsProps> = ({ tags, small = false }) => {
  const { theme } = useTheme();

  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {tags.map(tagId => {
        const preset = PRESET_TAGS.find(t => t.id === tagId);
        const label = preset?.label || tagId;
        const color = preset?.color || theme.primary;

        return (
          <View
            key={tagId}
            style={[
              styles.chip,
              small && styles.chipSmall,
              {
                backgroundColor: color + '22',
                borderColor: color + '55',
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                small && styles.chipTextSmall,
                { color: color },
              ]}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chipTextSmall: {
    fontSize: 10,
  },
});
