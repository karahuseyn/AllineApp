import { Stack } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Logo from './Logo';

interface SplashScreenProps {
    onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
    const { width } = useWindowDimensions();
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const scaleAnim = useRef(new Animated.Value(1.2)).current;

    useEffect(() => {
        // Sequence: Hold -> Shrink & Fade -> Finish
        Animated.sequence([
            Animated.delay(4000), // Hold for 4 seconds
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0.8,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ]),
        ]).start(() => {
            onFinish();
        });
    }, []);

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
                <Logo width={(width > 0 ? width : 400) * 0.35} height={(width > 0 ? width : 400) * 0.35} />
                <Text style={styles.signature}>Made by Hafoo</Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000', // Match app background
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
    },
    signature: {
        color: '#666',
        fontSize: 14,
        marginTop: 20,
        fontWeight: '600',
        letterSpacing: 1,
        fontFamily: 'monospace',
    },
});
