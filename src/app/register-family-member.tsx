import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
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

import AppBackButton from '../components/AppBackButton';
import { supabase } from '../lib/supabase';

const sections = ['Section I', 'Section II', 'Section III'];
const relationships = ['Pa', 'Nu', 'Unau', 'Unu', 'Chhungte dang'];

export default function RegisterFamilyMemberScreen() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [section, setSection] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [relationship, setRelationship] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingMember, setLoadingMember] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Member account sign in a ni lo.');
        const { data, error } = await supabase
          .from('members')
          .select('house_number')
          .eq('user_id', user.id)
          .maybeSingle();
        if (error) throw error;
        if (active) setHouseNumber(data?.house_number || '');
      } catch (error: any) {
        if (active) Alert.alert('House Number', error?.message || 'I house number hmu theih lo.');
      } finally {
        if (active) setLoadingMember(false);
      }
    })();
    return () => { active = false; };
  }, []);

  async function submit() {
    const cleanName = fullName.trim();
    const cleanPhone = phone.trim();

    if (!cleanName || !gender || !section || !houseNumber || !relationship) {
      Alert.alert('Missing information', 'Name, gender, section, house number leh relationship te fill/select rawh.');
      return;
    }

    try {
      setSaving(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Member account sign in a ni lo.');

      const { error } = await supabase.from('members').insert({
        user_id: null,
        registered_by_user_id: user.id,
        full_name: cleanName,
        phone: cleanPhone || null,
        gender,
        email: null,
        section,
        house_number: houseNumber,
        branch_name: 'YMA Salem Branch',
        status: 'Active',
        registration_type: 'family_member',
        relationship,
      });

      if (error) throw error;

      Alert.alert(
        'Registered successfully',
        `${cleanName} chu YMA member record-ah register tawh a ni. Member Statistics-ah pawh a tel ang.`,
        [{ text: 'OK', onPress: () => router.replace('/profile') }],
      );
    } catch (error: any) {
      Alert.alert('Registration failed', error?.message || 'Family member register theih lo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#C62828', '#8E1B1B', '#0B0B0B']} style={styles.header}>
          <AppBackButton onPress={() => router.replace('/profile')} />
          <Text style={styles.eyebrow}>YMA SALEM BRANCH</Text>
          <Text style={styles.title}>Register Family Member</Text>
          <Text style={styles.subtitle}>In chhungte member record siam ve rawh</Text>
        </LinearGradient>

        <View style={styles.card}>
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Member-in member register theih</Text>
            <Text style={styles.noticeText}>
              I member account hmangin in chhungte, nu leh pa te register ve theih a ni. Account thar siam a ngai lo; member record chauh a siam ang.
            </Text>
          </View>

          <Text style={styles.label}>FULL NAME *</Text>
          <TextInput value={fullName} onChangeText={setFullName} placeholder="Family member full name" placeholderTextColor="#999" style={styles.input} autoCapitalize="words" />

          <Text style={styles.label}>RELATIONSHIP *</Text>
          <View style={styles.optionRow}>
            {relationships.map((item) => (
              <Pressable key={item} onPress={() => setRelationship(item)} style={[styles.option, relationship === item && styles.optionActive]}>
                <Text style={[styles.optionText, relationship === item && styles.optionTextActive]}>{item}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>PHONE NUMBER</Text>
          <TextInput value={phone} onChangeText={setPhone} placeholder="Phone number (optional)" placeholderTextColor="#999" style={styles.input} keyboardType="phone-pad" />

          <Text style={styles.label}>MIPA / HMEICHHIA *</Text>
          <View style={styles.optionRow}>
            {['Mipa', 'Hmeichhia'].map((item) => (
              <Pressable key={item} onPress={() => setGender(item)} style={[styles.option, gender === item && styles.optionActive]}>
                <Text style={[styles.optionText, gender === item && styles.optionTextActive]}>{item}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>SECTION *</Text>
          <View style={styles.optionRow}>
            {sections.map((item) => (
              <Pressable key={item} onPress={() => setSection(item)} style={[styles.option, section === item && styles.optionActive]}>
                <Text style={[styles.optionText, section === item && styles.optionTextActive]}>{item}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>HOUSE NUMBER</Text>
          <View style={[styles.input, styles.lockedHouse]}>
            <View style={styles.houseInfo}>
              <Text style={houseNumber ? styles.selectValue : styles.placeholder}>
                {loadingMember ? 'Loading your house number…' : (houseNumber || 'House number not assigned')}
              </Text>
              <Text style={styles.lockIcon}>🔒</Text>
            </View>
            <Text style={styles.houseHint}>In member account house number nen automatic-in inzawm</Text>
          </View>

          <Pressable onPress={submit} disabled={saving} style={styles.primaryButton}>
            {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryText}>REGISTER FAMILY MEMBER</Text>}
          </Pressable>
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { paddingBottom: 35 },
  header: { paddingTop: 25, paddingHorizontal: 20, paddingBottom: 24 },
  eyebrow: { color: '#FFDADA', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  title: { color: '#FFF', fontSize: 27, fontWeight: '900', marginTop: 3 },
  subtitle: { color: '#E6E6E6', fontSize: 12, marginTop: 5 },
  card: { margin: 16, backgroundColor: '#FFF', borderRadius: 20, padding: 17, borderWidth: 1, borderColor: '#ECECEC' },
  notice: { backgroundColor: '#FFF4F4', borderColor: '#F0CACA', borderWidth: 1, borderRadius: 15, padding: 13, marginBottom: 6 },
  noticeTitle: { color: '#8E1B1B', fontSize: 13, fontWeight: '900' },
  noticeText: { color: '#666', fontSize: 11, lineHeight: 17, marginTop: 4 },
  label: { color: '#222', fontSize: 10, fontWeight: '900', marginTop: 15, marginBottom: 7 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E1E1E1', borderRadius: 13, paddingHorizontal: 14, paddingVertical: 13, color: '#171717', fontSize: 14 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E2E2', borderRadius: 12, paddingVertical: 11, paddingHorizontal: 13 },
  optionActive: { backgroundColor: '#FFF0F0', borderColor: '#C62828', borderWidth: 2 },
  optionText: { color: '#666', fontSize: 11, fontWeight: '800' },
  optionTextActive: { color: '#C62828' },
  selectValue: { color: '#171717', fontSize: 14, fontWeight: '800' },
  placeholder: { color: '#999', fontSize: 14 },
  lockedHouse: { backgroundColor: '#F8F8F8', borderColor: '#D7D7D7' },
  houseInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lockIcon: { fontSize: 14 },
  houseHint: { color: '#8A8A8A', fontSize: 10, marginTop: 4 },
  primaryButton: { backgroundColor: '#C62828', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 24 },
  primaryText: { color: '#FFF', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
});
