import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import { router, useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { publishNotification } from '../lib/notification-service';
import { supabase } from '../lib/supabase';

import AppBackButton from '../components/AppBackButton';
type Member = {
  id: number;
  user_id?: string | null;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  branch_name?: string | null;
  section?: string | null;
  house_number?: string | null;
  status?: string | null;
  created_at?: string | null;
};

type GalleryAlbum = {
  id: number;
  title: string;
  description?: string | null;
  created_at?: string | null;
};

type GalleryItem = {
  id: number;
  title?: string | null;
  description?: string | null;
  image_url: string;
  category?: string | null;
  media_type?: string | null;
  created_at?: string | null;
};

type NewsItem = {
  id: number;
  title: string;
  content?: string | null;
  category?: string | null;
  image_url?: string | null;
  is_published?: boolean | null;
  published_at?: string | null;
  created_at?: string | null;
};

type EventItem = {
  id: number;
  title: string;
  description?: string | null;
  location?: string | null;
  event_date?: string | null;
  image_url?: string | null;
  organizing_branch?: string | null;
  is_published?: boolean | null;
  created_at?: string | null;
};

type WasteBill = {
  id: number;
  user_id: string;
  account_no?: string | null;
  bill_month?: string | null;
  amount: number;
  due_date?: string | null;
  status?: string | null;
  paid_at?: string | null;
  receipt_no?: string | null;
  payment_method?: string | null;
  payment_utr?: string | null;
  payment_submitted_at?: string | null;
  house_number?: string | null;
  created_at?: string | null;
};

type WastePaymentSettings = { id: number; upi_id: string; payee_name: string; instructions?: string | null; };

type GasBooking = {
  id: number;
  user_id: string;
  full_name: string;
  phone: string;
  address: string;
  cylinder_quantity: number;
  status: string;
  created_at: string;
  updated_at?: string;
};

type GasBookingArchive = GasBooking & {
  archived_at: string;
};

type GasArchiveGroup = {
  monthKey: string;
  round: number;
};

type ZonunItem = {
  id: number;
  title: string;
  description?: string | null;
  issue_month?: string | null;
  pdf_url: string;
  is_published?: boolean | null;
  created_at?: string | null;
};

type AdminRole = 'full_admin' | 'cemetery_admin';

type AdminAccount = {
  user_id: string;
  role: 'full_admin' | 'cemetery_admin';
  status: 'pending' | 'approved' | 'rejected';
  created_at?: string | null;
};

type BranchLeader = {
  id: number; position: string; full_name: string; phone?: string | null; photo_url?: string | null; display_order: number; is_active: boolean;
};
type SectionLeader = {
  id: number; section: string; position: string; full_name: string; phone?: string | null; photo_url?: string | null; display_order: number; is_active: boolean;
};
const LEGACY_BRANCH_POSITION_MAP: Record<string, string> = {
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

function normalizeBranchLeaderPosition(position: string) {
  return LEGACY_BRANCH_POSITION_MAP[position] ?? position;
}

const CEMETERY_REGISTER_CATEGORIES = ['Row A', 'Row B', 'Row C', 'Naupang Thlan', 'Hlamzuih Thlan'] as const;
const CEMETERY_GRAVE_ICON = require('./assets/grave-icon.png');
const SECTION_NAMES = ['Section I', 'Section II', 'Section III'];
const SECTION_LEADER_POSITIONS = ['Leader','Assistant Leader','Secretary','Assistant Secretary','Treasurer','Finance Secretary'];
const LEGACY_SECTION_POSITION_MAP: Record<string, string> = {
  President: 'Leader',
  'Vice President': 'Assistant Leader',
  Secretary: 'Secretary',
  'Assistant Secretary': 'Assistant Secretary',
  Treasurer: 'Treasurer',
  'Assistant Treasurer': 'Finance Secretary',
  'Financial Secretary': 'Finance Secretary',
};

function normalizeSectionLeaderPosition(position: string) {
  return LEGACY_SECTION_POSITION_MAP[position] ?? position;
}

// Section Hruaitu positions use these exact canonical labels in both UI and database.
function sectionLeaderDatabasePosition(position: string) {
  return normalizeSectionLeaderPosition(position);
}

function normalizeSectionName(section: string) {
  const map: Record<string, string> = {
    'Section - I': 'Section I',
    'Section - II': 'Section II',
    'Section - III': 'Section III',
    'Section I': 'Section I',
    'Section II': 'Section II',
    'Section III': 'Section III',
  };
  return map[section] ?? section;
}


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
  is_published?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const BRANCH_LEADER_POSITIONS = [
  'President',
  'Vice President',
  'Secretary',
  'Assistant Secretary',
  'Treasurer',
  'Financial Secretary',
];

const RED = '#C62828';
const RED_DARK = '#8E1B1B';
const BLACK = '#0B0B0B';
const WHITE = '#FFFFFF';
const BG = '#F5F5F5';
const BORDER = '#E5E5E5';
const TEXT = '#151515';
const MUTED = '#777777';
const LIGHT_RED = '#FBEAEA';


async function webConfirm(title: string, message: string): Promise<boolean> {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.confirm(`${title}\n\n${message}`);
  }
  return await new Promise<boolean>((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'OK', onPress: () => resolve(true) },
    ]);
  });
}

function webNotify(title: string, message: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

function WebEventDateInput({ value, onChange, mode }: { value: Date | null; onChange: (date: Date) => void; mode: 'date' | 'time' }) {
  if (Platform.OS !== 'web') return null;
  const date = value || new Date();
  const inputValue = mode === 'date'
    ? `${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth()+1).padStart(2,'0')}/${date.getFullYear()}`
    : `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
  return React.createElement('input', {
    type: mode === 'date' ? 'text' : 'time',
    inputMode: mode === 'date' ? 'numeric' : undefined,
    placeholder: mode === 'date' ? 'DD/MM/YYYY' : undefined,
    value: inputValue,
    onChange: (e: any) => {
      const raw = e?.target?.value;
      if (!raw) return;
      const next = new Date(date);
      if (mode === 'date') {
        const digits = raw.replace(/[^0-9]/g, '').slice(0, 8);
        const formatted = digits.length > 4 ? `${digits.slice(0,2)}/${digits.slice(2,4)}/${digits.slice(4)}` : digits.length > 2 ? `${digits.slice(0,2)}/${digits.slice(2)}` : digits;
        e.target.value = formatted;
        if (digits.length === 8) {
          const d = Number(digits.slice(0,2));
          const m = Number(digits.slice(2,4));
          const y = Number(digits.slice(4,8));
          const candidate = new Date(y, m - 1, d, date.getHours(), date.getMinutes(), 0, 0);
          if (candidate.getFullYear() === y && candidate.getMonth() === m - 1 && candidate.getDate() === d) onChange(candidate);
        }
      } else {
        const [h,min] = raw.split(':').map(Number);
        next.setHours(h, min, 0, 0);
        onChange(next);
      }
    },
    style: { width: '100%', minHeight: 44, padding: '10px 12px', border: '1px solid #E5E5E5', borderRadius: 10, fontSize: 15, background: '#FFFFFF', boxSizing: 'border-box' },
  });
}

function formatDate(value?: string | null) {
  if (!value) return '-';

  const trimmed = value.trim();
  if (/^\d{4}$/.test(trimmed)) return trimmed;
  const date = new Date(trimmed);

  if (Number.isNaN(date.getTime())) return value;

  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

function normalizeDateInput(value?: string | null) {
  if (!value) return '';
  const trimmed = value.trim();

  // Accept either a complete date (DD/MM/YYYY) or year only (YYYY).
  const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  if (ddmmyyyy) {
    const day = Number(ddmmyyyy[1]);
    const month = Number(ddmmyyyy[2]);
    const year = Number(ddmmyyyy[3]);
    const candidate = new Date(year, month - 1, day);
    if (
      candidate.getFullYear() !== year ||
      candidate.getMonth() !== month - 1 ||
      candidate.getDate() !== day
    ) return '';
    return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`;
  }

  const yearOnly = /^(\d{4})$/.exec(trimmed);
  if (yearOnly) return yearOnly[1];

  const yyyymmdd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (yyyymmdd) return trimmed;

  return trimmed;
}

function displayDateInput(value?: string | null) {
  if (!value) return '';
  const trimmed = value.trim();

  // Preserve year-only values exactly as entered.
  if (/^\d{4}$/.test(trimmed)) return trimmed;

  const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  if (ddmmyyyy) return trimmed;

  const yyyymmdd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (yyyymmdd) return `${yyyymmdd[3]}/${yyyymmdd[2]}/${yyyymmdd[1]}`;

  return formatDate(trimmed) !== '-' ? formatDate(trimmed) : trimmed;
}

function validateCemeteryDateInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (/^\d{4}$/.test(trimmed)) return true;
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return false;
  return normalizeDateInput(trimmed) !== '';
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return (
    `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}` +
    ' • ' +
    date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  );
}

