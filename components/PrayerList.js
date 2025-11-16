import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Design system - spacing units
const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const PrayerList = ({ prayerTimes, prayerNames }) => {
  return (
    <View style={styles.prayerList}>
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

        return (
          <View key={name} style={styles.prayerRow}>
            <View style={styles.prayerInfo}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name={iconName}
                  size={22}
                  color="#FFFFFF"
                />
              </View>
              <Text style={styles.prayerName}>{name}</Text>
            </View>
            <Text style={styles.prayerTimeText}>{time}</Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  prayerList: {
    width: '90%',
    marginTop: SPACING.md,
    backgroundColor: '#15141A',
    borderRadius: 16,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: '#23232A',
    alignSelf: 'center',
  },
  prayerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  prayerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1F1E26',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  prayerName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'SpaceGrotesk_500Medium',
  },
  prayerTimeText: {
    color: '#B0B0B8',
    fontSize: 16,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
});

export default PrayerList;


