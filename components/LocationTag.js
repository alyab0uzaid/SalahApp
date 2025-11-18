import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

const LocationTag = ({ locationName, style }) => {
  if (!locationName) return null;

  return (
    <View style={[styles.locationTag, style]}>
      <FontAwesome
        name="location-arrow"
        size={16}
        color="#999"
      />
      <Text style={styles.locationText}>{locationName}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // No margins - spacing handled by wrapper in App.js
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#15141A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#23232A',
    alignSelf: 'center',
  },
  locationText: {
    color: '#999',
    fontSize: 14,
    fontFamily: 'SpaceGrotesk_400Regular',
    marginLeft: 6,
  },
});

export default LocationTag;

