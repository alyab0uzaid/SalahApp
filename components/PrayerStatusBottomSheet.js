import React, { useMemo, useState, useImperativeHandle, forwardRef } from 'react';
import { StyleSheet, View, Pressable, Text } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { COLORS, RADIUS, SPACING, FONTS } from '../constants/theme';

const PrayerStatusBottomSheet = forwardRef(({ onConfirm, onCancel }, ref) => {
  const snapPoints = useMemo(() => ['22%'], []);
  const bottomSheetRef = React.useRef(null);

  // Internal state for sheet data
  const [sheetData, setSheetData] = useState({
    prayerName: '',
    prayerTime: '',
    direction: 'right',
    isRemoving: false
  });

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    open: (data) => {
      // Use callback form to ensure data is set synchronously
      setSheetData(data);
      // Small delay to ensure state update completes before animation
      requestAnimationFrame(() => {
        bottomSheetRef.current?.snapToIndex(0);
      });
    },
    close: () => {
      bottomSheetRef.current?.close();
    }
  }));

  // Determine question and confirm button color based on direction and if removing
  const question = sheetData.isRemoving
    ? (sheetData.direction === 'right' ? 'REMOVE ON TIME?' : 'REMOVE LATE?')
    : (sheetData.direction === 'right' ? 'MARK ON TIME?' : 'MARK LATE?');
  const confirmColor = sheetData.direction === 'right' ? '#81C784' : '#FF9A76';
  
  // Convert hex to rgba for opacity
  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  const confirmColorWithOpacity = hexToRgba(confirmColor, 0.2);
  
  // Grey/white colors for cancel button
  const cancelBorderColor = 'rgba(255, 255, 255, 0.3)';
  const cancelBgColor = 'rgba(255, 255, 255, 0.1)';

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
          <Text style={styles.questionText}>{question}</Text>
          <Text style={styles.prayerNameText}>{sheetData.prayerName?.toUpperCase()}</Text>
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
            onPress={onCancel}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              {
                borderColor: confirmColor,
                borderWidth: 1,
                backgroundColor: confirmColorWithOpacity,
              },
              pressed && { opacity: 0.7 }
            ]}
            onPress={onConfirm}
          >
            <Text style={styles.confirmText}>Confirm</Text>
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
  prayerNameText: {
    fontSize: 14,
    fontFamily: FONTS.weights.regular.primary,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
    letterSpacing: 1,
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

export default PrayerStatusBottomSheet;
