import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { RulerPicker } from 'react-native-ruler-picker';
import { COLORS, FONTS, SPACING, RADIUS, ICON_SIZES } from '../constants/theme';
import * as Haptics from 'expo-haptics';
import { getSettings, saveSettings } from '../utils/settingsStorage';

export default function CustomAnglesScreen({ navigation, onSettingsChange }) {
  const insets = useSafeAreaInsets();

  // Custom angles
  const [fajrAngle, setFajrAngle] = useState('');
  const [ishaAngle, setIshaAngle] = useState('');
  const [ishaInterval, setIshaInterval] = useState('');

  // Bottom sheet refs
  const fajrAngleSheetRef = useRef(null);
  const ishaAngleSheetRef = useRef(null);
  const ishaIntervalSheetRef = useRef(null);

  // Current editing type
  const [editingType, setEditingType] = useState(null);

  // Temporary input values for bottom sheet
  const [tempValue, setTempValue] = useState('0');

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const settings = await getSettings();

    // Load custom angles, default to 15.0 if not set
    if (settings.customAngles?.fajrAngle !== null && settings.customAngles?.fajrAngle !== undefined) {
      setFajrAngle(settings.customAngles.fajrAngle.toString());
    } else {
      setFajrAngle('15.0');
    }
    if (settings.customAngles?.ishaAngle !== null && settings.customAngles?.ishaAngle !== undefined) {
      setIshaAngle(settings.customAngles.ishaAngle.toString());
    } else {
      setIshaAngle('15.0');
    }
    if (settings.customAngles?.ishaInterval !== null && settings.customAngles?.ishaInterval !== undefined) {
      setIshaInterval(settings.customAngles.ishaInterval.toString());
    } else {
      setIshaInterval('0');
    }
  };

  const handleOpenBottomSheet = (type) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Set temp value to current value and open the correct sheet
    if (type === 'fajr') {
      setEditingType('fajr');
      setTempValue(fajrAngle || '15');
      requestAnimationFrame(() => {
        fajrAngleSheetRef.current?.present();
      });
    } else if (type === 'isha') {
      setEditingType('isha');
      setTempValue(ishaAngle || '15');
      requestAnimationFrame(() => {
        ishaAngleSheetRef.current?.present();
      });
    } else if (type === 'interval') {
      setEditingType('interval');
      setTempValue(ishaInterval || '0');
      requestAnimationFrame(() => {
        ishaIntervalSheetRef.current?.present();
      });
    }
  };

  const handleSaveAngle = async () => {
    try {
      const type = editingType;
      if (!type) return;

      // Get the current settings first
      const settings = await getSettings();
      
      // Update the specific angle based on temp value
      if (type === 'fajr') {
        const newValue = tempValue;
        setFajrAngle(newValue);
        settings.customAngles = {
          ...settings.customAngles,
          fajrAngle: newValue && newValue !== '0' ? parseFloat(newValue) : null,
        };
        fajrAngleSheetRef.current?.dismiss();
      } else if (type === 'isha') {
        const newValue = tempValue;
        setIshaAngle(newValue);
        settings.customAngles = {
          ...settings.customAngles,
          ishaAngle: newValue && newValue !== '0' ? parseFloat(newValue) : null,
        };
        ishaAngleSheetRef.current?.dismiss();
      } else if (type === 'interval') {
        const newValue = tempValue;
        setIshaInterval(newValue);
        settings.customAngles = {
          ...settings.customAngles,
          ishaInterval: newValue && newValue !== '0' ? parseFloat(newValue) : null,
        };
        ishaIntervalSheetRef.current?.dismiss();
      }

      // Ensure customAngles object exists
      if (!settings.customAngles) {
        settings.customAngles = {
          fajrAngle: null,
          ishaAngle: null,
          ishaInterval: null,
        };
      }

      await saveSettings(settings);

      if (onSettingsChange) {
        await onSettingsChange();
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEditingType(null);
    } catch (error) {
      console.error('Error saving custom angle:', error);
    }
  };

  const handleRulerValueChange = (value) => {
    // onValueChange returns a string
    setTempValue(value);
    // Light haptic feedback on every value change
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const getRulerConfig = () => {
    if (editingType === 'fajr' || editingType === 'isha') {
      // Angles: 9-18.5 degrees, step 0.5
      // Range: 9 to 18.5 with step 0.5 = 20 values (indices 0-19)
      // With library's index % 10 === 0 logic: tall ticks at 0 (9°) and 10 (14°)
      // Note: Cannot get 5 tall ticks with this range and step due to library's modulo logic
      return {
        min: 9,
        max: 18.5,
        step: 0.5,
        unit: '°',
      };
    } else if (editingType === 'interval') {
      // Interval: 0-120 minutes, step 1
      return {
        min: 0,
        max: 120,
        step: 1,
        unit: ' min',
      };
    }
    return { min: 9, max: 18.5, step: 0.5, unit: '' };
  };

  // Backdrop component
  const renderBackdrop = (props) => (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      opacity={0.5}
      pressBehavior="close"
    />
  );

  const getTitle = () => {
    if (editingType === 'fajr') return 'Fajr Angle (degrees)';
    if (editingType === 'isha') return 'Isha Angle (degrees)';
    if (editingType === 'interval') return 'Isha Interval (minutes)';
    return '';
  };

  const formatDisplayValue = (value) => {
    if (!value || value === '') {
      return '15.0';
    }
    return value;
  };

  const handleReset = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const settings = await getSettings();
      
      // Reset all angles to 15.0
      setFajrAngle('15.0');
      setIshaAngle('15.0');
      setIshaInterval('0');
      
      settings.customAngles = {
        fajrAngle: 15.0,
        ishaAngle: 15.0,
        ishaInterval: 0,
      };
      
      await saveSettings(settings);
      
      if (onSettingsChange) {
        await onSettingsChange();
      }
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error resetting angles:', error);
    }
  };

  return (
    <>
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation?.goBack();
          }}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={ICON_SIZES.lg}
            color={COLORS.text.primary}
          />
        </Pressable>
        <Text style={styles.headerTitle}>Custom Angles</Text>
        <Pressable
          style={styles.backButton}
          onPress={handleReset}
        >
          <MaterialCommunityIcons
            name="refresh"
            size={ICON_SIZES.lg}
            color={COLORS.text.primary}
          />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.description}>
          Override the default angles for your selected calculation method. Leave empty to use method defaults.
        </Text>

        <View style={styles.settingsContainer}>
          {/* Fajr Angle */}
          <Pressable
            style={styles.settingButton}
            onPress={() => handleOpenBottomSheet('fajr')}
          >
            <View style={styles.settingButtonContent}>
              <Text style={styles.settingLabel}>Fajr Angle</Text>
              <View style={styles.settingValueRow}>
                <Text style={styles.settingValue} numberOfLines={1}>
                  {formatDisplayValue(fajrAngle)}
                </Text>
                <View style={styles.chevronContainer}>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={ICON_SIZES.md}
                    color={COLORS.text.secondary}
                  />
                </View>
              </View>
            </View>
          </Pressable>

          <View style={styles.separator} />

          {/* Isha Angle */}
          <Pressable
            style={styles.settingButton}
            onPress={() => handleOpenBottomSheet('isha')}
          >
            <View style={styles.settingButtonContent}>
              <Text style={styles.settingLabel}>Isha Angle</Text>
              <View style={styles.settingValueRow}>
                <Text style={styles.settingValue} numberOfLines={1}>
                  {formatDisplayValue(ishaAngle)}
                </Text>
                <View style={styles.chevronContainer}>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={ICON_SIZES.md}
                    color={COLORS.text.secondary}
                  />
                </View>
              </View>
            </View>
          </Pressable>

          <View style={styles.separator} />

          {/* Isha Interval */}
          <Pressable
            style={styles.settingButton}
            onPress={() => handleOpenBottomSheet('interval')}
          >
            <View style={styles.settingButtonContent}>
              <Text style={styles.settingLabel}>Isha Interval</Text>
              <View style={styles.settingValueRow}>
                <Text style={styles.settingValue} numberOfLines={1}>
                  {formatDisplayValue(ishaInterval)}
                </Text>
                <View style={styles.chevronContainer}>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={ICON_SIZES.md}
                    color={COLORS.text.secondary}
                  />
                </View>
              </View>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      {/* Bottom Sheets */}
      {/* Fajr Angle Bottom Sheet */}
      <BottomSheetModal
        ref={fajrAngleSheetRef}
        enablePanDownToClose={true}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
        backdropComponent={renderBackdrop}
        enableDynamicSizing={true}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <Text style={styles.bottomSheetTitle}>{getTitle()}</Text>
          <View style={styles.rulerContainer}>
            <View style={styles.rulerWrapper}>
              <RulerPicker
              key={editingType} // Force re-render when switching editing types
              min={getRulerConfig().min}
              max={getRulerConfig().max}
              step={getRulerConfig().step}
              initialValue={parseFloat(tempValue) || 15}
              onValueChange={handleRulerValueChange}
              unit={getRulerConfig().unit}
              fractionDigits={editingType === 'interval' ? 0 : 1}
              height={80}
              width={Dimensions.get('window').width - (SPACING.lg * 2)}
              indicatorHeight={40}
              shortStepHeight={20}
              longStepHeight={40}
              indicatorColor={COLORS.text.primary}
              valueTextStyle={{
                color: COLORS.text.primary,
                fontSize: 48,
                fontWeight: 'bold',
              }}
              unitTextStyle={{
                color: COLORS.text.secondary,
                fontSize: 32,
                fontWeight: 'normal',
              }}
              shortStepColor={COLORS.text.tertiary}
              longStepColor={COLORS.text.secondary}
            />
            </View>
          </View>
          <Pressable style={styles.bottomSheetButton} onPress={handleSaveAngle}>
            <Text style={styles.bottomSheetButtonText}>Save</Text>
          </Pressable>
        </BottomSheetView>
      </BottomSheetModal>

      {/* Isha Angle Bottom Sheet */}
      <BottomSheetModal
        ref={ishaAngleSheetRef}
        enablePanDownToClose={true}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
        backdropComponent={renderBackdrop}
        enableDynamicSizing={true}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <Text style={styles.bottomSheetTitle}>{getTitle()}</Text>
          <View style={styles.rulerContainer}>
            <View style={styles.rulerWrapper}>
              <RulerPicker
              key={editingType} // Force re-render when switching editing types
              min={getRulerConfig().min}
              max={getRulerConfig().max}
              step={getRulerConfig().step}
              initialValue={parseFloat(tempValue) || 15}
              onValueChange={handleRulerValueChange}
              unit={getRulerConfig().unit}
              fractionDigits={editingType === 'interval' ? 0 : 1}
              height={80}
              width={Dimensions.get('window').width - (SPACING.lg * 2)}
              indicatorHeight={40}
              shortStepHeight={20}
              longStepHeight={40}
              indicatorColor={COLORS.text.primary}
              valueTextStyle={{
                color: COLORS.text.primary,
                fontSize: 48,
                fontWeight: 'bold',
              }}
              unitTextStyle={{
                color: COLORS.text.secondary,
                fontSize: 32,
                fontWeight: 'normal',
              }}
              shortStepColor={COLORS.text.tertiary}
              longStepColor={COLORS.text.secondary}
            />
            </View>
          </View>
          <Pressable style={styles.bottomSheetButton} onPress={handleSaveAngle}>
            <Text style={styles.bottomSheetButtonText}>Save</Text>
          </Pressable>
        </BottomSheetView>
      </BottomSheetModal>

      {/* Isha Interval Bottom Sheet */}
      <BottomSheetModal
        ref={ishaIntervalSheetRef}
        enablePanDownToClose={true}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
        backdropComponent={renderBackdrop}
        enableDynamicSizing={true}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <Text style={styles.bottomSheetTitle}>{getTitle()}</Text>
          <View style={styles.rulerContainer}>
            <View style={styles.rulerWrapper}>
              <RulerPicker
              key={editingType} // Force re-render when switching editing types
              min={getRulerConfig().min}
              max={getRulerConfig().max}
              step={getRulerConfig().step}
              initialValue={parseFloat(tempValue) || 15}
              onValueChange={handleRulerValueChange}
              unit={getRulerConfig().unit}
              fractionDigits={editingType === 'interval' ? 0 : 1}
              height={80}
              width={Dimensions.get('window').width - (SPACING.lg * 2)}
              indicatorHeight={40}
              shortStepHeight={20}
              longStepHeight={40}
              indicatorColor={COLORS.text.primary}
              valueTextStyle={{
                color: COLORS.text.primary,
                fontSize: 48,
                fontWeight: 'bold',
              }}
              unitTextStyle={{
                color: COLORS.text.secondary,
                fontSize: 32,
                fontWeight: 'normal',
              }}
              shortStepColor={COLORS.text.tertiary}
              longStepColor={COLORS.text.secondary}
            />
            </View>
          </View>
          <Pressable style={styles.bottomSheetButton} onPress={handleSaveAngle}>
            <Text style={styles.bottomSheetButtonText}>Save</Text>
          </Pressable>
        </BottomSheetView>
      </BottomSheetModal>
    </View>
    </>
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backButton: {
    width: ICON_SIZES.lg + SPACING.sm,
    height: ICON_SIZES.lg + SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.weights.medium.primary,
    color: COLORS.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  description: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.weights.regular.primary,
    color: COLORS.text.secondary,
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  settingsContainer: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  settingButton: {
    paddingHorizontal: SPACING.md,
    height: 48,
    justifyContent: 'center',
  },
  settingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  settingLabel: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.weights.regular.primary,
    color: COLORS.text.primary,
    flexShrink: 0,
  },
  settingValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  settingValue: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.weights.regular.primary,
    color: COLORS.text.secondary,
    textAlign: 'right',
    paddingRight: ICON_SIZES.md + SPACING.xs,
    flexShrink: 1,
  },
  chevronContainer: {
    position: 'absolute',
    right: 0,
    width: ICON_SIZES.md,
    height: ICON_SIZES.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginLeft: SPACING.md,
  },
  bottomSheetBackground: {
    backgroundColor: COLORS.background.secondary,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
  },
  handleIndicator: {
    backgroundColor: COLORS.text.tertiary,
    width: 40,
  },
  bottomSheetContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 0,
    paddingBottom: SPACING.xl,
  },
  bottomSheetTitle: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.weights.medium.primary,
    color: COLORS.text.secondary,
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rulerContainer: {
    width: '100%',
    marginBottom: SPACING.lg,
    paddingTop: 60,
    paddingBottom: 0,
  },
  rulerWrapper: {
    height: 80,
    width: '100%',
  },
  bottomSheetButton: {
    backgroundColor: 'rgba(33, 150, 243, 0.2)', // Bluish tint with opacity
    borderColor: 'rgba(33, 150, 243, 0.5)', // Bluish border
    borderWidth: 1,
    borderRadius: 999, // Completely rounded
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    width: '100%',
    minHeight: 44,
  },
  bottomSheetButtonText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.weights.medium.primary,
    color: 'rgba(135, 206, 250, 1)', // Light blue text
  },
});

