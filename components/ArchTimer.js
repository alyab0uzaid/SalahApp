import React, { useState, useEffect, useLayoutEffect, useRef, useMemo, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Animated } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, RadialGradient, Filter, FeGaussianBlur, G } from 'react-native-svg';
import { timeToMinutes } from '../utils/timeUtils';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';

const ArchTimer = forwardRef(({ prayerTimes, prayerNames, currentTime, width = 350, height = 200, style, selectedDate, onGoToToday }, ref) => {
  // Check if selected date is today
  const isToday = () => {
    if (!selectedDate) return true;
    const today = new Date();
    return (
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear()
    );
  };

  const isCurrentDateToday = isToday();

  // Convert current time to minutes
  const rawCurrentMinutes = timeToMinutes(currentTime);

  // Timer state and logic
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [nextPrayer, setNextPrayer] = useState({ name: '', time: '' });

  // Animated values for smooth fade transitions
  const timerOpacity = useRef(new Animated.Value(isCurrentDateToday ? 1 : 0)).current;
  const buttonOpacity = useRef(new Animated.Value(isCurrentDateToday ? 0 : 1)).current;
  const prevIsToday = useRef(isCurrentDateToday);
  const manuallyAnimating = useRef(false);

  // Expose animation control to parent
  useImperativeHandle(ref, () => ({
    animateToToday: () => {
      // Mark that we're manually animating to prevent useEffect from running
      manuallyAnimating.current = true;
      // Start animation immediately, before state updates
      Animated.sequence([
        Animated.timing(buttonOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(timerOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Reset flag after animation completes
        manuallyAnimating.current = false;
      });
      // Update prevIsToday immediately so useEffect doesn't run
      prevIsToday.current = true;
    }
  }));

  // Update animations when date changes
  useEffect(() => {
    // Skip if we're manually animating
    if (manuallyAnimating.current) return;
    
    // Only animate if the state actually changed
    if (prevIsToday.current === isCurrentDateToday) return;
    prevIsToday.current = isCurrentDateToday;

    // Start animation with fades
    if (isCurrentDateToday) {
      // Going to today: button fades out, then timer fades in
      Animated.sequence([
        Animated.timing(buttonOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(timerOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Going to another day: fade out timer (keep values), then fade in button
      Animated.sequence([
        Animated.timing(timerOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isCurrentDateToday]);

  // Calculate next prayer and countdown - always update for today's timer
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const currentSeconds = now.getSeconds();
      
      // Convert all prayer times to minutes
      const timesInMinutes = prayerTimes.map(time => timeToMinutes(time));
      
      // Find next prayer
      let nextPrayerIndex = -1;
      let nextPrayerMinutes = -1;
      
      for (let i = 0; i < timesInMinutes.length; i++) {
        if (timesInMinutes[i] > currentMinutes) {
          nextPrayerIndex = i;
          nextPrayerMinutes = timesInMinutes[i];
          break;
        }
      }
      
      // If no prayer found today, use first prayer tomorrow
      if (nextPrayerIndex === -1) {
        nextPrayerIndex = 0;
        nextPrayerMinutes = timesInMinutes[0] + (24 * 60); // Add 24 hours
      }
      
      // Calculate time difference
      const totalMinutesUntil = nextPrayerMinutes - currentMinutes;
      const totalSecondsUntil = (totalMinutesUntil * 60) - currentSeconds;
      
      const hours = Math.floor(totalSecondsUntil / 3600);
      const minutes = Math.floor((totalSecondsUntil % 3600) / 60);
      const seconds = totalSecondsUntil % 60;
      
      setCountdown({ hours, minutes, seconds });
      setNextPrayer({
        name: prayerNames[nextPrayerIndex] || '',
        time: prayerTimes[nextPrayerIndex] || ''
      });
    };

    // Update immediately - this ensures timer is ready right away
    updateTimer();

    // Always update timer every second (even when not viewing today, it will just be hidden)
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [prayerTimes, prayerNames]);

  // Get all prayer times in minutes
  const timesInMinutes = prayerTimes.map(time => timeToMinutes(time));
  const minTime = Math.min(...timesInMinutes); // Fajr
  const maxTime = Math.max(...timesInMinutes); // Isha
  const visibleRange = maxTime - minTime || 1;

  // Arch configuration
  const dotStartRatio = 0.10;
  const dotEndRatio = 0.90;
  const dotWidth = dotEndRatio - dotStartRatio;

  // Glow padding - space needed for glow to extend beyond component
  const GLOW_PADDING = 60; // Increased for larger glow
  const GLOW_PADDING_BOTTOM = 60; // Extra padding at bottom for glow

  // Arch dimensions
  const archHeight = height * 0.60;

  // SVG dimensions - larger to accommodate glow (will be absolutely positioned)
  const svgWidth = width + (GLOW_PADDING * 2);
  const svgHeight = archHeight + GLOW_PADDING + GLOW_PADDING_BOTTOM;

  // Map time to arch position for prayer dots
  const getDotPosition = (minutes) => {
    const clampedMinutes = Math.max(minTime, Math.min(maxTime, minutes));
    const timePosition = (clampedMinutes - minTime) / visibleRange;
    return dotStartRatio + (timePosition * dotWidth);
  };

  // Map current time position (can extend beyond visible arch)
  const getCurrentPosition = (minutes) => {
    const timePosition = (minutes - minTime) / visibleRange;
    return dotStartRatio + (timePosition * dotWidth);
  };

  // Calculate point on arch curve - extended to handle off-screen positions
  const getPointOnArch = (t) => {
    // X coordinate - extends beyond arch bounds for off-screen movement
    // When t < 0: orb is to the left of arch start
    // When t > 1: orb is to the right of arch end
    const x = GLOW_PADDING + (t * width);
    
    // Y positions - arch curve (symmetric)
    // For off-screen positions, maintain the arch's Y at the endpoints
    const leftY = GLOW_PADDING + archHeight - 15;  // Bottom of arch (adjusted to align)
    const rightY = GLOW_PADDING + archHeight - 15; // Same as left for symmetry
    const peakY = GLOW_PADDING + (archHeight * 0.083); // Peak at ~5% from top of arch
    
    // Clamp t to 0-1 for Y calculation (keep Y at arch endpoints when off-screen)
    const clampedT = Math.max(0, Math.min(1, t));
    
    // Smooth curve interpolation
    const curveFactor = 16 * clampedT * clampedT * (1 - clampedT) * (1 - clampedT);
    const baseY = leftY * (1 - clampedT) + rightY * clampedT;
    const curveOffset = (baseY - peakY) * curveFactor;
    const y = baseY - curveOffset;
    
    return { x, y };
  };

  // Generate arch path
  const generateArchPath = (endT = 1) => {
    const points = [];
    const numPoints = Math.max(50, Math.ceil(100 * endT));
    
    for (let i = 0; i <= numPoints; i++) {
      const t = (i / numPoints) * endT;
      const point = getPointOnArch(t);
      if (i === 0) {
        points.push(`M ${point.x} ${point.y}`);
      } else {
        points.push(`L ${point.x} ${point.y}`);
      }
    }
    
    return points.join(' ');
  };

  // Memoize expensive calculations - only recalculate when time or prayer times change
  const archCalculations = useMemo(() => {
    const rawCurrentPosition = getCurrentPosition(rawCurrentMinutes);
    const clampedCurrentPosition = Math.max(0, Math.min(rawCurrentPosition, 1));
    const showCircle = rawCurrentPosition >= -0.3 && rawCurrentPosition <= 1.3;
    const currentPoint = getPointOnArch(rawCurrentPosition);
    
    let currentT = 0;
    if (rawCurrentPosition >= 0) {
      currentT = Math.max(0.01, clampedCurrentPosition);
    } else if (rawCurrentMinutes >= maxTime && rawCurrentMinutes < 24 * 60 && rawCurrentPosition <= 1) {
      currentT = 1;
    }
    
    return {
      rawCurrentPosition,
      clampedCurrentPosition,
      showCircle,
      currentPoint,
      currentT
    };
  }, [rawCurrentMinutes, minTime, maxTime, width, height]);

  const { rawCurrentPosition, clampedCurrentPosition, showCircle, currentPoint, currentT } = archCalculations;
  const shouldShowCircle = isCurrentDateToday && showCircle;
  
  // Memoize the gradient path
  const gradientPath = useMemo(() => currentT > 0 ? generateArchPath(currentT) : '', [currentT, width, height]);

  return (
    <View style={[styles.container, style]}>
      {/* SVG positioned absolutely to allow glow overflow */}
      <Svg
        width={svgWidth}
        height={svgHeight}
        style={[styles.svg, {
          position: 'absolute',
          top: -GLOW_PADDING, // Position to align arch correctly
          left: -GLOW_PADDING, // Center the arch horizontally
        }]}
      >
        <Defs>
          {/* Progress gradient */}
          <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={COLORS.border.secondary} />
            <Stop offset="100%" stopColor={COLORS.accent.white} />
          </LinearGradient>
          
          {/* Multiple blur filters for layered glow effect (simulating CSS box-shadow) */}
          {/* Extremely large filter region to completely eliminate visible box edges */}
          <Filter id="glowBlur1" x="-500%" y="-500%" width="1100%" height="1100%">
            <FeGaussianBlur stdDeviation="5" edgeMode="none" />
          </Filter>
          <Filter id="glowBlur2" x="-500%" y="-500%" width="1100%" height="1100%">
            <FeGaussianBlur stdDeviation="10" edgeMode="none" />
          </Filter>
          <Filter id="glowBlur3" x="-500%" y="-500%" width="1100%" height="1100%">
            <FeGaussianBlur stdDeviation="15" edgeMode="none" />
          </Filter>
          <Filter id="glowBlur4" x="-500%" y="-500%" width="1100%" height="1100%">
            <FeGaussianBlur stdDeviation="20" edgeMode="none" />
          </Filter>
          <Filter id="glowBlur5" x="-500%" y="-500%" width="1100%" height="1100%">
            <FeGaussianBlur stdDeviation="25" edgeMode="none" />
          </Filter>
          <Filter id="glowBlur6" x="-500%" y="-500%" width="1100%" height="1100%">
            <FeGaussianBlur stdDeviation="30" edgeMode="none" />
          </Filter>
          <Filter id="glowBlur7" x="-500%" y="-500%" width="1100%" height="1100%">
            <FeGaussianBlur stdDeviation="35" edgeMode="none" />
          </Filter>
          
          {/* Liquid glass gradients */}
          <RadialGradient id="liquidGlass" cx="30%" cy="30%">
            <Stop offset="0%" stopColor="rgba(255, 255, 255, 0.25)" />
            <Stop offset="50%" stopColor="rgba(255, 255, 255, 0.08)" />
            <Stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
          </RadialGradient>
          
          <RadialGradient id="liquidGlassPast" cx="30%" cy="30%">
            <Stop offset="0%" stopColor="rgba(200, 200, 200, 0.2)" />
            <Stop offset="50%" stopColor="rgba(150, 150, 150, 0.08)" />
            <Stop offset="100%" stopColor="rgba(100, 100, 100, 0)" />
          </RadialGradient>
        </Defs>

        {/* Main arch line */}
        <Path
          d={generateArchPath(1)}
          fill="none"
          stroke={COLORS.accent.gradient}
          strokeWidth="5"
          strokeLinecap="round"
        />
        
        {/* Gradient line up to current time - always render, control with opacity */}
        {gradientPath && (
          <Path
            d={gradientPath}
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth="5"
            strokeLinecap="round"
            opacity={isCurrentDateToday ? 1 : 0}
            pointerEvents={isCurrentDateToday ? 'auto' : 'none'}
          />
        )}
        
        {/* Past prayer time dots - always render, control with opacity */}
        {prayerTimes.map((time, index) => {
          const minutes = timeToMinutes(time);
          const position = getDotPosition(minutes);
          const point = getPointOnArch(position);
          
          let isPast = false;
          if (rawCurrentMinutes >= minTime) {
            isPast = rawCurrentMinutes >= minutes;
          }
          
          if (!isPast) return null;
          
          // Hide if too close to current indicator
          if (showCircle && Math.abs(position - clampedCurrentPosition) < 0.002) {
            return null;
          }
          
          // Fade in opacity
          const fadeWindowMinutes = 3;
          const minutesAfterPrayer = rawCurrentMinutes - minutes;
          let opacity = 1;
          
          if (minutesAfterPrayer >= 0 && minutesAfterPrayer <= fadeWindowMinutes) {
            opacity = Math.min(1, minutesAfterPrayer / fadeWindowMinutes);
          }
          
          return (
            <G key={`past-${index}`} opacity={isCurrentDateToday ? opacity : 0} pointerEvents={isCurrentDateToday ? 'auto' : 'none'}>
              <Circle
                cx={point.x}
                cy={point.y}
                r={9}
                fill="rgba(255, 255, 255, 0.08)"
                stroke="rgba(255, 255, 255, 0.25)"
                strokeWidth="1"
              />
              <Circle
                cx={point.x}
                cy={point.y}
                r={9}
                fill="url(#liquidGlassPast)"
                opacity={0.5}
              />
            </G>
          );
        })}

        {/* Future prayer time dots */}
        {prayerTimes.map((time, index) => {
          const minutes = timeToMinutes(time);
          const position = getDotPosition(minutes);
          const point = getPointOnArch(position);
          
          // When not today, show all dots as future (no fade logic)
          let isPast = false;
          let opacity = 1;
          
          if (isCurrentDateToday) {
            if (rawCurrentMinutes >= minTime) {
              isPast = rawCurrentMinutes >= minutes;
            }
            
            if (isPast) return null;
            
            // Fade out opacity only when viewing today
            const fadeWindowMinutes = 3;
            const minutesUntilPrayer = minutes - rawCurrentMinutes;
            
            if (minutesUntilPrayer <= fadeWindowMinutes && minutesUntilPrayer > 0) {
              opacity = minutesUntilPrayer / fadeWindowMinutes;
            } else if (minutesUntilPrayer <= 0) {
              opacity = 0;
            }
          }
          
          return (
            <G key={`future-${index}`} opacity={isCurrentDateToday ? opacity : 1} pointerEvents="auto">
              <Circle
                cx={point.x}
                cy={point.y}
                r={9}
                fill="none"
                stroke="rgba(255, 255, 255, 0.35)"
                strokeWidth="3"
              />
              <Circle
                cx={point.x}
                cy={point.y}
                r={9}
                fill="none"
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="1.5"
                opacity={0.5}
              />
            </G>
          );
        })}

        {/* Current time indicator - CSS box-shadow style glow effect */}
        {/* Multiple blurred circles simulating CSS box-shadow layers */}
        {shouldShowCircle && (() => {
          // Use raw position to allow off-screen movement
          const point = currentPoint;
          return (
            <G opacity={isCurrentDateToday ? 1 : 0} pointerEvents={isCurrentDateToday ? 'auto' : 'none'}>
              <Circle
                cx={point.x}
                cy={point.y}
                r={10}
                fill={COLORS.accent.white}
                opacity={1}
                filter="url(#glowBlur1)"
              />
              <Circle
                cx={point.x}
                cy={point.y}
                r={10}
                fill={COLORS.accent.white}
                opacity={1}
                filter="url(#glowBlur2)"
              />
              <Circle
                cx={point.x}
                cy={point.y}
                r={10}
                fill={COLORS.accent.white}
                opacity={1}
                filter="url(#glowBlur3)"
              />
              <Circle
                cx={point.x}
                cy={point.y}
                r={10}
                fill={COLORS.accent.white}
                opacity={0.8}
                filter="url(#glowBlur4)"
              />
              <Circle
                cx={point.x}
                cy={point.y}
                r={10}
                fill={COLORS.accent.white}
                opacity={0.6}
                filter="url(#glowBlur5)"
              />
              <Circle
                cx={point.x}
                cy={point.y}
                r={10}
                fill={COLORS.accent.white}
                opacity={0.4}
                filter="url(#glowBlur6)"
              />
              <Circle
                cx={point.x}
                cy={point.y}
                r={10}
                fill={COLORS.accent.white}
                opacity={0.3}
                filter="url(#glowBlur7)"
              />
              {/* Solid white center */}
              <Circle
                cx={point.x}
                cy={point.y}
                r={10}
                fill={COLORS.accent.white}
              />
            </G>
          );
        })()}

      </Svg>
      
      {/* Timer component integrated - both timer and button in same space */}
      <View style={[styles.timerContainer, {
        marginTop: archHeight - 50, // Position timer below arch with slight overlap
      }]}>
        {/* Timer - fade out when not today */}
        <Animated.View style={[styles.timerContent, { opacity: timerOpacity }]}>
          <Text style={styles.prayerLabel}>{nextPrayer.name} in</Text>
          <Text style={styles.countdown}>
            {countdown.hours}:{countdown.minutes.toString().padStart(2, '0')}:{countdown.seconds.toString().padStart(2, '0')}
          </Text>
          <Text style={styles.prayerTime}>{nextPrayer.time}</Text>
        </Animated.View>
        
        {/* Today button - fade in when not today, positioned absolutely to take same space */}
        <Animated.View style={[styles.todayButtonContainer, { opacity: buttonOpacity }]}>
          <TouchableOpacity
            onPress={onGoToToday}
            style={styles.todayButton}
            activeOpacity={0.7}
          >
            <Text style={styles.todayButtonText}>Today</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    alignSelf: 'center',
    width: '100%',
    // No overflow or margin properties - natural size
  },
  svg: {
    // Absolutely positioned - will overflow container naturally
  },
  timerContainer: {
    alignItems: 'center',
    position: 'relative',
    minHeight: 100, // Ensure consistent height
    // marginTop is set dynamically in the component
  },
  timerContent: {
    alignItems: 'center',
    position: 'absolute',
    width: '100%',
  },
  todayButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    width: '100%',
    minHeight: 100, // Match timer height
  },
  prayerLabel: {
    color: COLORS.text.tertiary,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.weights.medium.primary,
    marginBottom: -8,
  },
  countdown: {
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.xxl,
    fontFamily: FONTS.weights.medium.primary,
    letterSpacing: 2,
    marginBottom: -8,
    fontVariant: ['tabular-nums'], // Makes numbers equal width to prevent shifting
  },
  prayerTime: {
    color: COLORS.text.tertiary,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.weights.medium.primary,
    marginBottom: 0, // Eliminate line-height gap at bottom
  },
  todayButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  todayButtonText: {
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.weights.medium.primary,
  },
});

export default ArchTimer;

