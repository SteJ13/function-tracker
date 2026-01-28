import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LanguageProvider } from '@context/LanguageContext';
import { AuthProvider } from '@context/AuthContext';
import { NetworkProvider } from '@context/NetworkContext';
import {
  navigationRef,
  flushPendingNavigation,
} from '@navigation/navigationRef';
import RootNavigator from '@navigation';

import {
  requestUserPermission,
  getFcmToken,
  onMessageListener,
  onNotificationOpenedAppListener,
  getInitialNotificationListener,
} from '@services/firebaseService';

import {
  requestNotificationPermission,
  createDefaultChannel,
} from '@services/notifications';

/* ---------------- ROOT APP ---------------- */
export default function App() {
  useEffect(() => {
    async function initNotifications() {
      try {
        // Request local notification permission
        const permission = await requestNotificationPermission();
        console.log('[App] Local notification permission:', permission);

        // Create the reminders channel
        await createDefaultChannel();
      } catch (error) {
        console.error('[App] Failed to initialize notifications:', error);
      }
    }

    async function initFCM() {
      try {
        const enabled = await requestUserPermission();
        if (enabled) {
          const token = await getFcmToken();
          console.log('Device FCM Token:', token);
        }
      } catch (error) {
        console.error('[App] FCM initialization error:', error);
      }
    }

    // Initialize both local and remote notifications
    initNotifications();
    initFCM();

    const unsubscribeMessage = onMessageListener();

    const unsubscribeOpen = onNotificationOpenedAppListener(remoteMessage => {
      console.log('Opened from background:', remoteMessage);
    });

    getInitialNotificationListener().then(remoteMessage => {
      if (remoteMessage) {
        console.log('Opened from quit state:', remoteMessage);
      }
    });

    return () => {
      unsubscribeMessage();
      unsubscribeOpen();
    };
  }, []);


  return (
    <AuthProvider>
      <NetworkProvider>
        <LanguageProvider>
          <SafeAreaProvider>
            <NavigationContainer ref={navigationRef} onReady={flushPendingNavigation}>
              <RootNavigator />
              <Toast />
            </NavigationContainer>
          </SafeAreaProvider>
        </LanguageProvider>
      </NetworkProvider>
    </AuthProvider>
  );
}

