import {
  Alert,
  Image,
  Pressable,
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

type Member = {
  full_name: string | null;
  phone: string | null;
  email: string | null;
  section: string | null;
  branch_name: string | null;
  status: string | null;
  profile_photo: string | null;
  avatar_url?: string | null;
};

export default function ProfileScreen() {
  const [member, setMember] = useState<Member | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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

      const { data, error } = await supabase
        .from('members')
        .select(
          'full_name, phone, email, section, branch_name, status, profile_photo',
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
          branch_name: null,
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
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permission required',
          'Please allow photo library permission to choose your personal photo.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
        base64: true,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];

      await uploadProfilePhoto(
        asset.uri,
        asset.base64,
      );
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

  async function uploadProfilePhoto(
    uri: string,
    base64?: string | null,
  ) {
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

      if (!base64) {
        throw new Error(
          'Unable to read the selected photo. Please select the photo again.',
        );
      }

      // Convert Base64 → Uint8Array
      const binaryString =
        globalThis.atob(base64);

      const bytes = new Uint8Array(
        binaryString.length,
      );

      for (
        let i = 0;
        i < binaryString.length;
        i++
      ) {
        bytes[i] =
          binaryString.charCodeAt(i);
      }

      // Each member gets a separate folder.
      const fileName =
        `${user.id}/profile-${Date.now()}.jpg`;

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
              contentType:
                'image/jpeg',
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
            branch_name: null,
            status: null,
            profile_photo:
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
    'Salem YMA Member';

  const section =
    member?.section ||
    'Not assigned';

  const phone =
    member?.phone ||
    'Not added';

  const branch =
    member?.branch_name ||
    'Salem YMA Branch';

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
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backIcon}>
              ‹
            </Text>
          </Pressable>

          <View
            style={styles.headerLogoBox}
          >
            <Image
              source={require('../../assets/images/yma-logo.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          </View>
        </View>

        <Text style={styles.headerEyebrow}>
          YMA SALEM BRANCH
        </Text>

        <Text style={styles.headerTitle}>
          My Profile
        </Text>

        <Text style={styles.headerText}>
          Your Salem YMA member information
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
                  : require('../../assets/images/yma-logo.png')
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

      {/* Membership Status */}
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
                Salem YMA Member Database
              </Text>
            </View>
          </View>

          <Text
            style={styles.accountDescription}
          >
            Your profile is connected to
            your Salem YMA account. Member
            information shown here is
            loaded from the Salem YMA
            database.
          </Text>
        </LinearGradient>
      </View>

      {/* Footer */}
      <View style={styles.footerCard}>
        <View style={styles.footerLogoBox}>
          <Image
            source={require('../../assets/images/yma-logo.png')}
            style={styles.footerLogo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.footerTitle}>
          YMA SALEM BRANCH
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