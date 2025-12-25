import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, Animated, PanResponder } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, SPACING, ICON_SIZES } from '../constants/theme';

const BEAD_COUNT = 8;
const VISUAL_GAP = 10; // Visual gap between bead edges (consistent spacing) - reduced
const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;
const LARGEST_BEAD_SIZE = 50; // Largest bead size in pixels

// Bead sizes: smallest, second, third, big, big, third, second, smallest
const getBeadSize = (index) => {
  const sizes = [28, 34, 40, 50, 50, 40, 34, 28]; // In pixels - more size difference
  return sizes[index];
};

// Calculate cumulative Y positions to maintain consistent visual gaps
// Positions are relative to the top of the bead container (centers of beads)
const getBeadPosition = (index) => {
  if (index === 0) {
    return getBeadSize(0) / 2; // First bead's center is at its radius from top
  }
  let position = getBeadSize(0) / 2; // Start with first bead's center position
  for (let i = 1; i <= index; i++) {
    const prevSize = getBeadSize(i - 1);
    const currentSize = getBeadSize(i);
    // Add: radius of previous + gap + radius of current
    position += (prevSize / 2) + VISUAL_GAP + (currentSize / 2);
  }
  return position;
};

// Calculate total height needed for all beads (from top of first to bottom of last)
const getTotalHeight = () => {
  const lastPosition = getBeadPosition(BEAD_COUNT - 1);
  const lastSize = getBeadSize(BEAD_COUNT - 1);
  // Total height: from top edge of first bead (at getBeadSize(0)/2 - getBeadSize(0)/2 = 0) 
  // to bottom edge of last bead
  return lastPosition + (lastSize / 2);
};

// Calculate the center point between the two center beads (indices 3 and 4)
const getCenterPointBetweenBeads = () => {
  const bead3Position = getBeadPosition(3);
  const bead4Position = getBeadPosition(4);
  return (bead3Position + bead4Position) / 2;
};

const CENTER_POINT_Y = getCenterPointBetweenBeads();

const TOTAL_BEAD_HEIGHT = getTotalHeight();

