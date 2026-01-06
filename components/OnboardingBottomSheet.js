import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { COLORS, FONTS, SPACING, RADIUS, ICON_SIZES } from '../constants/theme';
import { updateSetting } from '../utils/settingsStorage';
import { requestNotificationPermissions } from '../utils/notifications';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;
const TOTAL_STEPS = 3; // 3 onboarding steps (location, notifications, asr)

const OnboardingBottomSheet = forwardRef(({ onComplete }, ref) => {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [locationPermission, setLocationPermission] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState(null);
  const [asrMethod, setAsrMethod] = useState(null);

  // Animation refs
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const welcomeOpacityAnim = useRef(new Animated.Value(1)).current;
  const prevStepRef = useRef(null);
  const displayStepRef = useRef(0);

  const sheetHeight = SCREEN_HEIGHT; // Full screen height

  // Check permissions when sheet opens
  useEffect(() => {
    if (visible) {
      checkPermissions();
    }
  }, [visible]);

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

    // Check notification permission
    try {
      const { getPermissionsAsync } = require('expo-notifications');
      const notificationStatus = await getPermissionsAsync();
      setNotificationPermission(notificationStatus.status === 'granted');
    } catch (error) {
      console.warn('Error checking notification permission:', error);
      setNotificationPermission(false);
    }
  };

  const handleLocationPermission = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (locationPermission === true) {
        return;
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const handleNotificationPermission = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (notificationPermission === true) {
        return;
      }
      const granted = await requestNotificationPermissions();
      setNotificationPermission(granted);
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setNotificationPermission(false);
    }
  };

  const handleAsrMethodSelect = async (method) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setAsrMethod(method);
      await updateSetting('asrMethod', method);
    } catch (error) {
      console.error('Error saving asr method:', error);
    }
  };

  const canGoToNext = () => {
    if (currentStep === 0) {
      // Location is optional - allow proceeding even if not granted
      // User can enable location later in settings
      return true;
    } else if (currentStep === 1) {
      // Notifications are optional - allow proceeding even if not granted
      return true;
    } else if (currentStep === TOTAL_STEPS - 1) {
      return asrMethod !== null;
    }
    return true;
  };

  const handleNext = () => {
    if (!canGoToNext()) {
      return;
    }

    if (currentStep === TOTAL_STEPS - 1) {
      if (asrMethod) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        completeOnboarding();
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      goToNext();
    }
  };

  const completeOnboarding = async () => {
    try {
      // Close the bottom sheet
      close();
      // Save setting and call onComplete after close animation
      setTimeout(async () => {
        await updateSetting('onboardingCompleted', true);
        if (onComplete) {
          onComplete();
        }
      }, 300); // Wait for close animation
    } catch (error) {
      console.error('Error completing onboarding:', error);
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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }).start(() => {
        prevStepRef.current = null;
        setCurrentStep(0);
        displayStepRef.current = 0;
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

    if (prevStepRef.current === null) {
      setCurrentStep(newStep);
      displayStepRef.current = newStep;
      prevStepRef.current = newStep;

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

    Animated.timing(opacityAnim, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      displayStepRef.current = newStep;
      setCurrentStep(newStep);
      prevStepRef.current = newStep;

      requestAnimationFrame(() => {
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
    const slideDistance = SCREEN_WIDTH * 0.3;

    Animated.timing(welcomeOpacityAnim, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      setShowWelcome(false);
      prevStepRef.current = null;
      setCurrentStep(0);
      displayStepRef.current = 0;

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
    });
  };

  const renderStep = () => {
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
              Enable location to automatically calculate accurate prayer times for your area. If you skip this, the app will use a default location that you can change later in settings.
            </Text>
            {locationPermission === false && (
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleLocationPermission}
              >
                <Text style={styles.buttonText}>Continue</Text>
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
            {locationPermission === false && (
              <Text style={styles.skipHint}>You can continue without enabling location</Text>
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
            <Text style={styles.title}>Prayer Notifications (Optional)</Text>
            <Text style={styles.description}>
              Get notified when it's time for prayer so you never miss a salah. You can skip this and enable notifications later in settings.
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
            {notificationPermission === false && (
              <Text style={styles.skipHint}>You can continue without enabling notifications</Text>
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

  const open = () => {
    setVisible(true);
    // Reset to welcome screen
    setShowWelcome(true);
    setCurrentStep(0);
    displayStepRef.current = 0;
    prevStepRef.current = null;
    welcomeOpacityAnim.setValue(1);
    opacityAnim.setValue(1);

    requestAnimationFrame(() => {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: SCREEN_HEIGHT - sheetHeight,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const close = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
    });
  };

  // Expose open/close methods via ref
  useImperativeHandle(ref, () => ({
    open,
    close,
  }));

  // Initialize position when visibility changes
  useEffect(() => {
    if (!visible) {
      translateY.setValue(SCREEN_HEIGHT);
      backdropOpacity.setValue(0);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => {}} // Prevent dismissal by back button
    >
      {/* Backdrop - non-dismissible */}
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: backdropOpacity,
          },
        ]}
      />

      {/* Bottom Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            height: sheetHeight,
            transform: [{ translateY }],
            paddingTop: insets.top + SPACING.xs,
            paddingBottom: insets.bottom + SPACING.md,
          },
        ]}
      >
        {/* Welcome Screen */}
        {showWelcome ? (
          <Animated.View
            style={[
              styles.content,
              { opacity: welcomeOpacityAnim }
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
        ) : (
          <View style={styles.content}>
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
          </View>
        )}
      </Animated.View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.background.secondary,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
  },
  content: {
    flex: 1,
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
    backgroundColor: COLORS.background.primary,
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: SPACING.xxxl,
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
    backgroundColor: COLORS.background.primary,
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
  skipHint: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.weights.regular.primary,
    color: COLORS.text.tertiary,
    textAlign: 'center',
    marginTop: SPACING.md,
    fontStyle: 'italic',
  },
  optionsContainer: {
    width: '100%',
    backgroundColor: COLORS.background.primary,
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
    paddingVertical: SPACING.md,
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background.primary,
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
    backgroundColor: COLORS.background.primary,
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

export default OnboardingBottomSheet;
