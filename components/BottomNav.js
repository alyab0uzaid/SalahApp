import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const TABS = [
  { key: 'home', label: 'Home', icon: 'home-variant-outline' },
  { key: 'qibla', label: 'Qibla', icon: 'compass-outline' },
  { key: 'tracker', label: 'Tracker', icon: 'chart-line' },
  { key: 'settings', label: 'Settings', icon: 'cog-outline' },
];

const BottomNav = ({ activeTab, onTabPress }) => {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            style={({ pressed }) => [
              styles.tab,
              isActive && styles.tabActive,
              pressed && !isActive && styles.tabPressed,
            ]}
            onPress={() => onTabPress?.(tab.key)}
          >
            <MaterialCommunityIcons
              name={tab.icon}
              size={26}
              color={isActive ? '#FFFFFF' : '#5F5F68'}
            />
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#0A090E',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    alignSelf: 'stretch',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  tabActive: {},
  tabPressed: {},
});

export default BottomNav;


