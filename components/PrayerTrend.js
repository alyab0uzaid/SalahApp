import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';
import { COLORS, FONTS, SPACING } from '../constants/theme';

const PrayerTrend = ({ prayerStatus }) => {
  const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  const dayLabelMap = ['S', 'M', 'T', 'W', 'T', 'F', 'S']; // Sunday = 0, Monday = 1, etc.

  // Get day of week for a date string (YYYY-MM-DD)
  const getDayOfWeek = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  };

  // Get last 7 days
  const getDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  const days = getDays();

  // Circle dimensions
  const circleRadius = 20;
  const circleGap = 8;
  const containerPadding = 12;
  const strokeWidth = 3;

  // Get color for a prayer segment
  const getSegmentColor = (day, prayerIndex) => {
    if (!prayerStatus || !prayerStatus[day]) {
      return '#1C1B1C'; // Unfilled - slightly lighter than bg
    }

    const prayer = prayers[prayerIndex];
    const status = prayerStatus[day][prayer] || prayerStatus[day][prayer.toLowerCase()];

    if (status === 'on-time') {
      return '#81C784'; // Green at full opacity
    } else if (status === 'late') {
      return '#81C784'; // Green at 40% opacity (we'll use opacity in the path)
    }

    return '#1C1B1C'; // Unfilled
  };

  // Get opacity for a prayer segment
  const getSegmentOpacity = (day, prayerIndex) => {
    if (!prayerStatus || !prayerStatus[day]) {
      return 1;
    }

    const prayer = prayers[prayerIndex];
    const status = prayerStatus[day][prayer] || prayerStatus[day][prayer.toLowerCase()];

    if (status === 'on-time') {
      return 1;
    } else if (status === 'late') {
      return 0.4;
    }

    return 1;
  };

  // Create arc path for a segment stroke (1/5 of circle = 72 degrees)
  const createArcPath = (centerX, centerY, radius, segmentIndex) => {
    const startAngle = (segmentIndex * 72 - 90) * (Math.PI / 180); // Start at top, 72 degrees per segment
    const endAngle = ((segmentIndex + 1) * 72 - 90) * (Math.PI / 180);

    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);

    // Large arc flag: 0 for segments < 180 degrees, 1 for >= 180 degrees
    const largeArcFlag = 72 >= 180 ? 1 : 0;

    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
  };

  const totalWidth = (circleRadius * 2 * 7) + (circleGap * 6) + (containerPadding * 2);
  const totalHeight = (circleRadius * 2) + (containerPadding * 2);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>7 Day Trend</Text>
      <View style={styles.trendContainer}>
        <View style={styles.svgWrapper}>
          <Svg width={totalWidth} height={totalHeight}>
          {days.map((day, dayIndex) => {
            const centerX = containerPadding + circleRadius + (dayIndex * (circleRadius * 2 + circleGap));
            const centerY = containerPadding + circleRadius;

            return (
              <React.Fragment key={day}>
                {/* Prayer segments (5 stroke arcs per circle) */}
                {prayers.map((prayer, prayerIndex) => {
                  const color = getSegmentColor(day, prayerIndex);
                  const opacity = getSegmentOpacity(day, prayerIndex);
                  const arcPath = createArcPath(centerX, centerY, circleRadius, prayerIndex);

                  return (
                    <Path
                      key={`${day}-${prayer}`}
                      d={arcPath}
                      fill="none"
                      stroke={color}
                      strokeWidth={strokeWidth}
                      strokeOpacity={opacity}
                    />
                  );
                })}

                {/* Day label in center */}
                <SvgText
                  x={centerX}
                  y={centerY + 4}
                  fontSize="10"
                  fill={COLORS.text.secondary}
                  textAnchor="middle"
                  fontFamily={FONTS.weights.regular.primary}
                >
                  {dayLabelMap[getDayOfWeek(day)]}
                </SvgText>
              </React.Fragment>
            );
          })}
          </Svg>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '90%',
    alignSelf: 'center',
    marginTop: SPACING.lg,
  },
  title: {
    color: COLORS.text.tertiary,
    fontSize: 13,
    fontFamily: FONTS.weights.regular.primary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  trendContainer: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: 12,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PrayerTrend;

