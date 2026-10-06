import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';

import { supabase } from '../lib/supabase';

const sections = [
  'Section - I',
  'Section - II',
  'Section - III',
];

export default function LoginScreen() {
  const [isRegister, setIsRegister] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [section, setSection] = useState('');
  const [houseNumber, setHouseNumber] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleAuth() {
    if (!email.trim() || !password) {
      setMessage('Email leh password dah rawh.');
      return;
    }

    if (isRegister && !fullName.trim()) {
      setMessage('Full name dah rawh.');
      return;
    }

    if (isRegister && !phone.trim()) {
      setMessage('Phone number dah rawh.');
      return;
    }

    if (isRegister && phone.trim().length < 8) {
      setMessage('Phone number dik tak dah rawh.');
      return;
    }

    if (isRegister && !gender) {
      setMessage('Mipa/Hmeichhia thlang rawh.');
      return;
    }

    if (isRegister && !section) {
      setMessage('Section thlang rawh.');
      return;
    }

    if (isRegister && !houseNumber.trim()) {
      setMessage('House Number dah rawh.');
      return;
    }

    setLoading(true);
    setMessage('');

    if (isRegister) {
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = fullName.trim();
      const cleanPhone = phone.trim();
      const cleanHouseNumber = houseNumber.trim();

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            phone: cleanPhone,
            gender,
            section,
            house_number: cleanHouseNumber,
          },
        },
      });

      if (error) {
        setLoading(false);
        setMessage(error.message);
        return;
      }

      const userId = data.user?.id;

      if (!userId) {
        setLoading(false);
        setMessage(
          'Account siam zo, mahse user ID lak theih lo.'
        );
        return;
      }

      const { error: memberError } = await supabase
        .from('members')
        .insert({
          user_id: userId,
          full_name: cleanName,
          phone: cleanPhone,
          gender,
          email: cleanEmail,
          section: section,
          house_number: cleanHouseNumber,
          branch_name: 'YMA Salem Branch',
          status: 'Active',
        });

      setLoading(false);

      if (memberError) {
        console.log(
          'Member creation error:',
          memberError.message
        );

        setMessage(
          'Account siam zo, mahse member information save-ah harsatna a awm.'
        );

        return;
      }

      if (data.session) {
        router.replace('/');
        return;
      }

      setMessage(
        'Account siam zo. Email verify ngai a nih chuan email check rawh.'
      );

      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.replace('/');
  }

  function openAdminSignup() {
    setMessage('');

    router.push('/admin-signup');
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* =========================
            HEADER
        ========================= */}

        <LinearGradient
          colors={['#D32F2F', '#8E1B1B', '#0B0B0B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Image
            source={require('../assets/yma-logo.png')}
            style={styles.backgroundLogo}
            resizeMode="contain"
          />

          <View style={styles.heroContent}>
            <Text style={styles.brand}>
              YMA Salem Branch
            </Text>

            <Text style={styles.heroSubtitle}>
              Young Mizo Association
            </Text>

            <View style={styles.divider} />

            <Text style={styles.heroMessage}>
              {isRegister
                ? 'Join the YMA Salem Branch community'
                : 'Welcome back to YMA Salem Branch'}
            </Text>
          </View>
        </LinearGradient>

        {/* =========================
            FORM
        ========================= */}

        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>
              {isRegister
                ? 'Create Account'
                : 'Member Login'}
            </Text>

            <Text style={styles.formSubtitle}>
              {isRegister
                ? 'Create your YMA Salem Branch member account'
                : 'Login to access your YMA Salem Branch account'}
            </Text>
          </View>

          {/* =========================
              MEMBER REGISTRATION
          ========================= */}

          {isRegister && (
            <>
              {/* FULL NAME */}

              <View style={styles.field}>
                <Text style={styles.label}>
                  FULL NAME
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="#999999"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>

              {/* PHONE */}

              <View style={styles.field}>
                <Text style={styles.label}>
                  PHONE NUMBER
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#999999"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>

              {/* GENDER */}

              <View style={styles.field}>
                <Text style={styles.label}>
                  MIPA / HMEICHHIA
                </Text>

                <View style={styles.sectionOptions}>
                  {['Mipa', 'Hmeichhia'].map((item) => {
                    const selected = gender === item;

                    return (
                      <Pressable
                        key={item}
                        onPress={() => {
                          setGender(item);
                          setMessage('');
                        }}
                        style={[
                          styles.sectionOption,
                          selected && styles.sectionOptionSelected,
                        ]}
                      >
                        <View
                          style={[
                            styles.radio,
                            selected && styles.radioSelected,
                          ]}
                        >
                          {selected && <View style={styles.radioInner} />}
                        </View>

                        <Text
                          style={[
                            styles.sectionOptionText,
                            selected && styles.sectionOptionTextSelected,
                          ]}
                        >
                          {item}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* SECTION */}

              <View style={styles.field}>
                <Text style={styles.label}>
                  SECTION
                </Text>

                <View style={styles.sectionOptions}>
                  {sections.map((item) => {
                    const selected = section === item;

                    return (
                      <Pressable
                        key={item}
                        onPress={() => {
                          setSection(item);
                          setMessage('');
                        }}
                        style={[
                          styles.sectionOption,
                          selected &&
                            styles.sectionOptionSelected,
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
                            <View
                              style={styles.radioInner}
                            />
                          )}
                        </View>

                        <Text
                          style={[
                            styles.sectionOptionText,
                            selected &&
                              styles.sectionOptionTextSelected,
                          ]}
                        >
                          {item}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </>
          )}

          {isRegister && (
            <View style={styles.field}>
              <Text style={styles.label}>HOUSE NUMBER</Text>
              <TextInput
                style={styles.input}
                placeholder="House No. 12"
                placeholderTextColor="#999999"
                value={houseNumber}
                onChangeText={setHouseNumber}
                autoCapitalize="words"
              />
            </View>
          )}

          {/* =========================
              EMAIL
          ========================= */}

          <View style={styles.field}>
            <Text style={styles.label}>
              EMAIL ADDRESS
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#999999"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* =========================
              PASSWORD
          ========================= */}

          <View style={styles.field}>
            <Text style={styles.label}>
              PASSWORD
            </Text>

            <View style={styles.passwordWrap}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Enter your password"
                placeholderTextColor="#999999"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Pressable
                onPress={() => setShowPassword((value) => !value)}
                style={styles.passwordToggle}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <Text style={styles.passwordToggleText}>
                  {showPassword ? 'HIDE' : 'SHOW'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* =========================
              MESSAGE
          ========================= */}

          {message ? (
            <View style={styles.messageBox}>
              <Text style={styles.messageText}>
                {message}
              </Text>
            </View>
          ) : null}

          {/* =========================
              LOGIN / REGISTER BUTTON
          ========================= */}

          <Pressable
            onPress={handleAuth}
            disabled={loading}
            style={({ pressed }) => [
              styles.buttonWrap,
              pressed && styles.buttonPressed,
            ]}
          >
            <LinearGradient
              colors={['#D32F2F', '#8E1B1B', '#111111']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginButton}
            >
              <Text style={styles.loginButtonText}>
                {loading
                  ? 'PLEASE WAIT...'
                  : isRegister
                  ? 'CREATE ACCOUNT'
                  : 'LOGIN'}
              </Text>
            </LinearGradient>
          </Pressable>

          {/* =========================
              MEMBER SWITCH
          ========================= */}

          <View style={styles.switchArea}>
            <Text style={styles.switchLabel}>
              {isRegister
                ? 'Already have an account?'
                : "Don't have an account?"}
            </Text>

            <Pressable
              onPress={() => {
                setIsRegister(!isRegister);
                setMessage('');
              }}
            >
              <Text style={styles.switchText}>
                {isRegister ? ' Login' : ' Register'}
              </Text>
            </Pressable>
          </View>

          {/* =========================
              ADMIN SIGN UP
          ========================= */}

          <View style={styles.adminSignupArea}>
            <View style={styles.adminDividerRow}>
              <View style={styles.adminDivider} />

              <Text style={styles.adminOrText}>
                ADMIN
              </Text>

              <View style={styles.adminDivider} />
            </View>

            <Pressable
              onPress={openAdminSignup}
              style={({ pressed }) => [
                styles.adminSignupButton,
                pressed &&
                  styles.adminSignupPressed,
              ]}
            >
              <View style={styles.adminIconBox}>
                <Text style={styles.adminSignupIcon}>
                  🔐
                </Text>
              </View>

              <View style={styles.adminSignupContent}>
                <Text style={styles.adminSignupTitle}>
                  Admin Sign Up
                </Text>

                <Text style={styles.adminSignupSubtitle}>
                  Request Full Access or Cemetery Admin
                </Text>
              </View>

              <Text style={styles.adminSignupArrow}>
                ›
              </Text>
            </Pressable>
          </View>
        </View>

        {/* =========================
            FOOTER
        ========================= */}

        <View style={styles.footer}>
          <Text style={styles.footerTitle}>
            YMA Salem Branch
          </Text>

          <Text style={styles.footerText}>
            Hun âwl hman ṭhat
          </Text>

          <Text style={styles.footerText}>
            Zo fâte hma-sâwnna ngaihtuah
          </Text>

          <Text style={styles.footerText}>
            Kristian nun dan ṭha ngaihsan
          </Text>

          <Text style={styles.footerSmall}>
            YMA Salem Branch Mobile Application
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 25,
  },

  /* =========================
      HERO
  ========================= */

  hero: {
    position: 'relative',
    overflow: 'hidden',
    paddingTop: 55,
    paddingBottom: 55,
    paddingHorizontal: 24,
    alignItems: 'center',
  },

  backgroundLogo: {
    position: 'absolute',
    width: 330,
    height: 330,
    opacity: 0.5,
    alignSelf: 'center',
    top: 18,
  },

  heroContent: {
    alignItems: 'center',
    zIndex: 2,
  },

  brand: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: 1.5,
    textAlign: 'center',
  },

  heroSubtitle: {
    color: '#F5F5F5',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 5,
    letterSpacing: 0.4,
  },

  divider: {
    width: 42,
    height: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    marginTop: 18,
    marginBottom: 14,
  },

  heroMessage: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },

  /* =========================
      FORM CARD
  ========================= */

  formCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 18,
    marginTop: -18,
    borderRadius: 20,
    padding: 22,

    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 6,
    },

    elevation: 7,
  },

  formHeader: {
    marginBottom: 22,
  },

  formTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111111',
  },

  formSubtitle: {
    fontSize: 11,
    color: '#777777',
    marginTop: 5,
    lineHeight: 16,
  },

  /* =========================
      INPUT
  ========================= */

  field: {
    marginBottom: 15,
  },

  label: {
    fontSize: 10,
    fontWeight: '900',
    color: '#555555',
    letterSpacing: 0.8,
    marginBottom: 7,
  },

  input: {
    height: 52,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 13,
    color: '#111111',
    borderWidth: 1,
    borderColor: '#E4E4E4',
  },

  /* =========================
      SECTION
  ========================= */

  sectionOptions: {
    marginTop: 1,
  },

  sectionOption: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E4E4',
    backgroundColor: '#F8F8F8',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 8,
  },

  sectionOptionSelected: {
    borderColor: '#C62828',
    backgroundColor: '#FBEAEA',
  },

  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#AAAAAA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  radioSelected: {
    borderColor: '#C62828',
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#C62828',
  },

  sectionOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555555',
  },

  sectionOptionTextSelected: {
    color: '#8E1B1B',
    fontWeight: '900',
  },

  /* =========================
      MESSAGE
  ========================= */

  messageBox: {
    backgroundColor: '#FBEAEA',
    borderLeftWidth: 3,
    borderLeftColor: '#C62828',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },

  messageText: {
    fontSize: 11,
    color: '#8E1B1B',
    lineHeight: 17,
  },

  /* =========================
      LOGIN BUTTON
  ========================= */

  buttonWrap: {
    borderRadius: 13,
    overflow: 'hidden',
    marginTop: 3,
  },

  buttonPressed: {
    opacity: 0.85,
  },

  loginButton: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  /* =========================
      MEMBER SWITCH
  ========================= */

  switchArea: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },

  switchLabel: {
    fontSize: 11,
    color: '#777777',
  },

  switchText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#C62828',
  },

  /* =========================
      ADMIN SIGN UP
  ========================= */

  adminSignupArea: {
    marginTop: 25,
  },

  adminDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  adminDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5E5',
  },

  adminOrText: {
    marginHorizontal: 10,
    fontSize: 8,
    fontWeight: '900',
    color: '#999999',
    letterSpacing: 1.2,
  },

  adminSignupButton: {
    minHeight: 68,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 14,
    backgroundColor: '#FAFAFA',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
  },

  adminSignupPressed: {
    opacity: 0.75,
    backgroundColor: '#F2F2F2',
  },

  adminIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FBEAEA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  adminSignupIcon: {
    fontSize: 18,
  },

  adminSignupContent: {
    flex: 1,
  },

  adminSignupTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#222222',
  },

  adminSignupSubtitle: {
    fontSize: 9,
    color: '#888888',
    marginTop: 4,
    lineHeight: 13,
  },

  adminSignupArrow: {
    fontSize: 26,
    fontWeight: '300',
    color: '#C62828',
    marginLeft: 8,
  },

  /* =========================
      FOOTER
  ========================= */

  footer: {
    alignItems: 'center',
    paddingTop: 28,
    paddingHorizontal: 20,
  },

  footerTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#111111',
    letterSpacing: 1,
  },

  footerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#777777',
    marginTop: 4,
  },

  footerSmall: {
    fontSize: 9,
    color: '#AAAAAA',
    marginTop: 8,
  },

  passwordWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 72,
  },
  passwordToggle: {
    position: 'absolute',
    right: 14,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  passwordToggleText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: '#D32F2F',
  },
});