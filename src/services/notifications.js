import notifee, { AndroidImportance } from '@notifee/react-native';
import { Platform, PermissionsAndroid } from 'react-native';

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
      importance: AndroidImportance.HIGH, // HIGH importance for reliable Android notifications
    });

    channelCreated = true;
    console.log('[Notifications] Default channel created:', CHANNEL_ID);
  } catch (error) {
    console.error('[Notifications] Failed to create channel:', error);
  }
}

/**
 * Request Android 13+ POST_NOTIFICATIONS permission
 */
async function requestAndroidNotificationPermissionIfNeeded() {
  if (Platform.OS !== 'android') return;
  const sdk = Platform.Version;
  if (sdk >= 33) {
    try {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      console.log('[Notifications] Android 13+ POST_NOTIFICATIONS permission result:', result);
      return result === PermissionsAndroid.RESULTS.GRANTED;
    } catch (e) {
      console.warn('[Notifications] Error requesting POST_NOTIFICATIONS permission:', e);
      return false;
    }
  }
  return true;
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
  console.log('[Notifications] fn:', fn);

  try {
    // Skip if no reminder is set
    if (!fn.reminder_minutes && fn.reminder_minutes !== 0) {
      console.log('[Notifications] No reminder set for function:', fn.id, 'reminder_minutes:', fn.reminder_minutes);
      return;
    }

    // Handle both form data (date/time) and API response (function_date/function_time)
    const dateStr = fn.date || fn.function_date;
    const timeStr = fn.time || fn.function_time;

    // Parse the function date and time - combines date + time into valid Date object
    const functionDateTime = parseDateTime(dateStr, timeStr);
    console.log('[Notifications] functionDateTime:', functionDateTime);

    if (!functionDateTime || isNaN(functionDateTime.getTime())) {
      console.warn('[Notifications] Invalid date/time for function:', fn.id, 'dateStr:', dateStr, 'timeStr:', timeStr);
      return;
    }

    // Convert to timestamp in milliseconds and subtract reminder_minutes
    // Use absolute timestamp trigger (not seconds-based)
    const triggerTimeMs = functionDateTime.getTime() - fn.reminder_minutes * 60 * 1000;
    const now = Date.now();

    console.log('[Notifications] triggerTime (ms):', triggerTimeMs, '-> ', new Date(triggerTimeMs).toString());

    // If trigger time is in the past, don't schedule
    if (triggerTimeMs <= now) {
      console.log('[Notifications] Trigger time in past, skipping:', fn.id, 'Trigger:', new Date(triggerTimeMs), 'Now:', new Date(now));
      return;
    }

    // Ensure Android channel and permissions
    await createDefaultChannel();
    await requestAndroidNotificationPermissionIfNeeded();

    // Schedule notification with absolute timestamp trigger and AlarmManager for reliability
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
            allowWhileIdle: true, // Ensures notification fires even when app is killed
          },
        },
      },
      {
        type: 0, // TriggerType.TIMESTAMP - triggers at absolute timestamp
        timestamp: triggerTimeMs, // Exact future time in milliseconds
        alarmManager: {
          allowWhileIdle: true, // AlarmManager will trigger even in doze mode
        },
      }
    );

    console.log('[Notifications] Scheduled reminder for function:', fn.id, 'at', new Date(triggerTimeMs));
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
 * Helper: Parse date and time strings into a valid Date object
 * Combines function date + time into a valid Date object
 * @param {string} date - Date string "YYYY-MM-DD"
 * @param {string} time - Time string "HH:mm" or "HH:mm:ss"
 * @returns {Date|null} Parsed Date object or null if invalid
 */
function parseDateTime(date, time) {
  console.log('[parseDateTime] input:', { date, time });

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

  // Validate format
  const dateMatch = /^\d{4}-\d{2}-\d{2}$/.test(datePart);
  const timeMatch = /^\d{2}:\d{2}$/.test(timePart);
  if (!dateMatch || !timeMatch) {
    console.warn('[parseDateTime] Invalid format. Expected date=YYYY-MM-DD, time=HH:mm. Got:', datePart, timePart);
    return null;
  }

  // Parse as local time, not UTC
  // Create date in format "YYYY-MM-DD" and time in format "HH:mm"
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);

  // Build new Date with local time (no timezone mismatch)
  const dateTime = new Date(year, month - 1, day, hours, minutes, 0);

  // Validate the date was created successfully
  if (isNaN(dateTime.getTime())) {
    console.warn('[parseDateTime] Failed to parse - produced invalid Date:', datePart, timePart);
    return null;
  }

  console.log('[parseDateTime] ->', dateTime.toString(), 'timestamp:', dateTime.getTime());
  return dateTime;
}

