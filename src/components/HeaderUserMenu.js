import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { AuthContext } from '@context/AuthContext';
import { useLanguage } from '@context/LanguageContext';

export default function HeaderUserMenu() {
  const { user, logout } = useContext(AuthContext);
  const { language, toggleLanguage } = useLanguage();

  const [visible, setVisible] = useState(false);

  const handleLogout = async () => {
    await logout();
    setVisible(false);
    // toast is handled in logout in AuthContext
  };

  if (!user) return null;

  const firstLetter = user.username.charAt(0).toUpperCase();

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
            <Text style={styles.username}>{user.username}</Text>
            <TouchableOpacity onPress={toggleLanguage} style={{ marginBottom: 10 }}>
  <Text style={{ fontWeight: 'bold' }}>
    {language === 'en' ? 'தமிழ்' : 'English'}
  </Text>
</TouchableOpacity>

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
