import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

export default function HomeScreen() {
  const [showGasBooking, setShowGasBooking] = useState(false);
  useEffect(() => {
    supabase.from('app_feature_visibility').select('is_visible').eq('feature_key', 'gas_booking').maybeSingle()
      .then(({ data }) => setShowGasBooking(!!data?.is_visible));
  }, []);
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Premium Red → Black Header */}
      <LinearGradient
        colors={['#D32F2F', '#8E1B1B', '#0B0B0B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View style={styles.brandArea}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../assets/yma-logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            <View style={styles.brandText}>
              <Text style={styles.orgName}>
                YMA Salem Branch
              </Text>

              <Text style={styles.orgSubtitle}>
                Young Mizo Association
              </Text>
            </View>
          </View>

          <Pressable
            style={styles.notificationButton}
            onPress={() => router.push('/notifications')}
          >
            <Text style={styles.notificationIcon}>
              🔔
            </Text>

            <View style={styles.notificationDot} />
          </Pressable>
        </View>

        <View style={styles.headerWelcome}>
          <Text style={styles.headerWelcomeSmall}>
            HELLO, WELCOME
          </Text>

          <Text style={styles.headerWelcomeTitle}>
            YMA thil tum
          </Text>

          <Text style={styles.headerWelcomeText}>
            Hun âwl hman ṭhat • Zo fâte hma-sâwnna ngaihtuah • Kristian nun dan ṭha ngaihsan
          </Text>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <View style={styles.content}>

        {/* Waste Fee Featured Card */}
        <Pressable
          style={styles.featureCard}
          onPress={() => router.push('/waste-fee')}
        >
          <LinearGradient
            colors={['#D32F2F', '#8E1B1B', '#0B0B0B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.featureGradient}
          >
            <View style={styles.featureTop}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureIconText}>
                  🗑️
                </Text>
              </View>

              <View style={styles.featureBadge}>
                <Text style={styles.featureBadgeText}>
                  QUICK SERVICE
                </Text>
              </View>
            </View>

            <Text style={styles.featureTitle}>
              Bawhhlawh Paih Man
            </Text>

            <Text style={styles.featureDescription}>
              Check your waste collection fee and manage
              your payment easily.
            </Text>

            <View style={styles.featureBottom}>
              <Text style={styles.featureAction}>
                Open Service
              </Text>

              <Text style={styles.featureArrow}>
                →
              </Text>
            </View>
          </LinearGradient>
        </Pressable>

        {/* Chhiatni Fund Featured Card */}
        <Pressable
          style={[styles.featureCard, styles.featureCardSpaced]}
          onPress={() => router.push('/chhiatni-fund')}
        >
          <LinearGradient
            colors={['#111111', '#8E1B1B', '#C62828']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.featureGradient}
          >
            <View style={styles.featureTop}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureIconText}>
                  🤝
                </Text>
              </View>

              <View style={styles.featureBadge}>
                <Text style={styles.featureBadgeText}>
                  FAMILY FUND
                </Text>
              </View>
            </View>

            <Text style={styles.featureTitle}>
              Chhiatni Fund
            </Text>

            <Text style={styles.featureDescription}>
              Your family Chhiatni Fund bill, payment and payment history.
            </Text>

            <View style={styles.featureBottom}>
              <Text style={styles.featureAction}>
                Open Service
              </Text>

              <Text style={styles.featureArrow}>
                →
              </Text>
            </View>
          </LinearGradient>
        </Pressable>


        {/* Zonun Featured Card */}
<Pressable
  style={styles.gasCard}
  onPress={() => router.push('/zonun')}
>
  <LinearGradient
    colors={['#111111', '#8E1B1B', '#C62828']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.gasGradient}
  >
    <View style={styles.gasTop}>

      <View style={styles.gasIcon}>
        <Text style={styles.gasIconText}>
          📖
        </Text>
      </View>

      <View style={styles.gasBadge}>
        <Text style={styles.gasBadgeText}>
          YMA DOCUMENT
        </Text>
      </View>

    </View>

    <Text style={styles.gasTitle}>
      Zonun
    </Text>

    <Text style={styles.gasDescription}>
      YMA Salem Branch Zonun leh thuthlung te PDF hmangin chhiar rawh.
    </Text>

    <View style={styles.gasBottom}>

      <Text style={styles.gasAction}>
        Open Zonun
      </Text>

      <Text style={styles.gasArrow}>
        →
      </Text>

    </View>

  </LinearGradient>
</Pressable>

        {/* Gas Booking Featured Card */}
        {showGasBooking && <Pressable
          style={styles.gasCard}
          onPress={() => router.push('/gas-booking')}
        >
          <LinearGradient
            colors={['#111111', '#8E1B1B', '#C62828']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gasGradient}
          >
            <View style={styles.gasTop}>
              <View style={styles.gasIcon}>
                <Text style={styles.gasIconText}>
                  🔥
                </Text>
              </View>

              <View style={styles.gasBadge}>
                <Text style={styles.gasBadgeText}>
                  QUICK SERVICE
                </Text>
              </View>
            </View>

            <Text style={styles.gasTitle}>
              Gas Booking
            </Text>

            <Text style={styles.gasDescription}>
              Book your LPG gas cylinder easily through YMA Salem Branch.
            </Text>

            <View style={styles.gasBottom}>
              <Text style={styles.gasAction}>
                Book Gas
              </Text>

              <Text style={styles.gasArrow}>
                →
              </Text>
            </View>
          </LinearGradient>
        </Pressable>}

        {/* Quick Access */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Quick Access
          </Text>
        </View>

        <View style={styles.quickGrid}>

          {/* News */}
          <Pressable
            style={styles.quickCard}
            onPress={() => router.push('/news')}
          >
            <View style={[styles.quickIcon, styles.redIcon]}>
              <Text style={styles.quickIconText}>
                📰
              </Text>
            </View>

            <Text style={styles.quickTitle}>
              News
            </Text>

            <Text style={styles.quickSubtitle}>
              Latest updates
            </Text>
          </Pressable>

          {/* Events */}
          <Pressable
            style={styles.quickCard}
            onPress={() => router.push('/events')}
          >
            <View style={[styles.quickIcon, styles.darkIcon]}>
              <Text style={styles.quickIconText}>
                📅
              </Text>
            </View>

            <Text style={styles.quickTitle}>
              Events
            </Text>

            <Text style={styles.quickSubtitle}>
              Upcoming events
            </Text>
          </Pressable>

          {/* Gallery */}
          <Pressable
            style={styles.quickCard}
            onPress={() => router.push('/gallery')}
          >
            <View style={[styles.quickIcon, styles.grayIcon]}>
              <Text style={styles.quickIconText}>
                🖼️
              </Text>
            </View>

            <Text style={styles.quickTitle}>
              Gallery
            </Text>

            <Text style={styles.quickSubtitle}>
              Photos & memories
            </Text>
          </Pressable>

          {/* Activities */}
          <Pressable
            style={styles.quickCard}
            onPress={() => router.push('/activities')}
          >
            <View style={[styles.quickIcon, styles.blackIcon]}>
              <Text style={styles.quickIconText}>
                🤝
              </Text>
            </View>

            <Text style={styles.quickTitle}>
              Activities
            </Text>

            <Text style={styles.quickSubtitle}>
              YMA activities
            </Text>
          </Pressable>

        </View>

        {/* Latest News */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Latest News
          </Text>

          <Pressable onPress={() => router.push('/news')}>
            <Text style={styles.viewAll}>
              View All
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.newsCard}
          onPress={() => router.push('/news')}
        >
          <LinearGradient
            colors={['#D32F2F', '#111111']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.newsDate}
          >
            <Text style={styles.newsMonth}>
              SEP
            </Text>

            <Text style={styles.newsDay}>
              26
            </Text>
          </LinearGradient>

          <View style={styles.newsContent}>
            <View style={styles.newsBadge}>
              <Text style={styles.newsBadgeText}>
                ANNOUNCEMENT
              </Text>
            </View>

            <Text style={styles.newsTitle}>
              YMA Salem Branch Important Announcement
            </Text>

            <Text
              style={styles.newsDescription}
              numberOfLines={2}
            >
              Important announcements and information
              from YMA Salem Branch will be shared here.
            </Text>
          </View>

          <Text style={styles.cardArrow}>
            ›
          </Text>
        </Pressable>

        {/* Upcoming Event */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Upcoming Event
          </Text>

          <Pressable onPress={() => router.push('/events')}>
            <Text style={styles.viewAll}>
              View All
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.eventCard}
          onPress={() => router.push('/events')}
        >
          <LinearGradient
            colors={['#D32F2F', '#111111']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.eventDateBox}
          >
            <Text style={styles.eventMonth}>
              SEP
            </Text>

            <Text style={styles.eventDay}>
              28
            </Text>
          </LinearGradient>

          <View style={styles.eventContent}>
            <Text style={styles.eventTitle}>
              YMA Salem Branch Programme
            </Text>

            <Text style={styles.eventInfo}>
              📍 Salem, Mizoram
            </Text>

            <Text style={styles.eventInfo}>
              🕒 Upcoming programme
            </Text>
          </View>

          <Text style={styles.cardArrow}>
            ›
          </Text>
        </Pressable>

        {/* Community Message */}
        <LinearGradient
          colors={['#D32F2F', '#0B0B0B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.messageCard}
        >
          <View style={styles.messageIcon}>
            <Text style={styles.messageIconText}>
              ♥
            </Text>
          </View>

          <View style={styles.messageContent}>
            <Text style={styles.messageTitle}>
              Together as a community
            </Text>

            <Text style={styles.messageText}>
              Stay connected with YMA Salem Branch through
              news, activities, programmes and updates.
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.bottomSpace} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  /* HEADER */

  header: {
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },

  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  brandArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  logoContainer: {
    width: 57,
    height: 57,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  logoImage: {
    width: 48,
    height: 48,
  },

  brandText: {
    marginLeft: 12,
  },

  orgName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },

  orgSubtitle: {
    color: '#F1F1F1',
    fontSize: 10,
    marginTop: 3,
  },

  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: '#FFFFFF22',
    alignItems: 'center',
    justifyContent: 'center',
  },

  notificationIcon: {
    fontSize: 19,
  },

  notificationDot: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#FF5252',
    top: 9,
    right: 10,
  },

  headerWelcome: {
    marginTop: 28,
  },

  headerWelcomeSmall: {
    color: '#F3CACA',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  headerWelcomeTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    marginTop: 4,
  },

  headerWelcomeText: {
    color: '#E8E8E8',
    fontSize: 11,
    marginTop: 5,
  },

  /* CONTENT */

  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
  },

  /* FEATURE */

  featureCard: {
    borderRadius: 22,
    overflow: 'hidden',
  },

  featureCardSpaced: {
    marginTop: 12,
  },

  featureGradient: {
    padding: 19,
  },

  featureTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#FFFFFF22',
    alignItems: 'center',
    justifyContent: 'center',
  },

  featureIconText: {
    fontSize: 23,
  },

  featureBadge: {
    backgroundColor: '#FFFFFF20',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
  },

  featureBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  featureTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    marginTop: 15,
  },

  featureDescription: {
    color: '#F0F0F0',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },

  featureBottom: {
    marginTop: 17,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: '#FFFFFF35',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  featureAction: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },

  featureArrow: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },

  /* GAS BOOKING */

  gasCard: {
    borderRadius: 22,
    overflow: 'hidden',
    marginTop: 12,
  },

  gasGradient: {
    padding: 19,
  },

  gasTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  gasIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#FFFFFF20',
    alignItems: 'center',
    justifyContent: 'center',
  },

  gasIconText: {
    fontSize: 23,
  },

  gasBadge: {
    backgroundColor: '#FFFFFF20',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
  },

  gasBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  gasTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    marginTop: 15,
  },

  gasDescription: {
    color: '#F0F0F0',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },

  gasBottom: {
    marginTop: 17,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: '#FFFFFF35',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  gasAction: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },

  gasArrow: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },

  /* SECTION */

  sectionHeader: {
    marginTop: 25,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionTitle: {
    color: '#111111',
    fontSize: 18,
    fontWeight: '900',
  },

  viewAll: {
    color: '#C62828',
    fontSize: 10,
    fontWeight: '900',
  },

  /* QUICK ACCESS */

  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  quickCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },

  quickIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  redIcon: {
    backgroundColor: '#FBEAEA',
  },

  darkIcon: {
    backgroundColor: '#EEEEEE',
  },

  grayIcon: {
    backgroundColor: '#F1F1F1',
  },

  blackIcon: {
    backgroundColor: '#E8E8E8',
  },

  quickIconText: {
    fontSize: 20,
  },

  quickTitle: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 10,
  },

  quickSubtitle: {
    color: '#777777',
    fontSize: 9,
    marginTop: 3,
  },

  /* NEWS */

  newsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },

  newsDate: {
    width: 55,
    height: 63,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  newsMonth: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },

  newsDay: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 1,
  },

  newsContent: {
    flex: 1,
    marginLeft: 12,
  },

  newsBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FBEAEA',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 5,
  },

  newsBadgeText: {
    color: '#C62828',
    fontSize: 7,
    fontWeight: '900',
  },

  newsTitle: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 6,
  },

  newsDescription: {
    color: '#777777',
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },

  /* EVENT */

  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },

  eventDateBox: {
    width: 55,
    height: 63,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  eventMonth: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },

  eventDay: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 1,
  },

  eventContent: {
    flex: 1,
    marginLeft: 12,
  },

  eventTitle: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '900',
  },

  eventInfo: {
    color: '#777777',
    fontSize: 9,
    marginTop: 5,
  },

  cardArrow: {
    color: '#999999',
    fontSize: 26,
    marginLeft: 6,
  },

  /* COMMUNITY */

  messageCard: {
    marginTop: 18,
    borderRadius: 20,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },

  messageIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFF22',
    alignItems: 'center',
    justifyContent: 'center',
  },

  messageIconText: {
    color: '#FFFFFF',
    fontSize: 18,
  },

  messageContent: {
    flex: 1,
    marginLeft: 12,
  },

  messageTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },

  messageText: {
    color: '#E5E5E5',
    fontSize: 9,
    lineHeight: 14,
    marginTop: 4,
  },

  bottomSpace: {
    height: 35,
  },
});