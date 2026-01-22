import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, TextInput, Pressable } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import Toast from 'react-native-toast-message';

import { Input } from '@components/FormInputs';
import { useAuth } from '@context/AuthContext';
import EyeOpenIcon from '@components/Icons/EyeOpenIcon';
import EyeClosedIcon from '@components/Icons/EyeClosedIcon';

export default function SignupScreen({ navigation }) {
    const { signUp } = useAuth();
    const { control, handleSubmit } = useForm({
        defaultValues: {
            email: '',
            password: '',
            confirmPassword: '',
        },
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const onSubmit = async (data) => {
        if (data.password !== data.confirmPassword) {
            Toast.show({
                type: 'error',
                text1: 'Passwords do not match',
            });
            return;
        }

        setLoading(true);
        try {
            await signUp(data.email, data.password);
            Toast.show({
                type: 'success',
                text1: 'Account created successfully!',
            });
            navigation?.navigate?.('Login');
        } catch (err) {
            Toast.show({
                type: 'error',
                text1: err?.message || 'Signup failed',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Sign Up</Text>

            <Input
                control={control}
                name="email"
                label="Email"
                required
                rules={{
                    required: 'Email is required',
                    pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address',
                    },
                }}
                placeholder="Enter email"
                voice={false}
            />

            <Controller
                control={control}
                name="password"
                rules={{
                    required: 'Password is required',
                    minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters',
                    },
                }}
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

            <Controller
                control={control}
                name="confirmPassword"
                rules={{ required: 'Please confirm your password' }}
                render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Confirm Password *</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                value={value}
                                onChangeText={onChange}
                                onBlur={onBlur}
                                secureTextEntry={!showConfirmPassword}
                                placeholder="Confirm Password"
                                style={styles.input}
                            />
                            <Pressable
                                onPress={() => setShowConfirmPassword(prev => !prev)}
                                hitSlop={10}
                                style={styles.iconButton}
                            >
                                {showConfirmPassword ? (
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
                <Text style={styles.buttonText}>{loading ? 'Creating account...' : 'Sign Up'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => navigation?.navigate?.('Login')}
                style={styles.loginLink}
                activeOpacity={0.75}
            >
                <Text style={styles.loginText}>
                    Already have an account? <Text style={styles.loginTextBold}>Login</Text>
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
    loginLink: {
        marginTop: 16,
        alignItems: 'center',
    },
    loginText: {
        color: '#555',
        fontSize: 13,
    },
    loginTextBold: {
        color: '#1976D2',
        fontWeight: '600',
    },
});
