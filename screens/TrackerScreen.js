import React from 'react';
import { ScrollView, StyleSheet, View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import PrayerList from '../components/PrayerList';
import PrayerHeatmap from '../components/PrayerHeatmap';
import PrayerTrend from '../components/PrayerTrend';
import DatePicker from '../components/DatePicker';
import { COLORS, SPACING, FONTS, ICON_SIZES, RADIUS } from '../constants/theme';

export default function TrackerScreen({
  prayerStatus,
  prayerTimes,
  prayerNames,
  currentTime,
  selectedDate,
  setSelectedDate,
  handlePrayerStatusUpdate,
  handlePrayerPress,
  notifications,
  handleDatePickerPress,
  locationName,
}) {
  const insets = useSafeAreaInsets();
  
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

  // Check if selected date is in the past or future
  const isPastDate = () => {
    if (!selectedDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    return selected < today;
  };

  const handleGoToToday = () => {
    setSelectedDate(new Date());
  };

  // Filter out Sunrise from the prayer list (Sunrise is not a prayer to track)
  const filteredPrayerNames = prayerNames.filter(name => name !== 'Sunrise');
  const filteredPrayerTimes = prayerTimes.filter((time, index) => prayerNames[index] !== 'Sunrise');
  
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top }]}
      showsVerticalScrollIndicator={false}
      clipsToBounds={false}
    >
      <Pressable
        style={[
          styles.todayButton,
          isToday() ? styles.todayButtonActive : styles.todayButtonInactive
        ]}
        onPress={!isToday() ? () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          handleGoToToday();
        } : undefined}
      >
        {!isToday() && !isPastDate() && (
          <FontAwesome
            name="arrow-left"
            size={ICON_SIZES.sm}
            color={COLORS.text.tertiary}
            style={styles.arrowIconLeft}
          />
        )}
        <Text style={isToday() ? styles.todayTextActive : styles.todayText}>Today</Text>
        {!isToday() && isPastDate() && (
          <FontAwesome
            name="arrow-right"
            size={ICON_SIZES.sm}
            color={COLORS.text.tertiary}
            style={styles.arrowIconRight}
          />
        )}
      </Pressable>
      <DatePicker
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onDatePress={handleDatePickerPress}
        style={styles.datePicker}
      />
      <PrayerList
        prayerTimes={filteredPrayerTimes}
        prayerNames={filteredPrayerNames}
        currentTime={currentTime}
        style={styles.prayerList}
        selectedDate={selectedDate}
        onPrayerStatusUpdate={handlePrayerStatusUpdate}
        prayerStatus={prayerStatus}
        onPrayerPress={handlePrayerPress}
        notifications={notifications}
      />
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
    overflow: 'visible',
  },
  todayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md - 4, // 12px
    paddingVertical: SPACING.xs + 2, // 6px
    backgroundColor: COLORS.background.secondary,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    alignSelf: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  todayButtonActive: {
    borderColor: COLORS.text.primary,
  },
  todayButtonInactive: {
    borderColor: COLORS.border.primary,
  },
  todayText: {
    color: COLORS.text.tertiary,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.weights.regular.primary,
  },
  todayTextActive: {
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.weights.regular.primary,
  },
  arrowIconLeft: {
    marginRight: SPACING.xs + 2, // 6px
  },
  arrowIconRight: {
    marginLeft: SPACING.xs + 2, // 6px
  },
  datePicker: {
    marginBottom: SPACING.md,
  },
  prayerList: {
    marginTop: 0,
  },
});
