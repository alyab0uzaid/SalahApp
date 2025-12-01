import React, { useRef } from 'react';
import { ScrollView, StyleSheet, Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ArchTimer from '../components/ArchTimer';
import PrayerList from '../components/PrayerList';
import PrayerHeatmap from '../components/PrayerHeatmap';
import PrayerTrend from '../components/PrayerTrend';
import LocationTag from '../components/LocationTag';
import DatePicker from '../components/DatePicker';
import { COLORS, SPACING } from '../constants/theme';

export default function HomeScreen({
  location,
  locationName,
  prayerTimes,
  prayerNames,
  currentTime,
  selectedDate,
  setSelectedDate,
  prayerStatus,
  handlePrayerStatusUpdate,
  handlePrayerPress,
  notifications,
  handleSwipeToConfirm,
  handleDatePickerPress,
  todayPrayerTimesRef,
  setPrayerTimes,
}) {
  const archTimerRef = useRef(null);
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + SPACING.lg }]}
      showsVerticalScrollIndicator={false}
      clipsToBounds={false}
    >
      <LocationTag
        locationName={locationName}
        style={styles.locationTag}
      />
      <ArchTimer
        ref={archTimerRef}
        prayerTimes={prayerTimes}
        prayerNames={prayerNames}
        currentTime={currentTime}
        width={Dimensions.get('window').width}
        height={200}
        style={styles.archTimer}
        selectedDate={selectedDate}
        isVisible={true}
        onGoToToday={() => {
          const today = new Date();
          const currentDate = selectedDate;
          const isAlreadyToday = currentDate &&
            currentDate.getDate() === today.getDate() &&
            currentDate.getMonth() === today.getMonth() &&
            currentDate.getFullYear() === today.getFullYear();
          if (!isAlreadyToday) {
            if (archTimerRef.current) {
              archTimerRef.current.animateToToday();
            }
            if (todayPrayerTimesRef.current) {
              setPrayerTimes(todayPrayerTimesRef.current);
            }
            setSelectedDate(today);
          }
        }}
      />
      <DatePicker
        selectedDate={selectedDate}
        onDateChange={(newDate) => {
          const today = new Date();
          const isNewDateToday = newDate.getDate() === today.getDate() &&
            newDate.getMonth() === today.getMonth() &&
            newDate.getFullYear() === today.getFullYear();

          if (isNewDateToday) {
            if (archTimerRef.current) {
              archTimerRef.current.animateToToday();
            }
            if (todayPrayerTimesRef.current) {
              setPrayerTimes(todayPrayerTimesRef.current);
            }
          }
          setSelectedDate(newDate);
        }}
        onDatePress={handleDatePickerPress}
        style={styles.datePicker}
      />
      <PrayerList
        prayerTimes={prayerTimes}
        prayerNames={prayerNames}
        currentTime={currentTime}
        style={styles.prayerList}
        selectedDate={selectedDate}
        onPrayerStatusUpdate={handlePrayerStatusUpdate}
        prayerStatus={prayerStatus}
        onPrayerPress={handlePrayerPress}
        notifications={notifications}
        onSwipeToConfirm={handleSwipeToConfirm}
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
  locationTag: {
    marginBottom: SPACING.xxl,
  },
  archTimer: {
    marginBottom: SPACING.lg,
  },
  datePicker: {
    marginBottom: SPACING.md,
  },
  prayerList: {
    marginTop: 0,
  },
});
