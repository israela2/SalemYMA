import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';

export default function MoreScreen() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [showCemetery, setShowCemetery] = useState(false);

  useEffect(() => {
    checkLogin();
    supabase.from('app_feature_visibility').select('is_visible').eq('feature_key', 'cemetery').maybeSingle()
      .then(({ data }) => setShowCemetery(!!data?.is_visible));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);

      if (!session) {
        setIsAdmin(false);
      } else {
        checkAdmin(session.user.id);
        loadProfilePhoto(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function checkLogin() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    setLoggedIn(!!session);

    if (session) {
      await checkAdmin(session.user.id);
      await loadProfilePhoto(session.user.id);
    } else {
      setIsAdmin(false);
    }
  }


  async function loadProfilePhoto(userId: string) {
    const { data } = await supabase
      .from('members')
      .select('profile_photo')
      .eq('user_id', userId)
      .maybeSingle();
    const { data: { user } } = await supabase.auth.getUser();
    const metadataPhoto = user?.user_metadata?.profile_photo || user?.user_metadata?.avatar_url || null;
    const photo = data?.profile_photo || metadataPhoto || null;
    setProfilePhoto(photo);
  }

  async function checkAdmin(userId: string) {
    const { data, error } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      setIsAdmin(false);
      return;
    }

    setIsAdmin(!!data);
  }

  async function handleLogout() {
    setLoggingOut(true);

    const { error } = await supabase.auth.signOut();

    setLoggingOut(false);

    if (!error) {
      setIsAdmin(false);
      router.replace('/login');
    }
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <LinearGradient
        colors={['#D32F2F', '#8E1B1B', '#0B0B0B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.headerSmall}>
              YMA Salem Branch
            </Text>

            <Text style={styles.headerTitle}>
              More
            </Text>

            <Text style={styles.headerText}>
              Services, information & account
            </Text>
          </View>

          <View style={styles.headerMark}>
            <Image
              source={require('../assets/yma-logo.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          </View>
        </View>
      </LinearGradient>

      {/* YMA Salem Branch / ABOUT US CARD */}
      <Pressable
        style={({ pressed }) => [
          styles.profileCard,
          pressed && styles.profileCardPressed,
        ]}
        onPress={() => router.push('/about')}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/yma-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.profileTitle}>
            YMA Salem Branch
          </Text>

          <Text style={styles.profileText}>
            Young Mizo Association
          </Text>

          <View style={styles.memberBadge}>
            <Text style={styles.memberBadgeText}>
              SALEM BRANCH
            </Text>
          </View>
        </View>

        <View style={styles.profileArrowCircle}>
          <Text style={styles.profileArrow}>
            ›
          </Text>
        </View>
      </Pressable>

      {/* YMA Salem Branch */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionDot} />

        <Text style={styles.sectionTitle}>
          YMA Salem Branch
        </Text>
      </View>

      {/* Gallery */}
      <Pressable
        style={({ pressed }) => [
          styles.menuCard,
          pressed && styles.menuCardPressed,
        ]}
        onPress={() => router.push('/gallery')}
      >
        <View style={[styles.iconBox, styles.redBox]}>
          <Text style={styles.menuIcon}>
            🖼️
          </Text>
        </View>

        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>
            Gallery
          </Text>

          <Text style={styles.menuText}>
            Photos and memories of YMA Salem Branch
          </Text>
        </View>

        <Text style={styles.arrow}>
          ›
        </Text>
      </Pressable>

      {/* Events */}
      <Pressable
        style={({ pressed }) => [
          styles.menuCard,
          pressed && styles.menuCardPressed,
        ]}
        onPress={() => router.push('/events')}
      >
        <View style={[styles.iconBox, styles.blackBox]}>
          <Text style={styles.menuIcon}>
            📅
          </Text>
        </View>

        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>
            Events
          </Text>

          <Text style={styles.menuText}>
            Upcoming programmes and events
          </Text>
        </View>

        <Text style={styles.arrow}>
          ›
        </Text>
      </Pressable>

      {/* Cemetery / Thlanmual */}
      {showCemetery && <Pressable
        style={({ pressed }) => [
          styles.menuCard,
          styles.cemeteryCard,
          pressed && styles.menuCardPressed,
        ]}
        onPress={() => router.push('/cemetery')}
      >
        <LinearGradient
          colors={['#4A4A4A', '#111111']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cemeteryIconBox}
        >
          <Text style={styles.cemeteryIcon}>
            🪦
          </Text>
        </LinearGradient>

        <View style={styles.menuContent}>
          <View style={styles.titleWithTag}>
            <Text style={styles.menuTitle}>
              Thlanmual
            </Text>

            <View style={styles.cemeteryTag}>
              <Text style={styles.cemeteryTagText}>
                RECORDS
              </Text>
            </View>
          </View>

          <Text style={styles.menuText}>
            Salem Cemetery records leh chanchin tawi
          </Text>
        </View>

        <Text style={styles.arrow}>
          ›
        </Text>
      </Pressable>}

      {/* Notifications */}
      <Pressable
        style={({ pressed }) => [
          styles.menuCard,
          pressed && styles.menuCardPressed,
        ]}
        onPress={() => router.push('/notifications')}
      >
        <View style={[styles.iconBox, styles.grayBox]}>
          <Text style={styles.menuIcon}>
            🔔
          </Text>
        </View>

        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>
            Notifications
          </Text>

          <Text style={styles.menuText}>
            Important notices and latest updates
          </Text>
        </View>

        <View style={styles.notificationBadge}>
          <Text style={styles.notificationBadgeText}>
            NEW
          </Text>
        </View>

        <Text style={styles.arrow}>
          ›
        </Text>
      </Pressable>

      {/* Account */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionDot} />

        <Text style={styles.sectionTitle}>
          Account
        </Text>
      </View>

      {loggedIn ? (
        <>
          {/* My Profile */}
          <Pressable
            style={({ pressed }) => [
              styles.menuCard,
              pressed && styles.menuCardPressed,
            ]}
            onPress={() => router.push('/profile')}
          >
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.profileMenuPhoto} />
            ) : (
              <View style={[styles.iconBox, styles.grayBox]}>
                <Text style={styles.menuIcon}>👤</Text>
              </View>
            )}

            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>
                My Profile
              </Text>

              <Text style={styles.menuText}>
                Manage your YMA Salem Branch member profile
              </Text>
            </View>

            <Text style={styles.arrow}>
              ›
            </Text>
          </Pressable>

          {/* Admin Panel */}
          {isAdmin && (
            <Pressable
              style={({ pressed }) => [
                styles.adminCard,
                pressed && styles.menuCardPressed,
              ]}
              onPress={() => router.push('/admin')}
            >
              <LinearGradient
                colors={['#D32F2F', '#111111']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.adminIconBox}
              >
                <Text style={styles.adminIcon}>
                  ⚙
                </Text>
              </LinearGradient>

              <View style={styles.menuContent}>
                <View style={styles.adminTitleRow}>
                  <Text style={styles.adminTitle}>
                    Admin Panel
                  </Text>

                  <View style={styles.adminBadge}>
                    <Text style={styles.adminBadgeText}>
                      ADMIN
                    </Text>
                  </View>
                </View>

                <Text style={styles.menuText}>
                  Manage YMA Salem Branch members and administration
                </Text>
              </View>

              <Text style={styles.arrow}>
                ›
              </Text>
            </Pressable>
          )}

          {/* Settings */}
          <Pressable
            style={({ pressed }) => [
              styles.menuCard,
              pressed && styles.menuCardPressed,
            ]}
            onPress={() => router.push('/settings')}
          >
            <View style={[styles.iconBox, styles.blackBox]}>
              <Text style={styles.menuIcon}>
                ⚙️
              </Text>
            </View>

            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>
                Settings
              </Text>

              <Text style={styles.menuText}>
                App preferences and settings
              </Text>
            </View>

            <Text style={styles.arrow}>
              ›
            </Text>
          </Pressable>

          {/* Logout */}
          <Pressable
            style={({ pressed }) => [
              styles.logoutCard,
              pressed && styles.logoutCardPressed,
            ]}
            onPress={handleLogout}
            disabled={loggingOut}
          >
            <View style={styles.logoutIconBox}>
              <Text style={styles.logoutIcon}>
                ↪
              </Text>
            </View>

            <View style={styles.menuContent}>
              <Text style={styles.logoutTitle}>
                {loggingOut ? 'Logging out...' : 'Logout'}
              </Text>

              <Text style={styles.logoutText}>
                Sign out from your YMA Salem Branch account
              </Text>
            </View>

            <Text style={styles.logoutArrow}>
              ›
            </Text>
          </Pressable>
        </>
      ) : (
        <>
          {/* Login */}
          <Pressable
            style={({ pressed }) => [
              styles.loginCard,
              pressed && styles.loginCardPressed,
            ]}
            onPress={() => router.push('/login')}
          >
            <LinearGradient
              colors={['#D32F2F', '#111111']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.loginGradient}
            >
              <View style={styles.loginIconBox}>
                <Text style={styles.loginIcon}>
                  🔐
                </Text>
              </View>

              <View style={styles.menuContent}>
                <Text style={styles.loginTitle}>
                  Login / Register
                </Text>

                <Text style={styles.loginText}>
                  Sign in or create your YMA Salem Branch account
                </Text>
              </View>

              <Text style={styles.loginArrow}>
                ›
              </Text>
            </LinearGradient>
          </Pressable>
        </>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLine} />

        <Text style={styles.footerTitle}>
          YMA Salem Branch
        </Text>

        <Text style={styles.footerText}>
          Young Mizo Association
        </Text>

        <Text style={styles.version}>
          Version 1.0
        </Text>
      </View>

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  header: {
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },

  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerSmall: {
    color: '#F5CACA',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.6,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    marginTop: 4,
  },

  headerText: {
    color: '#E8E8E8',
    fontSize: 11,
    marginTop: 5,
  },

  headerMark: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: '#FFFFFF18',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF25',
  },

  headerLogo: {
    width: 43,
    height: 43,
    opacity: 0.9,
  },

  /* YMA Salem Branch / ABOUT US CARD */
  profileCard: {
    marginHorizontal: 18,
    marginTop: 18,
    padding: 17,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },

  profileCardPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },

  logoContainer: {
    width: 62,
    height: 62,
    borderRadius: 19,
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  logoImage: {
    width: 52,
    height: 52,
  },

  profileMenuPhoto: { width: 45, height: 45, borderRadius: 14, backgroundColor: '#F5F5F5' },

  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },

  profileTitle: {
    color: '#111111',
    fontSize: 19,
    fontWeight: '900',
  },

  profileText: {
    color: '#777777',
    fontSize: 10,
    marginTop: 3,
  },

  memberBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FBEAEA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 7,
  },

  memberBadgeText: {
    color: '#C62828',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  profileArrowCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileArrow: {
    color: '#888888',
    fontSize: 23,
    marginTop: -2,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 18,
    marginTop: 25,
    marginBottom: 11,
  },

  sectionDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#C62828',
    marginRight: 8,
  },

  sectionTitle: {
    color: '#111111',
    fontSize: 18,
    fontWeight: '900',
  },

  menuCard: {
    marginHorizontal: 18,
    marginBottom: 10,
    padding: 13,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },

  menuCardPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },

  featureCard: {
    borderColor: '#D9B0B0',
  },

  cemeteryCard: {
    borderColor: '#CFCFCF',
  },

  cemeteryIconBox: {
    width: 45,
    height: 45,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cemeteryIcon: {
    fontSize: 21,
  },

  cemeteryTag: {
    backgroundColor: '#EAEAEA',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    marginLeft: 7,
  },

  cemeteryTagText: {
    color: '#444444',
    fontSize: 6,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  adminCard: {
    marginHorizontal: 18,
    marginBottom: 10,
    padding: 13,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D9B0B0',
  },

  iconBox: {
    width: 45,
    height: 45,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  featureIconBox: {
    width: 45,
    height: 45,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  adminIconBox: {
    width: 45,
    height: 45,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  redBox: {
    backgroundColor: '#FBEAEA',
  },

  blackBox: {
    backgroundColor: '#EAEAEA',
  },

  grayBox: {
    backgroundColor: '#F1F1F1',
  },

  menuIcon: {
    fontSize: 21,
  },

  featureIcon: {
    fontSize: 21,
  },

  adminIcon: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },

  menuContent: {
    flex: 1,
    marginLeft: 12,
  },

  menuTitle: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '900',
  },

  titleWithTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  serviceTag: {
    backgroundColor: '#FBEAEA',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    marginLeft: 7,
  },

  serviceTagText: {
    color: '#C62828',
    fontSize: 6,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  adminTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  adminTitle: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '900',
  },

  adminBadge: {
    backgroundColor: '#FBEAEA',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    marginLeft: 7,
  },

  adminBadgeText: {
    color: '#C62828',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  menuText: {
    color: '#777777',
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },

  arrow: {
    color: '#999999',
    fontSize: 26,
    marginLeft: 8,
  },

  notificationBadge: {
    backgroundColor: '#C62828',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
  },

  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: '900',
  },

  loginCard: {
    marginHorizontal: 18,
    marginBottom: 10,
    borderRadius: 18,
    overflow: 'hidden',
  },

  loginGradient: {
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },

  loginIconBox: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: '#FFFFFF18',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loginIcon: {
    fontSize: 21,
  },

  loginTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },

  loginText: {
    color: '#D9D9D9',
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },

  loginArrow: {
    color: '#FFFFFF',
    fontSize: 26,
    marginLeft: 8,
  },

  loginCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },

  logoutCard: {
    marginHorizontal: 18,
    marginBottom: 10,
    padding: 13,
    borderRadius: 18,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },

  logoutCardPressed: {
    opacity: 0.78,
  },

  logoutIconBox: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoutIcon: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },

  logoutTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },

  logoutText: {
    color: '#D9D9D9',
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },

  logoutArrow: {
    color: '#FFFFFF',
    fontSize: 26,
    marginLeft: 8,
  },

  footer: {
    alignItems: 'center',
    marginTop: 27,
    paddingHorizontal: 18,
  },

  footerLine: {
    width: 45,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#C62828',
    marginBottom: 15,
  },

  footerTitle: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '900',
  },

  footerText: {
    color: '#888888',
    fontSize: 9,
    marginTop: 3,
  },

  version: {
    color: '#AAAAAA',
    fontSize: 8,
    marginTop: 7,
  },

  bottomSpace: {
    height: 30,
  },
});