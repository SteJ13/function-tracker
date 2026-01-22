import React, { useContext, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from '@screens/HomeScreen';
import { LanguageProvider } from '@context/LanguageContext';

import LoginScreen from '@screens/Auth/login';
import SignupScreen from '@screens/Auth/signup';
import { AuthProvider, AuthContext } from '@context/AuthContext';
import AppLoader from '@components/AppLoader';
import HeaderUserMenu from '@components/HeaderUserMenu';
import {
  navigationRef,
  navigate,
  flushPendingNavigation,
} from '@navigation/navigationRef';
import NotificationsScreen from '@screens/Notifications/NotificationsScreen';
import NotificationDetailScreen from '@screens/Notifications/NotificationDetailScreen';

import {
  requestUserPermission,
  getFcmToken,
  onMessageListener,
  onNotificationOpenedAppListener,
  getInitialNotificationListener,
} from '@services/firebaseService';

import FunctionCategoriesScreen from '@screens/FunctionCategories';
import FunctionCategoryForm from '@screens/FunctionCategories/Form';
import FunctionListScreen from '@screens/Functions';
import FunctionFormScreen from '@screens/Functions/Form';
import FunctionDetailScreen from '@screens/Functions/FunctionDetailScreen';

const Stack = createNativeStackNavigator();

/* ---------------- NAVIGATION ONLY ---------------- */
function AppNavigator() {
  const { loading, user } = useContext(AuthContext);

  if (loading) {
    return <AppLoader />;
  }

  return (
    <Stack.Navigator>
      {user ? (
        <>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{
              title: 'Function Tracker',
              headerRight: () => <HeaderUserMenu />,
            }}
          />
          <Stack.Screen
            name="Functions"
            component={FunctionListScreen}
            options={{ title: 'Functions' }}
          />
          <Stack.Screen
            name="FunctionForm"
            component={FunctionFormScreen}
            options={{ title: 'Function' }}
          />
          <Stack.Screen
            name="FunctionDetail"
            component={FunctionDetailScreen}
            options={{ title: 'Function Details' }}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ title: 'Notifications' }}
          />
          <Stack.Screen
            name="NotificationDetail"
            component={NotificationDetailScreen}
            options={{ title: 'Notification' }}
          />
          <Stack.Screen
  name="FunctionCategories"
  component={FunctionCategoriesScreen}
  options={{ title: 'Function Categories' }}
/>
<Stack.Screen
  name="FunctionCategoryForm"
  component={FunctionCategoryForm}
  options={{ title: 'Function Category' }}
/>

        </>
      ) : (
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Signup"
            component={SignupScreen}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

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
          <AppNavigator />
          <Toast />
        </NavigationContainer>
      </SafeAreaProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

