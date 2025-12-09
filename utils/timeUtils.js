/**
 * Time Utilities
 *
 * Utility functions for time conversion and formatting.
 * Used across the app for consistent time handling.
 */

/**
 * Convert a Date object to time format
 * @param {Date} date - Date object to format
 * @param {string} timeFormat - '12' for 12-hour (AM/PM) or '24' for 24-hour format
 * @returns {string} Formatted time string (e.g., "5:30 PM" or "17:30")
 */
export const formatTime = (date, timeFormat = '12') => {
  if (!date) return '';
  
  const hours = date.getHours();
  const minutes = date.getMinutes();
  
  if (timeFormat === '24') {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  } else {
    // 12-hour format
    const period = hours >= 12 ? 'PM' : 'AM';
    let displayHours = hours % 12;
    if (displayHours === 0) displayHours = 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }
};

/**
 * Format a Date object for prayer times
 * @param {Date} date - Prayer time date object
 * @param {string} timeFormat - '12' for 12-hour (AM/PM) or '24' for 24-hour format
 * @returns {string} Formatted prayer time string
 */
export const formatPrayerTime = (date, timeFormat = '12') => {
  if (!date) return '';
  return formatTime(date, timeFormat);
};

/**
 * Convert time string (e.g., "5:22 AM" or "5:22:30 AM") to minutes since midnight
 * Handles both "H:MM AM/PM" and "H:MM:SS AM/PM" formats
 * @param {string} timeStr - Time string to convert
 * @returns {number} Total minutes since midnight (including fractional seconds)
 */
export const timeToMinutes = (timeStr) => {
  const [time, period] = timeStr.split(' ');
  const parts = time.split(':').map(Number);
  const hours = parts[0];
  const minutes = parts[1] || 0;
  const seconds = parts[2] || 0;

  // Convert to total minutes including fractional seconds
  let totalMinutes = hours * 60 + minutes + (seconds / 60);
  if (period === 'PM' && hours !== 12) totalMinutes += 12 * 60;
  if (period === 'AM' && hours === 12) totalMinutes -= 12 * 60;
  return totalMinutes;
};
