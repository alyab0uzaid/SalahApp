/**
 * Screen shown when app has no location (GPS denied + no manual city).
 * Allows user to enter city manually - App Store 5.1.5 compliance.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';
import { updateSetting } from '../utils/settingsStorage';
import { searchCity } from '../utils/geocoding';

export default function LocationSetupScreen({ onLocationSet }) {
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [citySearchResults, setCitySearchResults] = useState([]);
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (citySearchQuery.trim().length < 2) {
      setCitySearchResults([]);
      return;
    }
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearchingCity(true);
      const results = await searchCity(citySearchQuery, 5);
      setCitySearchResults(results);
      setIsSearchingCity(false);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [citySearchQuery]);

  const handleSelectCity = async (result) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const manual = {
      latitude: result.latitude,
      longitude: result.longitude,
      city: result.name,
      state: result.state || '',
      country: result.country,
    };
    await updateSetting('manualLocation', manual);
    onLocationSet(manual);
  };

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name="map-marker"
        size={64}
        color={COLORS.text.secondary}
        style={styles.icon}
      />
      <Text style={styles.title}>Set Your Location</Text>
      <Text style={styles.description}>
        Enter your city to get accurate prayer times. Your location is never shared.
      </Text>
      <TextInput
        style={styles.cityInput}
        placeholder="e.g. Austin, Texas or London, UK"
        placeholderTextColor={COLORS.text.tertiary}
        value={citySearchQuery}
        onChangeText={setCitySearchQuery}
      />
      {isSearchingCity && (
        <ActivityIndicator size="small" color={COLORS.text.secondary} style={styles.loader} />
      )}
      {citySearchResults.length > 0 && !isSearchingCity && (
        <ScrollView style={styles.results} nestedScrollEnabled>
          {citySearchResults.map((r, i) => (
            <Pressable
              key={i}
              style={({ pressed }) => [styles.resultItem, pressed && styles.resultItemPressed]}
              onPress={() => handleSelectCity(r)}
            >
              <Text style={styles.resultText}>{r.displayName}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  icon: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.weights.bold.primary,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  description: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.weights.regular.primary,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  cityInput: {
    width: '100%',
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.weights.regular.primary,
    color: COLORS.text.primary,
  },
  loader: {
    marginTop: SPACING.md,
  },
  results: {
    width: '100%',
    maxHeight: 200,
    marginTop: SPACING.md,
  },
  resultItem: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  resultItemPressed: {
    backgroundColor: COLORS.background.tertiary,
  },
  resultText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.weights.regular.primary,
    color: COLORS.text.primary,
  },
});
