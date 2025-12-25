import React, { useRef } from 'react';
import { StyleSheet, Platform, Dimensions, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ArchTimer from '../components/ArchTimer';
import SimplePrayerList from '../components/SimplePrayerList';
import LocationTag from '../components/LocationTag';
import DatePicker from '../components/DatePicker';
import { COLORS, SPACING, ICON_SIZES, FONTS } from '../constants/theme';

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

  // Tab bar height - only account for icon area, not the internal padding
  // The tab bar has paddingBottom internally, so we only need to account for icon + top padding
  const tabBarIconArea = SPACING.sm + ICON_SIZES.lg + SPACING.xs;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header for Screenshots */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Home</Text>
      </View>
      
      {/* Top Section - Location and Arch */}
      <View style={styles.topSection}>
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
      </View>

      {/* Spacer - Flexible space in the middle */}
      <View style={styles.spacer} />

      {/* Bottom Section - Date Picker and Prayer List - positioned at bottom */}
      <View style={[styles.bottomSection, { marginBottom: tabBarIconArea }]}>
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
        <SimplePrayerList
          prayerTimes={prayerTimes}
          prayerNames={prayerNames}
          currentTime={currentTime}
          style={styles.prayerList}
          selectedDate={selectedDate}
          prayerStatus={prayerStatus}
          onPrayerPress={handlePrayerPress}
          notifications={notifications}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: COLORS.background.primary,
  },
  topSection: {
    alignItems: 'center',
    width: '100%',
  },
  spacer: {
    flex: 1,
  },
  bottomSection: {
    alignItems: 'center',
    width: '100%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  locationTag: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  archTimer: {
    marginBottom: 0,
  },
  datePicker: {
    marginBottom: SPACING.md,
  },
  prayerList: {
    marginTop: 0,
  },
  headerContainer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerText: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.weights.bold.primary,
    color: COLORS.text.primary,
    letterSpacing: 1,
  },
});
