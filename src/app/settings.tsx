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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Settings
        </Text>

        <Text style={styles.headerText}>
          App preferences and settings
        </Text>
      </View>

      <Text style={styles.sectionTitle}>
        Notifications
      </Text>

      <View style={styles.settingCard}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>🔔</Text>
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
        />
      </View>

      <Text style={styles.sectionTitle}>
        App
      </Text>

      <View style={styles.infoCard}>
        <Text style={styles.icon}>🌐</Text>

        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>
            Language
          </Text>

          <Text style={styles.settingText}>
            English
          </Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.icon}>ℹ️</Text>

        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>
            App Version
          </Text>

          <Text style={styles.settingText}>
            Version 1.0
          </Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.icon}>🔒</Text>

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

  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#172033',
    marginHorizontal: 18,
    marginTop: 22,
    marginBottom: 12,
  },

  settingCard: {
    marginHorizontal: 18,
    padding: 15,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },

  infoCard: {
    marginHorizontal: 18,
    marginBottom: 10,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E8F0F5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  icon: {
    fontSize: 22,
    width: 42,
  },

  settingContent: {
    flex: 1,
    marginLeft: 10,
  },

  settingTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#172033',
  },

  settingText: {
    fontSize: 10,
    color: '#7A8494',
    marginTop: 4,
    lineHeight: 15,
  },
});