import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useAuth } from '@context/AuthContext';
import { useLanguage } from '@context/LanguageContext';
import { useNavigation } from '@react-navigation/native';

export default function HeaderUserMenu() {
  const { user, signOut } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const navigation = useNavigation();
  const [visible, setVisible] = useState(false);

  const handleLogout = async () => {
    await signOut();
    setVisible(false);
    // toast is handled in logout in AuthContext
  };

  const handleAreaCalculator = () => {
    setVisible(false);
    navigation.navigate('AreaCalculator');
  };

  if (!user) return null;

  const displayName = user.email || user.user_metadata?.name || 'User';
  const firstLetter = displayName.charAt(0).toUpperCase();

  return (
    <>
      <TouchableOpacity onPress={() => setVisible(true)} style={styles.icon}>
        <Text style={styles.iconText}>{firstLetter}</Text>
      </TouchableOpacity>

      <Modal
        transparent
        visible={visible}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={styles.menu}>
            <Text style={styles.username}>{displayName}</Text>
            <TouchableOpacity onPress={toggleLanguage} style={{ marginBottom: 10 }}>
              <Text style={{ fontWeight: 'bold' }}>
                {language === 'en' ? 'தமிழ்' : 'English'}
              </Text>
            </TouchableOpacity>
            {/* Area Cal removed from header menu, now in HomeScreen */}
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  iconText: {
    color: 'white',
    fontWeight: 'bold',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menu: {
    backgroundColor: 'white',
    marginTop: 50,
    marginRight: 10,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    minWidth: 150,
  },
  username: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  logoutButton: {
    paddingVertical: 5,
  },
  logoutText: {
    color: 'red',
    fontWeight: 'bold',
  },
});
