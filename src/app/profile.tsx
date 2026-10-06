import {
  Alert,
  Image,
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';

import AppBackButton from '../components/AppBackButton';
type Member = {
  full_name: string | null;
  phone: string | null;
  email: string | null;
  section: string | null;
  branch_name: string | null;
  house_number: string | null;
  status: string | null;
  profile_photo: string | null;
  avatar_url?: string | null;
};

export default function ProfileScreen() {
  const [member, setMember] = useState<Member | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<Array<{
    full_name: string | null;
    relationship: string | null;
    house_number: string | null;
    phone: string | null;
    section: string | null;
  }>>([]);
  const [familyLoading, setFamilyLoading] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMember(null);
        setEmail('');
        return;
      }

      setEmail(user.email ?? '');

      setFamilyLoading(true);
      const { data: familyData, error: familyError } = await supabase
        .from('members')
        .select('full_name, relationship, house_number, phone, section')
        .eq('registered_by_user_id', user.id)
        .eq('registration_type', 'family_member')
        .order('full_name', { ascending: true });
      if (familyError) {
        console.log('Family members error:', familyError.message);
      }
      setFamilyMembers((familyData as typeof familyMembers) || []);
      setFamilyLoading(false);

      const { data, error } = await supabase
        .from('members')
        .select(
          'full_name, phone, email, section, branch_name, house_number, status, profile_photo',
        )
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.log('Profile error:', error.message);
      }

      const metadataPhoto =
        user.user_metadata?.profile_photo ||
        user.user_metadata?.avatar_url ||
        null;

      if (data) {
        setMember({
          ...(data as Member),
          profile_photo:
            data.profile_photo || metadataPhoto,
        });
      } else {
        setMember({
          full_name:
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            null,
          phone: user.user_metadata?.phone || null,
          email: user.email || null,
          section: user.user_metadata?.section || null,
          branch_name: 'YMA Salem Branch',
          house_number: user.user_metadata?.house_number || null,
          status: null,
          profile_photo: metadataPhoto,
        });
      }
    } catch (error) {
      console.log('Profile loading error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  // --------------------------------------------------
  // PICK PERSONAL PHOTO
  // --------------------------------------------------

  async function chooseProfilePhoto() {
    try {
      if (Platform.OS !== 'web') {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            'Permission required',
            'Please allow photo library permission to choose your personal photo.',
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];

      await uploadProfilePhoto(asset.uri);
    } catch (error: any) {
      console.log('Photo picker error:', error);

      Alert.alert(
        'Photo error',
        error?.message ||
          'Unable to select the photo.',
      );
    }
  }

  // --------------------------------------------------
  // UPLOAD PERSONAL PHOTO
  // --------------------------------------------------

  async function uploadProfilePhoto(uri: string) {
    try {
      setUploadingPhoto(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error(
          'No signed-in user found.',
        );
      }

      // Read the selected image the same way on web (blob URL) and native
      // (cached file URI). This avoids relying on picker base64 support.
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error('Unable to read the selected photo.');
      }
      const blob = await response.blob();
      const bytes = await blob.arrayBuffer();
      const contentType = blob.type || 'image/jpeg';
      const extension =
        contentType === 'image/png'
          ? 'png'
          : contentType === 'image/webp'
            ? 'webp'
            : 'jpg';

      // Each member gets a separate folder.
      const fileName =
        `${user.id}/profile-${Date.now()}.${extension}`;

      console.log(
        'Uploading profile photo:',
        fileName,
      );

      const { error: uploadError } =
        await supabase.storage
          .from('profile-photos')
          .upload(
            fileName,
            bytes,
            {
              contentType,
              cacheControl: '3600',
              upsert: true,
            },
          );

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      if (!publicUrl) {
        throw new Error(
          'Unable to create photo URL.',
        );
      }

      // Prevent old cached image from being displayed.
      const photoUrl =
        `${publicUrl}?v=${Date.now()}`;

      console.log(
        'Profile photo URL:',
        photoUrl,
      );

      // --------------------------------------------------
      // SAVE PHOTO URL TO MEMBERS TABLE
      // --------------------------------------------------

      const { error: memberError } =
        await supabase
          .from('members')
          .update({
            profile_photo: photoUrl,
          })
          .eq('user_id', user.id);

      if (memberError) {
        throw memberError;
      }

      // --------------------------------------------------
      // SAVE PHOTO URL TO AUTH METADATA
      // --------------------------------------------------

      const { error: authError } =
        await supabase.auth.updateUser({
          data: {
            profile_photo: photoUrl,
            avatar_url: photoUrl,
          },
        });

      if (authError) {
        console.log(
          'Auth photo metadata warning:',
          authError.message,
        );
      }

      // --------------------------------------------------
      // SHOW PHOTO IMMEDIATELY
      // --------------------------------------------------

      setMember((previous) => {
        if (!previous) {
          return {
            full_name:
              user.user_metadata
                ?.full_name || null,
            phone:
              user.user_metadata
                ?.phone || null,
            email:
              user.email || null,
            section:
              user.user_metadata
                ?.section || null,
            branch_name: 'YMA Salem Branch',
            house_number:
              user.user_metadata
                ?.house_number || null,
            status: null,
            profile_photo:
              photoUrl,
            avatar_url:
              photoUrl,
          };
        }

        return {
          ...previous,
          profile_photo: photoUrl,
          avatar_url: photoUrl,
        };
      });

      Alert.alert(
        'Photo updated',
        'Your personal profile photo has been updated successfully.',
      );
    } catch (error: any) {
      console.log(
        'Profile photo upload error:',
        error,
      );

      Alert.alert(
        'Upload failed',
        error?.message ||
          'Unable to upload your personal photo.',
      );
    } finally {
      setUploadingPhoto(false);
    }
  }

  const fullName =
    member?.full_name ||
    'YMA Salem Branch Member';

  const section =
    member?.section ||
    'Not assigned';

  const phone =
    member?.phone ||
    'Not added';

  const branch =
    member?.branch_name ||
    'YMA Salem Branch';

  const houseNumber =
    member?.house_number ||
    'Not assigned';

  const status =
    member?.status ||
    'Active Member';

  const isActive =
    status.toLowerCase() === 'active' ||
    status.toLowerCase() ===
      'active member';

  const displayEmail =
    member?.email ||
    email ||
    'Not added';

  const profilePhoto =
    member?.profile_photo ||
    member?.avatar_url ||
    null;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Premium Header */}
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
        <View style={styles.headerTop}>
          <AppBackButton />

          <View
            style={styles.headerLogoBox}
          >
            <Image
              source={require('../assets/yma-logo.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          </View>
        </View>

        <Text style={styles.headerEyebrow}>
          YMA Salem Branch
        </Text>

        <Text style={styles.headerTitle}>
          My Profile
        </Text>

        <Text style={styles.headerText}>
          Your YMA Salem Branch member information
        </Text>
      </LinearGradient>

      {/* Main Profile Card */}
      <LinearGradient
        colors={[
          '#D32F2F',
          '#8E1B1B',
          '#0B0B0B',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.profileCard}
      >
        <View style={styles.profileGlow} />

        {/* PERSONAL PROFILE PHOTO */}
        <View style={styles.avatarOuter}>
          <View style={styles.avatar}>
            <Image
              source={
                profilePhoto
                  ? {
                      uri: profilePhoto,
                    }
                  : require('../assets/yma-logo.png')
              }
              style={
                profilePhoto
                  ? styles.avatarPhoto
                  : styles.avatarLogo
              }
              resizeMode={
                profilePhoto
                  ? 'cover'
                  : 'contain'
              }
              onError={(event) => {
                console.log(
                  'PROFILE PHOTO IMAGE ERROR:',
                  event.nativeEvent.error,
                );
              }}
            />
          </View>
        </View>

        {/* CHANGE PHOTO */}
        <Pressable
          style={[
            styles.changePhotoButton,
            uploadingPhoto &&
              styles.changePhotoButtonDisabled,
          ]}
          onPress={chooseProfilePhoto}
          disabled={uploadingPhoto}
        >
          <Text
            style={styles.changePhotoText}
          >
            {uploadingPhoto
              ? 'UPLOADING...'
              : profilePhoto
              ? 'CHANGE PHOTO'
              : 'ADD PERSONAL PHOTO'}
          </Text>
        </Pressable>

        <Text style={styles.name}>
          {loading
            ? 'Loading...'
            : fullName}
        </Text>

        <Text style={styles.sectionText}>
          {loading
            ? 'Loading...'
            : section}
        </Text>

        <View style={styles.activeBadge}>
          <View
            style={[
              styles.activeDot,
              {
                backgroundColor:
                  isActive
                    ? '#2E7D5B'
                    : '#777777',
              },
            ]}
          />

          <Text
            style={[
              styles.activeText,
              {
                color: isActive
                  ? '#2E7D5B'
                  : '#777777',
              },
            ]}
          >
            {isActive
              ? 'ACTIVE MEMBER'
              : status.toUpperCase()}
          </Text>
        </View>

        <View
          style={styles.profileBranchLine}
        >
          <Text
            style={styles.profileBranchLabel}
          >
            BRANCH
          </Text>

          <Text
            style={styles.profileBranchValue}
          >
            {branch}
          </Text>
        </View>
      </LinearGradient>

      {/* Personal Information */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionAccent} />

        <View>
          <Text
            style={styles.sectionTitle}
          >
            Personal Information
          </Text>

          <Text
            style={styles.sectionSubtitle}
          >
            Your registered account details
          </Text>
        </View>
      </View>

      <InfoCard
        icon="👤"
        label="Full Name"
        value={
          loading
            ? 'Loading...'
            : fullName
        }
      />

      <InfoCard
        icon="✉"
        label="Email Address"
        value={
          loading
            ? 'Loading...'
            : displayEmail
        }
      />

      <InfoCard
        icon="📱"
        label="Phone Number"
        value={
          loading
            ? 'Loading...'
            : phone
        }
      />

      <InfoCard
        icon="▦"
        label="Section"
        value={
          loading
            ? 'Loading...'
            : section
        }
        badge
      />

      <InfoCard
        icon="⌖"
        label="Branch"
        value={
          loading
            ? 'Loading...'
            : branch
        }
      />

      <InfoCard
        icon="⌂"
        label="House Number"
        value={
          loading
            ? 'Loading...'
            : houseNumber
        }
        badge
      />

      {/* Register Family Member */}
      <Pressable
        onPress={() => router.push('/register-family-member')}
        style={styles.familyRegisterCard}
        activeOpacity={0.85}
      >
        <View style={styles.familyRegisterIcon}>
          <Text style={styles.familyRegisterIconText}>+</Text>
        </View>
        <View style={styles.familyRegisterContent}>
          <Text style={styles.familyRegisterTitle}>Register Family Member</Text>
          <Text style={styles.familyRegisterSubtitle}>
            I member nih chuan in chhungte, nu leh pa te pawh register ve theih a ni.
          </Text>
        </View>
        <Text style={styles.familyRegisterArrow}>›</Text>
      </Pressable>

      {/* My Family Members */}
      <View style={styles.familyListCard}>
        <View style={styles.familyListHeader}>
          <View style={styles.familyListIcon}>
            <Text style={styles.familyListIconText}>👨‍👩‍👧‍👦</Text>
          </View>
          <View style={styles.familyListHeaderText}>
            <Text style={styles.familyListTitle}>My Family Members</Text>
            <Text style={styles.familyListSubtitle}>I member-in register sak te</Text>
          </View>
          <View style={styles.familyCountPill}>
            <Text style={styles.familyCountText}>{familyMembers.length}</Text>
          </View>
        </View>

        {familyLoading ? (
          <Text style={styles.familyEmptyText}>Loading family members...</Text>
        ) : familyMembers.length === 0 ? (
          <View style={styles.familyEmptyBox}>
            <Text style={styles.familyEmptyText}>Family member register sak la i awm lo.</Text>
          </View>
        ) : (
          <View style={styles.familyList}>
            {familyMembers.map((item, index) => (
              <View key={`${item.full_name || 'member'}-${index}`} style={styles.familyMemberRow}>
                <View style={styles.familyAvatar}>
                  <Text style={styles.familyAvatarText}>
                    {(item.full_name || '?').trim().charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.familyMemberInfo}>
                  <Text style={styles.familyMemberName} numberOfLines={1}>
                    {item.full_name || 'Unnamed member'}
                  </Text>
                  <Text style={styles.familyMemberMeta}>
                    {item.relationship || 'Family'} • {item.house_number || houseNumber}
                  </Text>
                  <Text style={styles.familyMemberMetaSmall}>
                    {item.section || 'Section not assigned'}{item.phone ? ` • ${item.phone}` : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.infoCard}>
        <View style={styles.iconBox}>
          <Text style={styles.icon}>
            ✓
          </Text>
        </View>

        <View style={styles.infoContent}>
          <Text style={styles.label}>
            Membership Status
          </Text>

          <Text style={styles.value}>
            {loading
              ? 'Loading...'
              : status}
          </Text>
        </View>

        <View
          style={[
            styles.statusPill,
            {
              backgroundColor:
                isActive
                  ? '#E8F5EE'
                  : '#F1F1F1',
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  isActive
                    ? '#2E7D5B'
                    : '#888888',
              },
            ]}
          />

          <Text
            style={[
              styles.statusPillText,
              {
                color: isActive
                  ? '#2E7D5B'
                  : '#777777',
              },
            ]}
          >
            {loading
              ? '...'
              : isActive
              ? 'ACTIVE'
              : status.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Account Information */}
      <View style={styles.accountCard}>
        <LinearGradient
          colors={[
            '#FBEAEA',
            '#FFFFFF',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.accountGradient}
        >
          <View style={styles.accountHeader}>
            <View
              style={styles.accountIconBox}
            >
              <Text
                style={styles.accountIcon}
              >
                ✓
              </Text>
            </View>

            <View
              style={styles.accountHeaderText}
            >
              <Text
                style={styles.accountTitle}
              >
                Account Connected
              </Text>

              <Text
                style={styles.accountSubtitle}
              >
                YMA Salem Branch Member Database
              </Text>
            </View>
          </View>

          <Text
            style={styles.accountDescription}
          >
            Your profile is connected to
            your YMA Salem Branch account. Member
            information shown here is
            loaded from the YMA Salem Branch
            database.
          </Text>
        </LinearGradient>
      </View>

      {/* Footer */}
      <View style={styles.footerCard}>
        <View style={styles.footerLogoBox}>
          <Image
            source={require('../assets/yma-logo.png')}
            style={styles.footerLogo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.footerTitle}>
          YMA Salem Branch
        </Text>

        <Text
          style={styles.footerSubtitle}
        >
          Young Mizo Association
        </Text>

        <View style={styles.footerDivider} />

      </View>

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

function InfoCard({
  icon,
  label,
  value,
  badge = false,
}: {
  icon: string;
  label: string;
  value: string;
  badge?: boolean;
}) {
  return (
    <View style={styles.infoCard}>
      <View style={styles.iconBox}>
        <Text style={styles.icon}>
          {icon}
        </Text>
      </View>

      <View style={styles.infoContent}>
        <Text style={styles.label}>
          {label}
        </Text>

        <Text style={styles.value}>
          {value}
        </Text>
      </View>

      {badge && (
        <View
          style={styles.sectionBadge}
        >
          <Text
            style={styles.sectionBadgeText}
          >
            SECTION
          </Text>
        </View>
      )}
    </View>
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
    paddingBottom: 27,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },

  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
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
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF25',
  },

  headerLogo: {
    width: 29,
    height: 29,
    opacity: 0.9,
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

  profileCard: {
    marginHorizontal: 18,
    marginTop: 18,
    paddingTop: 25,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderRadius: 24,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    elevation: 7,
  },

  profileGlow: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#FFFFFF12',
    top: -75,
    right: -55,
  },

  avatarOuter: {
    width: 98,
    height: 98,
    borderRadius: 49,
    padding: 4,
    backgroundColor: '#FFFFFF35',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 5,
  },

  avatarLogo: {
    width: 71,
    height: 71,
  },

  avatarPhoto: {
    width: 90,
    height: 90,
  },

  changePhotoButton: {
    marginTop: 10,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 15,
    backgroundColor: '#FFFFFF20',
    borderWidth: 1,
    borderColor: '#FFFFFF45',
  },

  changePhotoButtonDisabled: {
    opacity: 0.55,
  },

  changePhotoText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  name: {
    fontSize: 21,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 12,
    textAlign: 'center',
  },

  sectionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F2DADA',
    marginTop: 5,
  },

  activeBadge: {
    marginTop: 13,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },

  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },

  activeText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  profileBranchLine: {
    width: '100%',
    marginTop: 18,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: '#FFFFFF25',
    alignItems: 'center',
  },

  profileBranchLabel: {
    color: '#F7CACA',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  profileBranchValue: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
  },

  sectionHeader: {
    marginHorizontal: 18,
    marginTop: 26,
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

  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111111',
  },

  sectionSubtitle: {
    color: '#999999',
    fontSize: 9,
    marginTop: 3,
  },

  infoCard: {
    marginHorizontal: 18,
    marginBottom: 10,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E7E7E7',
    shadowColor: '#000000',
    shadowOpacity: 0.045,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 2,
  },

  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FBEAEA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  icon: {
    fontSize: 19,
  },

  infoContent: {
    flex: 1,
    marginLeft: 12,
  },

  label: {
    fontSize: 8,
    fontWeight: '900',
    color: '#999999',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },

  value: {
    fontSize: 14,
    fontWeight: '800',
    color: '#171717',
    marginTop: 4,
  },

  sectionBadge: {
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 7,
    backgroundColor: '#F3F3F3',
    marginLeft: 7,
  },

  sectionBadgeText: {
    color: '#777777',
    fontSize: 6,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 11,
    marginLeft: 7,
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },

  statusPillText: {
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  accountCard: {
    marginHorizontal: 18,
    marginTop: 9,
    borderRadius: 19,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E9D0D0',
  },

  accountGradient: {
    padding: 17,
  },

  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  accountIconBox: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: '#C62828',
    alignItems: 'center',
    justifyContent: 'center',
  },

  accountIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },

  accountHeaderText: {
    flex: 1,
    marginLeft: 11,
  },

  accountTitle: {
    color: '#111111',
    fontSize: 12,
    fontWeight: '900',
  },

  accountSubtitle: {
    color: '#999999',
    fontSize: 8,
    marginTop: 3,
  },

  accountDescription: {
    color: '#777777',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 13,
  },

  familyListCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9E9E9',
    borderRadius: 18,
    padding: 15,
    marginBottom: 14,
  },
  familyListHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  familyListIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#FFF1F1', alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  familyListIconText: { fontSize: 20 },
  familyListHeaderText: { flex: 1 },
  familyListTitle: { color: '#7F1D1D', fontSize: 14, fontWeight: '900' },
  familyListSubtitle: { color: '#888', fontSize: 10, marginTop: 3 },
  familyCountPill: { minWidth: 32, height: 28, borderRadius: 14, backgroundColor: '#C62828', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 9 },
  familyCountText: { color: '#FFF', fontSize: 12, fontWeight: '900' },
  familyList: { gap: 8 },
  familyMemberRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAFA', borderRadius: 14, padding: 10, borderWidth: 1, borderColor: '#F0F0F0' },
  familyAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#C62828', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  familyAvatarText: { color: '#FFF', fontSize: 15, fontWeight: '900' },
  familyMemberInfo: { flex: 1 },
  familyMemberName: { color: '#222', fontSize: 13, fontWeight: '900' },
  familyMemberMeta: { color: '#666', fontSize: 10, marginTop: 3, fontWeight: '700' },
  familyMemberMetaSmall: { color: '#999', fontSize: 9, marginTop: 2 },
  familyEmptyBox: { backgroundColor: '#FAFAFA', borderRadius: 12, padding: 12 },
  familyEmptyText: { color: '#888', fontSize: 10, textAlign: 'center', paddingVertical: 5 },

  familyRegisterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7F7',
    borderWidth: 1,
    borderColor: '#F0C8C8',
    borderRadius: 18,
    padding: 15,
    marginBottom: 14,
  },
  familyRegisterIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#C62828',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  familyRegisterIconText: { color: '#FFF', fontSize: 27, fontWeight: '300', lineHeight: 30 },
  familyRegisterContent: { flex: 1 },
  familyRegisterTitle: { color: '#7F1D1D', fontSize: 14, fontWeight: '900' },
  familyRegisterSubtitle: { color: '#777', fontSize: 11, lineHeight: 17, marginTop: 3 },
  familyRegisterArrow: { color: '#C62828', fontSize: 28, fontWeight: '300', marginLeft: 8 },

  footerCard: {
    marginHorizontal: 18,
    marginTop: 17,
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#111111',
    alignItems: 'center',
  },

  footerLogoBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  footerLogo: {
    width: 31,
    height: 31,
  },

  footerTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },

  footerSubtitle: {
    color: '#BDBDBD',
    fontSize: 9,
    marginTop: 4,
  },

  footerDivider: {
    width: 35,
    height: 2,
    borderRadius: 2,
    backgroundColor: '#C62828',
    marginTop: 11,
    marginBottom: 8,
  },

  footerText: {
    color: '#BDBDBD',
    fontSize: 9,
    fontWeight: '600',
  },

  bottomSpace: {
    height: 35,
  },
});