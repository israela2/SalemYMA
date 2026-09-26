import {
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function NotificationsScreen() {
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Notifications
        </Text>

        <Text style={styles.headerText}>
          Salem YMA important notices and updates
        </Text>
      </View>

      {/* Notification */}
      <Text style={styles.sectionTitle}>
        Recent Notifications
      </Text>

      <View style={styles.notificationCard}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>
            📢
          </Text>
        </View>

        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>
            Salem YMA Announcement
          </Text>

          <Text style={styles.notificationText}>
            Important announcements and information
            will appear here.
          </Text>

          <Text style={styles.time}>
            Today
          </Text>
        </View>
      </View>

      <View style={styles.notificationCard}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>
            📅
          </Text>
        </View>

        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>
            Upcoming Programme
          </Text>

          <Text style={styles.notificationText}>
            Salem YMA events and programmes will be
            announced here.
          </Text>

          <Text style={styles.time}>
            Recent
          </Text>
        </View>
      </View>

      {/* Empty Information */}
      <View style={styles.infoCard}>
        <Text style={styles.infoIcon}>
          🔔
        </Text>

        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>
            Stay Updated
          </Text>

          <Text style={styles.infoText}>
            New Salem YMA announcements, programmes
            and important notices will appear here.
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
    fontSize: 20,
    fontWeight: '800',
    color: '#172033',
    marginHorizontal: 18,
    marginTop: 22,
    marginBottom: 12,
  },

  notificationCard: {
    marginHorizontal: 18,
    marginBottom: 10,
    padding: 15,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
  },

  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E8F0F5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  icon: {
    fontSize: 21,
  },

  notificationContent: {
    flex: 1,
    marginLeft: 12,
  },

  notificationTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#172033',
  },

  notificationText: {
    fontSize: 11,
    color: '#7A8494',
    marginTop: 5,
    lineHeight: 16,
  },

  time: {
    fontSize: 9,
    color: '#98A2B3',
    marginTop: 6,
  },

  infoCard: {
    marginHorizontal: 18,
    marginTop: 10,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
  },

  infoIcon: {
    fontSize: 23,
  },

  infoContent: {
    flex: 1,
    marginLeft: 12,
  },

  infoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#172033',
  },

  infoText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 5,
    lineHeight: 17,
  },
});