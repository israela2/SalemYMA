import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import AppBackButton from '../components/AppBackButton';
import { supabase } from '../lib/supabase';

 type CemeteryRecord = {
  id: number;
  deceased_name: string;
  photo_url?: string | null;
  age_at_death?: number | null;
  date_of_birth?: string | null;
  date_of_death?: string | null;
  cemetery_name?: string | null;
  row_name?: string | null;
  grave_number?: string | null;
  family_name?: string | null;
  family_contact_phone?: string | null;
  biography?: string | null;
  grave_photo_url?: string | null;
  notes?: string | null;
  is_published?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type GraveGroup = {
  graveNumber: string;
  people: CemeteryRecord[];
};

const RED = '#C62828';
const RED_DARK = '#8E1B1B';
const BLACK = '#0B0B0B';
const WHITE = '#FFFFFF';
const BG = '#F5F6F8';
const CARD = '#FFFFFF';
const TEXT = '#15181D';
const MUTED = '#737A84';
const BORDER = '#E4E7EB';
const SOFT = '#F7F8FA';
const SOFT_RED = '#FFF1F1';
const GREEN = '#1F7A55';

function formatDate(value?: string | null) {
  if (!value) return '-';
  const trimmed = value.trim();

  // Preserve year-only cemetery records as YYYY.
  if (/^\d{4}$/.test(trimmed)) return trimmed;

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return value;
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

function getYear(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.getFullYear();
}


function getRecordYear(item: CemeteryRecord) {
  return getYear(item.date_of_death);
}

const REGISTER_CATEGORIES = ['Row A', 'Row B', 'Row C', 'Naupang Thlan', 'Hlamzuih Thlan'] as const;
const CEMETERY_GRAVE_ICON = require('./assets/grave-icon.png');
type RegisterCategory = typeof REGISTER_CATEGORIES[number];

function normalizeCategory(value?: string | null): RegisterCategory | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return REGISTER_CATEGORIES.find((item) => item.toLowerCase() === normalized) ?? null;
}

export default function CemeteryScreen() {
  const [records, setRecords] = useState<CemeteryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<RegisterCategory | null>(null);
  const [expandedRecordId, setExpandedRecordId] = useState<number | null>(null);

  const loadRecords = useCallback(async () => {
    try {
      const { data: visibility } = await supabase
        .from('app_feature_visibility')
        .select('is_visible')
        .eq('feature_key', 'cemetery')
        .maybeSingle();

      if (visibility && visibility.is_visible === false) {
        setRecords([]);
        router.replace('/');
        return;
      }

      // Load all published records in pages so a low API max-rows setting
      // cannot hide records after the first few entries.
      const allRows: any[] = [];
      let offset = 0;
      const pageSize = 100;
      while (true) {
        const { data, error } = await supabase
          .from('cemetery_records')
          .select('*')
          .eq('is_published', true)
          .order('deceased_name', { ascending: true })
          .order('id', { ascending: true })
          .range(offset, offset + pageSize - 1);
        if (error) throw error;
        const page = data || [];
        allRows.push(...page);
        if (page.length === 0) break;
        offset += page.length;
      }
      const uniqueRows = Array.from(new Map(allRows.map((row) => [String(row.id), row])).values());
      setRecords(uniqueRows as CemeteryRecord[]);

    } catch (error: any) {
      console.error('Cemetery load error:', error);
      Alert.alert('Unable to load cemetery records', error?.message || 'Please try again later.');
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

  const yearOptions = useMemo<number[]>(() => {
    const yearSet = new Set<number>();
    records.forEach((record) => {
      const year = getRecordYear(record);
      if (year !== null) yearSet.add(year);
    });
    return Array.from(yearSet).sort((a: number, b: number) => b - a);
  }, [records]);

  const categoryCounts = useMemo(() => Object.fromEntries(REGISTER_CATEGORIES.map((category) => [category, records.filter((item) => normalizeCategory(item.row_name) === category).length])) as Record<RegisterCategory, number>, [records]);

  const selectedCategoryRecords = useMemo(() => {
    if (!selectedCategory) return [];
    return records.filter((item) => normalizeCategory(item.row_name) === selectedCategory);
  }, [records, selectedCategory]);

  // Filter people, then group the matching results by Grave No.  A shared
  // grave is therefore rendered as ONE serial number with all occupants together.
  const filteredRecords = useMemo(() => {
    if (!selectedCategory) return [];
    const query = search.trim().toLowerCase();

    const matches = selectedCategoryRecords.filter((item) => {
      const itemYear = getRecordYear(item);
      const matchesYear = selectedYear === null || itemYear === selectedYear;
      if (!matchesYear) return false;
      if (!query) return true;

      const values = [
        item.deceased_name,
        item.family_name,
        item.cemetery_name,
        item.row_name,
        item.grave_number,
        item.biography,
      ];

      return values.filter(Boolean).some((value) => String(value).toLowerCase().includes(query));
    });

    // With no filters, show every person. With filters, include the whole
    // grave group when any person in that grave matches.
    if (!query && selectedYear === null) return selectedCategoryRecords;

    const matchingGraves = new Set(
      matches.map((item) => String(item.grave_number || `record-${item.id}`)),
    );

    return selectedCategoryRecords.filter((item) =>
      matchingGraves.has(String(item.grave_number || `record-${item.id}`)),
    );
  }, [selectedCategory, selectedCategoryRecords, search, selectedYear]);

  const graveGroups = useMemo<GraveGroup[]>(() => {
    const groups = new Map<string, CemeteryRecord[]>();

    filteredRecords.forEach((item) => {
      const key = String(item.grave_number || `record-${item.id}`);
      const existing = groups.get(key);
      if (existing) existing.push(item);
      else groups.set(key, [item]);
    });

    return Array.from(groups.entries())
      .map(([graveNumber, people]) => ({ graveNumber, people }))
      .sort((a, b) => {
        const aMatch = a.graveNumber.match(/-(\d+)$/);
        const bMatch = b.graveNumber.match(/-(\d+)$/);
        const aNumber = aMatch ? Number(aMatch[1]) : Number.MAX_SAFE_INTEGER;
        const bNumber = bMatch ? Number(bMatch[1]) : Number.MAX_SAFE_INTEGER;
        if (aNumber !== bNumber) return aNumber - bNumber;
        return a.graveNumber.localeCompare(b.graveNumber);
      });
  }, [filteredRecords]);

  function renderGraveGroup(group: GraveGroup, serialIndex: number) {
    const groupKey = `grave-${group.graveNumber}`;
    const firstPerson = group.people[0];
    const isExpanded = expandedRecordId === firstPerson?.id;

    return (
      <View key={groupKey} style={styles.recordCard}>
        <Pressable
          onPress={() => setExpandedRecordId(isExpanded ? null : firstPerson.id)}
          accessibilityRole="button"
          accessibilityLabel={`${isExpanded ? 'Collapse' : 'View'} grave ${group.graveNumber}`}
          style={({ pressed }) => [styles.recordHeader, pressed && styles.pressed]}
        >
          <View style={styles.serialBadge}>
            <Text style={styles.serialBadgeText}>{serialIndex}</Text>
          </View>

          <View style={styles.recordThumbWrap}>
            {firstPerson.grave_photo_url || firstPerson.photo_url ? (
              <Image
                source={{ uri: firstPerson.photo_url || firstPerson.grave_photo_url || undefined }}
                style={styles.recordThumb}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.recordThumbPlaceholder}>
                <Text style={styles.recordThumbPlaceholderText}>✝</Text>
              </View>
            )}
          </View>

          <View style={styles.recordHeaderCopy}>
            {group.people.map((person, index) => (
              <View key={person.id} style={index > 0 ? styles.sharedPersonRow : undefined}>
                <View style={styles.recordTitleRow}>
                  <Text style={styles.deceasedName} numberOfLines={2}>
                    {person.deceased_name}
                  </Text>
                  {getRecordYear(person) ? <Text style={styles.yearPill}>{getRecordYear(person)}</Text> : null}
                </View>

                {person.family_name ? (
                  <Text style={styles.familyLine} numberOfLines={1}>
                    {person.family_name}
                  </Text>
                ) : null}

                <View style={styles.metaRow}>
                  {index === 0 ? <Text style={styles.metaText}>Grave {group.graveNumber}</Text> : <Text style={styles.metaText}>Same grave</Text>}
                  {person.age_at_death != null ? <Text style={styles.metaText}>Age {person.age_at_death}</Text> : null}
                </View>
              </View>
            ))}

            {group.people.length > 1 ? (
              <Text style={styles.sharedGraveLabel}>
                {group.people.length} persons • Same Grave
              </Text>
            ) : null}
          </View>

          <View style={styles.chevronBox}>
            <Text style={styles.chevron}>{isExpanded ? '⌃' : '⌄'}</Text>
          </View>
        </Pressable>

        {isExpanded ? (
          <View style={styles.expandedBody}>
            {firstPerson.grave_photo_url ? (
              <Pressable
                onPress={() => setPreviewPhoto(firstPerson.grave_photo_url || null)}
                accessibilityRole="button"
                accessibilityLabel={`Preview grave photo for ${group.graveNumber}`}
                style={({ pressed }) => [styles.photoHero, pressed && styles.pressed]}
              >
                <Image source={{ uri: firstPerson.grave_photo_url }} style={styles.gravePhoto} resizeMode="cover" />
                <View style={styles.photoOverlayTag}>
                  <Text style={styles.photoOverlayText}>VIEW PHOTO</Text>
                </View>
              </Pressable>
            ) : null}

            <SectionTitle title={`GRAVE ${group.graveNumber} • ${group.people.length} ${group.people.length === 1 ? 'PERSON' : 'PERSONS'}`} />
            <InfoRow label="Cemetery" value={firstPerson.cemetery_name} />
            <InfoRow label="Register" value={firstPerson.row_name} />
            <InfoRow label="Grave Number" value={group.graveNumber} highlight />

            {group.people.map((person, index) => (
              <View key={person.id} style={index > 0 ? styles.sharedPersonDetail : undefined}>
                <View style={styles.personDetailHeader}>
                  <Text style={styles.personDetailNumber}>PERSON {index + 1}</Text>
                  <Text style={styles.personDetailName}>{person.deceased_name}</Text>
                </View>

                <View style={styles.detailGrid}>
                  <DetailBox label="DATE OF BIRTH" value={formatDate(person.date_of_birth)} />
                  <DetailBox label="DATE OF DEATH" value={formatDate(person.date_of_death)} />
                  <DetailBox label="MITTHI KUM ZAT" value={person.age_at_death == null ? '-' : `${person.age_at_death} kum`} />
                </View>

                {person.family_name || person.family_contact_phone ? (
                  <>
                    <SectionTitle title="FAMILY INFORMATION" />
                    <InfoRow label="Family" value={person.family_name} />
                    <InfoRow label="Phone" value={person.family_contact_phone} />
                  </>
                ) : null}

                {person.biography ? (
                  <View style={styles.textPanel}>
                    <Text style={styles.panelLabel}>CHANCHIN TAWI</Text>
                    <Text style={styles.bodyText}>{person.biography}</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <LinearGradient colors={[BLACK, RED_DARK]} style={styles.loadingGradient}>
          <Image source={require('../assets/yma-logo.png')} style={styles.loadingLogo} resizeMode="contain" />
          <Text style={styles.loadingTitle}>THLANMUAL</Text>
          <Text style={styles.loadingSubtitle}>Loading cemetery records…</Text>
          <ActivityIndicator size="large" color={WHITE} style={styles.loadingSpinner} />
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={[BLACK, RED_DARK]} style={styles.header}>
        <View style={styles.headerInner}>
          <View style={styles.headerLeft}>
            <AppBackButton />
            <Image source={require('../assets/yma-logo.png')} style={styles.headerLogo} resizeMode="contain" />
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerEyebrow}>YMA Salem Branch</Text>
              <Text style={styles.headerTitle}>Thlanmual Record</Text>
              <Text style={styles.headerSubtitle}>Cemetery Records</Text>
            </View>
          </View>
          <View style={styles.totalRecordsPill}>
            <Text style={styles.totalRecordsLabel}>Total Records</Text>
            <Text style={styles.totalRecordsValue}>{records.length}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={RED} />}
      >
        <View style={styles.contentFrame}>
          <View style={styles.searchBarRow}>
            <View style={styles.searchBoxLarge}>
              <Text style={styles.searchIcon}>⌕</Text>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search by name, family, serial number…"
                placeholderTextColor="#9AA1AA"
                style={styles.searchInput}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
              {search.length > 0 ? (
                <Pressable onPress={() => setSearch('')} style={styles.clearButton}>
                  <Text style={styles.clearButtonText}>×</Text>
                </Pressable>
              ) : null}
            </View>
            <Pressable onPress={refresh} disabled={refreshing} style={({ pressed }) => [styles.reloadSquare, pressed && styles.pressed]}>
              {refreshing ? <ActivityIndicator size="small" color={TEXT} /> : <Text style={styles.reloadSquareText}>↻</Text>}
            </Pressable>
          </View>


          <View style={styles.aerialPhotoCard}>
            <View style={styles.aerialPhotoFrame}>
              <Image source={require('../assets/thlanmual-row-map.png')} style={styles.aerialPhoto} resizeMode="cover" />
            </View>
          </View>

          <View style={styles.recordSelectorCard}>
            <View style={styles.recordSelectorHeader}>
              <View style={styles.recordSelectorIcon}>
                <Text style={styles.recordSelectorIconText}>▤</Text>
              </View>
              <View style={styles.resultCopy}>
                <Text style={styles.resultTitle}>Thlanmual Record</Text>
                <Text style={styles.resultSubtitle}>Register pakhat thlang hmasa la, chumi chhungah record te en tur.</Text>
              </View>
              {selectedCategory ? <Text style={styles.recordCountPill}>{filteredRecords.length}</Text> : null}
            </View>

            <View style={styles.rowSelectorRowCompact}>
              {REGISTER_CATEGORIES.map((category) => {
                const active = selectedCategory === category;
                const count = categoryCounts[category];
                return (
                  <Pressable
                    key={category}
                    onPress={() => {
                      setSelectedCategory(category);
                      setSearch('');
                      setSelectedYear(null);
                      setExpandedRecordId(null);
                    }}
                    style={({ pressed }) => [styles.rowSelectorButtonCompact, active && styles.rowSelectorButtonCompactActive, pressed && styles.pressed]}
                  >
                    <View style={[styles.rowSelectorBadgeCompact, active && styles.rowSelectorBadgeCompactActive]}>
                      <Image source={CEMETERY_GRAVE_ICON} style={styles.rowSelectorGraveIcon} resizeMode="contain" />
                    </View>
                    <View style={styles.rowSelectorCopy}>
                      <Text style={[styles.rowSelectorLabelCompact, active && styles.rowSelectorLabelCompactActive]}>{category}</Text>
                      <Text style={[styles.rowSelectorCountCompact, active && styles.rowSelectorCountCompactActive]}>{count} record{count === 1 ? '' : 's'}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {selectedCategory === null ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Text style={styles.emptyIcon}>⌖</Text>
              </View>
              <Text style={styles.emptyTitle}>Select a cemetery register</Text>
              <Text style={styles.emptyText}>Register pakhat thlang hmasa la. Chumi register chhungah record-te i en thei ang.</Text>
            </View>
          ) : (
            <View style={styles.resultsPanel}>
              <View style={styles.resultsPanelHeader}>
                <View>
                  <Text style={styles.resultsPanelTitle}>{selectedCategory} - Records</Text>
                  <Text style={styles.resultsPanelSubtitle}>
                    {graveGroups.length} grave{graveGroups.length === 1 ? '' : 's'} · {filteredRecords.length} person{filteredRecords.length === 1 ? '' : 's'}{selectedYear !== null ? ` · ${selectedYear}` : ''}
                  </Text>
                </View>
                {(search.trim() || selectedYear !== null) ? (
                  <Pressable
                    onPress={() => {
                      setSearch('');
                      setSelectedYear(null);
                    }}
                    style={({ pressed }) => [styles.clearFilterButton, pressed && styles.pressed]}
                  >
                    <Text style={styles.clearFilterText}>CLEAR FILTERS</Text>
                  </Pressable>
                ) : null}
              </View>

              {filteredRecords.length === 0 ? (
                <View style={styles.emptyCardInner}>
                  <View style={styles.emptyIconCircle}>
                    <Text style={styles.emptyIcon}>✝</Text>
                  </View>
                  <Text style={styles.emptyTitle}>No record found in {selectedCategory}</Text>
                  <Text style={styles.emptyText}>
                    {search.trim() || selectedYear !== null
                      ? 'I zawng dan thlak hmasa la. Name, family name, grave number emaw year dangin zawng leh rawh.'
                      : `${selectedCategory} ah record hi tunah a awm lo.`}
                  </Text>
                </View>
              ) : (
                graveGroups.map((group, index) => renderGraveGroup(group, index + 1))
              )}
            </View>
          )}
          <View style={styles.bottomSpace} />
        </View>
      </ScrollView>

      <Modal visible={!!previewPhoto} transparent animationType="fade" onRequestClose={() => setPreviewPhoto(null)}>
        <Pressable style={styles.photoPreviewOverlay} onPress={() => setPreviewPhoto(null)}>
          <Pressable style={styles.photoPreviewCard} onPress={(event) => event.stopPropagation()}>
            {previewPhoto ? (
              <Image source={{ uri: previewPhoto }} style={styles.photoPreviewImage} resizeMode="contain" />
            ) : null}
            <Pressable onPress={() => setPreviewPhoto(null)} style={styles.photoPreviewClose}>
              <Text style={styles.photoPreviewCloseText}>CLOSE</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.filterChip, active && styles.filterChipActive, pressed && styles.pressed]}>
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function DetailBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailBox}>
      <Text style={styles.detailBoxLabel}>{label}</Text>
      <Text style={styles.detailBoxValue}>{value}</Text>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={styles.sectionTitleLine} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function InfoRow({ label, value, highlight = false }: { label: string; value?: string | null; highlight?: boolean }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, highlight && styles.infoValueHighlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  loadingScreen: { flex: 1, backgroundColor: BLACK },
  loadingGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingLogo: { width: 82, height: 82, marginBottom: 15 },
  loadingTitle: { color: WHITE, fontSize: 28, fontWeight: '900', letterSpacing: 2 },
  loadingSubtitle: { color: '#D9D9D9', fontSize: 13, fontWeight: '600', marginTop: 7 },
  loadingSpinner: { marginTop: 20 },

  totalRecordsPill: { minWidth: 132, minHeight: 52, paddingHorizontal: 15, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  totalRecordsLabel: { color: '#DCE5EF', fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },
  totalRecordsValue: { color: WHITE, fontSize: 22, fontWeight: '900', marginTop: 1 },

  header: {
    paddingTop: Platform.OS === 'web' ? 18 : 58,
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  headerInner: {
    width: '100%',
    maxWidth: 1000,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 },
  headerLogo: { width: 50, height: 50, marginRight: 12 },
  headerTextWrap: { flex: 1, minWidth: 0 },
  headerEyebrow: { color: '#FFDADA', fontSize: 10, fontWeight: '900', letterSpacing: 1.8, marginBottom: 3 },
  headerTitle: { color: WHITE, fontSize: 24, fontWeight: '900', lineHeight: 28 },
  headerSubtitle: { color: '#E7E7E7', fontSize: 12, fontWeight: '600', marginTop: 3 },

  body: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 30 },
  contentFrame: { width: '100%', maxWidth: 1000, alignSelf: 'center' },

  introCard: {
    flexDirection: 'row',
    backgroundColor: CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
    marginBottom: 12,
  },
  introAccent: { width: 5, backgroundColor: RED },
  introCopy: { flex: 1, padding: 16 },
  introTitle: { color: TEXT, fontSize: 18, fontWeight: '900', marginBottom: 5 },
  introText: { color: MUTED, fontSize: 12, lineHeight: 19, fontWeight: '500' },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, paddingVertical: 14, paddingHorizontal: 12 },
  statValue: { color: TEXT, fontSize: 22, fontWeight: '900' },
  statLabel: { color: MUTED, fontSize: 9, fontWeight: '900', letterSpacing: 0.8, marginTop: 3 },

  searchBarRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  searchBoxLarge: { flex: 1, height: 52, borderRadius: 14, borderWidth: 1, borderColor: BORDER, backgroundColor: WHITE, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  reloadSquare: { width: 52, height: 52, borderRadius: 14, borderWidth: 1, borderColor: BORDER, backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  reloadSquareText: { color: TEXT, fontSize: 25, fontWeight: '700', lineHeight: 28 },
  yearChipRowCompact: { gap: 8, paddingBottom: 12 },
  aerialPhotoCard: { backgroundColor: WHITE, borderRadius: 18, borderWidth: 1, borderColor: BORDER, overflow: 'hidden', marginBottom: 14 },
  aerialPhotoFrame: { width: '100%', aspectRatio: 1664 / 936, backgroundColor: '#E8ECEB' },
  aerialPhoto: { width: '100%', height: '100%' },
  recordSelectorCard: { backgroundColor: WHITE, borderRadius: 18, borderWidth: 1, borderColor: BORDER, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
  recordSelectorHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  recordSelectorIcon: { width: 46, height: 46, borderRadius: 13, backgroundColor: '#EEF4FA', borderWidth: 1, borderColor: '#DDE8F2', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  recordSelectorIconText: { color: '#2E5D8A', fontSize: 23, fontWeight: '900' },
  recordCountPill: { minWidth: 44, height: 30, paddingHorizontal: 10, borderRadius: 15, backgroundColor: '#EDF3FB', color: '#2E5D8A', textAlign: 'center', textAlignVertical: 'center', fontSize: 12, fontWeight: '900' },
  rowSelectorRowCompact: { flexDirection: 'row', gap: 10 },
  rowSelectorButtonCompact: { flex: 1, minHeight: 70, borderRadius: 14, borderWidth: 1, borderColor: BORDER, backgroundColor: SOFT, padding: 10, flexDirection: 'row', alignItems: 'center' },
  rowSelectorButtonCompactActive: { backgroundColor: '#EAF2FB', borderColor: '#8DB4DA' },
  rowSelectorBadgeCompact: { width: 40, height: 40, borderRadius: 20, backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  rowSelectorBadgeCompactActive: { backgroundColor: '#2E5D8A', borderColor: '#2E5D8A' },
  rowSelectorGraveIcon: { width: 24, height: 24 },
  rowSelectorBadgeTextCompact: { color: TEXT, fontSize: 15, fontWeight: '900' },
  rowSelectorBadgeTextCompactActive: { color: WHITE },
  rowSelectorLabelCompact: { color: TEXT, fontSize: 13, fontWeight: '900' },
  rowSelectorLabelCompactActive: { color: '#244C72' },
  rowSelectorCountCompact: { color: MUTED, fontSize: 9, fontWeight: '700', marginTop: 2 },
  rowSelectorCountCompactActive: { color: '#2E5D8A' },
  resultsPanel: { backgroundColor: WHITE, borderRadius: 18, borderWidth: 1, borderColor: BORDER, overflow: 'hidden', marginBottom: 14 },
  resultsPanelHeader: { minHeight: 74, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: BORDER },
  resultsPanelTitle: { color: TEXT, fontSize: 18, fontWeight: '900' },
  resultsPanelSubtitle: { color: MUTED, fontSize: 11, fontWeight: '700', marginTop: 3 },
  emptyCardInner: { padding: 30, alignItems: 'center' },

  searchCard: { backgroundColor: CARD, borderRadius: 18, borderWidth: 1, borderColor: BORDER, padding: 15, marginBottom: 16 },
  searchTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionEyebrow: { color: RED, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  searchTitle: { color: TEXT, fontSize: 18, fontWeight: '900', marginTop: 2 },
  reloadButton: { minHeight: 38, paddingHorizontal: 13, borderRadius: 10, backgroundColor: BLACK, alignItems: 'center', justifyContent: 'center' },
  reloadText: { color: WHITE, fontSize: 12, fontWeight: '800' },
  searchBox: { height: 50, borderRadius: 13, borderWidth: 1, borderColor: BORDER, backgroundColor: SOFT, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  searchIcon: { fontSize: 22, color: MUTED, width: 25, textAlign: 'center' },
  searchInput: { flex: 1, height: '100%', color: TEXT, fontSize: 14, fontWeight: '500', paddingHorizontal: 7 },
  clearButton: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#E7EAEE', alignItems: 'center', justifyContent: 'center' },
  clearButtonText: { color: '#555', fontSize: 20, lineHeight: 21 },
  yearChipRow: { gap: 8, paddingTop: 12, paddingRight: 6 },
  filterChip: { minHeight: 34, paddingHorizontal: 13, borderRadius: 17, borderWidth: 1, borderColor: BORDER, backgroundColor: WHITE, justifyContent: 'center', alignItems: 'center' },
  filterChipActive: { backgroundColor: RED, borderColor: RED },
  filterChipText: { color: MUTED, fontSize: 11, fontWeight: '800' },
  filterChipTextActive: { color: WHITE },


  resultHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  resultCopy: { flex: 1 },
  resultTitle: { color: TEXT, fontSize: 20, fontWeight: '900' },
  resultSubtitle: { color: MUTED, fontSize: 12, fontWeight: '600', marginTop: 2 },
  clearFilterButton: { minHeight: 34, paddingHorizontal: 12, borderRadius: 9, borderWidth: 1, borderColor: '#F0CACA', backgroundColor: SOFT_RED, justifyContent: 'center' },
  clearFilterText: { color: RED_DARK, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

  rowSelectorCard: { backgroundColor: CARD, borderRadius: 18, borderWidth: 1, borderColor: BORDER, padding: 14, marginBottom: 14 },
  rowSelectorTitleRow: { marginBottom: 10 },
  rowSelectorTitle: { color: TEXT, fontSize: 15, fontWeight: '900' },
  rowSelectorHint: { color: MUTED, fontSize: 10, fontWeight: '600', marginTop: 3 },
  rowSelectorRow: { flexDirection: 'row', gap: 9 },
  rowSelectorButton: { flex: 1, minHeight: 66, borderRadius: 14, borderWidth: 1, borderColor: BORDER, backgroundColor: SOFT, padding: 9, flexDirection: 'row', alignItems: 'center' },
  rowSelectorButtonActive: { backgroundColor: SOFT_RED, borderColor: '#E79A9A' },
  rowSelectorBadge: { width: 38, height: 38, borderRadius: 19, backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  rowSelectorBadgeActive: { backgroundColor: RED, borderColor: RED },
  rowSelectorBadgeText: { color: TEXT, fontSize: 15, fontWeight: '900' },
  rowSelectorBadgeTextActive: { color: WHITE },
  rowSelectorCopy: { flex: 1, minWidth: 0 },
  rowSelectorLabel: { color: TEXT, fontSize: 12, fontWeight: '900' },
  rowSelectorLabelActive: { color: RED_DARK },
  rowSelectorCount: { color: MUTED, fontSize: 9, fontWeight: '700', marginTop: 2 },
  rowSelectorCountActive: { color: RED },

  recordCard: { backgroundColor: CARD, borderRadius: 18, borderWidth: 1, borderColor: BORDER, overflow: 'hidden', marginBottom: 12 },
  recordHeader: { minHeight: 88, padding: 12, flexDirection: 'row', alignItems: 'center' },
  serialBadge: { width: 34, height: 34, borderRadius: 10, backgroundColor: BLACK, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  sharedPersonRow: { marginTop: 7, paddingTop: 7, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  sharedGraveLabel: { color: RED, fontSize: 10, fontWeight: '900', marginTop: 5 },
  sharedPersonDetail: { marginTop: 18, paddingTop: 18, borderTopWidth: 1, borderTopColor: BORDER },
  personDetailHeader: { marginBottom: 10 },
  personDetailNumber: { color: RED, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  personDetailName: { color: TEXT, fontSize: 18, fontWeight: '900', marginTop: 2 },
  serialBadgeText: { color: WHITE, fontSize: 11, fontWeight: '900', letterSpacing: 0.6 },
  recordThumbWrap: { width: 62, height: 62, borderRadius: 14, overflow: 'hidden', backgroundColor: SOFT, marginRight: 12 },
  recordThumb: { width: '100%', height: '100%' },
  recordThumbPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F5F7' },
  recordThumbPlaceholderText: { color: RED, fontSize: 26, fontWeight: '600' },
  recordHeaderCopy: { flex: 1, minWidth: 0 },
  recordTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  deceasedName: { color: TEXT, fontSize: 17, lineHeight: 22, fontWeight: '900', flex: 1 },
  yearPill: { color: RED_DARK, backgroundColor: SOFT_RED, borderRadius: 8, overflow: 'hidden', paddingHorizontal: 7, paddingVertical: 4, fontSize: 10, fontWeight: '900' },
  familyLine: { color: RED, fontSize: 11, fontWeight: '800', marginTop: 4 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 6 },
  metaText: { color: MUTED, fontSize: 10, fontWeight: '700' },
  chevronBox: { width: 34, height: 34, borderRadius: 17, backgroundColor: SOFT, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  chevron: { color: RED, fontSize: 21, fontWeight: '800', marginTop: -2 },

  expandedBody: { borderTopWidth: 1, borderTopColor: BORDER, padding: 12 },
  photoHero: { width: '100%', height: 235, borderRadius: 14, overflow: 'hidden', backgroundColor: '#E8EAED', marginBottom: 12 },
  gravePhoto: { width: '100%', height: '100%' },
  photoOverlayTag: { position: 'absolute', right: 10, bottom: 10, backgroundColor: 'rgba(0,0,0,0.72)', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6 },
  photoOverlayText: { color: WHITE, fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },

  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  detailBox: { flexGrow: 1, flexBasis: '22%', minWidth: 120, backgroundColor: SOFT, borderRadius: 12, padding: 11, borderWidth: 1, borderColor: '#ECEEF1' },
  detailBoxLabel: { color: MUTED, fontSize: 8, fontWeight: '900', letterSpacing: 0.8, marginBottom: 4 },
  detailBoxValue: { color: TEXT, fontSize: 12, fontWeight: '800' },

  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 13, marginBottom: 6 },
  sectionTitleLine: { width: 18, height: 3, borderRadius: 2, backgroundColor: RED, marginRight: 7 },
  sectionTitle: { color: TEXT, fontSize: 10, fontWeight: '900', letterSpacing: 1.0 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 15, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#F0F1F3' },
  infoLabel: { color: MUTED, fontSize: 11, fontWeight: '600', flex: 0.9 },
  infoValue: { color: TEXT, fontSize: 12, fontWeight: '800', textAlign: 'right', flex: 1.2 },
  infoValueHighlight: { color: RED, fontSize: 13, fontWeight: '900' },

  textPanel: { backgroundColor: '#FFF8F8', borderRadius: 13, borderWidth: 1, borderColor: '#F2D8D8', padding: 13, marginTop: 13 },
  notePanel: { backgroundColor: '#F8FAF9', borderRadius: 13, borderWidth: 1, borderColor: '#DCEBE4', padding: 13, marginTop: 10 },
  panelLabel: { color: RED, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 6 },
  bodyText: { color: '#4A4E54', fontSize: 12, lineHeight: 19, fontWeight: '500' },
  actionRow: { flexDirection: 'row', gap: 9, marginTop: 13 },
  secondaryAction: { flex: 1, minHeight: 44, borderRadius: 11, borderWidth: 1, borderColor: BORDER, backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center' },
  secondaryActionText: { color: TEXT, fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },
  primaryAction: { flex: 1, minHeight: 44, borderRadius: 11, backgroundColor: RED, alignItems: 'center', justifyContent: 'center' },
  primaryActionText: { color: WHITE, fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },

  emptyCard: { backgroundColor: CARD, borderRadius: 18, borderWidth: 1, borderColor: BORDER, padding: 30, alignItems: 'center' },
  emptyIconCircle: { width: 58, height: 58, borderRadius: 29, backgroundColor: SOFT_RED, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyIcon: { color: RED, fontSize: 28 },
  emptyTitle: { color: TEXT, fontSize: 19, fontWeight: '900' },
  emptyText: { color: MUTED, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 7, maxWidth: 510 },
  emptyButton: { backgroundColor: RED, borderRadius: 11, paddingHorizontal: 18, paddingVertical: 11, marginTop: 16 },
  emptyButtonText: { color: WHITE, fontSize: 10, fontWeight: '900', letterSpacing: 0.7 },

  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
  bottomSpace: { height: 35 },

  photoPreviewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  photoPreviewCard: { width: '100%', maxWidth: 900, alignItems: 'center' },
  photoPreviewImage: { width: '100%', height: 620 },
  photoPreviewClose: { marginTop: 14, backgroundColor: WHITE, borderRadius: 10, paddingHorizontal: 22, paddingVertical: 11 },
  photoPreviewCloseText: { color: TEXT, fontSize: 11, fontWeight: '900', letterSpacing: 0.6 },
});
