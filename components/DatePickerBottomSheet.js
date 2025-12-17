import React, { useState, useEffect, useImperativeHandle, forwardRef, useMemo, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, Animated } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Picker } from 'react-native-wheel-pick';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { COLORS, FONTS, SPACING, RADIUS, ICON_SIZES } from '../constants/theme';
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

const DatePickerBottomSheet = forwardRef(({ selectedDate, onDateSelect, prayerStatus }, ref) => {
  const bottomSheetRef = useRef(null);
  const [displayMonth, setDisplayMonth] = useState(selectedDate);
  const [sheetKey, setSheetKey] = useState(0);
  const [useSelectedDate, setUseSelectedDate] = useState(true);
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);
  const [selectedYearIndex, setSelectedYearIndex] = useState(0);
  
  // Animation for chevron rotation
  const chevronRotation = useRef(new Animated.Value(0)).current;
  // Animation for arrows opacity
  const arrowsOpacity = useRef(new Animated.Value(1)).current;
  // Animation for calendar opacity
  const calendarOpacity = useRef(new Animated.Value(1)).current;
  // Animation for picker opacity
  const pickerOpacity = useRef(new Animated.Value(0)).current;

  // Generate years array (±25 years from current year)
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const yearList = [];
    for (let year = currentYear - 25; year <= currentYear + 25; year++) {
      yearList.push(year.toString());
    }
    return yearList;
  }, [currentYear]);

  const monthNames = LocaleConfig.locales['en'].monthNames;

  // Reset to selected date whenever selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      setDisplayMonth(selectedDate);
      setUseSelectedDate(true);
      setSheetKey(prev => prev + 1);
      
      // Set initial picker values
      const month = selectedDate.getMonth();
      const year = selectedDate.getFullYear();
      setSelectedMonthIndex(month);
      const yearIndex = years.indexOf(year.toString());
      if (yearIndex >= 0) {
        setSelectedYearIndex(yearIndex);
      }
    }
  }, [selectedDate, years]);

  // Update picker when displayMonth changes
  useEffect(() => {
    if (displayMonth) {
      const month = displayMonth.getMonth();
      const year = displayMonth.getFullYear();
      setSelectedMonthIndex(month);
      const yearIndex = years.indexOf(year.toString());
      if (yearIndex >= 0) {
        setSelectedYearIndex(yearIndex);
      }
    }
  }, [displayMonth, years]);

  // Animate chevron rotation, arrows opacity, calendar and picker opacity when picker opens/closes
  useEffect(() => {
    Animated.parallel([
      Animated.timing(chevronRotation, {
        toValue: showMonthYearPicker ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(arrowsOpacity, {
        toValue: showMonthYearPicker ? 0 : 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(calendarOpacity, {
        toValue: showMonthYearPicker ? 0 : 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(pickerOpacity, {
        toValue: showMonthYearPicker ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [showMonthYearPicker]);

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

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    open: () => {
      if (selectedDate) {
        setDisplayMonth(selectedDate);
        setUseSelectedDate(true);
        setSheetKey(prev => prev + 1);
        
        const month = selectedDate.getMonth();
        const year = selectedDate.getFullYear();
        setSelectedMonthIndex(month);
        const yearIndex = years.indexOf(year.toString());
        if (yearIndex >= 0) {
          setSelectedYearIndex(yearIndex);
        }
      }
      requestAnimationFrame(() => {
        bottomSheetRef.current?.snapToIndex(0);
      });
    },
    close: () => {
      bottomSheetRef.current?.close();
      setShowMonthYearPicker(false);
      if (selectedDate) {
        setDisplayMonth(selectedDate);
        setUseSelectedDate(true);
        setSheetKey(prev => prev + 1);
      }
    },
    snapToIndex: (index) => {
      if (index >= 0) {
        if (selectedDate) {
          setDisplayMonth(selectedDate);
          setUseSelectedDate(true);
          setSheetKey(prev => prev + 1);
        }
        requestAnimationFrame(() => {
          bottomSheetRef.current?.snapToIndex(0);
        });
      } else {
        bottomSheetRef.current?.close();
        setShowMonthYearPicker(false);
        if (selectedDate) {
          setDisplayMonth(selectedDate);
          setUseSelectedDate(true);
          setSheetKey(prev => prev + 1);
        }
      }
    },
  }));

  // Format selected date for Calendar component (YYYY-MM-DD) in local timezone
  const selectedDateString = selectedDate ? formatDateLocal(selectedDate) : '';

  // Create marked dates object
  const markedDates = useMemo(() => {
    const marked = {};

    // Get today's date string in local timezone - calculate fresh each time
    // Use formatDateLocal to ensure consistency
    const now = new Date();
    const todayDateString = formatDateLocal(now);
    
    // Calculate yesterday and tomorrow to explicitly exclude them from primary dot
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = formatDateLocal(yesterday);
    
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = formatDateLocal(tomorrow);
    
    // Mark today with dot (only if not selected)
    // Ensure we only mark this ONE specific date - no other date can get primary dot
    if (todayDateString === selectedDateString) {
      marked[todayDateString] = {
        selected: true,
        selectedColor: COLORS.text.primary,
        marked: false,
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
      // Only mark today if it's exactly today - use explicit check
      // Ensure no other date can get this primary dot
      marked[todayDateString] = {
        marked: true,
        dotColor: COLORS.text.primary,
      };
    }

    // Mark selected date (if different from today)
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

    // Mark dates with prayer status (exclude today, yesterday, tomorrow, and selected date)
    // prayerStatus date keys are in YYYY-MM-DD format (from toISOString().split('T')[0])
    // Explicitly prevent yesterday and tomorrow from getting any dots
    if (prayerStatus) {
      Object.keys(prayerStatus).forEach(dateKey => {
        if (Object.keys(prayerStatus[dateKey]).length > 0) {
          // Only mark if it's not today, not yesterday, not tomorrow, and not selected
          // This prevents adjacent days from getting dots
          if (dateKey !== todayDateString && 
              dateKey !== yesterdayString && 
              dateKey !== tomorrowString && 
              dateKey !== selectedDateString) {
            if (!marked[dateKey]) {
              marked[dateKey] = {};
            }
            marked[dateKey].marked = true;
            marked[dateKey].dotColor = COLORS.text.secondary;
          }
        }
      });
    }

    // Explicitly ensure yesterday and tomorrow don't have primary dots
    // Even if they somehow got marked, override them
    if (marked[yesterdayString] && yesterdayString !== todayDateString) {
      if (marked[yesterdayString].dotColor === COLORS.text.primary) {
        delete marked[yesterdayString].marked;
        delete marked[yesterdayString].dotColor;
      }
    }
    if (marked[tomorrowString] && tomorrowString !== todayDateString) {
      if (marked[tomorrowString].dotColor === COLORS.text.primary) {
        delete marked[tomorrowString].marked;
        delete marked[tomorrowString].dotColor;
      }
    }

    return marked;
  }, [selectedDate, prayerStatus, selectedDateString]);

  // Handle date selection
  const handleDayPress = (day) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onDateSelect) {
      const [year, month, date] = day.dateString.split('-').map(Number);
      const newDate = new Date(year, month - 1, date);
      onDateSelect(newDate);
      bottomSheetRef.current?.close();
      setShowMonthYearPicker(false);
    }
  };

  // Handle month navigation
    const handlePrevMonth = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const newDate = new Date(displayMonth);
      newDate.setMonth(newDate.getMonth() - 1);
      setDisplayMonth(newDate);
    setUseSelectedDate(false);
    setSheetKey(prev => prev + 1);
    };

    const handleNextMonth = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const newDate = new Date(displayMonth);
      newDate.setMonth(newDate.getMonth() + 1);
      setDisplayMonth(newDate);
    setUseSelectedDate(false);
    setSheetKey(prev => prev + 1);
  };

  // Handle month picker change
  const handleMonthChange = (value) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const monthIndex = monthNames.indexOf(value);
    if (monthIndex >= 0) {
      setSelectedMonthIndex(monthIndex);
      const currentYear = parseInt(years[selectedYearIndex]);
      const newDate = new Date(currentYear, monthIndex, 1);
      setDisplayMonth(newDate);
      setUseSelectedDate(false);
      setSheetKey(prev => prev + 1);
    }
  };

  // Handle year picker change
  const handleYearChange = (value) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const yearIndex = years.indexOf(value);
    if (yearIndex >= 0) {
      setSelectedYearIndex(yearIndex);
      const selectedYear = parseInt(value);
      const currentMonth = selectedMonthIndex;
      const newDate = new Date(selectedYear, currentMonth, 1);
      setDisplayMonth(newDate);
      setUseSelectedDate(false);
      setSheetKey(prev => prev + 1);
    }
  };

  // Custom header component
  const renderHeader = () => {
    const month = displayMonth.getMonth();
    const year = displayMonth.getFullYear();

    const handleMonthYearPress = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setShowMonthYearPicker(!showMonthYearPicker);
    };

    return (
      <View style={styles.customHeader}>
        <Pressable onPress={handleMonthYearPress} style={styles.monthYearButton}>
        <Text style={styles.headerTitle}>
          {monthNames[month]} {year}
        </Text>
          <Animated.View
            style={[
              styles.chevronContainer,
              {
                transform: [
                  {
                    rotate: chevronRotation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '90deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <MaterialCommunityIcons
              name="chevron-right"
              size={ICON_SIZES.md}
              color={COLORS.text.secondary}
            />
          </Animated.View>
        </Pressable>
        <Animated.View style={[styles.arrowContainer, { opacity: arrowsOpacity }]}>
          <Pressable 
            onPress={handlePrevMonth} 
            style={styles.arrowButton}
            disabled={showMonthYearPicker}
          >
            <Text style={styles.arrow}>‹</Text>
          </Pressable>
          <Pressable 
            onPress={handleNextMonth} 
            style={styles.arrowButton}
            disabled={showMonthYearPicker}
          >
            <Text style={styles.arrow}>›</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  };

  // Render month/year picker using react-native-wheel-pick
  const renderMonthYearPicker = () => {
    return (
      <View style={styles.pickerContainer}>
        <View style={styles.pickerColumns}>
          {/* Months Picker */}
          <Picker
            style={styles.picker}
            selectedValue={monthNames[selectedMonthIndex]}
            pickerData={monthNames}
            onValueChange={handleMonthChange}
            textColor={COLORS.text.primary}
          />
          
          {/* Years Picker */}
          <Picker
            style={styles.picker}
            selectedValue={years[selectedYearIndex]}
            pickerData={years}
            onValueChange={handleYearChange}
            textColor={COLORS.text.primary}
          />
        </View>
      </View>
    );
  };

  if (!selectedDate) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      enablePanDownToClose={true}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      backdropComponent={renderBackdrop}
      enableDynamicSizing={true}
    >
      <BottomSheetView style={styles.contentContainer}>
        {renderHeader()}
        <View style={styles.contentWrapper}>
          <Animated.View 
            style={[
              styles.calendarWrapper,
              { opacity: calendarOpacity },
            ]}
            pointerEvents={showMonthYearPicker ? 'none' : 'auto'}
          >
            <Calendar
              key={`${selectedDateString}-${sheetKey}`}
              current={useSelectedDate ? selectedDateString : formatDateLocal(displayMonth)}
              today={formatDateLocal(new Date())}
              onDayPress={handleDayPress}
              markedDates={markedDates}
              markingType={'custom'}
              enableSwipeMonths={true}
              onMonthChange={(month) => {
                setDisplayMonth(new Date(month.timestamp));
                setUseSelectedDate(false);
              }}
              onVisibleMonthsChange={(months) => {
                if (months.length > 0) {
                  setDisplayMonth(new Date(months[0].timestamp));
                  setUseSelectedDate(false);
                }
              }}
              hideExtraDays={true}
              firstDay={0}
              hideArrows={true}
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
              renderHeader={() => null}
            />
          </Animated.View>
          <Animated.View 
            style={[
              styles.pickerWrapper,
              { opacity: pickerOpacity },
            ]}
            pointerEvents={showMonthYearPicker ? 'auto' : 'none'}
          >
            {renderMonthYearPicker()}
          </Animated.View>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
});

DatePickerBottomSheet.displayName = 'DatePickerBottomSheet';

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
  contentWrapper: {
    position: 'relative',
    minHeight: 300,
  },
  calendarWrapper: {
    width: '100%',
  },
  pickerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
  },
  calendar: {
    borderRadius: RADIUS.md,
  },
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  monthYearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.weights.medium.primary,
    color: COLORS.text.primary,
  },
  chevronContainer: {
    marginLeft: SPACING.xs,
  },
  arrowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  arrowButton: {
    padding: SPACING.sm,
  },
  arrow: {
    fontSize: 28,
    color: COLORS.text.secondary,
    fontFamily: FONTS.weights.regular.primary,
  },
  pickerContainer: {
    height: 250,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.background.secondary,
    borderRadius: RADIUS.md,
  },
  pickerColumns: {
    flexDirection: 'row',
    height: '100%',
  },
  picker: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
    height: 250,
  },
});

export default DatePickerBottomSheet;
