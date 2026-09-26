import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function BranchesScreen() {
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Branch Information
        </Text>

        <Text style={styles.headerText}>
          Salem YMA Branch
        </Text>
      </View>

      {/* Branch Overview */}
      <View style={styles.branchCard}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>
            SY
          </Text>
        </View>

        <View style={styles.branchInfo}>
          <Text style={styles.branchName}>
            Salem YMA Branch
          </Text>

          <Text style={styles.location}>
            📍 Salem, Mizoram
          </Text>

          <View style={styles.activeBadge}>
            <Text style={styles.activeText}>
              ● ACTIVE BRANCH
            </Text>
          </View>
        </View>
      </View>

      {/* Branch Leaders */}
      <Text style={styles.sectionTitle}>
        Branch Hruaitu te
      </Text>

      <View style={styles.leaderCard}>
        <View style={styles.photoCircle}>
          <Text style={styles.photoIcon}>
            👤
          </Text>
        </View>

        <View style={styles.leaderInfo}>
          <Text style={styles.role}>
            BRANCH PRESIDENT
          </Text>

          <Text style={styles.leaderName}>
            President Name
          </Text>

          <Text style={styles.phone}>
            📞 Contact number
          </Text>
        </View>

        <Pressable style={styles.callButton}>
          <Text style={styles.callIcon}>
            ☎
          </Text>
        </Pressable>
      </View>

      <View style={styles.leaderCard}>
        <View style={styles.photoCircle}>
          <Text style={styles.photoIcon}>
            👤
          </Text>
        </View>

        <View style={styles.leaderInfo}>
          <Text style={styles.role}>
            BRANCH SECRETARY
          </Text>

          <Text style={styles.leaderName}>
            Secretary Name
          </Text>

          <Text style={styles.phone}>
            📞 Contact number
          </Text>
        </View>

        <Pressable style={styles.callButton}>
          <Text style={styles.callIcon}>
            ☎
          </Text>
        </Pressable>
      </View>

      <View style={styles.leaderCard}>
        <View style={styles.photoCircle}>
          <Text style={styles.photoIcon}>
            👤
          </Text>
        </View>

        <View style={styles.leaderInfo}>
          <Text style={styles.role}>
            BRANCH TREASURER
          </Text>

          <Text style={styles.leaderName}>
            Treasurer Name
          </Text>

          <Text style={styles.phone}>
            📞 Contact number
          </Text>
        </View>

        <Pressable style={styles.callButton}>
          <Text style={styles.callIcon}>
            ☎
          </Text>
        </Pressable>
      </View>

      {/* Branch Activities */}
      <Text style={styles.sectionTitle}>
        Branch Hmalakna
      </Text>

      <View style={styles.infoCard}>
        <View style={styles.infoIconBox}>
          <Text style={styles.infoIcon}>
            🤝
          </Text>
        </View>

        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>
            Salem YMA Activities
          </Text>

          <Text style={styles.infoText}>
            Branch hmalakna, community service,
            programme leh member activity te
            hetah hian kan dah ang.
          </Text>
        </View>
      </View>

      {/* Contact */}
      <Text style={styles.sectionTitle}>
        Contact & Location
      </Text>

      <View style={styles.contactCard}>
        <View style={styles.contactIconBox}>
          <Text style={styles.contactIcon}>
            📍
          </Text>
        </View>

        <View style={styles.contactContent}>
          <Text style={styles.contactTitle}>
            Branch Location
          </Text>

          <Text style={styles.contactText}>
            Salem, Mizoram
          </Text>
        </View>
      </View>

      <View style={styles.contactCard}>
        <View style={styles.contactIconBox}>
          <Text style={styles.contactIcon}>
            📞
          </Text>
        </View>

        <View style={styles.contactContent}>
          <Text style={styles.contactTitle}>
            Branch Contact
          </Text>

          <Text style={styles.contactText}>
            Contact information will be updated here.
          </Text>
        </View>
      </View>

      <View style={styles.contactCard}>
        <View style={styles.contactIconBox}>
          <Text style={styles.contactIcon}>
            🕐
          </Text>
        </View>

        <View style={styles.contactContent}>
          <Text style={styles.contactTitle}>
            Branch Information
          </Text>

          <Text style={styles.contactText}>
            Salem YMA branch information will be
            updated through the admin system.
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
    fontSize: 25,
    fontWeight: '900',
  },

  headerText: {
    color: '#D8E6F0',
    fontSize: 12,
    marginTop: 5,
  },

  branchCard: {
    margin: 18,
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },

  logoCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#123B5D',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },

  branchInfo: {
    flex: 1,
    marginLeft: 14,
  },

  branchName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#172033',
  },

  location: {
    fontSize: 11,
    color: '#7A8494',
    marginTop: 5,
  },

  activeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5EE',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    marginTop: 7,
  },

  activeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#2E7D5B',
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#172033',
    marginHorizontal: 18,
    marginTop: 5,
    marginBottom: 12,
  },

  leaderCard: {
    marginHorizontal: 18,
    marginBottom: 10,
    padding: 15,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },

  photoCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#E8F0F5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  photoIcon: {
    fontSize: 28,
  },

  leaderInfo: {
    flex: 1,
    marginLeft: 13,
  },

  role: {
    fontSize: 8,
    fontWeight: '900',
    color: '#123B5D',
    letterSpacing: 0.6,
  },

  leaderName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#172033',
    marginTop: 4,
  },

  phone: {
    fontSize: 10,
    color: '#7A8494',
    marginTop: 5,
  },

  callButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E8F0F5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  callIcon: {
    fontSize: 17,
    color: '#123B5D',
  },

  infoCard: {
    marginHorizontal: 18,
    padding: 16,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
  },

  infoIconBox: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: '#E8F0F5',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 10,
    color: '#6B7280',
    marginTop: 5,
    lineHeight: 16,
  },

  contactCard: {
    marginHorizontal: 18,
    marginBottom: 10,
    padding: 15,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },

  contactIconBox: {
    width: 45,
    height: 45,
    borderRadius: 13,
    backgroundColor: '#E8F0F5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  contactIcon: {
    fontSize: 21,
  },

  contactContent: {
    flex: 1,
    marginLeft: 12,
  },

  contactTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#172033',
  },

  contactText: {
    fontSize: 10,
    color: '#7A8494',
    marginTop: 4,
    lineHeight: 15,
  },
});