import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

import { supabase } from '../lib/supabase';

import AppBackButton from '../components/AppBackButton';
type BranchLeader = {
  id: number;
  position: string;
  full_name: string;
  phone: string | null;
  photo_url: string | null;
  display_order: number;
  is_active: boolean;
};

type SectionLeader = {
  id: number;
  section: string;
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
  'Financial Secretary',
];

const sectionNames = [
  'Section I',
  'Section II',
  'Section III',
];

const branchMapUrl =
  'https://maps.app.goo.gl/nZCj2FfrCNDXDQfd7';

const legacyBranchPositionMap: Record<string, string> = {
  Leader: 'President',
  'Assistant Leader': 'Vice President',
  President: 'President',
  'Vice President': 'Vice President',
  Secretary: 'Secretary',
  'Assistant Secretary': 'Assistant Secretary',
  Treasurer: 'Treasurer',
  'Assistant Treasurer': 'Financial Secretary',
  'Finance Secretary': 'Financial Secretary',
  'Financial Secretary': 'Financial Secretary',
};

function normalizeBranchLeader(leader: BranchLeader): BranchLeader {
  return {
    ...leader,
    position: legacyBranchPositionMap[leader.position] ?? leader.position,
  };
}

const legacySectionPositionMap: Record<string, string> = {
  President: 'Leader',
  'Vice President': 'Assistant Leader',
  Secretary: 'Secretary',
  'Assistant Secretary': 'Assistant Secretary',
  Treasurer: 'Treasurer',
  'Assistant Treasurer': 'Finance Secretary',
};

function normalizeSectionLeader(leader: SectionLeader): SectionLeader {
  return {
    ...leader,
    position:
      legacySectionPositionMap[leader.position] ?? leader.position,
  };
}

