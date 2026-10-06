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
    Modal,
} from 'react-native';

import { supabase } from '../lib/supabase';

import AppBackButton from '../components/AppBackButton';
type AdminRole = 'full_admin' | 'cemetery_admin';

export default function AdminSignUpScreen() {
  const [fullName, setFullName] = useState('');
  const [section, setSection] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<AdminRole>('cemetery_admin');
  const [saving, setSaving] = useState(false);
  const [housePickerOpen, setHousePickerOpen] = useState(false);
  const [houseSearch, setHouseSearch] = useState('');
  const [houseBlock, setHouseBlock] = useState('A');

  const sections = ['Section I', 'Section II', 'Section III'];

  // House numbers are selected from the approved ward numbering scheme.
  // House-number tabs: A1–A200, B1–B200, C1–C300.
  const houseBlocks = [
    { key: 'A', max: 200 },
    { key: 'B', max: 200 },
    { key: 'C', max: 300 },
  ];
  const selectedBlock = houseBlocks.find((b) => b.key === houseBlock) || houseBlocks[0];
  const houseOptions = Array.from({ length: selectedBlock.max }, (_, i) => `${selectedBlock.key}${i + 1}`)
    .filter((item) => !houseSearch.trim() || item.toLowerCase().includes(houseSearch.trim().toLowerCase()));

  function chooseHouseNumber(value: string) {
    setHouseNumber(value);
    setHousePickerOpen(false);
    setHouseSearch('');
  }

  async function submit() {
    const cleanName = fullName.trim();
    const cleanSection = section.trim();
    const cleanHouseNumber = houseNumber.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanSection || !cleanHouseNumber || !cleanEmail || !password || !confirmPassword) {
      Alert.alert('Missing information', 'Please fill in Name, Section, House Number, Email and Password fields.');
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
            full_name: cleanName,
            name: cleanName,
            section: cleanSection,
            house_number: cleanHouseNumber,
          },
        },
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error('Unable to create the account.');
      }

      // Keep every approved admin in the same Member directory as normal members.
      // The signup metadata is also retained for the admin/profile flow.
      // This insert follows the same member-registration pattern used by normal sign-up.
      const { error: memberError } = await supabase.from('members').insert({
        user_id: data.user.id,
        full_name: cleanName,
        email: cleanEmail,
        section: cleanSection,
        house_number: cleanHouseNumber,
        branch_name: 'YMA Salem Branch',
        status: 'Active',
      });

      if (memberError) {
        console.log('Admin member creation error:', memberError.message);
        // Do not cancel the admin request: the admins trigger/request is already created.
      }

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
        <AppBackButton />
        <Text style={styles.eyebrow}>YMA Salem Branch</Text>
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

        <Text style={styles.label}>FULL NAME</Text>
        <TextInput
          value={fullName}
          onChangeText={setFullName}
          placeholder="Enter full name"
          placeholderTextColor="#999"
          style={styles.input}
          autoCapitalize="words"
        />

        <Text style={styles.label}>SECTION</Text>
        <View style={styles.sectionRow}>
          {sections.map((item) => {
            const selected = section === item;
            return (
              <Pressable
                key={item}
                onPress={() => setSection(item)}
                style={[styles.sectionOption, selected && styles.sectionOptionActive]}
              >
                <Text style={[styles.sectionOptionText, selected && styles.sectionOptionTextActive]}>
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>HOUSE NUMBER</Text>
        <Pressable
          onPress={() => setHousePickerOpen(true)}
          style={[styles.input, styles.selectInput, !houseNumber && styles.selectPlaceholder]}
        >
          <Text style={houseNumber ? styles.selectValue : styles.selectPlaceholderText}>
            {houseNumber || 'Select house number'}
          </Text>
          <Text style={styles.selectChevron}>⌄</Text>
        </Pressable>

        <Modal
          visible={housePickerOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setHousePickerOpen(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.houseModal}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Select House Number</Text>
                  <Text style={styles.modalSubtitle}>Choose your registered house number</Text>
                </View>
                <Pressable onPress={() => setHousePickerOpen(false)} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>×</Text>
                </Pressable>
              </View>

              <TextInput
                value={houseSearch}
                onChangeText={setHouseSearch}
                placeholder="Search e.g. A25"
                placeholderTextColor="#999"
                style={styles.searchInput}
                autoCapitalize="characters"
              />

              <View style={styles.blockRow}>
                {houseBlocks.map((block) => {
                  const active = houseBlock === block.key;
                  return (
                    <Pressable
                      key={block.key}
                      onPress={() => { setHouseBlock(block.key); setHouseSearch(''); }}
                      style={[styles.blockButton, active && styles.blockButtonActive]}
                    >
                      <Text style={[styles.blockButtonText, active && styles.blockButtonTextActive]}>{block.key}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.rangeText}>{selectedBlock.key}1 – {selectedBlock.key}{selectedBlock.max}</Text>

              <ScrollView style={styles.houseList} contentContainerStyle={styles.houseGrid} keyboardShouldPersistTaps="handled">
                {houseOptions.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => chooseHouseNumber(item)}
                    style={[styles.houseOption, houseNumber === item && styles.houseOptionActive]}
                  >
                    <Text style={[styles.houseOptionText, houseNumber === item && styles.houseOptionTextActive]}>
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

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
  selectInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectPlaceholder: { borderColor: '#E5E5E5' },
  selectValue: { color: '#151515', fontSize: 14, fontWeight: '700' },
  selectPlaceholderText: { color: '#999', fontSize: 14 },
  selectChevron: { color: '#777', fontSize: 22, lineHeight: 20, marginLeft: 8 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.48)', justifyContent: 'flex-end' },
  houseModal: { backgroundColor: '#F7F7F7', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18, height: '82%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  modalTitle: { color: '#171717', fontSize: 19, fontWeight: '900' },
  modalSubtitle: { color: '#777', fontSize: 11, marginTop: 3 },
  closeButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#EDEDED', alignItems: 'center', justifyContent: 'center' },
  closeButtonText: { color: '#333', fontSize: 26, lineHeight: 28, fontWeight: '300' },
  searchInput: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E3E3E3', borderRadius: 13, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#151515', marginBottom: 12 },
  blockRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  blockButton: { flex: 1, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E2E2', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  blockButtonActive: { backgroundColor: '#C62828', borderColor: '#C62828' },
  blockButtonText: { color: '#555', fontSize: 13, fontWeight: '900' },
  blockButtonTextActive: { color: '#FFF' },
  rangeText: { color: '#888', fontSize: 10, fontWeight: '800', marginBottom: 8 },
  houseList: { flex: 1 },
  houseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 20 },
  houseOption: { width: '18%', minWidth: 52, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  houseOptionActive: { backgroundColor: '#FFF0F0', borderColor: '#C62828', borderWidth: 2 },
  houseOptionText: { color: '#333', fontSize: 12, fontWeight: '800' },
  houseOptionTextActive: { color: '#C62828' },

  sectionRow: { flexDirection: 'row', gap: 8 },
  sectionOption: { flex: 1, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  sectionOptionActive: { borderColor: '#C62828', backgroundColor: '#FFF4F4', borderWidth: 2 },
  sectionOptionText: { color: '#666', fontSize: 11, fontWeight: '800' },
  sectionOptionTextActive: { color: '#C62828' },
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
