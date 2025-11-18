import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, ActivityIndicator, Dimensions, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { useFonts } from 'expo-font';
import { SpaceGrotesk_400Regular, SpaceGrotesk_500Medium, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import * as Location from 'expo-location';
import * as Adhan from 'adhan';
import PrayerArch from './components/PrayerArch';
import ArchTimer from './components/ArchTimer';
import PrayerList from './components/PrayerList';
import LocationTag from './components/LocationTag';
import BottomNav from './components/BottomNav';

// Format time to "H:MM AM/PM" format
const formatTime = (date) => {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  if (hours === 0) hours = 12;
  
  return `${hours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

// Format Date object to "H:MM AM/PM" format
const formatPrayerTime = (date) => {
  if (!date) return '';
  return formatTime(date);
};

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
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);

  // Get current time and update it every 10 seconds
  const [currentTime, setCurrentTime] = useState(() => {
    const now = new Date();
    return formatTime(now);
  });

  // Request location permission and get location
  useEffect(() => {
    (async () => {
      try {
        console.log('Location effect started');

        // Check existing permission first – helpful on reloads
        const existing = await Location.getForegroundPermissionsAsync();
        console.log('Existing permission:', existing);

        // If we already have permission, skip the prompt
        let status = existing.status;

        if (status !== 'granted' && existing.canAskAgain) {
          console.log('Requesting permissions…');
          const requested = await Location.requestForegroundPermissionsAsync();
          console.log('Request result:', requested);
          status = requested.status;
        }

        if (status !== 'granted') {
          console.log('Permission not granted, status =', status);
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
          console.log('Getting current position…');
          locationData = await withTimeout(
            Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
              maximumAge: 60000,
            }),
            15000 // 15 seconds max
          );
          console.log('Got current position:', locationData);
        } catch (positionError) {
          console.log('Error getting current position:', positionError);
          // If the browser / device can't get a fresh fix, fall back to last known position
          try {
            const lastKnown = await Location.getLastKnownPositionAsync();
            console.log('Last known position:', lastKnown);
            if (lastKnown) {
              locationData = lastKnown;
            } else {
              throw positionError;
            }
          } catch (fallbackError) {
            console.log('Fallback error:', fallbackError);
            setLocationError(
              fallbackError.message ||
                'Unable to get location. Make sure location is enabled and reload the app.'
            );
            setLoading(false);
            return;
          }
        }

        setLocation(locationData);
        console.log('Location stored in state');
        
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
          console.log('Geocoding error:', geocodeError);
          // Fallback to coordinates if geocoding fails
          setLocationName(`${locationData.coords.latitude.toFixed(2)}, ${locationData.coords.longitude.toFixed(2)}`);
        }
      } catch (error) {
        console.log('Outer location error:', error);
        setLocationError(error.message);
        setLoading(false);
        return;
      }
    })();
  }, []);

  // Calculate prayer times when location is available
  useEffect(() => {
    if (location) {
      const coordinates = new Adhan.Coordinates(
        location.coords.latitude,
        location.coords.longitude
      );
      
      const params = Adhan.CalculationMethod.MuslimWorldLeague();
      const date = new Date();
      const prayerTimesData = new Adhan.PrayerTimes(coordinates, date, params);
      
      // Format prayer times
      const formattedTimes = [
        formatPrayerTime(prayerTimesData.fajr),
        formatPrayerTime(prayerTimesData.sunrise),
        formatPrayerTime(prayerTimesData.dhuhr),
        formatPrayerTime(prayerTimesData.asr),
        formatPrayerTime(prayerTimesData.maghrib),
        formatPrayerTime(prayerTimesData.isha),
      ];
      
      setPrayerTimes(formattedTimes);
      setLoading(false);
    }
  }, [location]);

  // Update current time every 10 seconds for smoother movement
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(formatTime(new Date()));
    }, 10000); // Update every 10 seconds

    // Also update immediately on mount
    setCurrentTime(formatTime(new Date()));

    return () => clearInterval(interval);
  }, []);


  if (!fontsLoaded || loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#fff" />
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
    <View style={styles.container} clipsToBounds={false}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          contentHeight > 0 && scrollViewHeight > 0 && contentHeight < scrollViewHeight && { minHeight: scrollViewHeight }
        ]}
        showsVerticalScrollIndicator={false}
        clipsToBounds={false}
        onContentSizeChange={(width, height) => setContentHeight(height)}
        onLayout={(event) => setScrollViewHeight(event.nativeEvent.layout.height)}
      >
        <LocationTag locationName={locationName} style={styles.locationTag} />

        <ArchTimer
          prayerTimes={prayerTimes}
          prayerNames={prayerNames}
          currentTime={currentTime}
          width={Dimensions.get('window').width}
          height={200}
          style={styles.archTimer}
        />
        <PrayerList
          prayerTimes={prayerTimes}
          prayerNames={prayerNames}
          currentTime={currentTime}
          style={styles.prayerList}
        />
      </ScrollView>
      <View style={styles.bottomNavWrapper}>
        <BottomNav
          activeTab={activeTab}
          onTabPress={setActiveTab}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A090E',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 0,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center', // Center content vertically when shorter than screen
    width: '100%',
    flexGrow: 1, // Allow content to grow for centering
    paddingTop: 20, // Minimal top padding for safe area
    paddingBottom: 20, // Minimal bottom padding
    overflow: 'visible',
  },
  // Normal spacing system - no wrapper compensation needed
  locationTag: {
    marginBottom: 24, // Normal spacing to next component
  },
  archTimer: {
    marginBottom: 24, // No spacing between ArchTimer and PrayerList
  },
  prayerList: {
    marginTop: 0, // Pull up to overlap with timer (timer extends beyond container)
  },
  scroll: {
    flex: 1,
    width: '100%',
  },
  bottomNavWrapper: {
    width: '100%',
    backgroundColor: '#0A090E',
    paddingBottom: 8,
  },
  centerContent: {
    justifyContent: 'center',
  },
  errorText: {
    color: '#999',
    fontSize: 16,
    fontFamily: 'SpaceGrotesk_400Regular',
    marginTop: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  timeSliderContainer: {
    width: '90%',
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#15141A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#23232A',
  },
  timeSliderLabel: {
    color: '#999',
    fontSize: 14,
    fontFamily: 'SpaceGrotesk_400Regular',
    marginBottom: 8,
  },
  timeSliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timeDisplay: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'SpaceMono_400Regular',
    letterSpacing: 1,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  resetButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#23232A',
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'SpaceGrotesk_500Medium',
  },
});
