import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, TextInput, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import Toast from 'react-native-toast-message';
import { supabase } from '@services/supabaseClient';
import EyeOpenIcon from '@components/Icons/EyeOpenIcon';
import EyeClosedIcon from '@components/Icons/EyeClosedIcon';

export default function ResetPasswordScreen({ navigation, route }) {
    const { control, handleSubmit, watch, formState: { errors } } = useForm({
        defaultValues: {
            password: '',
            confirmPassword: '',
        },
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const password = watch('password');

    // Listen for password recovery auth state change
    useEffect(() => {
        const setupAuthListener = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                console.log('[ResetPassword] Current session:', session?.user?.email);
            } catch (err) {
                console.error('[ResetPassword] Error checking session:', err);
            }
        };

        setupAuthListener();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('[ResetPassword] Auth event:', event, 'User:', session?.user?.email);
            if (event === 'PASSWORD_RECOVERY') {
                console.log('[ResetPassword] Password recovery mode detected');
            }
        });

        return () => {
            subscription?.unsubscribe?.();
        };
    }, []);

    const onSubmit = async (data) => {
        // Validate passwords match
        if (data.password !== data.confirmPassword) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Passwords do not match',
            });
            return;
        }

        // Validate password strength
        if (data.password.length < 6) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Password must be at least 6 characters',
            });
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: data.password,
            });

            if (error) {
                console.error('[ResetPassword] Error updating password:', error);
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: error.message || 'Failed to update password',
                });
                return;
            }

            console.log('[ResetPassword] Password updated successfully');
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Password updated successfully',
            });

            // Navigate to login after 2 seconds
            setTimeout(() => {
                navigation?.navigate?.('Login');
            }, 2000);
        } catch (err) {
            console.error('[ResetPassword] Exception:', err);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: err?.message || 'An error occurred',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
        >
            <View style={styles.header}>
                <Text style={styles.title}>Set New Password</Text>
                <Text style={styles.subtitle}>
                    Enter your new password below.
                </Text>
            </View>

            <View style={styles.form}>
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
                    render={({ field: { value, onChange, onBlur } }) => (
                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>New Password *</Text>
                            <View style={[styles.inputWrapper, errors.password && styles.inputWrapperError]}>
                                <TextInput
                                    value={value}
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    secureTextEntry={!showPassword}
                                    placeholder="Enter new password"
                                    placeholderTextColor="#999"
                                    editable={!loading}
                                    style={styles.input}
                                />
                                <Pressable
                                    onPress={() => setShowPassword(prev => !prev)}
                                    hitSlop={10}
                                    style={styles.iconButton}
                                    disabled={loading}
                                >
                                    {showPassword ? (
                                        <EyeOpenIcon size={20} color="#555" />
                                    ) : (
                                        <EyeClosedIcon size={20} color="#555" />
                                    )}
                                </Pressable>
                            </View>
                            {errors.password && (
                                <Text style={styles.error}>{errors.password.message}</Text>
                            )}
                        </View>
                    )}
                />

                <Controller
                    control={control}
                    name="confirmPassword"
                    rules={{
                        required: 'Please confirm your password',
                        validate: (value) =>
                            value === password || 'Passwords do not match',
                    }}
                    render={({ field: { value, onChange, onBlur } }) => (
                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>Confirm Password *</Text>
                            <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputWrapperError]}>
                                <TextInput
                                    value={value}
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    secureTextEntry={!showConfirmPassword}
                                    placeholder="Confirm your password"
                                    placeholderTextColor="#999"
                                    editable={!loading}
                                    style={styles.input}
                                />
                                <Pressable
                                    onPress={() => setShowConfirmPassword(prev => !prev)}
                                    hitSlop={10}
                                    style={styles.iconButton}
                                    disabled={loading}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOpenIcon size={20} color="#555" />
                                    ) : (
                                        <EyeClosedIcon size={20} color="#555" />
                                    )}
                                </Pressable>
                            </View>
                            {errors.confirmPassword && (
                                <Text style={styles.error}>{errors.confirmPassword.message}</Text>
                            )}
                        </View>
                    )}
                />

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleSubmit(onSubmit)}
                    disabled={loading}
                    activeOpacity={0.85}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text style={styles.buttonText}>Update Password</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => navigation?.navigate?.('Login')}
                    style={styles.backLink}
                    disabled={loading}
                    activeOpacity={0.75}
                >
                    <Text style={styles.backText}>
                        Back to <Text style={styles.backTextBold}>Login</Text>
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    contentContainer: {
        flexGrow: 1,
        padding: 20,
        justifyContent: 'center',
        paddingTop: 40,
        paddingBottom: 32,
    },
    header: {
        marginBottom: 32,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '600',
        marginBottom: 12,
        textAlign: 'center',
        color: '#000',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
    form: {
        marginBottom: 24,
    },
    fieldContainer: {
        marginBottom: 20,
    },
    label: {
        marginBottom: 8,
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
    inputWrapperError: {
        borderColor: '#d32f2f',
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
        marginTop: 6,
        color: '#d32f2f',
        fontSize: 12,
    },
    button: {
        backgroundColor: '#1976D2',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
        minHeight: 50,
        justifyContent: 'center',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },
    backLink: {
        marginTop: 20,
        alignItems: 'center',
    },
    backText: {
        color: '#555',
        fontSize: 13,
    },
    backTextBold: {
        color: '#1976D2',
        fontWeight: '600',
    },
});
