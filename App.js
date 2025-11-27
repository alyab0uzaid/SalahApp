import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, ActivityIndicator, Dimensions, ScrollView, Animated } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useFonts } from 'expo-font';
import { SpaceGrotesk_400Regular, SpaceGrotesk_500Medium, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Location from 'expo-location';
import * as Adhan from 'adhan';
import ArchTimer from './components/ArchTimer';
import PrayerList from './components/PrayerList';
import LocationTag from './components/LocationTag';
import BottomNav from './components/BottomNav';
import DatePicker from './components/DatePicker';
import QiblaCompass from './components/QiblaCompass';
import PrayerDetailsBottomSheet from './components/PrayerDetailsBottomSheet';
import { formatTime, formatPrayerTime } from './utils/timeUtils';
import { COLORS, FONTS, SPACING } from './constants/theme';

export default function App() {
  // Load Space Grotesk and Space Mono fonts
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
    SpaceMono_400Regular,
    SpaceMono_700Bold,
  });

  // Prayer names
  const prayerNames = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  
  // State for location and prayer times
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [locationName, setLocationName] = useState(null);
  const [prayerTimes, setPrayerTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  
  // Reset PrayerList when returning to home tab to fix gesture handler
  const handleTabChange = (tab) => {
    if (tab === 'home' && activeTab !== 'home') {
      // Coming back to home - remount PrayerList to reset gesture handlers
      setPrayerListKey(prev => prev + 1);
    }
    setActiveTab(tab);
  };
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // State to track prayer status (on-time/late) per date and prayer
  // Structure: { [dateKey]: { [prayerName]: 'on-time' | 'late' } }
  const [prayerStatus, setPrayerStatus] = useState({});

  // State to track which prayers have notifications enabled
  // Default: All prayers enabled except Sunrise
  const [notifications, setNotifications] = useState(
    prayerNames.reduce((acc, name) => ({
      ...acc,
      [name]: name.toLowerCase() !== 'sunrise'
    }), {})
  );

  // Key to force remount of PrayerList when returning to home tab (fixes gesture handler issue)
  const [prayerListKey, setPrayerListKey] = useState(0);

  // Cache today's prayer times to avoid recalculation when switching back
  const todayPrayerTimesRef = useRef(null);
  const archTimerRef = useRef(null);
  const bottomSheetRef = useRef(null);

  // State for selected prayer in bottom sheet
  const [selectedPrayer, setSelectedPrayer] = useState(null);

  // Animated background color for Qibla alignment
  const qiblaBgOpacity = useRef(new Animated.Value(0)).current;

  // Get current time and update it every 10 seconds
  const [currentTime, setCurrentTime] = useState(() => {
    const now = new Date();
    return formatTime(now);
  });

  // Request location permission and get location
  useEffect(() => {
    (async () => {
      try {
        // Check existing permission first – helpful on reloads
        const existing = await Location.getForegroundPermissionsAsync();

        // If we already have permission, skip the prompt
        let status = existing.status;

        if (status !== 'granted' && existing.canAskAgain) {
          const requested = await Location.requestForegroundPermissionsAsync();
          status = requested.status;
        }

        if (status !== 'granted') {
          // Either denied or cannot ask again – tell user to change browser/device settings
          setLocationError(
            status === 'denied'
              ? 'Location permission denied. Please enable location access for this app in your browser or device settings.'
              : 'Location permission unavailable. Please enable location access for this app in your browser or device settings.'
          );
          setLoading(false);
          return;
        }

        // Helper to enforce a hard timeout so the UI never spins forever
        const withTimeout = (promise, ms) =>
          Promise.race([
            promise,
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Location request timed out')), ms)
            ),
          ]);

        let locationData;

        // Try to get current position with sane options and a hard timeout
        try {
          locationData = await withTimeout(
            Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
              maximumAge: 60000,
            }),
            15000 // 15 seconds max
          );
        } catch (positionError) {
          // If the browser / device can't get a fresh fix, fall back to last known position
          try {
            const lastKnown = await Location.getLastKnownPositionAsync();
            if (lastKnown) {
              locationData = lastKnown;
            } else {
              throw positionError;
            }
          } catch (fallbackError) {
            setLocationError(
              fallbackError.message ||
                'Unable to get location. Make sure location is enabled and reload the app.'
            );
            setLoading(false);
            return;
          }
        }

        setLocation(locationData);

        // Reverse geocode to get location name
        try {
          const reverseGeocode = await Location.reverseGeocodeAsync({
            latitude: locationData.coords.latitude,
            longitude: locationData.coords.longitude,
          });

          if (reverseGeocode && reverseGeocode.length > 0) {
            const address = reverseGeocode[0];
            // Try to get city, or use locality, or subAdministrativeArea
            const city = address.city || address.locality || address.subAdministrativeArea || address.administrativeArea || 'Unknown';
            setLocationName(city);
          }
        } catch (geocodeError) {
          // Fallback to coordinates if geocoding fails
          setLocationName(`${locationData.coords.latitude.toFixed(2)}, ${locationData.coords.longitude.toFixed(2)}`);
        }
      } catch (error) {
        setLocationError(error.message);
        setLoading(false);
        return;
      }
    })();
  }, []);

  // Calculate prayer times when location or selected date changes
  useEffect(() => {
    if (location) {
      const today = new Date();
      const isToday = selectedDate.getDate() === today.getDate() &&
        selectedDate.getMonth() === today.getMonth() &&
        selectedDate.getFullYear() === today.getFullYear();
      
      // If switching to today and we have cached today's times, skip recalculation
      // (prayer times are already set in onGoToToday handler)
      if (isToday && todayPrayerTimesRef.current && JSON.stringify(prayerTimes) === JSON.stringify(todayPrayerTimesRef.current)) {
        return; // Already set, skip
      }
      
      const coordinates = new Adhan.Coordinates(
        location.coords.latitude,
        location.coords.longitude
      );
      
      const params = Adhan.CalculationMethod.MuslimWorldLeague();
      const prayerTimesData = new Adhan.PrayerTimes(coordinates, selectedDate, params);
      
      // Format prayer times
      const formattedTimes = [
        formatPrayerTime(prayerTimesData.fajr),
        formatPrayerTime(prayerTimesData.sunrise),
        formatPrayerTime(prayerTimesData.dhuhr),
        formatPrayerTime(prayerTimesData.asr),
        formatPrayerTime(prayerTimesData.maghrib),
        formatPrayerTime(prayerTimesData.isha),
      ];
      
      // Cache today's prayer times for instant switching
      if (isToday) {
        todayPrayerTimesRef.current = formattedTimes;
      }
      
      setPrayerTimes(formattedTimes);
      setLoading(false);
    }
  }, [location, selectedDate]);

  // Update current time every 10 seconds for smoother movement
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(formatTime(new Date()));
    }, 10000); // Update every 10 seconds

    // Also update immediately on mount
    setCurrentTime(formatTime(new Date()));

    return () => clearInterval(interval);
  }, []);

  // Handle Qibla background color change
  const handleQiblaBackgroundChange = (isAligned) => {
    Animated.timing(qiblaBgOpacity, {
      toValue: isAligned ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // Handle prayer row press - open bottom sheet
  const handlePrayerPress = (prayer) => {
    setSelectedPrayer(prayer);
    // Subtle delay before opening bottom sheet
    setTimeout(() => {
      bottomSheetRef.current?.snapToIndex(0);
    }, 200);
  };

  // Handle notification toggle from bottom sheet
  const handleNotificationToggle = (enabled) => {
    if (selectedPrayer) {
      setNotifications(prev => ({
        ...prev,
        [selectedPrayer.name]: enabled
      }));
    }
  };

  // Handle prayer status update (on-time or late, or null to remove)
  const handlePrayerStatusUpdate = (prayerName, status) => {
    // Create a date key (YYYY-MM-DD format)
    const dateKey = selectedDate.toISOString().split('T')[0];
    
    setPrayerStatus(prev => {
      const newState = {
        ...prev,
        [dateKey]: {
          ...(prev[dateKey] || {}),
        },
      };
      
      if (status === null) {
        // Remove the status if null
        const { [prayerName]: _, ...rest } = newState[dateKey];
        newState[dateKey] = rest;
        // Remove the date key if it's now empty
        if (Object.keys(newState[dateKey]).length === 0) {
          const { [dateKey]: __, ...restDates } = newState;
          return restDates;
        }
      } else {
        // Set the status
        newState[dateKey][prayerName] = status;
      }
      
      return newState;
    });
  };

  // Interpolate background color
  const backgroundColor = qiblaBgOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.background.primary, 'rgb(49, 199, 86)'],
  });

  if (!fontsLoaded || loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.text.primary} />
        {locationError && (
          <Text style={styles.errorText}>{locationError}</Text>
        )}
      </View>
    );
  }

  if (locationError && prayerTimes.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>
          Unable to get location.
        </Text>
        <Text style={styles.errorText}>
          {locationError}
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Animated.View style={[
        styles.container,
        activeTab === 'qibla' && { backgroundColor, justifyContent: 'center' }
      ]} clipsToBounds={false}>
        <StatusBar style="light" translucent backgroundColor="transparent" />

      {/* Show Qibla compass when qibla tab is active */}
      {activeTab === 'qibla' && (
        <QiblaCompass onBackgroundChange={handleQiblaBackgroundChange} />
      )}

      {/* Tracker tab placeholder */}
      {activeTab === 'tracker' && (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderTitle}>Tracker</Text>
          <Text style={styles.placeholderText}>Coming Soon</Text>
        </View>
      )}

      {/* Settings tab placeholder */}
      {activeTab === 'settings' && (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderTitle}>Settings</Text>
          <Text style={styles.placeholderText}>Coming Soon</Text>
        </View>
      )}

      {/* Keep home tab mounted but hidden for instant switching */}
      <ScrollView
        style={[styles.scroll, activeTab !== 'home' && styles.hidden]}
        contentContainerStyle={[
          styles.content,
          contentHeight > 0 && scrollViewHeight > 0 && contentHeight < scrollViewHeight && { minHeight: scrollViewHeight }
        ]}
        showsVerticalScrollIndicator={false}
        clipsToBounds={false}
        onContentSizeChange={(_, height) => setContentHeight(height)}
        onLayout={(event) => setScrollViewHeight(event.nativeEvent.layout.height)}
        pointerEvents={activeTab === 'home' ? 'auto' : 'none'}
      >
        <LocationTag
          locationName={locationName}
          style={styles.locationTag}
        />
        <ArchTimer
          ref={archTimerRef}
          prayerTimes={prayerTimes}
          prayerNames={prayerNames}
          currentTime={currentTime}
          width={Dimensions.get('window').width}
          height={200}
          style={styles.archTimer}
          selectedDate={selectedDate}
          onGoToToday={() => {
            const today = new Date();
            // Only update if not already today to avoid unnecessary re-renders
            const currentDate = selectedDate;
            const isAlreadyToday = currentDate &&
              currentDate.getDate() === today.getDate() &&
              currentDate.getMonth() === today.getMonth() &&
              currentDate.getFullYear() === today.getFullYear();
            if (!isAlreadyToday) {
              // Start animation immediately, before state update
              if (archTimerRef.current) {
                archTimerRef.current.animateToToday();
              }
              // Use cached prayer times immediately if available
              if (todayPrayerTimesRef.current) {
                setPrayerTimes(todayPrayerTimesRef.current);
              }
              setSelectedDate(today);
            }
          }}
        />
        <DatePicker
          selectedDate={selectedDate}
          onDateChange={(newDate) => {
            const today = new Date();
            const isNewDateToday = newDate.getDate() === today.getDate() &&
              newDate.getMonth() === today.getMonth() &&
              newDate.getFullYear() === today.getFullYear();

            // If switching to today, trigger immediate animation like the "Today" button
            if (isNewDateToday) {
              // Start animation immediately, before state update
              if (archTimerRef.current) {
                archTimerRef.current.animateToToday();
              }
              // Use cached prayer times immediately if available
              if (todayPrayerTimesRef.current) {
                setPrayerTimes(todayPrayerTimesRef.current);
              }
            }
            setSelectedDate(newDate);
          }}
          style={styles.datePicker}
        />
        <PrayerList
          key={prayerListKey}
          prayerTimes={prayerTimes}
          prayerNames={prayerNames}
          currentTime={currentTime}
          style={styles.prayerList}
          selectedDate={selectedDate}
          onPrayerStatusUpdate={handlePrayerStatusUpdate}
          prayerStatus={prayerStatus}
          onPrayerPress={handlePrayerPress}
          notifications={notifications}
        />
      </ScrollView>

      <View style={[
        styles.bottomNavWrapper,
        (activeTab === 'qibla' || activeTab === 'tracker' || activeTab === 'settings') && {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: activeTab === 'qibla' ? 'transparent' : COLORS.background.primary,
        }
      ]}>
        <BottomNav
          activeTab={activeTab}
          onTabPress={handleTabChange}
        />
      </View>

      {/* Prayer Details Bottom Sheet */}
      <PrayerDetailsBottomSheet
        bottomSheetRef={bottomSheetRef}
        selectedPrayer={selectedPrayer}
        notificationEnabled={selectedPrayer ? notifications[selectedPrayer.name] : false}
        onNotificationToggle={handleNotificationToggle}
      />
      </Animated.View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 0,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center', // Center content vertically when shorter than screen
    width: '100%',
    flexGrow: 1, // Allow content to grow for centering
    paddingTop: SPACING.lg, // Minimal top padding for safe area
    paddingBottom: SPACING.lg, // Minimal bottom padding
    overflow: 'visible',
  },
  // Normal spacing system - no wrapper compensation needed
  locationTag: {
    marginBottom: SPACING.xxl, // Normal spacing to next component
  },
  archTimer: {
    marginBottom: SPACING.lg, // No spacing between ArchTimer and PrayerList
  },
  datePicker: {
    marginBottom: SPACING.md,
  },
  prayerList: {
    marginTop: 0, // Pull up to overlap with timer (timer extends beyond container)
  },
  scroll: {
    flex: 1,
    width: '100%',
  },
  hidden: {
    display: 'none',
  },
  bottomNavWrapper: {
    width: '100%',
    backgroundColor: COLORS.background.primary,
    paddingBottom: SPACING.sm,
  },
  centerContent: {
    justifyContent: 'center',
  },
  errorText: {
    color: COLORS.text.tertiary,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.weights.regular.primary,
    marginTop: SPACING.lg,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: SPACING.lg,
  },
  placeholderTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.xxl,
    fontFamily: FONTS.weights.medium.primary,
    marginBottom: SPACING.md,
  },
  placeholderText: {
    color: COLORS.text.tertiary,
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.weights.regular.primary,
  },
});
