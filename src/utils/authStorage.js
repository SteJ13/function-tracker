import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_KEY = 'AUTH_USER';

export const saveUser = async user => {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUser = async () => {
  const user = await AsyncStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const removeUser = async () => {
  await AsyncStorage.removeItem(USER_KEY);
};
