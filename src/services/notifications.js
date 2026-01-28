import notifee from '@notifee/react-native';

const CHANNEL_ID = 'reminders';
const CHANNEL_NAME = 'Reminders';

let channelCreated = false;

/**
 * Request user permission for notifications
 * @returns {Promise<string>} Permission status: 'granted', 'denied', or 'unknown'
 */
export async function requestNotificationPermission() {
  try {
    const permission = await notifee.requestPermission();
    
    // permission object has: granted (boolean), authorizationStatus (number)
    if (permission.granted) {
      console.log('[Notifications] Permission granted');
      return 'granted';
    } else if (permission.authorizationStatus === 2) {
      // AuthorizationStatus.DENIED = 2
      console.log('[Notifications] Permission denied');
      return 'denied';
    } else {
      console.log('[Notifications] Permission status unknown');
      return 'unknown';
    }
  } catch (error) {
    console.error('[Notifications] Failed to request permission:', error);
    return 'unknown';
  }
}

/**
 * Create the default notifications channel
 * Safe to call multiple times - only creates once
 */
export async function createDefaultChannel() {
  try {
    if (channelCreated) {
      console.log('[Notifications] Channel already created, skipping');
      return;
    }

    await notifee.createChannel({
      id: CHANNEL_ID,
      name: CHANNEL_NAME,
      importance: 4, // Importance.HIGH = 4
    });

    channelCreated = true;
    console.log('[Notifications] Default channel created:', CHANNEL_ID);
  } catch (error) {
    console.error('[Notifications] Failed to create channel:', error);
  }
}

/**
 * Get the default channel ID
 */
export function getDefaultChannelId() {
  return CHANNEL_ID;
}

/**
 * Schedule a reminder notification for a function
 * @param {Object} fn - Function object with id, title, date, time, reminder_minutes
 */
export async function scheduleFunctionReminder(fn) {
    console.log('fn: ', fn);
  // Minimum delay to avoid scheduling notifications too close to current time
  const MIN_DELAY_MS = 5 * 60 * 1000; // 5 minutes
  
  try {
    // Skip if no reminder is set
    if (!fn.reminder_minutes && fn.reminder_minutes !== 0) {
      console.log('[Notifications] No reminder set for function:', fn.id, 'reminder_minutes:', fn.reminder_minutes);
      return;
    }

    // Handle both form data (date/time) and API response (function_date/function_time)
    const dateStr = fn.date || fn.function_date;
    const timeStr = fn.time || fn.function_time;

    // Parse the function date and time
    // Expected format: date = "YYYY-MM-DD", time = "HH:mm" or "HH:mm:ss"
    const functionDateTime = parseDateTime(dateStr, timeStr);
    
    console.log('[Notifications] Parsed date:', dateStr, 'time:', timeStr);
    console.log('[Notifications] Parsed DateTime:', functionDateTime, 'Type:', typeof functionDateTime, 'isDate:', functionDateTime instanceof Date);
    
    if (!functionDateTime || isNaN(functionDateTime.getTime())) {
      console.warn('[Notifications] Invalid date/time for function:', fn.id, 'dateStr:', dateStr, 'timeStr:', timeStr);
      return;
    }

    // Calculate trigger time by subtracting reminder_minutes
    const triggerTime = new Date(functionDateTime.getTime() - fn.reminder_minutes * 60000);
    const now = new Date();

    console.log('[Notifications] Function date/time:', functionDateTime, 'Reminder mins:', fn.reminder_minutes, 'Trigger time:', triggerTime, 'Now:', now);

    // If trigger time is in the past, don't schedule
    if (triggerTime < now) {
      console.log('[Notifications] Trigger time in past, skipping:', fn.id, 'Trigger:', triggerTime, 'Now:', now);
      return;
    }

    // Guard against scheduling notifications too close to current time
    if (triggerTime.getTime() - now.getTime() < MIN_DELAY_MS) {
      console.log('[Notifications] Trigger time too close (< 5 min), skipping:', fn.id);
      return;
    }

    // Calculate milliseconds until notification should trigger
    const millisecondsFromNow = triggerTime.getTime() - Date.now();

    console.log('[Notifications] Will schedule notification in', Math.floor(millisecondsFromNow / 1000), 'seconds');

    await notifee.createTriggerNotification(
      {
        id: `function_${fn.id}`,
        title: fn.title,
        body: 'Reminder for your function',
        android: {
          channelId: CHANNEL_ID,
          pressAction: {
            id: 'default',
          },
          alarmManager: {
            allowWhileIdle: true,
          },
        },
      },
      {
        type: 0, // TIMESTAMP type (triggers at absolute timestamp)
        timestamp: triggerTime.getTime(), // Use absolute timestamp in milliseconds
      }
    );

    console.log('[Notifications] Scheduled reminder for function:', fn.id, 'at', triggerTime);
  } catch (error) {
    console.error('[Notifications] Failed to schedule reminder:', error);
  }
}

/**
 * Cancel a scheduled reminder notification for a function
 * @param {string} functionId - The function ID
 */
export async function cancelFunctionReminder(functionId) {
  try {
    const notificationId = `function_${functionId}`;
    await notifee.cancelNotification(notificationId);
    console.log('[Notifications] Cancelled reminder for function:', functionId);
  } catch (error) {
    console.error('[Notifications] Failed to cancel reminder:', error);
  }
}

/**
 * Helper: Parse date and time strings into a Date object
 * @param {string} date - Date string "YYYY-MM-DD"
 * @param {string} time - Time string "HH:mm"
 * @returns {Date|null} Parsed Date object or null if invalid
 */
function parseDateTime(date, time) {
  if (!date || !time) return null;

  let datePart;
  let timePart;

  // Normalize date
  if (date instanceof Date) {
    datePart = date.toISOString().split('T')[0];
  } else if (typeof date === 'string') {
    datePart = date;
  } else {
    return null;
  }

  // Normalize time - handle both "HH:mm" and "HH:mm:ss" formats
  if (time instanceof Date) {
    const h = time.getHours().toString().padStart(2, '0');
    const m = time.getMinutes().toString().padStart(2, '0');
    timePart = `${h}:${m}`;
  } else if (typeof time === 'string') {
    // Extract only HH:mm from "HH:mm:ss" if seconds are present
    timePart = time.substring(0, 5); // Gets first 5 chars: "HH:mm"
  } else {
    return null;
  }

  // Parse as local time, not UTC
  // Create date in format "YYYY-MM-DD" and time in format "HH:mm"
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  
  const dateTime = new Date(year, month - 1, day, hours, minutes, 0);
  
  // Validate the date was created successfully
  if (isNaN(dateTime.getTime())) {
    console.warn('[parseDateTime] Failed to parse:', datePart, timePart);
    return null;
  }

  return dateTime;
}

