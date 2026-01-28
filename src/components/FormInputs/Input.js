import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Controller } from 'react-hook-form';
import { MicIcon, EyeIcon, EyeOffIcon } from '@components/Icons';
import { startSpeechToText } from 'react-native-voice-to-text';
import Toast from 'react-native-toast-message';

export default function Input({
  control,
  name,
  label,
  rules = {},
  required = false,
  handleChange,
  password = false,
  type,
  voice = true, // 👈 default enabled
}) {
  const [hidePassword, setHidePassword] = useState(password);
  const [listening, setListening] = useState(false);

  const keyboardType = type === 'number' ? 'numeric' : 'default';

  const handleVoiceInput = async (onChange) => {
    try {
      setListening(true);

      const audioText = await startSpeechToText();

      if (audioText && typeof audioText === 'string') {
        onChange(audioText);
        handleChange && handleChange(audioText);
      }
    } catch (error) {
      console.log('Voice error:', error);
      Toast.show({
        type: 'error',
        text1: 'Voice input failed',
      });
    } finally {
      setListening(false);
    }
  };

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { value, onChange }, fieldState: { error } }) => (
        <View style={styles.container}>
          {label && (
            <Text style={styles.label}>
              {label}
              {required ? ' *' : ''}
            </Text>
          )}

          <View style={styles.inputWrapper}>
            <TextInput
              value={value}
              onChangeText={(text) => {
                onChange(text);
                handleChange && handleChange(text);
              }}
              style={styles.input}
              secureTextEntry={hidePassword}
              placeholder={label}
              keyboardType={keyboardType}
              inputMode={type === 'number' ? 'numeric' : 'text'}
            />

            {/* PASSWORD EYE ICON */}
            {password && (
              <Pressable
                onPress={() => setHidePassword(!hidePassword)}
                style={styles.icon}
              >
                {hidePassword ? <EyeOffIcon /> : <EyeIcon />}
              </Pressable>
            )}

            {/* VOICE ICON */}
            {!password && voice && (
              <Pressable
                onPress={() => handleVoiceInput(onChange)}
                disabled={listening}
                style={styles.icon}
              >
                <MicIcon
                  color={listening ? '#d32f2f' : '#666'}
                />
              </Pressable>
            )}
          </View>

          {listening && (
            <Text style={styles.listeningText}>🎙 Listening…</Text>
          )}

          {error && <Text style={styles.error}>{error.message}</Text>}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 15,
    color: '#000',
  },
  icon: {
    paddingLeft: 8,
  },
  error: {
    marginTop: 4,
    color: '#d32f2f',
    fontSize: 12,
  },
  listeningText: {
    marginTop: 4,
    fontSize: 12,
    color: '#1976d2',
  },
});
