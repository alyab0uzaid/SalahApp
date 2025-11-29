import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { COLORS, FONTS, SPACING } from '../constants/theme';

const PrayerHeatmap = ({ prayerStatus }) => {
  const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

  // Debug: log the prayer status to see what we're getting
  console.log('PrayerHeatmap - prayerStatus:', JSON.stringify(prayerStatus, null, 2));
  console.log('PrayerHeatmap - RE-RENDERING');

  // Get last 21 days (three weeks)
  const getDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 20; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  const days = getDays();

  // Cell dimensions
  const cellSize = 10;
  const cellGap = 2;
  const labelWidth = 58;
  const topPadding = 8;
  const bottomPadding = 8;

  // Get color and opacity for a cell
  const getCellStyle = (day, prayer) => {
    if (!prayerStatus || !prayerStatus[day]) {
      return { fill: '#1C1B1C', opacity: 1, hasStroke: false }; // A tad lighter than bg, no stroke
    }

    // Try both capitalized and lowercase versions
    const status = prayerStatus[day][prayer] || prayerStatus[day][prayer.toLowerCase()];

    console.log(`getCellStyle - day: ${day}, prayer: ${prayer}, status: ${status}, dayData:`, prayerStatus[day]);

    if (status === 'on-time') {
      return { fill: '#81C784', opacity: 1, hasStroke: false }; // Green at full opacity
    } else if (status === 'late') {
      return { fill: '#81C784', opacity: 0.4, hasStroke: false }; // Green at 40% opacity
    }

    return { fill: '#1C1B1C', opacity: 1, hasStroke: false }; // A tad lighter than bg, no stroke
  };

  const chartWidth = labelWidth + (days.length * (cellSize + cellGap));
  const chartHeight = topPadding + (prayers.length * (cellSize + cellGap)) + bottomPadding;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Prayer Heatmap</Text>
      <View style={styles.heatmapContainer}>
        <View style={styles.svgWrapper}>
          <Svg width={chartWidth} height={chartHeight}>
          {/* Render prayer labels (Y-axis) - full names in all caps */}
          {prayers.map((prayer, prayerIndex) => (
            <SvgText
              key={`label-${prayer}`}
              x={labelWidth - 6}
              y={topPadding + (prayerIndex * (cellSize + cellGap)) + cellSize / 2 + 4}
              fontSize="11"
              fill={COLORS.text.secondary}
              textAnchor="end"
              fontFamily={FONTS.weights.regular.primary}
            >
              {prayer.toUpperCase()}
            </SvgText>
          ))}

          {/* Render cells */}
          {days.map((day, dayIndex) => (
            prayers.map((prayer, prayerIndex) => {
              const { fill, opacity, hasStroke } = getCellStyle(day, prayer);
              console.log(`Rendering cell: ${day}-${prayer}, fill: ${fill}, opacity: ${opacity}`);
              return (
                <Rect
                  key={`${day}-${prayer}`}
                  x={labelWidth + (dayIndex * (cellSize + cellGap))}
                  y={topPadding + (prayerIndex * (cellSize + cellGap))}
                  width={cellSize}
                  height={cellSize}
                  fill={fill}
                  fillOpacity={opacity}
                  stroke={hasStroke ? "#555555" : "none"}
                  strokeWidth={hasStroke ? 1 : 0}
                  rx={3}
                />
              );
            })
          ))}
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
    fontSize: 11,
    fontFamily: FONTS.weights.regular.primary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heatmapContainer: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: 12,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  svgWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PrayerHeatmap;
