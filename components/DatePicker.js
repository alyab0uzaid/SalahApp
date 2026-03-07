import React, { memo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, SPACING, RADIUS, ICON_SIZES } from '../constants/theme';
import { toHijri } from 'hijri-converter';

const HIJRI_MONTH_NAMES = [
  'Muharram', 'Safar', 'Rabi\' al-awwal', 'Rabi\' al-thani',
  'Jumada al-awwal', 'Jumada al-thani', 'Rajab', 'Sha\'ban',
  'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
];

const DatePickerComponent = ({ selectedDate, onDateChange, style, onDatePress }) => {
  const formatDate = (date) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const formatShortDate = (date) => {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const getHijriDate = (date) => {
    try {
      const gYear = date.getFullYear();
      const gMonth = date.getMonth() + 1;
      const gDay = date.getDate();
      const { hy, hm, hd } = toHijri(gYear, gMonth, gDay);
      const monthName = HIJRI_MONTH_NAMES[hm - 1];
      return `${hd} ${monthName} ${hy} AH`;
    } catch (error) {
      return '';
    }
  };

  const handlePreviousDay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  const handleNextDay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
  };

  const handleDatePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDatePress();
  };

  const hijriDate = getHijriDate(selectedDate);
  const formattedDate = formatShortDate(selectedDate);

  return (
    <View style={[styles.datePicker, style]}>
      <TouchableOpacity
        onPress={handlePreviousDay}
        style={styles.arrowButton}
        activeOpacity={0.6}
      >
        <MaterialCommunityIcons
          name="chevron-left"
          size={ICON_SIZES.md}
          color={COLORS.text.secondary}
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleDatePress}
        style={styles.dateContainer}
        activeOpacity={0.6}
      >
        <Text style={styles.gregorianDate}>{formattedDate}</Text>
        {hijriDate && (
          <Text style={styles.hijriDate}>{hijriDate}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleNextDay}
        style={styles.arrowButton}
        activeOpacity={0.6}
      >
        <MaterialCommunityIcons
          name="chevron-right"
          size={ICON_SIZES.md}
          color={COLORS.text.secondary}
        />
      </TouchableOpacity>
    </View>
  );
};

// Memoize component - only re-render when selectedDate changes
const DatePicker = memo(DatePickerComponent, (prevProps, nextProps) => {
  return prevProps.selectedDate?.getTime() === nextProps.selectedDate?.getTime();
});

const styles = StyleSheet.create({
  datePicker: {
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  arrowButton: {
    padding: SPACING.xs,
  },
  dateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gregorianDate: {
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.weights.bold.primary,
    textAlign: 'center',
  },
  hijriDate: {
    color: COLORS.text.tertiary,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.weights.regular.primary,
    textAlign: 'center',
    marginTop: SPACING.xs / 2,
  },
});

export default DatePicker;

