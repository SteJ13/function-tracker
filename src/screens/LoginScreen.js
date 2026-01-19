import React, { useContext, useState } from 'react';
import { View, Button, StyleSheet, Text } from 'react-native';
import { useForm } from 'react-hook-form';
import Toast from 'react-native-toast-message';

import { Input } from '@components/FormInputs';
import { AuthContext } from '@context/AuthContext';

export default function LoginScreen() {
    const { login } = useContext(AuthContext);
    const { control, handleSubmit } = useForm();
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const onSubmit = async (data) => {
        setLoading(true);
        setErrorMessage('');
        try {
            await login(data.username, data.password);
        } catch (err) {
            Toast.show({
                type: 'error',
                text1: err, // will show 'Invalid credentials'
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
            />

            <Input
                control={control}
                name="password"
                label="Password"
                password
                required
                rules={{ required: 'Password is required' }}
            />

            <Button title={loading ? 'Logging in...' : 'Login'} onPress={handleSubmit(onSubmit)} disabled={loading} />
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
        marginBottom: 20,
        textAlign: 'center',
    },
    error: {
        color: 'red',
        marginBottom: 10,
        textAlign: 'center',
    },
});
