import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, ActivityIndicator, Animated, Pressable } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { useFonts } from 'expo-font';
import { SpaceGrotesk_400Regular, SpaceGrotesk_500Medium, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
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
import AsrMethodScreen from './screens/AsrMethodScreen';
import TasbihScreen from './screens/TasbihScreen';
import PrayerDetailsBottomSheet from './components/PrayerDetailsBottomSheet';
import DatePickerBottomSheet from './components/DatePickerBottomSheet';
import PrayerStatusBottomSheet from './components/PrayerStatusBottomSheet';
import ResetConfirmBottomSheet from './components/ResetConfirmBottomSheet';
import LoadingScreen from './components/LoadingScreen';
import { formatTime, formatPrayerTime } from './utils/timeUtils';
import { COLORS, FONTS, SPACING, ICON_SIZES } from './constants/theme';
import { getSettings } from './utils/settingsStorage';

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

  const AsrMethodComponent = (props) => {
    return <AsrMethodScreen {...props} onSettingsChange={onSettingsChange} />;
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
        name="AsrMethod"
        component={AsrMethodComponent}
        options={{ headerShown: false }}
      />
    </SettingsStack.Navigator>
  );
}

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
  const resetConfirmBottomSheetRef = useRef(null);
  const tasbihResetCallbackRef = useRef(null);
  const appStartTimeRef = useRef(Date.now());
  const [minLoadingComplete, setMinLoadingComplete] = useState(false);

  // State for selected prayer in bottom sheet
  const [selectedPrayer, setSelectedPrayer] = useState(null);

  // State for prayer status confirmation
  const [pendingSwipe, setPendingSwipe] = useState(null);

  // State for calculation settings
  const [calculationSettings, setCalculationSettings] = useState({
    calculationMethod: 'MuslimWorldLeague',
    asrMethod: 'Standard',
  });

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

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getSettings();
      setCalculationSettings(settings);
    };
    loadSettings();
  }, []);

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

      const params = getCalculationMethod(calculationSettings.calculationMethod);
      
      // Set Asr calculation method (madhab)
      if (calculationSettings.asrMethod === 'Hanafi') {
        params.madhab = Adhan.Madhab.Hanafi;
      } else {
        params.madhab = Adhan.Madhab.Shafi;
      }

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
  }, [location, selectedDate, calculationSettings]);

  // Update current time every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(formatTime(new Date()));
    }, 10000);

    setCurrentTime(formatTime(new Date()));

    return () => clearInterval(interval);
  }, []);

  // Ensure minimum loading screen duration (1.5 seconds)
  useEffect(() => {
    const minLoadingDuration = 1500; // 1.5 seconds
    const elapsed = Date.now() - appStartTimeRef.current;
    const remainingTime = Math.max(0, minLoadingDuration - elapsed);

    const timer = setTimeout(() => {
      setMinLoadingComplete(true);
    }, remainingTime);

    return () => clearTimeout(timer);
  }, []);

  // Handle fade transition when loading is complete
  useEffect(() => {
    if (fontsLoaded && !loading && minLoadingComplete) {
      // Small delay to ensure content is rendered before fading
      setTimeout(() => {
        // Fade out loading screen
        Animated.timing(loadingOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          setLoadingFadeComplete(true);
        });
      }, 50);
    }
  }, [fontsLoaded, loading, minLoadingComplete]);

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

  // Check if content is ready to render
  const isContentReady = fontsLoaded && !loading && minLoadingComplete;
  
    return (
    <SafeAreaProvider>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      {/* Main content - rendered behind loading screen when ready */}
      {isContentReady && (
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
            {() => {
              const handleSettingsChange = async () => {
                try {
                  const settings = await getSettings();
                  setCalculationSettings(settings);
                } catch (error) {
                  console.error('Error loading settings:', error);
                }
              };

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
    </GestureHandlerRootView>
            );
          })()}
        </View>
      )}
      {/* Loading screen with fade-out - stays on top until fade completes */}
      {isContentReady && !loadingFadeComplete && (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: loadingOpacity, zIndex: 1000 }]}>
          <LoadingScreen />
        </Animated.View>
      )}
      {/* Show loading screen while content is not ready - only after fonts are loaded */}
      {!isContentReady && fontsLoaded && (
        <View style={StyleSheet.absoluteFill}>
          <LoadingScreen />
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
