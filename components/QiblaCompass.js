import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path, Circle } from 'react-native-svg';
import { Magnetometer } from 'expo-sensors';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, SPACING, ICON_SIZES } from '../constants/theme';

const { width, height } = Dimensions.get('window');
const COMPASS_SIZE = width * 0.95; // Increased from 0.8 to 0.95 for bigger compass
// Navbar height calculation
const NAVBAR_HEIGHT = SPACING.sm + ICON_SIZES.lg + SPACING.xs + SPACING.xxxl;

// Fixed circle parameters
const CIRCLE_RADIUS = COMPASS_SIZE * 0.42; // Increased from 0.35 to 0.42 for more space around arrow
const CIRCLE_CENTER_X = COMPASS_SIZE / 2;
const CIRCLE_CENTER_Y = COMPASS_SIZE / 2;

// Top dot position (fixed at top of circle)
const TOP_DOT_X = CIRCLE_CENTER_X;
const TOP_DOT_Y = CIRCLE_CENTER_Y - CIRCLE_RADIUS;

// Alignment threshold
const ALIGNMENT_THRESHOLD = 25;

// Calculate the direction to Qibla from current geographic location
const calculateQibla = (latitude, longitude) => {
  const PI = Math.PI;
  const latk = (21.4225 * PI) / 180.0;
  const longk = (39.8264 * PI) / 180.0;
  const phi = (latitude * PI) / 180.0;
  const lambda = (longitude * PI) / 180.0;
  return (
    (180.0 / PI) *
    Math.atan2(
      Math.sin(longk - lambda),
      Math.cos(phi) * Math.tan(latk) - Math.sin(phi) * Math.cos(longk - lambda)
    )
  );
};

// Get directional text based on the rotation angle
// rotateKaba tells us where the Qibla arrow is pointing relative to phone's top
const getDirectionText = (rotateKaba) => {
  // Normalize angle to 0-360 range
  let normalizedAngle = rotateKaba % 360;
  if (normalizedAngle < 0) normalizedAngle += 360;

  // When arrow points up (0°), you're facing Qibla
  // Calculate shortest angle from 0° (north)
  const angleFromNorth = normalizedAngle > 180
    ? 360 - normalizedAngle
    : normalizedAngle;

  if (angleFromNorth < 5) {
    return 'Facing Qibla';
  } else if (normalizedAngle > 0 && normalizedAngle < 45) {
    return 'Slightly right';
  } else if (normalizedAngle >= 45 && normalizedAngle < 135) {
    return 'To your right';
  } else if (normalizedAngle >= 135 && normalizedAngle < 225) {
    return 'Behind you';
  } else if (normalizedAngle >= 225 && normalizedAngle < 315) {
    return 'To your left';
  } else if (normalizedAngle >= 315 && normalizedAngle < 360) {
    return 'Slightly left';
  } else {
    return 'Facing Qibla';
  }
};

// Calculate angle from magnetometer data with small threshold to reduce jitter
const calculateAngle = (magnetometerValue, lastAngle, threshold = 0.3) => {
  if (!magnetometerValue) return lastAngle || 0;
  const { x, y } = magnetometerValue;
  let angleValue = Math.atan2(y, x) * (180 / Math.PI);
  angleValue = angleValue >= 0 ? angleValue : angleValue + 360;
  
  // Apply coordinate system transformation (same as original library)
  const transformedAngle = angleValue - 90 >= 0
    ? angleValue - 90
    : angleValue + 271;
  
  // Only update if change is significant enough (reduces jitter when still)
  if (lastAngle !== null && lastAngle !== undefined) {
    let diff = Math.abs(transformedAngle - lastAngle);
    // Handle wrap-around (e.g., 359° to 1°)
    if (diff > 180) diff = 360 - diff;
    // Only update if change is above threshold
    if (diff < threshold) return lastAngle;
  }
  
  return transformedAngle;
};

