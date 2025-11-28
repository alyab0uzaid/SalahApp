import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Calendar } from 'react-native-calendars';
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

const DatePickerBottomSheet = ({ bottomSheetRef, selectedDate, onDateSelect, prayerStatus }) => {
  // Snap points for the bottom sheet - 75% of screen height
  const snapPoints = useMemo(() => ['75%'], []);

  // Track current month for custom header - reset to selectedDate when sheet opens
  const [currentMonth, setCurrentMonth] = useState(selectedDate);

  // Reset to selected date when sheet opens
  const handleSheetChange = (index) => {
    if (index === 0) {
      // Sheet is opening - reset to selected date
      setCurrentMonth(selectedDate);
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

  // Format selected date for Calendar component (YYYY-MM-DD)
  const selectedDateString = selectedDate.toISOString().split('T')[0];

  // Get today's date string
  const todayDateString = new Date().toISOString().split('T')[0];

  // Create marked dates object
  const markedDates = useMemo(() => {
    const marked = {};

    // Mark today with a circle (border only, not filled)
    if (todayDateString === selectedDateString) {
      // If today is selected, show it as selected with today circle
      marked[todayDateString] = {
        selected: true,
        selectedColor: COLORS.text.primary,
        customStyles: {
          container: {
            backgroundColor: COLORS.text.primary,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: COLORS.text.primary,
          },
          text: {
            color: COLORS.background.primary,
            fontFamily: FONTS.weights.medium.primary,
          },
        },
      };
    } else {
      // Mark today with a circle border (not filled)
      marked[todayDateString] = {
        customStyles: {
          container: {
            borderWidth: 1,
            borderColor: COLORS.text.primary,
            borderRadius: 16,
            backgroundColor: 'transparent',
          },
          text: {
            color: COLORS.text.primary,
          },
        },
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
          // Add dot for prayer tracking
          marked[dateKey].marked = true;
          marked[dateKey].dotColor = dateKey === selectedDateString ? COLORS.background.primary : COLORS.text.secondary;
        }
      });
    }

    return marked;
  }, [selectedDateString, prayerStatus, todayDateString]);

  // Handle date selection
  const handleDayPress = (day) => {
    if (onDateSelect) {
      const newDate = new Date(day.timestamp);
      onDateSelect(newDate);
      // Close the bottom sheet after selection
      bottomSheetRef.current?.close();
    }
  };

  // Custom header component
  const renderHeader = () => {
    const monthNames = LocaleConfig.locales['en'].monthNames;
    const month = currentMonth.getMonth();
    const year = currentMonth.getFullYear();

    const handlePrevMonth = () => {
      const newDate = new Date(currentMonth);
      newDate.setMonth(newDate.getMonth() - 1);
      setCurrentMonth(newDate);
    };

    const handleNextMonth = () => {
      const newDate = new Date(currentMonth);
      newDate.setMonth(newDate.getMonth() + 1);
      setCurrentMonth(newDate);
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
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      backdropComponent={renderBackdrop}
      enableDynamicSizing={false}
      onChange={handleSheetChange}
    >
      <BottomSheetView style={styles.contentContainer}>
        <Calendar
          key={currentMonth.toISOString()}
          current={currentMonth.toISOString().split('T')[0]}
          onDayPress={handleDayPress}
          markedDates={markedDates}
          markingType={'custom'}
          enableSwipeMonths={true}
          onMonthChange={(month) => {
            setCurrentMonth(new Date(month.timestamp));
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
    flex: 1,
    paddingHorizontal: SPACING.lg,
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
