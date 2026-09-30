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

export default function NotificationsScreen() {
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Premium Header */}
      <LinearGradient
        colors={['#D32F2F', '#8E1B1B', '#0B0B0B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backIcon}>
              ‹
            </Text>
          </Pressable>

          <View style={styles.headerLogoBox}>
            <Image
              source={require('../../assets/images/yma-logo.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          </View>
        </View>

        <View style={styles.headerTitleRow}>
          <View>
            <Text style={styles.headerEyebrow}>
              YMA SALEM BRANCH
            </Text>

            <Text style={styles.headerTitle}>
              Notifications
            </Text>

            <Text style={styles.headerText}>
              Important notices and latest updates
            </Text>
          </View>

          <View style={styles.bellCircle}>
            <Text style={styles.bellIcon}>
              🔔
            </Text>

            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>
                2
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionAccent} />

        <View style={styles.sectionHeaderText}>
          <Text style={styles.sectionTitle}>
            Recent Notifications
          </Text>

          <Text style={styles.sectionSubtitle}>
            Stay informed with Salem YMA
          </Text>
        </View>

        <View style={styles.unreadPill}>
          <Text style={styles.unreadPillText}>
            2 NEW
          </Text>
        </View>
      </View>

      {/* Notification 1 */}
      <View style={styles.notificationCard}>
        <LinearGradient
          colors={['#D32F2F', '#8E1B1B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconBox}
        >
          <Text style={styles.icon}>
            📢
          </Text>
        </LinearGradient>

        <View style={styles.notificationContent}>
          <View style={styles.titleRow}>
            <Text style={styles.notificationTitle}>
              Salem YMA Announcement
            </Text>

            <View style={styles.newDot} />
          </View>

          <Text style={styles.notificationText}>
            Important announcements and information
            will appear here.
          </Text>

          <View style={styles.metaRow}>
            <Text style={styles.time}>
              Today
            </Text>

            <View style={styles.newLabel}>
              <Text style={styles.newLabelText}>
                NEW
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Notification 2 */}
      <View style={styles.notificationCard}>
        <LinearGradient
          colors={['#D32F2F', '#8E1B1B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconBox}
        >
          <Text style={styles.icon}>
            📅
          </Text>
        </LinearGradient>

        <View style={styles.notificationContent}>
          <View style={styles.titleRow}>
            <Text style={styles.notificationTitle}>
              Upcoming Programme
            </Text>

            <View style={styles.newDot} />
          </View>

          <Text style={styles.notificationText}>
            Salem YMA events and programmes will be
            announced here.
          </Text>

          <View style={styles.metaRow}>
            <Text style={styles.time}>
              Recent
            </Text>

            <View style={styles.newLabel}>
              <Text style={styles.newLabelText}>
                NEW
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Empty / Future Notification State */}
      <View style={styles.futureCard}>
        <View style={styles.futureIconBox}>
          <Text style={styles.futureIcon}>
            ✓
          </Text>
        </View>

        <View style={styles.futureContent}>
          <Text style={styles.futureTitle}>
            You're all caught up
          </Text>

          <Text style={styles.futureText}>
            New Salem YMA notifications will appear
            here when available.
          </Text>
        </View>
      </View>

      {/* Stay Updated */}
      <LinearGradient
        colors={['#D32F2F', '#8E1B1B', '#0B0B0B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.infoCard}
      >
        <View style={styles.infoIconBox}>
          <Text style={styles.infoIcon}>
            🔔
          </Text>
        </View>

        <View style={styles.infoContent}>
          <Text style={styles.infoEyebrow}>
            SALEM YMA
          </Text>

          <Text style={styles.infoTitle}>
            Stay Updated
          </Text>

          <Text style={styles.infoText}>
            New announcements, programmes and
            important notices will appear here.
          </Text>
        </View>
      </LinearGradient>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLine} />

        <Text style={styles.footerTitle}>
          YMA SALEM BRANCH
        </Text>

        <Text style={styles.footerText}>
          Young Mizo Association
        </Text>

        <Text style={styles.footerTagline}>
         Hun âwl hman ṭhat
        </Text>
        <Text style={styles.footerTagline}>
         Zo fâte hma-sâwnna ngaihtuah
        </Text>
        <Text style={styles.footerTagline}>
         Kristian nun dan ṭha ngaihsan
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
    paddingTop: 48,
    paddingHorizontal: 18,
    paddingBottom: 28,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },

  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 21,
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF18',
    borderWidth: 1,
    borderColor: '#FFFFFF25',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backIcon: {
    color: '#FFFFFF',
    fontSize: 29,
    fontWeight: '300',
    marginTop: -3,
  },

  headerLogoBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFF18',
    borderWidth: 1,
    borderColor: '#FFFFFF25',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerLogo: {
    width: 29,
    height: 29,
    opacity: 0.9,
  },

  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerEyebrow: {
    color: '#F7CACA',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.8,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 29,
    fontWeight: '900',
    marginTop: 4,
  },

  headerText: {
    color: '#F2DADA',
    fontSize: 11,
    marginTop: 5,
  },

  bellCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF18',
    borderWidth: 1,
    borderColor: '#FFFFFF25',
    alignItems: 'center',
    justifyContent: 'center',
  },

  bellIcon: {
    fontSize: 24,
  },

  headerBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 19,
    height: 19,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#8E1B1B',
  },

  headerBadgeText: {
    color: '#C62828',
    fontSize: 8,
    fontWeight: '900',
  },

  sectionHeader: {
    marginHorizontal: 18,
    marginTop: 25,
    marginBottom: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },

  sectionAccent: {
    width: 4,
    height: 34,
    borderRadius: 2,
    backgroundColor: '#C62828',
    marginRight: 10,
  },

  sectionHeaderText: {
    flex: 1,
  },

  sectionTitle: {
    color: '#111111',
    fontSize: 18,
    fontWeight: '900',
  },

  sectionSubtitle: {
    color: '#999999',
    fontSize: 9,
    marginTop: 3,
  },

  unreadPill: {
    backgroundColor: '#FBEAEA',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },

  unreadPillText: {
    color: '#C62828',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  notificationCard: {
    marginHorizontal: 18,
    marginBottom: 11,
    padding: 15,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E8E8E8',

    shadowColor: '#000000',
    shadowOpacity: 0.055,
    shadowRadius: 9,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 3,
  },

  iconBox: {
    width: 49,
    height: 49,
    borderRadius: 15,
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

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  notificationTitle: {
    flex: 1,
    color: '#171717',
    fontSize: 13,
    fontWeight: '900',
  },

  newDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#C62828',
    marginLeft: 7,
  },

  notificationText: {
    color: '#777777',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 5,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
  },

  time: {
    color: '#999999',
    fontSize: 8,
    fontWeight: '700',
  },

  newLabel: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: '#FBEAEA',
  },

  newLabelText: {
    color: '#C62828',
    fontSize: 6,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  futureCard: {
    marginHorizontal: 18,
    marginTop: 2,
    marginBottom: 11,
    padding: 15,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E7E7E7',
  },

  futureIconBox: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: '#E8F5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  futureIcon: {
    color: '#2E7D5B',
    fontSize: 19,
    fontWeight: '900',
  },

  futureContent: {
    flex: 1,
    marginLeft: 12,
  },

  futureTitle: {
    color: '#222222',
    fontSize: 12,
    fontWeight: '900',
  },

  futureText: {
    color: '#999999',
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },

  infoCard: {
    marginHorizontal: 18,
    marginTop: 7,
    padding: 17,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',

    shadowColor: '#000000',
    shadowOpacity: 0.13,
    shadowRadius: 11,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 4,
  },

  infoIconBox: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoIcon: {
    fontSize: 21,
  },

  infoContent: {
    flex: 1,
    marginLeft: 12,
  },

  infoEyebrow: {
    color: '#F7CACA',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  infoTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 2,
  },

  infoText: {
    color: '#F5DCDC',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 5,
  },

  footer: {
    alignItems: 'center',
    marginTop: 27,
    paddingHorizontal: 18,
  },

  footerLine: {
    width: 42,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#C62828',
    marginBottom: 13,
  },

  footerTitle: {
    color: '#111111',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },

  footerText: {
    color: '#888888',
    fontSize: 9,
    marginTop: 4,
  },

  footerTagline: {
    color: '#AAAAAA',
    fontSize: 8,
    marginTop: 6,
  },

  bottomSpace: {
    height: 35,
  },
});