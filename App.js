import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, ActivityIndicator, Animated, Pressable } from 'react-native';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFonts } from 'expo-font';
import { SpaceGrotesk_400Regular, SpaceGrotesk_500Medium, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import * as Adhan from 'adhan';
import HomeScreen from './screens/HomeScreen';
import QiblaScreen from './screens/QiblaScreen';
import TrackerScreen from './screens/TrackerScreen';
import SettingsScreen from './screens/SettingsScreen';
import CalculationMethodScreen from './screens/CalculationMethodScreen';
import CalculationMethodSelectScreen from './screens/CalculationMethodSelectScreen';
import AdvancedCalculationScreen from './screens/AdvancedCalculationScreen';
import HighLatitudeRuleScreen from './screens/HighLatitudeRuleScreen';
import CustomAnglesScreen from './screens/CustomAnglesScreen';
import PrayerAdjustmentsScreen from './screens/PrayerAdjustmentsScreen';
import AsrMethodScreen from './screens/AsrMethodScreen';
import DisplayTimeScreen from './screens/DisplayTimeScreen';
import TasbihScreen from './screens/TasbihScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import PrayerDetailsBottomSheet from './components/PrayerDetailsBottomSheet';
import DatePickerBottomSheet from './components/DatePickerBottomSheet';
import PrayerStatusBottomSheet from './components/PrayerStatusBottomSheet';
import ResetConfirmBottomSheet from './components/ResetConfirmBottomSheet';
import LoadingScreen from './components/LoadingScreen';
import { formatTime, formatPrayerTime } from './utils/timeUtils';
import { COLORS, FONTS, SPACING, ICON_SIZES } from './constants/theme';
import { getSettings, getPrayerStatus, savePrayerStatus, getMethodForCountry, updateSetting } from './utils/settingsStorage';

const Tab = createBottomTabNavigator();
const SettingsStack = createStackNavigator();

// Settings Stack Navigator Component
function SettingsStackNavigator({ onSettingsChange }) {

  // Create component wrappers that pass both navigation props and callback
  const SettingsMainComponent = (props) => {
    return <SettingsScreen {...props} onSettingsChange={onSettingsChange} />;
  };

  const CalculationMethodComponent = (props) => {
    return <CalculationMethodScreen {...props} onSettingsChange={onSettingsChange} />;
  };
  
  const CalculationMethodSelectComponent = (props) => {
    return <CalculationMethodSelectScreen {...props} onSettingsChange={onSettingsChange} />;
  };

  const AdvancedCalculationComponent = (props) => {
    return <AdvancedCalculationScreen {...props} onSettingsChange={onSettingsChange} />;
  };

  const HighLatitudeRuleComponent = (props) => {
    return <HighLatitudeRuleScreen {...props} onSettingsChange={onSettingsChange} />;
  };

  const CustomAnglesComponent = (props) => {
    return <CustomAnglesScreen {...props} onSettingsChange={onSettingsChange} />;
  };

  const PrayerAdjustmentsComponent = (props) => {
    return <PrayerAdjustmentsScreen {...props} onSettingsChange={onSettingsChange} />;
  };

  const AsrMethodComponent = (props) => {
    return <AsrMethodScreen {...props} onSettingsChange={onSettingsChange} />;
  };

  const DisplayTimeComponent = (props) => {
    return <DisplayTimeScreen {...props} onSettingsChange={onSettingsChange} />;
  };

  return (
    <SettingsStack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="SettingsMain"
    >
      <SettingsStack.Screen
        name="SettingsMain"
        component={SettingsMainComponent}
        options={{ headerShown: false }}
      />
      <SettingsStack.Screen
        name="CalculationMethod"
        component={CalculationMethodComponent}
        options={{ headerShown: false }}
      />
      <SettingsStack.Screen
        name="CalculationMethodSelect"
        component={CalculationMethodSelectComponent}
        options={{ headerShown: false }}
      />
      <SettingsStack.Screen
        name="AdvancedCalculation"
        component={AdvancedCalculationComponent}
        options={{ headerShown: false }}
      />
      <SettingsStack.Screen
        name="HighLatitudeRule"
        component={HighLatitudeRuleComponent}
        options={{ headerShown: false }}
      />
      <SettingsStack.Screen
        name="CustomAngles"
        component={CustomAnglesComponent}
        options={{ headerShown: false }}
      />
      <SettingsStack.Screen
        name="PrayerAdjustments"
        component={PrayerAdjustmentsComponent}
        options={{ headerShown: false }}
      />
      <SettingsStack.Screen
        name="AsrMethod"
        component={AsrMethodComponent}
        options={{ headerShown: false }}
      />
      <SettingsStack.Screen
        name="DisplayTime"
        component={DisplayTimeComponent}
        options={{ headerShown: false }}
      />
    </SettingsStack.Navigator>
  );
}

export default function App() {
  // Onboarding will only show on first app launch (when onboardingCompleted is false/null)
  // To reset onboarding for testing, use the resetOnboarding function from settingsStorage
  // or delete and reinstall the app

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
  const [locationCountry, setLocationCountry] = useState(null); // Store country for auto-detection
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
  const lastTimeFormatRef = useRef('12'); // Initialize with default, will be updated when settings load
  const bottomSheetRef = useRef(null);
  const datePickerBottomSheetRef = useRef(null);
  const prayerStatusBottomSheetRef = useRef(null);
  const resetConfirmBottomSheetRef = useRef(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(true); // Default to true, will be set by settings load
  const tasbihResetCallbackRef = useRef(null);
  const appStartTimeRef = useRef(Date.now());
  const [minLoadingComplete, setMinLoadingComplete] = useState(false);
  const prayerStatusInitializedRef = useRef(false);

  // State for selected prayer in bottom sheet
  const [selectedPrayer, setSelectedPrayer] = useState(null);

  // State for prayer status confirmation
  const [pendingSwipe, setPendingSwipe] = useState(null);

  // State for calculation settings
  const [calculationSettings, setCalculationSettings] = useState({
    calculationMethod: 'MuslimWorldLeague',
    asrMethod: 'Standard',
  });

  // State for display settings
  const [displaySettings, setDisplaySettings] = useState({
    timeFormat: '12',
    dateFormat: 'MM/DD/YYYY',
    _updated: 0, // Internal field to force updates
  });

  // Separate state for timeFormat to force updates
  const [timeFormat, setTimeFormat] = useState('12');

  // Ref to track if settings update is from internal action (to prevent flicker)
  const isInternalSettingsUpdateRef = useRef(false);

  // Animated background color for Qibla alignment
  const qiblaBgOpacity = useRef(new Animated.Value(0)).current;

  // Animated opacity for loading screen fade-out
  const loadingOpacity = useRef(new Animated.Value(1)).current;
  const [loadingFadeComplete, setLoadingFadeComplete] = useState(false);

  // Get current time and update it every 10 seconds
  const [currentTime, setCurrentTime] = useState(() => {
    const now = new Date();
    return formatTime(now);
  });

  // Fetch location (call this after permission is granted)
  const fetchLocation = async () => {
    try {
      const existing = await Location.getForegroundPermissionsAsync();
      let status = existing.status;

      // If permission is not granted, wait (user might be in onboarding)
      if (status !== 'granted') {
        // Don't show error yet - user might grant permission during onboarding
        setLoading(false);
        return;
      }

        // Permission is granted, proceed with getting location
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

        // Reverse geocode to get location name and country
        try {
          const reverseGeocode = await Location.reverseGeocodeAsync({
            latitude: locationData.coords.latitude,
            longitude: locationData.coords.longitude,
          });

          if (reverseGeocode && reverseGeocode.length > 0) {
            const address = reverseGeocode[0];
            const city = address.city || address.locality || address.subAdministrativeArea || address.administrativeArea || 'Unknown';
            const country = address.country || null;

            setLocationName(city);
            setLocationCountry(country);

            // Auto-detect calculation method if enabled
            const settings = await getSettings();
            if (settings.calculationMethodAuto && country) {
              const recommendedMethod = getMethodForCountry(country);

              // Only update if different from current method
              if (recommendedMethod !== settings.calculationMethod) {
                await updateSetting('calculationMethod', recommendedMethod);

                // Update local state to trigger prayer time recalculation
                setCalculationSettings(prev => ({
                  ...prev,
                  calculationMethod: recommendedMethod,
                }));

                console.log(`[Auto-detect] Country: ${country}, Method: ${recommendedMethod}`);
              }
            }
          }
        } catch (geocodeError) {
          setLocationName(`${locationData.coords.latitude.toFixed(2)}, ${locationData.coords.longitude.toFixed(2)}`);
        }

      // Location successfully fetched, set loading to false
      setLoading(false);
    } catch (error) {
      setLocationError(error.message);
      setLoading(false);
      return;
    }
  };

  // Try to fetch location on mount (will succeed if permission already granted)
  useEffect(() => {
    fetchLocation();
  }, []);

  // Load settings and prayer status on mount
  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getSettings();
      const timeFormat = settings.timeFormat || '12';
      const dateFormat = settings.dateFormat || 'MM/DD/YYYY';
      setCalculationSettings({
        calculationMethod: settings.calculationMethod || 'MuslimWorldLeague',
        asrMethod: settings.asrMethod || 'Standard', // Default to Standard if not set (for backward compatibility)
      });
      setDisplaySettings({
        timeFormat: timeFormat,
        dateFormat: dateFormat,
        _updated: Date.now(), // Force new reference
      });
      // Also update the separate timeFormat state
      setTimeFormat(timeFormat);
      lastTimeFormatRef.current = timeFormat;

      // Check onboarding status
      const completed = settings.onboardingCompleted !== false; // Default to true if not set
      setOnboardingCompleted(completed);
    };
    
    const loadPrayerStatus = async () => {
      const savedStatus = await getPrayerStatus();
      setPrayerStatus(savedStatus);
      // Mark as initialized after loading (with a small delay to ensure state is set)
      setTimeout(() => {
        prayerStatusInitializedRef.current = true;
      }, 100);
    };
    
    loadSettings();
    loadPrayerStatus();
  }, []);

  // Handle onboarding completion
  const handleOnboardingComplete = async () => {
    // Mark onboarding as completed (this will hide onboarding and show loading screen)
    setOnboardingCompleted(true);
    setLoading(true);
    setLoadingFadeComplete(false);

    // Reset minimum loading timer so loading screen shows for full duration
    setMinLoadingComplete(false);
    appStartTimeRef.current = Date.now(); // Reset start time for minimum loading duration

    // Fetch location now that permission should be granted
    await fetchLocation();
  };

  // Helper function to get calculation method
  const getCalculationMethod = (methodName) => {
    const methodMap = {
      'MuslimWorldLeague': Adhan.CalculationMethod.MuslimWorldLeague,
      'IslamicSocietyOfNorthAmerica': Adhan.CalculationMethod.IslamicSocietyOfNorthAmerica,
      'Egyptian': Adhan.CalculationMethod.Egyptian,
      'UmmAlQura': Adhan.CalculationMethod.UmmAlQura,
      'UniversityOfIslamicSciencesKarachi': Adhan.CalculationMethod.UniversityOfIslamicSciencesKarachi,
      'InstituteOfGeophysicsUniversityOfTehran': Adhan.CalculationMethod.InstituteOfGeophysicsUniversityOfTehran,
      'Shia': Adhan.CalculationMethod.Shia,
      'Gulf': Adhan.CalculationMethod.Gulf,
      'Kuwait': Adhan.CalculationMethod.Kuwait,
      'Qatar': Adhan.CalculationMethod.Qatar,
      'Singapore': Adhan.CalculationMethod.Singapore,
      'Other': Adhan.CalculationMethod.Other,
    };
    
    const method = methodMap[methodName] || Adhan.CalculationMethod.MuslimWorldLeague;
    return method();
  };

  // Calculate prayer times when location, selected date, or settings change
  useEffect(() => {
    const calculatePrayerTimes = async () => {
      if (location && displaySettings) {
        const today = new Date();
        const isToday = selectedDate.getDate() === today.getDate() &&
          selectedDate.getMonth() === today.getMonth() &&
          selectedDate.getFullYear() === today.getFullYear();

        // Use the separate timeFormat state
        const currentTimeFormat = timeFormat || '12';
        const timeFormatChanged = lastTimeFormatRef.current !== currentTimeFormat;
        if (timeFormatChanged) {
          lastTimeFormatRef.current = currentTimeFormat;
          // Clear cache to force recalculation
          if (isToday) {
            todayPrayerTimesRef.current = null;
          }
        }

        // Skip recalculation only if it's today, times are cached, format hasn't changed, and times match
        if (isToday && todayPrayerTimesRef.current && !timeFormatChanged && JSON.stringify(prayerTimes) === JSON.stringify(todayPrayerTimesRef.current)) {
          return;
        }

        const coordinates = new Adhan.Coordinates(
          location.coords.latitude,
          location.coords.longitude
        );

        const params = getCalculationMethod(calculationSettings.calculationMethod);

        // Set Asr calculation method (madhab)
        if (calculationSettings.asrMethod === 'Hanafi') {
          params.madhab = Adhan.Madhab.Hanafi;
        } else {
          params.madhab = Adhan.Madhab.Shafi;
        }

        // Apply custom angles if set
        const settings = await getSettings();
        if (settings.customAngles?.fajrAngle !== null && settings.customAngles?.fajrAngle !== undefined) {
          params.fajrAngle = settings.customAngles.fajrAngle;
        }
        if (settings.customAngles?.ishaAngle !== null && settings.customAngles?.ishaAngle !== undefined) {
          params.ishaAngle = settings.customAngles.ishaAngle;
        }
        if (settings.customAngles?.ishaInterval !== null && settings.customAngles?.ishaInterval !== undefined) {
          params.ishaInterval = settings.customAngles.ishaInterval;
        }

        // Apply high latitude rule
        if (settings.highLatitudeRule) {
          const ruleMap = {
            'MiddleOfTheNight': Adhan.HighLatitudeRule.MiddleOfTheNight,
            'SeventhOfTheNight': Adhan.HighLatitudeRule.SeventhOfTheNight,
            'TwilightAngle': Adhan.HighLatitudeRule.TwilightAngle,
          };
          params.highLatitudeRule = ruleMap[settings.highLatitudeRule] || Adhan.HighLatitudeRule.MiddleOfTheNight;
        }

        // Apply prayer adjustments
        if (settings.prayerAdjustments) {
          params.adjustments = {
            fajr: settings.prayerAdjustments.Fajr || 0,
            sunrise: settings.prayerAdjustments.Sunrise || 0,
            dhuhr: settings.prayerAdjustments.Dhuhr || 0,
            asr: settings.prayerAdjustments.Asr || 0,
            maghrib: settings.prayerAdjustments.Maghrib || 0,
            isha: settings.prayerAdjustments.Isha || 0,
          };
        }

        const prayerTimesData = new Adhan.PrayerTimes(coordinates, selectedDate, params);

        const formattedTimes = [
          formatPrayerTime(prayerTimesData.fajr, currentTimeFormat),
          formatPrayerTime(prayerTimesData.sunrise, currentTimeFormat),
          formatPrayerTime(prayerTimesData.dhuhr, currentTimeFormat),
          formatPrayerTime(prayerTimesData.asr, currentTimeFormat),
          formatPrayerTime(prayerTimesData.maghrib, currentTimeFormat),
          formatPrayerTime(prayerTimesData.isha, currentTimeFormat),
        ];

        if (isToday) {
          todayPrayerTimesRef.current = formattedTimes;
        }

        console.log('[App] Prayer times recalculated with format:', currentTimeFormat);
        setPrayerTimes(formattedTimes);
        setLoading(false);
      }
    };

    calculatePrayerTimes();
  }, [location, selectedDate, calculationSettings, timeFormat]);

  // Update current time every 10 seconds
  useEffect(() => {
    console.log('[App] Current time format changed to:', timeFormat);
    // Update immediately when format changes
    setCurrentTime(formatTime(new Date(), timeFormat));
    
    const interval = setInterval(() => {
      setCurrentTime(formatTime(new Date(), timeFormat));
    }, 10000);

    return () => clearInterval(interval);
  }, [timeFormat]);

  // Ensure minimum loading screen duration (1.5 seconds)
  useEffect(() => {
    // Only run timer when minLoadingComplete is false (initial load or after onboarding)
    if (!minLoadingComplete) {
      const minLoadingDuration = 1500; // 1.5 seconds
      const elapsed = Date.now() - appStartTimeRef.current;
      const remainingTime = Math.max(0, minLoadingDuration - elapsed);

      const timer = setTimeout(() => {
        setMinLoadingComplete(true);
      }, remainingTime);

      return () => clearTimeout(timer);
    }
  }, [minLoadingComplete]);

  // Handle fade transition when loading is complete
  useEffect(() => {
    // Check if app is ready
    const isReady = fontsLoaded && !loading && minLoadingComplete;

    if (isReady && !loadingFadeComplete) {
      // App is ready - fade out loading screen normally
      // Ensure opacity is at 1 before starting fade (in case it was set to 0)
      if (loadingOpacity._value === 0) {
        loadingOpacity.setValue(1);
      }

      // Small delay to ensure content is rendered before fading
      setTimeout(() => {
        Animated.timing(loadingOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          setLoadingFadeComplete(true);
        });
      }, 50);
    }
  }, [fontsLoaded, loading, minLoadingComplete, loadingFadeComplete]);

  // Handle Qibla background color change
  const handleQiblaBackgroundChange = (isAligned) => {
    Animated.timing(qiblaBgOpacity, {
      toValue: isAligned ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // Handle settings change - memoized to prevent unnecessary re-renders
  const handleSettingsChange = useCallback(async () => {
    try {
      const settings = await getSettings();
      const newTimeFormat = settings.timeFormat || '12';
      const newDateFormat = settings.dateFormat || 'MM/DD/YYYY';
      const newCalculationMethod = settings.calculationMethod || 'MuslimWorldLeague';
      const newAsrMethod = settings.asrMethod || 'Standard';

      console.log('[Settings] Updating timeFormat to:', newTimeFormat);

      // Only update calculationSettings if values actually changed
      setCalculationSettings(prev => {
        if (prev.calculationMethod !== newCalculationMethod || prev.asrMethod !== newAsrMethod) {
          return {
            calculationMethod: newCalculationMethod,
            asrMethod: newAsrMethod,
          };
        }
        return prev; // Return same reference if no change
      });

      // Only update displaySettings if values actually changed
      setDisplaySettings(prev => {
        if (prev.timeFormat !== newTimeFormat || prev.dateFormat !== newDateFormat) {
          return {
            timeFormat: newTimeFormat,
            dateFormat: newDateFormat,
            _updated: Date.now(),
          };
        }
        return prev; // Return same reference if no change
      });

      // Only update timeFormat if it changed
      setTimeFormat(prev => prev !== newTimeFormat ? newTimeFormat : prev);

      console.log('[Settings] displaySettings updated, new timeFormat:', newTimeFormat);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }, []);

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

  // Save prayer status to storage whenever it changes
  useEffect(() => {
    // Skip saving on initial load (when data is being loaded from storage)
    if (!prayerStatusInitializedRef.current) {
      prayerStatusInitializedRef.current = true;
      return;
    }
    
    // Save prayer status whenever it changes after initial load
    savePrayerStatus(prayerStatus);
  }, [prayerStatus]);

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

  // Check if content is ready to render
  const isContentReady = fontsLoaded && !loading && minLoadingComplete;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      {/* Main content - rendered when ready and onboarding is completed */}
      {isContentReady && onboardingCompleted && (
        <View style={StyleSheet.absoluteFill} pointerEvents={loadingFadeComplete ? 'auto' : 'none'}>
          {(() => {
            // Show error screen if location failed and no prayer times
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
      <BottomSheetModalProvider>
        <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: {
              backgroundColor: COLORS.background.primary,
              borderTopWidth: 0,
                        paddingBottom: SPACING.xxxl,
              paddingTop: SPACING.sm,
                        height: SPACING.sm + ICON_SIZES.lg + SPACING.xs + SPACING.xxxl,
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
                        } else if (route.name === 'Tasbih') {
                          iconName = 'circle-multiple';
              }

              return <MaterialCommunityIcons name={iconName} size={ICON_SIZES.lg} color={color} />;
            },
          })}
                    tabBar={(props) => {
                      // Custom tab bar that animates background on Qibla screen
                      const { state, descriptors, navigation } = props;
                      const isQiblaScreen = state.routes[state.index]?.name === 'Qibla';
                      
                      // Interpolate background color for Qibla alignment
                      const tabBarBackgroundColor = qiblaBgOpacity.interpolate({
                        inputRange: [0, 1],
                        outputRange: [COLORS.background.primary, 'rgb(49, 199, 86)'],
                      });

                      return (
                        <Animated.View
                          style={[
                            {
                              backgroundColor: isQiblaScreen ? tabBarBackgroundColor : COLORS.background.primary,
                              borderTopWidth: 0,
                              paddingBottom: SPACING.xxxl,
                              paddingTop: SPACING.sm,
                              height: SPACING.sm + ICON_SIZES.lg + SPACING.xs + SPACING.xxxl,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-around',
                            }
                          ]}
                        >
                          {state.routes.map((route, index) => {
                            const { options } = descriptors[route.key];
                            const isFocused = state.index === index;

                            const onPress = () => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              const event = navigation.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                              });

                              if (!isFocused && !event.defaultPrevented) {
                                navigation.navigate(route.name);
                              }
                            };

                            // Use white with opacity for inactive icons on Qibla screen
                            const tintColor = isFocused
                              ? COLORS.text.primary
                              : isQiblaScreen
                              ? 'rgba(255, 255, 255, 0.37)'
                              : COLORS.text.faded;

                            return (
                              <Pressable
                                key={route.key}
                                onPress={onPress}
                                style={{
                                  flex: 1,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {options.tabBarIcon?.({ color: tintColor, size: ICON_SIZES.lg })}
                              </Pressable>
                            );
                          })}
                        </Animated.View>
                      );
                    }}
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
                          locationName={locationName}
                        />
                      )}
                    </Tab.Screen>
                    <Tab.Screen name="Tracker">
                      {(props) => (
                        <TrackerScreen
                          {...props}
                          prayerStatus={prayerStatus}
                          prayerTimes={prayerTimes}
                          prayerNames={prayerNames}
                          currentTime={currentTime}
                          selectedDate={selectedDate}
                          setSelectedDate={setSelectedDate}
                          handlePrayerStatusUpdate={handlePrayerStatusUpdate}
                          handlePrayerPress={handlePrayerPress}
                          notifications={notifications}
                          handleSwipeToConfirm={handleSwipeToConfirm}
                          handleDatePickerPress={handleDatePickerPress}
                          locationName={locationName}
              />
            )}
          </Tab.Screen>
                    <Tab.Screen name="Tasbih">
                      {() => <TasbihScreen resetBottomSheetRef={resetConfirmBottomSheetRef} onResetConfirm={tasbihResetCallbackRef} />}
                    </Tab.Screen>
          <Tab.Screen name="Settings" options={{ headerShown: false }}>
            {(props) => {
              // Reload settings when Settings tab comes into focus
              React.useEffect(() => {
                const unsubscribe = props.navigation?.addListener('focus', () => {
                  handleSettingsChange();
                });
                return unsubscribe;
              }, [props.navigation]);

              return <SettingsStackNavigator onSettingsChange={handleSettingsChange} />;
            }}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>

      {/* Bottom Sheets */}
      <PrayerDetailsBottomSheet
        bottomSheetRef={bottomSheetRef}
        selectedPrayer={selectedPrayer}
        notificationEnabled={selectedPrayer ? notifications[selectedPrayer.name] : false}
        onNotificationToggle={handleNotificationToggle}
                  selectedDate={selectedDate}
                  prayerStatus={prayerStatus}
                  onPrayerStatusUpdate={handlePrayerStatusUpdate}
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
                <ResetConfirmBottomSheet
                  ref={resetConfirmBottomSheetRef}
                  onConfirm={() => {
                    resetConfirmBottomSheetRef.current?.close();
                    if (tasbihResetCallbackRef.current) {
                      tasbihResetCallbackRef.current();
                    }
                  }}
                  onCancel={() => {
                    resetConfirmBottomSheetRef.current?.close();
                  }}
                />
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
            );
          })()}
        </View>
      )}
      {/* Loading screen - show during initial load when not ready yet, OR when onboarding is active */}
      {fontsLoaded && (!isContentReady || !onboardingCompleted) && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}>
          <LoadingScreen />
        </View>
      )}
      {/* Animated loading screen fade - always show when content is ready and fade not complete */}
      {isContentReady && onboardingCompleted && !loadingFadeComplete && (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: loadingOpacity, zIndex: 1000 }]}>
          <LoadingScreen />
        </Animated.View>
      )}
      {/* Onboarding screen - shows on top of loading screen on first launch */}
      {!onboardingCompleted && fontsLoaded && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 2000 }]}>
          <OnboardingScreen onComplete={handleOnboardingComplete} />
        </View>
      )}
    </SafeAreaProvider>
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
