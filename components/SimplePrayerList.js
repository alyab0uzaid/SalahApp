import React, { memo } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { timeToMinutes } from '../utils/timeUtils';
import { COLORS, FONTS, SPACING, RADIUS, ICON_SIZES } from '../constants/theme';

const SimplePrayerListComponent = ({ prayerTimes, prayerNames, currentTime, style, selectedDate, onPrayerPress, notifications = {}, prayerStatus }) => {
  // Get current time in minutes
  const currentMinutes = currentTime ? timeToMinutes(currentTime) : null;
  
  // Convert all prayer times to minutes
  const timesInMinutes = prayerTimes.map(time => timeToMinutes(time));
  
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

  // Determine if a prayer is past, current, or future
  const getPrayerStatus = (index) => {
    if (!isCurrentDateToday || !currentMinutes || timesInMinutes.length === 0) {
      return { isPast: false, isCurrent: false };
    }

    const prayerMinutes = timesInMinutes[index];
    const nextPrayerMinutes = index < timesInMinutes.length - 1 
      ? timesInMinutes[index + 1] 
      : timesInMinutes[0] + (24 * 60); // Next day's first prayer
    
    // A prayer is current if we're between its time and the next prayer time
    const isCurrent = currentMinutes >= prayerMinutes && currentMinutes < nextPrayerMinutes;
    
    // A prayer is past if:
    // 1. We're past its time AND it's not the current prayer
    // 2. Handle wrap-around: if we're past Isha (last prayer), all previous prayers today are past
    let isPast = false;
    if (isCurrent) {
      isPast = false;
    } else {
      // If we're past the last prayer (Isha), all prayers are past
      if (currentMinutes >= timesInMinutes[timesInMinutes.length - 1]) {
        isPast = true;
      } else {
        // Otherwise, a prayer is past if current time has passed it
        isPast = currentMinutes > prayerMinutes;
      }
    }
    
    return { isPast, isCurrent };
  };

  return (
    <View style={[styles.prayerList, style]}>
      {prayerTimes.map((time, index) => {
        const name = prayerNames[index];
        if (!name || !time) return null;

        const { isPast, isCurrent } = getPrayerStatus(index);
        const hasNotification = notifications[name];
        const isSunrise = name.toLowerCase() === 'sunrise';

        return (
          <Pressable
            key={name}
            style={[
              styles.prayerRow,
              isCurrent && styles.prayerRowCurrent
            ]}
            onPress={() => {
              if (onPrayerPress && !isSunrise) {
                onPrayerPress({ name, time, index });
              }
            }}
          >
            <View style={styles.prayerRowContent}>
              <View style={styles.prayerInfo}>
                <Text style={[
                  styles.prayerName,
                  isPast && styles.prayerNamePast,
                  isCurrent && styles.prayerNameActive
                ]}>
                  {name}
                </Text>
              </View>
              <View style={styles.timeAndBell}>
                <Text style={[
                  styles.prayerTimeText,
                  isPast && styles.prayerTimeTextPast,
                  isCurrent && styles.prayerTimeTextActive
                ]}>
                  {time}
                </Text>
                <View style={styles.bellIcon}>
                  <MaterialCommunityIcons
                    name={hasNotification ? 'bell' : 'bell-off-outline'}
                    size={18}
                    color={COLORS.text.tertiary}
                  />
                </View>
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};

// Memoize component to prevent unnecessary re-renders
const SimplePrayerList = memo(SimplePrayerListComponent);

const styles = StyleSheet.create({
  prayerList: {
    width: '90%',
    marginTop: 0,
    alignSelf: 'center',
  },
  prayerRow: {
    paddingVertical: SPACING.sm + 2,
    paddingLeft: SPACING.md + 4,
    paddingRight: SPACING.md + 4,
    backgroundColor: COLORS.background.secondary,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: SPACING.sm + 2,
  },
  prayerRowCurrent: {
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
  },
  prayerRowContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prayerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  prayerName: {
    color: COLORS.text.secondary,
    fontSize: 17,
    fontFamily: FONTS.weights.regular.primary,
  },
  prayerNamePast: {
    color: COLORS.text.disabled,
    opacity: 0.5,
  },
  prayerNameActive: {
    color: COLORS.text.primary,
    fontFamily: FONTS.weights.medium.primary,
  },
  timeAndBell: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prayerTimeText: {
    color: COLORS.text.primary,
    fontSize: 17,
    fontFamily: FONTS.weights.regular.primary,
  },
  prayerTimeTextPast: {
    color: COLORS.text.disabled,
    opacity: 0.5,
  },
  prayerTimeTextActive: {
    color: COLORS.text.primary,
    fontFamily: FONTS.weights.medium.primary,
  },
  bellIcon: {
    marginLeft: SPACING.md,
  },
});

export default SimplePrayerList;

