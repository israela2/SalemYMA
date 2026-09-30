import { useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { supabase } from '../lib/supabase';

const sections = [
  'Section - I',
  'Section - II',
  'Section - III',
];

const statuses = [
  'Active',
  'Inactive',
];

export default function AddMemberScreen() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [section, setSection] = useState('');
  const [branch, setBranch] = useState('Salem YMA Branch');
  const [status, setStatus] = useState('Active');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleAddMember() {
    setMessage('');

    const cleanName = fullName.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanBranch = branch.trim();

    if (!cleanName) {
      setMessage('Member name dah hmasa rawh.');
      return;
    }

    if (!cleanPhone) {
      setMessage('Phone number dah rawh.');
      return;
    }

    if (!section) {
      setMessage('Section thlang rawh.');
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('members')
      .insert({
        full_name: cleanName,
        phone: cleanPhone,
        email: cleanEmail || null,
        section,
        branch_name: cleanBranch || 'Salem YMA Branch',
        status,
      });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);

    router.replace('/admin');
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={[
            '#D32F2F',
            '#8E1B1B',
            '#0B0B0B',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Pressable
            onPress={() => router.back()}
            style={styles.backCircle}
          >
            <Text style={styles.backIcon}>
              ‹
            </Text>
          </Pressable>

          <Text style={styles.eyebrow}>
            SALEM YMA
          </Text>

          <Text style={styles.headerTitle}>
            Add New Member
          </Text>

          <Text style={styles.headerSubtitle}>
            Create member record
          </Text>
        </LinearGradient>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            Member Information
          </Text>

          <Text style={styles.formSubtitle}>
            Member details hi database-ah dah rawh.
          </Text>

          <Text style={styles.label}>
            FULL NAME *
          </Text>

          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Member full name"
            placeholderTextColor="#999999"
            style={styles.input}
            autoCapitalize="words"
          />

          <Text style={styles.label}>
            PHONE NUMBER *
          </Text>

          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone number"
            placeholderTextColor="#999999"
            style={styles.input}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>
            EMAIL
          </Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email address"
            placeholderTextColor="#999999"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>
            SECTION *
          </Text>

          <View style={styles.optionRow}>
            {sections.map((item) => {
              const selected = section === item;

              return (
                <Pressable
                  key={item}
                  onPress={() => setSection(item)}
                  style={[
                    styles.optionButton,
                    selected &&
                      styles.optionButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selected &&
                        styles.optionTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>
            BRANCH
          </Text>

          <TextInput
            value={branch}
            onChangeText={setBranch}
            placeholder="Branch name"
            placeholderTextColor="#999999"
            style={styles.input}
          />

          <Text style={styles.label}>
            STATUS
          </Text>

          <View style={styles.statusRow}>
            {statuses.map((item) => {
              const selected = status === item;

              return (
                <Pressable
                  key={item}
                  onPress={() => setStatus(item)}
                  style={[
                    styles.statusButton,
                    selected &&
                      styles.statusButtonSelected,
                    item === 'Inactive' &&
                      selected &&
                      styles.statusButtonInactive,
                  ]}
                >
                  <View
                    style={[
                      styles.radio,
                      selected &&
                        styles.radioSelected,
                    ]}
                  >
                    {selected && (
                      <View style={styles.radioInner} />
                    )}
                  </View>

                  <Text
                    style={[
                      styles.statusButtonText,
                      selected &&
                        styles.statusButtonTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {message ? (
            <View style={styles.messageBox}>
              <Text style={styles.messageText}>
                {message}
              </Text>
            </View>
          ) : null}

          <Pressable
            onPress={handleAddMember}
            disabled={loading}
            style={({ pressed }) => [
              styles.saveButton,
              pressed && !loading && styles.buttonPressed,
            ]}
          >
            <LinearGradient
              colors={[
                '#D32F2F',
                '#8E1B1B',
                '#111111',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.saveGradient}
            >
              {loading ? (
                <ActivityIndicator
                  color="#FFFFFF"
                  size="small"
                />
              ) : (
                <Text style={styles.saveText}>
                  ADD MEMBER
                </Text>
              )}
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            disabled={loading}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelText}>
              CANCEL
            </Text>
          </Pressable>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            Admin Note
          </Text>

          <Text style={styles.infoText}>
            Member add zawh chuan Admin Panel-ah
            member thar chu a lang nghal ang.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerTitle}>
            SALEM YMA
          </Text>

          <Text style={styles.footerText}>
            Member Management System
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  content: {
    paddingBottom: 40,
  },

  header: {
    paddingTop: 54,
    paddingBottom: 32,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  backCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  backIcon: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '300',
    lineHeight: 35,
  },

  eyebrow: {
    color: '#FFD6D6',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 8,
  },

  headerSubtitle: {
    color: '#F0F0F0',
    fontSize: 13,
    marginTop: 6,
  },

  formCard: {
    marginHorizontal: 18,
    marginTop: -18,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    elevation: 4,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },

  formTitle: {
    color: '#111111',
    fontSize: 21,
    fontWeight: '900',
  },

  formSubtitle: {
    color: '#888888',
    fontSize: 11,
    marginTop: 5,
    marginBottom: 20,
  },

  label: {
    color: '#777777',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 15,
    marginBottom: 7,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 13,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 13,
    color: '#222222',
    fontSize: 13,
  },

  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  optionButton: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 7,
    marginBottom: 7,
  },

  optionButtonSelected: {
    backgroundColor: '#111111',
    borderColor: '#111111',
  },

  optionText: {
    color: '#666666',
    fontSize: 10,
    fontWeight: '800',
  },

  optionTextSelected: {
    color: '#FFFFFF',
  },

  statusRow: {
    flexDirection: 'row',
  },

  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 10,
    marginRight: 8,
  },

  statusButtonSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#EAF6EC',
  },

  statusButtonInactive: {
    borderColor: '#C62828',
    backgroundColor: '#FBEAEA',
  },

  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#AAAAAA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },

  radioSelected: {
    borderColor: '#2E7D32',
  },

  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2E7D32',
  },

  statusButtonText: {
    color: '#666666',
    fontSize: 10,
    fontWeight: '800',
  },

  statusButtonTextSelected: {
    color: '#2E7D32',
  },

  messageBox: {
    backgroundColor: '#FBEAEA',
    borderRadius: 12,
    padding: 12,
    marginTop: 18,
  },

  messageText: {
    color: '#C62828',
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '700',
  },

  saveButton: {
    marginTop: 22,
    borderRadius: 15,
    overflow: 'hidden',
  },

  saveGradient: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },

  saveText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },

  buttonPressed: {
    opacity: 0.75,
  },

  cancelButton: {
    height: 48,
    marginTop: 9,
    borderRadius: 14,
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelText: {
    color: '#555555',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  infoCard: {
    marginHorizontal: 18,
    marginTop: 18,
    backgroundColor: '#111111',
    borderRadius: 20,
    padding: 20,
  },

  infoTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

  infoText: {
    color: '#AAAAAA',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 7,
  },

  footer: {
    alignItems: 'center',
    marginTop: 30,
  },

  footerTitle: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  footerText: {
    color: '#999999',
    fontSize: 10,
    marginTop: 4,
  },
});