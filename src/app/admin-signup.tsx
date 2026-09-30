import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { supabase } from '../lib/supabase';

type AdminRole = 'full_admin' | 'cemetery_admin';

export default function AdminSignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<AdminRole>('cemetery_admin');
  const [saving, setSaving] = useState(false);

  async function submit() {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password || !confirmPassword) {
      Alert.alert('Missing information', 'Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Password too short', 'Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match.');
      return;
    }

    try {
      setSaving(true);

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            admin_signup: true,
            admin_role: role,
          },
        },
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error('Unable to create the account.');
      }

      // A database trigger creates the pending admin row from the sign-up metadata.
      // This also works when Supabase requires email confirmation and returns no session.

      Alert.alert(
        'Request submitted',
        role === 'cemetery_admin'
          ? 'Your Cemetery Admin request is pending approval by a Full Access Admin.'
          : 'Your Full Access Admin request is pending approval by a Full Access Admin.',
        [{ text: 'OK', onPress: () => router.replace('/') }],
      );
    } catch (error: any) {
      Alert.alert('Sign up failed', error?.message || 'Unable to create admin request.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#C62828', '#0B0B0B']} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.eyebrow}>SALEM YMA</Text>
        <Text style={styles.title}>Admin Sign Up</Text>
        <Text style={styles.subtitle}>Request administrator access</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Approval required</Text>
          <Text style={styles.noticeText}>
            Sign-up does not give immediate Admin Panel access. A Full Access Admin must approve the request.
          </Text>
        </View>

        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="admin@example.com"
          placeholderTextColor="#999"
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Minimum 6 characters"
          placeholderTextColor="#999"
          style={styles.input}
          secureTextEntry
        />

        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Re-enter password"
          placeholderTextColor="#999"
          style={styles.input}
          secureTextEntry
        />

        <Text style={styles.label}>Admin Type</Text>
        <View style={styles.roleRow}>
          <Pressable
            onPress={() => setRole('cemetery_admin')}
            style={[styles.roleCard, role === 'cemetery_admin' && styles.roleCardActive]}
          >
            <Text style={styles.roleIcon}>🪦</Text>
            <Text style={[styles.roleTitle, role === 'cemetery_admin' && styles.roleTitleActive]}>Cemetery Admin</Text>
            <Text style={styles.roleText}>Thlanmual / Cemetery only</Text>
            <Text style={styles.roleLimit}>Maximum 3</Text>
          </Pressable>

          <Pressable
            onPress={() => setRole('full_admin')}
            style={[styles.roleCard, role === 'full_admin' && styles.roleCardActive]}
          >
            <Text style={styles.roleIcon}>👑</Text>
            <Text style={[styles.roleTitle, role === 'full_admin' && styles.roleTitleActive]}>Full Access</Text>
            <Text style={styles.roleText}>All Admin Panel sections</Text>
            <Text style={styles.roleLimit}>Maximum 5</Text>
          </Pressable>
        </View>

        <Pressable onPress={submit} disabled={saving} style={styles.primaryButton}>
          {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryText}>SUBMIT ADMIN REQUEST</Text>}
        </Pressable>

        <Pressable onPress={() => router.replace('/login')} style={styles.loginButton}>
          <Text style={styles.loginText}>Back to Login</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { paddingTop: 25, paddingHorizontal: 20, paddingBottom: 25 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  backText: { color: '#FFF', fontSize: 34, fontWeight: '300', lineHeight: 36 },
  eyebrow: { color: '#FFDADA', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  title: { color: '#FFF', fontSize: 28, fontWeight: '900', marginTop: 3 },
  subtitle: { color: '#E6E6E6', fontSize: 12, marginTop: 5 },
  content: { padding: 18, paddingBottom: 45 },
  notice: { backgroundColor: '#FFF4F4', borderWidth: 1, borderColor: '#F0CACA', borderRadius: 16, padding: 15, marginBottom: 20 },
  noticeTitle: { color: '#8E1B1B', fontSize: 13, fontWeight: '900' },
  noticeText: { color: '#666', fontSize: 12, lineHeight: 18, marginTop: 5 },
  label: { color: '#222', fontSize: 11, fontWeight: '900', marginBottom: 7, marginTop: 12 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 13, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: '#151515' },
  roleRow: { flexDirection: 'row', gap: 10 },
  roleCard: { flex: 1, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 16, padding: 13, minHeight: 155 },
  roleCardActive: { borderColor: '#C62828', borderWidth: 2 },
  roleIcon: { fontSize: 24 },
  roleTitle: { color: '#222', fontSize: 13, fontWeight: '900', marginTop: 8 },
  roleTitleActive: { color: '#C62828' },
  roleText: { color: '#777', fontSize: 10, lineHeight: 15, marginTop: 5 },
  roleLimit: { color: '#999', fontSize: 9, fontWeight: '800', marginTop: 9 },
  primaryButton: { backgroundColor: '#C62828', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 24 },
  primaryText: { color: '#FFF', fontSize: 12, fontWeight: '900', letterSpacing: 0.6 },
  loginButton: { alignItems: 'center', paddingVertical: 16 },
  loginText: { color: '#C62828', fontSize: 12, fontWeight: '800' },
});
