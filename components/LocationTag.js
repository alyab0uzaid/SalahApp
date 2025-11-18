import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS, FONTS, ICON_SIZES, RADIUS, SPACING } from '../constants/theme';

const LocationTag = ({ locationName, style }) => {
  if (!locationName) return null;

  return (
    <View style={[styles.locationTag, style]}>
      <FontAwesome
        name="location-arrow"
        size={ICON_SIZES.sm}
        color={COLORS.text.tertiary}
      />
      <Text style={styles.locationText}>{locationName}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // No margins - spacing handled by wrapper in App.js
    paddingHorizontal: SPACING.md - 4, // 12px
    paddingVertical: SPACING.xs + 2, // 6px
    backgroundColor: COLORS.background.secondary,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    alignSelf: 'center',
  },
  locationText: {
    color: COLORS.text.tertiary,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.weights.regular.primary,
    marginLeft: SPACING.xs + 2, // 6px
  },
});

export default LocationTag;

