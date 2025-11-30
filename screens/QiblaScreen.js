import React from 'react';
import { StyleSheet } from 'react-native';
import { Animated } from 'react-native';
import QiblaCompass from '../components/QiblaCompass';
import { COLORS } from '../constants/theme';

export default function QiblaScreen({ qiblaBgOpacity, onBackgroundChange }) {
  const backgroundColor = qiblaBgOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.background.primary, 'rgb(49, 199, 86)'],
  });

  return (
    <Animated.View style={[styles.container, { backgroundColor }]}>
      <QiblaCompass onBackgroundChange={onBackgroundChange} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