function formatSelectedDate(date?: Date | null) {
  if (!date) return 'Select event date';

  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

function formatSelectedTime(date?: Date | null) {
  if (!date) return 'Select event time';

  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStoragePathFromUrl(url?: string | null) {
  if (!url) return null;

  const marker = '/storage/v1/object/public/gallery/';
  const index = url.indexOf(marker);

  if (index === -1) return null;

  return decodeURIComponent(
    url.substring(index + marker.length),
  );
}

async function ensureImageLibraryPermission() {
  // Browsers use the native file picker directly and do not need the
  // native media-library permission prompt.
  if (Platform.OS === 'web') return true;

  const permission =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    Alert.alert(
      'Permission required',
      'Please allow photo library access.',
    );
    return false;
  }

  return true;
}

async function uploadImage(uri: string, folder: string) {
  let arrayBuffer: ArrayBuffer;
  let extension =
    uri.toLowerCase().includes('.png')
      ? 'png'
      : uri.toLowerCase().includes('.webp')
        ? 'webp'
        : 'jpg';
  let contentType = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';

  // On Expo Web, ImagePicker returns a browser blob/object URL.
  // The native File(uri) API cannot read that URL, so fetch the blob first.
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Unable to read selected image (${response.status}).`);
    }
    const blob = await response.blob();
    arrayBuffer = await blob.arrayBuffer();
    if (blob.type) {
      contentType = blob.type;
      if (blob.type === 'image/png') extension = 'png';
      else if (blob.type === 'image/webp') extension = 'webp';
      else if (blob.type === 'image/jpeg') extension = 'jpg';
    }
  } else {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error('Unable to read the selected image.');
    }
    const blob = await response.blob();
    arrayBuffer = await blob.arrayBuffer();
    if (blob.type) {
      contentType = blob.type;
      if (blob.type === 'image/png') extension = 'png';
      else if (blob.type === 'image/webp') extension = 'webp';
      else if (blob.type === 'image/jpeg') extension = 'jpg';
    }
  }

  const fileName = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 9)}.${extension}`;
  const path = `${folder}/${fileName}`;

  const { error } = await supabase.storage
    .from('gallery')
    .upload(path, arrayBuffer, {
      contentType,
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from('gallery')
    .getPublicUrl(path);

  return data.publicUrl;
}

async function uploadZonunPdf(uri: string) {
  // Do NOT use File.bytes() / FileSystemFile.bytes() here.
  // On newer Expo versions that call can be rejected because the selected
  // document does not have direct native read permission. DocumentPicker
  // copies the file into the app cache, so fetch(uri) can safely read it.
  const response = await fetch(uri);

  if (!response.ok) {
    throw new Error('Unable to read the selected PDF file.');
  }

  const arrayBuffer = await response.arrayBuffer();

  if (!arrayBuffer || arrayBuffer.byteLength === 0) {
    throw new Error('The selected PDF is empty or could not be read.');
  }

  const fileName = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 9)}.pdf`;

  const path = `issues/${fileName}`;

  const { error } = await supabase.storage
    .from('zonun')
    .upload(path, arrayBuffer, {
      contentType: 'application/pdf',
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from('zonun')
    .getPublicUrl(path);

  if (!data?.publicUrl) {
    throw new Error('PDF uploaded, but its public URL could not be created.');
  }

  return data.publicUrl;
}

async function uploadCemeteryDocument(uri: string) {
  // DocumentPicker returns a URI that is safest to read through fetch on both
  // web (blob/object URL) and native (cached document URI).
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error('Unable to read the selected PDF file.');
  }
  const arrayBuffer = await response.arrayBuffer();
  if (!arrayBuffer || arrayBuffer.byteLength === 0) {
    throw new Error('The selected PDF is empty or could not be read.');
  }

  const fileName = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 9)}.pdf`;

  const path = `cemetery/documents/${fileName}`;

  const { error } = await supabase.storage
    .from('gallery')
    .upload(path, arrayBuffer, {
      contentType: 'application/pdf',
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from('gallery')
    .getPublicUrl(path);

  return data.publicUrl;
}

function getZonunStoragePathFromUrl(url?: string | null) {
  if (!url) return null;

  const marker = '/storage/v1/object/public/zonun/';
  const index = url.indexOf(marker);

  if (index === -1) return null;

  return decodeURIComponent(
    url.substring(index + marker.length),
  );
}

async function adminDeleteRecord(table: string, id: string | number) {
  const allowed = new Set([
    'news',
    'events',
    'gallery',
    'gallery_albums',
    'waste_bills',
    'zonun',
    'branch_leaders',
    'section_leaders',
    'cemetery_records',
    'gas_bookings',
    'chhiatni_fund_bills',
    'members',
  ]);
  if (!allowed.has(table)) throw new Error(`Delete operation is not allowed for ${table}.`);
  const { data, error } = await supabase.rpc('admin_delete_record', {
    p_table_name: table,
    p_record_id: String(id),
  });
  if (error) throw error;
  if (data !== true) throw new Error(`The database did not confirm deletion from ${table}.`);
  return true;
}

export default function AdminScreen() {
  const [loading, setLoading] = useState(true);
  const loadGeneration = useRef(0);
  const [refreshing, setRefreshing] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [adminRole, setAdminRole] = useState<
    'full_admin' | 'cemetery_admin' | null
  >(null);
  const [adminRequests, setAdminRequests] = useState<AdminAccount[]>([]);
  const [loadingAdminRequests, setLoadingAdminRequests] = useState(false);
  const [adminRoleCounts, setAdminRoleCounts] = useState({
    full_admin: 0,
    cemetery_admin: 0,
  });

  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [profileUserId, setProfileUserId] = useState('');
  const [profileSection, setProfileSection] = useState('Section - I');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profilePhotoUploading, setProfilePhotoUploading] = useState(false);

  const [members, setMembers] = useState<Member[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [galleryAlbums, setGalleryAlbums] = useState<GalleryAlbum[]>([]);
  const [newGalleryAlbumTitle, setNewGalleryAlbumTitle] = useState('');
  const [newGalleryAlbumDescription, setNewGalleryAlbumDescription] = useState('');
  const [selectedGalleryAlbum, setSelectedGalleryAlbum] = useState('');
  const [creatingGalleryAlbum, setCreatingGalleryAlbum] = useState(false);
  const [editingGalleryAlbumId, setEditingGalleryAlbumId] = useState<number | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [wasteBills, setWasteBills] = useState<WasteBill[]>([]);
  const [wastePaymentSettings, setWastePaymentSettings] = useState<WastePaymentSettings | null>(null);
  const [wasteUpiId, setWasteUpiId] = useState('');
  const [wastePayeeName, setWastePayeeName] = useState('YMA Salem Branch');
  const [wastePaymentInstructions, setWastePaymentInstructions] = useState('Pay using any UPI app and submit the UTR after payment.');
  const [savingWastePaymentSettings, setSavingWastePaymentSettings] = useState(false);
  const [featureVisibility, setFeatureVisibility] = useState({ cemetery: false, gas_booking: false });
  const [savingFeatureVisibility, setSavingFeatureVisibility] = useState(false);
  const [zonun, setZonun] = useState<ZonunItem[]>([]);

  const [branchLeaders, setBranchLeaders] = useState<BranchLeader[]>([]);
  const [sectionLeaders, setSectionLeaders] = useState<SectionLeader[]>([]);
  const [sectionLeaderSection, setSectionLeaderSection] = useState('Section I');
  const [sectionLeaderPosition, setSectionLeaderPosition] = useState('Leader');
  const [sectionLeaderFullName, setSectionLeaderFullName] = useState('');
  const [sectionLeaderPhone, setSectionLeaderPhone] = useState('');
  const [sectionLeaderPhoto, setSectionLeaderPhoto] = useState('');
  const [sectionLeaderDisplayOrder, setSectionLeaderDisplayOrder] = useState('1');
  const [sectionLeaderActive, setSectionLeaderActive] = useState(true);
  const [editingSectionLeaderId, setEditingSectionLeaderId] = useState<number | null>(null);
  const [savingSectionLeader, setSavingSectionLeader] = useState(false);

  const [cemeteryRecords, setCemeteryRecords] =
    useState<CemeteryRecord[]>([]);

  const [cemeterySearch, setCemeterySearch] = useState('');
  const [cemeteryDeceasedName, setCemeteryDeceasedName] = useState('');
  const [cemeteryPhoto, setCemeteryPhoto] = useState('');
  const [cemeteryAgeAtDeath, setCemeteryAgeAtDeath] = useState('');
  const [cemeteryDateOfBirth, setCemeteryDateOfBirth] = useState('');
  const [cemeteryDateOfDeath, setCemeteryDateOfDeath] = useState('');
  const [cemeteryName, setCemeteryName] = useState('Salem Cemetery');
  const [cemeteryRowName, setCemeteryRowName] = useState('');
  const [cemeteryGraveNumber, setCemeteryGraveNumber] = useState('');
  const [cemeteryAddToExistingGrave, setCemeteryAddToExistingGrave] = useState(false);
  const [cemeteryFamilyName, setCemeteryFamilyName] = useState('');
  const [cemeteryFamilyContactPhone, setCemeteryFamilyContactPhone] = useState('');
  const [cemeteryBiography, setCemeteryBiography] = useState('');
  const [cemeteryGravePhoto, setCemeteryGravePhoto] = useState('');
  const [cemeteryPublished, setCemeteryPublished] = useState(true);
  const [editingCemeteryId, setEditingCemeteryId] = useState<number | null>(null);
  const [savingCemetery, setSavingCemetery] = useState(false);
  const [cemeteryPhotoUploading, setCemeteryPhotoUploading] = useState(false);
  const [cemeteryDocumentUploading, setCemeteryDocumentUploading] = useState(false);
  const [cemeterySaveError, setCemeterySaveError] = useState('');

  const [leaderPosition, setLeaderPosition] = useState('President');
  const [leaderFullName, setLeaderFullName] = useState('');
  const [leaderPhone, setLeaderPhone] = useState('');
  const [leaderPhoto, setLeaderPhoto] = useState('');
  const [leaderDisplayOrder, setLeaderDisplayOrder] = useState('1');
  const [leaderActive, setLeaderActive] = useState(true);
  const [editingLeaderId, setEditingLeaderId] = useState<number | null>(null);
  const [savingLeader, setSavingLeader] = useState(false);

  const [gasBookings, setGasBookings] = useState<GasBooking[]>([]);
  const [loadingGasBookings, setLoadingGasBookings] =
    useState(false);
  const [gasBookingArchive, setGasBookingArchive] = useState<GasBookingArchive[]>([]);
  const [loadingGasArchive, setLoadingGasArchive] = useState(false);
  const [selectedGasArchiveDate, setSelectedGasArchiveDate] = useState<string | null>(null);

  const [memberSearch, setMemberSearch] = useState('');

  const [newsTitle, setNewsTitle] = useState('');
  const [newsCategory, setNewsCategory] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsImage, setNewsImage] = useState('');
  const [editingNewsId, setEditingNewsId] =
    useState<number | null>(null);
  const [savingNews, setSavingNews] = useState(false);

  const [aboutContent, setAboutContent] = useState('');
  const [savingAbout, setSavingAbout] = useState(false);

  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] =
    useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventBranch, setEventBranch] =
    useState('YMA Salem Branch');
  const [eventImage, setEventImage] = useState('');
  const [eventDateValue, setEventDateValue] =
    useState<Date | null>(new Date());
  const [editingEventId, setEditingEventId] =
    useState<number | null>(null);
  const [savingEvent, setSavingEvent] = useState(false);

  const [showEventDatePicker, setShowEventDatePicker] =
    useState(false);
  const [showEventTimePicker, setShowEventTimePicker] =
    useState(false);

  const [galleryUploading, setGalleryUploading] =
    useState(false);
  const [galleryUploadProgress, setGalleryUploadProgress] =
    useState({ current: 0, total: 0 });

  const [selectedWasteMemberIds, setSelectedWasteMemberIds] = useState<string[]>([]);
  const [wasteMemberSearch, setWasteMemberSearch] = useState('');
  const [wasteBillMonth, setWasteBillMonth] =
    useState('');
  const [wasteAmount, setWasteAmount] = useState('');
  const [wasteDueDate, setWasteDueDate] = useState('');
  const [wasteStatus, setWasteStatus] =
    useState('unpaid');
  const [savingWasteBill, setSavingWasteBill] =
    useState(false);

  const [zonunTitle, setZonunTitle] = useState('');
  const [zonunDescription, setZonunDescription] =
    useState('');
  const [zonunIssueMonth, setZonunIssueMonth] =
    useState('');
  const [zonunPdfUrl, setZonunPdfUrl] = useState('');
  const [savingZonun, setSavingZonun] = useState(false);

  const [section, setSection] = useState<
    | 'dashboard'
    | 'members'
    | 'news'
    | 'about'
    | 'events'
    | 'gallery'
    | 'waste'
    | 'zonun'
    | 'leaders'
    | 'section-leaders'
    | 'cemetery'
    | 'gas'
    | 'admins'
    | 'profile'
    | 'visibility'
  >('dashboard');

  useEffect(() => {
    if (authorized && adminRole === 'full_admin') loadFeatureVisibility();
  }, [authorized, adminRole]);

  async function loadFeatureVisibility() {
    const { data, error } = await supabase
      .from('app_feature_visibility')
      .select('feature_key, is_visible');
    if (error) return; // Keep unavailable services hidden until settings are configured.
    const next = { cemetery: false, gas_booking: false };
    for (const row of data || []) {
      if (row.feature_key === 'cemetery') next.cemetery = !!row.is_visible;
      if (row.feature_key === 'gas_booking') next.gas_booking = !!row.is_visible;
    }
    setFeatureVisibility(next);
  }

  async function saveFeatureVisibility(key: 'cemetery' | 'gas_booking', value: boolean) {
    const previous = featureVisibility[key];
    setFeatureVisibility(current => ({ ...current, [key]: value }));
    setSavingFeatureVisibility(true);
    const { error } = await supabase.from('app_feature_visibility').upsert(
      { feature_key: key, is_visible: value, updated_at: new Date().toISOString() },
      { onConflict: 'feature_key' },
    );
    setSavingFeatureVisibility(false);
    if (error) {
      setFeatureVisibility(current => ({ ...current, [key]: previous }));
      Alert.alert('Save failed', 'Run the supplied SQL setup first, then try again.');
    } else {
      Alert.alert('Saved', `${key === 'cemetery' ? 'Thlanmual Records' : 'Gas Booking'} is now ${value ? 'shown' : 'hidden'} for users.`);
    }
  }

  async function checkAdmin(userId: string): Promise<AdminAccount | null> {
    const { data, error } = await supabase
      .from('admins')
      .select('user_id, role, status, created_at')
      .eq('user_id', userId)
      .eq('status', 'approved')
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data as AdminAccount;
  }

  async function loadMyProfile() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const metadata = user.user_metadata || {};

      // The members table is the canonical source used by the Member App.
      // Read it first so Admin Profile and Member Profile always show the same data.
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('full_name, phone, email, section, profile_photo')
        .eq('user_id', user.id)
        .maybeSingle();

      if (memberError) {
        console.log('Member profile load error:', memberError.message);
      }

      setProfileUserId(user.id);
      setProfileName(
        member?.full_name ||
          metadata.full_name ||
          metadata.name ||
          metadata.display_name ||
          '',
      );
      setProfilePhone(member?.phone || metadata.phone || '');
      setProfileEmail(member?.email || user.email || '');
      setProfileSection(member?.section || metadata.section || 'Section - I');
      setProfilePhoto(
        member?.profile_photo ||
          metadata.avatar_url ||
          metadata.profile_photo ||
          '',
      );
    } catch (error: any) {
      console.log(
        'My profile load error:',
        error?.message || error,
      );
    }
  }

  async function pickProfilePhoto() {
    if (!(await ensureImageLibraryPermission())) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    try {
      setProfilePhotoUploading(true);
      const url = await uploadImage(
        result.assets[0].uri,
        'admin-profiles',
      );
      setProfilePhoto(url);
    } catch (error: any) {
      Alert.alert(
        'Upload failed',
        error?.message || 'Unable to upload profile photo.',
      );
    } finally {
      setProfilePhotoUploading(false);
    }
  }

  async function saveMyProfile() {
    if (!profileName.trim()) {
      Alert.alert('Missing name', 'Please enter your name.');
      return;
    }

    if (!profileEmail.trim()) {
      Alert.alert('Missing email', 'Please enter your email address.');
      return;
    }

    try {
      setSavingProfile(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('No signed-in user found.');
      }

      // Keep Supabase Auth metadata in sync.
      const { error: authError } = await supabase.auth.updateUser({
        email: profileEmail.trim(),
        data: {
          full_name: profileName.trim(),
          name: profileName.trim(),
          phone: profilePhone.trim() || null,
          section: profileSection,
          avatar_url: profilePhoto || null,
          profile_photo: profilePhoto || null,
        },
      });

      if (authError) throw authError;

      // IMPORTANT: Member App reads the members table.
      // Therefore save the same profile values there as well.
      const memberPayload = {
        full_name: profileName.trim(),
        phone: profilePhone.trim() || null,
        email: profileEmail.trim(),
        section: profileSection,
      };

      const { data: existingMember, error: memberLookupError } =
        await supabase
          .from('members')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

      if (memberLookupError) throw memberLookupError;

      if (existingMember?.id) {
        const { error: memberUpdateError } = await supabase
          .from('members')
          .update(memberPayload)
          .eq('id', existingMember.id);

        if (memberUpdateError) throw memberUpdateError;
      } else {
        // Some admin accounts may not yet have a members row.
        // Create one so the Member Profile screen has a database record to read.
        const { error: memberInsertError } = await supabase
          .from('members')
          .insert({
            user_id: user.id,
            ...memberPayload,
          });

        if (memberInsertError) throw memberInsertError;
      }

      Alert.alert(
        'Profile updated',
        'Your profile has been saved. The Member App My Profile will use the updated member information.',
      );

      await loadMyProfile();
      await loadAll();
    } catch (error: any) {
      Alert.alert(
        'Update failed',
        error?.message || 'Unable to update your profile.',
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function loadAdminRequests(roleOverride?: AdminRole) {
    const role = roleOverride ?? adminRole;

    if (role !== 'full_admin') {
      setAdminRequests([]);
      return;
    }

    setLoadingAdminRequests(true);

    try {
      const [{ data, error }, { data: approved, error: approvedError }] =
        await Promise.all([
          supabase
            .from('admins')
            .select('user_id, role, status, created_at')
            .eq('status', 'pending')
            .order('created_at', { ascending: true }),
          supabase
            .from('admins')
            .select('role')
            .eq('status', 'approved'),
        ]);

      if (error) throw error;
      if (approvedError) throw approvedError;

      const counts = { full_admin: 0, cemetery_admin: 0 };
      (approved || []).forEach((account: { role?: string | null }) => {
        if (account.role === 'full_admin') counts.full_admin += 1;
        if (account.role === 'cemetery_admin') counts.cemetery_admin += 1;
      });

      setAdminRoleCounts(counts);
      setAdminRequests((data || []) as AdminAccount[]);
    } catch (error: any) {
      console.log('Admin requests load error:', error?.message || error);
      setAdminRequests([]);
    } finally {
      setLoadingAdminRequests(false);
    }
  }

  async function updateAdminRequest(
    request: AdminAccount,
    status: 'approved' | 'rejected',
  ) {
    const roleLabel =
      request.role === 'full_admin'
        ? 'Full Access Admin'
        : 'Cemetery Admin';

    Alert.alert(
      status === 'approved'
        ? 'Approve admin request?'
        : 'Reject admin request?',
      `${roleLabel}\n\nUser ID:\n${request.user_id}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: status === 'approved' ? 'Approve' : 'Reject',
          style: status === 'approved' ? 'default' : 'destructive',
          onPress: async () => {
            try {
              if (status === 'approved') {
                const roleLimit =
                  request.role === 'full_admin' ? 5 : 3;
                const currentCount =
                  request.role === 'full_admin'
                    ? adminRoleCounts.full_admin
                    : adminRoleCounts.cemetery_admin;

                if (currentCount >= roleLimit) {
                  Alert.alert(
                    'Admin limit reached',
                    request.role === 'full_admin'
                      ? 'The maximum of 5 Full Access Admins has already been reached.'
                      : 'The maximum of 3 Cemetery Admins has already been reached.',
                  );
                  return;
                }
              }

              const { error } = await supabase
                .from('admins')
                .update({
                  status,
                })
                .eq('user_id', request.user_id)
                .eq('status', 'pending');

              if (error) {
                throw error;
              }

              Alert.alert(
                status === 'approved' ? 'Approved' : 'Rejected',
                status === 'approved'
                  ? `${roleLabel} has been approved.`
                  : `${roleLabel} request has been rejected.`,
              );

              await loadAdminRequests();
              await loadAll();
            } catch (error: any) {
              Alert.alert(
                status === 'approved'
                  ? 'Approval failed'
                  : 'Rejection failed',
                error?.message ||
                  'Unable to update the admin request.',
              );
            }
          },
        },
      ],
    );
  }


  async function loadGasBookings() {
    setLoadingGasBookings(true);

    try {
      const { data, error } = await supabase
        .from('gas_bookings')
        .select(
          'id, user_id, full_name, phone, address, cylinder_quantity, status, created_at, updated_at',
        )
        .order('created_at', {
          ascending: false,
        });

      if (error) {
        console.log(
          'Gas bookings load error:',
          error.message,
        );

        setGasBookings([]);
        return;
      }

      setGasBookings(
        (data ?? []) as GasBooking[],
      );
    } catch (error) {
      console.log(
        'Gas bookings error:',
        error,
      );

      setGasBookings([]);
    } finally {
      setLoadingGasBookings(false);
    }
  }

  async function loadGasBookingArchive() {
    setLoadingGasArchive(true);
    try {
      const { data, error } = await supabase
        .from('gas_booking_archive')
        .select('id, user_id, full_name, phone, address, cylinder_quantity, status, created_at, updated_at, archived_at')
        .order('archived_at', { ascending: false });

      if (error) throw error;
      setGasBookingArchive((data ?? []) as GasBookingArchive[]);
    } catch (error: any) {
      console.log('Gas booking archive load error:', error?.message || error);
      setGasBookingArchive([]);
    } finally {
      setLoadingGasArchive(false);
    }
  }

  async function deleteAllGasBookings() {
    if (gasBookings.length === 0) {
      Alert.alert('No bookings', 'There are no active gas bookings to delete.');
      return;
    }

    const confirmed = Platform.OS === 'web'
      ? (typeof window !== 'undefined' && window.confirm(
          `Delete ALL ${gasBookings.length} gas booking(s)?\n\nThe bookings will be removed from the active list, but a copy will be kept in Gas Booking History. Member accounts will NOT be deleted.`
        ))
      : false;

    const deleteBookings = async () => {
      try {
        const archivedAt = new Date().toISOString();
        const archiveRows = gasBookings.map((booking) => ({
          id: booking.id,
          user_id: booking.user_id,
          full_name: booking.full_name,
          phone: booking.phone,
          address: booking.address,
          cylinder_quantity: booking.cylinder_quantity,
          status: booking.status,
          created_at: booking.created_at,
          updated_at: booking.updated_at ?? null,
          archived_at: archivedAt,
        }));

        const bookingIds = gasBookings.map((booking) => booking.id);
        const { data: existingArchiveRows, error: existingArchiveError } = await supabase
          .from('gas_booking_archive')
          .select('id')
          .in('id', bookingIds);

        if (existingArchiveError) throw existingArchiveError;

        const existingArchiveIds = new Set(
          (existingArchiveRows ?? []).map((row: { id: number }) => row.id),
        );
        const archiveRowsToInsert = archiveRows.filter(
          (row) => !existingArchiveIds.has(row.id),
        );

        if (archiveRowsToInsert.length > 0) {
          const { error: archiveError } = await supabase
            .from('gas_booking_archive')
            .insert(archiveRowsToInsert);
          if (archiveError) throw archiveError;
        }

        for (const bookingId of bookingIds) {
          await adminDeleteRecord('gas_bookings', bookingId);
        }

        setGasBookings([]);
        await loadGasBookingArchive();
        Alert.alert(
          'All bookings deleted',
          'All active gas bookings were removed. Member accounts are unchanged, and the bookings are preserved in Gas Booking History.',
        );
      } catch (error: any) {
        console.error('[Gas Booking] Delete all failed:', error);
        Alert.alert(
          'Delete failed',
          error?.message || 'Unable to delete all gas bookings. Please check the admin database policies.',
        );
      }
    };

    if (Platform.OS === 'web') {
      if (confirmed) await deleteBookings();
      return;
    }

    Alert.alert(
      'Delete ALL gas bookings?',
      `This will remove all ${gasBookings.length} booking(s) from the active list. Member accounts will NOT be deleted. A history copy of every booking will be kept for the Gas Booking History PDF.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'DELETE ALL BOOKINGS',
          style: 'destructive',
          onPress: deleteBookings,
        },
      ],
    );
  }

  function getGasArchiveDateKey(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value.slice(0, 10);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const gasArchiveDates = useMemo(() => {
    const dates = Array.from(
      new Set(gasBookingArchive.map((booking) => getGasArchiveDateKey(booking.archived_at))),
    );
    return dates.sort((a, b) => b.localeCompare(a));
  }, [gasBookingArchive]);

  const selectedGasArchiveBookings = useMemo(() => {
    if (!selectedGasArchiveDate) return gasBookingArchive;
    return gasBookingArchive.filter(
      (booking) => getGasArchiveDateKey(booking.archived_at) === selectedGasArchiveDate,
    );
  }, [gasBookingArchive, selectedGasArchiveDate]);

  async function printGasBookingArchive() {
    const records = selectedGasArchiveBookings;
    if (records.length === 0) {
      Alert.alert('No history', 'There are no archived gas bookings for the selected deleted date.');
      return;
    }

    try {
      const rows = records.map((booking, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(booking.full_name)}</td>
          <td>${escapeHtml(booking.phone)}</td>
          <td>${escapeHtml(booking.address || '-')}</td>
          <td>${booking.cylinder_quantity}</td>
        </tr>`).join('');

      const selectedLabel = selectedGasArchiveDate
        ? formatDate(`${selectedGasArchiveDate}T00:00:00`)
        : 'All deleted dates';

      const html = `
        <html><head><meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          @page { size: A4 landscape; margin: 18px; }
          body { font-family: Arial, sans-serif; padding: 10px; color: #111; }
          h1 { color: #C62828; margin: 0; font-size: 24px; }
          h2 { margin: 3px 0 0; font-size: 16px; }
          .subtitle { color: #555; margin: 6px 0 18px; font-size: 11px; }
          table { width: 100%; border-collapse: collapse; font-size: 9px; }
          th, td { border: 1px solid #ccc; padding: 6px; text-align: left; vertical-align: top; }
          th { background: #C62828; color: white; }
          tr:nth-child(even) { background: #f7f7f7; }
          .footer { margin-top: 18px; font-size: 9px; color: #777; border-top: 1px solid #ddd; padding-top: 8px; }
        </style></head><body>
          <h1>YMA Salem Branch</h1>
          <h2>Gas Booking History / Archive</h2>
          <div class="subtitle">Gas Booking Deleted Date: ${escapeHtml(selectedLabel)} &nbsp; • &nbsp; Deleted Bookings: ${records.length}</div>
          <table><thead><tr><th>No.</th><th>Booker Name</th><th>Phone Number</th><th>Address</th><th>Gas Booked</th></tr></thead>
          <tbody>${rows}</tbody></table>
          <div class="footer">YMA Salem Branch • GAS BOOKING HISTORY • Deleted booking records are retained for reference.</div>
        </body></html>`;

      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (!printWindow) throw new Error('Please allow pop-ups in your browser to print.');
        printWindow.document.write(`${html.replace('</body>', '<script>window.onload=function(){setTimeout(function(){window.print()},300)}</script></body>')}`);
        printWindow.document.close();
      } else {
        await Print.printAsync({ html });
      }
    } catch (error: any) {
      Alert.alert('Print failed', error?.message || 'Unable to open the history print preview.');
    }
  }

  async function loadAll() {
    const generation = ++loadGeneration.current;
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setAuthorized(false);
        setLoading(false);
        router.replace('/login');
        return;
      }

      const adminAccount = await checkAdmin(session.user.id);

      if (!adminAccount) {
        setAuthorized(false);
        setAdminRole(null);
        setLoading(false);

        Alert.alert(
          'Access denied',
          'Only approved YMA Salem Branch administrators can access this page.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/'),
            },
          ],
        );

        return;
      }

      setAuthorized(true);
      setAdminRole(adminAccount.role);
      await loadMyProfile();

      if (adminAccount.role === 'cemetery_admin') {
        setSection('cemetery');

        // Fetch every cemetery record in pages. This avoids a project/API
        // max-rows setting from making the admin appear to stop after a few
        // records (for example, after 4 records).
        const allCemeteryRows: any[] = [];
        let cemeteryOffset = 0;
        const cemeteryPageSize = 100;
        let cemeteryFetchError: any = null;

        while (true) {
          const { data, error } = await supabase
            .from('cemetery_records')
            .select('*')
            .order('deceased_name', { ascending: true })
            .order('id', { ascending: true })
            .range(cemeteryOffset, cemeteryOffset + cemeteryPageSize - 1);

          if (error) {
            cemeteryFetchError = error;
            break;
          }

          const page = data || [];
          allCemeteryRows.push(...page);
          if (page.length === 0) break;
          cemeteryOffset += page.length;
          // If the backend returns a partial page, we have reached the end.
          if (page.length < cemeteryPageSize) {
            // Some Supabase projects have a lower API max-rows setting.
            // Probe the next range once so records beyond that cap are not lost.
            const { data: probe, error: probeError } = await supabase
              .from('cemetery_records')
              .select('*')
              .order('deceased_name', { ascending: true })
              .order('id', { ascending: true })
              .range(cemeteryOffset, cemeteryOffset + cemeteryPageSize - 1);
            if (probeError) {
              cemeteryFetchError = probeError;
              break;
            }
            if (!probe || probe.length === 0) break;
            allCemeteryRows.push(...probe);
            cemeteryOffset += probe.length;
          }
        }

        if (!cemeteryFetchError) {
          // De-duplicate rows by id because the probe above can overlap only
          // when a backend applies an unusual range limit.
          const uniqueRows = Array.from(
            new Map(allCemeteryRows.map((row) => [String(row.id), row])).values(),
          );
          setCemeteryRecords(uniqueRows as CemeteryRecord[]);
        } else {
          console.log('Cemetery Admin load error:', cemeteryFetchError.message);
          setCemeteryRecords([]);
        }

        setAdminRequests([]);
        return;
      }

      /*
       * Full Access Admin:
       * Load every existing management section.
       */
      const [
        membersResult,
        galleryResult,
        newsResult,
        eventsResult,
        wasteBillsResult,
        zonunResult,
        branchLeadersResult,
        sectionLeadersResult,
        cemeteryResult,
        gasBookingsResult,
      ] = await Promise.all([
        supabase
          .from('members')
          .select('*')
          .order('created_at', {
            ascending: false,
          }),

        supabase
          .from('gallery')
          .select('*')
          .order('created_at', {
            ascending: false,
          }),

        supabase
          .from('news')
          .select('*')
          .order('published_at', {
            ascending: false,
          }),

        supabase
          .from('events')
          .select('*')
          .order('event_date', {
            ascending: true,
          }),

        supabase
          .from('waste_bills')
          .select('*')
          .order('created_at', {
            ascending: false,
          }),

        supabase
          .from('zonun')
          .select('*')
          .order('created_at', {
            ascending: false,
          }),

        supabase
          .from('branch_leaders')
          .select('id, position, full_name, phone, photo_url, display_order, is_active')
          .order('display_order', { ascending: true }),

        supabase
          .from('section_leaders')
          .select('id, section, position, full_name, phone, photo_url, display_order, is_active')
          .order('section', { ascending: true })
          .order('display_order', { ascending: true }),

        supabase
          .from('cemetery_records')
          .select('*')
          .order('deceased_name', {
            ascending: true,
          }),

        supabase
          .from('gas_bookings')
          .select(
            'id, user_id, full_name, phone, address, cylinder_quantity, status, created_at, updated_at',
          )
          .order('created_at', {
            ascending: false,
          }),
      ]);

      if (generation !== loadGeneration.current) return;

      if (!membersResult.error) {
        setMembers(
          membersResult.data || [],
        );
      }

      if (!galleryResult.error) {
        setGallery(
          galleryResult.data || [],
        );
      }
      const { data: albumRows, error: albumError } = await supabase
        .from('gallery_albums')
        .select('id, title, description, created_at')
        .order('created_at', { ascending: false });
      if (!albumError) {
        const loadedAlbums = (albumRows || []) as GalleryAlbum[];
        setGalleryAlbums(loadedAlbums);
        if (loadedAlbums.length && !loadedAlbums.some((album) => album.title === selectedGalleryAlbum)) {
          setSelectedGalleryAlbum(loadedAlbums[0].title);
        }
      }

      if (!newsResult.error) {
        setNews(
          newsResult.data || [],
        );
      }

      const { data: aboutRow } = await supabase
        .from('branch_info')
        .select('about_content')
        .eq('id', 1)
        .maybeSingle();
      setAboutContent(aboutRow?.about_content || '');

      if (!eventsResult.error) {
        setEvents(
          eventsResult.data || [],
        );
      } else {
        console.log('Events load error:', eventsResult.error.message);
      }

      if (!wasteBillsResult.error) {
        setWasteBills(
          wasteBillsResult.data || [],
        );
      }

      if (!zonunResult.error) {
        setZonun(
          (zonunResult.data || []) as ZonunItem[],
        );
      } else {
        console.log(
          'Dashboard Zonun error:',
          zonunResult.error.message,
        );
        setZonun([]);
      }

      if (!branchLeadersResult.error) {
        setBranchLeaders(
          ((branchLeadersResult.data || []) as BranchLeader[]).map((item) => ({
            ...item,
            position: normalizeBranchLeaderPosition(item.position),
          })),
        );
      } else {
        console.log(
          'Branch leaders load error:',
          branchLeadersResult.error.message,
        );
        setBranchLeaders([]);
      }

      if (!sectionLeadersResult.error) {
        setSectionLeaders(
          (sectionLeadersResult.data || []).map((item) => ({
            ...(item as SectionLeader),
            section: normalizeSectionName((item as SectionLeader).section),
            position: normalizeSectionLeaderPosition((item as SectionLeader).position),
          })),
        );
      } else {
        console.log('Section leaders load error:', sectionLeadersResult.error.message);
      }

      if (!cemeteryResult.error) {
        setCemeteryRecords(
          (cemeteryResult.data || []) as CemeteryRecord[],
        );
      } else {
        console.log(
          'Dashboard Cemetery error:',
          cemeteryResult.error.message,
        );
        setCemeteryRecords([]);
      }

      if (!gasBookingsResult.error) {
        setGasBookings(
          (gasBookingsResult.data ||
            []) as GasBooking[],
        );
      } else {
        console.log(
          'Dashboard gas booking error:',
          gasBookingsResult.error.message,
        );

        setGasBookings([]);
      }

      const { data: paymentSettings } = await supabase
        .from('waste_payment_settings')
        .select('id, upi_id, payee_name, instructions')
        .eq('id', 1)
        .maybeSingle();
      if (paymentSettings) {
        const settings = paymentSettings as WastePaymentSettings;
        setWastePaymentSettings(settings);
        setWasteUpiId(settings.upi_id || '');
        setWastePayeeName(settings.payee_name || 'YMA Salem Branch');
        setWastePaymentInstructions(settings.instructions || 'Pay using any UPI app and submit the UTR after payment.');
      }

      await loadAdminRequests(adminAccount.role);
    } catch (error) {
      console.log(
        'Admin load error:',
        error,
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  // Refresh Admin data whenever this screen becomes active again.
  // This keeps the member list in sync after deleting/editing a member.
  useFocusEffect(
    React.useCallback(() => {
      loadAll();
    }, []),
  );

  async function refresh() {
    setRefreshing(true);
    await loadAll();
  }

  async function pickNewsImage() {
    if (!(await ensureImageLibraryPermission())) return;

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
      });

    if (
      result.canceled ||
      !result.assets?.[0]?.uri
    ) {
      return;
    }

    try {
      setSavingNews(true);

      const url = await uploadImage(
        result.assets[0].uri,
        'news',
      );

      setNewsImage(url);
    } catch (error: any) {
      Alert.alert(
        'Upload failed',
        error?.message ||
          'Unable to upload image.',
      );
    } finally {
      setSavingNews(false);
    }
  }

  async function pickEventImage() {
    if (!(await ensureImageLibraryPermission())) return;

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
      });

    if (
      result.canceled ||
      !result.assets?.[0]?.uri
    ) {
      return;
    }

    try {
      setSavingEvent(true);

      const url = await uploadImage(
        result.assets[0].uri,
        'events',
      );

      setEventImage(url);
    } catch (error: any) {
      Alert.alert(
        'Upload failed',
        error?.message ||
          'Unable to upload image.',
      );
    } finally {
      setSavingEvent(false);
    }
  }

  async function createGalleryAlbum() {
    const title = newGalleryAlbumTitle.trim();
    if (!title) {
      Alert.alert('Album name required', 'Enter a name for the new album.');
      return;
    }
    setCreatingGalleryAlbum(true);
    try {
      if (editingGalleryAlbumId !== null) {
        const oldAlbum = galleryAlbums.find((album) => album.id === editingGalleryAlbumId);
        const { data, error } = await supabase
          .from('gallery_albums')
          .update({ title, description: newGalleryAlbumDescription.trim() || null })
          .eq('id', editingGalleryAlbumId)
          .select('id, title, description, created_at')
          .single();
        if (error) throw error;
        if (oldAlbum && oldAlbum.title !== title) {
          const { error: photoError } = await supabase.from('gallery').update({ category: title }).eq('category', oldAlbum.title);
          if (photoError) throw photoError;
        }
        setGalleryAlbums((current) => current.map((album) => album.id === editingGalleryAlbumId ? data as GalleryAlbum : album));
        setSelectedGalleryAlbum(title);
        setEditingGalleryAlbumId(null);
        Alert.alert('Album updated', `“${title}” has been updated.`);
      } else {
        const { data, error } = await supabase
          .from('gallery_albums')
          .insert({ title, description: newGalleryAlbumDescription.trim() || null })
          .select('id, title, description, created_at')
          .single();
        if (error) throw error;
        setGalleryAlbums((current) => [data as GalleryAlbum, ...current]);
        setSelectedGalleryAlbum(title);
        Alert.alert('Album created', `“${title}” is ready for photos.`);
      }
      setNewGalleryAlbumTitle('');
      setNewGalleryAlbumDescription('');
    } catch (error: any) {
      Alert.alert('Could not save album', error?.message || 'Please try again.');
    } finally {
      setCreatingGalleryAlbum(false);
    }
  }

  function editGalleryAlbum(album: GalleryAlbum) {
    setEditingGalleryAlbumId(album.id);
    setNewGalleryAlbumTitle(album.title);
    setNewGalleryAlbumDescription(album.description || '');
  }

  async function deleteGalleryAlbum(album: GalleryAlbum) {
    const confirmed = await webConfirm(
      'Delete album?',
      `“${album.title}” and the photos assigned to it will be removed permanently.`,
    );
    if (!confirmed) return;

    try {
      // Delete the database rows first. Storage cleanup is best-effort so a
      // storage-policy/network issue cannot leave the album stuck undeleted.
      const { data: photos, error: photoLoadError } = await supabase
        .from('gallery')
        .select('id, image_url')
        .eq('category', album.title);
      if (photoLoadError) throw photoLoadError;

      for (const photo of photos || []) {
        await adminDeleteRecord('gallery', photo.id);
      }
      await adminDeleteRecord('gallery_albums', album.id);

      setGalleryAlbums((current) => current.filter((item) => item.id !== album.id));
      if (selectedGalleryAlbum === album.title) {
        const remaining = galleryAlbums.find((item) => item.id !== album.id);
        setSelectedGalleryAlbum(remaining?.title || '');
      }
      if (editingGalleryAlbumId === album.id) {
        setEditingGalleryAlbumId(null);
        setNewGalleryAlbumTitle('');
        setNewGalleryAlbumDescription('');
      }

      let storageCleanupFailed = false;
      for (const photo of photos || []) {
        const path = getStoragePathFromUrl(photo.image_url);
        if (!path) continue;
        try {
          const { error: storageError } = await supabase.storage
            .from('gallery')
            .remove([path]);
          if (storageError) storageCleanupFailed = true;
        } catch {
          storageCleanupFailed = true;
        }
      }

      await loadAll();
      webNotify(
        'Album deleted',
        storageCleanupFailed
          ? 'The album and its photo records were deleted, but some stored image files could not be removed. Check Storage permissions in Supabase.'
          : `“${album.title}” and its photos were deleted.`,
      );
    } catch (error: any) {
      webNotify('Delete failed', error?.message || 'Unable to delete album. Check your admin permissions and Supabase policies.');
    }
  }

  async function pickGalleryImage() {
    if (galleryUploading) return;
    if (!(await ensureImageLibraryPermission())) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      // Editing is not supported when selecting multiple images.
      quality: 0.85,
      selectionLimit: 0,
    });

    if (result.canceled || !result.assets?.length) return;

    const assets = result.assets.filter((asset) => !!asset.uri);
    if (!assets.length) {
      webNotify('No photos selected', 'Please select one or more photos and try again.');
      return;
    }

    setGalleryUploading(true);
    setGalleryUploadProgress({ current: 0, total: assets.length });
    let uploadedCount = 0;
    const failures: string[] = [];

    try {
      // Upload sequentially to avoid overwhelming the device or Storage service.
      for (let index = 0; index < assets.length; index += 1) {
        const asset = assets[index];
        setGalleryUploadProgress({ current: index + 1, total: assets.length });

        try {
          const url = await uploadImage(asset.uri, 'gallery');
          const { error } = await supabase.from('gallery').insert({
            title: selectedGalleryAlbum,
            image_url: url,
            category: selectedGalleryAlbum,
            media_type: 'photo',
          });
          if (error) throw error;
          uploadedCount += 1;
        } catch (error: any) {
          failures.push(`Photo ${index + 1}: ${error?.message || 'Upload failed'}`);
        }
      }

      await loadAll();

      if (failures.length === 0) {
        webNotify(
          'Photos uploaded',
          `${uploadedCount} photo${uploadedCount === 1 ? '' : 's'} added to the “${selectedGalleryAlbum}” album.`,
        );
      } else {
        const summary = `${uploadedCount} of ${assets.length} photos uploaded successfully. ${failures.length} failed.\n\n${failures.slice(0, 3).join('\n')}`;
        webNotify('Upload partially completed', summary);
      }
    } finally {
      setGalleryUploading(false);
      setGalleryUploadProgress({ current: 0, total: 0 });
    }
  }

  async function saveAbout() {
    if (!aboutContent.trim()) {
      Alert.alert('Missing content', 'Please enter YMA Salem Branch Chanchin.');
      return;
    }
    setSavingAbout(true);
    try {
      const { error } = await supabase
        .from('branch_info')
        .upsert({ id: 1, about_content: aboutContent.trim(), updated_at: new Date().toISOString() });
      if (error) throw error;
      Alert.alert('Updated', 'YMA Salem Branch Chanchin updated successfully.');
    } catch (error: any) {
      Alert.alert('Update failed', error?.message || 'Unable to update YMA Salem Branch Chanchin.');
    } finally {
      setSavingAbout(false);
    }
  }

  function resetNewsForm() {
    setNewsTitle('');
    setNewsCategory('');
    setNewsContent('');
    setNewsImage('');
    setEditingNewsId(null);
  }

  function editNews(item: NewsItem) {
    setEditingNewsId(item.id);
    setNewsTitle(item.title || '');
    setNewsCategory(item.category || '');
    setNewsContent(item.content || '');
    setNewsImage(item.image_url || '');
    setSection('news');
  }

  async function saveNews() {
    if (!newsTitle.trim()) {
      Alert.alert(
        'Missing title',
        'Please enter a news title.',
      );
      return;
    }

    if (!newsContent.trim()) {
      Alert.alert(
        'Missing content',
        'Please enter the news content.',
      );
      return;
    }

    try {
      setSavingNews(true);

      const payload = {
        title: newsTitle.trim(),
        category:
          newsCategory.trim() || 'General',
        content: newsContent.trim(),
        image_url: newsImage || null,
        is_published: true,
        published_at:
          new Date().toISOString(),
      };

      if (editingNewsId) {
        const { error } = await supabase
          .from('news')
          .update(payload)
          .eq('id', editingNewsId);

        if (error) throw error;

        Alert.alert(
          'Updated',
          'News updated successfully.',
        );
      } else {
        const { error } = await supabase
          .from('news')
          .insert(payload);

        if (error) throw error;
        await publishNotification('New YMA Salem Branch News', newsTitle.trim(), { type: 'news' });

        Alert.alert(
          'Published',
          'News published successfully.',
        );
      }

      resetNewsForm();
      await loadAll();
    } catch (error: any) {
      Alert.alert(
        'Save failed',
        error?.message ||
          'Unable to save news.',
      );
    } finally {
      setSavingNews(false);
    }
  }

  async function toggleNews(item: NewsItem) {
    try {
      const { error } = await supabase
        .from('news')
        .update({
          is_published: !item.is_published,
        })
        .eq('id', item.id);

      if (error) throw error;

      await loadAll();
    } catch (error: any) {
      Alert.alert(
        'Update failed',
        error?.message ||
          'Unable to update news.',
      );
    }
  }

  async function deleteNews(item: NewsItem) {
    if (!(await webConfirm('Delete news?', `Delete "${item.title}" permanently?`))) return;
    try {
      await adminDeleteRecord('news', item.id);
      await loadAll();
    } catch (error: any) {
      Alert.alert('Delete failed', error?.message || 'Unable to delete news.');
    }
  }

  function resetEventForm() {
    setEventTitle('');
    setEventDescription('');
    setEventLocation('');
    setEventBranch('YMA Salem Branch');
    setEventImage('');
    setEventDateValue(new Date());
    setEditingEventId(null);
    setShowEventDatePicker(false);
    setShowEventTimePicker(false);
  }

  function editEvent(item: EventItem) {
    setEditingEventId(item.id);
    setEventTitle(item.title || '');
    setEventDescription(
      item.description || '',
    );
    setEventLocation(item.location || '');
    setEventBranch(
      item.organizing_branch ||
        'YMA Salem Branch',
    );
    setEventImage(item.image_url || '');

    if (item.event_date) {
      const date = new Date(
        item.event_date,
      );

      if (!Number.isNaN(date.getTime())) {
        setEventDateValue(date);
      } else {
        setEventDateValue(null);
      }
    } else {
      setEventDateValue(null);
    }

    setShowEventDatePicker(false);
    setShowEventTimePicker(false);
    setSection('events');
  }

  function handleEventDateChange(
    selectedDate?: Date,
  ) {
    setShowEventDatePicker(false);

    if (!selectedDate) return;

    const nextDate = eventDateValue
      ? new Date(eventDateValue)
      : new Date();

    nextDate.setFullYear(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
    );

    setEventDateValue(nextDate);
  }

  function handleEventTimeChange(
    selectedTime?: Date,
  ) {
    setShowEventTimePicker(false);

    if (!selectedTime) return;

    const nextDate = eventDateValue
      ? new Date(eventDateValue)
      : new Date();

    nextDate.setHours(
      selectedTime.getHours(),
      selectedTime.getMinutes(),
      0,
      0,
    );

    setEventDateValue(nextDate);
  }

  async function saveEvent() {
    if (!eventTitle.trim()) {
      Alert.alert(
        'Missing title',
        'Please enter an event title.',
      );
      return;
    }

    if (!eventDateValue) {
      Alert.alert(
        'Missing date & time',
        'Please select event date and time.',
      );
      return;
    }

    try {
      setSavingEvent(true);
      loadGeneration.current += 1;

      const payload = {
        title: eventTitle.trim(),
        description:
          eventDescription.trim() || null,
        location:
          eventLocation.trim() || null,
        event_date:
          eventDateValue.toISOString(),
        image_url: eventImage || null,
        organizing_branch:
          eventBranch.trim() ||
          'YMA Salem Branch',
        is_published: true,
        updated_at:
          new Date().toISOString(),
      };

      if (editingEventId) {
        const { error } = await supabase
          .from('events')
          .update(payload)
          .eq('id', editingEventId);
        if (error) throw error;
        setEvents(current => current.map(item => item.id === editingEventId ? { ...item, ...payload } : item));
        Alert.alert('Updated','Event updated successfully.');
      } else {
        const createdAt = new Date().toISOString();
        const { error } = await supabase
          .from('events')
          .insert({ ...payload, created_at: createdAt });
        if (error) throw error;
        await loadAll();
        await publishNotification('New YMA Salem Branch Programme', eventTitle.trim(), { type: 'event' });
        Alert.alert('Published','Event published successfully.');
      }

      resetEventForm();
    } catch (error: any) {
      Alert.alert(
        'Save failed',
        error?.message ||
          'Unable to save event.',
      );
    } finally {
      setSavingEvent(false);
    }
  }

  async function toggleEvent(item: EventItem) {
    try {
      const { error } = await supabase
        .from('events')
        .update({
          is_published: !item.is_published,
          updated_at:
            new Date().toISOString(),
        })
        .eq('id', item.id);

      if (error) throw error;

      await loadAll();
    } catch (error: any) {
      Alert.alert(
        'Update failed',
        error?.message ||
          'Unable to update event.',
      );
    }
  }

  async function deleteEvent(item: EventItem) {
    if (!(await webConfirm('Delete event?', `Delete "${item.title}" permanently?`))) return;
    try {
      await adminDeleteRecord('events', item.id);
      await loadAll();
    } catch (error: any) {
      Alert.alert('Delete failed', error?.message || 'Unable to delete event.');
    }
  }

  async function deleteGalleryItem(item: GalleryItem) {
    const confirmed = await webConfirm(
      'Delete photo?',
      'This photo will be removed from Gallery permanently.',
    );
    if (!confirmed) return;

    try {
      await adminDeleteRecord('gallery', item.id);

      const storagePath = getStoragePathFromUrl(item.image_url);
      let storageCleanupFailed = false;
      if (storagePath) {
        const { error: storageError } = await supabase.storage
          .from('gallery')
          .remove([storagePath]);
        storageCleanupFailed = Boolean(storageError);
      }

      await loadAll();
      if (storageCleanupFailed) {
        webNotify('Photo removed', 'The photo was removed from Gallery, but its stored file could not be deleted. Check Supabase Storage permissions.')
      }
    } catch (error: any) {
      webNotify(
        'Delete failed',
        error?.message || 'Unable to delete photo. Check your admin permissions and Supabase policies.',
      );
    }
  }

  async function saveWastePaymentSettings() {
    if (!wasteUpiId.trim() || !wasteUpiId.includes('@')) {
      Alert.alert('Invalid UPI ID', 'Please enter a valid UPI ID such as example@upi.'); return;
    }
    try {
      setSavingWastePaymentSettings(true);
      const { data, error } = await supabase.from('waste_payment_settings').upsert({ id: 1, upi_id: wasteUpiId.trim(), payee_name: wastePayeeName.trim() || 'YMA Salem Branch', instructions: wastePaymentInstructions.trim() || null, updated_at: new Date().toISOString() }, { onConflict: 'id' }).select('id, upi_id, payee_name, instructions').single();
      if (error) throw error;
      setWastePaymentSettings(data as WastePaymentSettings);
      Alert.alert('Saved', 'Waste Fee UPI settings have been updated.');
    } catch (error: any) { Alert.alert('Save failed', error?.message || 'Unable to save UPI settings.'); }
    finally { setSavingWastePaymentSettings(false); }
  }

  async function downloadWastePaymentReport() {
    const rows = wasteBills.map((bill) => { const member = members.find((m) => m.user_id === bill.user_id); return `<tr><td>${bill.house_number || member?.house_number || '-'}</td><td>${member?.full_name || '-'}</td><td>${bill.account_no || '-'}</td><td>${bill.bill_month || '-'}</td><td>₹${Number(bill.amount || 0).toFixed(2)}</td><td>${bill.status || '-'}</td><td>${bill.payment_method || '-'}</td><td>${bill.payment_utr || '-'}</td><td>${bill.receipt_no || '-'}</td><td>${formatDateTime(bill.paid_at || bill.payment_submitted_at || bill.created_at)}</td></tr>`; }).join('');
    const html = `<html><body style="font-family:Arial;padding:24px"><h1>YMA Salem Branch — Waste Fee Payment Report</h1><p>Generated ${formatDateTime(new Date().toISOString())}</p><table style="width:100%;border-collapse:collapse;font-size:11px"><thead><tr><th>House No.</th><th>Member</th><th>Account</th><th>Month</th><th>Amount</th><th>Status</th><th>Method</th><th>UTR</th><th>Receipt</th><th>Date</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
    try {
      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (!printWindow) throw new Error('Please allow pop-ups in your browser to print the report.');
        printWindow.document.write(`${html.replace('</body>', '<script>window.onload=function(){setTimeout(function(){window.print()},300)}</script></body>')}`);
        printWindow.document.close();
        return;
      }
      const file = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: 'Save / share payment report' });
      else await Print.printAsync({ html });
    } catch (error: any) { Alert.alert('Report error', error?.message || 'Unable to create payment report.'); }
  }

  const filteredWasteMembers = members.filter((member) => {
    if (!member.user_id) return false;
    const q = wasteMemberSearch.trim().toLowerCase();
    if (!q) return true;
    return [member.full_name, member.house_number, member.phone, member.email]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q));
  });

  function toggleWasteMemberSelection(userId?: string | null) {
    if (!userId) return;
    setSelectedWasteMemberIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    );
  }

  function selectedWasteMembersSummary(list: Member[], ids: string[]) {
    const names = list
      .filter((member) => member.user_id && ids.includes(member.user_id))
      .map((member) => `${member.full_name} (House No. ${member.house_number || '—'})`);
    return names.join(' • ');
  }

  function toggleAllVisibleWasteMembers() {
    const visibleIds = filteredWasteMembers
      .map((member) => member.user_id)
      .filter(Boolean) as string[];
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedWasteMemberIds.includes(id));
    setSelectedWasteMemberIds((current) => {
      if (allSelected) return current.filter((id) => !visibleIds.includes(id));
      return Array.from(new Set([...current, ...visibleIds]));
    });
  }

  function resetWasteBillForm() {
    setSelectedWasteMemberIds([]);
    setWasteMemberSearch('');
    setWasteBillMonth('');
    setWasteAmount('');
    setWasteDueDate('');
    setWasteStatus('unpaid');
  }

  const selectedWasteHouseNumbers = useMemo(() => {
    const seen = new Set<string>();
    members
      .filter((member) => Boolean(member.user_id) && selectedWasteMemberIds.includes(member.user_id as string))
      .forEach((member) => {
        const house = member.house_number?.trim();
        if (house) seen.add(house);
      });
    return Array.from(seen);
  }, [members, selectedWasteMemberIds]);

  async function saveWasteBill() {
    if (!selectedWasteMemberIds.length) {
      Alert.alert('Select family member', 'Select at least one registered member. The selected member represents that member\'s whole household by House Number.');
      return;
    }

    const selectedWasteMembers = members.filter(
      (member) => Boolean(member.user_id) && selectedWasteMemberIds.includes(member.user_id as string),
    );

    if (!selectedWasteMembers.length) {
      Alert.alert('No valid members', 'The selected member records are no longer available. Please select again.');
      return;
    }

    const selectedFamilies = Array.from(
      new Map(
        selectedWasteMembers
          .map((member) => {
            const house = member.house_number?.trim();
            if (!house || !member.user_id) return null;
            return [house, member] as const;
          })
          .filter(Boolean) as Array<[string, Member]>
      ).entries()
    ).map(([houseNumber, member]) => ({ houseNumber, member }));

    if (!selectedFamilies.length) {
      Alert.alert('House Number required', 'Every selected member must have a House Number before creating a Waste Fee bill.');
      return;
    }

    if (!wasteBillMonth.trim()) {
      Alert.alert('Missing bill month', 'Please enter the bill month.');
      return;
    }

    if (!wasteAmount.trim()) {
      Alert.alert('Missing amount', 'Please enter the bill amount.');
      return;
    }

    const amount = Number(wasteAmount.replace(/,/g, ''));
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Invalid amount', 'Please enter a Waste Fee amount greater than zero.');
      return;
    }

    const confirmed = await webConfirm(
      'Create household Waste Fee bills?',
      `Create ₹${amount.toFixed(2)} Waste Fee bill${selectedFamilies.length === 1 ? '' : 's'} for ${selectedFamilies.length} household${selectedFamilies.length === 1 ? '' : 's'} for ${wasteBillMonth.trim()}? Selecting one member bills the whole family registered under that House Number.`,
    );
    if (!confirmed) return;

    try {
      setSavingWasteBill(true);

      const houseNumbers = selectedFamilies.map((item) => item.houseNumber);
      const { data: existingBills, error: existingError } = await supabase
        .from('waste_bills')
        .select('id, user_id, house_number, bill_month')
        .eq('bill_month', wasteBillMonth.trim())
        .in('house_number', houseNumbers);

      if (existingError) throw existingError;

      const existingHouses = new Set(
        (existingBills || [])
          .map((row: any) => String(row.house_number || '').trim())
          .filter(Boolean),
      );

      const rows = selectedFamilies
        .filter(({ houseNumber }) => !existingHouses.has(houseNumber))
        .map(({ houseNumber, member }) => ({
          // One household bill: the selected member is only the representative.
          // All family members with this House Number see/pay the same record.
          user_id: member.user_id,
          house_number: houseNumber,
          account_no: houseNumber,
          bill_month: wasteBillMonth.trim(),
          amount,
          due_date: wasteDueDate.trim() || null,
          status: wasteStatus || 'unpaid',
        }));

      if (!rows.length) {
        Alert.alert('No new household bills', `All selected House Numbers already have a Waste Fee bill for ${wasteBillMonth.trim()}.`);
        return;
      }

      for (let index = 0; index < rows.length; index += 100) {
        const { error } = await supabase.from('waste_bills').insert(rows.slice(index, index + 100));
        if (error) throw error;
      }

      const skippedFamilies = selectedFamilies.length - rows.length;
      Alert.alert(
        'Household bills created',
        `${rows.length} Waste Fee household bill${rows.length === 1 ? '' : 's'} created successfully.${skippedFamilies ? ` ${skippedFamilies} selected household${skippedFamilies === 1 ? '' : 's'} already had a Waste Fee bill for ${wasteBillMonth.trim()}.` : ''}`,
      );

      resetWasteBillForm();
      await loadAll();
    } catch (error: any) {
      Alert.alert('Save failed', error?.message || 'Unable to create household Waste Fee bills.');
    } finally {
      setSavingWasteBill(false);
    }
  }

  async function markWasteBillPaid(bill: WasteBill) {
    if (!(await webConfirm('Verify and issue receipt?', `₹${Number(bill.amount || 0).toFixed(2)} • ${bill.bill_month || '-'}`))) return;
    try {
      const receiptNo = `YMA-${Date.now()}`;
      const { error } = await supabase.from('waste_bills').update({
        status: 'paid', paid_at: new Date().toISOString(), receipt_no: receiptNo,
        payment_method: 'Admin', updated_at: new Date().toISOString(),
      }).eq('id', bill.id);
      if (error) throw error;
      await loadAll();
    } catch (error: any) {
      Alert.alert('Update failed', error?.message || 'Unable to update bill.');
    }
  }

  async function deleteWasteBill(bill: WasteBill) {
    const confirmed = await webConfirm(
      'Delete bill?',
      `Delete ${bill.bill_month || 'this bill'} permanently?`,
    );
    if (!confirmed) return;

    try {
      // Waste Fee bills are deleted directly first. This avoids the old
      // admin_delete_record RPC blocking the confirmed delete when its
      // database function is missing/outdated.
      const { error: directDeleteError } = await supabase
        .from('waste_bills')
        .delete()
        .eq('id', bill.id);

      if (directDeleteError) {
        // Keep the existing RPC as a fallback for projects where the
        // direct DELETE policy is intentionally restricted.
        await adminDeleteRecord('waste_bills', bill.id);
      }

      // Verify that the confirmed record is actually gone.
      const { data: stillExists, error: verifyError } = await supabase
        .from('waste_bills')
        .select('id')
        .eq('id', bill.id)
        .maybeSingle();

      if (verifyError) throw verifyError;
      if (stillExists) {
        throw new Error(
          'The Waste Fee bill is still in the database. Please run the Waste Fee DELETE policy/RPC SQL in Supabase.',
        );
      }

      // Remove it immediately from the current screen.
      setWasteBills((current) =>
        current.filter((item) => String(item.id) !== String(bill.id)),
      );

      await loadAll();
      webNotify('Deleted', `${bill.bill_month || 'Waste Fee bill'} has been deleted successfully.`);
    } catch (error: any) {
      console.error('[Waste Fee] Delete failed:', error);
      Alert.alert(
        'Delete failed',
        error?.message || 'Unable to delete bill. Check the Waste Fee delete policy/RPC in Supabase.',
      );
      await loadAll();
    }
  }

  function resetZonunForm() {
    setZonunTitle('');
    setZonunDescription('');
    setZonunIssueMonth('');
    setZonunPdfUrl('');
  }

  async function pickZonunPdf() {
    try {
      const result =
        await DocumentPicker.getDocumentAsync({
          type: 'application/pdf',
          copyToCacheDirectory: true,
          multiple: false,
        });

      if (result.canceled || !result.assets?.[0]?.uri) {
        return;
      }

      setSavingZonun(true);

      const url = await uploadZonunPdf(
        result.assets[0].uri,
      );

      setZonunPdfUrl(url);

      Alert.alert(
        'PDF selected',
        'Zonun PDF is ready to publish.',
      );
    } catch (error: any) {
      Alert.alert(
        'Upload failed',
        error?.message ||
          'Unable to upload Zonun PDF.',
      );
    } finally {
      setSavingZonun(false);
    }
  }

  async function saveZonun() {
    if (!zonunTitle.trim()) {
      Alert.alert(
        'Missing title',
        'Please enter the Zonun title.',
      );
      return;
    }

    if (!zonunIssueMonth.trim()) {
      Alert.alert(
        'Missing issue month',
        'Please enter the issue month.',
      );
      return;
    }

    if (!zonunPdfUrl) {
      Alert.alert(
        'Missing PDF',
        'Please select and upload the Zonun PDF.',
      );
      return;
    }

    try {
      setSavingZonun(true);

      const { error } = await supabase
        .from('zonun')
        .insert({
          title: zonunTitle.trim(),
          description:
            zonunDescription.trim() || null,
          issue_month: zonunIssueMonth.trim(),
          pdf_url: zonunPdfUrl,
          is_published: true,
        });

      if (error) throw error;

      Alert.alert(
        'Published',
        'Zonun issue published successfully.',
      );

      resetZonunForm();
      await loadAll();
    } catch (error: any) {
      Alert.alert(
        'Save failed',
        error?.message ||
          'Unable to publish Zonun.',
      );
    } finally {
      setSavingZonun(false);
    }
  }

  async function toggleZonun(item: ZonunItem) {
    try {
      const { error } = await supabase
        .from('zonun')
        .update({
          is_published: !item.is_published,
        })
        .eq('id', item.id);

      if (error) throw error;

      await loadAll();
    } catch (error: any) {
      Alert.alert(
        'Update failed',
        error?.message ||
          'Unable to update Zonun.',
      );
    }
  }

  async function deleteZonun(item: ZonunItem) {
    if (!(await webConfirm('Delete Zonun?', `Delete "${item.title}" permanently?`))) return;
    try {
      await adminDeleteRecord('zonun', item.id);
      const storagePath = getZonunStoragePathFromUrl(item.pdf_url);
      if (storagePath) { try { await supabase.storage.from('zonun').remove([storagePath]); } catch {} }
      await loadAll();
    } catch (error: any) {
      Alert.alert('Delete failed', error?.message || 'Unable to delete Zonun.');
    }
  }

  function resetLeaderForm() {
    setLeaderPosition('President');
    setLeaderFullName('');
    setLeaderPhone('');
    setLeaderPhoto('');
    setLeaderDisplayOrder('1');
    setLeaderActive(true);
    setEditingLeaderId(null);
  }

  function editBranchLeader(item: BranchLeader) {
    setEditingLeaderId(item.id);
    setLeaderPosition(item.position || 'President');
    setLeaderFullName(item.full_name || '');
    setLeaderPhone(item.phone || '');
    setLeaderPhoto(item.photo_url || '');
    setLeaderDisplayOrder(String(item.display_order ?? 1));
    setLeaderActive(item.is_active !== false);
    setSection('leaders');
  }

  async function pickLeaderPhoto() {
    if (!(await ensureImageLibraryPermission())) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    try {
      setSavingLeader(true);
      const url = await uploadImage(
        result.assets[0].uri,
        'branch-leaders',
      );
      setLeaderPhoto(url);
    } catch (error: any) {
      Alert.alert(
        'Upload failed',
        error?.message || 'Unable to upload leader photo.',
      );
    } finally {
      setSavingLeader(false);
    }
  }

  async function saveBranchLeader() {
    if (!leaderFullName.trim()) {
      Alert.alert('Missing name', 'Please enter the leader name.');
      return;
    }

    const positionOrder = BRANCH_LEADER_POSITIONS.indexOf(leaderPosition) + 1;
    const order = editingLeaderId ? Number(leaderDisplayOrder) : positionOrder;
    if (!Number.isFinite(order) || order < 1) {
      Alert.alert('Invalid order', 'Display order must be 1 or higher.');
      return;
    }

    const duplicate = branchLeaders.find(
      (item) =>
        item.position === leaderPosition &&
        item.id !== editingLeaderId,
    );

    if (duplicate) {
      Alert.alert(
        'Position already used',
        `${leaderPosition} already has a branch leader. Edit that entry instead.`,
      );
      return;
    }

    try {
      setSavingLeader(true);

      const payload = {
        position: leaderPosition,
        full_name: leaderFullName.trim(),
        phone: leaderPhone.trim() || null,
        photo_url: leaderPhoto || null,
        display_order: order,
        is_active: leaderActive,
      };

      if (editingLeaderId) {
        const { error } = await supabase
          .from('branch_leaders')
          .update(payload)
          .eq('id', editingLeaderId);

        if (error) throw error;
        Alert.alert('Updated', 'Branch leader updated successfully.');
      } else {
        const { error } = await supabase
          .from('branch_leaders')
          .insert(payload);

        if (error) throw error;
        Alert.alert('Added', 'Branch leader added successfully.');
      }

      resetLeaderForm();
      await loadAll();
    } catch (error: any) {
      Alert.alert(
        'Save failed',
        error?.message || 'Unable to save branch leader.',
      );
    } finally {
      setSavingLeader(false);
    }
  }

  async function toggleBranchLeader(item: BranchLeader) {
    try {
      const { error } = await supabase
        .from('branch_leaders')
        .update({ is_active: !item.is_active })
        .eq('id', item.id);

      if (error) throw error;
      await loadAll();
    } catch (error: any) {
      Alert.alert(
        'Update failed',
        error?.message || 'Unable to change leader visibility.',
      );
    }
  }

  async function deleteBranchLeader(item: BranchLeader) {
    if (!(await webConfirm('Delete branch leader?', `Delete ${item.full_name} from Branch Leaders?`))) return;
    try {
      await adminDeleteRecord('branch_leaders', item.id);
      const storagePath = getStoragePathFromUrl(item.photo_url);
      if (storagePath) { try { await supabase.storage.from('gallery').remove([storagePath]); } catch {} }
      if (editingLeaderId === item.id) resetLeaderForm();
      await loadAll();
    } catch (error: any) {
      Alert.alert('Delete failed', error?.message || 'Unable to delete branch leader.');
    }
  }

  function resetSectionLeaderForm() {
    setSectionLeaderSection('Section I'); setSectionLeaderPosition('Leader'); setSectionLeaderFullName(''); setSectionLeaderPhone(''); setSectionLeaderPhoto(''); setSectionLeaderDisplayOrder('1'); setSectionLeaderActive(true); setEditingSectionLeaderId(null);
  }
  function editSectionLeader(item: SectionLeader) {
    setSectionLeaderSection(normalizeSectionName(item.section)); setSectionLeaderPosition(item.position); setSectionLeaderFullName(item.full_name); setSectionLeaderPhone(item.phone || ''); setSectionLeaderPhoto(item.photo_url || ''); setSectionLeaderDisplayOrder(String(item.display_order || 1)); setSectionLeaderActive(item.is_active !== false); setEditingSectionLeaderId(item.id); setSection('section-leaders');
  }
  async function pickSectionLeaderPhoto() {
    if (!(await ensureImageLibraryPermission())) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes:['images'], allowsEditing:true, aspect:[1,1], quality:0.9 }); if (result.canceled || !result.assets?.[0]?.uri) return;
    try { setSavingSectionLeader(true); setSectionLeaderPhoto(await uploadImage(result.assets[0].uri,'section-leaders')); } catch(error:any) { Alert.alert('Upload failed',error?.message || 'Unable to upload section leader photo.'); } finally { setSavingSectionLeader(false); }
  }
  async function saveSectionLeader() {
    if (!sectionLeaderFullName.trim()) { Alert.alert('Missing name','Please enter the leader name.'); return; }
    const positionOrder=SECTION_LEADER_POSITIONS.indexOf(sectionLeaderPosition)+1; const order=editingSectionLeaderId?Number(sectionLeaderDisplayOrder):positionOrder; if (!Number.isInteger(order)||order<1||order>6) { Alert.alert('Invalid position order','Position order must be between 1 and 6.'); return; }
    const duplicatePosition=sectionLeaders.find(i=>i.section===sectionLeaderSection&&normalizeSectionLeaderPosition(i.position)===normalizeSectionLeaderPosition(sectionLeaderPosition)&&i.id!==editingSectionLeaderId); if(duplicatePosition){Alert.alert('Position already used',`${sectionLeaderPosition} already exists in ${sectionLeaderSection}.`);return;}
    const duplicateOrder=sectionLeaders.find(i=>i.section===sectionLeaderSection&&i.display_order===order&&i.id!==editingSectionLeaderId); if(duplicateOrder){Alert.alert('Position order already used',`Position order ${order} is already assigned in ${sectionLeaderSection}.`);return;}
    try { setSavingSectionLeader(true); loadGeneration.current += 1; const payload={section:normalizeSectionName(sectionLeaderSection),position:sectionLeaderDatabasePosition(sectionLeaderPosition),full_name:sectionLeaderFullName.trim(),phone:sectionLeaderPhone.trim()||null,photo_url:sectionLeaderPhoto||null,display_order:order,is_active:sectionLeaderActive};
      if(editingSectionLeaderId){const{error}=await supabase.from('section_leaders').update(payload).eq('id',editingSectionLeaderId);if(error)throw error;setSectionLeaders(current=>current.map(item=>item.id===editingSectionLeaderId?{...item,...payload}:item));Alert.alert('Updated','Section leader updated successfully.');}
      else{
        const { error } = await supabase
          .from('section_leaders')
          .insert(payload);
        if (error) {
          console.error('[Section Hruaitu] Supabase insert failed:', error);
          throw error;
        }
        // Reload the row from Supabase so the real database id is used.
        // A client-generated temporary id would make immediate Edit/Delete unreliable.
        await loadAll();
        Alert.alert('Added','Section leader added successfully.');
      }
      resetSectionLeaderForm();
    } catch(error:any){ console.error('[Section Hruaitu] Save failed:', error); Alert.alert('Save failed',error?.message || 'Unable to save section leader.'); } finally {setSavingSectionLeader(false);}
  }
  async function toggleSectionLeader(item: SectionLeader) { try {const{error}=await supabase.from('section_leaders').update({is_active:!item.is_active}).eq('id',item.id);if(error)throw error;await loadAll();}catch(error:any){Alert.alert('Update failed',error?.message || 'Unable to change section leader visibility.');} }
  async function deleteSectionLeader(item: SectionLeader) {
    if (!(await webConfirm('Delete section leader?', `Delete ${item.full_name} from ${item.section}?`))) return;
    try {
      await adminDeleteRecord('section_leaders', item.id);
      const storagePath = getStoragePathFromUrl(item.photo_url);
      if (storagePath) { try { await supabase.storage.from('gallery').remove([storagePath]); } catch {} }
      if (editingSectionLeaderId === item.id) resetSectionLeaderForm();
      await loadAll();
    } catch (error: any) {
      Alert.alert('Delete failed', error?.message || 'Unable to delete section leader.');
    }
  }

  function getCemeteryGravePrefix(category: string) {
    const value = category.trim().toLowerCase();
    if (value === 'row a') return 'A';
    if (value === 'row b') return 'B';
    if (value === 'row c') return 'C';
    if (value === 'naupang thlan') return 'N';
    if (value === 'hlamzuih thlan') return 'H';
    return 'A';
  }

  async function getNextCemeteryGraveNumber(category: string, cemetery: string) {
    const prefix = getCemeteryGravePrefix(category);
    const allRows: any[] = [];
    let offset = 0;
    const pageSize = 100;
    while (true) {
      const { data, error } = await supabase
        .from('cemetery_records')
        .select('id,grave_number')
        .eq('cemetery_name', cemetery)
        .eq('row_name', category)
        .order('id', { ascending: true })
        .range(offset, offset + pageSize - 1);
      if (error) throw error;
      const page = data || [];
      allRows.push(...page);
      if (page.length === 0) break;
      offset += page.length;
      if (page.length < pageSize) {
        const { data: probe, error: probeError } = await supabase
          .from('cemetery_records')
          .select('id,grave_number')
          .eq('cemetery_name', cemetery)
          .eq('row_name', category)
          .order('id', { ascending: true })
          .range(offset, offset + pageSize - 1);
        if (probeError) throw probeError;
        if (!probe || probe.length === 0) break;
        allRows.push(...probe);
        offset += probe.length;
      }
    }

    let maxNumber = 0;
    allRows.forEach((record: any) => {
      const value = String(record?.grave_number || '').trim().toUpperCase();
      const match = value.match(new RegExp(`^${prefix}-(\\d+)$`));
      if (match) {
        const number = Number(match[1]);
        if (Number.isFinite(number)) maxNumber = Math.max(maxNumber, number);
      }
    });

    return `${prefix}-${String(maxNumber + 1).padStart(2, '0')}`;
  }

  function resetCemeteryForm() {
    setCemeteryDeceasedName('');
    setCemeteryPhoto('');
    setCemeteryAgeAtDeath('');
    setCemeteryDateOfBirth('');
    setCemeteryDateOfDeath('');
    setCemeteryName('Salem Cemetery');
    setCemeteryRowName('');
    setCemeteryGraveNumber('');
    setCemeteryAddToExistingGrave(false);
    setCemeteryFamilyName('');
    setCemeteryFamilyContactPhone('');
    setCemeteryBiography('');
    setCemeteryGravePhoto('');
    setCemeteryPublished(true);
    setEditingCemeteryId(null);
    setSection('cemetery');
  }

  async function updateGasBookingStatus(
    booking: GasBooking,
    status: string,
  ) {
    try {
      const { error } =
        await supabase
          .from('gas_bookings')
          .update({
            status,
            updated_at:
              new Date().toISOString(),
          })
          .eq('id', booking.id);

      if (error) throw error;

      await loadGasBookings();

      Alert.alert(
        'Updated',
        `Booking status changed to ${status}.`,
      );
    } catch (error: any) {
      Alert.alert(
        'Update failed',
        error?.message ||
          'Unable to update booking.',
      );
    }
  }

  function escapeHtml(
    value?: string | null,
  ) {
    return String(value ?? '-')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async function printGasBookings() {
    if (gasBookings.length === 0) {
      Alert.alert('No bookings', 'There are no gas bookings to print.');
      return;
    }

    try {
      const rows = gasBookings.map((booking, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(booking.full_name)}</td>
          <td>${escapeHtml(booking.phone)}</td>
          <td>${booking.cylinder_quantity}</td>
        </tr>`).join('');

      const html = `
        <html><head><meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          @page { size: A4 portrait; margin: 22mm 16mm; }
          body { font-family: Arial, sans-serif; color: #111; margin: 0; }
          h1 { color: #C62828; margin: 0; font-size: 24px; }
          h2 { margin: 4px 0 0; font-size: 17px; }
          .subtitle { color: #666; margin: 7px 0 18px; font-size: 11px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th, td { border: 1px solid #aaa; padding: 10px 9px; text-align: left; }
          th { background: #C62828; color: #fff; font-weight: 700; }
          td:first-child, td:last-child, th:first-child, th:last-child { text-align: center; }
          tr:nth-child(even) { background: #f7f7f7; }
          .footer { margin-top: 18px; font-size: 9px; color: #777; border-top: 1px solid #ddd; padding-top: 8px; }
        </style></head><body>
          <h1>YMA Salem Branch</h1>
          <h2>Gas Booking List</h2>
          <div class="subtitle">Generated: ${escapeHtml(formatDate(new Date().toISOString()))} &nbsp; • &nbsp; Total Bookings: ${gasBookings.length}</div>
          <table><thead><tr><th>No.</th><th>Booker Name</th><th>Phone Number</th><th>Gas Booked</th></tr></thead>
          <tbody>${rows}</tbody></table>
          <div class="footer">YMA Salem Branch • GAS BOOKING LIST</div>
        </body></html>`;

      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (!printWindow) throw new Error('Please allow pop-ups in your browser to print.');
        printWindow.document.write(`${html.replace('</body>', '<script>window.onload=function(){setTimeout(function(){window.print()},300)}</script></body>')}`);
        printWindow.document.close();
      } else {
        await Print.printAsync({ html });
      }
    } catch (error: any) {
      Alert.alert('Print failed', error?.message || 'Unable to open the print preview.');
    }
  }

  

  function editCemetery(item: CemeteryRecord) {
    setEditingCemeteryId(item.id);
    setCemeteryDeceasedName(item.deceased_name || '');
    setCemeteryPhoto(item.photo_url || '');
    setCemeteryAgeAtDeath(item.age_at_death == null ? '' : String(item.age_at_death));
    setCemeteryDateOfBirth(displayDateInput(item.date_of_birth));
    setCemeteryDateOfDeath(displayDateInput(item.date_of_death));
    setCemeteryName(item.cemetery_name || 'Salem Cemetery');
    setCemeteryRowName(item.row_name || '');
    setCemeteryGraveNumber(item.grave_number || '');
    setCemeteryFamilyName(item.family_name || '');
    setCemeteryFamilyContactPhone(item.family_contact_phone || '');
    setCemeteryBiography(item.biography || '');
    setCemeteryGravePhoto(item.grave_photo_url || '');
    setCemeteryPublished(item.is_published !== false);
    setSection('cemetery');
  }

  async function pickCemeteryPersonPhoto() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      setCemeteryPhotoUploading(true);
      const url = await uploadImage(result.assets[0].uri, 'cemetery/person');
      setCemeteryPhoto(url);
    } catch (error: any) {
      Alert.alert('Photo upload failed', error?.message || 'Unable to upload photo.');
    } finally {
      setCemeteryPhotoUploading(false);
    }
  }

  async function pickCemeteryPhoto() {
    if (!(await ensureImageLibraryPermission())) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    try {
      setCemeteryPhotoUploading(true);
      const url = await uploadImage(
        result.assets[0].uri,
        'cemetery',
      );
      setCemeteryGravePhoto(url);
    } catch (error: any) {
      Alert.alert(
        'Photo upload failed',
        error?.message || 'Unable to upload grave photo.',
      );
    } finally {
      setCemeteryPhotoUploading(false);
    }
  }

  async function saveCemetery() {
    setCemeterySaveError('');
    if (!cemeteryDeceasedName.trim()) {
      Alert.alert('Missing name', 'Please enter the deceased person\'s name.');
      return;
    }
    if (!cemeteryRowName.trim()) {
      Alert.alert('Select register', 'Please select Row A, Row B, Row C, Naupang Thlan or Hlamzuih Thlan.');
      return;
    }
    if (cemeteryAgeAtDeath.trim() && !Number.isFinite(Number(cemeteryAgeAtDeath.trim()))) {
      Alert.alert('Invalid age', 'Mitthi kum zat chu number-in ziak rawh.');
      return;
    }
    if (!validateCemeteryDateInput(cemeteryDateOfBirth)) {
      Alert.alert('Invalid Date of Birth', 'DD/MM/YYYY emaw YYYY chauh ziak rawh. Date of Birth chu optional a ni.');
      return;
    }
    if (!validateCemeteryDateInput(cemeteryDateOfDeath)) {
      Alert.alert('Invalid Date of Death', 'DD/MM/YYYY emaw YYYY chauh ziak rawh. Date of Death chu optional a ni.');
      return;
    }

    try {
      setSavingCemetery(true);

      const payload = {
        deceased_name: cemeteryDeceasedName.trim(),
        photo_url: cemeteryPhoto.trim() || null,
        age_at_death: cemeteryAgeAtDeath.trim() ? Number(cemeteryAgeAtDeath.trim()) : null,
        date_of_birth: normalizeDateInput(cemeteryDateOfBirth) || null,
        date_of_death: normalizeDateInput(cemeteryDateOfDeath) || null,
        cemetery_name: cemeteryName.trim() || 'Salem Cemetery',
        row_name: cemeteryRowName.trim() || null,
        grave_number: cemeteryGraveNumber.trim() || null,
        family_name: cemeteryFamilyName.trim() || null,
        family_contact_phone:
          cemeteryFamilyContactPhone.trim() || null,
        biography: cemeteryBiography.trim() || null,
        grave_photo_url: cemeteryGravePhoto.trim() || null,
        is_published: cemeteryPublished,
        updated_at: new Date().toISOString(),
      };

      if (editingCemeteryId) {
        // Existing grave numbers are preserved while editing a record.
        const { error } = await supabase
          .from('cemetery_records')
          .update(payload)
          .eq('id', editingCemeteryId);

        if (error) throw error;

        Alert.alert('Updated', 'Cemetery record updated successfully.');
      } else {
        // A new person can either get the next automatic grave number,
        // or be added to an existing grave. This intentionally allows
        // multiple deceased records to share one grave number.
        let graveNumber = cemeteryGraveNumber.trim();

        if (cemeteryAddToExistingGrave) {
          if (!graveNumber) {
            throw new Error('Select an existing Grave No. first.');
          }
        } else {
          graveNumber = await getNextCemeteryGraveNumber(
            cemeteryRowName.trim(),
            cemeteryName.trim() || 'Salem Cemetery',
          );
        }

        const insertPayload = { ...payload, grave_number: graveNumber };
        const { data: insertedRecord, error } = await supabase
          .from('cemetery_records')
          .insert(insertPayload)
          .select('*')
          .single();

        if (error) {
          throw new Error(
            `Database insert failed (${error.code || 'unknown'}): ${error.message || 'Unknown database error'}`
          );
        }
        if (!insertedRecord?.id) {
          throw new Error('The database did not return the newly saved cemetery record.');
        }

        Alert.alert(
          'Saved',
          `Cemetery record added successfully.\nGrave No.: ${graveNumber}`,
        );
      }

      resetCemeteryForm();
      await loadAll();
    } catch (error: any) {
      const message = error?.message || 'Unable to save cemetery record.';
      setCemeterySaveError(message);
      Alert.alert('Save failed', message);
    } finally {
      setSavingCemetery(false);
    }
  }

  async function toggleCemetery(item: CemeteryRecord) {
    try {
      const { error } = await supabase
        .from('cemetery_records')
        .update({
          is_published: !item.is_published,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      if (error) throw error;
      await loadAll();
    } catch (error: any) {
      Alert.alert(
        'Update failed',
        error?.message || 'Unable to update cemetery record.',
      );
    }
  }

  async function deleteCemetery(item: CemeteryRecord) {
    const confirmed = await webConfirm(
      'Delete Cemetery Record?',
      `Delete "${item.deceased_name}" permanently?`,
    );
    if (!confirmed) return;

    try {
      // Cemetery records use a dedicated SECURITY DEFINER RPC. This avoids
      // the old admin_delete_record role check that can reject a valid Full Admin
      // with "Cemetery administrator permission required".
      const { data: deleted, error: deleteError } = await supabase.rpc(
        'admin_delete_cemetery_record',
        { p_record_id: item.id },
      );
      if (deleteError) throw deleteError;
      if (deleted !== true) {
        throw new Error('The database did not confirm deletion of the cemetery record.');
      }

      const photoPath = getStoragePathFromUrl(item.grave_photo_url);
      if (photoPath) {
        const { error: storageError } = await supabase.storage
          .from('gallery')
          .remove([photoPath]);
        if (storageError) {
          console.warn(
            'Cemetery record deleted, but photo cleanup failed:',
            storageError.message,
          );
        }
      }

      if (editingCemeteryId === item.id) {
        resetCemeteryForm();
      }

      // Remove it immediately from the local list, then refresh from DB.
      setCemeteryRecords((current) => current.filter((record) => record.id !== item.id));
      await loadAll();
      webNotify('Deleted', `"${item.deceased_name}" has been deleted successfully.`);
    } catch (error: any) {
      webNotify(
        'Delete failed',
        error?.message || 'Unable to delete cemetery record. Run cemetery_delete_policy.sql in Supabase SQL Editor.',
      );
    }
  }

  const filteredCemeteryRecords = useMemo(() => {
    const query = cemeterySearch.trim().toLowerCase();
    if (!query) return cemeteryRecords;

    return cemeteryRecords.filter((item) =>
      [
        item.deceased_name,
        item.family_name,
        item.cemetery_name,
        item.row_name,
        item.grave_number,
        item.biography,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query),
        ),
    );
  }, [cemeteryRecords, cemeterySearch]);

  const filteredMembers = useMemo(() => {
    const query =
      memberSearch.trim().toLowerCase();

    if (!query) return members;

    return members.filter((member) => {
      return (

        member.full_name
          ?.toLowerCase()
          .includes(query) ||
        member.phone
          ?.toLowerCase()
          .includes(query) ||
        member.email
          ?.toLowerCase()
          .includes(query) ||
        member.section
          ?.toLowerCase()
          .includes(query) ||
        member.house_number
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [members, memberSearch]);

  // Only the selected album is rendered in Admin Gallery.
  const selectedAdminAlbum = galleryAlbums.find(
    (album) => album.title === selectedGalleryAlbum,
  );
  const selectedAlbumPhotos = selectedAdminAlbum
    ? gallery.filter(
        (item) => (item.category || 'General') === selectedAdminAlbum.title,
      )
    : [];

  const publishedNews =
    news.filter(
      (item) => item.is_published,
    ).length;

  const publishedEvents =
    events.filter(
      (item) => item.is_published,
    ).length;

  const publishedZonun = zonun.filter(
    (item) => item.is_published,
  ).length;

  const unpaidWasteBills =
    wasteBills.filter(
      (bill) =>
        (bill.status || '').toLowerCase() !==
        'paid',
    );

  const wasteOutstanding =
    unpaidWasteBills.reduce(
      (total, bill) =>
        total + Number(bill.amount || 0),
      0,
    );

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <LinearGradient
          colors={[RED, BLACK]}
          style={styles.loadingGradient}
        >
          <Text style={styles.loadingTitle}>
            YMA Salem Branch
          </Text>

          <Text style={styles.loadingSubtitle}>
            Admin Panel
          </Text>

          <ActivityIndicator
            size="large"
            color={WHITE}
            style={{ marginTop: 24 }}
          />
        </LinearGradient>
      </View>
    );
  }

  if (!authorized) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.deniedTitle}>
          Access Denied
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.primaryButtonText}>
            GO HOME
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[RED, BLACK]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <AppBackButton />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.headerEyebrow}>
              YMA Salem Branch
            </Text>

            <Text style={styles.headerTitle}>
              Admin Panel
            </Text>

            <Text style={styles.headerSubtitle}>
              {adminRole === 'cemetery_admin'
                ? 'Cemetery Admin • Thlanmual only'
                : 'Full Access Admin • Manage branch content'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.body}
        contentContainerStyle={
          styles.bodyContent
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
          />
        }
      >
        {adminRole === 'full_admin' ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sectionTabs}
          >
            {[
              ['dashboard', 'Dashboard'],
              ['members', 'Members'],
              ['news', 'News'],
              ['about', 'YMA Salem Branch Chanchin'],
              ['events', 'Events'],
              ['gallery', 'Gallery'],
              ['waste', 'Waste Bills'],
              ['zonun', 'Zonun'],
              ['leaders', 'Branch Leaders'],
              ['section-leaders', 'Section Hruaitute'],
              ['cemetery', 'Thlanmual'],
              ['admins', 'Admin Requests'],
              ['profile', 'My Profile'],
              ['visibility', 'Show / Hide'],
            ].map(([key, label]) => (
              <Pressable
                key={key}
                onPress={() => {
                  setSection(
                    key as
                      | 'dashboard'
                      | 'members'
                      | 'news'
                      | 'about'
                      | 'events'
                      | 'gallery'
                      | 'waste'
                      | 'zonun'
                      | 'leaders'
                      | 'cemetery'
                      | 'gas'
                      | 'admins'
                      | 'profile'
                      | 'visibility',
                  );

                  if (key === 'gas') {
                    loadGasBookings();
                  }

                  if (key === 'admins') {
                    loadAdminRequests();
                  }
                }}
                style={[
                  styles.sectionTab,
                  section === key &&
                    styles.sectionTabActive,
                ]}
              >
                <Text
                  style={[
                    styles.sectionTabText,
                    section === key &&
                      styles.sectionTabTextActive,
                  ]}
                >
                  {label}
                  {key === 'admins' && adminRequests.length > 0
                    ? ` (${adminRequests.length})`
                    : ''}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.cemeteryOnlyBanner}>
            <Image source={CEMETERY_GRAVE_ICON} style={styles.cemeteryOnlyIcon} resizeMode="contain" />
            <View style={{ flex: 1 }}>
              <Text style={styles.cemeteryOnlyTitle}>
                CEMETERY ADMIN
              </Text>
              <Text style={styles.cemeteryOnlyText}>
                You have access to Thlanmual / Cemetery records only.
              </Text>
            </View>
            <Pressable
              style={styles.profileBannerButton}
              onPress={() => {
                setSection('profile');
                loadMyProfile();
              }}
            >
              <Text style={styles.profileBannerButtonText}>Profile</Text>
            </Pressable>
          </View>
        )}

        {section === 'profile' && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>My Profile</Text>
                <Text style={styles.sectionDescription}>
                  Update your admin profile details stored in Supabase.
                </Text>
              </View>
            </View>

            <View style={styles.formCard}>
              <View style={styles.profileTop}>
                {profilePhoto ? (
                  <Image
                    source={{ uri: profilePhoto }}
                    style={styles.profilePhoto}
                  />
                ) : (
                  <View style={styles.profilePhotoPlaceholder}>
                    <Text style={styles.profilePhotoPlaceholderText}>👤</Text>
                  </View>
                )}

                <View style={{ flex: 1 }}>
                  <Text style={styles.formTitle}>Admin Profile</Text>
                  <Text style={styles.profileRoleText}>
                    {adminRole === 'full_admin'
                      ? 'Full Access Admin'
                      : 'Cemetery Admin'}
                  </Text>
                </View>
              </View>

              <Pressable
                style={styles.outlineButton}
                onPress={pickProfilePhoto}
                disabled={profilePhotoUploading || savingProfile}
              >
                {profilePhotoUploading ? (
                  <ActivityIndicator color={RED} />
                ) : (
                  <Text style={styles.outlineButtonText}>
                    {profilePhoto ? 'Change Profile Photo' : 'Upload Profile Photo'}
                  </Text>
                )}
              </Pressable>

              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={profileName}
                onChangeText={setProfileName}
                placeholder="Enter your full name"
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={profilePhone}
                onChangeText={setProfilePhone}
                placeholder="Phone number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={profileEmail}
                onChangeText={setProfileEmail}
                placeholder="Email address"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={styles.label}>YMA Section</Text>
              <View style={styles.profileSectionRow}>
                {['Section - I', 'Section - II', 'Section - III'].map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setProfileSection(item)}
                    style={[
                      styles.profileSectionChip,
                      profileSection === item && styles.profileSectionChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.profileSectionChipText,
                        profileSection === item && styles.profileSectionChipTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>Admin Role</Text>
              <View style={styles.readOnlyProfileBox}>
                <Text style={styles.readOnlyProfileText}>
                  {adminRole === 'full_admin'
                    ? 'Full Access Admin'
                    : 'Cemetery Admin'}
                </Text>
                <Text style={styles.readOnlyProfileHint}>
                  Role is controlled by Admin Requests and cannot be changed here.
                </Text>
              </View>

              <Text style={styles.label}>User ID</Text>
              <View style={styles.readOnlyProfileBox}>
                <Text style={styles.readOnlyProfileText}>
                  {profileUserId || '—'}
                </Text>
              </View>

              <Pressable
                style={styles.primaryButton}
                onPress={saveMyProfile}
                disabled={savingProfile || profilePhotoUploading}
              >
                {savingProfile ? (
                  <ActivityIndicator color={WHITE} />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    Save Profile Changes
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        )}

        {section === 'visibility' && adminRole === 'full_admin' && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Service Visibility</Text>
                <Text style={styles.sectionDescription}>Hide unfinished services from users. You can show them again whenever they are ready.</Text>
              </View>
            </View>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Thlanmual Records</Text>
              <Text style={styles.profileRoleText}>{featureVisibility.cemetery ? 'Visible to users' : 'Hidden from users'}</Text>
              <Pressable disabled={savingFeatureVisibility} onPress={() => saveFeatureVisibility('cemetery', !featureVisibility.cemetery)} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>{featureVisibility.cemetery ? 'HIDE THLANMUAL' : 'SHOW THLANMUAL'}</Text>
              </Pressable>
            </View>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Gas Booking</Text>
              <Text style={styles.profileRoleText}>{featureVisibility.gas_booking ? 'Visible to users' : 'Hidden from users'}</Text>
              <Pressable disabled={savingFeatureVisibility} onPress={() => saveFeatureVisibility('gas_booking', !featureVisibility.gas_booking)} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>{featureVisibility.gas_booking ? 'HIDE GAS BOOKING' : 'SHOW GAS BOOKING'}</Text>
              </Pressable>
            </View>
          </View>
        )}

        {section === 'dashboard' && (
          <>
            <View style={styles.welcomeCard}>
              <View>
                <Text style={styles.cardEyebrow}>
                  CONTROL CENTRE
                </Text>

                <Text style={styles.welcomeTitle}>
                  YMA Salem Branch
                </Text>

                <Text style={styles.welcomeText}>
                  Manage members, news, events,
                  gallery, waste bills, Zonun, cemetery
                  records and gas bookings from one place.
                </Text>
              </View>

              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>
                  ADMIN
                </Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>
              Overview
            </Text>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {members.length}
                </Text>

                <Text style={styles.statLabel}>
                  Members
                </Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {publishedNews}
                </Text>

                <Text style={styles.statLabel}>
                  Published News
                </Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {publishedEvents}
                </Text>

                <Text style={styles.statLabel}>
                  Published Events
                </Text>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.statCard,
                  styles.gasStatCard,
                  pressed &&
                    styles.statCardPressed,
                ]}
                onPress={() => {
                  setSection('gas');
                  loadGasBookings();
                  loadGasBookingArchive();
                }}
              >
                <View
                  style={
                    styles.gasStatIcon
                  }
                >
                  <Text
                    style={
                      styles.gasStatIconText
                    }
                  >
                    🔥
                  </Text>
                </View>

                <View>
                  <Text
                    style={
                      styles.statNumber
                    }
                  >
                    {gasBookings.length}
                  </Text>

                  <Text
                    style={
                      styles.statLabel
                    }
                  >
                    Gas Bookings
                  </Text>
                </View>
              </Pressable>

              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {gallery.length}
                </Text>

                <Text style={styles.statLabel}>
                  Gallery Photos
                </Text>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.statCard,
                  styles.zonunStatCard,
                  pressed && styles.statCardPressed,
                ]}
                onPress={() => setSection('zonun')}
              >
                <View style={styles.zonunStatIcon}>
                  <Text style={styles.zonunStatIconText}>📰</Text>
                </View>

                <View>
                  <Text style={styles.statNumber}>
                    {publishedZonun}
                  </Text>
                  <Text style={styles.statLabel}>
                    Zonun Issues
                  </Text>
                </View>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.statCard,
                  styles.cemeteryStatCard,
                  pressed && styles.statCardPressed,
                ]}
                onPress={() => setSection('cemetery')}
              >
                <View style={styles.cemeteryStatIcon}>
                  <Image source={CEMETERY_GRAVE_ICON} style={styles.cemeteryStatIconText} resizeMode="contain" />
                </View>
                <View>
                  <Text style={styles.statNumber}>
                    {cemeteryRecords.length}
                  </Text>
                  <Text style={styles.statLabel}>
                    Cemetery Records
                  </Text>
                </View>
              </Pressable>
            </View>

            <Pressable
              onPress={() => {
                setSection('gas');
                loadGasBookings();
              }}
              style={({ pressed }) => [
                styles.gasDashboardCard,
                pressed &&
                  styles.statCardPressed,
              ]}
            >
              <LinearGradient
                colors={[RED, BLACK]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={
                  styles.gasDashboardGradient
                }
              >
                <View
                  style={
                    styles.gasDashboardIcon
                  }
                >
                  <Text
                    style={
                      styles.gasDashboardIconText
                    }
                  >
                    🔥
                  </Text>
                </View>

                <View
                  style={
                    styles.gasDashboardText
                  }
                >
                  <Text
                    style={
                      styles.gasDashboardEyebrow
                    }
                  >
                    GAS BOOKING
                  </Text>

                  <Text
                    style={
                      styles.gasDashboardTitle
                    }
                  >
                    {gasBookings.length}{' '}
                    Active Booking
                    {gasBookings.length === 1
                      ? ''
                      : 's'}
                  </Text>

                  <Text
                    style={
                      styles.gasDashboardSubtitle
                    }
                  >
                    Tap here to manage member
                    LPG cylinder bookings.
                  </Text>
                </View>

                <Text
                  style={
                    styles.gasDashboardArrow
                  }
                >
                  ›
                </Text>
              </LinearGradient>
            </Pressable>

            <Text style={styles.sectionTitle}>
              Chhiatni Fund Overview
            </Text>

            <Pressable
              onPress={() => router.push('/chhiatni-admin')}
              style={styles.wasteOverviewCard}
            >
              <LinearGradient
                colors={[RED, BLACK]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.wasteOverviewGradient}
              >
                <View>
                  <Text style={styles.wasteOverviewEyebrow}>FAMILY FUND</Text>
                  <Text style={styles.wasteOverviewAmount}>CHHIATNI</Text>
                  <Text style={styles.wasteOverviewMeta}>Manage House Number family bills and payments</Text>
                </View>
                <View style={styles.wasteOverviewArrow}>
                  <Text style={styles.wasteOverviewArrowText}>›</Text>
                </View>
              </LinearGradient>
            </Pressable>

            <Text style={styles.sectionTitle}>
              Waste Fee Overview
            </Text>

            <Pressable
              onPress={() =>
                setSection('waste')
              }
              style={styles.wasteOverviewCard}
            >
              <LinearGradient
                colors={[RED, BLACK]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={
                  styles.wasteOverviewGradient
                }
              >
                <View>
                  <Text
                    style={
                      styles.wasteOverviewEyebrow
                    }
                  >
                    OUTSTANDING
                  </Text>

                  <Text
                    style={
                      styles.wasteOverviewAmount
                    }
                  >
                    ₹
                    {wasteOutstanding.toFixed(
                      2,
                    )}
                  </Text>

                  <Text
                    style={
                      styles.wasteOverviewMeta
                    }
                  >
                    {unpaidWasteBills.length}{' '}
                    unpaid bill
                    {unpaidWasteBills.length ===
                    1
                      ? ''
                      : 's'}
                  </Text>
                </View>

                <View
                  style={
                    styles.wasteOverviewArrow
                  }
                >
                  <Text
                    style={
                      styles.wasteOverviewArrowText
                    }
                  >
                    ›
                  </Text>
                </View>
              </LinearGradient>
            </Pressable>

            <Text style={styles.sectionTitle}>
              Quick Management
            </Text>

            <View style={styles.quickGrid}>
              {[
                [
                  'M',
                  'Members',
                  'View and manage members',
                  'members',
                ],
                [
                  'N',
                  'News',
                  'Publish branch news',
                  'news',
                ],
                [
                  'A',
                  'YMA Salem Branch Chanchin',
                  'Update branch information',
                  'about',
                ],
                [
                  'E',
                  'Events',
                  'Manage programmes',
                  'events',
                ],
                [
                  'G',
                  'Gallery',
                  'Upload branch photos',
                  'gallery',
                ],
                [
                  '₹',
                  'Waste Bills',
                  'Create and manage bills',
                  'waste',
                ],
                [
                  '👤',
                  'Branch Leaders',
                  'Edit branch leadership details',
                  'leaders',
                ],
                [
                  '👥',
                  'Section Hruaitute',
                  'Manage Section I, II & III leaders',
                  'section-leaders',
                ],
                [
                  '🔥',
                  'Gas Bookings',
                  'Manage LPG cylinder bookings',
                  'gas',
                ],
                [
                  '📰',
                  'Zonun',
                  'Upload and manage newsletters',
                  'zonun',
                ],
                [
                  '🪦',
                  'Thlanmual',
                  'Manage cemetery records and biographies',
                  'cemetery',
                ],
              ].map(
                ([
                  icon,
                  title,
                  subtitle,
                  target,
                ]) => (
                  <Pressable
                    key={title}
                    style={({ pressed }) => [
                      styles.quickCard,
                      pressed &&
                        styles.statCardPressed,
                    ]}
                    onPress={() => {
                      setSection(
                        target as
                          | 'members'
                          | 'news'
                          | 'about'
                          | 'events'
                          | 'gallery'
                          | 'waste'
                          | 'zonun'
                          | 'leaders'
                          | 'section-leaders'
                          | 'cemetery'
                          | 'gas',
                      );

                      if (target === 'gas') {
                        loadGasBookings();
                      }
                    }}
                  >
                    <View
                      style={[
                        styles.quickIcon,
                        {
                          backgroundColor:
                            LIGHT_RED,
                        },
                      ]}
                    >
                      <Text
                        style={
                          styles.quickIconText
                        }
                      >
                        {icon}
                      </Text>
                    </View>

                    <Text
                      style={styles.quickTitle}
                    >
                      {title}
                    </Text>

                    <Text
                      style={
                        styles.quickSubtitle
                      }
                    >
                      {subtitle}
                    </Text>
                  </Pressable>
                ),
              )}
            </View>
          </>
        )}

        {section === 'admins' && adminRole === 'full_admin' && (
          <>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>
                  Admin Requests
                </Text>
                <Text style={styles.sectionDescription}>
                  Review pending requests for Full Access and Cemetery Admin access.
                </Text>
              </View>

              <Pressable
                onPress={() => loadAdminRequests()}
                style={styles.smallButton}
                disabled={loadingAdminRequests}
              >
                <Text style={styles.smallButtonText}>
                  {loadingAdminRequests ? 'LOADING...' : 'REFRESH'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.adminRequestSummary}>
              <View style={styles.adminRequestSummaryIcon}>
                <Text style={styles.adminRequestSummaryIconText}>🔐</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.adminRequestSummaryLabel}>
                  PENDING REQUESTS
                </Text>
                <Text style={styles.adminRequestSummaryTitle}>
                  {adminRequests.length}
                </Text>
                <Text style={styles.adminRequestSummaryText}>
                  Full Access: {adminRoleCounts.full_admin}/5 • Cemetery Admin: {adminRoleCounts.cemetery_admin}/3
                </Text>
                <Text style={styles.adminRequestSummaryText}>
                  Pending requests: {adminRequests.length}
                </Text>
              </View>
            </View>

            {loadingAdminRequests ? (
              <View style={styles.emptyCard}>
                <ActivityIndicator color={RED} />
                <Text style={styles.emptyText}>
                  Loading admin requests...
                </Text>
              </View>
            ) : adminRequests.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>
                  No pending requests
                </Text>
                <Text style={styles.emptyText}>
                  New Admin Sign Up requests will appear here.
                </Text>
              </View>
            ) : (
              adminRequests.map((request) => {
                const isFull = request.role === 'full_admin';

                return (
                  <View
                    key={request.user_id}
                    style={styles.adminRequestCard}
                  >
                    <View style={styles.adminRequestTop}>
                      <View style={styles.adminRequestIcon}>
                        <Text style={styles.adminRequestIconText}>
                          {isFull ? '👑' : '🪦'}
                        </Text>
                      </View>

                      <View style={styles.adminRequestInfo}>
                        <Text style={styles.adminRequestRole}>
                          {isFull
                            ? 'FULL ACCESS ADMIN'
                            : 'CEMETERY ADMIN'}
                        </Text>

                        <Text style={styles.adminRequestUserId}>
                          {request.user_id}
                        </Text>

                        <Text style={styles.adminRequestDate}>
                          Requested {formatDateTime(request.created_at)}
                        </Text>
                      </View>

                      <View style={styles.pendingBadge}>
                        <Text style={styles.pendingBadgeText}>
                          PENDING
                        </Text>
                      </View>
                    </View>

                    <View style={styles.adminRequestActions}>
                      <Pressable
                        onPress={() =>
                          updateAdminRequest(request, 'approved')
                        }
                        style={[
                          styles.adminRequestButton,
                          styles.approveButton,
                        ]}
                      >
                        <Text style={styles.adminRequestButtonText}>
                          ✓ APPROVE
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() =>
                          updateAdminRequest(request, 'rejected')
                        }
                        style={[
                          styles.adminRequestButton,
                          styles.rejectButton,
                        ]}
                      >
                        <Text
                          style={[
                            styles.adminRequestButtonText,
                            styles.rejectButtonText,
                          ]}
                        >
                          × REJECT
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}

        {section === 'members' && (
          <>
            <Text style={styles.sectionTitle}>
              Members Management
            </Text>

            <TextInput
              value={memberSearch}
              onChangeText={setMemberSearch}
              placeholder="Search member..."
              placeholderTextColor="#999999"
              style={styles.input}
            />

            <Text style={styles.resultText}>
              {filteredMembers.length} member
              {filteredMembers.length === 1
                ? ''
                : 's'}
            </Text>

            {filteredMembers.map((member) => (
              <View
                key={member.id}
                style={styles.memberCard}
              >
                <View
                  style={styles.memberAvatar}
                >
                  <Text
                    style={
                      styles.memberAvatarText
                    }
                  >
                    {(member.full_name || '?')
                      .charAt(0)
                      .toUpperCase()}
                  </Text>
                </View>

                <View
                  style={styles.memberInfo}
                >
                  <Text
                    style={styles.memberName}
                  >
                    {member.full_name}
                  </Text>

                  <Text
                    style={styles.memberMeta}
                  >
                    {member.phone ||
                      'No phone'}
                  </Text>

                  <Text
                    style={styles.memberMeta}
                  >
                    {member.email ||
                      'No email'}
                  </Text>

                  <Text
                    style={styles.memberMeta}
                  >
                    House No.: {member.house_number || 'Not assigned'}
                  </Text>

                  <View
                    style={styles.memberTags}
                  >
                    <View
                      style={styles.tag}
                    >
                      <Text
                        style={styles.tagText}
                      >
                        Section{' '}
                        {member.section ||
                          '-'}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.tag,
                        member.status ===
                          'Inactive' &&
                          styles.inactiveTag,
                      ]}
                    >
                      <Text
                        style={[
                          styles.tagText,
                          member.status ===
                            'Inactive' &&
                            styles.inactiveTagText,
                        ]}
                      >
                        {member.status ||
                          'Active'}
                      </Text>
                    </View>
                  </View>
                </View>

                <Pressable
                  style={styles.arrowButton}
                  onPress={() =>
                    router.push({
                      pathname:
                        '/member-detail',
                      params: {
                        id: String(
                          member.id,
                        ),
                      },
                    })
                  }
                >
                  <Text
                    style={styles.arrowText}
                  >
                    ›
                  </Text>
                </Pressable>
              </View>
            ))}

            {filteredMembers.length ===
              0 && (
              <View
                style={styles.emptyCard}
              >
                <Text
                  style={styles.emptyTitle}
                >
                  No members found
                </Text>

                <Text
                  style={styles.emptyText}
                >
                  Try another search.
                </Text>
              </View>
            )}
          </>
        )}

        {section === 'about' && (
          <>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>YMA Salem Branch Chanchin</Text>
                <Text style={styles.sectionDescription}>Update the information shown under More → YMA Salem Branch Chanchin.</Text>
              </View>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Edit YMA Salem Branch Chanchin</Text>
              <Text style={styles.label}>Chanchin</Text>
              <TextInput
                value={aboutContent}
                onChangeText={setAboutContent}
                placeholder="Write YMA Salem Branch Chanchin..."
                placeholderTextColor="#999999"
                style={[styles.input, styles.textArea]}
                multiline
                textAlignVertical="top"
              />
              <Pressable onPress={saveAbout} style={styles.primaryButton} disabled={savingAbout}>
                {savingAbout ? <ActivityIndicator color={WHITE} /> : <Text style={styles.primaryButtonText}>UPDATE CHANCHIN</Text>}
              </Pressable>
            </View>
          </>
        )}

        {section === 'news' && (
          <>
            <View
              style={
                styles.sectionHeaderRow
              }
            >
              <View>
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  News Management
                </Text>

                <Text
                  style={
                    styles.sectionDescription
                  }
                >
                  Create and publish YMA Salem Branch
                  news.
                </Text>
              </View>

              {editingNewsId && (
                <Pressable
                  onPress={
                    resetNewsForm
                  }
                  style={
                    styles.smallButton
                  }
                >
                  <Text
                    style={
                      styles.smallButtonText
                    }
                  >
                    CANCEL
                  </Text>
                </Pressable>
              )}
            </View>

            <View style={styles.formCard}>
              <Text style={styles.formTitle}>
                {editingNewsId
                  ? 'Edit News'
                  : 'Create News'}
              </Text>

              <Text style={styles.label}>
                Title
              </Text>

              <TextInput
                value={newsTitle}
                onChangeText={setNewsTitle}
                placeholder="News title"
                placeholderTextColor="#999999"
                style={styles.input}
              />

              <Text style={styles.label}>
                Category
              </Text>

              <TextInput
                value={newsCategory}
                onChangeText={
                  setNewsCategory
                }
                placeholder="General"
                placeholderTextColor="#999999"
                style={styles.input}
              />

              <Text style={styles.label}>
                Content
              </Text>

              <TextInput
                value={newsContent}
                onChangeText={setNewsContent}
                placeholder="Write news content..."
                placeholderTextColor="#999999"
                style={[
                  styles.input,
                  styles.textArea,
                ]}
                multiline
                textAlignVertical="top"
              />

              <Pressable
                onPress={pickNewsImage}
                style={
                  styles.outlineButton
                }
                disabled={savingNews}
              >
                <Text
                  style={
                    styles.outlineButtonText
                  }
                >
                  {newsImage
                    ? 'CHANGE NEWS IMAGE'
                    : 'ADD NEWS IMAGE'}
                </Text>
              </Pressable>

              {newsImage ? (
                <Image
                  source={{
                    uri: newsImage,
                  }}
                  style={styles.formImage}
                />
              ) : null}

              <Pressable
                onPress={saveNews}
                style={
                  styles.primaryButton
                }
                disabled={savingNews}
              >
                {savingNews ? (
                  <ActivityIndicator
                    color={WHITE}
                  />
                ) : (
                  <Text
                    style={
                      styles.primaryButtonText
                    }
                  >
                    {editingNewsId
                      ? 'UPDATE NEWS'
                      : 'PUBLISH NEWS'}
                  </Text>
                )}
              </Pressable>
            </View>

            <Text style={styles.sectionTitle}>
              Recent News
            </Text>

            {news.map((item) => (
              <View
                key={item.id}
                style={
                  styles.contentCard
                }
              >
                {item.image_url ? (
                  <Image
                    source={{
                      uri: item.image_url,
                    }}
                    style={
                      styles.contentThumbnail
                    }
                  />
                ) : (
                  <LinearGradient
                    colors={[RED, BLACK]}
                    style={
                      styles.contentThumbnail
                    }
                  >
                    <Text
                      style={
                        styles.thumbnailLetter
                      }
                    >
                      N
                    </Text>
                  </LinearGradient>
                )}

                <View
                  style={styles.contentInfo}
                >
                  <Text
                    style={
                      styles.contentCategory
                    }
                  >
                    {item.category ||
                      'GENERAL'}
                  </Text>

                  <Text
                    style={
                      styles.contentTitle
                    }
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>

                  <Text
                    style={
                      styles.contentDate
                    }
                  >
                    {formatDate(
                      item.published_at ||
                        item.created_at,
                    )}
                  </Text>

                  <View
                    style={
                      styles.actionRow
                    }
                  >
                    <Pressable
                      onPress={() =>
                        editNews(item)
                      }
                      style={
                        styles.actionButton
                      }
                    >
                      <Text
                        style={
                          styles.actionText
                        }
                      >
                        EDIT
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() =>
                        toggleNews(item)
                      }
                      style={
                        styles.actionButton
                      }
                    >
                      <Text
                        style={
                          styles.actionText
                        }
                      >
                        {item.is_published
                          ? 'HIDE'
                          : 'PUBLISH'}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() =>
                        deleteNews(item)
                      }
                      style={[
                        styles.actionButton,
                        styles.deleteAction,
                      ]}
                    >
                      <Text
                        style={[
                          styles.actionText,
                          styles.deleteActionText,
                        ]}
                      >
                        DELETE
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}

            {news.length === 0 && (
              <View
                style={styles.emptyCard}
              >
                <Text
                  style={styles.emptyTitle}
                >
                  No news yet
                </Text>
              </View>
            )}
          </>
        )}

        {section === 'events' && (
          <>
            <View
              style={
                styles.sectionHeaderRow
              }
            >
              <View>
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Events & Programmes
                </Text>

                <Text
                  style={
                    styles.sectionDescription
                  }
                >
                  Create and manage YMA Salem Branch
                  events.
                </Text>
              </View>

              {editingEventId && (
                <Pressable
                  onPress={
                    resetEventForm
                  }
                  style={
                    styles.smallButton
                  }
                >
                  <Text
                    style={
                      styles.smallButtonText
                    }
                  >
                    CANCEL
                  </Text>
                </Pressable>
              )}
            </View>

            <View style={styles.formCard}>
              <Text style={styles.formTitle}>
                {editingEventId
                  ? 'Edit Event'
                  : 'Create Event'}
              </Text>

              <Text style={styles.label}>
                Event Title
              </Text>

              <TextInput
                value={eventTitle}
                onChangeText={
                  setEventTitle
                }
                placeholder="Event or programme title"
                placeholderTextColor="#999999"
                style={styles.input}
              />

              <Text style={styles.label}>
                Event Date & Time
              </Text>

              {Platform.OS !== 'web' && <View
                style={
                  styles.dateTimeRow
                }
              >
                <Pressable
                  onPress={() =>
                    setShowEventDatePicker(
                      true,
                    )
                  }
                  style={
                    styles.dateTimeButton
                  }
                >
                  <Text
                    style={
                      styles.dateTimeIcon
                    }
                  >
                    📅
                  </Text>

                  <View
                    style={{ flex: 1 }}
                  >
                    <Text
                      style={
                        styles.dateTimeLabel
                      }
                    >
                      DATE
                    </Text>

                    <Text
                      style={
                        eventDateValue
                          ? styles.dateTimeValue
                          : styles.dateTimePlaceholder
                      }
                    >
                      {formatSelectedDate(
                        eventDateValue,
                      )}
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() =>
                    setShowEventTimePicker(
                      true,
                    )
                  }
                  style={
                    styles.dateTimeButton
                  }
                >
                  <Text
                    style={
                      styles.dateTimeIcon
                    }
                  >
                    🕐
                  </Text>

                  <View
                    style={{ flex: 1 }}
                  >
                    <Text
                      style={
                        styles.dateTimeLabel
                      }
                    >
                      TIME
                    </Text>

                    <Text
                      style={
                        eventDateValue
                          ? styles.dateTimeValue
                          : styles.dateTimePlaceholder
                      }
                    >
                      {formatSelectedTime(
                        eventDateValue,
                      )}
                    </Text>
                  </View>
                </Pressable>
              </View>}

              {eventDateValue && (
                <View
                  style={
                    styles.selectedDateCard
                  }
                >
                  <Text
                    style={
                      styles.selectedDateLabel
                    }
                  >
                    SELECTED EVENT DATE & TIME
                  </Text>

                  <Text
                    style={
                      styles.selectedDateText
                    }
                  >
                    {formatDateTime(
                      eventDateValue.toISOString(),
                    )}
                  </Text>
                </View>
              )}

              {Platform.OS === 'web' ? (
                <View style={{ gap: 10 }}>
                  <Text style={styles.label}>Event Date</Text>
                  <WebEventDateInput value={eventDateValue} mode="date" onChange={handleEventDateChange} />
                  <Text style={styles.label}>Event Time</Text>
                  <WebEventDateInput value={eventDateValue} mode="time" onChange={handleEventTimeChange} />
                </View>
              ) : (
                <>
                  {showEventDatePicker && (
                    <DateTimePicker value={eventDateValue || new Date()} mode="date" display="default" onChange={(event, selectedDate) => {
                      if (event.type === 'dismissed') { setShowEventDatePicker(false); return; }
                      handleEventDateChange(selectedDate);
                    }} />
                  )}
                  {showEventTimePicker && (
                    <DateTimePicker value={eventDateValue || new Date()} mode="time" display="default" onChange={(event, selectedTime) => {
                      if (event.type === 'dismissed') { setShowEventTimePicker(false); return; }
                      handleEventTimeChange(selectedTime);
                    }} />
                  )}
                </>
              )}

              <Text style={styles.label}>
                Location
              </Text>

              <TextInput
                value={eventLocation}
                onChangeText={
                  setEventLocation
                }
                placeholder="Event location"
                placeholderTextColor="#999999"
                style={styles.input}
              />

              <Text style={styles.label}>
                Organizing Branch
              </Text>

              <TextInput
                value={eventBranch}
                onChangeText={
                  setEventBranch
                }
                placeholder="YMA Salem Branch"
                placeholderTextColor="#999999"
                style={styles.input}
              />

              <Text style={styles.label}>
                Description
              </Text>

              <TextInput
                value={eventDescription}
                onChangeText={
                  setEventDescription
                }
                placeholder="Event description..."
                placeholderTextColor="#999999"
                style={[
                  styles.input,
                  styles.textArea,
                ]}
                multiline
                textAlignVertical="top"
              />

              <Pressable
                onPress={pickEventImage}
                style={
                  styles.outlineButton
                }
                disabled={savingEvent}
              >
                <Text
                  style={
                    styles.outlineButtonText
                  }
                >
                  {eventImage
                    ? 'CHANGE EVENT IMAGE'
                    : 'ADD EVENT IMAGE'}
                </Text>
              </Pressable>

              {eventImage ? (
                <Image
                  source={{
                    uri: eventImage,
                  }}
                  style={styles.formImage}
                />
              ) : null}

              <Pressable
                onPress={saveEvent}
                style={
                  styles.primaryButton
                }
                disabled={savingEvent}
              >
                {savingEvent ? (
                  <ActivityIndicator
                    color={WHITE}
                  />
                ) : (
                  <Text
                    style={
                      styles.primaryButtonText
                    }
                  >
                    {editingEventId
                      ? 'UPDATE EVENT'
                      : 'PUBLISH EVENT'}
                  </Text>
                )}
              </Pressable>
            </View>

            <Text style={styles.sectionTitle}>
              Recent & Upcoming Events
            </Text>

            {events.map((item) => (
              <View
                key={item.id}
                style={styles.eventCard}
              >
                {item.image_url ? (
                  <Image
                    source={{
                      uri: item.image_url,
                    }}
                    style={styles.eventImage}
                  />
                ) : (
                  <LinearGradient
                    colors={[RED, BLACK]}
                    style={styles.eventImage}
                  >
                    <Text style={styles.thumbnailLetter}>
                      E
                    </Text>
                  </LinearGradient>
                )}

                <View style={styles.eventInfo}>
                  <Text style={styles.eventDate}>
                    {formatDateTime(
                      item.event_date,
                    )}
                  </Text>

                  <Text
                    style={styles.eventTitle}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>

                  {item.location ? (
                    <Text
                      style={styles.eventMeta}
                      numberOfLines={1}
                    >
                      📍 {item.location}
                    </Text>
                  ) : null}

                  {item.organizing_branch ? (
                    <Text
                      style={styles.eventMeta}
                      numberOfLines={1}
                    >
                      {item.organizing_branch}
                    </Text>
                  ) : null}

                  <View style={styles.actionRow}>
                    <Pressable
                      onPress={() =>
                        editEvent(item)
                      }
                      style={styles.actionButton}
                    >
                      <Text style={styles.actionText}>
                        EDIT
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() =>
                        toggleEvent(item)
                      }
                      style={styles.actionButton}
                    >
                      <Text style={styles.actionText}>
                        {item.is_published
                          ? 'HIDE'
                          : 'PUBLISH'}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() =>
                        deleteEvent(item)
                      }
                      style={[
                        styles.actionButton,
                        styles.deleteAction,
                      ]}
                    >
                      <Text
                        style={[
                          styles.actionText,
                          styles.deleteActionText,
                        ]}
                      >
                        DELETE
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}

            {events.length === 0 && (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>
                  No events yet
                </Text>

                <Text style={styles.emptyText}>
                  Create your first YMA Salem Branch event above.
                </Text>
              </View>
            )}
          </>
        )}

        {section === 'gallery' && (
          <>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>
                  Gallery Management
                </Text>

                <Text style={styles.sectionDescription}>
                  Add and remove YMA Salem Branch photos.
                </Text>
              </View>
            </View>

            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#E8E8E8' }}>
              <Text style={{ color: '#171717', fontSize: 16, fontWeight: '800', marginBottom: 10 }}>{editingGalleryAlbumId !== null ? 'Edit Album' : 'Create Album'}</Text>
              <TextInput
                value={newGalleryAlbumTitle}
                onChangeText={setNewGalleryAlbumTitle}
                placeholder="Album name (e.g. Annual Meeting 2026)"
                placeholderTextColor="#8A8A8A"
                style={{ borderWidth: 1, borderColor: '#DDDDDD', borderRadius: 9, paddingHorizontal: 12, paddingVertical: 11, color: '#171717', marginBottom: 8 }}
              />
              <TextInput
                value={newGalleryAlbumDescription}
                onChangeText={setNewGalleryAlbumDescription}
                placeholder="Description (optional)"
                placeholderTextColor="#8A8A8A"
                style={{ borderWidth: 1, borderColor: '#DDDDDD', borderRadius: 9, paddingHorizontal: 12, paddingVertical: 11, color: '#171717', marginBottom: 10 }}
              />
              <Pressable onPress={createGalleryAlbum} disabled={creatingGalleryAlbum} style={{ backgroundColor: '#8E1B1B', padding: 12, borderRadius: 9, alignItems: 'center' }}>
                {creatingGalleryAlbum ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>{editingGalleryAlbumId !== null ? 'Save Album' : '+ Create Album'}</Text>}
              </Pressable>
            </View>

            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 14,
                marginBottom: 14,
                borderWidth: 1,
                borderColor: '#E8E8E8',
              }}
            >
              <Text style={{ color: '#171717', fontSize: 15, fontWeight: '800', marginBottom: 10 }}>
                Albums
              </Text>
              <Text style={{ color: '#777', fontSize: 12, lineHeight: 18 }}>
                Each album is shown separately. Photos uploaded to an album stay inside that album.
              </Text>
            </View>

            <Text style={{ color: '#171717', fontSize: 15, fontWeight: '800', marginBottom: 8 }}>
              Upload to Album
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingBottom: 12 }}
            >
              {galleryAlbums.map((album) => (
                <Pressable
                  key={album.id}
                  onPress={() => {
                    setSelectedGalleryAlbum(album.title);
                  }}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 9,
                    borderRadius: 20,
                    backgroundColor: selectedGalleryAlbum === album.title ? '#8E1B1B' : '#F1F1F1',
                  }}
                >
                  <Text style={{ color: selectedGalleryAlbum === album.title ? '#FFFFFF' : '#333333', fontWeight: '700' }}>
                    {album.title}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Pressable
              onPress={pickGalleryImage}
              style={styles.galleryUploadButton}
              disabled={galleryUploading || galleryAlbums.length === 0}
            >
              {galleryUploading ? (
                <View style={{ alignItems: 'center', gap: 6 }}>
                  <ActivityIndicator color={WHITE} />
                  <Text style={{ color: WHITE, fontWeight: '700', fontSize: 12 }}>
                    Uploading {galleryUploadProgress.current} of {galleryUploadProgress.total}...
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.uploadPlus}>+</Text>
                  <View>
                    <Text style={styles.uploadTitle}>Add Photos</Text>
                    <Text style={styles.uploadSubtitle}>
                      {galleryAlbums.length === 0
                        ? 'Create an album first'
                        : `Upload to ${selectedGalleryAlbum}`}
                    </Text>
                  </View>
                </>
              )}
            </Pressable>

            <View style={{ marginTop: 8 }}>
              {selectedAdminAlbum ? (
                <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#E8E8E8' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={{ color: '#171717', fontSize: 17, fontWeight: '900' }}>{selectedAdminAlbum.title}</Text>
                      <Text style={{ color: '#777', fontSize: 11, marginTop: 3 }}>{selectedAlbumPhotos.length} {selectedAlbumPhotos.length === 1 ? 'photo' : 'photos'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <Pressable onPress={() => editGalleryAlbum(selectedAdminAlbum)} style={{ paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, backgroundColor: '#F4F4F4' }}><Text style={{ color: '#8E1B1B', fontWeight: '800', fontSize: 11 }}>EDIT</Text></Pressable>
                      <Pressable onPress={() => deleteGalleryAlbum(selectedAdminAlbum)} style={{ paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, backgroundColor: '#FFF0F0' }}><Text style={{ color: '#B42318', fontWeight: '800', fontSize: 11 }}>DELETE</Text></Pressable>
                    </View>
                  </View>
                  {selectedAlbumPhotos.length > 0 ? (
                    <View style={styles.galleryGrid}>
                      {selectedAlbumPhotos.map((item) => (
                        <View key={item.id} style={styles.galleryCard}>
                          <Image source={{ uri: item.image_url }} style={styles.galleryImage} />
                          <Pressable onPress={() => deleteGalleryItem(item)} style={styles.galleryDelete}><Text style={styles.galleryDeleteText}>×</Text></Pressable>
                          <View style={styles.galleryCaption}><Text style={styles.galleryCaptionText} numberOfLines={1}>{item.title || selectedAdminAlbum.title}</Text></View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={{ minHeight: 130, borderRadius: 12, backgroundColor: '#F7F7F7', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#888', fontSize: 12 }}>No photos in {selectedAdminAlbum.title} yet.</Text></View>
                  )}
                </View>
              ) : (
                <View style={styles.emptyCard}><Text style={styles.emptyTitle}>Select an album</Text><Text style={styles.emptyText}>Choose Album 1, Album 2, etc. above to view only its photos.</Text></View>
              )}
            </View>

            {galleryAlbums.length === 0 && (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>
                  No albums yet
                </Text>
                <Text style={styles.emptyText}>
                  Create Album 1, Album 2, Album 3, etc. first, then upload photos into each album.
                </Text>
              </View>
            )}
          </>
        )}

        {section === 'waste' && (
          <>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>
                  Waste Bills
                </Text>

                <Text style={styles.sectionDescription}>
                  Create and manage waste collection bills.
                </Text>
              </View>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.formTitle}>UPI Payment Settings</Text>
              <Text style={styles.sectionDescription}>Members will use this UPI ID to pay Waste Fee. QR code is generated automatically.</Text>
              <Text style={styles.label}>UPI ID</Text>
              <TextInput value={wasteUpiId} onChangeText={setWasteUpiId} placeholder="yourname@upi" placeholderTextColor="#999" style={styles.input} autoCapitalize="none" />
              <Text style={styles.label}>Payee Name</Text>
              <TextInput value={wastePayeeName} onChangeText={setWastePayeeName} placeholder="YMA Salem Branch" placeholderTextColor="#999" style={styles.input} />
              <Text style={styles.label}>Payment Instructions</Text>
              <TextInput value={wastePaymentInstructions} onChangeText={setWastePaymentInstructions} placeholder="Instructions for members" placeholderTextColor="#999" style={[styles.input, styles.textArea]} multiline />
              {wasteUpiId ? <Image source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(`upi://pay?pa=${wasteUpiId}&pn=${wastePayeeName || 'YMA Salem Branch'}&cu=INR`)}` }} style={{ width: 180, height: 180, alignSelf: 'center', marginVertical: 10 }} /> : null}
              <Pressable onPress={saveWastePaymentSettings} style={styles.primaryButton} disabled={savingWastePaymentSettings}>{savingWastePaymentSettings ? <ActivityIndicator color={WHITE} /> : <Text style={styles.primaryButtonText}>SAVE UPI SETTINGS</Text>}</Pressable>
              <Pressable onPress={downloadWastePaymentReport} style={styles.outlineButton}><Text style={styles.outlineButtonText}>DOWNLOAD PAYMENT REPORT</Text></Pressable>
            </View>

            <LinearGradient
              colors={[RED, BLACK]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.wasteAdminSummary}
            >
              <View>
                <Text style={styles.wasteAdminSummaryLabel}>
                  TOTAL OUTSTANDING
                </Text>

                <Text style={styles.wasteAdminSummaryAmount}>
                  ₹{wasteOutstanding.toFixed(2)}
                </Text>

                <Text style={styles.wasteAdminSummaryText}>
                  {unpaidWasteBills.length} unpaid bill
                  {unpaidWasteBills.length === 1 ? '' : 's'}
                </Text>
              </View>

              <View style={styles.wasteAdminSummaryIcon}>
                <Text style={styles.wasteAdminSummaryIconText}>
                  ₹
                </Text>
              </View>
            </LinearGradient>

            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Create Household Waste Fee Bill</Text>

              <Text style={styles.sectionDescription}>Select a member to represent a household. Members sharing the same House Number are one family for billing, so only one bill is created per House Number.</Text>

              <View style={styles.memberPickerHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>SELECT MEMBERS</Text>
                  <Text style={styles.selectedCount}>{selectedWasteMemberIds.length} member{selectedWasteMemberIds.length === 1 ? '' : 's'} selected • {selectedWasteHouseNumbers.length} household{selectedWasteHouseNumbers.length === 1 ? '' : 's'}</Text>
                </View>
                <Pressable onPress={toggleAllVisibleWasteMembers} style={styles.selectAllButton}>
                  <Text style={styles.selectAllButtonText}>
                    {filteredWasteMembers.length && filteredWasteMembers.every((member) => member.user_id && selectedWasteMemberIds.includes(member.user_id))
                      ? 'CLEAR VISIBLE'
                      : 'SELECT ALL VISIBLE'}
                  </Text>
                </Pressable>
              </View>

              <TextInput
                value={wasteMemberSearch}
                onChangeText={setWasteMemberSearch}
                placeholder="Search member or House No."
                placeholderTextColor="#999"
                style={styles.input}
              />

              <ScrollView
                style={styles.memberPickerList}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
              >
                {filteredWasteMembers.map((member) => {
                  const selected = Boolean(member.user_id && selectedWasteMemberIds.includes(member.user_id));
                  return (
                    <Pressable
                      key={member.user_id}
                      onPress={() => toggleWasteMemberSelection(member.user_id)}
                      style={({ pressed }) => [
                        styles.memberPickerItem,
                        selected && styles.memberPickerItemSelected,
                        pressed && { opacity: 0.82 },
                      ]}
                    >
                      <View style={[styles.memberCheck, selected && styles.memberCheckSelected]}>
                        <Text style={styles.memberCheckText}>{selected ? '✓' : ''}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.memberPickerName}>{member.full_name || 'Unnamed member'}</Text>
                        <Text style={styles.memberPickerMeta}>House No. {member.house_number || 'Not assigned'}</Text>
                      </View>
                    </Pressable>
                  );
                })}
                {!filteredWasteMembers.length ? (
                  <View style={styles.memberPickerEmpty}>
                    <Text style={styles.memberPickerEmptyText}>No matching members.</Text>
                  </View>
                ) : null}
              </ScrollView>

              {selectedWasteMemberIds.length ? (
                <View style={styles.selectedMemberCard}>
                  <Text style={styles.selectedMemberLabel}>SELECTED MEMBERS</Text>
                  <Text style={styles.selectedMemberText}>
                    {selectedWasteMembersSummary(members, selectedWasteMemberIds)}
                  </Text>
                </View>
              ) : null}

              <Text style={styles.label}>
                Bill Month
              </Text>

              <TextInput
                value={wasteBillMonth}
                onChangeText={setWasteBillMonth}
                placeholder="September 2026"
                placeholderTextColor="#999999"
                style={styles.input}
              />

              <Text style={styles.label}>
                Amount
              </Text>

              <TextInput
                value={wasteAmount}
                onChangeText={setWasteAmount}
                placeholder="100"
                placeholderTextColor="#999999"
                style={styles.input}
                keyboardType="decimal-pad"
              />

              <Text style={styles.label}>
                Due Date
              </Text>

              <TextInput
                value={wasteDueDate}
                onChangeText={setWasteDueDate}
                placeholder="2026-09-30"
                placeholderTextColor="#999999"
                style={styles.input}
              />

              <Text style={styles.label}>
                Status
              </Text>

              <View style={styles.statusRow}>
                {[
                  ['unpaid', 'Unpaid'],
                  ['paid', 'Paid'],
                ].map(([value, label]) => (
                  <Pressable
                    key={value}
                    onPress={() =>
                      setWasteStatus(value)
                    }
                    style={[
                      styles.statusButton,
                      wasteStatus === value &&
                        styles.statusButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusButtonText,
                        wasteStatus === value &&
                          styles.statusButtonTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                onPress={saveWasteBill}
                style={styles.primaryButton}
                disabled={savingWasteBill}
              >
                {savingWasteBill ? (
                  <ActivityIndicator color={WHITE} />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {selectedWasteHouseNumbers.length
                      ? `CREATE ${selectedWasteHouseNumbers.length} HOUSEHOLD WASTE BILL${selectedWasteHouseNumbers.length === 1 ? '' : 'S'}`
                      : 'SELECT FAMILY MEMBER TO CREATE BILL'}
                  </Text>
                )}
              </Pressable>
            </View>

            <Text style={styles.sectionTitle}>
              All Waste Bills
            </Text>

            {wasteBills.map((bill) => {
              const member = members.find(
                (item) =>
                  item.user_id === bill.user_id,
              );

              const isPaid =
                (bill.status || '').toLowerCase() ===
                'paid';

              return (
                <View
                  key={bill.id}
                  style={styles.wasteBillCard}
                >
                  <View style={styles.wasteBillTop}>
                    <View style={styles.wasteBillIcon}>
                      <Text style={styles.wasteBillIconText}>
                        ₹
                      </Text>
                    </View>

                    <View style={styles.wasteBillInfo}>
                      <Text style={styles.wasteBillMember}>
                        {member?.full_name ||
                          'Unknown member'}
                      </Text>

                      <Text style={styles.wasteBillMeta}>
                        {bill.bill_month || '-'}
                      </Text>

                      <Text style={styles.wasteBillMeta}>
                        House No. {bill.house_number || member?.house_number || bill.account_no || '-'}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.billStatus,
                        isPaid &&
                          styles.billStatusPaid,
                      ]}
                    >
                      <Text
                        style={[
                          styles.billStatusText,
                          isPaid &&
                            styles.billStatusTextPaid,
                        ]}
                      >
                        {isPaid ? 'PAID' : 'UNPAID'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.wasteBillDetails}>
                    <View>
                      <Text style={styles.wasteDetailLabel}>
                        AMOUNT
                      </Text>

                      <Text style={styles.wasteDetailValue}>
                        ₹{Number(
                          bill.amount || 0,
                        ).toFixed(2)}
                      </Text>
                    </View>

                    <View>
                      <Text style={styles.wasteDetailLabel}>
                        DUE DATE
                      </Text>

                      <Text
                        style={
                          styles.wasteDetailValueSmall
                        }
                      >
                        {bill.due_date || '-'}
                      </Text>
                    </View>
                  </View>

                  {bill.payment_utr ? (
                    <View style={styles.paidInfoCard}><Text style={styles.paidInfoText}>UPI UTR: {bill.payment_utr} • Submitted {formatDateTime(bill.payment_submitted_at)}</Text></View>
                  ) : null}

                  {isPaid ? (
                    <View style={styles.paidInfoCard}>
                      <Text style={styles.paidInfoText}>
                        Paid {formatDate(bill.paid_at)}
                        {bill.receipt_no
                          ? ` • Receipt ${bill.receipt_no}`
                          : ''}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.actionRow}>
                    {!isPaid && (
                      <Pressable
                        onPress={() =>
                          markWasteBillPaid(bill)
                        }
                        style={styles.actionButton}
                      >
                        <Text style={styles.actionText}>
                          {bill.status?.toLowerCase() === 'pending' ? 'VERIFY & ISSUE RECEIPT' : 'MARK PAID'}
                        </Text>
                      </Pressable>
                    )}

                    <Pressable
                      onPress={() =>
                        deleteWasteBill(bill)
                      }
                      style={[
                        styles.actionButton,
                        styles.deleteAction,
                      ]}
                    >
                      <Text
                        style={[
                          styles.actionText,
                          styles.deleteActionText,
                        ]}
                      >
                        DELETE
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}

            {wasteBills.length === 0 && (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>
                  No waste bills yet
                </Text>

                <Text style={styles.emptyText}>
                  Create the first bill above.
                </Text>
              </View>
            )}
          </>
        )}

        {section === 'zonun' && (
          <>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>
                  Zonun Management
                </Text>

                <Text style={styles.sectionDescription}>
                  Upload and manage YMA Salem Branch newsletter issues.
                </Text>
              </View>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.formTitle}>
                Upload New Zonun
              </Text>

              <Text style={styles.label}>Title</Text>
              <TextInput
                value={zonunTitle}
                onChangeText={setZonunTitle}
                placeholder="Zonun September 2026"
                placeholderTextColor="#999999"
                style={styles.input}
              />

              <Text style={styles.label}>Issue Month</Text>
              <TextInput
                value={zonunIssueMonth}
                onChangeText={setZonunIssueMonth}
                placeholder="September 2026"
                placeholderTextColor="#999999"
                style={styles.input}
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                value={zonunDescription}
                onChangeText={setZonunDescription}
                placeholder="Short description (optional)"
                placeholderTextColor="#999999"
                style={[styles.input, styles.textArea]}
                multiline
                textAlignVertical="top"
              />

              <Pressable
                onPress={pickZonunPdf}
                style={styles.outlineButton}
                disabled={savingZonun}
              >
                <Text style={styles.outlineButtonText}>
                  {zonunPdfUrl
                    ? 'CHANGE ZONUN PDF'
                    : 'SELECT ZONUN PDF'}
                </Text>
              </Pressable>

              {zonunPdfUrl ? (
                <View style={styles.zonunPdfReady}>
                  <Text style={styles.zonunPdfReadyIcon}>📄</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.zonunPdfReadyTitle}>
                      PDF ready
                    </Text>
                    <Text style={styles.zonunPdfReadyText}>
                      This issue is ready to publish.
                    </Text>
                  </View>
                </View>
              ) : null}

              <Pressable
                onPress={saveZonun}
                style={styles.primaryButton}
                disabled={savingZonun}
              >
                {savingZonun ? (
                  <ActivityIndicator color={WHITE} />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    PUBLISH ZONUN
                  </Text>
                )}
              </Pressable>
            </View>

            <View style={styles.zonunArchiveHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  Zonun Archive
                </Text>
                <Text style={styles.sectionDescription}>
                  Older issues remain available here for reading.
                </Text>
              </View>
              <View style={styles.zonunCountBadge}>
                <Text style={styles.zonunCountText}>
                  {zonun.length}
                </Text>
              </View>
            </View>

            {zonun.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>
                  No Zonun issues yet
                </Text>
                <Text style={styles.emptyText}>
                  Uploaded newsletter PDFs will appear here.
                </Text>
              </View>
            ) : (
              zonun.map((item) => (
                <View key={item.id} style={styles.zonunCard}>
                  <View style={styles.zonunCardTop}>
                    <View style={styles.zonunCardIcon}>
                      <Text style={styles.zonunCardIconText}>📰</Text>
                    </View>

                    <View style={styles.zonunCardInfo}>
                      <Text style={styles.zonunCardTitle}>
                        {item.title}
                      </Text>
                      <Text style={styles.zonunCardMonth}>
                        {item.issue_month || formatDate(item.created_at)}
                      </Text>
                      {item.description ? (
                        <Text style={styles.zonunCardDescription}>
                          {item.description}
                        </Text>
                      ) : null}
                    </View>

                    <View
                      style={[
                        styles.billStatus,
                        item.is_published
                          ? styles.billStatusPaid
                          : undefined,
                      ]}
                    >
                      <Text
                        style={[
                          styles.billStatusText,
                          item.is_published &&
                            styles.billStatusTextPaid,
                        ]}
                      >
                        {item.is_published ? 'PUBLISHED' : 'HIDDEN'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.zonunActions}>
                    <Pressable
                      onPress={() => toggleZonun(item)}
                      style={styles.actionButton}
                    >
                      <Text style={styles.actionText}>
                        {item.is_published ? 'HIDE' : 'PUBLISH'}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => deleteZonun(item)}
                      style={[
                        styles.actionButton,
                        styles.deleteAction,
                      ]}
                    >
                      <Text
                        style={[
                          styles.actionText,
                          styles.deleteActionText,
                        ]}
                      >
                        DELETE
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {section === 'leaders' && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Branch Leaders</Text>
                <Text style={styles.sectionDescription}>
                  Manage YMA Salem Branch hruaitu te
                </Text>
              </View>
              <View style={styles.leaderCountBadge}>
                <Text style={styles.leaderCountText}>
                  {branchLeaders.length}
                </Text>
              </View>
            </View>

            <View style={styles.formCard}>
              <View>
                <Text style={styles.formTitle}>
                  {editingLeaderId ? 'Edit Branch Leader' : 'Add Branch Leader'}
                </Text>
              </View>

              {editingLeaderId ? (
                <Pressable
                  style={styles.smallButton}
                  onPress={resetLeaderForm}
                  disabled={savingLeader}
                >
                  <Text style={styles.smallButtonText}>Cancel Edit</Text>
                </Pressable>
              ) : null}

              <Text style={styles.label}>Position</Text>
              <View style={styles.positionGrid}>
                {BRANCH_LEADER_POSITIONS.map((position) => (
                  <Pressable
                    key={position}
                    onPress={() => {
                      setLeaderPosition(position);
                      if (!editingLeaderId) {
                        const positionIndex = BRANCH_LEADER_POSITIONS.indexOf(position);
                        if (positionIndex >= 0) setLeaderDisplayOrder(String(positionIndex + 1));
                      }
                    }}
                    style={[
                      styles.positionChip,
                      leaderPosition === position && styles.positionChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.positionChipText,
                        leaderPosition === position && styles.positionChipTextActive,
                      ]}
                    >
                      {position}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={leaderFullName}
                onChangeText={setLeaderFullName}
                placeholder="Enter full name"
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={leaderPhone}
                onChangeText={setLeaderPhone}
                placeholder="Phone number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Display Order</Text>
              <TextInput
                style={styles.input}
                value={leaderDisplayOrder}
                onChangeText={setLeaderDisplayOrder}
                placeholder="1"
                placeholderTextColor="#999"
                keyboardType="number-pad"
              />

              <Pressable
                style={styles.outlineButton}
                onPress={pickLeaderPhoto}
                disabled={savingLeader}
              >
                <Text style={styles.outlineButtonText}>
                  {leaderPhoto ? 'Change Leader Photo' : 'Upload Leader Photo'}
                </Text>
              </Pressable>

              {leaderPhoto ? (
                <View style={styles.leaderPhotoPreviewWrap}>
                  <Image
                    source={{ uri: leaderPhoto }}
                    style={styles.leaderPhotoPreview}
                  />
                  <Text style={styles.leaderPhotoPreviewText}>
                    Photo selected
                  </Text>
                </View>
              ) : null}

              <Pressable
                style={styles.visibilityRow}
                onPress={() => setLeaderActive((value) => !value)}
              >
                <View
                  style={[
                    styles.visibilityDot,
                    leaderActive && styles.visibilityDotActive,
                  ]}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.visibilityTitle}>
                    {leaderActive ? 'Visible on Branch page' : 'Hidden from Branch page'}
                  </Text>
                  <Text style={styles.visibilitySubtitle}>
                    Tap to {leaderActive ? 'hide' : 'show'} this leader
                  </Text>
                </View>
              </Pressable>

              <Pressable
                style={styles.primaryButton}
                onPress={saveBranchLeader}
                disabled={savingLeader}
              >
                {savingLeader ? (
                  <ActivityIndicator color={WHITE} />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {editingLeaderId ? 'Save Changes' : 'Add Branch Leader'}
                  </Text>
                )}
              </Pressable>
            </View>

            <View style={styles.sectionHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.formTitle}>Current Branch Leaders</Text>
                <Text style={styles.sectionDescription}>
                  Only active leaders are shown on the Branch page.
                </Text>
              </View>
            </View>

            {branchLeaders.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No branch leaders yet</Text>
                <Text style={styles.emptyText}>
                  Add the first YMA Salem Branch leader above.
                </Text>
              </View>
            ) : (
              branchLeaders.map((item) => (
                <View key={item.id} style={styles.leaderAdminCard}>
                  {item.photo_url ? (
                    <Image
                      source={{ uri: item.photo_url }}
                      style={styles.leaderAdminPhoto}
                    />
                  ) : (
                    <View style={styles.leaderAdminPhotoPlaceholder}>
                      <Text style={styles.leaderAdminPhotoPlaceholderText}>👤</Text>
                    </View>
                  )}

                  <View style={styles.leaderAdminInfo}>
                    <Text style={styles.leaderAdminPosition}>
                      {item.position}
                    </Text>
                    <Text style={styles.leaderAdminName}>
                      {item.full_name}
                    </Text>
                    {item.phone ? (
                      <Text style={styles.leaderAdminPhone}>{item.phone}</Text>
                    ) : null}
                    <Text style={styles.leaderAdminMeta}>
                      Order {item.display_order} • {item.is_active ? 'Visible' : 'Hidden'}
                    </Text>
                  </View>

                  <View style={styles.leaderAdminActions}>
                    <Pressable
                      style={styles.smallActionButton}
                      onPress={() => editBranchLeader(item)}
                    >
                      <Text style={styles.smallActionText}>Edit</Text>
                    </Pressable>
                    <Pressable
                      style={styles.smallActionButton}
                      onPress={() => toggleBranchLeader(item)}
                    >
                      <Text style={styles.smallActionText}>
                        {item.is_active ? 'Hide' : 'Show'}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={styles.smallDeleteButton}
                      onPress={() => deleteBranchLeader(item)}
                    >
                      <Text style={styles.smallDeleteText}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>
        )}


        {section === 'section-leaders' && (
          <View>
            <View style={styles.sectionHeaderRow}><View style={{flex:1}}><Text style={styles.sectionTitle}>Section Hruaitute</Text><Text style={styles.sectionDescription}>Branch Hruaitute hnuaiah • Section I, II & III • Hruaitu 6 each</Text></View><View style={styles.leaderCountBadge}><Text style={styles.leaderCountText}>{sectionLeaders.length}</Text></View></View>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>{editingSectionLeaderId?'Edit Section Hruaitu':'Add Section Hruaitu'}</Text>
              {editingSectionLeaderId?<Pressable style={styles.smallButton} onPress={resetSectionLeaderForm} disabled={savingSectionLeader}><Text style={styles.smallButtonText}>Cancel Edit</Text></Pressable>:null}
              <Text style={styles.label}>Section</Text><View style={styles.positionGrid}>{SECTION_NAMES.map(item=><Pressable key={item} onPress={()=>setSectionLeaderSection(item)} style={[styles.positionChip,sectionLeaderSection===item&&styles.positionChipActive]}><Text style={[styles.positionChipText,sectionLeaderSection===item&&styles.positionChipTextActive]}>{item}</Text></Pressable>)}</View>
              <Text style={styles.label}>Position</Text><View style={styles.positionGrid}>{SECTION_LEADER_POSITIONS.map(item=><Pressable key={item} onPress={()=>{
                setSectionLeaderPosition(item);
                if (!editingSectionLeaderId) {
                  const positionIndex = SECTION_LEADER_POSITIONS.indexOf(item);
                  if (positionIndex >= 0) setSectionLeaderDisplayOrder(String(positionIndex + 1));
                }
              }} style={[styles.positionChip,sectionLeaderPosition===item&&styles.positionChipActive]}><Text style={[styles.positionChipText,sectionLeaderPosition===item&&styles.positionChipTextActive]}>{item}</Text></Pressable>)}</View>
              <Text style={styles.label}>Full Name</Text><TextInput style={styles.input} value={sectionLeaderFullName} onChangeText={setSectionLeaderFullName} placeholder="Enter full name" placeholderTextColor="#999" />
              <Text style={styles.label}>Contact</Text><TextInput style={styles.input} value={sectionLeaderPhone} onChangeText={setSectionLeaderPhone} placeholder="Contact number" placeholderTextColor="#999" keyboardType="phone-pad" />
              <Text style={styles.label}>Display Order (1–6)</Text><TextInput style={styles.input} value={sectionLeaderDisplayOrder} onChangeText={setSectionLeaderDisplayOrder} placeholder="1" placeholderTextColor="#999" keyboardType="number-pad" />
              <Pressable style={styles.outlineButton} onPress={pickSectionLeaderPhoto} disabled={savingSectionLeader}><Text style={styles.outlineButtonText}>{sectionLeaderPhoto?'Change Photo':'Upload Photo'}</Text></Pressable>
              {sectionLeaderPhoto?<View style={styles.leaderPhotoPreviewWrap}><Image source={{uri:sectionLeaderPhoto}} style={styles.leaderPhotoPreview}/><Text style={styles.leaderPhotoPreviewText}>Photo selected</Text></View>:null}
              <Pressable style={styles.visibilityRow} onPress={()=>setSectionLeaderActive(v=>!v)}><View style={[styles.visibilityDot,sectionLeaderActive&&styles.visibilityDotActive]}/><View style={{flex:1}}><Text style={styles.visibilityTitle}>{sectionLeaderActive?'Visible on Branch page':'Hidden from Branch page'}</Text><Text style={styles.visibilitySubtitle}>Tap to {sectionLeaderActive?'hide':'show'} this member</Text></View></Pressable>
              <Pressable style={styles.primaryButton} onPress={saveSectionLeader} disabled={savingSectionLeader}>{savingSectionLeader?<ActivityIndicator color={WHITE}/>:<Text style={styles.primaryButtonText}>{editingSectionLeaderId?'Save Changes':'Add Section Hruaitu'}</Text>}</Pressable>
            </View>
            {SECTION_NAMES.map(sectionName=>{const items=sectionLeaders.filter(i=>i.section===sectionName).sort((a,b)=>a.display_order-b.display_order);return <View key={sectionName} style={{marginBottom:22}}><Text style={styles.formTitle}>{sectionName} • {items.length}/6 Hruaitu</Text>{items.length===0?<View style={styles.emptyCard}><Text style={styles.emptyTitle}>No hruaitu yet</Text><Text style={styles.emptyText}>Add up to 6 Section Hruaitute for {sectionName}.</Text></View>:items.map(item=><View key={item.id} style={styles.leaderAdminCard}>{item.photo_url?<Image source={{uri:item.photo_url}} style={styles.leaderAdminPhoto}/>:<View style={styles.leaderAdminPhotoPlaceholder}><Text style={styles.leaderAdminPhotoPlaceholderText}>👤</Text></View>}<View style={styles.leaderAdminInfo}><Text style={styles.leaderAdminPosition}>{item.position}</Text><Text style={styles.leaderAdminName}>{item.full_name}</Text>{item.phone?<Text style={styles.leaderAdminPhone}>{item.phone}</Text>:null}<Text style={styles.leaderAdminMeta}>{item.is_active?'Visible':'Hidden'}</Text></View><View style={styles.leaderAdminActions}><Pressable style={styles.smallActionButton} onPress={()=>editSectionLeader(item)}><Text style={styles.smallActionText}>Edit</Text></Pressable><Pressable style={styles.smallActionButton} onPress={()=>toggleSectionLeader(item)}><Text style={styles.smallActionText}>{item.is_active?'Hide':'Show'}</Text></Pressable><Pressable style={[styles.smallActionButton,styles.deleteAction]} onPress={()=>deleteSectionLeader(item)}><Text style={[styles.smallActionText,styles.deleteActionText]}>Delete</Text></Pressable></View></View>)}</View>})}
          </View>
        )}

        {section === 'cemetery' && (
          <>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>
                  Thlanmual Management
                </Text>
                <Text style={styles.sectionDescription}>
                  Salem cemetery records, grave details and chanchin tawi.
                </Text>
              </View>

              {editingCemeteryId ? (
                <Pressable
                  onPress={resetCemeteryForm}
                  style={styles.smallButton}
                >
                  <Text style={styles.smallButtonText}>CANCEL</Text>
                </Pressable>
              ) : null}
            </View>

            <View style={styles.cemeteryAdminSummary}>
              <View style={styles.cemeteryAdminSummaryIcon}>
                <Image source={CEMETERY_GRAVE_ICON} style={styles.cemeteryAdminSummaryIconText} resizeMode="contain" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cemeteryAdminSummaryLabel}>
                  CEMETERY REGISTER
                </Text>
                <Text style={styles.cemeteryAdminSummaryTitle}>
                  {cemeteryRecords.length} recorded
                </Text>
                <Text style={styles.cemeteryAdminSummaryText}>
                  {filteredCemeteryRecords.length} matching current search
                </Text>
              </View>
            </View>

            <View style={{ marginBottom: 14 }}>
              <Text style={styles.formTitle}>Cemetery Register</Text>
              <Text style={styles.sectionDescription}>Select a register to view its records.</Text>
              {CEMETERY_REGISTER_CATEGORIES.map((category) => {
                const count = cemeteryRecords.filter((item) => item.row_name === category).length;
                const active = cemeteryRowName === category;
                const categoryRecords = filteredCemeteryRecords.filter((item) => item.row_name === category);
                return (
                  <View key={category} style={[styles.cemeteryCard, active && { borderColor: RED, borderWidth: 2 }]}>
                    <Pressable onPress={() => setCemeteryRowName(category)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={[styles.cemeteryAdminSummaryIcon, active && { backgroundColor: RED }]}><Image source={CEMETERY_GRAVE_ICON} style={styles.cemeteryAdminSummaryIconText} resizeMode="contain" /></View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cemeteryCardName}>{category}</Text>
                        <Text style={styles.cemeteryCardMeta}>{count} record{count === 1 ? '' : 's'}</Text>
                      </View>
                      <Text style={{ fontWeight: '900', color: active ? RED : MUTED }}>{active ? 'SELECTED' : 'OPEN'}</Text>
                    </Pressable>
                    {active ? (
                      <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 10 }}>
                        {categoryRecords.length === 0 ? <Text style={styles.emptyText}>No record in {category}.</Text> : categoryRecords.map((item) => (
                          <View key={item.id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }}>
                            <Text style={styles.cemeteryCardName}>{item.deceased_name}</Text>
                            <Text style={styles.cemeteryCardMeta}>Grave: {item.grave_number || '-'} • {item.is_published ? 'PUBLIC' : 'HIDDEN'}</Text>
                            <View style={styles.actionRow}>
                              <Pressable onPress={() => editCemetery(item)} style={styles.actionButton}><Text style={styles.actionText}>EDIT</Text></Pressable>
                              <Pressable onPress={() => toggleCemetery(item)} style={styles.actionButton}><Text style={styles.actionText}>{item.is_published ? 'HIDE' : 'PUBLISH'}</Text></Pressable>
                              <Pressable onPress={() => deleteCemetery(item)} style={[styles.actionButton, styles.deleteAction]}><Text style={[styles.actionText, styles.deleteActionText]}>DELETE</Text></Pressable>
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>

            <View style={styles.formCard}>
              <Text style={styles.formTitle}>
                {editingCemeteryId ? 'Edit Cemetery Record' : 'Add Cemetery Record'}
              </Text>

              <Text style={styles.label}>Deceased Name *</Text>
              <TextInput
                value={cemeteryDeceasedName}
                onChangeText={setCemeteryDeceasedName}
                placeholder="Full name of deceased"
                placeholderTextColor="#999999"
                style={styles.input}
              />

              <Pressable onPress={pickCemeteryPersonPhoto} style={styles.outlineButton} disabled={cemeteryPhotoUploading || savingCemetery}>
                <Text style={styles.outlineButtonText}>{cemeteryPhoto ? 'CHANGE PHOTO' : 'ADD PHOTO'}</Text>
              </Pressable>
              {cemeteryPhoto ? (
                <View style={{ gap: 8 }}>
                  <Image source={{ uri: cemeteryPhoto }} style={styles.cemeteryFormImage} />
                  <Pressable onPress={() => setCemeteryPhoto('')} style={styles.outlineButton}>
                    <Text style={styles.outlineButtonText}>REMOVE PHOTO</Text>
                  </Pressable>
                </View>
              ) : null}

              <Text style={styles.label}>Date of Birth (Optional)</Text>
              <TextInput
                value={cemeteryDateOfBirth}
                onChangeText={setCemeteryDateOfBirth}
                placeholder="DD/MM/YYYY or YYYY"
                placeholderTextColor="#999999"
                style={styles.input}
                keyboardType="numbers-and-punctuation"
              />

              <Text style={styles.label}>Date of Death (Optional)</Text>
              <TextInput
                value={cemeteryDateOfDeath}
                onChangeText={setCemeteryDateOfDeath}
                placeholder="DD/MM/YYYY or YYYY"
                placeholderTextColor="#999999"
                style={styles.input}
              />

              <Text style={styles.label}>Mitthi Kum Zat (Manual)</Text>
              <TextInput value={cemeteryAgeAtDeath} onChangeText={setCemeteryAgeAtDeath} placeholder="e.g. 72" placeholderTextColor="#999999" style={styles.input} keyboardType="number-pad" />

              <Text style={styles.label}>Register Category *</Text>
              <View style={styles.statusRow}>
                {CEMETERY_REGISTER_CATEGORIES.map((category) => (
                  <Pressable key={category} onPress={() => setCemeteryRowName(category)} style={[styles.statusButton, cemeteryRowName === category && styles.statusButtonActive]}>
                    <Text style={[styles.statusButtonText, cemeteryRowName === category && styles.statusButtonTextActive]}>{category}</Text>
                  </Pressable>
                ))}
              </View>


              <Text style={styles.label}>Cemetery</Text>
              <TextInput value="Salem Thlanmual" editable={false} style={[styles.input, { opacity: 0.7 }]} />

              <Text style={styles.label}>Grave No.</Text>
              {!editingCemeteryId ? (
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                  <Pressable
                    onPress={() => {
                      setCemeteryAddToExistingGrave(false);
                      setCemeteryGraveNumber('');
                    }}
                    style={[styles.statusButton, !cemeteryAddToExistingGrave && styles.statusButtonActive]}
                  >
                    <Text style={[styles.statusButtonText, !cemeteryAddToExistingGrave && styles.statusButtonTextActive]}>NEW GRAVE</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setCemeteryAddToExistingGrave(true)}
                    style={[styles.statusButton, cemeteryAddToExistingGrave && styles.statusButtonActive]}
                  >
                    <Text style={[styles.statusButtonText, cemeteryAddToExistingGrave && styles.statusButtonTextActive]}>ADD TO EXISTING GRAVE</Text>
                  </Pressable>
                </View>
              ) : null}

              {editingCemeteryId ? (
                <TextInput
                  value={cemeteryGraveNumber}
                  editable={false}
                  style={[styles.input, { opacity: 0.7 }]}
                />
              ) : cemeteryAddToExistingGrave ? (
                <View style={{ gap: 8, marginBottom: 10 }}>
                  {Array.from(new Set(
                    cemeteryRecords
                      .filter((item) => item.cemetery_name === (cemeteryName.trim() || 'Salem Cemetery') && item.row_name === cemeteryRowName && item.grave_number)
                      .map((item) => String(item.grave_number))
                  )).sort().map((grave) => {
                    const people = cemeteryRecords.filter(
                      (item) => item.cemetery_name === (cemeteryName.trim() || 'Salem Cemetery') && item.row_name === cemeteryRowName && item.grave_number === grave
                    ).length;
                    const selected = cemeteryGraveNumber === grave;
                    return (
                      <Pressable
                        key={grave}
                        onPress={() => setCemeteryGraveNumber(grave)}
                        style={[styles.statusButton, selected && styles.statusButtonActive]}
                      >
                        <Text style={[styles.statusButtonText, selected && styles.statusButtonTextActive]}>
                          {grave} • {people} {people === 1 ? 'person' : 'persons'}
                        </Text>
                      </Pressable>
                    );
                  })}
                  {Array.from(new Set(cemeteryRecords.filter((item) => item.row_name === cemeteryRowName && item.grave_number).map((item) => String(item.grave_number)))).length === 0 ? (
                    <Text style={{ color: '#737A84', fontSize: 12 }}>No existing grave in this register yet.</Text>
                  ) : null}
                </View>
              ) : (
                <TextInput
                  value={cemeteryRowName ? `Next: ${getCemeteryGravePrefix(cemeteryRowName)}-XX` : ''}
                  editable={false}
                  placeholder="Select a register category"
                  placeholderTextColor="#999999"
                  style={[styles.input, { opacity: 0.7 }]}
                />
              )}

              {!editingCemeteryId && cemeteryRowName && !cemeteryAddToExistingGrave ? (
                <Text style={{ color: '#737A84', fontSize: 12, marginTop: -6, marginBottom: 10 }}>
                  New registration will automatically receive the next available grave number. If this person shares a grave, choose “ADD TO EXISTING GRAVE” instead.
                </Text>
              ) : null}

              <Text style={styles.label}>Family Name</Text>
              <TextInput
                value={cemeteryFamilyName}
                onChangeText={setCemeteryFamilyName}
                placeholder="Family / clan name"
                placeholderTextColor="#999999"
                style={styles.input}
              />

              <Text style={styles.label}>Family Contact Phone</Text>
              <TextInput
                value={cemeteryFamilyContactPhone}
                onChangeText={setCemeteryFamilyContactPhone}
                placeholder="Optional internal phone"
                placeholderTextColor="#999999"
                style={styles.input}
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Chanchin Tawi / Biography</Text>
              <TextInput
                value={cemeteryBiography}
                onChangeText={setCemeteryBiography}
                placeholder="Short biography or life story..."
                placeholderTextColor="#999999"
                style={[styles.input, styles.textArea]}
                multiline
                textAlignVertical="top"
              />

              <Pressable
                onPress={pickCemeteryPhoto}
                style={styles.outlineButton}
                disabled={cemeteryPhotoUploading || savingCemetery}
              >
                <Text style={styles.outlineButtonText}>
                  {cemeteryPhotoUploading
                    ? 'UPLOADING PHOTO...'
                    : cemeteryGravePhoto
                      ? 'CHANGE GRAVE PHOTO'
                      : 'ADD GRAVE PHOTO'}
                </Text>
              </Pressable>

              {cemeteryGravePhoto ? (
                <View style={{ gap: 8 }}>
                  <Image source={{ uri: cemeteryGravePhoto }} style={styles.cemeteryFormImage} />
                  <Pressable onPress={() => setCemeteryGravePhoto('')} style={styles.outlineButton} disabled={cemeteryPhotoUploading || savingCemetery}>
                    <Text style={styles.outlineButtonText}>REMOVE GRAVE PHOTO</Text>
                  </Pressable>
                </View>
              ) : null}


              <Text style={styles.label}>Public Visibility</Text>
              <View style={styles.statusRow}>
                {[
                  [true, 'Published'],
                  [false, 'Hidden'],
                ].map(([value, label]) => (
                  <Pressable
                    key={String(value)}
                    onPress={() => setCemeteryPublished(value as boolean)}
                    style={[
                      styles.statusButton,
                      cemeteryPublished === value && styles.statusButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusButtonText,
                        cemeteryPublished === value && styles.statusButtonTextActive,
                      ]}
                    >
                      {label as string}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {cemeterySaveError ? (
                <View style={{ marginBottom: 12, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#D32F2F', backgroundColor: '#FFF5F5' }}>
                  <Text style={{ color: '#B71C1C', fontWeight: '800', fontSize: 13 }}>SAVE FAILED</Text>
                  <Text style={{ color: '#B71C1C', marginTop: 4, lineHeight: 19 }}>{cemeterySaveError}</Text>
                </View>
              ) : null}

              <Pressable
                onPress={saveCemetery}
                style={styles.primaryButton}
                disabled={savingCemetery || cemeteryPhotoUploading || cemeteryDocumentUploading}
              >
                {savingCemetery ? (
                  <ActivityIndicator color={WHITE} />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {editingCemeteryId ? 'UPDATE CEMETERY RECORD' : 'SAVE CEMETERY RECORD'}
                  </Text>
                )}
              </Pressable>
            </View>

            <TextInput
              value={cemeterySearch}
              onChangeText={setCemeterySearch}
              placeholder="Search name, family, grave, category..."
              placeholderTextColor="#999999"
              style={styles.input}
            />

            <View style={styles.cemeteryArchiveHeader}>
              <View>
                <Text style={styles.sectionTitle}>Cemetery Register</Text>
                <Text style={styles.sectionDescription}>
                  Register 5-te record-te separate-a manage rawh.
                </Text>
              </View>
              <View style={styles.zonunCountBadge}>
                <Text style={styles.zonunCountText}>
                  {filteredCemeteryRecords.length}
                </Text>
              </View>
            </View>

            {filteredCemeteryRecords.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No cemetery records found</Text>
                <Text style={styles.emptyText}>
                  Add a record above or try a different search.
                </Text>
              </View>
            ) : (
              filteredCemeteryRecords.map((item) => (
                <View key={item.id} style={styles.cemeteryCard}>
                  <View style={styles.cemeteryCardTop}>
                    {item.grave_photo_url ? (
                      <Image
                        source={{ uri: item.grave_photo_url }}
                        style={styles.cemeteryThumb}
                      />
                    ) : (
                      <View style={styles.cemeteryThumbPlaceholder}>
                        <Image source={CEMETERY_GRAVE_ICON} style={styles.cemeteryThumbIcon} resizeMode="contain" />
                      </View>
                    )}

                    <View style={styles.cemeteryCardInfo}>
                      <Text style={styles.cemeteryCardName}>
                        {item.deceased_name}
                      </Text>
                      {item.family_name ? (
                        <Text style={styles.cemeteryCardMeta}>
                          Family: {item.family_name}
                        </Text>
                      ) : null}
                      <Text style={styles.cemeteryCardMeta}>
                        Death: {formatDate(item.date_of_death)}
                      </Text>
                      <Text style={styles.cemeteryCardMeta}>
                        Grave: {item.grave_number || '-'}
                        {item.row_name ? ` • ${item.row_name}` : ''}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.billStatus,
                        item.is_published && styles.billStatusPaid,
                      ]}
                    >
                      <Text
                        style={[
                          styles.billStatusText,
                          item.is_published && styles.billStatusTextPaid,
                        ]}
                      >
                        {item.is_published ? 'PUBLIC' : 'HIDDEN'}
                      </Text>
                    </View>
                  </View>

                  {item.biography ? (
                    <Text style={styles.cemeteryCardBiography} numberOfLines={4}>
                      {item.biography}
                    </Text>
                  ) : null}

                  <View style={styles.actionRow}>
                    <Pressable
                      onPress={() => editCemetery(item)}
                      style={styles.actionButton}
                    >
                      <Text style={styles.actionText}>EDIT</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => toggleCemetery(item)}
                      style={styles.actionButton}
                    >
                      <Text style={styles.actionText}>
                        {item.is_published ? 'HIDE' : 'PUBLISH'}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => deleteCemetery(item)}
                      style={[styles.actionButton, styles.deleteAction]}
                    >
                      <Text style={[styles.actionText, styles.deleteActionText]}>
                        DELETE
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </>
        )}


        {section === 'gas' && (
          <>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>
                  Gas Bookings
                </Text>

                <Text style={styles.sectionDescription}>
                  Manage member gas cylinder bookings.
                </Text>
              </View>

              <Pressable
                onPress={() => { loadGasBookings(); loadGasBookingArchive(); }}
                style={styles.smallButton}
              >
                <Text style={styles.smallButtonText}>
                  REFRESH
                </Text>
              </Pressable>
            </View>

            <Pressable
              onPress={printGasBookings}
              style={styles.printGasButton}
            >
              <Text style={styles.printGasButtonText}>
                🖨️ PRINT GAS BOOKINGS (
                {gasBookings.length})
              </Text>
            </Pressable>

            <View style={{ marginTop: 10, padding: 12, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: BORDER }}>
              <Text style={{ fontSize: 13, fontWeight: '900', color: TEXT, marginBottom: 8 }}>
                GAS BOOKING DELETED DATE
              </Text>
              <Text style={{ fontSize: 12, color: MUTED, marginBottom: 10 }}>
                Deleted ni thlan la, chumi ni-ah deleted gas booking list chauh PDF-ah print rawh.
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Pressable
                  onPress={() => setSelectedGasArchiveDate(null)}
                  style={{ paddingVertical: 9, paddingHorizontal: 13, borderRadius: 20, marginRight: 7, backgroundColor: selectedGasArchiveDate === null ? RED : '#F0F0F0' }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '900', color: selectedGasArchiveDate === null ? WHITE : TEXT }}>
                    ALL DATES
                  </Text>
                </Pressable>
                {gasArchiveDates.map((dateKey) => (
                  <Pressable
                    key={dateKey}
                    onPress={() => setSelectedGasArchiveDate(dateKey)}
                    style={{ paddingVertical: 9, paddingHorizontal: 13, borderRadius: 20, marginRight: 7, backgroundColor: selectedGasArchiveDate === dateKey ? RED : '#F0F0F0' }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '900', color: selectedGasArchiveDate === dateKey ? WHITE : TEXT }}>
                      {formatDate(`${dateKey}T00:00:00`)}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Text style={{ marginTop: 10, fontSize: 12, fontWeight: '800', color: '#37474F' }}>
                Selected: {selectedGasArchiveDate ? formatDate(`${selectedGasArchiveDate}T00:00:00`) : 'All deleted dates'} • {selectedGasArchiveBookings.length} booking(s)
              </Text>
              <Pressable
                onPress={printGasBookingArchive}
                style={[styles.printGasButton, { backgroundColor: '#37474F', marginTop: 10 }]}
              >
                <Text style={styles.printGasButtonText}>
                  📁 GAS BOOKING HISTORY PDF ({selectedGasArchiveBookings.length})
                </Text>
              </Pressable>
            </View>

            {gasBookings.length > 0 && (
              <Pressable
                onPress={deleteAllGasBookings}
                style={{ marginTop: 10, paddingVertical: 13, borderRadius: 10, backgroundColor: '#8E1B1B', alignItems: 'center' }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>🗑️ DELETE ALL BOOKINGS — KEEP HISTORY</Text>
              </Pressable>
            )}

            {loadingGasBookings ? (
              <View style={styles.emptyCard}>
                <ActivityIndicator color={RED} />

                <Text style={styles.emptyText}>
                  Loading gas bookings...
                </Text>
              </View>
            ) : gasBookings.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>
                  No gas bookings
                </Text>

                <Text style={styles.emptyText}>
                  Member gas bookings will appear here.
                </Text>
              </View>
            ) : (
              gasBookings.map((booking) => {
                const status =
                  (
                    booking.status ||
                    'pending'
                  ).toLowerCase();

                return (
                  <View
                    key={booking.id}
                    style={styles.wasteBillCard}
                  >
                    <View
                      style={styles.wasteBillTop}
                    >
                      <View
                        style={
                          styles.wasteBillIcon
                        }
                      >
                        <Text
                          style={
                            styles.wasteBillIconText
                          }
                        >
                          G
                        </Text>
                      </View>

                      <View
                        style={
                          styles.wasteBillInfo
                        }
                      >
                        <Text
                          style={
                            styles.wasteBillMember
                          }
                        >
                          {booking.full_name}
                        </Text>

                        <Text
                          style={
                            styles.wasteBillMeta
                          }
                        >
                          📞 {booking.phone}
                        </Text>

                        <Text
                          style={
                            styles.wasteBillMeta
                          }
                        >
                          {booking.cylinder_quantity}{' '}
                          cylinder
                          {booking.cylinder_quantity ===
                          1
                            ? ''
                            : 's'}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.billStatus,
                          status ===
                            'completed' &&
                            styles.billStatusPaid,
                        ]}
                      >
                        <Text
                          style={[
                            styles.billStatusText,
                            status ===
                              'completed' &&
                              styles.billStatusTextPaid,
                          ]}
                        >
                          {status.toUpperCase()}
                        </Text>
                      </View>
                    </View>


                    <Text
                      style={[
                        styles.label,
                        {
                          marginTop: 13,
                        },
                      ]}
                    >
                      UPDATE STATUS
                    </Text>

                    <View style={styles.statusRow}>
                      {[
                        ['pending', 'Pending'],
                        ['confirmed', 'Confirmed'],
                        ['completed', 'Completed'],
                        ['cancelled', 'Cancelled'],
                      ].map(([value, label]) => (
                        <Pressable
                          key={value}
                          onPress={() =>
                            updateGasBookingStatus(
                              booking,
                              value,
                            )
                          }
                          style={[
                            styles.statusButton,
                            status === value &&
                              styles.statusButtonActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusButtonText,
                              status === value &&
                                styles.statusButtonTextActive,
                            ]}
                          >
                            {label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>

                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>
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

  loadingTitle: {
    color: WHITE,
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: 2,
  },

  loadingSubtitle: {
    color: '#D9D9D9',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
  },

  deniedTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: TEXT,
    textAlign: 'center',
    marginBottom: 20,
  },

  header: {
    paddingTop: 58,
    paddingHorizontal: 20,
    paddingBottom: 22,
  },

  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerEyebrow: {
    color: '#FFDADA',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 4,
  },

  headerTitle: {
    color: WHITE,
    fontSize: 28,
    fontWeight: '900',
  },

  headerSubtitle: {
    color: '#E6E6E6',
    fontSize: 12,
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

  bodyContent: {
    padding: 16,
    paddingBottom: 50,
  },

  sectionTabs: {
    paddingBottom: 15,
    gap: 8,
  },

  sectionTab: {
    paddingHorizontal: 17,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  sectionTabActive: {
    backgroundColor: RED,
    borderColor: RED,
  },

  sectionTabText: {
    color: MUTED,
    fontSize: 12,
    fontWeight: '800',
  },

  sectionTabTextActive: {
    color: WHITE,
  },

  profileBannerButton: {
    backgroundColor: WHITE,
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: BORDER,
    marginLeft: 10,
  },

  profileBannerButtonText: {
    color: RED,
    fontSize: 10,
    fontWeight: '900',
  },

  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  profilePhoto: {
    width: 74,
    height: 74,
    borderRadius: 37,
    marginRight: 14,
    backgroundColor: LIGHT_RED,
  },

  profilePhotoPlaceholder: {
    width: 74,
    height: 74,
    borderRadius: 37,
    marginRight: 14,
    backgroundColor: LIGHT_RED,
    alignItems: 'center',
    justifyContent: 'center',
  },

  profilePhotoPlaceholderText: {
    fontSize: 30,
  },

  profileRoleText: {
    color: RED,
    fontSize: 11,
    fontWeight: '800',
    marginTop: -10,
  },

  profileSectionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15,
  },

  profileSectionChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#F3F3F3',
    borderWidth: 1,
    borderColor: '#E1E1E1',
  },

  profileSectionChipActive: {
    backgroundColor: RED,
    borderColor: RED,
  },

  profileSectionChipText: {
    color: '#666666',
    fontSize: 10,
    fontWeight: '800',
  },

  profileSectionChipTextActive: {
    color: WHITE,
  },

  readOnlyProfileBox: {
    minHeight: 49,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F1F1F1',
    marginBottom: 12,
  },

  readOnlyProfileText: {
    color: TEXT,
    fontSize: 13,
    fontWeight: '800',
  },

  readOnlyProfileHint: {
    color: MUTED,
    fontSize: 9,
    lineHeight: 13,
    marginTop: 3,
  },

  welcomeCard: {
    backgroundColor: WHITE,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 22,
  },

  cardEyebrow: {
    color: RED,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  welcomeTitle: {
    color: TEXT,
    fontSize: 25,
    fontWeight: '900',
    marginTop: 4,
  },

  welcomeText: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 7,
    maxWidth: 245,
  },

  adminBadge: {
    backgroundColor: LIGHT_RED,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
  },

  adminBadgeText: {
    color: RED,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  sectionTitle: {
    color: TEXT,
    fontSize: 19,
    fontWeight: '900',
    marginTop: 8,
    marginBottom: 12,
  },

  sectionDescription: {
    color: MUTED,
    fontSize: 12,
    marginTop: -7,
    marginBottom: 15,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },

  statCard: {
    width: '48%',
    minHeight: 105,
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 17,
    justifyContent: 'center',
  },

  statCardPressed: {
    opacity: 0.75,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  gasStatCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  gasStatIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: LIGHT_RED,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  gasStatIconText: {
    fontSize: 20,
  },

  statNumber: {
    color: RED,
    fontSize: 29,
    fontWeight: '900',
  },

  statLabel: {
    color: MUTED,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },

  gasDashboardCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },

  gasDashboardGradient: {
    minHeight: 105,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
  },

  gasDashboardIcon: {
    width: 50,
    height: 50,
    borderRadius: 17,
    backgroundColor:
      'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  gasDashboardIconText: {
    fontSize: 25,
  },

  gasDashboardText: {
    flex: 1,
    marginLeft: 13,
  },

  gasDashboardEyebrow: {
    color: '#FFDADA',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.4,
  },

  gasDashboardTitle: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 3,
  },

  gasDashboardSubtitle: {
    color: '#E0E0E0',
    fontSize: 10,
    marginTop: 4,
    lineHeight: 14,
  },

  gasDashboardArrow: {
    color: WHITE,
    fontSize: 31,
    fontWeight: '300',
    marginLeft: 8,
  },

  cemeteryOnlyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    padding: 14,
    marginBottom: 15,
  },

  cemeteryOnlyIcon: {
    width: 28,
    height: 28,
    marginRight: 12,
  },

  cemeteryOnlyTitle: {
    color: RED_DARK,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },

  cemeteryOnlyText: {
    color: MUTED,
    fontSize: 11,
    marginTop: 3,
    lineHeight: 16,
  },

  adminRequestSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 18,
    padding: 16,
    marginBottom: 15,
  },

  adminRequestSummaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: LIGHT_RED,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  adminRequestSummaryIconText: {
    fontSize: 23,
  },

  adminRequestSummaryLabel: {
    color: MUTED,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  adminRequestSummaryTitle: {
    color: TEXT,
    fontSize: 26,
    fontWeight: '900',
    marginTop: 1,
  },

  adminRequestSummaryText: {
    color: MUTED,
    fontSize: 10,
    marginTop: 2,
  },

  adminRequestCard: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 18,
    padding: 15,
    marginBottom: 12,
  },

  adminRequestTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  adminRequestIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: LIGHT_RED,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  adminRequestIconText: {
    fontSize: 22,
  },

  adminRequestInfo: {
    flex: 1,
    paddingRight: 7,
  },

  adminRequestRole: {
    color: RED_DARK,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  adminRequestUserId: {
    color: TEXT,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 6,
  },

  adminRequestDate: {
    color: MUTED,
    fontSize: 9,
    marginTop: 5,
  },

  pendingBadge: {
    backgroundColor: '#FFF3D6',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 5,
  },

  pendingBadgeText: {
    color: '#8A5A00',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  adminRequestActions: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 14,
  },

  adminRequestButton: {
    flex: 1,
    borderRadius: 11,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  approveButton: {
    backgroundColor: '#EAF7EE',
    borderColor: '#B8DFC2',
  },

  rejectButton: {
    backgroundColor: '#FFF1F1',
    borderColor: '#E8BABA',
  },

  adminRequestButtonText: {
    color: '#26723A',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  rejectButtonText: {
    color: RED_DARK,
  },

  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  quickCard: {
    width: '48%',
    backgroundColor: WHITE,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },

  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  quickIconText: {
    color: RED,
    fontSize: 17,
    fontWeight: '900',
  },

  quickTitle: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '900',
  },

  quickSubtitle: {
    color: MUTED,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  smallButton: {
    backgroundColor: LIGHT_RED,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 10,
  },

  smallButtonText: {
    color: RED,
    fontSize: 9,
    fontWeight: '900',
  },

  formCard: {
    backgroundColor: WHITE,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 22,
  },


  formTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 16,
  },

  label: {
    color: '#444444',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 7,
    marginTop: 4,
  },

  input: {
    height: 49,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 13,
    paddingHorizontal: 14,
    color: TEXT,
    backgroundColor: '#FAFAFA',
    fontSize: 13,
    marginBottom: 12,
  },

  textArea: {
    height: 125,
    paddingTop: 13,
  },

  outlineButton: {
    height: 48,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: RED,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  outlineButtonText: {
    color: RED,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  primaryButton: {
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: RED,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    marginTop: 5,
  },

  primaryButtonText: {
    color: WHITE,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  formImage: {
    width: '100%',
    height: 180,
    borderRadius: 15,
    marginBottom: 12,
  },

  resultText: {
    color: MUTED,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 10,
  },

  memberCard: {
    backgroundColor: WHITE,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: LIGHT_RED,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  memberAvatarText: {
    color: RED,
    fontSize: 18,
    fontWeight: '900',
  },

  memberInfo: {
    flex: 1,
  },

  memberName: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '900',
  },

  memberMeta: {
    color: MUTED,
    fontSize: 10,
    marginTop: 2,
  },

  memberTags: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 7,
  },

  tag: {
    backgroundColor: LIGHT_RED,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
  },

  tagText: {
    color: RED,
    fontSize: 8,
    fontWeight: '900',
  },

  inactiveTag: {
    backgroundColor: '#EEEEEE',
  },

  inactiveTagText: {
    color: MUTED,
  },

  arrowButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  arrowText: {
    color: RED,
    fontSize: 24,
    fontWeight: '400',
    marginTop: -2,
  },

  contentCard: {
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 11,
    flexDirection: 'row',
    marginBottom: 10,
  },

  contentThumbnail: {
    width: 88,
    height: 88,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  thumbnailLetter: {
    color: WHITE,
    fontSize: 27,
    fontWeight: '900',
  },

  contentInfo: {
    flex: 1,
    marginLeft: 12,
  },

  contentCategory: {
    color: RED,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  contentTitle: {
    color: TEXT,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 18,
    marginTop: 3,
  },

  contentDate: {
    color: MUTED,
    fontSize: 9,
    marginTop: 3,
  },

  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },

  actionButton: {
    backgroundColor: LIGHT_RED,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  actionText: {
    color: RED,
    fontSize: 8,
    fontWeight: '900',
  },

  deleteAction: {
    backgroundColor: '#FDECEC',
  },

  deleteActionText: {
    color: '#B71C1C',
  },

  dateTimeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },

  dateTimeButton: {
    flex: 1,
    minHeight: 67,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  dateTimeIcon: {
    fontSize: 20,
    marginRight: 9,
  },

  dateTimeLabel: {
    color: RED,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 3,
  },

  dateTimeValue: {
    color: TEXT,
    fontSize: 12,
    fontWeight: '800',
  },

  dateTimePlaceholder: {
    color: '#999999',
    fontSize: 11,
    fontWeight: '600',
  },

  selectedDateCard: {
    backgroundColor: LIGHT_RED,
    borderRadius: 13,
    padding: 12,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: '#F2CACA',
  },

  selectedDateLabel: {
    color: RED,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  selectedDateText: {
    color: TEXT,
    fontSize: 13,
    fontWeight: '900',
    marginTop: 3,
  },

  eventCard: {
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 11,
    flexDirection: 'row',
    marginBottom: 10,
  },

  eventImage: {
    width: 95,
    height: 115,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  eventInfo: {
    flex: 1,
    marginLeft: 12,
  },

  eventDate: {
    color: RED,
    fontSize: 9,
    fontWeight: '900',
  },

  eventTitle: {
    color: TEXT,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '900',
    marginTop: 4,
  },

  eventMeta: {
    color: MUTED,
    fontSize: 9,
    marginTop: 4,
  },

  galleryUploadButton: {
    backgroundColor: RED,
    borderRadius: 18,
    minHeight: 75,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  uploadPlus: {
    color: WHITE,
    fontSize: 30,
    fontWeight: '300',
    marginRight: 14,
  },

  uploadTitle: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '900',
  },

  uploadSubtitle: {
    color: '#FFDADA',
    fontSize: 10,
    marginTop: 3,
  },

  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  galleryCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: WHITE,
    position: 'relative',
    borderWidth: 1,
    borderColor: BORDER,
  },

  galleryImage: {
    width: '100%',
    height: '100%',
  },

  galleryDelete: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor:
      'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  galleryDeleteText: {
    color: WHITE,
    fontSize: 21,
    fontWeight: '300',
    lineHeight: 22,
  },

  galleryCaption: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 9,
    paddingVertical: 8,
    backgroundColor:
      'rgba(0,0,0,0.55)',
  },

  galleryCaptionText: {
    color: WHITE,
    fontSize: 10,
    fontWeight: '800',
  },

  emptyCard: {
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },

  emptyTitle: {
    color: TEXT,
    fontSize: 15,
    fontWeight: '900',
  },

  emptyText: {
    color: MUTED,
    fontSize: 11,
    marginTop: 5,
    textAlign: 'center',
  },

  wasteOverviewCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },

  wasteOverviewGradient: {
    minHeight: 120,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  wasteOverviewEyebrow: {
    color: '#FFDADA',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  wasteOverviewAmount: {
    color: WHITE,
    fontSize: 28,
    fontWeight: '900',
    marginTop: 4,
  },

  wasteOverviewMeta: {
    color: '#EEEEEE',
    fontSize: 11,
    marginTop: 3,
  },

  wasteOverviewArrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor:
      'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  wasteOverviewArrowText: {
    color: WHITE,
    fontSize: 30,
    fontWeight: '300',
    marginTop: -3,
  },

  wasteAdminSummary: {
    minHeight: 125,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  wasteAdminSummaryLabel: {
    color: '#FFDADA',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.4,
  },

  wasteAdminSummaryAmount: {
    color: WHITE,
    fontSize: 30,
    fontWeight: '900',
    marginTop: 4,
  },

  wasteAdminSummaryText: {
    color: '#EEEEEE',
    fontSize: 11,
    marginTop: 3,
  },

  wasteAdminSummaryIcon: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor:
      'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  wasteAdminSummaryIconText: {
    color: WHITE,
    fontSize: 25,
    fontWeight: '900',
  },

  selectedCount: {
    color: MUTED,
    fontSize: 10,
    marginTop: 2,
    fontWeight: '700',
  },

  selectAllButton: {
    backgroundColor: '#FBEAEA',
    borderWidth: 1,
    borderColor: '#F2CACA',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  selectAllButtonText: {
    color: RED_DARK,
    fontSize: 9,
    fontWeight: '900',
  },

  memberPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  memberPickerList: {
    maxHeight: 260,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    backgroundColor: '#FAFAFA',
    marginBottom: 12,
    overflow: 'hidden',
  },

  memberPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    backgroundColor: WHITE,
  },

  memberPickerItemSelected: {
    backgroundColor: '#FFF4F4',
  },

  memberCheck: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#D5D5D5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: WHITE,
  },

  memberCheckSelected: {
    backgroundColor: RED,
    borderColor: RED,
  },

  memberCheckText: {
    color: WHITE,
    fontSize: 13,
    fontWeight: '900',
  },

  memberPickerName: {
    color: TEXT,
    fontSize: 12,
    fontWeight: '900',
  },

  memberPickerMeta: {
    color: MUTED,
    fontSize: 10,
    marginTop: 3,
  },

  memberPickerEmpty: {
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  memberPickerEmptyText: {
    color: MUTED,
    fontSize: 11,
  },

  memberSelectBox: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    backgroundColor: '#FAFAFA',
    marginBottom: 10,
    overflow: 'hidden',
  },

  memberSelectScroll: {
    padding: 8,
    gap: 8,
  },

  memberSelectChip: {
    width: 145,
    minHeight: 60,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: WHITE,
  },

  memberSelectChipActive: {
    backgroundColor: RED,
    borderColor: RED,
  },

  memberSelectName: {
    color: TEXT,
    fontSize: 11,
    fontWeight: '900',
  },

  memberSelectNameActive: {
    color: WHITE,
  },

  memberSelectEmail: {
    color: MUTED,
    fontSize: 8,
    marginTop: 4,
  },

  memberSelectEmailActive: {
    color: '#FFDADA',
  },

  selectedMemberCard: {
    backgroundColor: LIGHT_RED,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F2CACA',
    padding: 12,
    marginBottom: 10,
  },

  selectedMemberLabel: {
    color: RED,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  selectedMemberText: {
    color: TEXT,
    fontSize: 13,
    fontWeight: '900',
    marginTop: 3,
  },

  statusRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },

  statusButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusButtonActive: {
    backgroundColor: RED,
    borderColor: RED,
  },

  statusButtonText: {
    color: MUTED,
    fontSize: 10,
    fontWeight: '900',
  },

  statusButtonTextActive: {
    color: WHITE,
  },

  wasteBillCard: {
    backgroundColor: WHITE,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 15,
    marginBottom: 10,
  },

  wasteBillTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  wasteBillIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: LIGHT_RED,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  wasteBillIconText: {
    color: RED,
    fontSize: 19,
    fontWeight: '900',
  },

  wasteBillInfo: {
    flex: 1,
  },

  wasteBillMember: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '900',
  },

  wasteBillMeta: {
    color: MUTED,
    fontSize: 9,
    marginTop: 3,
  },

  billStatus: {
    backgroundColor: LIGHT_RED,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  billStatusPaid: {
    backgroundColor: '#E8F5E9',
  },

  billStatusText: {
    color: RED,
    fontSize: 8,
    fontWeight: '900',
  },

  billStatusTextPaid: {
    color: '#2E7D32',
  },

  wasteBillDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: BORDER,
    marginTop: 13,
    paddingTop: 12,
  },

  wasteDetailLabel: {
    color: MUTED,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  wasteDetailValue: {
    color: RED,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 3,
  },

  wasteDetailValueSmall: {
    color: TEXT,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 5,
  },

  paidInfoCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 9,
    padding: 9,
    marginTop: 10,
  },

  paidInfoText: {
    color: '#2E7D32',
    fontSize: 9,
    fontWeight: '700',
  },

  cemeteryStatCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  cemeteryStatIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#EEEEEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  cemeteryStatIconText: {
    width: 24,
    height: 24,
  },

  cemeteryAdminSummary: {
    minHeight: 112,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BLACK,
    marginBottom: 18,
  },

  cemeteryAdminSummaryIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  cemeteryAdminSummaryIconText: {
    width: 30,
    height: 30,
  },

  cemeteryAdminSummaryLabel: {
    color: '#D9D9D9',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.4,
  },

  cemeteryAdminSummaryTitle: {
    color: WHITE,
    fontSize: 23,
    fontWeight: '900',
    marginTop: 3,
  },

  cemeteryAdminSummaryText: {
    color: '#BBBBBB',
    fontSize: 10,
    marginTop: 2,
  },

  twoColumnRow: {
    flexDirection: 'row',
    gap: 10,
  },

  twoColumnItem: {
    flex: 1,
  },

  textAreaSmall: {
    minHeight: 80,
  },

  cemeteryFormImage: {
    width: '100%',
    height: 190,
    borderRadius: 14,
    marginBottom: 12,
    backgroundColor: '#EEEEEE',
  },

  cemeteryArchiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 8,
  },

  cemeteryCard: {
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 13,
    marginBottom: 10,
  },

  cemeteryCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  cemeteryThumb: {
    width: 62,
    height: 62,
    borderRadius: 14,
    backgroundColor: '#EEEEEE',
    marginRight: 11,
  },

  cemeteryThumbPlaceholder: {
    width: 62,
    height: 62,
    borderRadius: 14,
    backgroundColor: '#EEEEEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  cemeteryThumbIcon: {
    width: 32,
    height: 32,
  },

  cemeteryCardInfo: {
    flex: 1,
    paddingRight: 6,
  },

  cemeteryCardName: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 19,
  },

  cemeteryCardMeta: {
    color: MUTED,
    fontSize: 9,
    marginTop: 3,
  },

  cemeteryCardBiography: {
    color: TEXT,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },

  leaderCountBadge: {
    minWidth: 34,
    height: 34,
    paddingHorizontal: 8,
    borderRadius: 17,
    backgroundColor: LIGHT_RED,
    alignItems: 'center',
    justifyContent: 'center',
  },

  leaderCountText: {
    color: RED,
    fontSize: 11,
    fontWeight: '900',
  },

  positionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },

  positionChip: {
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: WHITE,
  },

  positionChipActive: {
    backgroundColor: RED,
    borderColor: RED,
  },

  positionChipText: {
    color: TEXT,
    fontSize: 10,
    fontWeight: '800',
  },

  positionChipTextActive: {
    color: WHITE,
  },

  leaderPhotoPreviewWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  leaderPhotoPreview: {
    width: 58,
    height: 58,
    borderRadius: 29,
    marginRight: 10,
  },

  leaderPhotoPreviewText: {
    color: MUTED,
    fontSize: 10,
    fontWeight: '700',
  },

  visibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#F7F7F7',
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 12,
  },

  visibilityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#BDBDBD',
    marginRight: 10,
  },

  visibilityDotActive: {
    backgroundColor: '#2E7D32',
  },

  visibilityTitle: {
    color: TEXT,
    fontSize: 11,
    fontWeight: '900',
  },

  visibilitySubtitle: {
    color: MUTED,
    fontSize: 9,
    marginTop: 2,
  },

  leaderAdminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 11,
    marginBottom: 10,
  },

  leaderAdminPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 11,
  },

  leaderAdminPhotoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: LIGHT_RED,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  leaderAdminPhotoPlaceholderText: {
    fontSize: 21,
  },

  leaderAdminInfo: {
    flex: 1,
    paddingRight: 8,
  },

  leaderAdminPosition: {
    color: RED,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },

  leaderAdminName: {
    color: TEXT,
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2,
  },

  leaderAdminPhone: {
    color: MUTED,
    fontSize: 9,
    marginTop: 2,
  },

  leaderAdminMeta: {
    color: MUTED,
    fontSize: 8,
    marginTop: 4,
  },

  leaderAdminActions: {
    alignItems: 'flex-end',
    gap: 5,
  },

  smallActionButton: {
    minWidth: 48,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: LIGHT_RED,
    alignItems: 'center',
  },

  smallActionText: {
    color: RED,
    fontSize: 8,
    fontWeight: '900',
  },

  smallDeleteButton: {
    minWidth: 48,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: '#FDECEC',
    alignItems: 'center',
  },

  smallDeleteText: {
    color: '#B71C1C',
    fontSize: 8,
    fontWeight: '900',
  },


  zonunStatCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  zonunStatIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: LIGHT_RED,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  zonunStatIconText: {
    fontSize: 20,
  },

  zonunPdfReady: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderRadius: 12,
    padding: 11,
    marginTop: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },

  zonunPdfReadyIcon: {
    fontSize: 22,
    marginRight: 10,
  },

  zonunPdfReadyTitle: {
    color: TEXT,
    fontSize: 11,
    fontWeight: '900',
  },

  zonunPdfReadyText: {
    color: MUTED,
    fontSize: 9,
    marginTop: 2,
  },

  zonunArchiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 10,
  },

  zonunCountBadge: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: LIGHT_RED,
    alignItems: 'center',
    justifyContent: 'center',
  },

  zonunCountText: {
    color: RED,
    fontSize: 11,
    fontWeight: '900',
  },

  zonunCard: {
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 13,
    marginBottom: 10,
  },

  zonunCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  zonunCardIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: LIGHT_RED,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  zonunCardIconText: {
    fontSize: 21,
  },

  zonunCardInfo: {
    flex: 1,
    paddingRight: 7,
  },

  zonunCardTitle: {
    color: TEXT,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 18,
  },

  zonunCardMonth: {
    color: RED,
    fontSize: 9,
    fontWeight: '800',
    marginTop: 3,
  },

  zonunCardDescription: {
    color: MUTED,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 4,
  },

  zonunActions: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },

  printGasButton: {
    backgroundColor: BLACK,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 14,
  },

  printGasButtonText: {
    color: WHITE,
    fontSize: 13,
    fontWeight: '900',
  },
});
