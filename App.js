import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, ActivityIndicator, Animated } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useFonts } from 'expo-font';
import { SpaceGrotesk_400Regular, SpaceGrotesk_500Medium, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Adhan from 'adhan';
import HomeScreen from './screens/HomeScreen';
import QiblaScreen from './screens/QiblaScreen';
import TrackerScreen from './screens/TrackerScreen';
import SettingsScreen from './screens/SettingsScreen';
import PrayerDetailsBottomSheet from './components/PrayerDetailsBottomSheet';
import DatePickerBottomSheet from './components/DatePickerBottomSheet';
import PrayerStatusBottomSheet from './components/PrayerStatusBottomSheet';
import { formatTime, formatPrayerTime } from './utils/timeUtils';
import { COLORS, FONTS, SPACING, ICON_SIZES } from './constants/theme';

const Tab = createBottomTabNavigator();

export default function App() {
  // Load fonts
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
  const [selectedDate, setSelectedDate] = useState(new Date());

  // State to track prayer status (on-time/late) per date and prayer
  const [prayerStatus, setPrayerStatus] = useState({});

  // State to track which prayers have notifications enabled
  const [notifications, setNotifications] = useState(
    prayerNames.reduce((acc, name) => ({
      ...acc,
      [name]: name.toLowerCase() !== 'sunrise'
    }), {})
  );

  // Cache today's prayer times
  const todayPrayerTimesRef = useRef(null);
  const bottomSheetRef = useRef(null);
  const datePickerBottomSheetRef = useRef(null);
  const prayerStatusBottomSheetRef = useRef(null);

  // State for selected prayer in bottom sheet
  const [selectedPrayer, setSelectedPrayer] = useState(null);

  // State for prayer status confirmation
  const [pendingSwipe, setPendingSwipe] = useState(null);

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
        const existing = await Location.getForegroundPermissionsAsync();
        let status = existing.status;

        if (status !== 'granted' && existing.canAskAgain) {
          const requested = await Location.requestForegroundPermissionsAsync();
          status = requested.status;
        }

        if (status !== 'granted') {
          setLocationError(
            status === 'denied'
              ? 'Location permission denied. Please enable location access for this app in your browser or device settings.'
              : 'Location permission unavailable. Please enable location access for this app in your browser or device settings.'
          );
          setLoading(false);
          return;
        }

        const withTimeout = (promise, ms) =>
          Promise.race([
            promise,
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Location request timed out')), ms)
            ),
          ]);

        let locationData;

        try {
          locationData = await withTimeout(
            Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
              maximumAge: 60000,
            }),
            15000
          );
        } catch (positionError) {
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
            const city = address.city || address.locality || address.subAdministrativeArea || address.administrativeArea || 'Unknown';
            setLocationName(city);
          }
        } catch (geocodeError) {
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

      if (isToday && todayPrayerTimesRef.current && JSON.stringify(prayerTimes) === JSON.stringify(todayPrayerTimesRef.current)) {
        return;
      }

      const coordinates = new Adhan.Coordinates(
        location.coords.latitude,
        location.coords.longitude
      );

      const params = Adhan.CalculationMethod.MuslimWorldLeague();
      const prayerTimesData = new Adhan.PrayerTimes(coordinates, selectedDate, params);

      const formattedTimes = [
        formatPrayerTime(prayerTimesData.fajr),
        formatPrayerTime(prayerTimesData.sunrise),
        formatPrayerTime(prayerTimesData.dhuhr),
        formatPrayerTime(prayerTimesData.asr),
        formatPrayerTime(prayerTimesData.maghrib),
        formatPrayerTime(prayerTimesData.isha),
      ];

      if (isToday) {
        todayPrayerTimesRef.current = formattedTimes;
      }

      setPrayerTimes(formattedTimes);
      setLoading(false);
    }
  }, [location, selectedDate]);

  // Update current time every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(formatTime(new Date()));
    }, 10000);

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

  // Handle prayer row press
  const handlePrayerPress = (prayer) => {
    setSelectedPrayer(prayer);
    setTimeout(() => {
      bottomSheetRef.current?.snapToIndex(0);
    }, 200);
  };

  // Handle notification toggle
  const handleNotificationToggle = (enabled) => {
    if (selectedPrayer) {
      setNotifications(prev => ({
        ...prev,
        [selectedPrayer.name]: enabled
      }));
    }
  };

  // Handle date picker press
  const handleDatePickerPress = () => {
    datePickerBottomSheetRef.current?.snapToIndex(0);
  };

  // Handle date selection
  const handleDateSelect = (newDate) => {
    const today = new Date();
    const isNewDateToday = newDate.getDate() === today.getDate() &&
      newDate.getMonth() === today.getMonth() &&
      newDate.getFullYear() === today.getFullYear();

    if (isNewDateToday && todayPrayerTimesRef.current) {
      setPrayerTimes(todayPrayerTimesRef.current);
    }
    setSelectedDate(newDate);
  };

  // Handle prayer status update
  const handlePrayerStatusUpdate = (prayerName, status) => {
    const dateKey = selectedDate.toISOString().split('T')[0];

    setPrayerStatus(prev => {
      const newState = {
        ...prev,
        [dateKey]: {
          ...(prev[dateKey] || {}),
        },
      };

      if (status === null) {
        const { [prayerName]: _, ...rest } = newState[dateKey];
        newState[dateKey] = rest;
        if (Object.keys(newState[dateKey]).length === 0) {
          const { [dateKey]: __, ...restDates } = newState;
          return restDates;
        }
      } else {
        newState[dateKey][prayerName] = status;
      }

      return newState;
    });
  };

  // Handle swipe to confirm
  const handleSwipeToConfirm = (prayerName, prayerTime, direction) => {
    const dateKey = selectedDate.toISOString().split('T')[0];
    const currentStatus = prayerStatus[dateKey]?.[prayerName] || null;
    const swipeStatus = direction === 'right' ? 'on-time' : 'late';
    const isRemoving = currentStatus === swipeStatus;

    setPendingSwipe({ prayerName, prayerTime, direction, isRemoving });
    prayerStatusBottomSheetRef.current?.open({ prayerName, prayerTime, direction, isRemoving });
  };

  // Handle confirm
  const handleStatusConfirm = () => {
    prayerStatusBottomSheetRef.current?.close();

    setTimeout(() => {
      if (pendingSwipe?.prayerName && pendingSwipe?.direction) {
        if (pendingSwipe.isRemoving) {
          handlePrayerStatusUpdate(pendingSwipe.prayerName, null);
        } else {
          const status = pendingSwipe.direction === 'right' ? 'on-time' : 'late';
          handlePrayerStatusUpdate(pendingSwipe.prayerName, status);
        }
      }
      setPendingSwipe(null);
    }, 50);
  };

  // Handle cancel
  const handleStatusCancel = () => {
    prayerStatusBottomSheetRef.current?.close();
    setTimeout(() => {
      setPendingSwipe(null);
    }, 50);
  };

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
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: {
              backgroundColor: COLORS.background.primary,
              borderTopWidth: 0,
              paddingBottom: SPACING.sm,
              paddingTop: SPACING.sm,
              height: 60,
            },
            tabBarActiveTintColor: COLORS.text.primary,
            tabBarInactiveTintColor: COLORS.text.faded,
            tabBarShowLabel: false,
            tabBarIcon: ({ color, size }) => {
              let iconName;

              if (route.name === 'Home') {
                iconName = 'home-variant-outline';
              } else if (route.name === 'Qibla') {
                iconName = 'compass-outline';
              } else if (route.name === 'Tracker') {
                iconName = 'chart-line';
              } else if (route.name === 'Settings') {
                iconName = 'cog-outline';
              }

              return <MaterialCommunityIcons name={iconName} size={ICON_SIZES.lg} color={color} />;
            },
          })}
        >
          <Tab.Screen name="Home">
            {(props) => (
              <HomeScreen
                {...props}
                location={location}
                locationName={locationName}
                prayerTimes={prayerTimes}
                prayerNames={prayerNames}
                currentTime={currentTime}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                prayerStatus={prayerStatus}
                handlePrayerStatusUpdate={handlePrayerStatusUpdate}
                handlePrayerPress={handlePrayerPress}
                notifications={notifications}
                handleSwipeToConfirm={handleSwipeToConfirm}
                handleDatePickerPress={handleDatePickerPress}
                todayPrayerTimesRef={todayPrayerTimesRef}
                setPrayerTimes={setPrayerTimes}
              />
            )}
          </Tab.Screen>
          <Tab.Screen name="Qibla">
            {(props) => (
              <QiblaScreen
                {...props}
                qiblaBgOpacity={qiblaBgOpacity}
                onBackgroundChange={handleQiblaBackgroundChange}
              />
            )}
          </Tab.Screen>
          <Tab.Screen name="Tracker" component={TrackerScreen} />
          <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
      </NavigationContainer>

      {/* Bottom Sheets */}
      <PrayerDetailsBottomSheet
        bottomSheetRef={bottomSheetRef}
        selectedPrayer={selectedPrayer}
        notificationEnabled={selectedPrayer ? notifications[selectedPrayer.name] : false}
        onNotificationToggle={handleNotificationToggle}
      />

      <DatePickerBottomSheet
        bottomSheetRef={datePickerBottomSheetRef}
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
        prayerStatus={prayerStatus}
      />

      <PrayerStatusBottomSheet
        ref={prayerStatusBottomSheetRef}
        onConfirm={handleStatusConfirm}
        onCancel={handleStatusCancel}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.text.tertiary,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.weights.regular.primary,
    marginTop: SPACING.lg,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
});
