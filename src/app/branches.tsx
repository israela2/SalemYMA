import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

import { supabase } from '../lib/supabase';

type BranchLeader = {
  id: number;
  position: string;
  full_name: string;
  phone: string | null;
  photo_url: string | null;
  display_order: number;
  is_active: boolean;
};

const leaderOrder = [
  'President',
  'Vice President',
  'Secretary',
  'Assistant Secretary',
  'Treasurer',
  'Assistant Treasurer',
];

const branchMapUrl =
  'https://maps.app.goo.gl/nZCj2FfrCNDXDQfd7';

export default function BranchesScreen() {
  const [leaders, setLeaders] = useState<BranchLeader[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBranchLeaders();
  }, []);

  async function loadBranchLeaders() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('branch_leaders')
        .select(
          'id, position, full_name, phone, photo_url, display_order, is_active'
        )
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.log('Branch leaders error:', error);
        setLeaders([]);
        return;
      }

      setLeaders((data ?? []) as BranchLeader[]);
    } catch (error) {
      console.log('Load branch leaders error:', error);
      setLeaders([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);

    try {
      await loadBranchLeaders();
    } finally {
      setRefreshing(false);
    }
  }

  async function openGoogleMaps() {
    try {
      await Linking.openURL(branchMapUrl);
    } catch (error) {
      console.log('Google Maps error:', error);
    }
  }

  function getLeader(position: string) {
    return leaders.find(
      (leader) =>
        leader.position.toLowerCase() === position.toLowerCase()
    );
  }

  function getPositionLabel(position: string) {
    switch (position) {
      case 'President':
        return 'BRANCH PRESIDENT';

      case 'Vice President':
        return 'BRANCH VICE PRESIDENT';

      case 'Secretary':
        return 'BRANCH SECRETARY';

      case 'Assistant Secretary':
        return 'ASSISTANT SECRETARY';

      case 'Treasurer':
        return 'BRANCH TREASURER';

      case 'Assistant Treasurer':
        return 'ASSISTANT TREASURER';

      default:
        return position.toUpperCase();
    }
  }

  async function callLeader(phone: string | null) {
    if (!phone) return;

    const cleanPhone = phone.replace(/\s+/g, '');

    try {
      await Linking.openURL(`tel:${cleanPhone}`);
    } catch (error) {
      console.log('Call error:', error);
    }
  }

  function LeaderCard({
    position,
  }: {
    position: string;
  }) {
    const leader = getLeader(position);

    return (
      <View style={styles.leaderCard}>
        <View style={styles.photoWrapper}>
          {leader?.photo_url ? (
            <Image
              source={{ uri: leader.photo_url }}
              style={styles.leaderPhoto}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderText}>
                👤
              </Text>
            </View>
          )}
        </View>

        <View style={styles.leaderInfo}>
          <Text style={styles.role}>
            {getPositionLabel(position)}
          </Text>

          <Text style={styles.leaderName}>
            {leader?.full_name?.trim()
              ? leader.full_name
              : 'Name not updated'}
          </Text>

          {leader?.phone ? (
            <Text style={styles.phone}>
              📞 {leader.phone}
            </Text>
          ) : (
            <Text style={styles.phoneMuted}>
              Phone number not updated
            </Text>
          )}
        </View>

        {leader?.phone ? (
          <Pressable
            style={({ pressed }) => [
              styles.callButton,
              pressed && styles.pressed,
            ]}
            onPress={() => callLeader(leader.phone)}
          >
            <Text style={styles.callIcon}>☎</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#C62828']}
          tintColor="#C62828"
        />
      }
    >
      {/* Header */}
      <LinearGradient
        colors={['#D32F2F', '#8E1B1B', '#0B0B0B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerSmall}>
              SALEM YMA
            </Text>

            <Text style={styles.headerTitle}>
              Branch Information
            </Text>

            <Text style={styles.headerText}>
              Salem YMA Branch
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Text style={styles.headerIconText}>
              SY
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Branch Overview */}
      <View style={styles.branchCard}>
        <LinearGradient
          colors={['#D32F2F', '#8E1B1B', '#0B0B0B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoCircle}
        >
          <Text style={styles.logoText}>
            SY
          </Text>
        </LinearGradient>

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
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <Text style={styles.sectionTitle}>
            Branch Hruaitu te
          </Text>

          <Text style={styles.sectionSubtitle}>
            Salem YMA Branch Leadership
          </Text>
        </View>

        <View style={styles.sectionHeaderRight}>
          <Pressable
            style={({ pressed }) => [
              styles.reloadButton,
              pressed && styles.pressed,
            ]}
            onPress={handleRefresh}
            disabled={refreshing}
          >
            <Text style={styles.reloadIcon}>
              ↻
            </Text>

            <Text style={styles.reloadText}>
              {refreshing ? 'Loading' : 'Reload'}
            </Text>
          </Pressable>

          <View style={styles.leaderCount}>
            <Text style={styles.leaderCountText}>
              {leaders.length}
            </Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator
            size="small"
            color="#C62828"
          />

          <Text style={styles.loadingText}>
            Loading branch leaders...
          </Text>
        </View>
      ) : (
        leaderOrder.map((position) => (
          <LeaderCard
            key={position}
            position={position}
          />
        ))
      )}

      {/* Branch Activities */}
      <Text style={styles.sectionTitleStandalone}>
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

      {/* Contact & Location */}
      <Text style={styles.sectionTitleStandalone}>
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

      {/* Map */}
      <View style={styles.mapCard}>
        <View style={styles.mapHeader}>
          <View style={styles.mapHeaderIcon}>
            <Text style={styles.mapHeaderIconText}>
              📍
            </Text>
          </View>

          <View style={styles.mapHeaderContent}>
            <Text style={styles.mapTitle}>
              Salem YMA Branch Location
            </Text>

            <Text style={styles.mapSubtitle}>
              Salem, Mizoram
            </Text>
          </View>
        </View>

        <View style={styles.mapWrapper}>
          <WebView
            source={{ uri: branchMapUrl }}
            style={styles.map}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            renderLoading={() => (
              <View style={styles.mapLoading}>
                <ActivityIndicator
                  size="small"
                  color="#C62828"
                />

                <Text style={styles.mapLoadingText}>
                  Loading map...
                </Text>
              </View>
            )}
          />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.openMapButton,
            pressed && styles.pressed,
          ]}
          onPress={openGoogleMaps}
        >
          <Text style={styles.openMapIcon}>
            🗺️
          </Text>

          <Text style={styles.openMapText}>
            Open in Google Maps
          </Text>
        </Pressable>
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
            Salem YMA Branch contact information
            will be updated through the admin system.
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
            Branch information will be maintained
            through the Salem YMA administration.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerTitle}>
          SALEM YMA
        </Text>

        <Text style={styles.footerSubtitle}>
          Young Mizo Association
        </Text>
      </View>

      <View style={{ height: 25 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  header: {
    paddingTop: 58,
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },

  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerSmall: {
    color: '#FFB4B4',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.7,
    marginBottom: 5,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
  },

  headerText: {
    color: '#F5DADA',
    fontSize: 12,
    marginTop: 5,
  },

  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerIconText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },

  branchCard: {
    marginHorizontal: 18,
    marginTop: 18,
    marginBottom: 22,
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },

  logoCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
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
    color: '#151515',
  },

  location: {
    fontSize: 11,
    color: '#777777',
    marginTop: 5,
  },

  activeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FBEAEA',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    marginTop: 7,
  },

  activeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#C62828',
    letterSpacing: 0.4,
  },

  sectionHeader: {
    marginHorizontal: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionHeaderLeft: {
    flex: 1,
  },

  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#151515',
  },

  sectionSubtitle: {
    fontSize: 10,
    color: '#888888',
    marginTop: 3,
  },

  reloadButton: {
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 17,
    backgroundColor: '#FBEAEA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F2CACA',
  },

  reloadIcon: {
    fontSize: 17,
    fontWeight: '900',
    color: '#C62828',
    marginRight: 4,
  },

  reloadText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#C62828',
  },

  leaderCount: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },

  leaderCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },

  loadingCard: {
    marginHorizontal: 18,
    padding: 22,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: '#777777',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 8,
  },

  leaderCard: {
    marginHorizontal: 18,
    marginBottom: 10,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 7,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  photoWrapper: {
    width: 68,
    height: 68,
    borderRadius: 34,
    overflow: 'hidden',
    backgroundColor: '#FBEAEA',
    borderWidth: 1,
    borderColor: '#F2CACA',
  },

  leaderPhoto: {
    width: '100%',
    height: '100%',
  },

  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBEAEA',
  },

  photoPlaceholderText: {
    fontSize: 29,
  },

  leaderInfo: {
    flex: 1,
    marginLeft: 13,
    marginRight: 8,
  },

  role: {
    fontSize: 8,
    fontWeight: '900',
    color: '#C62828',
    letterSpacing: 0.7,
  },

  leaderName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#151515',
    marginTop: 4,
  },

  phone: {
    fontSize: 10,
    color: '#777777',
    marginTop: 5,
    fontWeight: '600',
  },

  phoneMuted: {
    fontSize: 9,
    color: '#AAAAAA',
    marginTop: 5,
  },

  callButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FBEAEA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  callIcon: {
    fontSize: 17,
    color: '#C62828',
  },

  pressed: {
    opacity: 0.7,
  },

  sectionTitleStandalone: {
    fontSize: 19,
    fontWeight: '900',
    color: '#151515',
    marginHorizontal: 18,
    marginTop: 18,
    marginBottom: 12,
  },

  infoCard: {
    marginHorizontal: 18,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 7,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  infoIconBox: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: '#FBEAEA',
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
    fontWeight: '900',
    color: '#151515',
  },

  infoText: {
    fontSize: 10,
    color: '#6F6F6F',
    marginTop: 5,
    lineHeight: 16,
  },

  /* MAP */

  mapCard: {
    marginHorizontal: 18,
    marginBottom: 12,
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#000000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 7,
    paddingBottom: 12,
  },

  mapHeaderIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FBEAEA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  mapHeaderIconText: {
    fontSize: 20,
  },

  mapHeaderContent: {
    flex: 1,
    marginLeft: 11,
  },

  mapTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#151515',
  },

  mapSubtitle: {
    fontSize: 10,
    color: '#777777',
    marginTop: 3,
  },

  mapWrapper: {
    height: 260,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#EEEEEE',
  },

  map: {
    flex: 1,
  },

  mapLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },

  mapLoadingText: {
    fontSize: 10,
    color: '#777777',
    marginTop: 7,
  },

  openMapButton: {
    marginTop: 10,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#C62828',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  openMapIcon: {
    fontSize: 17,
    marginRight: 7,
  },

  openMapText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },

  contactCard: {
    marginHorizontal: 18,
    marginBottom: 10,
    padding: 15,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 7,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  contactIconBox: {
    width: 45,
    height: 45,
    borderRadius: 13,
    backgroundColor: '#FBEAEA',
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
    fontWeight: '900',
    color: '#151515',
  },

  contactText: {
    fontSize: 10,
    color: '#777777',
    marginTop: 4,
    lineHeight: 15,
  },

  footer: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 5,
  },

  footerTitle: {
    color: '#222222',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },

  footerSubtitle: {
    color: '#999999',
    fontSize: 9,
    marginTop: 4,
  },
});