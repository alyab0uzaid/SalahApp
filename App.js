import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, ActivityIndicator, Dimensions } from 'react-native';
import { useState, useEffect } from 'react';
import { useFonts } from 'expo-font';
import { SpaceGrotesk_400Regular, SpaceGrotesk_500Medium, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import * as Location from 'expo-location';
import * as Adhan from 'adhan';
import PrayerArch from './components/PrayerArch';
import Timer from './components/Timer';

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
  // Load Space Grotesk font
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });

  // Prayer names
  const prayerNames = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  
  // State for location and prayer times
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [prayerTimes, setPrayerTimes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get current time and update it every 10 seconds
  const [currentTime, setCurrentTime] = useState(() => {
    const now = new Date();
    return formatTime(now);
  });

  // Request location permission and get location
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError('Location permission denied');
          setLoading(false);
          return;
        }

        let locationData = await Location.getCurrentPositionAsync({});
        setLocation(locationData);
      } catch (error) {
        setLocationError(error.message);
        setLoading(false);
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
          Unable to get location. Please enable location services.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <PrayerArch 
        prayerTimes={prayerTimes}
        currentTime={currentTime}
        width={Dimensions.get('window').width}
        height={200}
      />
      
      <Timer 
        prayerTimes={prayerTimes}
        prayerNames={prayerNames}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0E',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 60,
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
});
