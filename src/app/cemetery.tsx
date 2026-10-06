import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { supabase } from '../lib/supabase';

import AppBackButton from '../components/AppBackButton';
type CemeteryRecord = {
  id: number;
  deceased_name: string;

  date_of_birth?: string | null;
  date_of_death?: string | null;
  burial_date?: string | null;

  cemetery_name?: string | null;
  section?: string | null;
  row_name?: string | null;
  grave_number?: string | null;

  family_name?: string | null;
  family_contact_name?: string | null;
  family_contact_phone?: string | null;

  biography?: string | null;

  grave_photo_url?: string | null;
  document_url?: string | null;

  latitude?: number | null;
  longitude?: number | null;

  notes?: string | null;

  is_published?: boolean | null;

  created_at?: string | null;
  updated_at?: string | null;
};

const RED = '#C62828';
const RED_DARK = '#8E1B1B';
const BLACK = '#0B0B0B';
const WHITE = '#FFFFFF';
const BG = '#F5F5F5';
const TEXT = '#151515';
const MUTED = '#777777';
const BORDER = '#E5E5E5';
const LIGHT_RED = '#FBEAEA';

function formatDate(value?: string | null) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

function getAgeAtDeath(
  dateOfBirth?: string | null,
  dateOfDeath?: string | null,
) {
  if (!dateOfBirth || !dateOfDeath) return null;

  const birth = new Date(dateOfBirth);
  const death = new Date(dateOfDeath);

  if (
    Number.isNaN(birth.getTime()) ||
    Number.isNaN(death.getTime())
  ) {
    return null;
  }

  let age = death.getFullYear() - birth.getFullYear();

  const monthDifference =
    death.getMonth() - birth.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 &&
      death.getDate() < birth.getDate())
  ) {
    age--;
  }

  if (age < 0) return null;

  return age;
}

