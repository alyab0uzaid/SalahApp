import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PrayerHeatmap from '../components/PrayerHeatmap';
import PrayerTrend from '../components/PrayerTrend';
import { COLORS, SPACING } from '../constants/theme';

export default function TrackerScreen({ prayerStatus }) {
  const insets = useSafeAreaInsets();
  
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + SPACING.lg }]}
      showsVerticalScrollIndicator={false}
    >
      <PrayerTrend prayerStatus={prayerStatus} />
      <PrayerHeatmap prayerStatus={prayerStatus} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    width: '100%',
    backgroundColor: COLORS.background.primary,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    paddingBottom: SPACING.lg,
  },
});
