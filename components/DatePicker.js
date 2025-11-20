import React, { memo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, ICON_SIZES } from '../constants/theme';
import 'hijri-date';

const DatePickerComponent = ({ selectedDate, onDateChange, style }) => {
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
      // The hijri-date library extends Date with toHijri() method
      if (typeof date.toHijri === 'function') {
        const hijri = date.toHijri();
        const monthNames = [
          'Muharram', 'Safar', 'Rabi\' al-awwal', 'Rabi\' al-thani',
          'Jumada al-awwal', 'Jumada al-thani', 'Rajab', 'Sha\'ban',
          'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
        ];
        
        const day = hijri.getDate();
        const month = hijri.getMonth();
        const year = hijri.getFullYear();
        
        return `${day} ${monthNames[month]} ${year} AH`;
      }
      return '';
    } catch (error) {
      console.warn('Hijri date conversion error:', error);
      return '';
    }
  };

  const handlePreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
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

      <View style={styles.dateContainer}>
        <Text style={styles.gregorianDate}>{formattedDate}</Text>
        {hijriDate && (
          <Text style={styles.hijriDate}>{hijriDate}</Text>
        )}
      </View>

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
    backgroundColor: 'rgba(21, 20, 26, 0.3)',
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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

