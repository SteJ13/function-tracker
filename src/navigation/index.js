import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@context/AuthContext';
import AppLoader from '@components/AppLoader';
import HeaderUserMenu from '@components/HeaderUserMenu';

// Auth Screens
import LoginScreen from '@screens/Auth/login';
import SignupScreen from '@screens/Auth/signup';

// App Screens
import HomeScreen from '@screens/HomeScreen';
import FunctionListScreen from '@screens/Functions';
import FunctionFormScreen from '@screens/Functions/Form';
import FunctionDetailScreen from '@screens/Functions/FunctionDetailScreen';
import FunctionCategoriesScreen from '@screens/FunctionCategories';
import FunctionCategoryForm from '@screens/FunctionCategories/Form';
import NotificationsScreen from '@screens/Notifications/NotificationsScreen';
import NotificationDetailScreen from '@screens/Notifications/NotificationDetailScreen';

const Stack = createNativeStackNavigator();

// Auth Stack - shown when user is NOT logged in
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}

// App Stack - shown when user IS logged in
function AppStack() {
  return (
    <Stack.Navigator>
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
        name="FunctionCategories"
        component={FunctionCategoriesScreen}
        options={{ title: 'Function Categories' }}
      />
      <Stack.Screen
        name="FunctionCategoryForm"
        component={FunctionCategoryForm}
        options={{ title: 'Function Category' }}
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
    </Stack.Navigator>
  );
}

// Root Navigator - decides which stack to show based on auth state
export default function RootNavigator() {
  const { user, loading } = useAuth();

  // Show loader while checking auth state
  if (loading) {
    return <AppLoader />;
  }

  // Show AuthStack if no user, AppStack if user exists
  return user ? <AppStack /> : <AuthStack />;
}
