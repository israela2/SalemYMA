import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { supabase } from '../lib/supabase';

type Member = {
  id: number;
  user_id?: string | null;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  section?: string | null;
  branch_name?: string | null;
  status?: string | null;
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
  created_at?: string | null;
};

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
  id: number;
  position: string;
  full_name: string;
  phone?: string | null;
  photo_url?: string | null;
  display_order: number;
  is_active: boolean;
};

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

const BRANCH_LEADER_POSITIONS = [
  'President',
  'Vice President',
  'Secretary',
  'Assistant Secretary',
  'Treasurer',
  'Assistant Treasurer',
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

function formatDate(value?: string | null) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return (
    date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) +
    ' • ' +
    date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  );
}

function formatSelectedDate(date?: Date | null) {
  if (!date) return 'Select event date';

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
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

async function uploadImage(uri: string, folder: string) {
  const file = new File(uri);
  const arrayBuffer = await file.arrayBuffer();

  const extension =
    uri.toLowerCase().includes('.png')
      ? 'png'
      : uri.toLowerCase().includes('.webp')
        ? 'webp'
        : 'jpg';

  const fileName = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 9)}.${extension}`;

  const path = `${folder}/${fileName}`;

  const { error } = await supabase.storage
    .from('gallery')
    .upload(path, arrayBuffer, {
      contentType:
        extension === 'png'
          ? 'image/png'
          : 'image/jpeg',
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
  const file = new File(uri);
  const arrayBuffer = await file.arrayBuffer();

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

export default function AdminScreen() {
  const [loading, setLoading] = useState(true);
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
  const [news, setNews] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [wasteBills, setWasteBills] = useState<WasteBill[]>([]);
  const [zonun, setZonun] = useState<ZonunItem[]>([]);

  const [branchLeaders, setBranchLeaders] = useState<BranchLeader[]>([]);

  const [cemeteryRecords, setCemeteryRecords] =
    useState<CemeteryRecord[]>([]);

  const [cemeterySearch, setCemeterySearch] = useState('');
  const [cemeteryDeceasedName, setCemeteryDeceasedName] = useState('');
  const [cemeteryDateOfBirth, setCemeteryDateOfBirth] = useState('');
  const [cemeteryDateOfDeath, setCemeteryDateOfDeath] = useState('');
  const [cemeteryBurialDate, setCemeteryBurialDate] = useState('');
  const [cemeteryName, setCemeteryName] = useState('Salem Cemetery');
  const [cemeterySection, setCemeterySection] = useState('');
  const [cemeteryRowName, setCemeteryRowName] = useState('');
  const [cemeteryGraveNumber, setCemeteryGraveNumber] = useState('');
  const [cemeteryFamilyName, setCemeteryFamilyName] = useState('');
  const [cemeteryFamilyContactName, setCemeteryFamilyContactName] = useState('');
  const [cemeteryFamilyContactPhone, setCemeteryFamilyContactPhone] = useState('');
  const [cemeteryBiography, setCemeteryBiography] = useState('');
  const [cemeteryGravePhoto, setCemeteryGravePhoto] = useState('');
  const [cemeteryDocumentUrl, setCemeteryDocumentUrl] = useState('');
  const [cemeteryLatitude, setCemeteryLatitude] = useState('');
  const [cemeteryLongitude, setCemeteryLongitude] = useState('');
  const [cemeteryNotes, setCemeteryNotes] = useState('');
  const [cemeteryPublished, setCemeteryPublished] = useState(true);
  const [editingCemeteryId, setEditingCemeteryId] = useState<number | null>(null);
  const [savingCemetery, setSavingCemetery] = useState(false);
  const [cemeteryPhotoUploading, setCemeteryPhotoUploading] = useState(false);
  const [cemeteryDocumentUploading, setCemeteryDocumentUploading] = useState(false);

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

  const [memberSearch, setMemberSearch] = useState('');

  const [newsTitle, setNewsTitle] = useState('');
  const [newsCategory, setNewsCategory] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsImage, setNewsImage] = useState('');
  const [editingNewsId, setEditingNewsId] =
    useState<number | null>(null);
  const [savingNews, setSavingNews] = useState(false);

  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] =
    useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventBranch, setEventBranch] =
    useState('Salem YMA Branch');
  const [eventImage, setEventImage] = useState('');
  const [eventDateValue, setEventDateValue] =
    useState<Date | null>(null);
  const [editingEventId, setEditingEventId] =
    useState<number | null>(null);
  const [savingEvent, setSavingEvent] = useState(false);

  const [showEventDatePicker, setShowEventDatePicker] =
    useState(false);
  const [showEventTimePicker, setShowEventTimePicker] =
    useState(false);

  const [galleryUploading, setGalleryUploading] =
    useState(false);

  const [wasteMemberId, setWasteMemberId] = useState('');
  const [wasteAccountNo, setWasteAccountNo] =
    useState('YMA-0001');
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
    | 'events'
    | 'gallery'
    | 'waste'
    | 'zonun'
    | 'leaders'
    | 'cemetery'
    | 'gas'
    | 'admins'
    | 'profile'
  >('dashboard');

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
        .select('full_name, phone, email, section')
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
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission required',
        'Please allow photo library access.',
      );
      return;
    }

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

  async function loadAll() {
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
          'Only approved Salem YMA administrators can access this page.',
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

        const { data, error } = await supabase
          .from('cemetery_records')
          .select('*')
          .order('deceased_name', {
            ascending: true,
          });

        if (!error) {
          setCemeteryRecords(
            (data || []) as CemeteryRecord[],
          );
        } else {
          console.log(
            'Cemetery Admin load error:',
            error.message,
          );
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

      if (!newsResult.error) {
        setNews(
          newsResult.data || [],
        );
      }

      if (!eventsResult.error) {
        setEvents(
          eventsResult.data || [],
        );
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
          (branchLeadersResult.data || []) as BranchLeader[],
        );
      } else {
        console.log(
          'Branch leaders load error:',
          branchLeadersResult.error.message,
        );
        setBranchLeaders([]);
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

  async function refresh() {
    setRefreshing(true);
    await loadAll();
  }

  async function pickNewsImage() {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission required',
        'Please allow photo library access.',
      );
      return;
    }

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
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission required',
        'Please allow photo library access.',
      );
      return;
    }

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

  async function pickGalleryImage() {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission required',
        'Please allow photo library access.',
      );
      return;
    }

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
      setGalleryUploading(true);

      const url = await uploadImage(
        result.assets[0].uri,
        'gallery',
      );

      const { error } = await supabase
        .from('gallery')
        .insert({
          title: 'Salem YMA',
          image_url: url,
          category: 'General',
          media_type: 'photo',
        });

      if (error) throw error;

      Alert.alert(
        'Success',
        'Photo added to Gallery.',
      );

      await loadAll();
    } catch (error: any) {
      Alert.alert(
        'Upload failed',
        error?.message ||
          'Unable to add gallery photo.',
      );
    } finally {
      setGalleryUploading(false);
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
    Alert.alert(
      'Delete news?',
      `Delete "${item.title}" permanently?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('news')
                .delete()
                .eq('id', item.id);

              if (error) throw error;

              await loadAll();
            } catch (error: any) {
              Alert.alert(
                'Delete failed',
                error?.message ||
                  'Unable to delete news.',
              );
            }
          },
        },
      ],
    );
  }

  function resetEventForm() {
    setEventTitle('');
    setEventDescription('');
    setEventLocation('');
    setEventBranch('Salem YMA Branch');
    setEventImage('');
    setEventDateValue(null);
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
        'Salem YMA Branch',
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
          'Salem YMA Branch',
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

        Alert.alert(
          'Updated',
          'Event updated successfully.',
        );
      } else {
        const { error } = await supabase
          .from('events')
          .insert({
            ...payload,
            created_at:
              new Date().toISOString(),
          });

        if (error) throw error;

        Alert.alert(
          'Published',
          'Event published successfully.',
        );
      }

      resetEventForm();
      await loadAll();
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
    Alert.alert(
      'Delete event?',
      `Delete "${item.title}" permanently?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', item.id);

              if (error) throw error;

              await loadAll();
            } catch (error: any) {
              Alert.alert(
                'Delete failed',
                error?.message ||
                  'Unable to delete event.',
              );
            }
          },
        },
      ],
    );
  }

  async function deleteGalleryItem(
    item: GalleryItem,
  ) {
    Alert.alert(
      'Delete photo?',
      'This photo will be removed from Gallery.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } =
                await supabase
                  .from('gallery')
                  .delete()
                  .eq('id', item.id);

              if (error) throw error;

              const storagePath =
                getStoragePathFromUrl(
                  item.image_url,
                );

              if (storagePath) {
                await supabase.storage
                  .from('gallery')
                  .remove([storagePath]);
              }

              await loadAll();
            } catch (error: any) {
              Alert.alert(
                'Delete failed',
                error?.message ||
                  'Unable to delete photo.',
              );
            }
          },
        },
      ],
    );
  }

  function resetWasteBillForm() {
    setWasteMemberId('');
    setWasteAccountNo('YMA-0001');
    setWasteBillMonth('');
    setWasteAmount('');
    setWasteDueDate('');
    setWasteStatus('unpaid');
  }

  async function saveWasteBill() {
    if (!wasteMemberId) {
      Alert.alert(
        'Select member',
        'Please select a member first.',
      );
      return;
    }

    if (!wasteBillMonth.trim()) {
      Alert.alert(
        'Missing bill month',
        'Please enter the bill month.',
      );
      return;
    }

    if (!wasteAmount.trim()) {
      Alert.alert(
        'Missing amount',
        'Please enter the bill amount.',
      );
      return;
    }

    const amount = Number(
      wasteAmount.replace(/,/g, ''),
    );

    if (Number.isNaN(amount) || amount < 0) {
      Alert.alert(
        'Invalid amount',
        'Please enter a valid amount.',
      );
      return;
    }

    try {
      setSavingWasteBill(true);

      const { error } = await supabase
        .from('waste_bills')
        .insert({
          user_id: wasteMemberId,
          account_no:
            wasteAccountNo.trim() || null,
          bill_month:
            wasteBillMonth.trim(),
          amount,
          due_date:
            wasteDueDate.trim() || null,
          status: wasteStatus || 'unpaid',
        });

      if (error) throw error;

      Alert.alert(
        'Bill created',
        'Waste collection bill added successfully.',
      );

      resetWasteBillForm();
      await loadAll();
    } catch (error: any) {
      Alert.alert(
        'Save failed',
        error?.message ||
          'Unable to create waste bill.',
      );
    } finally {
      setSavingWasteBill(false);
    }
  }

  async function markWasteBillPaid(
    bill: WasteBill,
  ) {
    Alert.alert(
      'Mark bill as paid?',
      `₹${Number(
        bill.amount || 0,
      ).toFixed(2)} • ${
        bill.bill_month || '-'
      }`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Mark Paid',
          onPress: async () => {
            try {
              const receiptNo =
                `YMA-${Date.now()}`;

              const { error } =
                await supabase
                  .from('waste_bills')
                  .update({
                    status: 'paid',
                    paid_at:
                      new Date().toISOString(),
                    receipt_no: receiptNo,
                    payment_method: 'Admin',
                    updated_at:
                      new Date().toISOString(),
                  })
                  .eq('id', bill.id);

              if (error) throw error;

              Alert.alert(
                'Updated',
                'Bill marked as paid.',
              );

              await loadAll();
            } catch (error: any) {
              Alert.alert(
                'Update failed',
                error?.message ||
                  'Unable to update bill.',
              );
            }
          },
        },
      ],
    );
  }

  async function deleteWasteBill(
    bill: WasteBill,
  ) {
    Alert.alert(
      'Delete bill?',
      `Delete ${
        bill.bill_month || 'this bill'
      } permanently?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } =
                await supabase
                  .from('waste_bills')
                  .delete()
                  .eq('id', bill.id);

              if (error) throw error;

              await loadAll();
            } catch (error: any) {
              Alert.alert(
                'Delete failed',
                error?.message ||
                  'Unable to delete bill.',
              );
            }
          },
        },
      ],
    );
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
    Alert.alert(
      'Delete Zonun?',
      `Delete "${item.title}" permanently?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('zonun')
                .delete()
                .eq('id', item.id);

              if (error) throw error;

              const storagePath =
                getZonunStoragePathFromUrl(
                  item.pdf_url,
                );

              if (storagePath) {
                await supabase.storage
                  .from('zonun')
                  .remove([storagePath]);
              }

              await loadAll();
            } catch (error: any) {
              Alert.alert(
                'Delete failed',
                error?.message ||
                  'Unable to delete Zonun.',
              );
            }
          },
        },
      ],
    );
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
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission required',
        'Please allow photo library access.',
      );
      return;
    }

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

    const order = Number(leaderDisplayOrder);
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
    Alert.alert(
      'Delete branch leader?',
      `Delete ${item.full_name} from Branch Leaders?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('branch_leaders')
                .delete()
                .eq('id', item.id);

              if (error) throw error;

              const storagePath = getStoragePathFromUrl(item.photo_url);
              if (storagePath) {
                await supabase.storage.from('gallery').remove([storagePath]);
              }

              if (editingLeaderId === item.id) {
                resetLeaderForm();
              }

              await loadAll();
            } catch (error: any) {
              Alert.alert(
                'Delete failed',
                error?.message || 'Unable to delete branch leader.',
              );
            }
          },
        },
      ],
    );
  }

  function resetCemeteryForm() {
    setCemeteryDeceasedName('');
    setCemeteryDateOfBirth('');
    setCemeteryDateOfDeath('');
    setCemeteryBurialDate('');
    setCemeteryName('Salem Cemetery');
    setCemeterySection('');
    setCemeteryRowName('');
    setCemeteryGraveNumber('');
    setCemeteryFamilyName('');
    setCemeteryFamilyContactName('');
    setCemeteryFamilyContactPhone('');
    setCemeteryBiography('');
    setCemeteryGravePhoto('');
    setCemeteryDocumentUrl('');
    setCemeteryLatitude('');
    setCemeteryLongitude('');
    setCemeteryNotes('');
    setCemeteryPublished(true);
    setEditingCemeteryId(null);
  }

  function editCemeteryRecord(item: CemeteryRecord) {
    setEditingCemeteryId(item.id);
    setCemeteryDeceasedName(item.deceased_name || '');
    setCemeteryDateOfBirth(item.date_of_birth || '');
    setCemeteryDateOfDeath(item.date_of_death || '');
    setCemeteryBurialDate(item.burial_date || '');
    setCemeteryName(item.cemetery_name || 'Salem Cemetery');
    setCemeterySection(item.section || '');
    setCemeteryRowName(item.row_name || '');
    setCemeteryGraveNumber(item.grave_number || '');
    setCemeteryFamilyName(item.family_name || '');
    setCemeteryFamilyContactName(item.family_contact_name || '');
    setCemeteryFamilyContactPhone(item.family_contact_phone || '');
    setCemeteryBiography(item.biography || '');
    setCemeteryGravePhoto(item.grave_photo_url || '');
    setCemeteryDocumentUrl(item.document_url || '');
    setCemeteryLatitude(
      item.latitude === null || item.latitude === undefined
        ? ''
        : String(item.latitude),
    );
    setCemeteryLongitude(
      item.longitude === null || item.longitude === undefined
        ? ''
        : String(item.longitude),
    );
    setCemeteryNotes(item.notes || '');
    setCemeteryPublished(item.is_published !== false);
    setSection('cemetery');
  }

  async function saveCemeteryRecord() {
    if (!cemeteryDeceasedName.trim()) {
      Alert.alert(
        'Missing name',
        'Please enter the deceased person name.',
      );
      return;
    }

    const latitude = cemeteryLatitude.trim()
      ? Number(cemeteryLatitude.trim())
      : null;
    const longitude = cemeteryLongitude.trim()
      ? Number(cemeteryLongitude.trim())
      : null;

    if (
      latitude !== null &&
      !Number.isFinite(latitude)
    ) {
      Alert.alert('Invalid latitude', 'Please enter a valid latitude.');
      return;
    }

    if (
      longitude !== null &&
      !Number.isFinite(longitude)
    ) {
      Alert.alert('Invalid longitude', 'Please enter a valid longitude.');
      return;
    }

    try {
      setSavingCemetery(true);

      const payload = {
        deceased_name: cemeteryDeceasedName.trim(),
        date_of_birth: cemeteryDateOfBirth.trim() || null,
        date_of_death: cemeteryDateOfDeath.trim() || null,
        burial_date: cemeteryBurialDate.trim() || null,
        cemetery_name: cemeteryName.trim() || 'Salem Cemetery',
        section: cemeterySection.trim() || null,
        row_name: cemeteryRowName.trim() || null,
        grave_number: cemeteryGraveNumber.trim() || null,
        family_name: cemeteryFamilyName.trim() || null,
        family_contact_name: cemeteryFamilyContactName.trim() || null,
        family_contact_phone: cemeteryFamilyContactPhone.trim() || null,
        biography: cemeteryBiography.trim() || null,
        grave_photo_url: cemeteryGravePhoto.trim() || null,
        document_url: cemeteryDocumentUrl.trim() || null,
        latitude,
        longitude,
        notes: cemeteryNotes.trim() || null,
        is_published: cemeteryPublished,
        updated_at: new Date().toISOString(),
      };

      if (editingCemeteryId) {
        const { error } = await supabase
          .from('cemetery_records')
          .update(payload)
          .eq('id', editingCemeteryId);

        if (error) throw error;

        Alert.alert(
          'Updated',
          'Cemetery record updated successfully.',
        );
      } else {
        const { error } = await supabase
          .from('cemetery_records')
          .insert(payload);

        if (error) throw error;

        Alert.alert(
          'Added',
          'Cemetery record added successfully.',
        );
      }

      resetCemeteryForm();
      await loadAll();
    } catch (error: any) {
      Alert.alert(
        'Save failed',
        error?.message || 'Unable to save cemetery record.',
      );
    } finally {
      setSavingCemetery(false);
    }
  }

  async function toggleCemeteryRecord(item: CemeteryRecord) {
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
        error?.message || 'Unable to change cemetery record visibility.',
      );
    }
  }

  async function deleteCemeteryRecord(item: CemeteryRecord) {
    Alert.alert(
      'Delete cemetery record?',
      `Delete the record for "${item.deceased_name}" permanently?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('cemetery_records')
                .delete()
                .eq('id', item.id);

              if (error) throw error;

              if (editingCemeteryId === item.id) {
                resetCemeteryForm();
              }

              await loadAll();
            } catch (error: any) {
              Alert.alert(
                'Delete failed',
                error?.message || 'Unable to delete cemetery record.',
              );
            }
          },
        },
      ],
    );
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
      Alert.alert(
        'No bookings',
        'There are no gas bookings to print.',
      );
      return;
    }

    try {
      const rows = gasBookings
        .map(
          (booking, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${escapeHtml(
                booking.full_name,
              )}</td>
              <td>${escapeHtml(
                booking.phone,
              )}</td>
              <td>${escapeHtml(
                booking.address,
              )}</td>
              <td>${booking.cylinder_quantity}</td>
              <td>${escapeHtml(
                (
                  booking.status ||
                  'pending'
                ).toUpperCase(),
              )}</td>
              <td>${escapeHtml(
                formatDate(
                  booking.created_at,
                ),
              )}</td>
            </tr>
          `,
        )
        .join('');

      const html = `
        <html>
          <head>
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0"
            />

            <style>
              @page {
                size: A4 landscape;
                margin: 18px;
              }

              body {
                font-family: Arial, sans-serif;
                padding: 10px;
                color: #111111;
              }

              h1 {
                color: #C62828;
                margin: 0;
                font-size: 24px;
              }

              h2 {
                margin: 3px 0 0;
                font-size: 16px;
                color: #222222;
              }

              .subtitle {
                color: #666666;
                margin-top: 6px;
                margin-bottom: 18px;
                font-size: 11px;
              }

              table {
                width: 100%;
                border-collapse: collapse;
                font-size: 10px;
              }

              th,
              td {
                border: 1px solid #cccccc;
                padding: 7px;
                text-align: left;
                vertical-align: top;
              }

              th {
                background: #C62828;
                color: #ffffff;
                font-weight: bold;
              }

              tr:nth-child(even) {
                background: #f7f7f7;
              }

              .footer {
                margin-top: 18px;
                font-size: 9px;
                color: #777777;
                border-top: 1px solid #dddddd;
                padding-top: 8px;
              }
            </style>
          </head>

          <body>
            <h1>SALEM YMA</h1>

            <h2>
              Gas Booking Register
            </h2>

            <div class="subtitle">
              Generated:
              ${escapeHtml(
                formatDate(
                  new Date().toISOString(),
                ),
              )}
              &nbsp; • &nbsp;
              Total Bookings:
              ${gasBookings.length}
            </div>

            <table>
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Cylinders</th>
                  <th>Status</th>
                  <th>Booked On</th>
                </tr>
              </thead>

              <tbody>
                ${rows}
              </tbody>
            </table>

            <div class="footer">
              SALEM YMA BRANCH
              • GAS BOOKING REGISTER
            </div>
          </body>
        </html>
      `;

      await Print.printAsync({
        html,
      });
    } catch (error: any) {
      Alert.alert(
        'Print failed',
        error?.message ||
          'Unable to open the print preview.',
      );
    }
  }

  function resetCemeteryForm() {
    setCemeteryDeceasedName('');
    setCemeteryDateOfBirth('');
    setCemeteryDateOfDeath('');
    setCemeteryBurialDate('');
    setCemeteryName('Salem Cemetery');
    setCemeterySection('');
    setCemeteryRowName('');
    setCemeteryGraveNumber('');
    setCemeteryFamilyName('');
    setCemeteryFamilyContactName('');
    setCemeteryFamilyContactPhone('');
    setCemeteryBiography('');
    setCemeteryGravePhoto('');
    setCemeteryDocumentUrl('');
    setCemeteryLatitude('');
    setCemeteryLongitude('');
    setCemeteryNotes('');
    setCemeteryPublished(true);
    setEditingCemeteryId(null);
  }

  function editCemetery(item: CemeteryRecord) {
    setEditingCemeteryId(item.id);
    setCemeteryDeceasedName(item.deceased_name || '');
    setCemeteryDateOfBirth(item.date_of_birth || '');
    setCemeteryDateOfDeath(item.date_of_death || '');
    setCemeteryBurialDate(item.burial_date || '');
    setCemeteryName(item.cemetery_name || 'Salem Cemetery');
    setCemeterySection(item.section || '');
    setCemeteryRowName(item.row_name || '');
    setCemeteryGraveNumber(item.grave_number || '');
    setCemeteryFamilyName(item.family_name || '');
    setCemeteryFamilyContactName(item.family_contact_name || '');
    setCemeteryFamilyContactPhone(item.family_contact_phone || '');
    setCemeteryBiography(item.biography || '');
    setCemeteryGravePhoto(item.grave_photo_url || '');
    setCemeteryDocumentUrl(item.document_url || '');
    setCemeteryLatitude(
      item.latitude == null ? '' : String(item.latitude),
    );
    setCemeteryLongitude(
      item.longitude == null ? '' : String(item.longitude),
    );
    setCemeteryNotes(item.notes || '');
    setCemeteryPublished(item.is_published !== false);
    setSection('cemetery');
  }

  async function pickCemeteryPhoto() {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission required',
        'Please allow photo library access.',
      );
      return;
    }

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

  async function pickCemeteryDocument() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.[0]?.uri) return;

      setCemeteryDocumentUploading(true);
      const url = await uploadCemeteryDocument(
        result.assets[0].uri,
      );
      setCemeteryDocumentUrl(url);

      Alert.alert(
        'Document uploaded',
        'The old cemetery record PDF is ready.',
      );
    } catch (error: any) {
      Alert.alert(
        'Document upload failed',
        error?.message || 'Unable to upload document.',
      );
    } finally {
      setCemeteryDocumentUploading(false);
    }
  }

  async function saveCemetery() {
    if (!cemeteryDeceasedName.trim()) {
      Alert.alert(
        'Missing name',
        'Please enter the deceased person\'s name.',
      );
      return;
    }

    try {
      setSavingCemetery(true);

      const payload = {
        deceased_name: cemeteryDeceasedName.trim(),
        date_of_birth: cemeteryDateOfBirth.trim() || null,
        date_of_death: cemeteryDateOfDeath.trim() || null,
        burial_date: cemeteryBurialDate.trim() || null,
        cemetery_name: cemeteryName.trim() || 'Salem Cemetery',
        section: cemeterySection.trim() || null,
        row_name: cemeteryRowName.trim() || null,
        grave_number: cemeteryGraveNumber.trim() || null,
        family_name: cemeteryFamilyName.trim() || null,
        family_contact_name:
          cemeteryFamilyContactName.trim() || null,
        family_contact_phone:
          cemeteryFamilyContactPhone.trim() || null,
        biography: cemeteryBiography.trim() || null,
        grave_photo_url: cemeteryGravePhoto.trim() || null,
        document_url: cemeteryDocumentUrl.trim() || null,
        latitude: cemeteryLatitude.trim()
          ? Number(cemeteryLatitude.trim())
          : null,
        longitude: cemeteryLongitude.trim()
          ? Number(cemeteryLongitude.trim())
          : null,
        notes: cemeteryNotes.trim() || null,
        is_published: cemeteryPublished,
        updated_at: new Date().toISOString(),
      };

      if (
        (payload.latitude !== null &&
          Number.isNaN(payload.latitude)) ||
        (payload.longitude !== null &&
          Number.isNaN(payload.longitude))
      ) {
        Alert.alert(
          'Invalid location',
          'Latitude and longitude must be valid numbers.',
        );
        return;
      }

      if (editingCemeteryId) {
        const { error } = await supabase
          .from('cemetery_records')
          .update(payload)
          .eq('id', editingCemeteryId);

        if (error) throw error;

        Alert.alert('Updated', 'Cemetery record updated successfully.');
      } else {
        const { error } = await supabase
          .from('cemetery_records')
          .insert(payload);

        if (error) throw error;

        Alert.alert('Saved', 'Cemetery record added successfully.');
      }

      resetCemeteryForm();
      await loadAll();
    } catch (error: any) {
      Alert.alert(
        'Save failed',
        error?.message || 'Unable to save cemetery record.',
      );
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
    Alert.alert(
      'Delete Cemetery Record?',
      `Delete "${item.deceased_name}" permanently?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('cemetery_records')
                .delete()
                .eq('id', item.id);

              if (error) throw error;

              const photoPath = getStoragePathFromUrl(
                item.grave_photo_url,
              );
              const documentPath = getStoragePathFromUrl(
                item.document_url,
              );

              const paths = [photoPath, documentPath].filter(
                (path): path is string => !!path,
              );

              if (paths.length) {
                await supabase.storage
                  .from('gallery')
                  .remove(paths);
              }

              if (editingCemeteryId === item.id) {
                resetCemeteryForm();
              }

              await loadAll();
            } catch (error: any) {
              Alert.alert(
                'Delete failed',
                error?.message || 'Unable to delete cemetery record.',
              );
            }
          },
        },
      ],
    );
  }

  const filteredCemeteryRecords = useMemo(() => {
    const query = cemeterySearch.trim().toLowerCase();
    if (!query) return cemeteryRecords;

    return cemeteryRecords.filter((item) =>
      [
        item.deceased_name,
        item.family_name,
        item.cemetery_name,
        item.section,
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
          .includes(query)
      );
    });
  }, [members, memberSearch]);

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
            SALEM YMA
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
          <View>
            <Text style={styles.headerEyebrow}>
              SALEM YMA
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

          <Pressable
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <Text style={styles.closeButtonText}>
              ×
            </Text>
          </Pressable>
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
              ['events', 'Events'],
              ['gallery', 'Gallery'],
              ['waste', 'Waste Bills'],
              ['zonun', 'Zonun'],
              ['leaders', 'Branch Leaders'],
              ['cemetery', 'Thlanmual'],
              ['admins', 'Admin Requests'],
              ['profile', 'My Profile'],
            ].map(([key, label]) => (
              <Pressable
                key={key}
                onPress={() => {
                  setSection(
                    key as
                      | 'dashboard'
                      | 'members'
                      | 'news'
                      | 'events'
                      | 'gallery'
                      | 'waste'
                      | 'zonun'
                      | 'leaders'
                      | 'cemetery'
                      | 'gas'
                      | 'admins'
                      | 'profile',
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
            <Text style={styles.cemeteryOnlyIcon}>🪦</Text>
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

        {section === 'dashboard' && (
          <>
            <View style={styles.welcomeCard}>
              <View>
                <Text style={styles.cardEyebrow}>
                  CONTROL CENTRE
                </Text>

                <Text style={styles.welcomeTitle}>
                  Salem YMA
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
                  <Text style={styles.cemeteryStatIconText}>🪦</Text>
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
                          | 'events'
                          | 'gallery'
                          | 'waste'
                          | 'zonun'
                          | 'leaders'
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
                onPress={loadAdminRequests}
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
                  Create and publish Salem YMA
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
                  Create and manage Salem YMA
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

              <View
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
              </View>

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

              {showEventDatePicker && (
                <DateTimePicker
                  value={
                    eventDateValue ||
                    new Date()
                  }
                  mode="date"
                  display="default"
                  onChange={(
                    event,
                    selectedDate,
                  ) => {
                    if (
                      event.type ===
                      'dismissed'
                    ) {
                      setShowEventDatePicker(
                        false,
                      );
                      return;
                    }

                    handleEventDateChange(
                      selectedDate,
                    );
                  }}
                />
              )}

              {showEventTimePicker && (
                <DateTimePicker
                  value={
                    eventDateValue ||
                    new Date()
                  }
                  mode="time"
                  display="default"
                  onChange={(
                    event,
                    selectedTime,
                  ) => {
                    if (
                      event.type ===
                      'dismissed'
                    ) {
                      setShowEventTimePicker(
                        false,
                      );
                      return;
                    }

                    handleEventTimeChange(
                      selectedTime,
                    );
                  }}
                />
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
                placeholder="Salem YMA Branch"
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
                  Create your first Salem YMA event above.
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
                  Add and remove Salem YMA photos.
                </Text>
              </View>
            </View>

            <Pressable
              onPress={pickGalleryImage}
              style={styles.galleryUploadButton}
              disabled={galleryUploading}
            >
              {galleryUploading ? (
                <ActivityIndicator color={WHITE} />
              ) : (
                <>
                  <Text style={styles.uploadPlus}>
                    +
                  </Text>

                  <View>
                    <Text style={styles.uploadTitle}>
                      Add Gallery Photo
                    </Text>

                    <Text style={styles.uploadSubtitle}>
                      Choose a photo from your device
                    </Text>
                  </View>
                </>
              )}
            </Pressable>

            <View style={styles.galleryGrid}>
              {gallery.map((item) => (
                <View
                  key={item.id}
                  style={styles.galleryCard}
                >
                  <Image
                    source={{
                      uri: item.image_url,
                    }}
                    style={styles.galleryImage}
                  />

                  <Pressable
                    onPress={() =>
                      deleteGalleryItem(item)
                    }
                    style={styles.galleryDelete}
                  >
                    <Text style={styles.galleryDeleteText}>
                      ×
                    </Text>
                  </Pressable>

                  <View style={styles.galleryCaption}>
                    <Text
                      style={styles.galleryCaptionText}
                      numberOfLines={1}
                    >
                      {item.title || 'Salem YMA'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {gallery.length === 0 && (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>
                  Gallery is empty
                </Text>

                <Text style={styles.emptyText}>
                  Upload your first photo above.
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
              <Text style={styles.formTitle}>
                Create Waste Bill
              </Text>

              <Text style={styles.label}>
                Member
              </Text>

              <View style={styles.memberSelectBox}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={
                    styles.memberSelectScroll
                  }
                >
                  {members.map((member) => (
                    <Pressable
                      key={member.id}
                      onPress={() => {
                        if (member.user_id) {
                          setWasteMemberId(
                            member.user_id,
                          );
                        } else {
                          Alert.alert(
                            'Missing User ID',
                            `${member.full_name} does not have a user ID yet.`,
                          );
                        }
                      }}
                      style={[
                        styles.memberSelectChip,
                        wasteMemberId ===
                          member.user_id &&
                          styles.memberSelectChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.memberSelectName,
                          wasteMemberId ===
                            member.user_id &&
                            styles.memberSelectNameActive,
                        ]}
                        numberOfLines={1}
                      >
                        {member.full_name}
                      </Text>

                      <Text
                        style={[
                          styles.memberSelectEmail,
                          wasteMemberId ===
                            member.user_id &&
                            styles.memberSelectEmailActive,
                        ]}
                        numberOfLines={1}
                      >
                        {member.email || 'No email'}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {wasteMemberId ? (
                <View style={styles.selectedMemberCard}>
                  <Text style={styles.selectedMemberLabel}>
                    SELECTED MEMBER
                  </Text>

                  <Text style={styles.selectedMemberText}>
                    {members.find(
                      (member) =>
                        member.user_id ===
                        wasteMemberId,
                    )?.full_name ||
                      'Selected member'}
                  </Text>
                </View>
              ) : null}

              <Text style={styles.label}>
                Account Number
              </Text>

              <TextInput
                value={wasteAccountNo}
                onChangeText={setWasteAccountNo}
                placeholder="YMA-0001"
                placeholderTextColor="#999999"
                style={styles.input}
              />

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
                    CREATE WASTE BILL
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
                        {bill.account_no ||
                          'No account number'}
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
                          MARK PAID
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
                  Upload and manage Salem YMA newsletter issues.
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
                  Manage Salem YMA Branch hruaitu te
                </Text>
              </View>
              <View style={styles.leaderCountBadge}>
                <Text style={styles.leaderCountText}>
                  {branchLeaders.length}
                </Text>
              </View>
            </View>

            <View style={styles.formCard}>
              <View style={styles.zonunFormHeader}>
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
                    onPress={() => setLeaderPosition(position)}
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
                  Add the first Salem YMA Branch leader above.
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
                <Text style={styles.cemeteryAdminSummaryIconText}>🪦</Text>
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

              <Text style={styles.label}>Date of Birth</Text>
              <TextInput
                value={cemeteryDateOfBirth}
                onChangeText={setCemeteryDateOfBirth}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999999"
                style={styles.input}
              />

              <Text style={styles.label}>Date of Death</Text>
              <TextInput
                value={cemeteryDateOfDeath}
                onChangeText={setCemeteryDateOfDeath}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999999"
                style={styles.input}
              />

              <Text style={styles.label}>Burial Date</Text>
              <TextInput
                value={cemeteryBurialDate}
                onChangeText={setCemeteryBurialDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999999"
                style={styles.input}
              />

              <Text style={styles.label}>Cemetery</Text>
              <TextInput
                value={cemeteryName}
                onChangeText={setCemeteryName}
                placeholder="Salem Cemetery"
                placeholderTextColor="#999999"
                style={styles.input}
              />

              <View style={styles.twoColumnRow}>
                <View style={styles.twoColumnItem}>
                  <Text style={styles.label}>Section</Text>
                  <TextInput
                    value={cemeterySection}
                    onChangeText={setCemeterySection}
                    placeholder="A"
                    placeholderTextColor="#999999"
                    style={styles.input}
                  />
                </View>
                <View style={styles.twoColumnItem}>
                  <Text style={styles.label}>Row</Text>
                  <TextInput
                    value={cemeteryRowName}
                    onChangeText={setCemeteryRowName}
                    placeholder="1"
                    placeholderTextColor="#999999"
                    style={styles.input}
                  />
                </View>
              </View>

              <Text style={styles.label}>Grave Number</Text>
              <TextInput
                value={cemeteryGraveNumber}
                onChangeText={setCemeteryGraveNumber}
                placeholder="A-01"
                placeholderTextColor="#999999"
                style={styles.input}
              />

              <Text style={styles.label}>Family Name</Text>
              <TextInput
                value={cemeteryFamilyName}
                onChangeText={setCemeteryFamilyName}
                placeholder="Family / clan name"
                placeholderTextColor="#999999"
                style={styles.input}
              />

              <Text style={styles.label}>Family Contact Name</Text>
              <TextInput
                value={cemeteryFamilyContactName}
                onChangeText={setCemeteryFamilyContactName}
                placeholder="Optional internal contact"
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
                <Image
                  source={{ uri: cemeteryGravePhoto }}
                  style={styles.cemeteryFormImage}
                />
              ) : null}

              <Pressable
                onPress={pickCemeteryDocument}
                style={styles.outlineButton}
                disabled={cemeteryDocumentUploading || savingCemetery}
              >
                <Text style={styles.outlineButtonText}>
                  {cemeteryDocumentUploading
                    ? 'UPLOADING DOCUMENT...'
                    : cemeteryDocumentUrl
                      ? 'CHANGE OLD RECORD PDF'
                      : 'ADD OLD RECORD PDF'}
                </Text>
              </Pressable>

              {cemeteryDocumentUrl ? (
                <View style={styles.zonunPdfReady}>
                  <Text style={styles.zonunPdfReadyIcon}>📄</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.zonunPdfReadyTitle}>
                      Old record PDF ready
                    </Text>
                    <Text style={styles.zonunPdfReadyText}>
                      This document can be opened from the public record.
                    </Text>
                  </View>
                </View>
              ) : null}

              <View style={styles.twoColumnRow}>
                <View style={styles.twoColumnItem}>
                  <Text style={styles.label}>Latitude</Text>
                  <TextInput
                    value={cemeteryLatitude}
                    onChangeText={setCemeteryLatitude}
                    placeholder="23.7271"
                    placeholderTextColor="#999999"
                    style={styles.input}
                    keyboardType="numbers-and-punctuation"
                  />
                </View>
                <View style={styles.twoColumnItem}>
                  <Text style={styles.label}>Longitude</Text>
                  <TextInput
                    value={cemeteryLongitude}
                    onChangeText={setCemeteryLongitude}
                    placeholder="92.7176"
                    placeholderTextColor="#999999"
                    style={styles.input}
                    keyboardType="numbers-and-punctuation"
                  />
                </View>
              </View>

              <Text style={styles.label}>Admin Notes</Text>
              <TextInput
                value={cemeteryNotes}
                onChangeText={setCemeteryNotes}
                placeholder="Private/internal notes"
                placeholderTextColor="#999999"
                style={[styles.input, styles.textAreaSmall]}
                multiline
                textAlignVertical="top"
              />

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
              placeholder="Search name, family, grave, section..."
              placeholderTextColor="#999999"
              style={styles.input}
            />

            <View style={styles.cemeteryArchiveHeader}>
              <View>
                <Text style={styles.sectionTitle}>Cemetery Register</Text>
                <Text style={styles.sectionDescription}>
                  Family contacts and admin notes are kept in the admin record.
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
                        <Text style={styles.cemeteryThumbIcon}>🪦</Text>
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
                        {item.section ? ` • Section ${item.section}` : ''}
                        {item.row_name ? ` • Row ${item.row_name}` : ''}
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
                onPress={loadGasBookings}
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

                    <View
                      style={
                        styles.wasteBillDetails
                      }
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={
                            styles.wasteDetailLabel
                          }
                        >
                          ADDRESS
                        </Text>

                        <Text
                          style={
                            styles.wasteDetailValueSmall
                          }
                        >
                          {booking.address}
                        </Text>
                      </View>

                      <View
                        style={{
                          marginLeft: 15,
                        }}
                      >
                        <Text
                          style={
                            styles.wasteDetailLabel
                          }
                        >
                          BOOKED
                        </Text>

                        <Text
                          style={
                            styles.wasteDetailValueSmall
                          }
                        >
                          {formatDate(
                            booking.created_at,
                          )}
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
    fontSize: 25,
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
    fontSize: 20,
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
    fontSize: 25,
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
    fontSize: 24,
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