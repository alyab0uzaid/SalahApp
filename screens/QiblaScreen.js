import React, { useState } from 'react';
import { StyleSheet, View, Text, Switch } from 'react-native';
import { Animated } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import QiblaCompass from '../components/QiblaCompass';
import { COLORS, FONTS, SPACING, ICON_SIZES } from '../constants/theme';

export default function QiblaScreen({ qiblaBgOpacity, onBackgroundChange, locationName }) {
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const backgroundColor = qiblaBgOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.background.primary, 'rgb(49, 199, 86)'],
  });

  const toggleVibration = () => {
    setVibrationEnabled(!vibrationEnabled);
  };

  return (
    <Animated.View style={[styles.container, { backgroundColor }]}>
      {/* Location header */}
      <View style={[styles.locationHeader, { top: insets.top + SPACING.lg }]}>
        <View style={styles.leftSection}>
          <View style={styles.locationSubheader}>
            <Text style={styles.locationSubheaderText}>Location</Text>
            <FontAwesome
              name="location-arrow"
              size={ICON_SIZES.sm}
              color="rgba(255, 255, 255, 0.69)"
            />
          </View>
          {locationName ? (
            <Text style={styles.locationName}>{locationName}</Text>
          ) : (
            <Text style={styles.locationName}>Loading...</Text>
          )}
        </View>
        
        <View style={styles.vibrationContainer}>
          <Text style={styles.vibrationLabel}>Haptic Feedback</Text>
          <View style={styles.switchContainer}>
            <Switch
              value={vibrationEnabled}
              onValueChange={toggleVibration}
              trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: 'rgba(255, 255, 255, 0.4)' }}
              thumbColor={vibrationEnabled ? COLORS.text.primary : 'rgba(255, 255, 255, 0.5)'}
            />
          </View>
        </View>
      </View>
      
      <QiblaCompass onBackgroundChange={onBackgroundChange} locationName={locationName} isScreenFocused={isFocused} vibrationEnabled={vibrationEnabled} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  locationHeader: {
    position: 'absolute',
    left: SPACING.lg,
    right: SPACING.lg,
    zIndex: 1000,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftSection: {
    flex: 1,
  },
  locationSubheader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  locationSubheaderText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.weights.medium.primary,
    color: 'rgba(255, 255, 255, 0.69)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginRight: SPACING.xs,
  },
  locationName: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.weights.bold.primary,
    color: COLORS.text.primary,
  },
  vibrationContainer: {
    alignItems: 'flex-end',
  },
  vibrationLabel: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.weights.medium.primary,
    color: 'rgba(255, 255, 255, 0.69)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
    textAlign: 'right',
  },
  switchContainer: {
    alignItems: 'flex-end',
  },
});
