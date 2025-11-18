import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, RadialGradient, Filter, FeGaussianBlur, G } from 'react-native-svg';

const ArchTimer = ({ prayerTimes, prayerNames, currentTime, width = 350, height = 200 }) => {
  // Convert time string to minutes since midnight
  const timeToMinutes = (timeStr) => {
    const [time, period] = timeStr.split(' ');
    const parts = time.split(':').map(Number);
    const hours = parts[0];
    const minutes = parts[1] || 0;
    const seconds = parts[2] || 0;
    
    let totalMinutes = hours * 60 + minutes + (seconds / 60);
    if (period === 'PM' && hours !== 12) totalMinutes += 12 * 60;
    if (period === 'AM' && hours === 12) totalMinutes -= 12 * 60;
    return totalMinutes;
  };

  // Convert current time to minutes
  const rawCurrentMinutes = timeToMinutes(currentTime);

  // Timer state and logic
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [nextPrayer, setNextPrayer] = useState({ name: '', time: '' });

  // Calculate next prayer and countdown
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

    // Update immediately
    updateTimer();

    // Update every second for countdown
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
  const GLOW_PADDING_BOTTOM = 80; // Extra padding at bottom for glow
  // SVG dimensions - make it larger to accommodate glow
  const svgWidth = width + (GLOW_PADDING * 2);
  const svgHeight = (height * 0.60) + GLOW_PADDING + GLOW_PADDING_BOTTOM;

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

  // Calculate point on arch curve
  const getPointOnArch = (t) => {
    // X coordinate - no padding offset since SVG is shifted with negative margins
    const x = GLOW_PADDING + (t * width);
    
    // Y positions - arch curve (symmetric)
    // Arch should fill from top to bottom of container (containerHeight)
    // In SVG coordinates, arch goes from GLOW_PADDING (top) to GLOW_PADDING + archHeight (bottom)
    // Adjust bottom to align with container bottom border
    const leftY = GLOW_PADDING + archHeight - 15;  // Bottom of arch (adjusted to align)
    const rightY = GLOW_PADDING + archHeight - 15; // Same as left for symmetry
    const peakY = GLOW_PADDING + (archHeight * 0.083); // Peak at ~5% from top of arch
    
    // Smooth curve interpolation
    const curveFactor = 16 * t * t * (1 - t) * (1 - t);
    const baseY = leftY * (1 - t) + rightY * t;
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

  // Current time position
  const rawCurrentPosition = getCurrentPosition(rawCurrentMinutes);
  const clampedCurrentPosition = Math.max(0, Math.min(rawCurrentPosition, 1));
  // Always show circle if we have a valid current time (use clamped position to keep it on arch)
  const showCircle = rawCurrentMinutes >= minTime;
  // Point on arch for the current indicator (use clamped so it stays on arch)
  const currentPoint = getPointOnArch(clampedCurrentPosition);

  // Gradient progress
  let currentT = 0;
  if (showCircle) {
    currentT = Math.max(0.01, clampedCurrentPosition);
  } else if (rawCurrentMinutes >= maxTime && rawCurrentMinutes < 24 * 60) {
    currentT = 1;
  }

  // Container height - will auto-expand to fit timer content
  const archHeight = height * 0.60;

  return (
    <View 
      style={[styles.container, { 
        marginTop: -GLOW_PADDING,
        marginBottom: -GLOW_PADDING_BOTTOM,
      }]}
      clipsToBounds={false}
    >
      <Svg 
        width={svgWidth} 
        height={svgHeight} 
        style={[styles.svg, {
          marginLeft: -GLOW_PADDING,
          marginRight: -GLOW_PADDING,
          marginTop: -GLOW_PADDING,
          marginBottom: -GLOW_PADDING_BOTTOM,
        }]} 
      >
        <Defs>
          {/* Progress gradient */}
          <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#26282C" />
            <Stop offset="100%" stopColor="#fff" />
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
          stroke="#232327"
          strokeWidth="5"
          strokeLinecap="round"
        />
        
        {/* Gradient line up to current time */}
        {currentT > 0 && (
          <Path
            d={generateArchPath(currentT)}
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth="5"
            strokeLinecap="round"
          />
        )}
        
        {/* Past prayer time dots */}
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
            <G key={`past-${index}`}>
              <Circle
                cx={point.x}
                cy={point.y}
                r={9}
                fill="rgba(255, 255, 255, 0.08)"
                stroke="rgba(255, 255, 255, 0.25)"
                strokeWidth="1"
                opacity={opacity}
              />
              <Circle
                cx={point.x}
                cy={point.y}
                r={9}
                fill="url(#liquidGlassPast)"
                opacity={opacity * 0.5}
              />
            </G>
          );
        })}

        {/* Future prayer time dots */}
        {prayerTimes.map((time, index) => {
          const minutes = timeToMinutes(time);
          const position = getDotPosition(minutes);
          const point = getPointOnArch(position);
          
          let isPast = false;
          if (rawCurrentMinutes >= minTime) {
            isPast = rawCurrentMinutes >= minutes;
          }
          
          if (isPast) return null;
          
          // Fade out opacity
          const fadeWindowMinutes = 3;
          const minutesUntilPrayer = minutes - rawCurrentMinutes;
          let opacity = 1;
          
          if (minutesUntilPrayer <= fadeWindowMinutes && minutesUntilPrayer > 0) {
            opacity = minutesUntilPrayer / fadeWindowMinutes;
          } else if (minutesUntilPrayer <= 0) {
            opacity = 0;
          }
          
          return (
            <G key={`future-${index}`}>
              <Circle
                cx={point.x}
                cy={point.y}
                r={9}
                fill="none"
                stroke="rgba(255, 255, 255, 0.35)"
                strokeWidth="3"
                opacity={opacity}
              />
              <Circle
                cx={point.x}
                cy={point.y}
                r={9}
                fill="none"
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="1.5"
                opacity={opacity * 0.5}
              />
            </G>
          );
        })}

        {/* Current time indicator - CSS box-shadow style glow effect */}
        {/* Multiple blurred circles simulating CSS box-shadow layers */}
        {showCircle && (() => {
          // Use clamped position directly to ensure it's always valid
          const point = getPointOnArch(clampedCurrentPosition);
          return (
            <>
              <Circle
                cx={point.x}
                cy={point.y}
                r={10}
                fill="#fff"
                opacity={1}
                filter="url(#glowBlur1)"
              />
              <Circle
                cx={point.x}
                cy={point.y}
                r={10}
                fill="#fff"
                opacity={1}
                filter="url(#glowBlur2)"
              />
              <Circle
                cx={point.x}
                cy={point.y}
                r={10}
                fill="#fff"
                opacity={1}
                filter="url(#glowBlur3)"
              />
              <Circle
                cx={point.x}
                cy={point.y}
                r={10}
                fill="#fff"
                opacity={0.8}
                filter="url(#glowBlur4)"
              />
              <Circle
                cx={point.x}
                cy={point.y}
                r={10}
                fill="#fff"
                opacity={0.6}
                filter="url(#glowBlur5)"
              />
              <Circle
                cx={point.x}
                cy={point.y}
                r={10}
                fill="#fff"
                opacity={0.4}
                filter="url(#glowBlur6)"
              />
              <Circle
                cx={point.x}
                cy={point.y}
                r={10}
                fill="#fff"
                opacity={0.3}
                filter="url(#glowBlur7)"
              />
              {/* Solid white center */}
              <Circle
                cx={point.x}
                cy={point.y}
                r={10}
                fill="#fff"
              />
            </>
          );
        })()}

      </Svg>
      
      {/* Timer component integrated */}
      <View style={styles.timerContainer}>
        <Text style={styles.prayerLabel}>{nextPrayer.name} in</Text>
        <Text style={styles.countdown}>
          {countdown.hours}:{countdown.minutes.toString().padStart(2, '0')}:{countdown.seconds.toString().padStart(2, '0')}
        </Text>
        <Text style={styles.prayerTime}>{nextPrayer.time}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'visible',
    alignSelf: 'center', // Ensure component is centered
    width: '100%',
  },
  svg: {
    alignSelf: 'center',
    overflow: 'visible',
  },
  timerContainer: {
    alignItems: 'center',
    marginTop: -60,
  },
  prayerLabel: {
    color: '#999',
    fontSize: 16,
    fontFamily: 'SpaceGrotesk_500Medium',
    marginBottom: -8,
  },
  countdown: {
    color: '#fff',
    fontSize: 48,
    fontFamily: 'SpaceGrotesk_500Medium',
    letterSpacing: 2,
    marginBottom: -8,
    fontVariant: ['tabular-nums'], // Makes numbers equal width to prevent shifting
  },
  prayerTime: {
    color: '#999',
    fontSize: 16,
    fontFamily: 'SpaceGrotesk_500Medium',
  },
});

export default ArchTimer;