export default function CemeteryScreen() {
  const [records, setRecords] = useState<CemeteryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [expandedRecordId, setExpandedRecordId] = useState<number | null>(null);

  const loadRecords = useCallback(async () => {
    try {
      const { data: visibility } = await supabase.from('app_feature_visibility').select('is_visible').eq('feature_key', 'cemetery').maybeSingle();
      if (!visibility?.is_visible) {
        setRecords([]);
        router.replace('/');
        return;
      }
      const { data, error } = await supabase
        .from('cemetery_records')
        .select('*')
        .eq('is_published', true)
        .order('deceased_name', {
          ascending: true,
        });

      if (error) {
        throw error;
      }

      setRecords((data || []) as CemeteryRecord[]);
    } catch (error: any) {
      console.log(
        'Cemetery load error:',
        error,
      );

      Alert.alert(
        'Unable to load cemetery records',
        error?.message ||
          'Please try again later.',
      );

      setRecords([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  async function refresh() {
    setRefreshing(true);
    await loadRecords();
  }

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return records;
    }

    return records.filter((item) => {
      const values = [
        item.deceased_name,
        item.family_name,
        item.cemetery_name,
        item.section,
        item.row_name,
        item.grave_number,
        item.biography,
      ];

      return values
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(query),
        );
    });
  }, [records, search]);

  async function openDocument(url?: string | null) {
    if (!url) return;

    try {
      const supported =
        await Linking.canOpenURL(url);

      if (!supported) {
        Alert.alert(
          'Unable to open document',
          'This document link cannot be opened.',
        );
        return;
      }

      await Linking.openURL(url);
    } catch (error) {
      Alert.alert(
        'Unable to open document',
        'Please try again.',
      );
    }
  }

  async function openLocation(
    latitude?: number | null,
    longitude?: number | null,
  ) {
    if (
      latitude === null ||
      latitude === undefined ||
      longitude === null ||
      longitude === undefined
    ) {
      return;
    }

    const url =
      `https://www.google.com/maps/search/?api=1&query=` +
      `${latitude},${longitude}`;

    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert(
        'Unable to open map',
        'Please try again.',
      );
    }
  }

  function renderRecord(item: CemeteryRecord) {
    const age = getAgeAtDeath(
      item.date_of_birth,
      item.date_of_death,
    );
    const isExpanded = expandedRecordId === item.id;
    const displayYear = item.date_of_death
      ? new Date(item.date_of_death).getFullYear()
      : item.burial_date
        ? new Date(item.burial_date).getFullYear()
        : null;

    const hasLocation =
      item.latitude !== null &&
      item.latitude !== undefined &&
      item.longitude !== null &&
      item.longitude !== undefined;

    return (
      <View key={item.id} style={styles.recordCard}>
        <Pressable
          onPress={() =>
            setExpandedRecordId(isExpanded ? null : item.id)
          }
          style={styles.recordSummary}
        >
          <View style={styles.recordSummaryText}>
            <Text style={styles.deceasedName}>{item.deceased_name}</Text>
            {displayYear ? (
              <Text style={styles.recordYear}>{displayYear}</Text>
            ) : null}
          </View>
          <Text style={styles.expandArrow}>{isExpanded ? '⌃' : '⌄'}</Text>
        </Pressable>

        {isExpanded ? (
          <>
            {/* Grave Photo */}
            {item.grave_photo_url ? (
              <Pressable onPress={() => setPreviewPhoto(item.grave_photo_url || null)}>
                <Image
                  source={{ uri: item.grave_photo_url }}
                  style={styles.gravePhoto}
                  resizeMode="cover"
                />
                <Text style={styles.photoPreviewHint}>VIEW PHOTO</Text>
              </Pressable>
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderIcon}>🪦</Text>
                <Text style={styles.photoPlaceholderText}>Grave photo not available</Text>
              </View>
            )}

            <View style={styles.recordContent}>
              {item.family_name ? (
                <Text style={styles.familyName}>Family: {item.family_name}</Text>
              ) : null}

              <View style={styles.dateBox}>
                {item.date_of_birth ? (
                  <View style={styles.dateItem}>
                    <Text style={styles.dateLabel}>BORN</Text>
                    <Text style={styles.dateValue}>{formatDate(item.date_of_birth)}</Text>
                  </View>
                ) : null}
                {item.date_of_death ? (
                  <View style={styles.dateItem}>
                    <Text style={styles.dateLabel}>DIED</Text>
                    <Text style={styles.dateValue}>{formatDate(item.date_of_death)}</Text>
                  </View>
                ) : null}
                {age !== null ? (
                  <View style={styles.dateItem}>
                    <Text style={styles.dateLabel}>AGE</Text>
                    <Text style={styles.dateValue}>{age} yrs</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.infoSectionTitle}>BURIAL INFORMATION</Text>
                {item.cemetery_name ? <InfoRow label="Cemetery" value={item.cemetery_name} /> : null}
                {item.section ? <InfoRow label="Section" value={item.section} /> : null}
                {item.row_name ? <InfoRow label="Row" value={item.row_name} /> : null}
                {item.grave_number ? <InfoRow label="Grave No." value={item.grave_number} highlight /> : null}
                {item.burial_date ? <InfoRow label="Burial Date" value={formatDate(item.burial_date)} /> : null}
              </View>

              {item.biography ? (
                <View style={styles.biographyBox}>
                  <Text style={styles.biographyTitle}>CHANCHIN TAWI</Text>
                  <Text style={styles.biographyText}>{item.biography}</Text>
                </View>
              ) : null}

              {item.document_url ? (
                <Pressable onPress={() => openDocument(item.document_url)} style={styles.documentButton}>
                  <Text style={styles.documentButtonText}>VIEW OLD RECORD / DOCUMENT</Text>
                </Pressable>
              ) : null}

              {hasLocation ? (
                <Pressable
                  onPress={() => openLocation(item.latitude, item.longitude)}
                  style={styles.locationButton}
                >
                  <Text style={styles.locationButtonText}>VIEW GRAVE LOCATION</Text>
                </Pressable>
              ) : null}

              {item.notes ? (
                <View style={styles.notesBox}>
                  <Text style={styles.notesTitle}>NOTES</Text>
                  <Text style={styles.notesText}>{item.notes}</Text>
                </View>
              ) : null}
            </View>
          </>
        ) : null}
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <LinearGradient
          colors={[BLACK, RED_DARK]}
          style={styles.loadingGradient}
        >
          <Text style={styles.loadingIcon}>
            🪦
          </Text>

          <Text style={styles.loadingTitle}>
            THLANMUAL
          </Text>

          <Text style={styles.loadingSubtitle}>
            Loading cemetery records...
          </Text>

          <ActivityIndicator
            size="large"
            color={WHITE}
            style={{
              marginTop: 20,
            }}
          />
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[BLACK, RED_DARK]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View style={styles.headerTitleArea}>
            <Text
              style={styles.headerEyebrow}
            >
              YMA Salem Branch
            </Text>

            <Text
              style={styles.headerTitle}
            >
              Thlanmual
            </Text>

            <Text
              style={styles.headerSubtitle}
            >
              Salem Cemetery Records
            </Text>
          </View>

          <AppBackButton />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.body}
        contentContainerStyle={
          styles.scrollContent
        }
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
          />
        }
      >
        {/* Intro */}
        <View style={styles.introCard}>
          <View
            style={styles.introIconBox}
          >
            <Text style={styles.introIcon}>
              🪦
            </Text>
          </View>

          <View
            style={styles.introContent}
          >
            <Text style={styles.introTitle}>
              Salem Thlanmual Records
            </Text>

            <Text
              style={styles.introDescription}
            >
              Kan hmangaih kalta te hriatrengna tur leh
              an thlan te leh an chanchin te en na tur 
              a ni.
            </Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchCard}>
          <Text
            style={styles.searchLabel}
          >
            SEARCH CEMETERY RECORDS
          </Text>

          <View
            style={styles.searchBox}
          >
            <Text
              style={styles.searchIcon}
            >
              🔎
            </Text>

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Name, family, grave no, section..."
              placeholderTextColor="#999999"
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />

            {search.length > 0 ? (
              <Pressable
                onPress={() => setSearch('')}
                style={styles.clearButton}
              >
                <Text
                  style={styles.clearButtonText}
                >
                  ×
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* Count */}
        <View style={styles.resultHeader}>
          <View>
            <Text
              style={styles.resultTitle}
            >
              Cemetery Records
            </Text>

            <Text
              style={styles.resultSubtitle}
            >
              {filteredRecords.length}{' '}
              record
              {filteredRecords.length === 1
                ? ''
                : 's'} found
            </Text>
          </View>

          <Pressable
            onPress={refresh}
            disabled={refreshing}
            style={styles.reloadButton}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.reloadButtonText}>↻ Reload</Text>
            )}
          </Pressable>

          <View
            style={styles.countBadge}
          >
            <Text
              style={styles.countBadgeText}
            >
              {filteredRecords.length}
            </Text>
          </View>
        </View>

        {/* Empty */}
        {filteredRecords.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text
              style={styles.emptyIcon}
            >
              🪦
            </Text>

            <Text
              style={styles.emptyTitle}
            >
              No record found
            </Text>

            <Text
              style={styles.emptyText}
            >
              {search.trim()
                ? 'I zawng record hi hmuh a awm lo. Name, family name, grave number emaw section dangin zawng leh rawh.'
                : 'Cemetery record hi tunah a awm lo.'}
            </Text>

            {search.trim() ? (
              <Pressable
                onPress={() =>
                  setSearch('')
                }
                style={
                  styles.emptyButton
                }
              >
                <Text
                  style={
                    styles.emptyButtonText
                  }
                >
                  CLEAR SEARCH
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          filteredRecords.map(
            renderRecord,
          )
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>

      <Modal
        visible={!!previewPhoto}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewPhoto(null)}
      >
        <Pressable
          style={styles.photoPreviewOverlay}
          onPress={() => setPreviewPhoto(null)}
        >
          <Pressable onPress={(event) => event.stopPropagation()} style={styles.photoPreviewCard}>
            {previewPhoto ? (
              <Image
                source={{ uri: previewPhoto }}
                style={styles.photoPreviewImage}
                resizeMode="contain"
              />
            ) : null}
            <Pressable
              onPress={() => setPreviewPhoto(null)}
              style={styles.photoPreviewClose}
            >
              <Text style={styles.photoPreviewCloseText}>CLOSE</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function InfoRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <Text
        style={[
          styles.infoValue,
          highlight &&
            styles.infoValueHighlight,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: BLACK,
  },

  loadingGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingIcon: {
    fontSize: 42,
    marginBottom: 12,
  },

  loadingTitle: {
    color: WHITE,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
  },

  loadingSubtitle: {
    color: '#D9D9D9',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
  },

  header: {
    paddingTop: 58,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerTitleArea: {
    flex: 1,
    paddingRight: 15,
  },

  headerEyebrow: {
    color: '#FFDADA',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 5,
  },

  headerTitle: {
    color: WHITE,
    fontSize: 30,
    fontWeight: '900',
  },

  headerSubtitle: {
    color: '#E7E7E7',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 5,
  },

  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.2)',
  },

  closeButtonText: {
    color: WHITE,
    fontSize: 30,
    fontWeight: '300',
    lineHeight: 32,
  },

  body: {
    flex: 1,
  },

  scrollContent: {
    padding: 16,
  },

  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 14,
  },

  introIconBox: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: LIGHT_RED,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  introIcon: {
    fontSize: 28,
  },

  introContent: {
    flex: 1,
  },

  introTitle: {
    color: TEXT,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 4,
  },

  introDescription: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },

  searchCard: {
    backgroundColor: WHITE,
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 18,
  },

  searchLabel: {
    color: TEXT,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 9,
  },

  searchBox: {
    height: 50,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#FAFAFA',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },

  searchIcon: {
    fontSize: 17,
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    height: '100%',
    color: TEXT,
    fontSize: 14,
    fontWeight: '500',
  },

  clearButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E8E8E8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  clearButtonText: {
    color: '#555555',
    fontSize: 21,
    lineHeight: 22,
    fontWeight: '400',
  },

  reloadButton: { minHeight: 40, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  reloadButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },

  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  resultTitle: {
    color: TEXT,
    fontSize: 19,
    fontWeight: '900',
  },

  resultSubtitle: {
    color: MUTED,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },

  countBadge: {
    minWidth: 42,
    height: 42,
    borderRadius: 21,
    paddingHorizontal: 10,
    backgroundColor: RED,
    alignItems: 'center',
    justifyContent: 'center',
  },

  countBadgeText: {
    color: WHITE,
    fontSize: 15,
    fontWeight: '900',
  },

  recordSummary: {
    minHeight: 76,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  recordSummaryText: {
    flex: 1,
    paddingRight: 10,
  },

  recordYear: {
    color: MUTED,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3,
  },

  expandArrow: {
    color: RED,
    fontSize: 24,
    fontWeight: '800',
  },

  recordCard: {
    backgroundColor: WHITE,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 16,
  },

  gravePhoto: {
    width: '100%',
    height: 220,
    backgroundColor: '#EAEAEA',
  },

  photoPlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  photoPlaceholderIcon: {
    fontSize: 38,
    marginBottom: 8,
  },

  photoPlaceholderText: {
    color: '#999999',
    fontSize: 12,
    fontWeight: '600',
  },

  recordContent: {
    padding: 16,
  },

  deceasedName: {
    color: TEXT,
    fontSize: 23,
    fontWeight: '900',
    lineHeight: 29,
  },

  familyName: {
    color: RED,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 13,
  },

  dateBox: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    borderRadius: 13,
    padding: 11,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  dateItem: {
    flex: 1,
    paddingRight: 7,
  },

  dateLabel: {
    color: MUTED,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 3,
  },

  dateValue: {
    color: TEXT,
    fontSize: 12,
    fontWeight: '800',
  },

  infoSection: {
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 14,
    marginBottom: 14,
  },

  infoSectionTitle: {
    color: RED,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.1,
    marginBottom: 9,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },

  infoLabel: {
    color: MUTED,
    fontSize: 12,
    fontWeight: '600',
    flex: 0.9,
  },

  infoValue: {
    color: TEXT,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'right',
    flex: 1.2,
  },

  infoValueHighlight: {
    color: RED,
    fontSize: 14,
    fontWeight: '900',
  },

  notesBox: {
    backgroundColor: '#F7F7F7',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 14,
  },

  notesTitle: {
    color: RED,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.1,
    marginBottom: 7,
  },

  notesText: {
    color: '#444444',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },

  biographyBox: {
    backgroundColor: '#FFF8F8',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F3DADA',
    marginBottom: 14,
  },

  biographyTitle: {
    color: RED,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.1,
    marginBottom: 7,
  },

  biographyText: {
    color: '#444444',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },

  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F6F6',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
    marginBottom: 9,
  },

  locationButtonIcon: {
    fontSize: 22,
    marginRight: 10,
  },

  locationButtonContent: {
    flex: 1,
  },

  locationButtonTitle: {
    color: TEXT,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  locationButtonText: {
    color: MUTED,
    fontSize: 11,
    marginTop: 2,
  },

  documentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT_RED,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#F0CCCC',
    padding: 12,
  },

  documentButtonIcon: {
    fontSize: 22,
    marginRight: 10,
  },

  documentButtonContent: {
    flex: 1,
  },

  documentButtonTitle: {
    color: RED_DARK,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  documentButtonText: {
    color: MUTED,
    fontSize: 11,
    marginTop: 2,
  },

  arrow: {
    color: RED,
    fontSize: 28,
    fontWeight: '300',
    marginLeft: 8,
  },

  buttonPressed: {
    opacity: 0.7,
    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  emptyCard: {
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 28,
    alignItems: 'center',
  },

  emptyIcon: {
    fontSize: 42,
    marginBottom: 12,
  },

  emptyTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: '900',
  },

  emptyText: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 7,
  },

  emptyButton: {
    backgroundColor: RED,
    borderRadius: 11,
    paddingHorizontal: 18,
    paddingVertical: 11,
    marginTop: 16,
  },

  emptyButtonText: {
    color: WHITE,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  photoPreviewHint: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    backgroundColor: 'rgba(0,0,0,0.72)',
    color: WHITE,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  photoPreviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },

  photoPreviewCard: {
    width: '100%',
    maxWidth: 900,
    alignItems: 'center',
  },

  photoPreviewImage: {
    width: '100%',
    height: 620,
  },

  photoPreviewClose: {
    marginTop: 14,
    backgroundColor: WHITE,
    borderRadius: 10,
    paddingHorizontal: 22,
    paddingVertical: 11,
  },

  photoPreviewCloseText: {
    color: TEXT,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  bottomSpace: {
    height: 35,
  },
});