export default function BranchesScreen() {
  const [leaders, setLeaders] = useState<BranchLeader[]>([]);
  const [sectionLeaders, setSectionLeaders] = useState<SectionLeader[]>([]);
  const [memberStats, setMemberStats] = useState({ total: 0, mipa: 0, hmeichhia: 0 });
  const [selectedSection, setSelectedSection] = useState('Section I');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<{ uri: string; name: string; role: string } | null>(null);

  useEffect(() => {
    loadBranchLeaders();
  }, []);

  async function loadBranchLeaders() {
    try {
      setLoading(true);

      const [branchResult, sectionResult, memberResult, adminResult] = await Promise.all([
        supabase
          .from('branch_leaders')
          .select(
            'id, position, full_name, phone, photo_url, display_order, is_active'
          )
          .eq('is_active', true)
          .order('display_order', { ascending: true }),

        supabase
          .from('section_leaders')
          .select(
            'id, section, position, full_name, phone, photo_url, display_order, is_active'
          )
          .eq('is_active', true)
          .order('section', { ascending: true })
          .order('display_order', { ascending: true }),
              supabase
          .from('members')
          .select('user_id, gender, status, branch_name')
          .in('branch_name', ['Salem YMA Branch', 'YMA Salem Branch']),

        // Approved Full Admins and Cemetery Admins are also YMA members.
        // Use user_id to avoid counting an admin twice if they already have
        // a row in members.
        supabase
          .from('admins')
          .select('user_id')
          .eq('status', 'approved')
          .in('role', ['full_admin', 'cemetery_admin']),
      ]);

      if (branchResult.error) {
        console.log(
          'Branch leaders error:',
          branchResult.error
        );
        setLeaders([]);
      } else {
        setLeaders(
          ((branchResult.data ?? []) as BranchLeader[]).map(normalizeBranchLeader)
        );
      }

      if (memberResult.error) {
        console.log('Member statistics error:', memberResult.error);
        setMemberStats({ total: 0, mipa: 0, hmeichhia: 0 });
      } else {
        const activeMembers = (memberResult.data ?? []).filter(
          (member: any) => (member.status ?? 'Active') === 'Active'
        );

        const memberByUserId = new Map<string, any>();
        activeMembers.forEach((member: any) => {
          if (member.user_id) memberByUserId.set(member.user_id, member);
          else memberByUserId.set(`member-${member.id ?? member.full_name}-${member.phone ?? ''}`, member);
        });

        // Admin accounts are members too. If an admin already has a members
        // row, the Map prevents double-counting.
        (adminResult.data ?? []).forEach((admin: any) => {
          if (admin.user_id && !memberByUserId.has(admin.user_id)) {
            memberByUserId.set(admin.user_id, {
              user_id: admin.user_id,
              gender: null,
              status: 'Active',
            });
          }
        });

        // Same rule as Admin Panel Member List: members + approved admins, de-duplicated by user_id.
      const allMembers = Array.from(memberByUserId.values());
        setMemberStats({
          total: allMembers.length,
          mipa: allMembers.filter((member: any) => member.gender === 'Mipa').length,
          hmeichhia: allMembers.filter((member: any) => member.gender === 'Hmeichhia').length,
        });
      }

      if (sectionResult.error) {
        console.log(
          'Section leaders error:',
          sectionResult.error
        );
        setSectionLeaders([]);
      } else {
        setSectionLeaders(
          (sectionResult.data ?? [])
            .map((leader) => normalizeSectionLeader(leader as SectionLeader))
        );
      }
    } catch (error) {
      console.log(
        'Load branch leaders error:',
        error
      );

      setLeaders([]);
      setSectionLeaders([]);
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
      console.log(
        'Google Maps error:',
        error
      );
    }
  }

  function getLeader(position: string) {
    return leaders.find(
      (leader) =>
        leader.position.toLowerCase() ===
        position.toLowerCase()
    );
  }

  function getPositionLabel(position: string) {
    return position.toUpperCase();
  }

  async function callLeader(
    phone: string | null
  ) {
    if (!phone) return;

    const cleanPhone = phone.replace(
      /\s+/g,
      ''
    );

    try {
      await Linking.openURL(
        `tel:${cleanPhone}`
      );
    } catch (error) {
      console.log(
        'Call error:',
        error
      );
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
            <Pressable
              style={styles.photoPressable}
              onPress={() =>
                setSelectedPhoto({
                  uri: leader.photo_url!,
                  name: leader.full_name?.trim() || 'Branch Leader',
                  role: position,
                })
              }
              accessibilityRole="button"
              accessibilityLabel={`View full photo of ${leader.full_name || position}`}
            >
              <Image
                source={{
                  uri: leader.photo_url,
                }}
                style={styles.leaderPhoto}
                resizeMode="cover"
              />
            </Pressable>
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text
                style={
                  styles.photoPlaceholderText
                }
              >
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
            onPress={() =>
              callLeader(leader.phone)
            }
          >
            <Text style={styles.callIcon}>
              ☎
            </Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  function SectionLeaderCard({
    leader,
  }: {
    leader: SectionLeader;
  }) {
    return (
      <View style={styles.sectionLeaderCard}>
        <View style={styles.photoWrapper}>
          {leader.photo_url ? (
            <Pressable
              style={styles.photoPressable}
              onPress={() =>
                setSelectedPhoto({
                  uri: leader.photo_url!,
                  name: leader.full_name?.trim() || 'Section Leader',
                  role: leader.position,
                })
              }
              accessibilityRole="button"
              accessibilityLabel={`View full photo of ${leader.full_name || leader.position}`}
            >
              <Image
                source={{
                  uri: leader.photo_url,
                }}
                style={styles.leaderPhoto}
                resizeMode="cover"
              />
            </Pressable>
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text
                style={
                  styles.photoPlaceholderText
                }
              >
                👤
              </Text>
            </View>
          )}
        </View>

        <View style={styles.leaderInfo}>
          <Text style={styles.role}>
            {leader.position.toUpperCase()}
          </Text>

          <Text style={styles.leaderName}>
            {leader.full_name?.trim()
              ? leader.full_name
              : 'Name not updated'}
          </Text>

          {leader.phone ? (
            <Text style={styles.phone}>
              📞 {leader.phone}
            </Text>
          ) : (
            <Text style={styles.phoneMuted}>
              Phone number not updated
            </Text>
          )}
        </View>

        {leader.phone ? (
          <Pressable
            style={({ pressed }) => [
              styles.callButton,
              pressed && styles.pressed,
            ]}
            onPress={() =>
              callLeader(leader.phone)
            }
          >
            <Text style={styles.callIcon}>
              ☎
            </Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  const selectedSectionLeaders =
    sectionLeaders
      .filter(
        (leader) =>
          leader.section === selectedSection
      )
      .sort(
        (a, b) =>
          a.display_order -
          b.display_order
      );

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
        colors={[
          '#D32F2F',
          '#8E1B1B',
          '#0B0B0B',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <AppBackButton />

        <View style={styles.headerTop}>
          <View>
  

            <Text style={styles.headerTitle}>
              Branch Information
            </Text>

            <Text style={styles.headerText}>
              YMA Salem Branch
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Image
              source={require('../assets/yma-logo.png')}
              style={styles.headerLogoImage}
              resizeMode="contain"
            />
          </View>
        </View>
      </LinearGradient>

      {/* Branch Overview */}
      <View style={styles.branchCard}>
        <View style={styles.logoCircle}>
          <Image
            source={require('../assets/yma-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.branchInfo}>
          <Text style={styles.branchName}>
            YMA Salem Branch
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

      {/* Branch Members */}
      <View style={styles.memberStatsCard}>
        <Text style={styles.memberStatsEyebrow}>YMA Salem Branch MEMBER</Text>
        <Text style={styles.memberStatsTitle}>TOTAL MEMBERS</Text>
        <Text style={styles.memberTotal}>{memberStats.total}</Text>

        <View style={styles.memberGenderRow}>
          <View style={styles.memberGenderCard}>
            <Text style={styles.memberGenderNumber}>{memberStats.mipa}</Text>
            <Text style={styles.memberGenderLabel}>MIPA</Text>
          </View>
          <View style={styles.memberGenderCard}>
            <Text style={styles.memberGenderNumber}>{memberStats.hmeichhia}</Text>
            <Text style={styles.memberGenderLabel}>HMEICHHIA</Text>
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
            YMA Salem Branch Leadership
          </Text>
        </View>

        <View
          style={styles.sectionHeaderRight}
        >
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
              {refreshing
                ? 'Loading'
                : 'Reload'}
            </Text>
          </Pressable>

          <View style={styles.leaderCount}>
            <Text
              style={
                styles.leaderCountText
              }
            >
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

      {/* Section Hruaitute */}
      <View
        style={[
          styles.sectionHeader,
          styles.sectionLeadersHeader,
        ]}
      >
        <View style={styles.sectionHeaderLeft}>
          <Text style={styles.sectionTitle}>
            Section Hruaitute
          </Text>

          <Text style={styles.sectionSubtitle}>
            Section hrang hrangah hruaitu 6-te
          </Text>
        </View>
      </View>

      {/* Section Tabs */}
      <View style={styles.sectionTabs}>
        {sectionNames.map(
          (sectionName) => {
            const isSelected =
              selectedSection ===
              sectionName;

            return (
              <Pressable
                key={sectionName}
                style={[
                  styles.sectionTab,
                  isSelected &&
                    styles.sectionTabActive,
                ]}
                onPress={() =>
                  setSelectedSection(
                    sectionName
                  )
                }
              >
                <Text
                  style={[
                    styles.sectionTabText,
                    isSelected &&
                      styles.sectionTabTextActive,
                  ]}
                >
                  {sectionName}
                </Text>
              </Pressable>
            );
          }
        )}
      </View>

      {/* Selected Section */}
      <View style={styles.selectedSectionCard}>
        <View
          style={styles.selectedSectionHeader}
        >
          <View>
            <Text
              style={
                styles.selectedSectionTitle
              }
            >
              {selectedSection}
            </Text>

            <Text
              style={
                styles.selectedSectionSubtitle
              }
            >
              Section Hruaitu 6-te
            </Text>
          </View>

          <View
            style={
              styles.selectedSectionCount
            }
          >
            <Text
              style={
                styles.selectedSectionCountText
              }
            >
              {selectedSectionLeaders.length}/6
            </Text>
          </View>
        </View>

        {selectedSectionLeaders.length >
        0 ? (
          selectedSectionLeaders.map(
            (leader) => (
              <SectionLeaderCard
                key={leader.id}
                leader={leader}
              />
            )
          )
        ) : (
          <View
            style={styles.emptySection}
          >
            <Text
              style={
                styles.emptySectionIcon
              }
            >
              👥
            </Text>

            <Text
              style={
                styles.emptySectionTitle
              }
            >
              No section hruaitu yet
            </Text>

            <Text
              style={
                styles.emptySectionText
              }
            >
              {selectedSection} hruaitu 6-te
              admin system hmangin dah
              theih an ni.
            </Text>
          </View>
        )}
      </View>

      {/* Branch Activities */}
      <Text
        style={styles.sectionTitleStandalone}
      >
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
            YMA Salem Branch Activities
          </Text>

          <Text style={styles.infoText}>
            Branch hmalakna, community
            service, programme leh member
            activity te hetah hian kan dah
            ang.
          </Text>
        </View>
      </View>

      {/* Contact & Location */}
      <Text
        style={styles.sectionTitleStandalone}
      >
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
            <Text
              style={
                styles.mapHeaderIconText
              }
            >
              📍
            </Text>
          </View>

          <View
            style={styles.mapHeaderContent}
          >
            <Text style={styles.mapTitle}>
              YMA Salem Branch Location
            </Text>

            <Text
              style={styles.mapSubtitle}
            >
              Salem, Mizoram
            </Text>
          </View>
        </View>

        <View style={styles.mapWrapper}>
          {Platform.OS === 'web' ? (
            <iframe
              title="YMA Salem Branch Location"
              src={branchMapUrl}
              style={styles.webMap as any}
              loading="lazy"
            />
          ) : (
            <WebView
              source={{ uri: branchMapUrl }}
              style={styles.map}
              javaScriptEnabled
              domStorageEnabled
              startInLoadingState
              renderLoading={() => (
                <View style={styles.mapLoading}>
                  <ActivityIndicator size="small" color="#C62828" />
                  <Text style={styles.mapLoadingText}>Loading map...</Text>
                </View>
              )}
            />
          )}
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
            YMA Salem Branch contact
            information will be updated
            through the admin system.
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
            Branch information will be
            maintained through the Salem
            YMA administration.
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerTitle}>
          YMA Salem Branch
        </Text>

        <Text
          style={styles.footerSubtitle}
        >
          Young Mizo Association
        </Text>
      </View>

      <View style={{ height: 25 }} />

      <Modal
        visible={!!selectedPhoto}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={styles.photoPreviewOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setSelectedPhoto(null)}
            accessibilityRole="button"
            accessibilityLabel="Close photo preview"
          />

          <View style={styles.photoPreviewCard}>
            <View style={styles.photoPreviewHeader}>
              <View style={styles.photoPreviewTitleWrap}>
                <Text style={styles.photoPreviewRole}>
                  {selectedPhoto?.role?.toUpperCase() || 'LEADER'}
                </Text>
                <Text style={styles.photoPreviewName} numberOfLines={2}>
                  {selectedPhoto?.name || ''}
                </Text>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.photoPreviewClose,
                  pressed && styles.pressed,
                ]}
                onPress={() => setSelectedPhoto(null)}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Text style={styles.photoPreviewCloseText}>×</Text>
              </Pressable>
            </View>

            <View style={styles.photoPreviewImageWrap}>
              {selectedPhoto?.uri ? (
                <Image
                  source={{ uri: selectedPhoto.uri }}
                  style={styles.photoPreviewImage}
                  resizeMode="contain"
                />
              ) : null}
            </View>

            <Text style={styles.photoPreviewHint}>
              Tap outside or × to close
            </Text>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: '#FFFFFF22',
    borderWidth: 1,
    borderColor: '#FFFFFF33',
  },

  backButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
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
    backgroundColor:
      'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerIconText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },

  headerLogoImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },

  memberStatsCard: {
    marginHorizontal: 18,
    marginBottom: 22,
    padding: 20,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    elevation: 3,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  memberStatsEyebrow: {
    color: '#C62828',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  memberStatsTitle: {
    color: '#151515',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 5,
  },
  memberTotal: {
    color: '#C62828',
    fontSize: 42,
    fontWeight: '900',
    marginTop: 2,
  },
  memberGenderRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  memberGenderCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
  },
  memberGenderNumber: {
    color: '#151515',
    fontSize: 24,
    fontWeight: '900',
  },
  memberGenderLabel: {
    color: '#777777',
    fontSize: 10,
    fontWeight: '900',
    marginTop: 2,
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

  logoImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
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

  sectionLeadersHeader: {
    marginTop: 8,
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

  sectionLeaderCard: {
    marginHorizontal: 12,
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

  photoPressable: {
    flex: 1,
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

  photoPreviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.86)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },

  photoPreviewCard: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '92%',
    borderRadius: 22,
    backgroundColor: '#111111',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },

  photoPreviewHeader: {
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.10)',
  },

  photoPreviewTitleWrap: {
    flex: 1,
    paddingRight: 12,
  },

  photoPreviewRole: {
    color: '#FFB4B4',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  photoPreviewName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 3,
  },

  photoPreviewClose: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },

  photoPreviewCloseText: {
    color: '#FFFFFF',
    fontSize: 26,
    lineHeight: 28,
    fontWeight: '300',
  },

  photoPreviewImageWrap: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: 560,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  photoPreviewImage: {
    width: '100%',
    height: '100%',
  },

  photoPreviewHint: {
    textAlign: 'center',
    color: '#AAAAAA',
    fontSize: 10,
    paddingTop: 9,
    paddingBottom: 11,
  },

  /* SECTION TABS */

  sectionTabs: {
    marginHorizontal: 18,
    marginBottom: 14,
    flexDirection: 'row',
    gap: 8,
  },

  sectionTab: {
    flex: 1,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionTabActive: {
    backgroundColor: '#C62828',
    borderColor: '#C62828',
  },

  sectionTabText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#666666',
  },

  sectionTabTextActive: {
    color: '#FFFFFF',
  },

  selectedSectionCard: {
    marginHorizontal: 18,
    marginBottom: 18,
    paddingTop: 14,
    paddingBottom: 4,
    borderRadius: 18,
    backgroundColor: '#F8F8F8',
  },

  selectedSectionHeader: {
    marginHorizontal: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  selectedSectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#151515',
  },

  selectedSectionSubtitle: {
    fontSize: 9,
    color: '#888888',
    marginTop: 3,
  },

  selectedSectionCount: {
    backgroundColor: '#FBEAEA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },

  selectedSectionCountText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#C62828',
  },

  emptySection: {
    marginHorizontal: 12,
    marginBottom: 12,
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptySectionIcon: {
    fontSize: 30,
    marginBottom: 8,
  },

  emptySectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#333333',
  },

  emptySectionText: {
    marginTop: 5,
    fontSize: 10,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 15,
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

  webMap: { width: '100%', height: '100%', borderWidth: 0 },

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
