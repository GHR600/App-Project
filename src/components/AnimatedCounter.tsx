import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleProp, TextStyle } from 'react-native';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  style?: StyleProp<TextStyle>;
  suffix?: string;
  prefix?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 800,
  style,
  suffix = '',
  prefix = '',
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const previousValue = useRef(0);

  useEffect(() => {
    animatedValue.setValue(previousValue.current);

    Animated.timing(animatedValue, {
      toValue: value,
      duration,
      useNativeDriver: false, // Can't use native driver for text interpolation
    }).start();

    previousValue.current = value;
  }, [value]);

  const animatedText = animatedValue.interpolate({
    inputRange: [0, value || 1],
    outputRange: ['0', String(Math.round(value))],
  });

  return (
    <Animated.Text style={style}>
      {prefix}
      <Animated.Text>
        {animatedValue.interpolate({
          inputRange: [0, value || 1],
          outputRange: [0, value],
        }).interpolate((val) => Math.round(val).toString())}
      </Animated.Text>
      {suffix}
    </Animated.Text>
  );
};
