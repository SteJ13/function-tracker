import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import Toast from 'react-native-toast-message';
import { supabase } from '@services/supabaseClient';

export default function ForgotPasswordScreen({ navigation }) {
    const { control, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            email: '',
        },
    });
    const [loading, setLoading] = useState(false);
    const emailRef = useRef(null);

    // Autofocus email field
    useEffect(() => {
        setTimeout(() => {
            emailRef.current?.focus?.();
        }, 300);
    }, []);

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
                redirectTo: 'yourapp://reset-password',
            });

            if (error) {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: error.message || 'Failed to send reset link',
                });
                console.error('[ForgotPassword] Error:', error);
                return;
            }

            // Show success state
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Password reset link sent to your email',
            });

            console.log('[ForgotPassword] Reset link sent to:', data.email);

            // Navigate back to login after 2 seconds
            setTimeout(() => {
                navigation?.navigate?.('Login');
            }, 2000);
        } catch (err) {
            console.error('[ForgotPassword] Exception:', err);
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
                <Text style={styles.title}>Reset Password</Text>
                <Text style={styles.subtitle}>
                    Enter your email address and we'll send you a link to reset your password.
                </Text>
            </View>

            <View style={styles.form}>
                <Controller
                    control={control}
                    name="email"
                    rules={{
                        required: 'Email is required',
                        pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: 'Please enter a valid email address',
                        },
                    }}
                    render={({ field: { value, onChange, onBlur } }) => (
                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>Email Address *</Text>
                            <TextInput
                                ref={emailRef}
                                value={value}
                                onChangeText={onChange}
                                onBlur={onBlur}
                                placeholder="your@email.com"
                                placeholderTextColor="#999"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoComplete="email"
                                editable={!loading}
                                style={[
                                    styles.input,
                                    errors.email && styles.inputError,
                                ]}
                            />
                            {errors.email && (
                                <Text style={styles.error}>{errors.email.message}</Text>
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
                        <Text style={styles.buttonText}>Send Reset Link</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => navigation?.navigate?.('Login')}
                    style={styles.backLink}
                    disabled={loading}
                    activeOpacity={0.75}
                >
                    <Text style={styles.backText}>
                        Remember your password? <Text style={styles.backTextBold}>Back to Login</Text>
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
    input: {
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 15,
        color: '#000',
        backgroundColor: '#fff',
    },
    inputError: {
        borderColor: '#d32f2f',
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
