import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator
} from 'react-native';
import { colors } from '../styles/designSystem';
import { SaveStatus } from '../hooks/useAutoSave';

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  statusText: string;
  style?: any;
}

export const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({
  status,
  statusText,
  style
}) => {
  const getStatusColor = (): string => {
    switch (status) {
      case 'saving':
        return colors.yellow600;
      case 'saved':
        return colors.green600;
      case 'error':
        return colors.red600;
      default:
        return colors.gray500;
    }
  };

  const getStatusIcon = (): React.ReactNode => {
    switch (status) {
      case 'saving':
        return <ActivityIndicator size="small" color={colors.yellow600} />;
      case 'saved':
        return <Text style={[styles.icon, { color: colors.green600 }]}>✓</Text>;
      case 'error':
        return <Text style={[styles.icon, { color: colors.red600 }]}>⚠</Text>;
      default:
        return null;
    }
  };

  if (status === 'idle' && !statusText) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      {getStatusIcon()}
      <Text style={[styles.statusText, { color: getStatusColor() }]}>
        {statusText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.gray50,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  icon: {
    fontSize: 12,
    marginRight: 4,
    fontWeight: 'bold',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
});