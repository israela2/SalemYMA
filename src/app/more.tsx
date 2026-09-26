import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { router } from 'expo-router';

export default function MoreScreen() {
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          More
        </Text>

        <Text style={styles.headerText}>
          Salem YMA services and information
        </Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>
            SY
          </Text>
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.profileTitle}>
            Salem YMA
          </Text>

          <Text style={styles.profileText}>
            Young Mizo Association
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>
        Salem YMA
      </Text>

      <Pressable
        style={styles.menuCard}
        onPress={() => router.push('/gallery')}
      >
        <Text style={styles.menuIcon}>
          🖼️
        </Text>

        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>
            Gallery
          </Text>

          <Text style={styles.menuText}>
            Salem YMA photos and memories
          </Text>
        </View>

        <Text style={styles.arrow}>
          ›
        </Text>
      </Pressable>

      <Pressable
        style={styles.menuCard}
        onPress={() => router.push('/events')}
      >
        <Text style={styles.menuIcon}>
          📅
        </Text>

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

      <Pressable
        style={styles.menuCard}
        onPress={() => router.push('/waste-fee')}
      >
        <Text style={styles.menuIcon}>
          🗑️
        </Text>

        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>
            Bawhhlawh Paih Man
          </Text>

          <Text style={styles.menuText}>
            Waste collection fee and payment history
          </Text>
        </View>

        <Text style={styles.arrow}>
          ›
        </Text>
      </Pressable>

      <Pressable
        style={styles.menuCard}
        onPress={() => router.push('/notifications')}
      >
        <Text style={styles.menuIcon}>
          🔔
        </Text>

        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>
            Notifications
          </Text>

          <Text style={styles.menuText}>
            Important notices and updates
          </Text>
        </View>

        <Text style={styles.arrow}>
          ›
        </Text>
      </Pressable>

      <Text style={styles.sectionTitle}>
        Account
      </Text>

      <Pressable
        style={styles.loginCard}
        onPress={() => router.push('/login')}
      >
        <Text style={styles.loginIcon}>
          🔐
        </Text>

        <View style={styles.menuContent}>
          <Text style={styles.loginTitle}>
            Login / Register
          </Text>

          <Text style={styles.loginText}>
            Sign in or create your Salem YMA account
          </Text>
        </View>

        <Text style={styles.loginArrow}>
          ›
        </Text>
      </Pressable>

      <Pressable
        style={styles.menuCard}
        onPress={() => router.push('/profile')}
      >
        <Text style={styles.menuIcon}>
          👤
        </Text>

        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>
            My Profile
          </Text>

          <Text style={styles.menuText}>
            Manage your Salem YMA member profile
          </Text>
        </View>

        <Text style={styles.arrow}>
          ›
        </Text>
      </Pressable>

      <Pressable
        style={styles.menuCard}
        onPress={() => router.push('/settings')}
      >
        <Text style={styles.menuIcon}>
          ⚙️
        </Text>

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

      <Text style={styles.version}>
        Salem YMA App • Version 1.0
      </Text>

      <View style={{ height: 35 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },

  header: {
    backgroundColor: '#123B5D',
    paddingTop: 55,
    paddingHorizontal: 18,
    paddingBottom: 22,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
  },

  headerText: {
    color: '#D8E6F0',
    fontSize: 12,
    marginTop: 5,
  },

  profileCard: {
    margin: 18,
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },

  logoCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#123B5D',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },

  profileInfo: {
    marginLeft: 14,
  },

  profileTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#172033',
  },

  profileText: {
    fontSize: 11,
    color: '#7A8494',
    marginTop: 3,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#172033',
    marginHorizontal: 18,
    marginTop: 5,
    marginBottom: 12,
  },

  menuCard: {
    marginHorizontal: 18,
    marginBottom: 10,
    padding: 15,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },

  menuIcon: {
    width: 42,
    fontSize: 25,
  },

  menuContent: {
    flex: 1,
    marginLeft: 8,
  },

  menuTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#172033',
  },

  menuText: {
    fontSize: 10,
    color: '#7A8494',
    marginTop: 3,
    lineHeight: 15,
  },

  arrow: {
    fontSize: 26,
    color: '#98A2B3',
    marginLeft: 8,
  },

  loginCard: {
    marginHorizontal: 18,
    marginBottom: 10,
    padding: 15,
    borderRadius: 16,
    backgroundColor: '#123B5D',
    flexDirection: 'row',
    alignItems: 'center',
  },

  loginIcon: {
    width: 42,
    fontSize: 25,
  },

  loginTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  loginText: {
    fontSize: 10,
    color: '#D8E6F0',
    marginTop: 3,
    lineHeight: 15,
  },

  loginArrow: {
    fontSize: 26,
    color: '#FFFFFF',
    marginLeft: 8,
  },

  version: {
    textAlign: 'center',
    fontSize: 10,
    color: '#98A2B3',
    marginTop: 18,
  },
});