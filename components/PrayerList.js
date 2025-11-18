import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { timeToMinutes } from '../utils/timeUtils';
import { COLORS, FONTS, SPACING, RADIUS, ICON_SIZES } from '../constants/theme';

const PrayerList = ({ prayerTimes, prayerNames, currentTime, style }) => {
  // Get current time in minutes
  const currentMinutes = currentTime ? timeToMinutes(currentTime) : null;
  
  // Convert all prayer times to minutes
  const timesInMinutes = prayerTimes.map(time => timeToMinutes(time));
  
  // Determine which prayer is current and which are past
  const getPrayerStatus = (index) => {
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
        
        const rowContent = (
          <View style={styles.prayerRowContent}>
            <View style={styles.prayerInfo}>
              <MaterialCommunityIcons
                name={iconName}
                size={ICON_SIZES.md}
                color={isPast ? COLORS.text.disabled : COLORS.text.primary}
                style={styles.roundedIcon}
              />
              <Text style={[styles.prayerName, isPast && styles.prayerNamePast]}>{name}</Text>
            </View>
            <Text style={[styles.prayerTimeText, isPast && styles.prayerTimeTextPast]}>{time}</Text>
          </View>
        );

        return (
          <View key={name} style={styles.prayerRow}>
            {isCurrent ? (
              <LinearGradient
                colors={[
                  COLORS.background.secondary,
                  COLORS.background.tertiary,
                  COLORS.background.tertiary,
                  COLORS.background.secondary
                ]}
                locations={[0, 0.2, 0.8, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.currentPrayerGradient}
              >
                {rowContent}
              </LinearGradient>
            ) : (
              rowContent
            )}
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
    backgroundColor: COLORS.background.secondary,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    alignSelf: 'center',
  },
  prayerRow: {
    paddingVertical: SPACING.sm,
  },
  prayerRowContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentPrayerGradient: {
    marginHorizontal: -SPACING.md, // Extend to edges of container
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  prayerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roundedIcon: {
    // Icons will render with their natural rounded style
  },
  prayerName: {
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.weights.medium.primary,
    marginLeft: SPACING.sm,
  },
  prayerNamePast: {
    color: COLORS.text.disabled,
  },
  prayerTimeText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.weights.regular.primary,
  },
  prayerTimeTextPast: {
    color: COLORS.text.disabled,
  },
});

export default PrayerList;


