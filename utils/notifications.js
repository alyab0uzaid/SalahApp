import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Request notification permissions
 * @returns {Promise<boolean>} True if permissions granted, false otherwise
 */
export const requestNotificationPermissions = async () => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Notification permissions not granted');
      return false;
    }

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('prayer-times', {
        name: 'Prayer Times',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
      });
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling notifications:', error);
  }
};

/**
 * Schedule notifications for prayer times
 * @param {Array<string>} prayerTimes - Array of prayer times in HH:MM format
 * @param {Array<string>} prayerNames - Array of prayer names
 * @param {Object} notificationsEnabled - Object with prayer names as keys and boolean values
 * @param {Date} date - Date to schedule notifications for (defaults to today)
 */
export const schedulePrayerNotifications = async (
  prayerTimes,
  prayerNames,
  notificationsEnabled,
  date = new Date()
) => {
  try {
    // Validate inputs
    if (!prayerTimes || !Array.isArray(prayerTimes) || prayerTimes.length === 0) {
      console.warn('Invalid prayer times, skipping notification scheduling');
      return;
    }
    if (!prayerNames || !Array.isArray(prayerNames) || prayerNames.length === 0) {
      console.warn('Invalid prayer names, skipping notification scheduling');
      return;
    }
    if (!notificationsEnabled || typeof notificationsEnabled !== 'object') {
      console.warn('Invalid notifications enabled object, skipping notification scheduling');
      return;
    }
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      console.warn('Invalid date, skipping notification scheduling');
      return;
    }

    // Cancel existing notifications first
    await cancelAllNotifications();

    // Check if we have permission
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Notification permissions not granted, skipping scheduling');
      return;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    // Only schedule for today and future dates
    if (targetDate < today) {
      return;
    }

    // Schedule notifications for each prayer
    for (let i = 0; i < prayerTimes.length && i < prayerNames.length; i++) {
      const prayerName = prayerNames[i];
      const prayerTime = prayerTimes[i];
      
      // Skip if notification is not enabled for this prayer
      if (!notificationsEnabled[prayerName]) {
        continue;
      }

      // Parse time - validate format and handle both 12-hour and 24-hour formats
      if (!prayerTime || typeof prayerTime !== 'string') {
        console.warn(`Invalid prayer time format for ${prayerName}: ${prayerTime}`);
        continue;
      }
      
      let hours, minutes;
      
      // Check if it's 12-hour format (contains AM/PM)
      if (prayerTime.includes('AM') || prayerTime.includes('PM')) {
        const [time, period] = prayerTime.split(' ');
        const timeParts = time.split(':');
        if (timeParts.length < 2) {
          console.warn(`Invalid prayer time format for ${prayerName}: ${prayerTime}`);
          continue;
        }
        hours = parseInt(timeParts[0], 10);
        minutes = parseInt(timeParts[1], 10);
        
        // Convert 12-hour to 24-hour format
        if (period === 'PM' && hours !== 12) {
          hours += 12;
        } else if (period === 'AM' && hours === 12) {
          hours = 0;
        }
      } else {
        // 24-hour format
        const timeParts = prayerTime.split(':');
        if (timeParts.length < 2) {
          console.warn(`Invalid prayer time format for ${prayerName}: ${prayerTime}`);
          continue;
        }
        hours = parseInt(timeParts[0], 10);
        minutes = parseInt(timeParts[1], 10);
      }
      
      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        console.warn(`Invalid prayer time values for ${prayerName}: ${prayerTime}`);
        continue;
      }
      
      // Create notification date
      const notificationDate = new Date(targetDate);
      notificationDate.setHours(hours, minutes, 0, 0);

      // If the time has passed today, schedule for tomorrow
      if (notificationDate <= now && targetDate.getTime() === today.getTime()) {
        notificationDate.setDate(notificationDate.getDate() + 1);
      }

      // Schedule the notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${prayerName} Prayer Time`,
          body: `It's time for ${prayerName} prayer (${prayerTime})`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: 'date',
          date: notificationDate,
        },
        identifier: `prayer-${prayerName.toLowerCase()}-${targetDate.toISOString().split('T')[0]}`,
      });
    }

    // Also schedule for the next 7 days
    for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
      const futureDate = new Date(targetDate);
      futureDate.setDate(futureDate.getDate() + dayOffset);

      // We'll need to recalculate prayer times for future dates
      // For now, we'll schedule based on today's times (approximation)
      // In a production app, you'd want to calculate actual times for each date
      for (let i = 0; i < prayerTimes.length && i < prayerNames.length; i++) {
        const prayerName = prayerNames[i];
        const prayerTime = prayerTimes[i];
        
        if (!notificationsEnabled[prayerName]) {
          continue;
        }

        // Parse time - validate format and handle both 12-hour and 24-hour formats
        if (!prayerTime || typeof prayerTime !== 'string') {
          continue;
        }
        
        let hours, minutes;
        
        // Check if it's 12-hour format (contains AM/PM)
        if (prayerTime.includes('AM') || prayerTime.includes('PM')) {
          const [time, period] = prayerTime.split(' ');
          const timeParts = time.split(':');
          if (timeParts.length < 2) {
            continue;
          }
          hours = parseInt(timeParts[0], 10);
          minutes = parseInt(timeParts[1], 10);
          
          // Convert 12-hour to 24-hour format
          if (period === 'PM' && hours !== 12) {
            hours += 12;
          } else if (period === 'AM' && hours === 12) {
            hours = 0;
          }
        } else {
          // 24-hour format
          const timeParts = prayerTime.split(':');
          if (timeParts.length < 2) {
            continue;
          }
          hours = parseInt(timeParts[0], 10);
          minutes = parseInt(timeParts[1], 10);
        }
        
        if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
          continue;
        }
        
        const notificationDate = new Date(futureDate);
        notificationDate.setHours(hours, minutes, 0, 0);

        await Notifications.scheduleNotificationAsync({
          content: {
            title: `${prayerName} Prayer Time`,
            body: `It's time for ${prayerName} prayer (${prayerTime})`,
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: {
            type: 'date',
            date: notificationDate,
          },
          identifier: `prayer-${prayerName.toLowerCase()}-${futureDate.toISOString().split('T')[0]}`,
        });
      }
    }

    console.log('Prayer notifications scheduled successfully');
  } catch (error) {
    console.error('Error scheduling prayer notifications:', error);
  }
};

/**
 * Get all scheduled notifications
 * @returns {Promise<Array>} Array of scheduled notifications
 */
export const getScheduledNotifications = async () => {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
};

/**
 * Send a test notification immediately
 * @param {string} prayerName - Name of the prayer
 * @param {string} prayerTime - Time of the prayer
 */
export const sendTestNotification = async (prayerName, prayerTime) => {
  try {
    // Check if we have permission
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Notification permissions not granted, cannot send test notification');
      return;
    }

    // Send notification immediately
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${prayerName} Prayer Time`,
        body: `Test notification: It's time for ${prayerName} prayer (${prayerTime})`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // null means send immediately
      identifier: `test-${prayerName.toLowerCase()}-${Date.now()}`,
    });

    console.log(`Test notification sent for ${prayerName}`);
  } catch (error) {
    console.error('Error sending test notification:', error);
  }
};

