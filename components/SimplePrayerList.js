import React, { memo, useState, useRef, useEffect, useLayoutEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Animated, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { timeToMinutes } from '../utils/timeUtils';
import { COLORS, FONTS, SPACING, RADIUS, ICON_SIZES } from '../constants/theme';

const SimplePrayerListComponent = ({ prayerTimes, prayerNames, currentTime, style, selectedDate, onPrayerPress, notifications = {}, prayerStatus }) => {
  const [displayDate, setDisplayDate] = useState(selectedDate || new Date()); // Date used for styling calculations
  const stylingDateRef = useRef(selectedDate || new Date()); // Ref to track date used for styling (only updates after fade-out)
  
  // Animation for sliding when date changes
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const prevDateRef = useRef(selectedDate);
  const screenWidth = Dimensions.get('window').width;
  // Get current time in minutes
  const currentMinutes = currentTime ? timeToMinutes(currentTime) : null;
  
  // Convert all prayer times to minutes
  const timesInMinutes = prayerTimes.map(time => timeToMinutes(time));
  
  // Check if selected date is today (using stylingDateRef to prevent styling flash)
  const isToday = () => {
    // Always use stylingDateRef for styling to prevent flash during animations
    const dateToCheck = stylingDateRef.current;
    if (!dateToCheck) return true;
    const today = new Date();
    return (
      dateToCheck.getDate() === today.getDate() &&
      dateToCheck.getMonth() === today.getMonth() &&
      dateToCheck.getFullYear() === today.getFullYear()
    );
  };

  // Check if selected date is in the past
  const isPastDate = () => {
    // Always use stylingDateRef for styling to prevent flash during animations
    const dateToCheck = stylingDateRef.current;
    if (!dateToCheck) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(dateToCheck);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  // Determine if a prayer is past, current, or future
  const getPrayerStatus = (index) => {
    // Calculate date status using ref (always current, doesn't trigger re-renders)
    const dateIsPast = isPastDate();
    const dateIsToday = isToday();
    
    // If viewing a past date, all prayers are past
    if (dateIsPast) {
      return { isPast: true, isCurrent: false };
    }

    // If viewing a future date, all prayers are future
    if (!dateIsToday) {
      return { isPast: false, isCurrent: false };
    }

    // If not today or no current time, treat as future
    if (!currentMinutes || timesInMinutes.length === 0) {
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

  // Initialize displayDate and stylingDateRef with selectedDate
  useEffect(() => {
    if (!displayDate && selectedDate) {
      setDisplayDate(selectedDate);
      stylingDateRef.current = selectedDate;
      prevDateRef.current = selectedDate;
    }
  }, []);

  // Update stylingDateRef immediately when selectedDate changes (before render)
  useLayoutEffect(() => {
    // Only update if it's different to avoid unnecessary updates
    if (selectedDate && stylingDateRef.current?.getTime() !== selectedDate.getTime()) {
      // Don't update stylingDateRef here - it should only update after fade-out
      // This effect is just to ensure we're ready
    }
  }, [selectedDate]);

  // Animate slide when date changes
  useEffect(() => {
    if (!selectedDate || !prevDateRef.current) {
      prevDateRef.current = selectedDate;
      setDisplayDate(selectedDate);
      stylingDateRef.current = selectedDate;
      return;
    }

    const prevDate = prevDateRef.current;
    const currentDate = selectedDate;
    
    // Compare dates to determine direction
    const prevTime = prevDate.getTime();
    const currentTime = currentDate.getTime();
    
    if (prevTime !== currentTime) {
      // IMPORTANT: Don't update stylingDateRef yet - keep old date for styling during fade-out
      // Determine slide direction: forward (future) = slide left, backward (past) = slide right
      const isForward = currentTime > prevTime;
      const slideDistance = screenWidth * 0.3; // Start 30% of screen width from center
      
      // First fade out the current list (keep old styling during fade-out)
      // stylingDateRef.current keeps the old date during fade-out
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        // Update stylingDateRef first (synchronously, before any re-render)
        stylingDateRef.current = selectedDate;
        // Small delay to ensure ref update is processed before state update
        requestAnimationFrame(() => {
          setDisplayDate(selectedDate); // Then update state (triggers re-render)
        
          // Then slide in and fade in the new list
          slideAnim.setValue(isForward ? slideDistance : -slideDistance);
          opacityAnim.setValue(0.3);
          
          Animated.parallel([
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start();
        });
      });
    }
    
    prevDateRef.current = selectedDate;
  }, [selectedDate, slideAnim, opacityAnim, screenWidth]);

  return (
    <Animated.View 
      style={[
        styles.prayerList, 
        style,
        {
          transform: [{ translateX: slideAnim }],
          opacity: opacityAnim,
        }
      ]}
    >
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
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
                    color={
                      isPast 
                        ? COLORS.text.disabled 
                        : COLORS.text.primary
                    }
                    style={isPast && { opacity: 0.5 }}
                  />
                </View>
              </View>
            </View>
          </Pressable>
        );
      })}
    </Animated.View>
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
    backgroundColor: 'transparent',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: SPACING.sm + 2,
  },
  prayerRowCurrent: {
    borderColor: COLORS.text.primary,
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
    color: COLORS.text.primary,
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

