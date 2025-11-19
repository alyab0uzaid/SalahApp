import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path, Circle } from 'react-native-svg';
import { useQiblaFinder } from 'react-native-qibla-finder/src/hook/useQiblaCompass';
import { COLORS, FONTS, SPACING } from '../constants/theme';

const { width } = Dimensions.get('window');
const COMPASS_SIZE = width * 0.8;

// Fixed circle parameters
const CIRCLE_RADIUS = COMPASS_SIZE * 0.35;
const CIRCLE_CENTER_X = COMPASS_SIZE / 2;
const CIRCLE_CENTER_Y = COMPASS_SIZE / 2;

// Top dot position (fixed at top of circle)
const TOP_DOT_X = CIRCLE_CENTER_X;
const TOP_DOT_Y = CIRCLE_CENTER_Y - CIRCLE_RADIUS;

// Alignment threshold
const ALIGNMENT_THRESHOLD = 15;

export default function QiblaCompass({ onBackgroundChange }) {
  const { rotateKaba, isLoading, errorMsg } = useQiblaFinder();

  // Animated values for smooth transitions - must be before any early returns
  const arcOpacity = useRef(new Animated.Value(1)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;

  // Calculate arrow end dot position (on circle circumference)
  const angleRad = (rotateKaba * Math.PI) / 180;
  const arrowEndX = CIRCLE_CENTER_X + CIRCLE_RADIUS * Math.sin(angleRad);
  const arrowEndY = CIRCLE_CENTER_Y - CIRCLE_RADIUS * Math.cos(angleRad);

  // Calculate arc path from top dot to arrow end dot
  const angleDiff = rotateKaba;
  const largeArcFlag = Math.abs(angleDiff) > 180 ? 1 : 0;
  const sweepFlag = angleDiff >= 0 ? 1 : 0;

  const arcPath = `
    M ${TOP_DOT_X} ${TOP_DOT_Y}
    A ${CIRCLE_RADIUS} ${CIRCLE_RADIUS} 0 ${largeArcFlag} ${sweepFlag} ${arrowEndX} ${arrowEndY}
  `;

  // Normalize angle to check alignment
  // rotateKaba can be 0-360, we want to check if arrow is pointing up (north)
  // When pointing up, rotateKaba should be close to 0 or 360
  let normalizedAngle = rotateKaba % 360;
  if (normalizedAngle < 0) normalizedAngle += 360;

  // Check if within alignment threshold (close to 0 or 360 degrees = pointing up)
  const angleFromNorth = normalizedAngle > 180
    ? 360 - normalizedAngle
    : normalizedAngle;
  const isNearAlignment = angleFromNorth < ALIGNMENT_THRESHOLD;

  // Animate opacity changes when alignment status changes
  useEffect(() => {
    Animated.timing(arcOpacity, {
      toValue: isNearAlignment ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    Animated.timing(bgOpacity, {
      toValue: isNearAlignment ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();

    // Notify parent of background color change
    if (onBackgroundChange) {
      onBackgroundChange(isNearAlignment);
    }
  }, [isNearAlignment, onBackgroundChange]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.text.primary} />
        <Text style={styles.loadingText}>Finding Qibla...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Qibla Direction</Text>

      {/* Compass with fixed circle and dynamic arc */}
      <View style={styles.compassWrapper}>
        <Animated.View style={{ opacity: arcOpacity }}>
          <Svg width={COMPASS_SIZE} height={COMPASS_SIZE} style={styles.svg}>
            {/* Dynamic arc - fades out near alignment */}
            <Path
              d={arcPath}
              fill="none"
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Top dot - fades out near alignment */}
            <Circle
              cx={TOP_DOT_X}
              cy={TOP_DOT_Y}
              r={8}
              fill="#FFFFFF"
            />
          </Svg>
        </Animated.View>

        <Svg width={COMPASS_SIZE} height={COMPASS_SIZE} style={styles.svg}>
          {/* Arrow end dot - always visible */}
          <Circle
            cx={arrowEndX}
            cy={arrowEndY}
            r={10}
            fill="#FFFFFF"
          />
        </Svg>

        {/* Rotating arrow from circle center - always white */}
        <View style={[
          styles.arrowContainer,
          {
            transform: [
              { translateX: -(CIRCLE_RADIUS * 1.8) / 2 },
              { translateY: -(CIRCLE_RADIUS * 1.8) / 2 },
              { rotate: `${rotateKaba}deg` }
            ]
          }
        ]}>
          <MaterialCommunityIcons
            name="arrow-up"
            size={CIRCLE_RADIUS * 1.8}
            color="#FFFFFF"
          />
        </View>
      </View>

      {/* Angle display only */}
      <Text style={styles.angleText}>{Math.round(Math.abs(rotateKaba))}°</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FONTS.weights.bold.primary,
    fontSize: FONTS.sizes.xl,
    color: COLORS.text.primary,
    marginBottom: SPACING.xxl * 2,
  },
  compassWrapper: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    marginBottom: SPACING.xl,
    position: 'relative',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  arrowContainer: {
    position: 'absolute',
    top: COMPASS_SIZE / 2,
    left: COMPASS_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  angleText: {
    fontFamily: FONTS.weights.bold.primary,
    fontSize: FONTS.sizes.xxl,
    color: COLORS.text.primary,
  },
  loadingText: {
    fontFamily: FONTS.weights.regular.primary,
    fontSize: FONTS.sizes.md,
    color: COLORS.text.secondary,
    marginTop: SPACING.md,
  },
  errorText: {
    fontFamily: FONTS.weights.regular.primary,
    fontSize: FONTS.sizes.md,
    color: COLORS.text.tertiary,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
});
