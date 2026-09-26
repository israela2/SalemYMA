import {
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { router } from 'expo-router';
import { useState } from 'react';

import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const [isRegister, setIsRegister] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleAuth() {
    if (!email || !password) {
      setMessage('Email leh password dah rawh.');
      return;
    }

    if (isRegister && !fullName) {
      setMessage('Full name dah rawh.');
      return;
    }

    setLoading(true);
    setMessage('');

    if (isRegister) {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      setLoading(false);

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage(
        'Account siam zo. Email verify ngai a nih chuan email check rawh.'
      );

      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>SY</Text>
        </View>

        <Text style={styles.title}>
          Salem YMA
        </Text>

        <Text style={styles.subtitle}>
          {isRegister
            ? 'Create your member account'
            : 'Welcome back'}
        </Text>

        {isRegister ? (
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#98A2B3"
            value={fullName}
            onChangeText={setFullName}
          />
        ) : null}

        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor="#98A2B3"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#98A2B3"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {message ? (
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>
              {message}
            </Text>
          </View>
        ) : null}

        <Pressable
          style={styles.loginButton}
          onPress={handleAuth}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>
            {loading
              ? 'Please wait...'
              : isRegister
              ? 'Create Account'
              : 'Login'}
          </Text>
        </Pressable>

        <Pressable
          style={styles.switchButton}
          onPress={() => {
            setIsRegister(!isRegister);
            setMessage('');
          }}
        >
          <Text style={styles.switchText}>
            {isRegister
              ? 'Already have an account? Login'
              : "Don't have an account? Register"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  logoCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#123B5D',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 15,
  },

  logoText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },

  title: {
    fontSize: 29,
    fontWeight: '900',
    color: '#123B5D',
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 12,
    color: '#7A8494',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 28,
  },

  input: {
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    paddingHorizontal: 15,
    fontSize: 13,
    color: '#172033',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E1E5EA',
  },

  messageBox: {
    backgroundColor: '#FFF4E5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },

  messageText: {
    fontSize: 11,
    color: '#8A5A00',
    lineHeight: 16,
  },

  loginButton: {
    height: 52,
    borderRadius: 13,
    backgroundColor: '#123B5D',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  switchButton: {
    alignItems: 'center',
    marginTop: 20,
    padding: 8,
  },

  switchText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#123B5D',
  },
});