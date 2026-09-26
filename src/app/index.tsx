import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { router } from 'expo-router';

export default function HomeScreen() {
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>SY</Text>
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.orgName}>
            Salem YMA
          </Text>

          <Text style={styles.orgSubtitle}>
            Young Mizo Association
          </Text>
        </View>

        <Pressable
          style={styles.notificationButton}
          onPress={() => router.push('/notifications')}
        >
          <Text style={styles.notificationIcon}>
            🔔
          </Text>
        </Pressable>
      </View>

      {/* Welcome */}
      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeSmall}>
          WELCOME TO
        </Text>

        <Text style={styles.welcomeTitle}>
          Salem YMA
        </Text>

        <Text style={styles.welcomeText}>
          Community, service, unity and fellowship.
        </Text>
      </View>

      {/* Quick Access */}
      <Text style={styles.sectionTitle}>
        Quick Access
      </Text>

      <View style={styles.quickRow}>
        <Pressable
          style={styles.quickCard}
          onPress={() => router.push('/news')}
        >
          <View style={styles.quickIconBox}>
            <Text style={styles.quickIcon}>📰</Text>
          </View>

          <Text style={styles.quickTitle}>
            News
          </Text>

          <Text style={styles.quickText}>
            Latest updates
          </Text>
        </Pressable>

        <Pressable
          style={styles.quickCard}
          onPress={() => router.push('/events')}
        >
          <View style={styles.quickIconBox}>
            <Text style={styles.quickIcon}>📅</Text>
          </View>

          <Text style={styles.quickTitle}>
            Events
          </Text>

          <Text style={styles.quickText}>
            Upcoming events
          </Text>
        </Pressable>

        <Pressable
          style={styles.quickCard}
          onPress={() => router.push('/gallery')}
        >
          <View style={styles.quickIconBox}>
            <Text style={styles.quickIcon}>🖼️</Text>
          </View>

          <Text style={styles.quickTitle}>
            Gallery
          </Text>

          <Text style={styles.quickText}>
            Photos
          </Text>
        </Pressable>
      </View>

      {/* Waste Fee */}
      <Text style={styles.sectionTitle}>
        Services
      </Text>

      <Pressable
        style={styles.serviceCard}
        onPress={() => router.push('/waste-fee')}
      >
        <View style={styles.serviceIconBox}>
          <Text style={styles.serviceIcon}>
            🗑️
          </Text>
        </View>

        <View style={styles.serviceContent}>
          <Text style={styles.serviceTitle}>
            Bawhhlawh Paih Man
          </Text>

          <Text style={styles.serviceText}>
            Waste collection fee & payment
          </Text>
        </View>

        <Text style={styles.arrow}>
          ›
        </Text>
      </Pressable>

      {/* Latest News */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitleNoMargin}>
          Latest News
        </Text>

        <Pressable
          onPress={() => router.push('/news')}
        >
          <Text style={styles.viewAll}>
            View All
          </Text>
        </Pressable>
      </View>

      <Pressable
        style={styles.newsCard}
        onPress={() => router.push('/news')}
      >
        <View style={styles.newsDate}>
          <Text style={styles.newsMonth}>
            SEP
          </Text>

          <Text style={styles.newsDay}>
            26
          </Text>
        </View>

        <View style={styles.newsContent}>
          <Text style={styles.newsBadge}>
            ANNOUNCEMENT
          </Text>

          <Text style={styles.newsTitle}>
            Salem YMA Important Announcement
          </Text>

          <Text style={styles.newsText}>
            Important announcements and information
            will be shared here.
          </Text>
        </View>
      </Pressable>

      {/* Upcoming Event */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitleNoMargin}>
          Upcoming Event
        </Text>

        <Pressable
          onPress={() => router.push('/events')}
        >
          <Text style={styles.viewAll}>
            View All
          </Text>
        </Pressable>
      </View>

      <Pressable
        style={styles.eventCard}
        onPress={() => router.push('/events')}
      >
        <View style={styles.eventIconBox}>
          <Text style={styles.eventIcon}>
            📅
          </Text>
        </View>

        <View style={styles.eventContent}>
          <Text style={styles.eventTitle}>
            Salem YMA Programme
          </Text>

          <Text style={styles.eventDate}>
            28 September 2026
          </Text>

          <Text style={styles.eventLocation}>
            📍 Salem, Mizoram
          </Text>
        </View>

        <Text style={styles.arrow}>
          ›
        </Text>
      </Pressable>

      {/* Notice */}
      <View style={styles.noticeCard}>
        <Text style={styles.noticeIcon}>
          ℹ️
        </Text>

        <View style={styles.noticeContent}>
          <Text style={styles.noticeTitle}>
            Stay Updated
          </Text>

          <Text style={styles.noticeText}>
            Salem YMA announcements, activities,
            programmes and important notices will
            appear in this app.
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
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },

  logoCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#123B5D',
  },

  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },

  orgName: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '900',
  },

  orgSubtitle: {
    color: '#D8E6F0',
    fontSize: 11,
    marginTop: 2,
  },

  notificationButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF22',
    alignItems: 'center',
    justifyContent: 'center',
  },

  notificationIcon: {
    fontSize: 20,
  },

  welcomeCard: {
    margin: 18,
    padding: 22,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },

  welcomeSmall: {
    fontSize: 10,
    fontWeight: '900',
    color: '#7A8494',
    letterSpacing: 1.2,
  },

  welcomeTitle: {
    fontSize: 29,
    fontWeight: '900',
    color: '#123B5D',
    marginTop: 5,
  },

  welcomeText: {
    fontSize: 13,
    color: '#667085',
    marginTop: 6,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#172033',
    marginHorizontal: 18,
    marginTop: 5,
    marginBottom: 12,
  },

  quickRow: {
    flexDirection: 'row',
    marginHorizontal: 18,
  },

  quickCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 13,
    alignItems: 'center',
    marginRight: 8,
  },

  quickIconBox: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#E8F0F5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  quickIcon: {
    fontSize: 21,
  },

  quickTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#172033',
    marginTop: 7,
  },

  quickText: {
    fontSize: 8,
    color: '#7A8494',
    marginTop: 3,
    textAlign: 'center',
  },

  serviceCard: {
    marginHorizontal: 18,
    padding: 16,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },

  serviceIconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#E8F0F5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  serviceIcon: {
    fontSize: 25,
  },

  serviceContent: {
    flex: 1,
    marginLeft: 12,
  },

  serviceTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#172033',
  },

  serviceText: {
    fontSize: 10,
    color: '#7A8494',
    marginTop: 4,
  },

  arrow: {
    fontSize: 27,
    color: '#98A2B3',
  },

  sectionHeader: {
    marginHorizontal: 18,
    marginTop: 24,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionTitleNoMargin: {
    fontSize: 19,
    fontWeight: '800',
    color: '#172033',
  },

  viewAll: {
    fontSize: 10,
    fontWeight: '800',
    color: '#123B5D',
  },

  newsCard: {
    marginHorizontal: 18,
    padding: 15,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
  },

  newsDate: {
    width: 54,
    height: 61,
    borderRadius: 13,
    backgroundColor: '#E8F0F5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  newsMonth: {
    fontSize: 9,
    fontWeight: '900',
    color: '#123B5D',
  },

  newsDay: {
    fontSize: 21,
    fontWeight: '900',
    color: '#123B5D',
  },

  newsContent: {
    flex: 1,
    marginLeft: 12,
  },

  newsBadge: {
    alignSelf: 'flex-start',
    fontSize: 8,
    fontWeight: '900',
    color: '#123B5D',
    backgroundColor: '#E8F0F5',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 5,
  },

  newsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#172033',
    marginTop: 7,
  },

  newsText: {
    fontSize: 10,
    color: '#7A8494',
    lineHeight: 15,
    marginTop: 4,
  },

  eventCard: {
    marginHorizontal: 18,
    padding: 15,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },

  eventIconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#E8F0F5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  eventIcon: {
    fontSize: 24,
  },

  eventContent: {
    flex: 1,
    marginLeft: 12,
  },

  eventTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#172033',
  },

  eventDate: {
    fontSize: 10,
    fontWeight: '700',
    color: '#123B5D',
    marginTop: 4,
  },

  eventLocation: {
    fontSize: 9,
    color: '#7A8494',
    marginTop: 4,
  },

  noticeCard: {
    marginHorizontal: 18,
    marginTop: 18,
    padding: 16,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
  },

  noticeIcon: {
    fontSize: 22,
  },

  noticeContent: {
    flex: 1,
    marginLeft: 12,
  },

  noticeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#172033',
  },

  noticeText: {
    fontSize: 10,
    color: '#6B7280',
    lineHeight: 16,
    marginTop: 5,
  },
});