import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { COLORS, FONTS, SPACING, RADIUS, ICON_SIZES } from '../constants/theme';
import { updateSetting, getSettings } from '../utils/settingsStorage';

// Try to import expo-notifications, but handle if it's not installed
let Notifications = null;
try {
  Notifications = require('expo-notifications');
} catch (error) {
  console.warn('expo-notifications not available:', error);
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const TOTAL_STEPS = 3; // 3 onboarding steps (location, notifications, asr)

export default function OnboardingScreen({ onComplete }) {
  const insets = useSafeAreaInsets();
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [locationPermission, setLocationPermission] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState(null);
  const [asrMethod, setAsrMethod] = useState(null); // No default selection

  // Animation refs
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const welcomeOpacityAnim = useRef(new Animated.Value(1)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current; // For fade out on completion
  const prevStepRef = useRef(null);
  const displayStepRef = useRef(0); // Track displayed step to prevent flicker

  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
  }, []);

  // Reset welcome animation when not showing welcome
  useEffect(() => {
    if (!showWelcome) {
      welcomeOpacityAnim.setValue(1);
    }
  }, [showWelcome]);

  const checkPermissions = async () => {
    // Check location permission
    const locationStatus = await Location.getForegroundPermissionsAsync();
    setLocationPermission(locationStatus.status === 'granted');

    // Check notification permission (if available)
    if (Notifications) {
      try {
        const notificationStatus = await Notifications.getPermissionsAsync();
        setNotificationPermission(notificationStatus.status === 'granted');
      } catch (error) {
        console.warn('Error checking notification permission:', error);
        setNotificationPermission(false);
      }
    } else {
      // If notifications not available, skip this step
      setNotificationPermission(true);
    }
  };

  const handleLocationPermission = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // If already granted, don't auto-advance - let user click arrow
      if (locationPermission === true) {
        return;
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      // Don't auto-advance - user clicks arrow to continue
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const handleNotificationPermission = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // If already granted, don't auto-advance - let user click arrow
      if (notificationPermission === true) {
        return;
      }
      if (Notifications) {
        const { status } = await Notifications.requestPermissionsAsync();
        setNotificationPermission(status === 'granted');
        // Don't auto-advance - user clicks arrow to continue
      } else {
        // If notifications not available, just mark as granted
        setNotificationPermission(true);
        // Don't auto-advance - user clicks arrow to continue
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      // If error, just mark as granted
      setNotificationPermission(true);
      // Don't auto-advance - user clicks arrow to continue
    }
  };

  const handleAsrMethodSelect = async (method) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setAsrMethod(method);
      await updateSetting('asrMethod', method);
      // Don't auto-complete - user clicks arrow to finish
    } catch (error) {
      console.error('Error saving asr method:', error);
    }
  };

  const canGoToNext = () => {
    // Check if we can proceed based on current step
    if (currentStep === 0) {
      // Location permission step - need permission granted
      return locationPermission === true;
    } else if (currentStep === 1) {
      // Notification permission step - need permission granted
      return notificationPermission === true;
    } else if (currentStep === TOTAL_STEPS - 1) {
      // Last step - need asrMethod selected
      return asrMethod !== null;
    }
    return true; // Other steps can always proceed
  };

  const handleNext = () => {
    if (!canGoToNext()) {
      return; // Don't proceed if requirements not met
    }
    
    if (currentStep === TOTAL_STEPS - 1) {
      // Last step - complete onboarding (only if asrMethod is selected)
      if (asrMethod) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        completeOnboarding();
      } else {
        // If no method selected, just provide haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      goToNext();
    }
  };

  const canCompleteOnboarding = () => {
    // Can complete if Asr method is selected
    return asrMethod !== null;
  };

  const completeOnboarding = async () => {
    try {
      // Fade out the onboarding screen
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(async () => {
        // After fade completes, save setting and call onComplete
        await updateSetting('onboardingCompleted', true);
        if (onComplete) {
          onComplete();
        }
      });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // If error, still call onComplete
      if (onComplete) {
        onComplete();
      }
    }
  };

  const goToNext = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      animateToStep(currentStep + 1, true);
    }
  };

  const goToPrevious = () => {
    if (currentStep > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      animateToStep(currentStep - 1, false);
    } else if (currentStep === 0 && !showWelcome) {
      // Go back to welcome screen from first step
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Animate current step out
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }).start(() => {
        // Reset step state
        prevStepRef.current = null;
        setCurrentStep(0);
        displayStepRef.current = 0;
        
        // Show welcome and animate it in
        setShowWelcome(true);
        
        requestAnimationFrame(() => {
          welcomeOpacityAnim.setValue(0);
          
          Animated.timing(welcomeOpacityAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }).start();
        });
      });
    }
  };

  const animateToStep = (newStep, isForward) => {
    const slideDistance = SCREEN_WIDTH * 0.3;

    // If this is the first step after welcome, animate it in
    if (prevStepRef.current === null) {
      setCurrentStep(newStep);
      displayStepRef.current = newStep;
      prevStepRef.current = newStep;
      
      // Animate first step in
      requestAnimationFrame(() => {
        slideAnim.setValue(slideDistance);
        opacityAnim.setValue(0.3);

        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
      });
      return;
    }

    // First fade out the current step (keep old content during fade-out)
    Animated.timing(opacityAnim, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      // Update step after fade-out completes (triggers re-render with new content)
      displayStepRef.current = newStep;
      setCurrentStep(newStep);
      prevStepRef.current = newStep;

      // Small delay to ensure state update is processed before animation
      requestAnimationFrame(() => {
        // Then slide in and fade in the new step
        slideAnim.setValue(isForward ? slideDistance : -slideDistance);
        opacityAnim.setValue(0.3);

        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
      });
    });
  };

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Animate welcome out and first step in
    setShowWelcome(false);
    // Initialize first step
    prevStepRef.current = null;
    setCurrentStep(0);
    displayStepRef.current = 0;

    // Animate slide in from right (same animation as animateToStep)
    const slideDistance = SCREEN_WIDTH * 0.3;
    requestAnimationFrame(() => {
      slideAnim.setValue(slideDistance);
      opacityAnim.setValue(0.3);

      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const renderStep = () => {
    // Use displayStepRef to prevent flicker during animation
    const stepToRender = displayStepRef.current;
    
    switch (stepToRender) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <MaterialCommunityIcons
              name="map-marker"
              size={80}
              color={COLORS.text.primary}
              style={styles.icon}
            />
            <Text style={styles.title}>Location Access</Text>
            <Text style={styles.description}>
              We need your location to calculate accurate prayer times for your area.
            </Text>
            {locationPermission === false && (
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleLocationPermission}
              >
                <Text style={styles.buttonText}>Grant Location Access</Text>
              </Pressable>
            )}
            {locationPermission === true && (
              <View style={styles.successContainer}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={ICON_SIZES.lg}
                  color="#4CAF50"
                />
                <Text style={styles.successText}>Location access granted</Text>
              </View>
            )}
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContainer}>
            <MaterialCommunityIcons
              name="bell"
              size={80}
              color={COLORS.text.primary}
              style={styles.icon}
            />
            <Text style={styles.title}>Prayer Notifications</Text>
            <Text style={styles.description}>
              Get notified when it's time for prayer so you never miss a salah.
            </Text>
            {notificationPermission === false && (
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleNotificationPermission}
              >
                <Text style={styles.buttonText}>Enable Notifications</Text>
              </Pressable>
            )}
            {notificationPermission === true && (
              <View style={styles.successContainer}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={ICON_SIZES.lg}
                  color="#4CAF50"
                />
                <Text style={styles.successText}>Notifications enabled</Text>
              </View>
            )}
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <MaterialCommunityIcons
              name="calendar-clock"
              size={80}
              color={COLORS.text.primary}
              style={styles.icon}
            />
            <Text style={styles.title}>Asr Calculation Method</Text>
            <Text style={styles.description}>
              Choose your school of thought for calculating Asr prayer time.
            </Text>
            <View style={styles.optionsContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.optionButton,
                  pressed && styles.optionButtonPressed,
                ]}
                onPress={() => handleAsrMethodSelect('Standard')}
              >
                <View style={styles.optionContent}>
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionText}>
                      Standard (Shafi'i, Maliki, Hanbali)
                    </Text>
                    <Text style={styles.optionSubtext}>
                      Early Asr Time
                    </Text>
                  </View>
                  {asrMethod === 'Standard' && (
                    <MaterialCommunityIcons
                      name="check"
                      size={ICON_SIZES.md}
                      color={COLORS.text.primary}
                      style={styles.checkIcon}
                    />
                  )}
                </View>
              </Pressable>
              <View style={styles.separator} />
              <Pressable
                style={({ pressed }) => [
                  styles.optionButton,
                  pressed && styles.optionButtonPressed,
                ]}
                onPress={() => handleAsrMethodSelect('Hanafi')}
              >
                <View style={styles.optionContent}>
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionText}>
                      Hanafi
                    </Text>
                    <Text style={styles.optionSubtext}>
                      Late Asr Time
                    </Text>
                  </View>
                  {asrMethod === 'Hanafi' && (
                    <MaterialCommunityIcons
                      name="check"
                      size={ICON_SIZES.md}
                      color={COLORS.text.primary}
                      style={styles.checkIcon}
                    />
                  )}
                </View>
              </Pressable>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  // Show welcome screen first
  if (showWelcome) {
    return (
      <Animated.View 
        style={[
          styles.container, 
          { 
            paddingTop: insets.top, 
            paddingBottom: insets.bottom,
            opacity: welcomeOpacityAnim,
          }
        ]}
      >
        <View style={styles.welcomeContent}>
          <View style={styles.welcomeContainer}>
            <MaterialCommunityIcons
              name="mosque"
              size={80}
              color={COLORS.text.primary}
              style={styles.icon}
            />
            <Text style={styles.title}>Welcome to Salah</Text>
            <Text style={styles.description}>
              Your personal prayer companion. Track your salah, get accurate prayer times, and stay connected to your faith.
            </Text>
          </View>
          <View style={styles.welcomeButtonContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.getStartedButton,
                pressed && styles.getStartedButtonPressed
              ]}
              onPress={handleGetStarted}
            >
              <Text style={styles.getStartedButtonText}>Get Started</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          opacity: Animated.multiply(welcomeOpacityAnim, screenOpacity),
        }
      ]}
    >
      {/* Step content with animation */}
      <Animated.View
        style={[
          styles.contentContainer,
          {
            transform: [{ translateX: slideAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        {renderStep()}
      </Animated.View>

      {/* Navigation arrows */}
      <View style={styles.navigationContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.navButton,
            pressed && styles.navButtonPressed,
          ]}
          onPress={goToPrevious}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={ICON_SIZES.lg}
            color={COLORS.text.primary}
          />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.navButtonRight,
            !canGoToNext() && styles.navButtonDisabled,
            pressed && styles.navButtonPressed,
          ]}
          onPress={handleNext}
          disabled={!canGoToNext()}
        >
          {currentStep === TOTAL_STEPS - 1 ? (
            <>
              <Text style={[
                styles.stepCounter,
                !canGoToNext() && styles.stepCounterDisabled
              ]}>
                Done
              </Text>
              <MaterialCommunityIcons
                name="check"
                size={ICON_SIZES.lg}
                color={
                  !canGoToNext()
                    ? COLORS.text.disabled
                    : COLORS.text.primary
                }
              />
            </>
          ) : (
            <>
              <Text style={[
                styles.stepCounter,
                !canGoToNext() && styles.stepCounterDisabled
              ]}>
                {currentStep + 1}/{TOTAL_STEPS}
              </Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={ICON_SIZES.lg}
                color={
                  !canGoToNext()
                    ? COLORS.text.disabled
                    : COLORS.text.primary
                }
              />
            </>
          )}
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    paddingHorizontal: SPACING.lg,
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeButtonContainer: {
    paddingBottom: SPACING.xl,
    width: '100%',
  },
  getStartedButton: {
    width: '100%',
    backgroundColor: COLORS.background.secondary,
    paddingVertical: SPACING.md + 2,
    paddingHorizontal: SPACING.md,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  getStartedButtonPressed: {
    backgroundColor: '#0F0E10',
  },
  getStartedButtonText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.weights.medium.primary,
    color: COLORS.text.primary,
    lineHeight: FONTS.sizes.md * 1.2,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepContainer: {
    width: '100%',
    alignItems: 'center',
  },
  icon: {
    marginBottom: SPACING.xl,
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
    lineHeight: 24,
  },
  button: {
    backgroundColor: COLORS.background.secondary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    marginTop: SPACING.lg,
  },
  buttonPressed: {
    backgroundColor: '#0F0E10',
  },
  buttonText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.weights.medium.primary,
    color: COLORS.text.primary,
  },
  successContainer: {
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  successText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.weights.medium.primary,
    color: '#4CAF50',
  },
  optionsContainer: {
    width: '100%',
    backgroundColor: COLORS.background.secondary,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    overflow: 'hidden',
    marginTop: SPACING.lg,
  },
  optionButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    minHeight: 56,
  },
  optionButtonPressed: {
    backgroundColor: '#0F0E10',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.weights.regular.primary,
    color: COLORS.text.primary,
  },
  optionSubtext: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.weights.regular.primary,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  checkIcon: {
    marginLeft: SPACING.sm,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border.primary,
    marginLeft: SPACING.md,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xl,
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    justifyContent: 'center',
  },
  navButtonPressed: {
    backgroundColor: '#0F0E10',
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  stepCounter: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.weights.medium.primary,
    color: COLORS.text.primary,
  },
  stepCounterDisabled: {
    color: COLORS.text.disabled,
  },
});

