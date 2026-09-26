import {
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function ProfileScreen() {
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          My Profile
        </Text>

        <Text style={styles.headerText}>
          Salem YMA member profile
        </Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            👤
          </Text>
        </View>

        <Text style={styles.name}>
          Salem YMA Member
        </Text>

        <Text style={styles.memberId}>
          Member ID: YMA-0001
        </Text>
      </View>

      <Text style={styles.sectionTitle}>
        Personal Information
      </Text>

      <View style={styles.infoCard}>
        <Text style={styles.icon}>👤</Text>

        <View style={styles.infoContent}>
          <Text style={styles.label}>
            Full Name
          </Text>

          <Text style={styles.value}>
            Member Name
          </Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.icon}>📱</Text>

        <View style={styles.infoContent}>
          <Text style={styles.label}>
            Phone Number
          </Text>

          <Text style={styles.value}>
            Not added
          </Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.icon}>📍</Text>

        <View style={styles.infoContent}>
          <Text style={styles.label}>
            Branch
          </Text>

          <Text style={styles.value}>
            Salem YMA Branch
          </Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.icon}>📅</Text>

        <View style={styles.infoContent}>
          <Text style={styles.label}>
            Membership
          </Text>

          <Text style={styles.value}>
            Active Member
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

  profileCard: {
    margin: 18,
    padding: 22,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },

  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#E8F0F5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    fontSize: 38,
  },

  name: {
    fontSize: 20,
    fontWeight: '900',
    color: '#172033',
    marginTop: 12,
  },

  memberId: {
    fontSize: 11,
    color: '#7A8494',
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#172033',
    marginHorizontal: 18,
    marginTop: 5,
    marginBottom: 12,
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

  icon: {
    fontSize: 22,
    width: 40,
  },

  infoContent: {
    flex: 1,
    marginLeft: 8,
  },

  label: {
    fontSize: 9,
    fontWeight: '800',
    color: '#7A8494',
    textTransform: 'uppercase',
  },

  value: {
    fontSize: 14,
    fontWeight: '700',
    color: '#172033',
    marginTop: 3,
  },
});