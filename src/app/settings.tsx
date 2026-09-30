import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

export default function SettingsScreen() {
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>
          SALEM YMA
        </Text>

        <Text style={styles.headerTitle}>
          Settings
        </Text>

        <Text style={styles.headerText}>
          App preferences and settings
        </Text>
      </View>

      {/* Notifications */}
      <Text style={styles.sectionTitle}>
        Notifications
      </Text>

      <View style={styles.settingCard}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>
            🔔
          </Text>
        </View>

        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>
            Push Notifications
          </Text>

          <Text style={styles.settingText}>
            Receive Salem YMA announcements and updates
          </Text>
        </View>

        <Switch
          value={true}
          onValueChange={() => {}}
          trackColor={{
            false: '#D0D0D0',
            true: '#333333',
          }}
          thumbColor="#FFFFFF"
        />
      </View>

      {/* App */}
      <Text style={styles.sectionTitle}>
        App
      </Text>

      {/* Language */}
      <View style={styles.infoCard}>
        <View style={styles.iconBox}>
          <Text style={styles.icon}>
            🌐
          </Text>
        </View>

        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>
            Language
          </Text>

          <Text style={styles.settingText}>
            English
          </Text>
        </View>
      </View>

      {/* Version */}
      <View style={styles.infoCard}>
        <View style={styles.iconBox}>
          <Text style={styles.icon}>
            ℹ️
          </Text>
        </View>

        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>
            App Version
          </Text>

          <Text style={styles.settingText}>
            Version 1.0
          </Text>
        </View>
      </View>

      {/* Privacy */}
      <View style={styles.infoCard}>
        <View style={styles.iconBox}>
          <Text style={styles.icon}>
            🔒
          </Text>
        </View>

        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>
            Privacy
          </Text>

          <Text style={styles.settingText}>
            Your account and payment information
            will be securely managed.
          </Text>
        </View>
      </View>

      {/* About */}
      <Text style={styles.sectionTitle}>
        About
      </Text>

      <View style={styles.aboutCard}>
        <Text style={styles.aboutTitle}>
          Salem YMA
        </Text>

        <Text style={styles.aboutSubtitle}>
          Young Mizo Association
        </Text>

        <View style={styles.divider} />

        <Text style={styles.aboutText}>
          Hun âwl hman ṭhat
 • Zo fâte hma-sâwnna ngaihtuah • Kristian nun dan ṭha ngaihsan

        </Text>

        <Text style={styles.copyright}>
          Salem YMA Mobile Application
        </Text>
      </View>

      <View style={{ height: 35 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  header: {
    backgroundColor: '#111111',
    paddingTop: 55,
    paddingHorizontal: 18,
    paddingBottom: 25,
  },

  headerEyebrow: {
    color: '#AAAAAA',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 5,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '900',
  },

  headerText: {
    color: '#BDBDBD',
    fontSize: 12,
    marginTop: 5,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#111111',
    marginHorizontal: 18,
    marginTop: 23,
    marginBottom: 12,
  },

  settingCard: {
    marginHorizontal: 18,
    padding: 15,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',

    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 2,
  },

  infoCard: {
    marginHorizontal: 18,
    marginBottom: 10,
    padding: 15,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',

    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 2,
  },

  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  icon: {
    fontSize: 21,
  },

  settingContent: {
    flex: 1,
    marginLeft: 12,
  },

  settingTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111111',
  },

  settingText: {
    fontSize: 10,
    color: '#777777',
    marginTop: 4,
    lineHeight: 15,
  },

  aboutCard: {
    marginHorizontal: 18,
    padding: 20,
    borderRadius: 18,
    backgroundColor: '#111111',
    alignItems: 'center',

    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 4,
  },

  aboutTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },

  aboutSubtitle: {
    color: '#AAAAAA',
    fontSize: 11,
    marginTop: 4,
  },

  divider: {
    width: '80%',
    height: 1,
    backgroundColor: '#333333',
    marginVertical: 15,
  },

  aboutText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  copyright: {
    color: '#777777',
    fontSize: 9,
    marginTop: 8,
  },
});