import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Design system - spacing units
const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// Convert time string to minutes since midnight
const timeToMinutes = (timeStr) => {
  const [time, period] = timeStr.split(' ');
  const parts = time.split(':').map(Number);
  const hours = parts[0];
  const minutes = parts[1] || 0;
  const seconds = parts[2] || 0;
  
  let totalMinutes = hours * 60 + minutes + (seconds / 60);
  if (period === 'PM' && hours !== 12) totalMinutes += 12 * 60;
  if (period === 'AM' && hours === 12) totalMinutes -= 12 * 60;
  return totalMinutes;
};

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
                size={24}
                color={isPast ? "#666" : "#FFFFFF"}
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
                colors={['#15141A', '#1F1E26', '#1F1E26', '#15141A']}
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
    backgroundColor: '#15141A',
    borderRadius: 32,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: '#23232A',
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
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'SpaceGrotesk_500Medium',
    marginLeft: SPACING.sm,
  },
  prayerNamePast: {
    color: '#666',
  },
  prayerTimeText: {
    color: '#B0B0B8',
    fontSize: 16,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  prayerTimeTextPast: {
    color: '#666',
  },
});

export default PrayerList;


