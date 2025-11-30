import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING } from '../constants/theme';

export default function TrackerScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tracker</Text>
      <Text style={styles.text}>Coming Soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background.primary,
    paddingHorizontal: SPACING.lg,
  },
  title: {
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.xxl,
    fontFamily: FONTS.weights.medium.primary,
    marginBottom: SPACING.md,
  },
  text: {
    color: COLORS.text.tertiary,
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.weights.regular.primary,
  },
});
