import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { RulerPicker } from 'react-native-ruler-picker';
import { COLORS, FONTS, SPACING, RADIUS, ICON_SIZES } from '../constants/theme';
import * as Haptics from 'expo-haptics';
import { getSettings, saveSettings } from '../utils/settingsStorage';

const PRAYER_NAMES = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

export default function PrayerAdjustmentsScreen({ navigation, onSettingsChange }) {
  const insets = useSafeAreaInsets();

  // Prayer adjustments
  const [adjustments, setAdjustments] = useState({
    Fajr: '0',
    Sunrise: '0',
    Dhuhr: '0',
    Asr: '0',
    Maghrib: '0',
    Isha: '0',
  });

  // Bottom sheet refs for each prayer
  const sheetRefs = useRef({
    Fajr: null,
    Sunrise: null,
    Dhuhr: null,
    Asr: null,
    Maghrib: null,
    Isha: null,
  });

  // Current editing prayer
  const [editingPrayer, setEditingPrayer] = useState(null);

  // Temporary value for bottom sheet
  const [tempValue, setTempValue] = useState('0');

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const settings = await getSettings();

    // Load prayer adjustments, default to 0
    if (settings.prayerAdjustments) {
      const newAdj = {};
      PRAYER_NAMES.forEach(name => {
        newAdj[name] = (settings.prayerAdjustments[name] || 0).toString();
      });
      setAdjustments(newAdj);
    }
  };

  const handleOpenBottomSheet = (prayerName) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingPrayer(prayerName);
    setTempValue(adjustments[prayerName] || '0');
    requestAnimationFrame(() => {
      sheetRefs.current[prayerName]?.present();
    });
  };

  const handleRulerValueChange = (value) => {
    setTempValue(value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSaveAdjustment = async () => {
    try {
      const prayerName = editingPrayer;
      if (!prayerName) return;

      const settings = await getSettings();
      const newValue = tempValue;
      
      setAdjustments(prev => ({ ...prev, [prayerName]: newValue }));
      
      if (!settings.prayerAdjustments) {
        settings.prayerAdjustments = {};
      }
      
      settings.prayerAdjustments[prayerName] = parseInt(newValue) || 0;
      
      await saveSettings(settings);

      if (onSettingsChange) {
        await onSettingsChange();
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      sheetRefs.current[prayerName]?.dismiss();
      setEditingPrayer(null);
    } catch (error) {
      console.error('Error saving adjustment:', error);
    }
  };

  const formatDisplayValue = (value) => {
    const num = parseInt(value) || 0;
    if (num === 0) return '0';
    return num > 0 ? `+${num}` : `${num}`;
  };

  const handleReset = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const settings = await getSettings();
      
      // Reset all adjustments to 0
      const resetAdjustments = {};
      PRAYER_NAMES.forEach(name => {
        resetAdjustments[name] = '0';
      });
      setAdjustments(resetAdjustments);
      
      settings.prayerAdjustments = {};
      PRAYER_NAMES.forEach(name => {
        settings.prayerAdjustments[name] = 0;
      });
      
      await saveSettings(settings);
      
      if (onSettingsChange) {
        await onSettingsChange();
      }
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error resetting adjustments:', error);
    }
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
        <Text style={styles.headerTitle}>Prayer Time Adjustments</Text>
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
          Manually adjust prayer times in minutes. Use positive numbers to add time or negative to subtract.
        </Text>

        <View style={styles.settingsContainer}>
          {PRAYER_NAMES.map((name, index) => (
            <React.Fragment key={name}>
              {index > 0 && <View style={styles.separator} />}
              <Pressable
                style={styles.settingButton}
                onPress={() => handleOpenBottomSheet(name)}
              >
                <View style={styles.settingButtonContent}>
                  <Text style={styles.settingLabel}>{name}</Text>
                  <View style={styles.settingValueRow}>
                    <Text style={styles.settingValue} numberOfLines={1}>
                      {formatDisplayValue(adjustments[name])} min
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
            </React.Fragment>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Sheets for each prayer */}
      {PRAYER_NAMES.map((prayerName) => (
        <BottomSheetModal
          key={prayerName}
          ref={(ref) => {
            sheetRefs.current[prayerName] = ref;
          }}
          enablePanDownToClose={true}
          backgroundStyle={styles.bottomSheetBackground}
          handleIndicatorStyle={styles.handleIndicator}
          backdropComponent={renderBackdrop}
          enableDynamicSizing={true}
        >
          <BottomSheetView style={styles.bottomSheetContent}>
            <Text style={styles.bottomSheetTitle}>{prayerName} Adjustment (minutes)</Text>
            <View style={styles.rulerContainer}>
              <View style={styles.rulerWrapper}>
                <RulerPicker
                  key={editingPrayer}
                  min={-60}
                  max={60}
                  step={1}
                  initialValue={parseInt(tempValue) || 0}
                  onValueChange={handleRulerValueChange}
                  unit=" min"
                  fractionDigits={0}
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
                    fontFamily: FONTS.families.mono,
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
            <Pressable style={styles.bottomSheetButton} onPress={handleSaveAdjustment}>
              <Text style={styles.bottomSheetButtonText}>Save</Text>
            </Pressable>
          </BottomSheetView>
        </BottomSheetModal>
      ))}
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
    marginTop: SPACING.md,
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
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
    borderColor: 'rgba(33, 150, 243, 0.5)',
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    width: '100%',
    minHeight: 44,
  },
  bottomSheetButtonText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.weights.medium.primary,
    color: 'rgba(135, 206, 250, 1)',
  },
});
