import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSettings, updateSetting } from '../utils/settingsStorage';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    calculationMethod: 'MuslimWorldLeague',
    asrMethod: 'Standard',
    highLatitudeRule: 'MiddleOfTheNight',
    calculationMethodAuto: false,
    customAngles: null,
    prayerAdjustments: null,
    timeFormat: '12',
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from storage on mount
  useEffect(() => {
    const loadSettings = async () => {
      const storedSettings = await getSettings();
      setSettings(storedSettings);
      setIsLoaded(true);
    };
    loadSettings();
  }, []);

  // Update a single setting
  const updateSettingInContext = async (key, value) => {
    // Update in memory immediately
    setSettings(prev => ({ ...prev, [key]: value }));

    // Save to storage
    await updateSetting(key, value);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettingInContext, isLoaded }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
