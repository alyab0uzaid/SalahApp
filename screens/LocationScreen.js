/**
 * Settings screen for changing location (manual city entry).
 * Used when GPS is disabled or user wants to change city.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';
import { updateSetting, getSettings } from '../utils/settingsStorage';
import { searchCity } from '../utils/geocoding';

export default function LocationScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [citySearchResults, setCitySearchResults] = useState([]);
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      const s = await getSettings();
      setCurrentLocation(s.manualLocation);
    };
    load();
  }, []);

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
    setCurrentLocation(manual);
    setCitySearchQuery('');
    setCitySearchResults([]);
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.goBack();
          }}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color={COLORS.text.primary} />
        </Pressable>
        <Text style={styles.title}>Location</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.content}>
        {currentLocation && (
          <Text style={styles.currentLabel}>
            Current: {[currentLocation.city, currentLocation.state, currentLocation.country].filter(Boolean).join(', ')}
          </Text>
        )}
        <Text style={styles.description}>
          Search for your city to get accurate prayer times. Your location is never shared.
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.weights.medium.primary,
    color: COLORS.text.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  currentLabel: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.weights.regular.primary,
    color: COLORS.text.secondary,
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.weights.regular.primary,
    color: COLORS.text.secondary,
    marginBottom: SPACING.lg,
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
    flex: 1,
    maxHeight: 300,
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
