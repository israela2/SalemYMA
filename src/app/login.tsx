import {
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';

import { supabase } from '../lib/supabase';

const GUEST_KEY = 'salem_yma_guest_mode';

const sections = [
  'Section - I',
  'Section - II',
  'Section - III',
];

export default function LoginScreen() {
  const [isRegister, setIsRegister] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [section, setSection] = useState('');

  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function removeGuestMode() {
    try {
      if (
        Platform.OS === 'web' &&
        typeof window !== 'undefined' &&
        typeof window.localStorage !== 'undefined'
      ) {
        window.localStorage.removeItem(GUEST_KEY);
      } else {
        await AsyncStorage.removeItem(GUEST_KEY);
      }
    } catch (error) {
      console.log(
        'Guest mode remove error:',
        error,
      );
    }
  }

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

    if (isRegister && !section) {
      setMessage('Section thlang rawh.');
      return;
    }

    setLoading(true);
    setMessage('');

    // Normal Member Login/Register removes Guest Mode.
    await removeGuestMode();

    if (isRegister) {
      const cleanEmail =
        email.trim().toLowerCase();

      const cleanName =
        fullName.trim();

      const cleanPhone =
        phone.trim();

      const { data, error } =
        await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: cleanName,
              phone: cleanPhone,
              section,
            },
          },
        });

      if (error) {
        setLoading(false);
        setMessage(error.message);
        return;
      }

      const userId =
        data.user?.id;

      if (!userId) {
        setLoading(false);

        setMessage(
          'Account siam zo, mahse user ID lak theih lo.',
        );

        return;
      }

      const { error: memberError } =
        await supabase
          .from('members')
          .insert({
            user_id: userId,
            full_name: cleanName,
            phone: cleanPhone,
            email: cleanEmail,
            section: section,
            branch_name:
              'Salem YMA Branch',
            status: 'Active',
          });

      setLoading(false);

      if (memberError) {
        console.log(
          'Member creation error:',
          memberError.message,
        );

        setMessage(
          'Account siam zo, mahse member information save-ah harsatna a awm.',
        );

        return;
      }

      if (data.session) {
        router.replace('/');
        return;
      }

      setMessage(
        'Account siam zo. Email verify ngai a nih chuan email check rawh.',
      );

      return;
    }

    const { error } =
      await supabase.auth.signInWithPassword({
        email:
          email.trim().toLowerCase(),
        password,
      });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.replace('/');
  }

  // --------------------------------------------------
  // WEBSITE ONLY — LOGIN AS GUEST
  // --------------------------------------------------

  async function loginAsGuest() {
  if (Platform.OS !== 'web') {
    return;
  }

  if (guestLoading) {
    return;
  }

  setGuestLoading(true);
  setMessage('');

  try {
    if (
      typeof window !== 'undefined' &&
      typeof window.localStorage !== 'undefined'
    ) {
      window.localStorage.setItem(
        GUEST_KEY,
        'true',
      );

      // Make sure the browser has saved the guest flag
      // before navigating to the website home page.
      await new Promise((resolve) =>
        setTimeout(resolve, 50),
      );
    }

    router.replace('/');
  } catch (error) {
    console.log(
      'Guest login error:',
      error,
    );

    setGuestLoading(false);

    setMessage(
      'Guest login-ah harsatna a awm. Tih leh rawh.',
    );
  }
}


  function openAdminSignup() {
    setMessage('');

    router.push('/admin-signup');
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* =========================
            HEADER
        ========================= */}

        <LinearGradient
          colors={[
            '#D32F2F',
            '#8E1B1B',
            '#0B0B0B',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Image
            source={require('../../assets/images/yma-logo.png')}
            style={styles.backgroundLogo}
            resizeMode="contain"
          />

          <View style={styles.heroContent}>
            <Text style={styles.brand}>
              YMA SALEM BRANCH
            </Text>

            <Text style={styles.heroSubtitle}>
              Young Mizo Association
            </Text>

            <View style={styles.divider} />

            <Text style={styles.heroMessage}>
              {isRegister
                ? 'Join the Salem YMA community'
                : 'Welcome back to Salem YMA'}
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
                ? 'Create your Salem YMA member account'
                : 'Login to access your Salem YMA account'}
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
                  onChangeText={
                    setFullName
                  }
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

              {/* SECTION */}

              <View style={styles.field}>
                <Text style={styles.label}>
                  SECTION
                </Text>

                <View
                  style={
                    styles.sectionOptions
                  }
                >
                  {sections.map(
                    (item) => {
                      const selected =
                        section === item;

                      return (
                        <Pressable
                          key={item}
                          onPress={() => {
                            setSection(
                              item,
                            );

                            setMessage(
                              '',
                            );
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
                                style={
                                  styles.radioInner
                                }
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
                    },
                  )}
                </View>
              </View>
            </>
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

            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#999999"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
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
              pressed &&
                styles.buttonPressed,
            ]}
          >
            <LinearGradient
              colors={[
                '#D32F2F',
                '#8E1B1B',
                '#111111',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginButton}
            >
              <Text
                style={
                  styles.loginButtonText
                }
              >
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
            <Text
              style={styles.switchLabel}
            >
              {isRegister
                ? 'Already have an account?'
                : "Don't have an account?"}
            </Text>

            <Pressable
              onPress={() => {
                setIsRegister(
                  !isRegister,
                );

                setMessage('');
              }}
            >
              <Text
                style={styles.switchText}
              >
                {isRegister
                  ? ' Login'
                  : ' Register'}
              </Text>
            </Pressable>
          </View>

          {/* =========================
              WEBSITE ONLY — GUEST LOGIN
          ========================= */}

          {Platform.OS === 'web' && (
            <View
              style={
                styles.guestLoginArea
              }
            >
              <View
                style={
                  styles.guestDividerRow
                }
              >
                <View
                  style={
                    styles.guestDivider
                  }
                />

                <Text
                  style={
                    styles.guestOrText
                  }
                >
                  WEBSITE
                </Text>

                <View
                  style={
                    styles.guestDivider
                  }
                />
              </View>

              <Pressable
                onPress={loginAsGuest}
                disabled={guestLoading}
                style={({
                  pressed,
                }) => [
                  styles.guestLoginButton,
                  pressed &&
                    styles.guestLoginPressed,
                  guestLoading &&
                    styles.guestLoginDisabled,
                ]}
              >
                <View
                  style={
                    styles.guestIconBox
                  }
                >
                  <Text
                    style={
                      styles.guestLoginIcon
                    }
                  >
                    👤
                  </Text>
                </View>

                <View
                  style={
                    styles.guestLoginContent
                  }
                >
                  <Text
                    style={
                      styles.guestLoginTitle
                    }
                  >
                    {guestLoading
                      ? 'PLEASE WAIT...'
                      : 'Login as Guest'}
                  </Text>

                  <Text
                    style={
                      styles.guestLoginSubtitle
                    }
                  >
                    Browse the Salem YMA website
                  </Text>
                </View>

                <Text
                  style={
                    styles.guestLoginArrow
                  }
                >
                  ›
                </Text>
              </Pressable>
            </View>
          )}

          {/* =========================
              ADMIN SIGN UP
          ========================= */}

          <View
            style={
              styles.adminSignupArea
            }
          >
            <View
              style={
                styles.adminDividerRow
              }
            >
              <View
                style={
                  styles.adminDivider
                }
              />

              <Text
                style={styles.adminOrText}
              >
                ADMIN
              </Text>

              <View
                style={
                  styles.adminDivider
                }
              />
            </View>

            <Pressable
              onPress={openAdminSignup}
              style={({ pressed }) => [
                styles.adminSignupButton,
                pressed &&
                  styles.adminSignupPressed,
              ]}
            >
              <View
                style={
                  styles.adminIconBox
                }
              >
                <Text
                  style={
                    styles.adminSignupIcon
                  }
                >
                  🔐
                </Text>
              </View>

              <View
                style={
                  styles.adminSignupContent
                }
              >
                <Text
                  style={
                    styles.adminSignupTitle
                  }
                >
                  Admin Sign Up
                </Text>

                <Text
                  style={
                    styles.adminSignupSubtitle
                  }
                >
                  Request Full Access or Cemetery Admin
                </Text>
              </View>

              <Text
                style={
                  styles.adminSignupArrow
                }
              >
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
            YMA SALEM BRANCH
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
            YMA SALEM BRANCH Mobile Application
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
      WEBSITE GUEST LOGIN
  ========================= */

  guestLoginArea: {
    marginTop: 25,
  },

  guestDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  guestDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5E5',
  },

  guestOrText: {
    marginHorizontal: 10,
    fontSize: 8,
    fontWeight: '900',
    color: '#999999',
    letterSpacing: 1.2,
  },

  guestLoginButton: {
    minHeight: 68,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 14,
    backgroundColor: '#FAFAFA',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
  },

  guestLoginPressed: {
    opacity: 0.75,
    backgroundColor: '#F2F2F2',
  },

  guestLoginDisabled: {
    opacity: 0.55,
  },

  guestIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FBEAEA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  guestLoginIcon: {
    fontSize: 18,
  },

  guestLoginContent: {
    flex: 1,
  },

  guestLoginTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#222222',
  },

  guestLoginSubtitle: {
    fontSize: 9,
    color: '#888888',
    marginTop: 4,
    lineHeight: 13,
  },

  guestLoginArrow: {
    fontSize: 26,
    fontWeight: '300',
    color: '#C62828',
    marginLeft: 8,
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
});