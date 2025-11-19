import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { timeToMinutes } from '../utils/timeUtils';
import { COLORS, FONTS, SPACING, RADIUS, ICON_SIZES } from '../constants/theme';

const PrayerList = ({ prayerTimes, prayerNames, currentTime, style, onNotificationToggle, selectedDate }) => {
  // State to track which prayers have notifications enabled
  const [notifications, setNotifications] = useState(
    prayerNames.reduce((acc, name) => ({ ...acc, [name]: false }), {})
  );

  const handleBellPress = (prayerName) => {
    const newState = !notifications[prayerName];
    setNotifications(prev => ({ ...prev, [prayerName]: newState }));
    if (onNotificationToggle) {
      onNotificationToggle(prayerName, newState);
    }
  };
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

  // Determine which prayer is current and which are past (only if viewing today)
  const getPrayerStatus = (index) => {
    // If not viewing today, nothing is past or current
    if (!isCurrentDateToday) {
      return { isPast: false, isCurrent: false };
    }

    if (!currentMinutes) return { isPast: false, isCurrent: false };
    
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
      {prayerNames.map((name, index) => {
        const time = prayerTimes[index];

        const iconName = (() => {
          switch (name.toLowerCase()) {
            case 'fajr':
              return 'weather-night';
            case 'sunrise':
              return 'weather-sunset-up';
            case 'dhuhr':
              return 'white-balance-sunny';
            case 'asr':
              return 'weather-sunset';
            case 'maghrib':
              return 'weather-sunset-down';
            case 'isha':
              return 'moon-waning-crescent';
            default:
              return 'clock-outline';
          }
        })();

        const { isPast, isCurrent } = getPrayerStatus(index);
        const hasNotification = notifications[name];

        return (
          <View key={name} style={styles.prayerRow}>
            <View style={styles.prayerRowContent}>
              <View style={styles.prayerInfo}>
                <MaterialCommunityIcons
                  name={iconName}
                  size={22}
                  color={isPast ? COLORS.text.disabled : isCurrent ? COLORS.text.primary : COLORS.text.secondary}
                />
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
                <TouchableOpacity
                  onPress={() => handleBellPress(name)}
                  style={styles.bellButton}
                  activeOpacity={0.6}
                >
                  <MaterialCommunityIcons
                    name={hasNotification ? 'bell' : 'bell-outline'}
                    size={22}
                    color={hasNotification ? COLORS.text.primary : COLORS.text.tertiary}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  prayerList: {
    width: '90%',
    marginTop: 0, // Spacing handled by wrapper in App.js
    backgroundColor: 'rgba(21, 20, 26, 0.3)', // Semi-transparent glass effect
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)', // Subtle glass border
    alignSelf: 'center',
    overflow: 'hidden',
  },
  prayerRow: {
    paddingVertical: SPACING.sm,
    paddingLeft: SPACING.sm,
    paddingRight: SPACING.sm,
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
    marginLeft: SPACING.md,
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
    color: COLORS.text.tertiary,
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
  bellButton: {
    paddingVertical: SPACING.xs,
    paddingLeft: SPACING.sm,
    paddingRight: 0,
    marginLeft: SPACING.sm,
  },
});

export default PrayerList;


