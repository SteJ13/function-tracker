import { Platform } from 'react-native';
import {
  getMessaging,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
  requestPermission,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import { getApp } from '@react-native-firebase/app';
import Toast from 'react-native-toast-message';

/**
 * Request permission to show notifications
 */
export async function requestUserPermission() {
  const messaging = getMessaging(getApp());

  const authStatus = await requestPermission(messaging);

  const enabled =
    authStatus === AuthorizationStatus.AUTHORIZED ||
    authStatus === AuthorizationStatus.PROVISIONAL;

  return enabled;
}

/**
 * Get FCM token for this device
 */
export async function getFcmToken() {
  const messaging = getMessaging(getApp());

  try {
    const token = await getToken(messaging);
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.log('Error getting FCM token:', error);
    return null;
  }
}

/**
 * Listen to foreground messages
 */
export function onMessageListener() {
  const messaging = getMessaging(getApp());

  return onMessage(messaging, async remoteMessage => {
    console.log('FCM Foreground message:', remoteMessage);
  });
}

/**
 * When app is opened from background by tapping notification
 */
export function onNotificationOpenedAppListener(callback) {
  const messaging = getMessaging(getApp());

  return onNotificationOpenedApp(messaging, callback);
}

/**
 * When app is opened from quit state by tapping notification
 */
export async function getInitialNotificationListener() {
  const messaging = getMessaging(getApp());
  return getInitialNotification(messaging);
}