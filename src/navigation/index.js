import React from 'react';
import { View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@context/AuthContext';
import { useNetwork } from '@context/NetworkContext';
import AppLoader from '@components/AppLoader';
import HeaderUserMenu from '@components/HeaderUserMenu';
import OfflineBanner from '@components/OfflineBanner';

// Auth Screens
import LoginScreen from '@screens/Auth/login';
import SignupScreen from '@screens/Auth/signup';

// App Screens
import HomeScreen from '@screens/HomeScreen';
import FunctionListScreen from '@screens/Functions';
import FunctionFormScreen from '@screens/Functions/Form';
import FunctionDetailScreen from '@screens/Functions/FunctionDetailScreen';
import ContributionsListScreen from '@screens/Contributions/ListScreen';
import ContributionsAddScreen from '@screens/Contributions/AddScreen';
import ContributionsEditScreen from '@screens/Contributions/EditScreen';
import LedgerScreen from '@screens/Contributions/LedgerScreen';
import ReturnHistoryScreen from '@screens/Contributions/ReturnHistoryScreen';
import LocationsListScreen from '@screens/Locations/ListScreen';
import LocationAddEditScreen from '@screens/Locations/AddEditScreen';
import FunctionCategoriesScreen from '@screens/FunctionCategories';
import FunctionCategoryForm from '@screens/FunctionCategories/Form';
import NotificationsScreen from '@screens/Notifications/NotificationsScreen';
import NotificationDetailScreen from '@screens/Notifications/NotificationDetailScreen';
import CalendarScreen from '@screens/Calendar';
import AreaCalculatorScreen from '@screens/AreaCalculatorScreen';

const Stack = createNativeStackNavigator();

// Auth Stack - shown when user is NOT logged in
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen
        name="AreaCalculator"
        component={AreaCalculatorScreen}
        options={{ title: 'Area Calculator' }}
      />
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
        name="AddContribution"
        component={ContributionsAddScreen}
        options={{ title: 'Add Contribution' }}
      />
      <Stack.Screen
        name="ContributionsList"
        component={ContributionsListScreen}
        options={{ title: 'Contributions' }}
      />
      <Stack.Screen
        name="ContributionsAdd"
        component={ContributionsAddScreen}
        options={{ title: 'Add Contribution' }}
      />
      <Stack.Screen
        name="ContributionsEdit"
        component={ContributionsEditScreen}
        options={{ title: 'Edit Contribution' }}
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
      <Stack.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{ title: 'Calendar' }}
      />
      <Stack.Screen
        name="Ledger"
        component={LedgerScreen}
        options={{ title: 'Pending Returns' }}
      />
      <Stack.Screen
        name="ReturnHistory"
        component={ReturnHistoryScreen}
        options={{ title: 'Return History' }}
      />
      <Stack.Screen
        name="LocationsList"
        component={LocationsListScreen}
        options={{ title: 'Manage Locations' }}
      />
      <Stack.Screen
        name="LocationAddEdit"
        component={LocationAddEditScreen}
        options={({ route }) => ({
          title: route?.params?.location ? 'Edit Location' : 'Add Location',
        })}
      />
      <Stack.Screen
        name="AreaCalculator"
        component={AreaCalculatorScreen}
        options={{ title: 'Area Calculator' }}
      />
    </Stack.Navigator>
  );
}

// Root Navigator - decides which stack to show based on auth state
export default function RootNavigator() {
  const { user, loading } = useAuth();
  const { isOnline } = useNetwork();

  // Show loader while checking auth state
  if (loading) {
    return <AppLoader />;
  }

  // Show AuthStack if no user, AppStack if user exists
  return (
    <View style={{ flex: 1 }}>
      {!isOnline && <OfflineBanner />}
      {user ? <AppStack /> : <AuthStack />}
    </View>
  );
}