export default function TasbihScreen({ resetBottomSheetRef, onResetConfirm }) {
  const insets = useSafeAreaInsets();
  const [count, setCount] = useState(0);
  const [instructionDismissed, setInstructionDismissed] = useState(false);
  
  // Animation values for instruction and counter
  const instructionOpacity = useRef(new Animated.Value(1)).current;
  const counterOpacity = useRef(new Animated.Value(0)).current;

  // Track total rotation offset - continuously increases
  const rotationOffsetRef = useRef(0);
  const beadOrderRef = useRef(Array.from({ length: BEAD_COUNT }, (_, i) => i));

  const beadAnimsRef = useRef(
    Array.from({ length: BEAD_COUNT }, (_, i) => {
      const targetSize = getBeadSize(i);
      const scale = targetSize / LARGEST_BEAD_SIZE;
      const position = getBeadPosition(i);
      return {
        id: i,
        animValue: new Animated.Value(position),
        scaleAnim: new Animated.Value(scale),
      };
    })
  );
  const [beadAnims, setBeadAnims] = useState(beadAnimsRef.current);

  const animateBeads = (newOrder, oldOrder) => {
    // Stop all running animations and snap beads to their current logical positions
    beadAnimsRef.current.forEach((bead) => {
      bead.animValue.stopAnimation();
      bead.scaleAnim.stopAnimation();
    });

    // Set each bead to its current logical position
    beadAnimsRef.current.forEach((bead) => {
      const beadId = bead.id;
      const oldIndex = oldOrder.indexOf(beadId);
      const oldPosition = getBeadPosition(oldIndex);
      const oldSize = getBeadSize(oldIndex);
      const oldScale = oldSize / LARGEST_BEAD_SIZE;

      bead.animValue.setValue(oldPosition);
      bead.scaleAnim.setValue(oldScale);
    });

    // Now animate each bead to its new position
    const animations = beadAnimsRef.current.map((bead) => {
      const beadId = bead.id;
      const newIndex = newOrder.indexOf(beadId);

      const targetPosition = getBeadPosition(newIndex);
      const targetSize = getBeadSize(newIndex);
      const targetScale = targetSize / LARGEST_BEAD_SIZE;

      return [
        Animated.timing(bead.animValue, {
          toValue: targetPosition,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(bead.scaleAnim, {
          toValue: targetScale,
          duration: 250,
          useNativeDriver: true,
        }),
      ];
    }).flat();

    Animated.parallel(animations).start();
  };

  const handleCountDown = () => {
    setCount(prev => {
      if (prev === 0) {
        return prev; // Prevent going below 0
      }
      return prev - 1;
    });

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Decrement rotation offset
    rotationOffsetRef.current -= 1;

    // Update bead order - reverse: top bead goes to bottom
    const newOrder = [...beadOrderRef.current];
    const topBead = newOrder.shift();
    newOrder.push(topBead);
    beadOrderRef.current = newOrder;

    // Calculate old order (before reverse rotation)
    const oldOrder = [...newOrder];
    const bottomBead = oldOrder.pop();
    oldOrder.unshift(bottomBead);

    animateBeads(newOrder, oldOrder);
  };

  const handleCountUp = () => {
    // Dismiss instruction on first interaction
    if (count === 0 && !instructionDismissed) {
      setInstructionDismissed(true);
      Animated.parallel([
        Animated.timing(instructionOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(counterOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCount(prev => prev + 1);

    // Increment rotation offset
    rotationOffsetRef.current += 1;

    // Update bead order - bottom bead goes to top
    const newOrder = [...beadOrderRef.current];
    const bottomBead = newOrder.pop();
    newOrder.unshift(bottomBead);
    beadOrderRef.current = newOrder;

    // Calculate old order (before rotation)
    const oldOrder = [...newOrder];
    const topBead = oldOrder.shift();
    oldOrder.push(topBead);

    animateBeads(newOrder, oldOrder);
  };


  const handleResetPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    resetBottomSheetRef?.current?.open();
  };

  const handleResetConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCount(0);
    setInstructionDismissed(false);
    // Reset rotation offset and bead order
    rotationOffsetRef.current = 0;
    beadOrderRef.current = Array.from({ length: BEAD_COUNT }, (_, i) => i);
    // Reset all beads to original positions
    const resetAnims = Array.from({ length: BEAD_COUNT }, (_, i) => {
      const targetSize = getBeadSize(i);
      const scale = targetSize / LARGEST_BEAD_SIZE;
      const position = getBeadPosition(i);
      return {
        id: i,
        animValue: new Animated.Value(position),
        scaleAnim: new Animated.Value(scale),
      };
    });
    beadAnimsRef.current = resetAnims;
    setBeadAnims(resetAnims);
    beadOrderRef.current = Array.from({ length: BEAD_COUNT }, (_, i) => i);
    rotationOffsetRef.current = 0;
    // Show instruction again
    Animated.parallel([
      Animated.timing(instructionOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(counterOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  // Expose reset function to parent via useImperativeHandle or callback
  React.useEffect(() => {
    if (onResetConfirm) {
      // Store the reset function so App.js can call it
      onResetConfirm.current = handleResetConfirm;
    }
  }, [onResetConfirm]);

  // Track if a swipe occurred to prevent tap from firing
  const swipeOccurredRef = useRef(false);

  // Pan responder for swipe gestures - must be defined after handleCountUp and handleCountDown
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        return true; // Capture all touches so we can detect swipes
      },
      onMoveShouldSetPanResponder: () => {
        // Always return true to track movement
        return true;
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dy, vy } = gestureState;

        // Check if we need to dismiss instruction before any count changes
        const shouldDismissInstruction = count === 0 && !instructionDismissed;
        
        // Determine if it's a swipe or tap based on movement
        // Swipe threshold: significant movement (30px) or velocity (0.5)
        const isSwipe = Math.abs(dy) > 30 || Math.abs(vy) > 0.5;

        if (isSwipe) {
          // It's a swipe - determine direction
          // In React Native, negative dy/vy means moving UP (towards top of screen)
          // Positive dy/vy means moving DOWN (towards bottom of screen)
          // Use velocity as primary indicator, fallback to distance
          let isSwipeUp = false;
          if (Math.abs(vy) > 0.1) {
            // Use velocity - negative means moving up
            isSwipeUp = vy < 0;
          } else {
            // Use distance - negative means moved up
            isSwipeUp = dy < 0;
          }

          if (isSwipeUp) {
            // Swipe up - count down
            handleCountDown();
          } else {
            // Swipe down - count up
            handleCountUp();
          }
        } else {
          // It's a tap - count up
          handleCountUp();
        }
      },
    })
  ).current;


  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Instruction or Count Display - Both always rendered, opacity changes */}
      <View style={styles.countContainer}>
        <Animated.View style={[styles.instructionWrapper, { opacity: instructionOpacity, position: 'absolute' }]}>
          <Text style={styles.instructionText}>Tap or swipe down</Text>
          <MaterialCommunityIcons
            name="arrow-down"
            size={ICON_SIZES.md}
            color={COLORS.text.primary}
          />
        </Animated.View>
        <Animated.View style={[styles.counterWrapper, { opacity: counterOpacity, position: 'absolute' }]}>
          <Pressable onPress={handleResetPress}>
            <MaterialCommunityIcons
              name="refresh"
              size={ICON_SIZES.md}
              color={COLORS.text.primary}
              style={styles.resetIcon}
            />
          </Pressable>
          <Text style={styles.countText}>{count}</Text>
        </Animated.View>
      </View>

      {/* Beads Container - Centered on space between two center beads */}
      <View style={styles.beadsContainerWrapper}>
        <View
          style={[
            styles.beadsContainer,
            {
              top: SCREEN_HEIGHT / 2 - CENTER_POINT_Y,
            }
          ]}
          {...panResponder.panHandlers}
        >
          {/* Beads */}
          <View style={styles.beadsWrapper}>
            {beadAnims.map((bead, index) => {
              return (
                <Animated.View
                  key={bead.id}
                  style={[
                    {
                      position: 'absolute',
                      width: LARGEST_BEAD_SIZE, // Use largest size as base
                      height: LARGEST_BEAD_SIZE,
                      borderRadius: LARGEST_BEAD_SIZE / 2,
                      backgroundColor: COLORS.text.primary,
                      opacity: 0.9,
                      left: 0, // Already centered in wrapper
                    },
                    {
                      transform: [
                        {
                          translateY: bead.animValue,
                        },
                        {
                          scale: bead.scaleAnim,
                        },
                      ],
                    },
                  ]}
                />
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    alignItems: 'center',
  },
  countContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT / 2 - CENTER_POINT_Y - 80,
    width: '100%',
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  instructionText: {
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.weights.medium.primary,
    opacity: 0.8,
  },
  counterWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  resetIcon: {
    opacity: 0.7,
  },
  countText: {
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.xxl + 20,
    fontFamily: FONTS.weights.bold.primary,
    minWidth: 80,
    textAlign: 'center',
  },
  beadsContainerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: SCREEN_HEIGHT,
  },
  beadsContainer: {
    position: 'absolute',
    width: '100%',
    height: TOTAL_BEAD_HEIGHT,
    left: 0,
  },
  beadsWrapper: {
    position: 'absolute',
    left: SCREEN_WIDTH / 2 - LARGEST_BEAD_SIZE / 2, // Half of largest bead size
    top: 0,
    width: LARGEST_BEAD_SIZE, // Largest bead size
    height: TOTAL_BEAD_HEIGHT,
    alignItems: 'center',
  },
});
