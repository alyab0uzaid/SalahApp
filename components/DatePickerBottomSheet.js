import React, { useMemo, useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Calendar } from 'react-native-calendars';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';
import { LocaleConfig } from 'react-native-calendars';

// Configure locale for calendar
LocaleConfig.locales['en'] = {
  monthNames: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ],
  monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  dayNamesShort: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
};
LocaleConfig.defaultLocale = 'en';

// Helper function to format date as YYYY-MM-DD in local timezone
const formatDateLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const DatePickerBottomSheet = ({ bottomSheetRef, selectedDate, onDateSelect, prayerStatus }) => {
  // Track displayed month - always start with selectedDate
  const [displayMonth, setDisplayMonth] = useState(selectedDate);
  const [sheetKey, setSheetKey] = useState(0);
  const [useSelectedDate, setUseSelectedDate] = useState(true);

  // Reset to selected date whenever selectedDate changes
  useEffect(() => {
    setDisplayMonth(selectedDate);
    setUseSelectedDate(true);
    setSheetKey(prev => prev + 1); // Force remount
  }, [selectedDate]);

  // Reset to selected date whenever sheet closes (so it's ready for next open)
  const handleSheetChange = (index) => {
    if (index < 0) {
      // Sheet is closing - reset to selected date so it's ready for next open
      setDisplayMonth(selectedDate);
      setUseSelectedDate(true);
      setSheetKey(prev => prev + 1); // Force remount to ensure correct month
    }
  };

  // Backdrop component - renders a semi-transparent overlay
  const renderBackdrop = (props) => (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      opacity={0.5}
      pressBehavior="close"
    />
  );

  if (!selectedDate) return null;

  // Format selected date for Calendar component (YYYY-MM-DD) in local timezone
  const selectedDateString = formatDateLocal(selectedDate);

  // Get today's date string in local timezone
  // formatDateLocal already uses local time methods (getFullYear, getMonth, getDate)
  const now = new Date();
  const todayDateString = formatDateLocal(now);

  // Create marked dates object
  const markedDates = useMemo(() => {
    const marked = {};

    // Mark today - if selected, show filled circle; otherwise show dot
    // Only mark todayDateString once to ensure we don't accidentally mark tomorrow
    if (todayDateString === selectedDateString) {
      // If today is selected, show it as selected (filled circle, no dot)
      marked[todayDateString] = {
        selected: true,
        selectedColor: COLORS.text.primary,
        marked: false, // Explicitly set to false to prevent any dot
        customStyles: {
          container: {
            backgroundColor: COLORS.text.primary,
            borderRadius: 16,
          },
          text: {
            color: COLORS.background.primary,
            fontFamily: FONTS.weights.medium.primary,
          },
        },
      };
    } else {
      // If today is not selected, show dot under today (no circle)
      marked[todayDateString] = {
        marked: true,
        dotColor: COLORS.text.primary,
      };
    }

    // Mark the selected date (if not today)
    if (selectedDateString !== todayDateString) {
      marked[selectedDateString] = {
        selected: true,
        selectedColor: COLORS.text.primary,
        customStyles: {
          container: {
            backgroundColor: COLORS.text.primary,
            borderRadius: 16,
          },
          text: {
            color: COLORS.background.primary,
            fontFamily: FONTS.weights.medium.primary,
          },
        },
      };
    }

    // Mark dates that have prayer tracking data
    if (prayerStatus) {
      Object.keys(prayerStatus).forEach(dateKey => {
        if (Object.keys(prayerStatus[dateKey]).length > 0) {
          if (!marked[dateKey]) {
            marked[dateKey] = {};
          }
          // Add dot for prayer tracking (only if not already marked for today or selected)
          if (dateKey !== todayDateString && dateKey !== selectedDateString) {
            marked[dateKey].marked = true;
            marked[dateKey].dotColor = COLORS.text.secondary;
          }
        }
      });
    }

    return marked;
  }, [selectedDateString, prayerStatus, todayDateString]);

  // Handle date selection
  const handleDayPress = (day) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onDateSelect) {
      // Use dateString (YYYY-MM-DD) and parse in local timezone to avoid day-before issue
      const [year, month, date] = day.dateString.split('-').map(Number);
      const newDate = new Date(year, month - 1, date);
      onDateSelect(newDate);
      // Close the bottom sheet after selection
      bottomSheetRef.current?.close();
    }
  };

  // Custom header component
  const renderHeader = () => {
    const monthNames = LocaleConfig.locales['en'].monthNames;
    const month = displayMonth.getMonth();
    const year = displayMonth.getFullYear();

    const handlePrevMonth = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const newDate = new Date(displayMonth);
      newDate.setMonth(newDate.getMonth() - 1);
      setDisplayMonth(newDate);
    };

    const handleNextMonth = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const newDate = new Date(displayMonth);
      newDate.setMonth(newDate.getMonth() + 1);
      setDisplayMonth(newDate);
    };

    return (
      <View style={styles.customHeader}>
        <Text style={styles.headerTitle}>
          {monthNames[month]} {year}
        </Text>
        <View style={styles.arrowContainer}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.arrowButton}>
            <Text style={styles.arrow}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNextMonth} style={styles.arrowButton}>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1} // Start closed
      enablePanDownToClose={true}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      backdropComponent={renderBackdrop}
      enableDynamicSizing={true}
      onChange={handleSheetChange}
    >
      <BottomSheetView style={styles.contentContainer}>
        <Calendar
          key={`${selectedDateString}-${sheetKey}`}
          current={useSelectedDate ? selectedDateString : formatDateLocal(displayMonth)}
          onDayPress={handleDayPress}
          markedDates={markedDates}
          markingType={'custom'}
          enableSwipeMonths={true}
          onMonthChange={(month) => {
            setDisplayMonth(new Date(month.timestamp));
            setUseSelectedDate(false); // Switch to using displayMonth after navigation
          }}
          onVisibleMonthsChange={(months) => {
            if (months.length > 0) {
              setDisplayMonth(new Date(months[0].timestamp));
              setUseSelectedDate(false); // Switch to using displayMonth after navigation
            }
          }}
          theme={{
            backgroundColor: COLORS.background.secondary,
            calendarBackground: COLORS.background.secondary,
            textSectionTitleColor: COLORS.text.secondary,
            selectedDayBackgroundColor: COLORS.text.primary,
            selectedDayTextColor: COLORS.background.primary,
            todayTextColor: COLORS.text.primary,
            dayTextColor: COLORS.text.secondary,
            textDisabledColor: COLORS.text.disabled,
            textMonthFontFamily: FONTS.weights.medium.primary,
            textDayFontFamily: FONTS.weights.regular.primary,
            textDayHeaderFontFamily: FONTS.weights.medium.primary,
            arrowColor: COLORS.text.secondary,
            monthTextColor: COLORS.text.primary,
            textDayFontSize: FONTS.sizes.md,
            textMonthFontSize: FONTS.sizes.lg,
            textDayHeaderFontSize: FONTS.sizes.sm,
          }}
          style={styles.calendar}
        />
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: COLORS.background.secondary,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
  },
  handleIndicator: {
    backgroundColor: COLORS.text.tertiary,
    width: 40,
  },
  contentContainer: {
    paddingHorizontal: SPACING.sm,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  calendar: {
    borderRadius: RADIUS.md,
  },
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: SPACING.md,
    paddingHorizontal: 0, // Match calendar's padding
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FONTS.weights.medium.primary,
    color: COLORS.text.primary,
  },
  arrowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm, // More space between arrows
  },
  arrowButton: {
    padding: SPACING.sm,
  },
  arrow: {
    fontSize: 28,
    color: COLORS.text.secondary,
    fontFamily: FONTS.weights.regular.primary,
  },
});

export default DatePickerBottomSheet;
