import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Format time to "H:MM AM/PM" format
const formatTime = (date) => {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  if (hours === 0) hours = 12;
  
  return `${hours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

// Convert time string to minutes since midnight
const timeToMinutes = (timeStr) => {
  const [time, period] = timeStr.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  let totalMinutes = hours * 60 + minutes;
  if (period === 'PM' && hours !== 12) totalMinutes += 12 * 60;
  if (period === 'AM' && hours === 12) totalMinutes -= 12 * 60;
  return totalMinutes;
};

const Timer = ({ prayerTimes, prayerNames }) => {
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [nextPrayer, setNextPrayer] = useState({ name: '', time: '' });

  // Calculate next prayer and countdown
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const currentSeconds = now.getSeconds();
      
      // Convert all prayer times to minutes
      const timesInMinutes = prayerTimes.map(time => timeToMinutes(time));
      
      // Find next prayer
      let nextPrayerIndex = -1;
      let nextPrayerMinutes = -1;
      
      for (let i = 0; i < timesInMinutes.length; i++) {
        if (timesInMinutes[i] > currentMinutes) {
          nextPrayerIndex = i;
          nextPrayerMinutes = timesInMinutes[i];
          break;
        }
      }
      
      // If no prayer found today, use first prayer tomorrow
      if (nextPrayerIndex === -1) {
        nextPrayerIndex = 0;
        nextPrayerMinutes = timesInMinutes[0] + (24 * 60); // Add 24 hours
      }
      
      // Calculate time difference
      const totalMinutesUntil = nextPrayerMinutes - currentMinutes;
      const totalSecondsUntil = (totalMinutesUntil * 60) - currentSeconds;
      
      const hours = Math.floor(totalSecondsUntil / 3600);
      const minutes = Math.floor((totalSecondsUntil % 3600) / 60);
      const seconds = totalSecondsUntil % 60;
      
      setCountdown({ hours, minutes, seconds });
      setNextPrayer({
        name: prayerNames[nextPrayerIndex],
        time: prayerTimes[nextPrayerIndex]
      });
    };

    // Update immediately
    updateTimer();

    // Update every second for countdown
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [prayerTimes, prayerNames]);

  return (
    <View style={styles.timerContainer}>
      <Text style={styles.prayerLabel}>{nextPrayer.name} in</Text>
      <Text style={styles.countdown}>
        {countdown.hours}:{countdown.minutes.toString().padStart(2, '0')}:{countdown.seconds.toString().padStart(2, '0')}
      </Text>
      <Text style={styles.prayerTime}>{nextPrayer.time}</Text>
    </View>
  );
};

// Design system - spacing units
const styles = StyleSheet.create({
  timerContainer: {
    alignItems: 'center',
    marginTop: -80,
  },
  prayerLabel: {
    color: '#999',
    fontSize: 16,
    fontFamily: 'SpaceGrotesk_500Medium',
    marginBottom: -8,
  },
  countdown: {
    color: '#fff',
    fontSize: 48,
    fontFamily: 'SpaceGrotesk_500Medium',
    letterSpacing: 2,
    marginBottom: -8,
    fontVariant: ['tabular-nums'], // Makes numbers equal width to prevent shifting
  },
  prayerTime: {
    color: '#999',
    fontSize: 16,
    fontFamily: 'SpaceGrotesk_500Medium',
  },
});

export default Timer;

