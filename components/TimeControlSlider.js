import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';

const TimeControlSlider = ({ currentTime, onTimeChange }) => {
  // Convert time string to total seconds since midnight
  const timeToSeconds = (timeStr) => {
    const [time, period] = timeStr.split(' ');
    const parts = time.split(':').map(Number);
    const hours = parts[0];
    const minutes = parts[1] || 0;
    const seconds = parts[2] || 0;

    let totalSeconds = hours * 3600 + minutes * 60 + seconds;
    if (period === 'PM' && hours !== 12) totalSeconds += 12 * 3600;
    if (period === 'AM' && hours === 12) totalSeconds -= 12 * 3600;
    return totalSeconds;
  };

  // Convert seconds to time string
  const secondsToTime = (totalSeconds) => {
    const hours24 = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    const period = hours24 >= 12 ? 'PM' : 'AM';
    let hours12 = hours24 % 12;
    if (hours12 === 0) hours12 = 12;

    return `${hours12}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${period}`;
  };

  const currentSeconds = timeToSeconds(currentTime);
  const maxSeconds = 86399; // 23:59:59

  const handleSliderChange = (value) => {
    const newTime = secondsToTime(Math.floor(value));
    onTimeChange(newTime);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Time Control</Text>
        <Text style={styles.time}>{currentTime}</Text>
      </View>

      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>12:00 AM</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={maxSeconds}
          value={currentSeconds}
          onValueChange={handleSliderChange}
          minimumTrackTintColor="#FFFFFF"
          maximumTrackTintColor="#333333"
          thumbTintColor="#FFFFFF"
          step={1} // 1 second precision
        />
        <Text style={styles.sliderLabel}>11:59 PM</Text>
      </View>

      <View style={styles.timeDisplay}>
        <View style={styles.timeSegment}>
          <Text style={styles.timeValue}>{Math.floor(currentSeconds / 3600)}</Text>
          <Text style={styles.timeUnit}>hours</Text>
        </View>
        <Text style={styles.timeSeparator}>:</Text>
        <View style={styles.timeSegment}>
          <Text style={styles.timeValue}>{Math.floor((currentSeconds % 3600) / 60)}</Text>
          <Text style={styles.timeUnit}>minutes</Text>
        </View>
        <Text style={styles.timeSeparator}>:</Text>
        <View style={styles.timeSegment}>
          <Text style={styles.timeValue}>{Math.floor(currentSeconds % 60)}</Text>
          <Text style={styles.timeUnit}>seconds</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '90%',
    backgroundColor: '#15141A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#23232A',
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    color: '#999',
    fontSize: 14,
    fontFamily: 'SpaceGrotesk_500Medium',
  },
  time: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'SpaceMono_400Regular',
    letterSpacing: 1,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 12,
  },
  sliderLabel: {
    color: '#666',
    fontSize: 11,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  timeDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#23232A',
  },
  timeSegment: {
    alignItems: 'center',
    minWidth: 60,
  },
  timeValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'SpaceMono_700Bold',
    letterSpacing: 1,
  },
  timeUnit: {
    color: '#666',
    fontSize: 10,
    fontFamily: 'SpaceGrotesk_400Regular',
    marginTop: 2,
  },
  timeSeparator: {
    color: '#666',
    fontSize: 24,
    fontFamily: 'SpaceMono_700Bold',
    marginHorizontal: 8,
  },
});

export default TimeControlSlider;
