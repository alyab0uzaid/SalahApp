import React, { useState, memo, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { timeToMinutes } from '../utils/timeUtils';
import { COLORS, FONTS, SPACING, RADIUS, ICON_SIZES } from '../constants/theme';

const PrayerListComponent = ({ prayerTimes, prayerNames, currentTime, style, selectedDate, onPrayerStatusUpdate, prayerStatus, onPrayerPress, notifications = {} }) => {
  // Local state to track prayer status for immediate UI updates
  const [localPrayerStatus, setLocalPrayerStatus] = useState({});

  // Track which prayer is currently being pressed (for immediate tap feedback)
  const [pressedPrayer, setPressedPrayer] = useState(null);


  // Right swipe action - "On Time" (green background with opacity based on swipe progress)
  const renderRightActions = (progress) => {
    const opacity = progress.interpolate({
      inputRange: [0, 0.3, 1],
      outputRange: [0.2, 1, 1], // Reach full opacity at 30% swipe
    });

    return (
      <Animated.View style={[styles.rightAction, { opacity }]}>
        <MaterialCommunityIcons name="check-circle" size={24} color="#fff" />
      </Animated.View>
    );
  };

  // Left swipe action - "Late" (orange background with opacity based on swipe progress)
  const renderLeftActions = (progress) => {
    const opacity = progress.interpolate({
      inputRange: [0, 0.3, 1],
      outputRange: [0.2, 1, 1], // Reach full opacity at 30% swipe
    });

    return (
      <Animated.View style={[styles.leftAction, { opacity }]}>
        <MaterialCommunityIcons name="clock-alert" size={24} color="#fff" />
      </Animated.View>
    );
  };
  
  // Create wrapper functions - just pass through, we'll detect direction on close
  const createRightActionsRenderer = (prayerName) => {
    return (progress, dragX) => {
      return renderRightActions(progress);
    };
  };
  
  const createLeftActionsRenderer = (prayerName) => {
    return (progress, dragX) => {
      return renderLeftActions(progress);
    };
  };
  // Get current time in minutes
  const currentMinutes = currentTime ? timeToMinutes(currentTime) : null;
  
  // Convert all prayer times to minutes
  const timesInMinutes = prayerTimes.map(time => timeToMinutes(time));
  
  // Check if selected date is today
  const isToday = () => {
    if (!selectedDate) return true;
    const today = new Date();
    return (
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear()
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
    
    // First check local state for immediate updates
    if (localPrayerStatus[dateKey] && localPrayerStatus[dateKey][prayerName]) {
      return localPrayerStatus[dateKey][prayerName];
    }
    
    // Then check parent state
    if (dateKey && prayerStatus && prayerStatus[dateKey]) {
      return prayerStatus[dateKey][prayerName] || null;
    }
    
    return null;
  };

  // Refs to control swipeable components
  const swipeableRefs = useRef({});
  
  // Track swipe state to detect when user releases
  const swipeStateRef = useRef({});
  
  // Track if a swipe is currently happening (to prevent tap feedback during swipes)
  const isSwipingRef = useRef({});

  // Sync local state with parent state when date changes or parent state updates
  useEffect(() => {
    if (!selectedDate) return;
    const dateKey = selectedDate.toISOString().split('T')[0];
    if (dateKey && prayerStatus && prayerStatus[dateKey]) {
      // Update local state with parent state for the current date
      setLocalPrayerStatus(prev => ({
        ...prev,
        [dateKey]: prayerStatus[dateKey],
      }));
    }
  }, [selectedDate, prayerStatus]);

  // Handle swipe completion - use ref to prevent multiple calls
  const handleSwipeComplete = (prayerName, direction, swipeableRef) => {
    if (!onPrayerStatusUpdate) return;
    
    // Prevent duplicate calls for the same prayer
    const dateKey = getDateKey();
    const stateKey = `${dateKey}-${prayerName}`;
    if (swipeStateRef.current[`_processed_${stateKey}`]) {
      return; // Already processed
    }
    swipeStateRef.current[`_processed_${stateKey}`] = true;
    
    // direction: 'right' = on-time (green), 'left' = late (orange)
    const newStatus = direction === 'right' ? 'on-time' : 'late';
    
    // Check current status to toggle
    const currentStatus = getPrayerStatusForDate(prayerName);
    const status = currentStatus === newStatus ? null : newStatus; // Toggle: if same, remove; otherwise set
    
    // Update local state immediately for instant UI feedback
    if (dateKey) {
      setLocalPrayerStatus(prev => {
        const newState = {
          ...prev,
          [dateKey]: {
            ...(prev[dateKey] || {}),
            [prayerName]: status,
          },
        };
        // Remove the key if status is null
        if (status === null && newState[dateKey][prayerName] === null) {
          const { [prayerName]: _, ...rest } = newState[dateKey];
          newState[dateKey] = rest;
        }
        return newState;
      });
    }
    
    // Update parent state
    onPrayerStatusUpdate(prayerName, status);
    
    // Close the swipeable after marking
    if (swipeableRef) {
      swipeableRef.close();
    }
    
    // Clear processed flag after a delay
    setTimeout(() => {
      delete swipeStateRef.current[`_processed_${stateKey}`];
    }, 500);
  };

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
        const hasNotification = notifications[name];
        const prayerStatusValue = getPrayerStatusForDate(name);
        const isSunrise = name.toLowerCase() === 'sunrise';

        const prayerRowContent = (
          <Pressable
            style={[
              styles.prayerRow,
              pressedPrayer === name && !isSwipingRef.current[name] && styles.prayerRowPressed
            ]}
            onPress={() => {
              if (!isSwipingRef.current[name]) {
                // Show color change on release
                setPressedPrayer(name);
                // Clear it after a brief moment
                setTimeout(() => {
                  setPressedPrayer(null);
                }, 150);
              }
              if (onPrayerPress && !isSunrise) {
                onPrayerPress({ name, time, index });
              }
            }}
          >
            <View style={styles.prayerRowContent}>
              <View style={styles.prayerInfo}>
                <MaterialCommunityIcons
                  name={iconName}
                  size={22}
                  color={isPast ? COLORS.text.disabled : isCurrent ? COLORS.text.primary : COLORS.text.secondary}
                />
                <Text style={[
                  styles.prayerName,
                  isPast && styles.prayerNamePast,
                  isCurrent && styles.prayerNameActive
                ]}>
                  {name}
                </Text>
                {prayerStatusValue && (
                  <View style={[
                    styles.statusBadge,
                    prayerStatusValue === 'on-time' ? styles.statusBadgeOnTime : styles.statusBadgeLate
                  ]} />
                )}
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
                    color={COLORS.text.tertiary}
                  />
                </View>
              </View>
            </View>
          </Pressable>
        );

        // Sunrise is not a prayer, so it shouldn't be swipeable
        if (isSunrise) {
          return (
            <View key={name} style={styles.swipeableContainer}>
              {prayerRowContent}
            </View>
          );
        }

        // Regular prayers are swipeable
        return (
          <Swipeable
            key={name}
            ref={(ref) => {
              if (ref) {
                swipeableRefs.current[name] = ref;
              }
            }}
            renderRightActions={createRightActionsRenderer(name)}
            renderLeftActions={createLeftActionsRenderer(name)}
            onSwipeableWillOpen={(direction) => {
              // Mark that we're swiping to prevent tap feedback
              isSwipingRef.current[name] = true;
              // Track direction when threshold is reached
              if (!swipeStateRef.current[name]) {
                swipeStateRef.current[name] = {};
              }
              swipeStateRef.current[name].direction = direction;
              swipeStateRef.current[name].hasSwiped = true;
            }}
            onSwipeableClose={(direction) => {
              // Mark that we're no longer swiping
              isSwipingRef.current[name] = false;
              // When user releases, mark the prayer using the direction
              // Use tracked direction if available, otherwise use close direction
              const swipeState = swipeStateRef.current[name];
              const finalDirection = (swipeState && swipeState.direction) || direction;
              
              if (finalDirection) {
                const swipeableRef = swipeableRefs.current[name];
                handleSwipeComplete(name, finalDirection, swipeableRef);
              }
              // Clear state
              if (swipeStateRef.current[name]) {
                delete swipeStateRef.current[name];
              }
            }}
            overshootRight={false}
            overshootLeft={false}
            friction={2}
            rightThreshold={1000}
            leftThreshold={1000}
            containerStyle={styles.swipeableContainer}
          >
            {prayerRowContent}
          </Swipeable>
        );
      })}
    </View>
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
  swipeableContainer: {
    borderRadius: RADIUS.md, // Rounded corners for swipeable container
    marginBottom: SPACING.sm, // Spacing between prayers
    overflow: 'hidden', // Clip everything to rounded corners
  },
  prayerRow: {
    paddingVertical: SPACING.sm,
    paddingLeft: SPACING.md,
    paddingRight: SPACING.md,
    backgroundColor: COLORS.background.secondary,
    borderRadius: RADIUS.md, // Prayer row has rounded corners
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
  prayerName: {
    color: COLORS.text.secondary,
    fontSize: 17,
    fontFamily: FONTS.weights.regular.primary,
    marginLeft: SPACING.md,
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
    color: COLORS.text.tertiary,
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
  // Swipe action styles - icons positioned near edges
  rightAction: {
    backgroundColor: '#81C784', // Muted green for "on time"
    justifyContent: 'center',
    alignItems: 'flex-end', // Align to right edge
    paddingRight: 16, // 16px from edge
    flex: 1, // Take full available width
  },
  leftAction: {
    backgroundColor: '#FF9A76', // More orange-leaning coral for "late"
    justifyContent: 'center',
    alignItems: 'flex-start', // Align to left edge
    paddingLeft: 16, // 16px from edge
    flex: 1, // Take full available width
  },
  statusBadge: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: SPACING.sm,
  },
  statusBadgeOnTime: {
    backgroundColor: '#81C784', // Softer muted green for on-time
  },
  statusBadgeLate: {
    backgroundColor: '#FF9A76', // More orange-leaning coral for late
  },
});

export default PrayerList;


