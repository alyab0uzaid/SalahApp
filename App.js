import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useState, useEffect } from 'react';
import { useFonts } from 'expo-font';
import { SpaceGrotesk_400Regular, SpaceGrotesk_500Medium, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
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

export default function App() {
  // Load Space Grotesk font
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });

  // Prayer names
  const prayerNames = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  
  // Sample prayer times (matching the screenshot)
  const prayerTimes = [
    '5:22 AM',  // Fajr
    '6:37 AM',  // Sunrise
    '11:45 AM', // Dhuhr
    '2:28 PM',  // Asr
    '4:50 PM',  // Maghrib
    '6:06 PM',  // Isha
  ];

  // Get current time and update it every 10 seconds
  const [currentTime, setCurrentTime] = useState(() => {
    const now = new Date();
    return formatTime(now);
  });

  // Update current time every 10 seconds for smoother movement
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(formatTime(new Date()));
    }, 10000); // Update every 10 seconds

    // Also update immediately on mount
    setCurrentTime(formatTime(new Date()));

    return () => clearInterval(interval);
  }, []);

  if (!fontsLoaded) {
    return null; // Or a loading screen
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <PrayerArch 
        prayerTimes={prayerTimes}
        currentTime={currentTime}
        width={350}
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
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 60,
  },
});
