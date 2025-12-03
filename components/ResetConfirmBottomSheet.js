import React, { useMemo, useImperativeHandle, forwardRef } from 'react';
import { StyleSheet, View, Pressable, Text } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { COLORS, RADIUS, SPACING, FONTS } from '../constants/theme';

const ResetConfirmBottomSheet = forwardRef(({ onConfirm, onCancel }, ref) => {
  const snapPoints = useMemo(() => ['22%'], []);
  const bottomSheetRef = React.useRef(null);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    open: () => {
      requestAnimationFrame(() => {
        bottomSheetRef.current?.snapToIndex(0);
      });
    },
    close: () => {
      bottomSheetRef.current?.close();
    }
  }));

  // Grey/white colors for cancel button
  const cancelBorderColor = 'rgba(255, 255, 255, 0.2)';
  const cancelBgColor = 'rgba(255, 255, 255, 0.06)';
  
  // Reset button color - use a grey/white color similar to remove
  const resetColor = '#C0C0C0';
  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  
  const darkenColor = (hex, factor = 0.25) => {
    const r = Math.max(0, Math.round(parseInt(hex.slice(1, 3), 16) * (1 - factor)));
    const g = Math.max(0, Math.round(parseInt(hex.slice(3, 5), 16) * (1 - factor)));
    const b = Math.max(0, Math.round(parseInt(hex.slice(5, 7), 16) * (1 - factor)));
    return { r, g, b };
  };
  
  const darkerResetColorRGB = darkenColor(resetColor);
  const darkerResetColor = `rgb(${darkerResetColorRGB.r}, ${darkerResetColorRGB.g}, ${darkerResetColorRGB.b})`;
  const resetColorWithOpacity = `rgba(${darkerResetColorRGB.r}, ${darkerResetColorRGB.g}, ${darkerResetColorRGB.b}, 0.2)`;

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
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      backdropComponent={renderBackdrop}
      enableDynamicSizing={false}
      onClose={onCancel}
    >
      <BottomSheetView style={styles.contentContainer}>
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>RESET COUNTER?</Text>
        </View>

        <View style={styles.buttonsContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              {
                borderColor: cancelBorderColor,
                borderWidth: 1,
                backgroundColor: cancelBgColor,
              },
              pressed && { opacity: 0.7 }
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onCancel();
            }}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              {
                borderColor: darkerResetColor,
                borderWidth: 1,
                backgroundColor: resetColorWithOpacity,
              },
              pressed && { opacity: 0.7 }
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onConfirm();
            }}
          >
            <Text style={styles.confirmText}>Reset</Text>
          </Pressable>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: COLORS.background.secondary,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
  },
  handleIndicator: {
    backgroundColor: COLORS.text.tertiary,
    width: 40,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  questionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  questionText: {
    fontSize: 18,
    fontFamily: FONTS.weights.bold.primary,
    color: COLORS.text.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  button: {
    flex: 1,
    paddingVertical: SPACING.sm + 4,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  cancelText: {
    fontSize: 16,
    fontFamily: FONTS.weights.medium.primary,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  confirmText: {
    fontSize: 16,
    fontFamily: FONTS.weights.medium.primary,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

export default ResetConfirmBottomSheet;

