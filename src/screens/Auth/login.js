import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, TextInput, Pressable } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import Toast from 'react-native-toast-message';

import { Input } from '@components/FormInputs';
import { useAuth } from '@context/AuthContext';
import EyeOpenIcon from '@components/Icons/EyeOpenIcon';
import EyeClosedIcon from '@components/Icons/EyeClosedIcon';

export default function LoginScreen({ navigation }) {
    const { signIn } = useAuth();
    const { control, handleSubmit } = useForm();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            await signIn(data.username, data.password);
        } catch (err) {
            Toast.show({
                type: 'error',
                text1: err?.message || 'Invalid credentials',
            });
        } finally {
            setLoading(false);
        }

    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Login</Text>

            <Input
                control={control}
                name="username"
                label="Username"
                required
                rules={{ required: 'Username is required' }}
                voice={false}
            />

            <Controller
                control={control}
                name="password"
                rules={{ required: 'Password is required' }}
                render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Password *</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                value={value}
                                onChangeText={onChange}
                                onBlur={onBlur}
                                secureTextEntry={!showPassword}
                                placeholder="Password"
                                style={styles.input}
                            />
                            <Pressable
                                onPress={() => setShowPassword(prev => !prev)}
                                hitSlop={10}
                                style={styles.iconButton}
                            >
                                {showPassword ? (
                                    <EyeOpenIcon size={20} color="#555" />
                                ) : (
                                    <EyeClosedIcon size={20} color="#555" />
                                )}
                            </Pressable>
                        </View>
                        {error && <Text style={styles.error}>{error.message}</Text>}
                    </View>
                )}
            />

            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSubmit(onSubmit)}
                disabled={loading}
                activeOpacity={0.85}
            >
                <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Login'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => navigation?.navigate?.('Signup')}
                style={styles.signupLink}
                activeOpacity={0.75}
            >
                <Text style={styles.signupText}>
                    Don't have an account? <Text style={styles.signupTextBold}>Sign up</Text>
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        marginBottom: 24,
        textAlign: 'center',
    },
    fieldContainer: {
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
    iconButton: {
        paddingLeft: 10,
        paddingVertical: 8,
    },
    error: {
        marginTop: 4,
        color: '#d32f2f',
        fontSize: 12,
    },
    button: {
        backgroundColor: '#1976D2',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 4,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },
    signupLink: {
        marginTop: 16,
        alignItems: 'center',
    },
    signupText: {
        color: '#555',
        fontSize: 13,
    },
    signupTextBold: {
        color: '#1976D2',
        fontWeight: '600',
    },
});
