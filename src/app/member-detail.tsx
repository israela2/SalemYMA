import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';

type Member = {
  id: number;
  full_name: string | null;
  phone: string | null;
  gender: string | null;
  email: string | null;
  section: string | null;
  branch_name: string | null;
  status: string | null;
  house_number: string | null;
};

const sections = [
  'Section - I',
  'Section - II',
  'Section - III',
];

const statuses = ['Active', 'Inactive'];

export default function MemberDetailScreen() {
  const params = useLocalSearchParams();
  const memberId = String(params.id ?? '');

  const [member, setMember] = useState<Member | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState('');
  const [section, setSection] = useState('');
  const [branch, setBranch] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [status, setStatus] = useState('Active');

  const [message, setMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadMember();
  }, [memberId]);

  async function loadMember() {
    if (!memberId) {
      setMessage('Member ID a awm lo.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setMessage('');

    const { data, error } = await supabase
      .from('members')
      .select(
        'id, full_name, phone, email, gender, section, branch_name, house_number, status'
      )
      .eq('id', memberId)
      .maybeSingle();

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (!data) {
      setMessage('Member hi hmuh theih lo.');
      setLoading(false);
      return;
    }

    setMember(data);
    setFullName(data.full_name ?? '');
    setPhone(data.phone ?? '');
    setGender(data.gender ?? '');
    setEmail(data.email ?? '');
    setSection(data.section ?? '');
    setBranch(data.branch_name ?? '');
    setHouseNumber(data.house_number ?? '');
    setStatus(data.status ?? 'Active');

    setLoading(false);
  }

  async function saveMember() {
    setMessage('');
    setSuccessMessage('');

    if (!memberId) {
      setMessage('Member ID a awm lo.');
      return;
    }

    if (!fullName.trim()) {
      setMessage('Full name dah rawh.');
      return;
    }

    if (!phone.trim()) {
      setMessage('Phone number dah rawh.');
      return;
    }

    if (!gender) {
      setMessage('Mipa/Hmeichhia thlang rawh.');
      return;
    }

    if (!email.trim()) {
      setMessage('Email dah rawh.');
      return;
    }

    if (!section) {
      setMessage('Section thlang rawh.');
      return;
    }

    if (!branch.trim()) {
      setMessage('Branch name dah rawh.');
      return;
    }

    if (!houseNumber.trim()) {
      setMessage('House Number dah rawh.');
      return;
    }

    setSaving(true);

    const { data, error } = await supabase
      .from('members')
      .update({
        full_name: fullName.trim(),
        phone: phone.trim(),
        gender,
        email: email.trim().toLowerCase(),
        section,
        branch_name: branch.trim(),
        house_number: houseNumber.trim(),
        status,
      })
      .eq('id', memberId)
      .select(
        'id, full_name, phone, email, gender, section, branch_name, house_number, status'
      )
      .maybeSingle();

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    if (data) {
      setMember(data);
      setFullName(data.full_name ?? '');
      setPhone(data.phone ?? '');
      setGender(data.gender ?? '');
      setEmail(data.email ?? '');
      setSection(data.section ?? '');
      setBranch(data.branch_name ?? '');
      setHouseNumber(data.house_number ?? '');
      setStatus(data.status ?? 'Active');
    }

    setSuccessMessage(
      'Member information successfully updated.'
    );

    setSaving(false);
  }

  async function confirmDelete() {
    const message = `Are you sure you want to delete ${fullName || 'this member'}?`;
    const confirmed =
      typeof window !== 'undefined' &&
      (globalThis as any).window
        ? window.confirm(`Delete Member\n\n${message}`)
        : await new Promise<boolean>((resolve) => {
            Alert.alert('Delete Member', message, [
              { text: 'CANCEL', style: 'cancel', onPress: () => resolve(false) },
              { text: 'DELETE', style: 'destructive', onPress: () => resolve(true) },
            ]);
          });
    if (confirmed) await deleteMember();
  }

  async function deleteMember() {
    if (!memberId) {
      setMessage('Member ID a awm lo.');
      return;
    }

    setDeleting(true);
    setMessage('');
    setSuccessMessage('');

    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', memberId);

    if (error) {
      setMessage(error.message);
      setDeleting(false);
      return;
    }

    setDeleting(false);

    router.replace('/admin');
  }

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <LinearGradient
          colors={['#D32F2F', '#8E1B1B', '#111111']}
          style={styles.loadingLogo}
        >
          <Text style={styles.loadingLogoText}>
            SY
          </Text>
        </LinearGradient>

        <Text style={styles.loadingTitle}>
          SALEM YMA
        </Text>

        <ActivityIndicator
          size="small"
          color="#D32F2F"
          style={styles.loadingIndicator}
        />

        <Text style={styles.loadingText}>
          Loading member...
        </Text>
      </View>
    );
  }

  if (!member) {
    return (
      <View style={styles.errorScreen}>
        <View style={styles.errorIcon}>
          <Text style={styles.errorIconText}>
            !
          </Text>
        </View>

        <Text style={styles.errorTitle}>
          Member Not Found
        </Text>

        <Text style={styles.errorText}>
          {message ||
            'Member information hmuh theih lo.'}
        </Text>

        <Pressable
          onPress={() => router.replace('/admin')}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>
            GO BACK
          </Text>
        </Pressable>
      </View>
    );
  }

  const isActive =
    status.toLowerCase() === 'active';

  const initial =
    fullName.trim().charAt(0).toUpperCase() || 'M';

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* HEADER */}
        <LinearGradient
          colors={['#D32F2F', '#8E1B1B', '#0B0B0B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Pressable
            onPress={() => router.replace('/admin')}
            style={styles.backCircle}
          >
            <Text style={styles.backIcon}>
              ‹
            </Text>
          </Pressable>

          <Text style={styles.eyebrow}>
            SALEM YMA • ADMIN
          </Text>

          <Text style={styles.headerTitle}>
            Member Details
          </Text>

          <Text style={styles.headerSubtitle}>
            Manage member information
          </Text>
        </LinearGradient>

        {/* MEMBER PROFILE */}
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <LinearGradient
              colors={['#D32F2F', '#8E1B1B', '#111111']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {initial}
              </Text>
            </LinearGradient>

            <View style={styles.profileMain}>
              <Text
                style={styles.profileName}
                numberOfLines={2}
              >
                {fullName || 'Member'}
              </Text>

              <Text
                style={styles.profileEmail}
                numberOfLines={1}
              >
                {email || 'No email address'}
              </Text>

              <View style={styles.profileStatus}>
                <View
                  style={[
                    styles.profileStatusDot,
                    !isActive &&
                      styles.profileStatusDotInactive,
                  ]}
                />

                <Text
                  style={[
                    styles.profileStatusText,
                    !isActive &&
                      styles.profileStatusTextInactive,
                  ]}
                >
                  {status || 'Active'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.profileDivider} />

          <View style={styles.profileMetaRow}>
            <View style={styles.profileMetaItem}>
              <Text style={styles.profileMetaLabel}>
                SECTION
              </Text>

              <Text style={styles.profileMetaValue}>
                {section || 'Not set'}
              </Text>
            </View>

            <View style={styles.profileMetaItem}>
              <Text style={styles.profileMetaLabel}>
                HOUSE NUMBER
              </Text>

              <Text
                style={styles.profileMetaValue}
                numberOfLines={1}
              >
                {houseNumber || 'Not assigned'}
              </Text>
            </View>

            <View style={styles.profileMetaItem}>
              <Text style={styles.profileMetaLabel}>
                BRANCH
              </Text>

              <Text
                style={styles.profileMetaValue}
                numberOfLines={1}
              >
                {branch || 'Not set'}
              </Text>
            </View>
          </View>
        </View>

        {/* EDIT SECTION */}
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.sectionTitle}>
              Edit Information
            </Text>

            <Text style={styles.sectionSubtitle}>
              Update member details below
            </Text>
          </View>

          <View style={styles.editBadge}>
            <Text style={styles.editBadgeText}>
              EDIT
            </Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <FormField
            label="FULL NAME"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Member full name"
          />

          <FormField
            label="PHONE NUMBER"
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone number"
            keyboardType="phone-pad"
          />

          <FormField
            label="EMAIL ADDRESS"
            value={email}
            onChangeText={setEmail}
            placeholder="Email address"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* GENDER */}
          <Text style={styles.fieldLabel}>
            MIPA / HMEICHHIA
          </Text>

          <View style={styles.sectionOptionList}>
            {['Mipa', 'Hmeichhia'].map((item) => {
              const selected = gender === item;

              return (
                <Pressable
                  key={item}
                  onPress={() => setGender(item)}
                  style={[
                    styles.sectionOption,
                    selected && styles.sectionOptionActive,
                    item === 'Hmeichhia' && styles.lastOption,
                  ]}
                >

                  <Text
                    style={[
                      styles.sectionOptionText,
                      selected && styles.sectionOptionTextActive,
                    ]}
                  >
                    {item}
                  </Text>

                  <View
                    style={[
                      styles.checkCircle,
                      selected && styles.checkCircleActive,
                    ]}
                  >
                    {selected && <Text style={styles.checkText}>✓</Text>}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* SECTION */}
          <Text style={styles.fieldLabel}>
            SECTION
          </Text>

          <View style={styles.sectionOptionList}>
            {sections.map((item, index) => {
              const selected = section === item;

              return (
                <Pressable
                  key={item}
                  onPress={() => setSection(item)}
                  style={[
                    styles.sectionOption,
                    selected &&
                      styles.sectionOptionActive,
                    index === sections.length - 1 &&
                      styles.lastOption,
                  ]}
                >
                  <View
                    style={[
                      styles.sectionOptionNumber,
                      selected &&
                        styles.sectionOptionNumberActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.sectionOptionNumberText,
                        selected &&
                          styles.sectionOptionNumberTextActive,
                      ]}
                    >
                      {index + 1}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.sectionOptionText,
                      selected &&
                        styles.sectionOptionTextActive,
                    ]}
                  >
                    {item}
                  </Text>

                  <View
                    style={[
                      styles.checkCircle,
                      selected &&
                        styles.checkCircleActive,
                    ]}
                  >
                    {selected && (
                      <Text style={styles.checkText}>
                        ✓
                      </Text>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <FormField
            label="HOUSE NUMBER"
            value={houseNumber}
            onChangeText={setHouseNumber}
            placeholder="House Number (e.g. 12)"
            keyboardType="default"
          />

          <FormField
            label="BRANCH"
            value={branch}
            onChangeText={setBranch}
            placeholder="Branch name"
          />

          {/* STATUS */}
          <Text style={styles.fieldLabel}>
            MEMBERSHIP STATUS
          </Text>

          <View style={styles.statusRow}>
            {statuses.map((item) => {
              const selected = status === item;
              const active = item === 'Active';

              return (
                <Pressable
                  key={item}
                  onPress={() => setStatus(item)}
                  style={[
                    styles.statusCard,
                    selected &&
                      (active
                        ? styles.statusCardActive
                        : styles.statusCardInactive),
                  ]}
                >
                  <View
                    style={[
                      styles.statusIcon,
                      active
                        ? styles.statusIconGreen
                        : styles.statusIconRed,
                    ]}
                  >
                    <View
                      style={[
                        styles.statusBigDot,
                        active
                          ? styles.statusBigDotGreen
                          : styles.statusBigDotRed,
                      ]}
                    />
                  </View>

                  <View style={styles.statusCardText}>
                    <Text
                      style={[
                        styles.statusCardTitle,
                        selected &&
                          active &&
                          styles.statusCardTitleGreen,
                        selected &&
                          !active &&
                          styles.statusCardTitleRed,
                      ]}
                    >
                      {item}
                    </Text>

                    <Text style={styles.statusCardSubtitle}>
                      {active
                        ? 'Member is currently active'
                        : 'Member is currently inactive'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.radioOuter,
                      selected &&
                        styles.radioOuterSelected,
                    ]}
                  >
                    {selected && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* MESSAGE */}
          {message ? (
            <View style={styles.messageBox}>
              <View style={styles.messageIcon}>
                <Text style={styles.messageIconText}>
                  !
                </Text>
              </View>

              <Text style={styles.messageText}>
                {message}
              </Text>
            </View>
          ) : null}

          {successMessage ? (
            <View style={styles.successBox}>
              <View style={styles.successIcon}>
                <Text style={styles.successIconText}>
                  ✓
                </Text>
              </View>

              <Text style={styles.successText}>
                {successMessage}
              </Text>
            </View>
          ) : null}

          {/* SAVE */}
          <Pressable
            onPress={saveMember}
            disabled={saving || deleting}
            style={[
              styles.saveButton,
              (saving || deleting) &&
                styles.saveButtonDisabled,
            ]}
          >
            <LinearGradient
              colors={['#D32F2F', '#8E1B1B', '#111111']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.saveGradient}
            >
              {saving ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <>
                  <Text style={styles.saveIcon}>
                    ✓
                  </Text>

                  <Text style={styles.saveText}>
                    SAVE CHANGES
                  </Text>
                </>
              )}
            </LinearGradient>
          </Pressable>
        </View>

        {/* DANGER ZONE */}
        <View style={styles.dangerCard}>
          <View style={styles.dangerHeader}>
            <View style={styles.dangerIconBox}>
              <Text style={styles.dangerIcon}>
                !
              </Text>
            </View>

            <View style={styles.dangerHeaderText}>
              <Text style={styles.dangerTitle}>
                Danger Zone
              </Text>

              <Text style={styles.dangerSubtitle}>
                Permanent member record action
              </Text>
            </View>
          </View>

          <Text style={styles.dangerText}>
            Member record delete tih chuan
            Supabase members table atangin record
            hi permanent-in delete a ni.
          </Text>

          <Pressable
            onPress={confirmDelete}
            disabled={saving || deleting}
            style={[
              styles.deleteButton,
              (saving || deleting) &&
                styles.deleteButtonDisabled,
            ]}
          >
            {deleting ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : (
              <>
                <Text style={styles.deleteIcon}>
                  ×
                </Text>

                <Text style={styles.deleteText}>
                  DELETE MEMBER
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {/* BACK */}
        <Pressable
          onPress={() => router.replace('/admin')}
          style={styles.bottomButton}
        >
          <Text style={styles.bottomArrow}>
            ‹
          </Text>

          <Text style={styles.bottomButtonText}>
            BACK TO MEMBERS
          </Text>
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerTitle}>
            SALEM YMA
          </Text>

          <Text style={styles.footerText}>
            Admin Management System
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize = 'words',
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'words';
}) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999999"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  content: {
    paddingBottom: 45,
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingLogo: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingLogoText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },

  loadingTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 18,
  },

  loadingIndicator: {
    marginTop: 20,
  },

  loadingText: {
    color: '#AAAAAA',
    fontSize: 12,
    marginTop: 8,
  },

  errorScreen: {
    flex: 1,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 25,
  },

  errorIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: '#C62828',
    alignItems: 'center',
    justifyContent: 'center',
  },

  errorIconText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
  },

  errorTitle: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '900',
    marginTop: 18,
  },

  errorText: {
    color: '#AAAAAA',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },

  header: {
    paddingTop: 54,
    paddingBottom: 32,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  backCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  backIcon: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '300',
    lineHeight: 35,
  },

  eyebrow: {
    color: '#FFD6D6',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.8,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    marginTop: 8,
  },

  headerSubtitle: {
    color: '#F0F0F0',
    fontSize: 13,
    marginTop: 6,
  },

  profileCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 18,
    marginTop: -18,
    borderRadius: 22,
    padding: 19,
    elevation: 5,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },
  },

  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 76,
    height: 76,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    color: '#FFFFFF',
    fontSize: 31,
    fontWeight: '900',
  },

  profileMain: {
    flex: 1,
    marginLeft: 15,
  },

  profileName: {
    color: '#111111',
    fontSize: 20,
    fontWeight: '900',
  },

  profileEmail: {
    color: '#888888',
    fontSize: 11,
    marginTop: 4,
  },

  profileStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },

  profileStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#2E7D32',
    marginRight: 5,
  },

  profileStatusDotInactive: {
    backgroundColor: '#C62828',
  },

  profileStatusText: {
    color: '#2E7D32',
    fontSize: 9,
    fontWeight: '900',
  },

  profileStatusTextInactive: {
    color: '#C62828',
  },

  profileDivider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginTop: 18,
    marginBottom: 14,
  },

  profileMetaRow: {
    flexDirection: 'row',
  },

  profileMetaItem: {
    flex: 1,
  },

  profileMetaLabel: {
    color: '#999999',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  profileMetaValue: {
    color: '#333333',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
  },

  titleRow: {
    marginHorizontal: 18,
    marginTop: 25,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionTitle: {
    color: '#111111',
    fontSize: 20,
    fontWeight: '900',
  },

  sectionSubtitle: {
    color: '#999999',
    fontSize: 10,
    marginTop: 3,
  },

  editBadge: {
    backgroundColor: '#111111',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  editBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  formCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 18,
    borderRadius: 21,
    padding: 18,
    elevation: 3,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },

  fieldContainer: {
    marginBottom: 17,
  },

  fieldLabel: {
    color: '#888888',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 7,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 13,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 13,
    color: '#222222',
    fontSize: 13,
  },

  sectionOptionList: {
    marginBottom: 18,
  },

  sectionOption: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 14,
    backgroundColor: '#FAFAFA',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    marginBottom: 7,
  },

  sectionOptionActive: {
    backgroundColor: '#111111',
    borderColor: '#111111',
  },

  lastOption: {
    marginBottom: 0,
  },

  sectionOptionNumber: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#EEEEEE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionOptionNumberActive: {
    backgroundColor: '#C62828',
  },

  sectionOptionNumberText: {
    color: '#666666',
    fontSize: 10,
    fontWeight: '900',
  },

  sectionOptionNumberTextActive: {
    color: '#FFFFFF',
  },

  sectionOptionText: {
    flex: 1,
    color: '#555555',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 10,
  },

  sectionOptionTextActive: {
    color: '#FFFFFF',
  },

  checkCircle: {
    width: 23,
    height: 23,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkCircleActive: {
    borderColor: '#D32F2F',
    backgroundColor: '#D32F2F',
  },

  checkText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },

  statusRow: {
    flexDirection: 'row',
    marginBottom: 18,
  },

  statusCard: {
    flex: 1,
    minHeight: 76,
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 15,
    backgroundColor: '#FAFAFA',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },

  statusCardInactive: {
    borderColor: '#E5BABA',
    backgroundColor: '#FFF8F8',
  },

  statusCardActive: {
    borderColor: '#B8DDBD',
    backgroundColor: '#F6FCF7',
  },

  statusIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusIconGreen: {
    backgroundColor: '#EAF6EC',
  },

  statusIconRed: {
    backgroundColor: '#FBEAEA',
  },

  statusBigDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },

  statusBigDotGreen: {
    backgroundColor: '#2E7D32',
  },

  statusBigDotRed: {
    backgroundColor: '#C62828',
  },

  statusCardText: {
    flex: 1,
    marginLeft: 8,
  },

  statusCardTitle: {
    color: '#555555',
    fontSize: 10,
    fontWeight: '900',
  },

  statusCardTitleGreen: {
    color: '#2E7D32',
  },

  statusCardTitleRed: {
    color: '#C62828',
  },

  statusCardSubtitle: {
    color: '#999999',
    fontSize: 7,
    lineHeight: 10,
    marginTop: 2,
  },

  radioOuter: {
    width: 17,
    height: 17,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#AAAAAA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  radioOuterSelected: {
    borderColor: '#C62828',
  },

  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#C62828',
  },

  messageBox: {
    backgroundColor: '#FBEAEA',
    borderRadius: 13,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  messageIcon: {
    width: 25,
    height: 25,
    borderRadius: 9,
    backgroundColor: '#C62828',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  messageIconText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },

  messageText: {
    flex: 1,
    color: '#B71C1C',
    fontSize: 11,
    lineHeight: 17,
  },

  successBox: {
    backgroundColor: '#EAF6EC',
    borderRadius: 13,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  successIcon: {
    width: 25,
    height: 25,
    borderRadius: 9,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  successIconText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },

  successText: {
    flex: 1,
    color: '#2E7D32',
    fontSize: 11,
    fontWeight: '800',
  },

  saveButton: {
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: 3,
  },

  saveButtonDisabled: {
    opacity: 0.65,
  },

  saveGradient: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  saveIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    marginRight: 7,
  },

  saveText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  dangerCard: {
    marginHorizontal: 18,
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 19,
    borderWidth: 1,
    borderColor: '#F0D0D0',
  },

  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  dangerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FBEAEA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  dangerIcon: {
    color: '#C62828',
    fontSize: 21,
    fontWeight: '900',
  },

  dangerHeaderText: {
    marginLeft: 10,
  },

  dangerTitle: {
    color: '#B71C1C',
    fontSize: 16,
    fontWeight: '900',
  },

  dangerSubtitle: {
    color: '#999999',
    fontSize: 9,
    marginTop: 2,
  },

  dangerText: {
    color: '#777777',
    fontSize: 11,
    lineHeight: 18,
    marginTop: 12,
  },

  deleteButton: {
    height: 50,
    borderRadius: 13,
    backgroundColor: '#C62828',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 15,
  },

  deleteButtonDisabled: {
    opacity: 0.6,
  },

  deleteIcon: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '300',
    marginRight: 7,
  },

  deleteText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  bottomButton: {
    marginHorizontal: 18,
    marginTop: 18,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  bottomArrow: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '300',
    marginRight: 6,
  },

  bottomButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  backButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginTop: 25,
  },

  backButtonText: {
    color: '#111111',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },

  footer: {
    alignItems: 'center',
    marginTop: 30,
  },

  footerTitle: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  footerText: {
    color: '#999999',
    fontSize: 10,
    marginTop: 4,
  },
});