export default function QiblaCompass({ onBackgroundChange, isScreenFocused = true, vibrationEnabled = true }) {
  const [magnetometer, setMagnetometer] = useState(0);
  const [qiblaCoordinate, setQiblaCoordinate] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [containerHeight, setContainerHeight] = useState(height);
  // Full screen height including navbar
  const fullScreenHeight = height;
  const subscriptionRef = useRef(null);
  const lastAngleRef = useRef(null);
  const previousRoundedAngleRef = useRef(null);
  const hasTriggeredAlignmentHapticRef = useRef(false);
  
  // Calculate rotateKaba (angle to rotate arrow to point to Qibla)
  const rotateKaba = magnetometer - qiblaCoordinate;

  // Initialize compass with higher sensitivity
  useEffect(() => {
    const initCompass = async () => {
      setIsLoading(true);
      try {
        const isAvailable = await Magnetometer.isAvailableAsync();
        if (!isAvailable) {
          setErrorMsg('Compass is not available on this device');
          setIsLoading(false);
          return;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Location permission not granted');
          setIsLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });

        const qiblaValue = calculateQibla(
          location.coords.latitude,
          location.coords.longitude
        );
        setQiblaCoordinate(qiblaValue);

        // Set update interval to high sensitivity (16ms = ~60fps)
        Magnetometer.setUpdateInterval(16);
        
        subscriptionRef.current = Magnetometer.addListener((data) => {
          const newAngle = calculateAngle(data, lastAngleRef.current, 1.3);
          if (newAngle !== lastAngleRef.current) {
            lastAngleRef.current = newAngle;
            setMagnetometer(newAngle);
          }
        });
      } catch (error) {
        setErrorMsg(error.message || 'Failed to initialize compass');
      } finally {
        setIsLoading(false);
      }
    };

    initCompass();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
      }
    };
  }, []);

  // Animated values for smooth transitions
  const arcOpacity = useRef(new Animated.Value(1)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;
  
  // State for border color that animates with background
  const [borderColor, setBorderColor] = useState(COLORS.background.primary);

  // Calculate arrow end dot position (on circle circumference)
  const angleRad = (rotateKaba * Math.PI) / 180;
  const arrowEndX = CIRCLE_CENTER_X + CIRCLE_RADIUS * Math.sin(angleRad);
  const arrowEndY = CIRCLE_CENTER_Y - CIRCLE_RADIUS * Math.cos(angleRad);

  // Calculate angles from circle center for both dots
  const topAngle = Math.atan2(TOP_DOT_Y - CIRCLE_CENTER_Y, TOP_DOT_X - CIRCLE_CENTER_X);
  const arrowAngle = Math.atan2(arrowEndY - CIRCLE_CENTER_Y, arrowEndX - CIRCLE_CENTER_X);

  // Calculate the angle difference, always choosing the shorter path
  let angleDiff = arrowAngle - topAngle;

  // Normalize to [-π, π] range
  if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
  if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

  // Determine arc flags - use shorter arc with leeway (flip at ~200° instead of 180°)
  const flipThreshold = (200 * Math.PI) / 180; // 200 degrees in radians
  const largeArcFlag = Math.abs(angleDiff) > flipThreshold ? 1 : 0;
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
  
  // Round angle to nearest degree for haptic feedback
  const roundedAngle = Math.round(angleFromNorth);

  // Haptic feedback effect - light tick every degree, strong haptic when entering 5° zone
  // Only trigger haptics when the screen is focused and vibration is enabled
  useEffect(() => {
    if (!isScreenFocused || !vibrationEnabled) {
      // Update previous angle even when not focused or vibration disabled to prevent haptics when returning
      previousRoundedAngleRef.current = roundedAngle;
      return;
    }

    const prevAngle = previousRoundedAngleRef.current;
    const currentAngle = roundedAngle;

    // Check if we just entered the 5° alignment zone
    if (currentAngle < 5 && prevAngle !== null && prevAngle >= 5) {
      // Maximum strength haptic when entering alignment zone
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      hasTriggeredAlignmentHapticRef.current = true;
    }
    // Light tick for every degree change when outside 5° zone
    else if (prevAngle !== null && prevAngle !== currentAngle && currentAngle >= 5) {
      // Selection haptic - weaker than Light impact
      Haptics.selectionAsync();
    }
    // Reset the alignment haptic flag when leaving the 5° zone
    else if (currentAngle >= 5 && prevAngle !== null && prevAngle < 5) {
      hasTriggeredAlignmentHapticRef.current = false;
    }

    // Update previous angle
    previousRoundedAngleRef.current = currentAngle;
  }, [roundedAngle, isScreenFocused, vibrationEnabled]);

  // Animate opacity changes when alignment status changes - separate from haptics
  useEffect(() => {
    Animated.timing(arcOpacity, {
      toValue: isNearAlignment ? 0 : 1,
      duration: 150,
      useNativeDriver: true,
    }).start();

    const bgAnimation = Animated.timing(bgOpacity, {
      toValue: isNearAlignment ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    });

    // Update border color to match background animation
    bgAnimation.start(({ finished }) => {
      if (finished) {
        setBorderColor(isNearAlignment ? 'rgb(49, 199, 86)' : COLORS.background.primary);
      }
    });

    // Also update border color immediately for smoother transition
    const listener = bgOpacity.addListener(({ value }) => {
      // Interpolate between background color (#0A090E) and green (rgb(49, 199, 86))
      const bgR = parseInt(COLORS.background.primary.slice(1, 3), 16); // 10
      const bgG = parseInt(COLORS.background.primary.slice(3, 5), 16); // 9
      const bgB = parseInt(COLORS.background.primary.slice(5, 7), 16); // 14
      const r = Math.round(bgR * (1 - value) + 49 * value);
      const g = Math.round(bgG * (1 - value) + 199 * value);
      const b = Math.round(bgB * (1 - value) + 86 * value);
      setBorderColor(`rgb(${r}, ${g}, ${b})`);
    });

    // Notify parent of background color change
    if (onBackgroundChange) {
      onBackgroundChange(isNearAlignment);
    }

    return () => {
      bgOpacity.removeListener(listener);
    };
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

  const handleContainerLayout = (event) => {
    const { height: containerH } = event.nativeEvent.layout;
    setContainerHeight(containerH);
  };

  return (
    <View style={styles.container} onLayout={handleContainerLayout}>
      {/* Compass centered independently */}
      <View style={styles.compassContainer}>
        <View style={[
          styles.compassWrapper,
          {
            top: fullScreenHeight / 2 - COMPASS_SIZE / 2,
            left: width / 2 - COMPASS_SIZE / 2,
          }
        ]}>
          <Animated.View style={{ opacity: arcOpacity }}>
            <Svg width={COMPASS_SIZE} height={COMPASS_SIZE} style={styles.svg}>
              {/* Top dot - fades out near alignment */}
              <Circle
                cx={TOP_DOT_X}
                cy={TOP_DOT_Y}
                r={15}
                fill="#FFFFFF"
              />
            </Svg>
          </Animated.View>

          <Svg width={COMPASS_SIZE} height={COMPASS_SIZE} style={styles.svg}>
            {/* Arrow end dot - always visible */}
            <Circle
              cx={arrowEndX}
              cy={arrowEndY}
              r={15}
              fill="#FFFFFF"
            />
          </Svg>

          <Animated.View style={{ opacity: arcOpacity }}>
            <Svg width={COMPASS_SIZE} height={COMPASS_SIZE} style={styles.svg}>
              {/* Invisible arc for math/layout - keeps original behavior */}
              <Path
                d={arcPath}
                fill="none"
                stroke="transparent"
                strokeWidth="20"
              />
              {/* Visible shortened arc - rendered on top with gaps on both ends */}
              <Path
                d={arcPath}
                fill="none"
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="20"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={`0 35 ${Math.max(0, CIRCLE_RADIUS * Math.abs(angleDiff) - 70)} 35`}
              />
            </Svg>
          </Animated.View>

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
      </View>

      {/* Text elements positioned right below compass */}
      <View style={[
        styles.textContainer,
        {
          top: fullScreenHeight / 2 + COMPASS_SIZE / 2 + SPACING.sm,
        }
      ]}>
        {/* Distance from Qibla display */}
        <View style={styles.angleContainer}>
          <Text style={styles.angleText}>{Math.round(angleFromNorth)}</Text>
          <Text style={styles.degreeSymbol}>°</Text>
        </View>

        {/* Directional text */}
        {(() => {
          const directionText = getDirectionText(rotateKaba);
          const words = directionText.split(' ');
          const greyColor = 'rgba(255, 255, 255, 0.69)';
          const whiteColor = COLORS.text.primary;
          
          return (
            <Text style={styles.directionText}>
              {words.map((word, index) => {
                const lowerWord = word.toLowerCase();
                const isHighlight = lowerWord.includes('left') || lowerWord.includes('right') || lowerWord.includes('qibla');
                return (
                  <Text key={index} style={{ color: isHighlight ? whiteColor : greyColor }}>
                    {word}{index < words.length - 1 ? ' ' : ''}
                  </Text>
                );
              })}
            </Text>
          );
        })()}
      </View>
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
  compassContainer: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  compassWrapper: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    position: 'absolute',
  },
  textContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    width: '100%',
    alignItems: 'flex-start',
    paddingLeft: SPACING.lg,
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
  angleContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  angleText: {
    fontFamily: FONTS.weights.bold.primary,
    fontSize: FONTS.sizes.xxl,
    color: COLORS.text.primary,
  },
  degreeSymbol: {
    fontFamily: FONTS.weights.bold.primary,
    fontSize: FONTS.sizes.xxl,
    color: 'rgba(255, 255, 255, 0.69)',
  },
  directionText: {
    fontFamily: FONTS.weights.regular.primary,
    fontSize: FONTS.sizes.xxl,
    marginTop: SPACING.xs,
    textAlign: 'left',
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
    color: COLORS.text.primary,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
});
