import React, { useState, memo, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Animated, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { timeToMinutes } from '../utils/timeUtils';
import { COLORS, FONTS, SPACING, RADIUS, ICON_SIZES } from '../constants/theme';

const PrayerListComponent = ({ prayerTimes, prayerNames, currentTime, style, selectedDate, onPrayerStatusUpdate, prayerStatus, onPrayerPress, notifications = {} }) => {
  // Local state to track prayer status for immediate UI updates
  const [localPrayerStatus, setLocalPrayerStatus] = useState({});

  // Track which prayer is currently being pressed (for immediate tap feedback)
  const [pressedPrayer, setPressedPrayer] = useState(null);
  const [displayDate, setDisplayDate] = useState(selectedDate); // Date used for styling calculations

  // Animation for sliding when date changes
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const prevDateRef = useRef(selectedDate);
  const screenWidth = Dimensions.get('window').width;

  // Get current time in minutes
  const currentMinutes = currentTime ? timeToMinutes(currentTime) : null;
  
  // Convert all prayer times to minutes
  const timesInMinutes = prayerTimes.map(time => timeToMinutes(time));
  
  // Check if selected date is today (using displayDate to prevent styling flash)
  const isToday = () => {
    const dateToCheck = displayDate || selectedDate;
    if (!dateToCheck) return true;
    const today = new Date();
    return (
      dateToCheck.getDate() === today.getDate() &&
      dateToCheck.getMonth() === today.getMonth() &&
      dateToCheck.getFullYear() === today.getFullYear()
    );
  };

  const isCurrentDateToday = isToday();

  // Get date key for prayer status lookup
  const getDateKey = () => {
    if (!selectedDate) return null;
    return selectedDate.toISOString().split('T')[0];
  };

  // Get prayer status for current date - check both local and parent state
  const getPrayerStatusForDate = (prayerName) => {
    const dateKey = getDateKey();
    if (!dateKey) return null;
    
    // First check local state for immediate updates (including null values for removals)
    if (localPrayerStatus[dateKey] && prayerName in localPrayerStatus[dateKey]) {
      return localPrayerStatus[dateKey][prayerName] || null;
    }
    
    // Then check parent state
    if (prayerStatus && prayerStatus[dateKey]) {
      return prayerStatus[dateKey][prayerName] || null;
    }
    
    return null;
  };

  // Handle tap to cycle through status: none -> on-time -> late -> none
  const handlePrayerTap = (prayerName) => {
    const dateKey = getDateKey();
    if (!dateKey || !onPrayerStatusUpdate) return;

    const currentStatus = getPrayerStatusForDate(prayerName);
    let newStatus;

    // Cycle: none -> on-time -> late -> none
    if (!currentStatus) {
      newStatus = 'on-time';
    } else if (currentStatus === 'on-time') {
      newStatus = 'late';
    } else {
      newStatus = null; // Remove status
    }

    // Update local state immediately for UI feedback
    // Use a function that explicitly handles null values (for removals)
    setLocalPrayerStatus(prev => {
      const updated = {
        ...prev,
        [dateKey]: {
          ...(prev[dateKey] || {}),
        },
      };
      
      if (newStatus === null) {
        // Remove the key if status is null
        const { [prayerName]: _, ...rest } = updated[dateKey];
        updated[dateKey] = rest;
        // If date has no prayers, remove the date key
        if (Object.keys(updated[dateKey]).length === 0) {
          const { [dateKey]: __, ...restDates } = updated;
          return restDates;
        }
      } else {
        updated[dateKey][prayerName] = newStatus;
      }
      
      return updated;
    });

    // Update parent state - function expects (prayerName, status)
    onPrayerStatusUpdate(prayerName, newStatus);
  };

  // Sync local state with parent state when date changes or parent state updates
  useEffect(() => {
    if (!selectedDate) return;
    const dateKey = selectedDate.toISOString().split('T')[0];

    // Sync with parent state - parent state is the source of truth
    setLocalPrayerStatus(prev => ({
      ...prev,
      [dateKey]: prayerStatus?.[dateKey] || {},
    }));
  }, [selectedDate, prayerStatus]);

  // Sync displayDate with selectedDate when there's no animation
  useEffect(() => {
    if (!prevDateRef.current) {
      setDisplayDate(selectedDate);
      prevDateRef.current = selectedDate;
    }
  }, []);

  // Animate slide when date changes
  useEffect(() => {
    if (!selectedDate || !prevDateRef.current) {
      prevDateRef.current = selectedDate;
      setDisplayDate(selectedDate);
      return;
    }

    const prevDate = prevDateRef.current;
    const currentDate = selectedDate;
    
    // Compare dates to determine direction
    const prevTime = prevDate.getTime();
    const currentTime = currentDate.getTime();
    
    if (prevTime !== currentTime) {
      // Determine slide direction: forward (future) = slide left, backward (past) = slide right
      const isForward = currentTime > prevTime;
      const slideDistance = screenWidth * 0.3; // Start 30% of screen width from center
      
      // First fade out the current list (keep old styling during fade-out)
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }).start(() => {
        // Update display date after fade-out completes (triggers re-render with new styling)
        setDisplayDate(selectedDate);
        
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
    }
    
    prevDateRef.current = selectedDate;
  }, [selectedDate, slideAnim, opacityAnim, screenWidth]);

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
      {prayerNames.map((name, index) => {
        const time = prayerTimes[index];
        const isSunrise = name.toLowerCase() === 'sunrise';
        
        // Skip sunrise
        if (isSunrise) {
          return null;
        }

        const { isPast, isCurrent } = getPrayerStatus(index);
        const prayerStatusValue = getPrayerStatusForDate(name);

        return (
          <Pressable
            key={name}
            style={[
              styles.prayerRow,
              pressedPrayer === name && styles.prayerRowPressed
            ]}
            onPress={() => {
              // Haptic feedback
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              
              // Show color change on release
              setPressedPrayer(name);
              // Clear it after a brief moment
              setTimeout(() => {
                setPressedPrayer(null);
              }, 150);

              // Handle status cycling for prayers
              handlePrayerTap(name);
            }}
          >
            <View style={styles.prayerRowContent}>
              <View style={styles.prayerInfo}>
                {/* Status indicator circle on the left */}
                <View style={styles.statusIndicator}>
                  {prayerStatusValue === 'on-time' && (
                    <MaterialCommunityIcons
                      name="check"
                      size={16}
                      color={COLORS.text.primary}
                    />
                  )}
                  {prayerStatusValue === 'late' && (
                    <View style={styles.lateDot} />
                  )}
                </View>
                <Text style={styles.prayerName}>
                  {name}
                </Text>
              </View>
              <View style={styles.timeContainer}>
                <Text style={styles.prayerTimeText}>
                  {time}
                </Text>
              </View>
            </View>
          </Pressable>
        );
      })}
    </Animated.View>
  );
};

// Memoize component to prevent unnecessary re-renders
// Note: We're not memoizing too aggressively to allow local state updates to show immediately
const PrayerList = memo(PrayerListComponent);

const styles = StyleSheet.create({
  prayerList: {
    width: '90%',
    marginTop: 0, // Spacing handled by wrapper in App.js
    alignSelf: 'center',
  },
  prayerRow: {
    paddingVertical: SPACING.sm + 2,
    paddingLeft: SPACING.md + 4,
    paddingRight: SPACING.md + 4,
    backgroundColor: COLORS.background.secondary,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: SPACING.sm + 2,
  },
  prayerRowPressed: {
    backgroundColor: '#0F0E10', // Darker than secondary, no blue tint
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
  statusIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginRight: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.text.primary,
  },
  prayerName: {
    color: COLORS.text.primary,
    fontSize: 17,
    fontFamily: FONTS.weights.regular.primary,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prayerTimeText: {
    color: COLORS.text.primary,
    fontSize: 17,
    fontFamily: FONTS.weights.regular.primary,
  },
});

export default PrayerList;


