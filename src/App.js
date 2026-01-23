import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LanguageProvider } from '@context/LanguageContext';
import { AuthProvider } from '@context/AuthContext';
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

/* ---------------- ROOT APP ---------------- */
export default function App() {
  useEffect(() => {
  async function initFCM() {
    const enabled = await requestUserPermission();
    if (enabled) {
      const token = await getFcmToken();
      console.log('Device FCM Token:', token);
    }
  }

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
      <LanguageProvider>
        <SafeAreaProvider>
          <NavigationContainer ref={navigationRef} onReady={flushPendingNavigation}>
            <RootNavigator />
            <Toast />
          </NavigationContainer>
        </SafeAreaProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

