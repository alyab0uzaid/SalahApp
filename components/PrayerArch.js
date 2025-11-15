import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, RadialGradient, Filter, FeGaussianBlur } from 'react-native-svg';

const PrayerArch = ({ prayerTimes, currentTime, width = 350, height = 200 }) => {
  // Convert time string (e.g., "5:22 AM") to minutes since midnight
  const timeToMinutes = (timeStr) => {
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes;
    if (period === 'PM' && hours !== 12) totalMinutes += 12 * 60;
    if (period === 'AM' && hours === 12) totalMinutes -= 12 * 60;
    return totalMinutes;
  };

  // Convert current time to minutes
  const currentMinutes = timeToMinutes(currentTime);

  // Get all prayer times in minutes
  const timesInMinutes = prayerTimes.map(time => timeToMinutes(time));

  // Find min and max times for scaling
  const minTime = Math.min(...timesInMinutes);
  const maxTime = Math.max(...timesInMinutes);
  const timeRange = maxTime - minTime;

  // Arch configuration - continuous curve, steeper in middle, subtle at ends
  // Arch line goes edge to edge (0 to 1), but dots have padding
  const dotStartRatio = 0.10;  // Where dots start (10% from left - padding for dots)
  const dotEndRatio = 0.90;     // Where dots end (90% from left - padding for dots)
  const dotWidth = dotEndRatio - dotStartRatio; // Width for dot positioning

  // Padding for glow overflow (prevents clipping)
  const padding = 40;
  const svgHeight = height + (padding * 2); // Extra space top and bottom for glow

  // Map time position (0-1) to arch position (dotStartRatio to dotEndRatio for dots)
  // But arch line itself goes from 0 to 1 (edge to edge)
  const getPosition = (minutes) => {
    // Clamp minutes to be within the prayer time range
    const clampedMinutes = Math.max(minTime, Math.min(maxTime, minutes));
    const timePosition = (clampedMinutes - minTime) / timeRange; // 0 to 1
    // Map to dot section only (with padding)
    return dotStartRatio + (timePosition * dotWidth);
  };

  // Calculate point on arch - continuous curve, never completely flat
  const getPointOnArch = (t) => {
    const x = t * width;
    
    // Adjust Y positions to account for padding (glow overflow space)
    const adjustedHeight = height;
    
    // Define Y positions - bigger and steeper (relative to adjusted height)
    const leftY = padding + adjustedHeight * 0.60;   // Left end Y (slightly lower)
    const rightY = padding + adjustedHeight * 0.55;   // Right end Y (slightly higher)
    const peakY = padding + adjustedHeight * 0.05;    // Peak Y (much steeper - near top)
    
    // Continuous curve that's steeper in middle, subtle at ends
    // Use quadratic bezier interpolation for smooth curve
    // This creates a curve that never completely flattens
    const curveFactor = 16 * t * t * (1 - t) * (1 - t); // Peaks at 0.5, subtle at ends
    
    // Interpolate between endpoints
    const baseY = leftY * (1 - t) + rightY * t;
    
    // Apply curve - stronger in middle, subtle at ends
    const curveOffset = (baseY - peakY) * curveFactor;
    const y = baseY - curveOffset;
    
    return { x, y };
  };

  // Generate the arch path by sampling points - ensures consistency with dots
  const generateArchPath = (endT = 1) => {
    const points = [];
    // Use enough points to ensure smooth curve even for short segments
    const numPoints = Math.max(50, Math.ceil(100 * endT)); // At least 50 points, scale with length
    
    for (let i = 0; i <= numPoints; i++) {
      const t = (i / numPoints) * endT; // Scale to endT
      const point = getPointOnArch(t);
      if (i === 0) {
        points.push(`M ${point.x} ${point.y}`);
      } else {
        points.push(`L ${point.x} ${point.y}`);
      }
    }
    
    return points.join(' ');
  };

  // Get current position on arch (this is already a ratio 0-1)
  const currentPosition = getPosition(currentMinutes);
  const currentPoint = getPointOnArch(currentPosition);
  
  // currentPosition is already a t value (0-1) for the arch
  // Ensure it's at least a small value so the white line is visible
  const currentT = Math.max(0.01, currentPosition);

  return (
    <View style={styles.container}>
      <Svg 
        width={width} 
        height={svgHeight} 
        style={styles.svg} 
        overflow="visible"
      >
        <Defs>
          {/* Gradient from #26282C to white, left to right */}
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
        </Defs>

        {/* Main arch line - dark gray (full path) */}
        <Path
          d={generateArchPath(1)}
          fill="none"
          stroke="#232327"
          strokeWidth="7"
          strokeLinecap="round"
        />
        
        {/* Gradient line up to current time */}
        <Path
          d={generateArchPath(currentT)}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth="7"
          strokeLinecap="round"
        />
        
        {/* Prayer time dots - filled if past, stroked if future */}
        {prayerTimes.map((time, index) => {
          const position = getPosition(timeToMinutes(time));
          const point = getPointOnArch(position);
          const timeMinutes = timeToMinutes(time);
          const isPast = timeMinutes <= currentMinutes;
          
          // Don't show regular dots if current time is very close
          if (Math.abs(position - currentPosition) < 0.02) {
            return null;
          }
          
          return (
            <React.Fragment key={index}>
              {isPast ? (
                <Circle
                  cx={point.x}
                  cy={point.y}
                  r={9}
                  fill="#858585"
                />
              ) : (
                <>
                  {/* Outer circle with background fill */}
                  <Circle
                    cx={point.x}
                    cy={point.y}
                    r={9}
                    fill="#0A090E"
                  />
                  {/* Inner circle with stroke to create inside stroke effect */}
                  <Circle
                    cx={point.x}
                    cy={point.y}
                    r={7.5}
                    fill="none"
                    stroke="#858585"
                    strokeWidth="3"
                  />
                </>
              )}
            </React.Fragment>
          );
        })}

        {/* Current time indicator - CSS box-shadow style glow effect */}
        {/* Multiple blurred circles simulating CSS box-shadow layers */}
        <Circle
          cx={currentPoint.x}
          cy={currentPoint.y}
          r={10}
          fill="#fff"
          opacity={1}
          filter="url(#glowBlur1)"
        />
        <Circle
          cx={currentPoint.x}
          cy={currentPoint.y}
          r={10}
          fill="#fff"
          opacity={1}
          filter="url(#glowBlur2)"
        />
        <Circle
          cx={currentPoint.x}
          cy={currentPoint.y}
          r={10}
          fill="#fff"
          opacity={1}
          filter="url(#glowBlur3)"
        />
        <Circle
          cx={currentPoint.x}
          cy={currentPoint.y}
          r={10}
          fill="#fff"
          opacity={0.8}
          filter="url(#glowBlur4)"
        />
        <Circle
          cx={currentPoint.x}
          cy={currentPoint.y}
          r={10}
          fill="#fff"
          opacity={0.6}
          filter="url(#glowBlur5)"
        />
        <Circle
          cx={currentPoint.x}
          cy={currentPoint.y}
          r={10}
          fill="#fff"
          opacity={0.4}
          filter="url(#glowBlur6)"
        />
        <Circle
          cx={currentPoint.x}
          cy={currentPoint.y}
          r={10}
          fill="#fff"
          opacity={0.3}
          filter="url(#glowBlur7)"
        />
        {/* Solid white center */}
        <Circle
          cx={currentPoint.x}
          cy={currentPoint.y}
          r={10}
          fill="#fff"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 20,
    paddingBottom: 0,
    overflow: 'visible',
    marginVertical: -20, // Negative margin to allow glow overflow
    marginBottom: -100, // Large negative margin to compensate for extra SVG height from glow
  },
  svg: {
    alignSelf: 'center',
    overflow: 'visible',
  },
});

export default PrayerArch;

