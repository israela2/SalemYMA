import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { supabase } from '../lib/supabase';

import AppBackButton from '../components/AppBackButton';
type GasBooking = {
  id: number;
  full_name: string;
  phone: string;
  address: string;
  cylinder_quantity: number;
  status: string;
  created_at: string;
};

export default function GasBookingScreen() {
  const [booking, setBooking] = useState<GasBooking | null>(null);
  const [checkingBooking, setCheckingBooking] = useState(true);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadBooking();
    }, []),
  );

  async function loadBooking() {
    setCheckingBooking(true);

    try {
      const { data: visibility } = await supabase.from('app_feature_visibility').select('is_visible').eq('feature_key', 'gas_booking').maybeSingle();
      if (!visibility?.is_visible) {
        router.replace('/');
        setCheckingBooking(false);
        return;
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      /*
       * Only pending / confirmed bookings are considered active.
       *
       * If the previous booking is completed or cancelled,
       * the member can create a new booking.
       */
      const { data, error } = await supabase
        .from('gas_bookings')
        .select(
          'id, full_name, phone, address, cylinder_quantity, status, created_at',
        )
        .eq('user_id', user.id)
        .in('status', ['pending', 'confirmed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      setBooking(data);
    } catch (error: any) {
      Alert.alert(
        'Unable to load booking',
        error?.message || 'Something went wrong.',
      );
    } finally {
      setCheckingBooking(false);
    }
  }

  async function submitBooking() {
    if (!fullName.trim()) {
      Alert.alert(
        'Missing information',
        'Please enter your name.',
      );
      return;
    }

    if (!phone.trim()) {
      Alert.alert(
        'Missing information',
        'Please enter your phone number.',
      );
      return;
    }

    if (!address.trim()) {
      Alert.alert(
        'Missing information',
        'Please enter your delivery address.',
      );
      return;
    }

    const cylinderQuantity = Number(quantity);

    if (
      !Number.isInteger(cylinderQuantity) ||
      cylinderQuantity < 1 ||
      cylinderQuantity > 10
    ) {
      Alert.alert(
        'Invalid quantity',
        'Please enter a cylinder quantity between 1 and 10.',
      );
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert(
          'Login required',
          'Please login to book a gas cylinder.',
        );

        router.replace('/login');
        return;
      }

      /*
       * Double-check active booking before inserting.
       * This prevents duplicate bookings if the page was already open.
       */
      const {
        data: existingBooking,
        error: existingBookingError,
      } = await supabase
        .from('gas_bookings')
        .select(
          'id, full_name, phone, address, cylinder_quantity, status, created_at',
        )
        .eq('user_id', user.id)
        .in('status', ['pending', 'confirmed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingBookingError) {
        throw existingBookingError;
      }

      if (existingBooking) {
        setBooking(existingBooking);

        Alert.alert(
          'Booking already exists',
          'You already have an active gas booking. You cannot submit another booking right now.',
        );

        return;
      }

      const { data, error } = await supabase
        .from('gas_bookings')
        .insert({
          user_id: user.id,
          full_name: fullName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          cylinder_quantity: cylinderQuantity,
          status: 'pending',
        })
        .select(
          'id, full_name, phone, address, cylinder_quantity, status, created_at',
        )
        .single();

      if (error) {
        throw error;
      }

      setBooking(data);

      setFullName('');
      setPhone('');
      setAddress('');
      setQuantity('1');

      Alert.alert(
        'Booking submitted',
        'Your gas booking request has been submitted successfully.',
      );
    } catch (error: any) {
      Alert.alert(
        'Booking failed',
        error?.message ||
          'Something went wrong. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);

    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  }

  function getStatusLabel(status: string) {
    const value = status.toLowerCase();

    if (value === 'pending') {
      return 'Pending';
    }

    if (value === 'confirmed') {
      return 'Confirmed';
    }

    if (value === 'completed') {
      return 'Completed';
    }

    if (value === 'cancelled') {
      return 'Cancelled';
    }

    return status;
  }

  function getStatusColor(status: string) {
    const value = status.toLowerCase();

    if (value === 'confirmed') {
      return '#2E7D32';
    }

    if (value === 'completed') {
      return '#1565C0';
    }

    if (value === 'cancelled') {
      return '#C62828';
    }

    return '#EF6C00';
  }

  function getStatusBackground(status: string) {
    const value = status.toLowerCase();

    if (value === 'confirmed') {
      return '#E8F5E9';
    }

    if (value === 'completed') {
      return '#E3F2FD';
    }

    if (value === 'cancelled') {
      return '#FFEBEE';
    }

    return '#FFF3E0';
  }

  if (checkingBooking) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator
          size="large"
          color="#C62828"
        />

        <Text style={styles.loadingTitle}>
          Gas Booking
        </Text>

        <Text style={styles.loadingText}>
          Checking your booking...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <LinearGradient
        colors={['#C62828', '#8E1B1B', '#111111']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <AppBackButton />

          <View style={styles.headerText}>
            <Text style={styles.smallTitle}>
              YMA Salem Branch
            </Text>

            <Text style={styles.title}>
              Gas Booking
            </Text>

            <Text style={styles.subtitle}>
              {booking
                ? 'Your booking details'
                : 'Book your LPG cylinder easily'}
            </Text>
          </View>

          <View style={styles.fireCircle}>
            <Text style={styles.fireIcon}>
              🔥
            </Text>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {booking ? (
            <>
              {/* BOOKING SUBMITTED */}
              <View style={styles.successCard}>
                <View style={styles.successIcon}>
                  <Text style={styles.successIconText}>
                    ✓
                  </Text>
                </View>

                <View style={styles.successText}>
                  <Text style={styles.successTitle}>
                    Gas Booking Submitted
                  </Text>

                  <Text style={styles.successSubtitle}>
                    Your booking request has been received by YMA Salem Branch.
                  </Text>
                </View>
              </View>

              {/* BOOKING DETAILS */}
              <View style={styles.detailsCard}>
                <View style={styles.detailsHeader}>
                  <Text style={styles.sectionTitle}>
                    Booking Details
                  </Text>

                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          getStatusBackground(
                            booking.status,
                          ),
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.statusBadgeDot,
                        {
                          backgroundColor:
                            getStatusColor(
                              booking.status,
                            ),
                        },
                      ]}
                    />

                    <Text style={styles.statusBadgeText}>
                      {getStatusLabel(
                        booking.status,
                      )}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    Name
                  </Text>

                  <Text style={styles.detailValue}>
                    {booking.full_name}
                  </Text>
                </View>

                <View style={styles.detailDivider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    Phone Number
                  </Text>

                  <Text style={styles.detailValue}>
                    {booking.phone}
                  </Text>
                </View>

                <View style={styles.detailDivider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    Address
                  </Text>

                  <Text style={styles.detailValue}>
                    {booking.address}
                  </Text>
                </View>

                <View style={styles.detailDivider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    Cylinder Quantity
                  </Text>

                  <Text style={styles.detailValue}>
                    {booking.cylinder_quantity}
                    {booking.cylinder_quantity === 1
                      ? ' Cylinder'
                      : ' Cylinders'}
                  </Text>
                </View>

                <View style={styles.detailDivider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    Booking Date
                  </Text>

                  <Text style={styles.detailValue}>
                    {formatDate(
                      booking.created_at,
                    )}
                  </Text>
                </View>
              </View>

              <View style={styles.waitCard}>
                <Text style={styles.waitTitle}>
                  Booking Already Submitted
                </Text>

                <Text style={styles.waitText}>
                  You cannot submit another gas booking while this booking is active. Please wait for YMA Salem Branch administration to process your request.
                </Text>
              </View>
            </>
          ) : (
            <>
              {/* NEW BOOKING */}
              <View style={styles.introCard}>
                <View style={styles.introIcon}>
                  <Text style={styles.introFire}>
                    🔥
                  </Text>
                </View>

                <View style={styles.introText}>
                  <Text style={styles.introTitle}>
                    LPG Cylinder Booking
                  </Text>

                  <Text style={styles.introSubtitle}>
                    Fill in your details and submit your booking request.
                  </Text>
                </View>
              </View>

              <View style={styles.formCard}>
                <Text style={styles.sectionTitle}>
                  Booking Details
                </Text>

                <Text style={styles.label}>
                  Name
                </Text>

                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your full name"
                  placeholderTextColor="#999999"
                  style={styles.input}
                  autoCapitalize="words"
                />

                <Text style={styles.label}>
                  Phone Number
                </Text>

                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#999999"
                  style={styles.input}
                  keyboardType="phone-pad"
                />

                <Text style={styles.label}>
                  Address
                </Text>

                <TextInput
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Enter your delivery address"
                  placeholderTextColor="#999999"
                  style={[
                    styles.input,
                    styles.addressInput,
                  ]}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />

                <Text style={styles.label}>
                  Cylinder Quantity
                </Text>

                <View style={styles.quantityRow}>
                  <Pressable
                    onPress={() => {
                      const current =
                        Number(quantity) || 1;

                      setQuantity(
                        String(
                          Math.max(
                            1,
                            current - 1,
                          ),
                        ),
                      );
                    }}
                    style={styles.quantityButton}
                  >
                    <Text style={styles.quantityButtonText}>
                      −
                    </Text>
                  </Pressable>

                  <TextInput
                    value={quantity}
                    onChangeText={(text) => {
                      const cleaned =
                        text.replace(
                          /[^0-9]/g,
                          '',
                        );

                      setQuantity(cleaned);
                    }}
                    keyboardType="number-pad"
                    style={styles.quantityInput}
                    textAlign="center"
                    maxLength={2}
                  />

                  <Pressable
                    onPress={() => {
                      const current =
                        Number(quantity) || 1;

                      setQuantity(
                        String(
                          Math.min(
                            10,
                            current + 1,
                          ),
                        ),
                      );
                    }}
                    style={styles.quantityButton}
                  >
                    <Text style={styles.quantityButtonText}>
                      +
                    </Text>
                  </Pressable>
                </View>

                <Text style={styles.quantityHint}>
                  Maximum 10 cylinders per booking.
                </Text>

                <Pressable
                  onPress={submitBooking}
                  disabled={saving}
                  style={({ pressed }) => [
                    styles.bookButton,
                    pressed &&
                      !saving &&
                      styles.pressed,
                    saving && styles.disabled,
                  ]}
                >
                  <LinearGradient
                    colors={[
                      '#C62828',
                      '#8E1B1B',
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.bookGradient}
                  >
                    {saving ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={styles.bookIcon}>
                          🔥
                        </Text>

                        <Text style={styles.bookText}>
                          BOOK GAS
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </Pressable>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>
                  Booking Information
                </Text>

                <Text style={styles.infoText}>
                  Your booking request will be sent to the YMA Salem Branch administration for processing.
                </Text>

                <View style={styles.statusRow}>
                  <View style={styles.statusDot} />

                  <Text style={styles.statusText}>
                    One active booking per member
                  </Text>
                </View>
              </View>
            </>
          )}

          <Text style={styles.footer}>
            YMA Salem Branch
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  flex: {
    flex: 1,
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingTitle: {
    color: '#111111',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 14,
  },

  loadingText: {
    color: '#777777',
    fontSize: 12,
    marginTop: 5,
  },

  header: {
    paddingTop: 56,
    paddingBottom: 24,
    paddingHorizontal: 18,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  backIcon: {
    color: '#FFFFFF',
    fontSize: 36,
    lineHeight: 38,
    fontWeight: '300',
    marginTop: -3,
  },

  headerText: {
    flex: 1,
  },

  smallTitle: {
    color: '#FFD9D9',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '900',
    marginTop: 2,
  },

  subtitle: {
    color: '#F5D5D5',
    fontSize: 12,
    marginTop: 4,
  },

  fireCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  fireIcon: {
    fontSize: 25,
  },

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  successCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },

  successIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  successIconText: {
    color: '#2E7D32',
    fontSize: 27,
    fontWeight: '900',
  },

  successText: {
    flex: 1,
  },

  successTitle: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '900',
  },

  successSubtitle: {
    color: '#777777',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },

  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E7E7E7',
  },

  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },

  sectionTitle: {
    color: '#111111',
    fontSize: 18,
    fontWeight: '900',
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
  },

  statusBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },

  statusBadgeText: {
    color: '#333333',
    fontSize: 10,
    fontWeight: '900',
  },

  detailRow: {
    paddingVertical: 13,
  },

  detailLabel: {
    color: '#888888',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 5,
  },

  detailValue: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },

  detailDivider: {
    height: 1,
    backgroundColor: '#EEEEEE',
  },

  waitCard: {
    marginTop: 14,
    backgroundColor: '#111111',
    borderRadius: 18,
    padding: 17,
  },

  waitTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 7,
  },

  waitText: {
    color: '#BDBDBD',
    fontSize: 12,
    lineHeight: 18,
  },

  introCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },

  introIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#FBEAEA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  introFire: {
    fontSize: 25,
  },

  introText: {
    flex: 1,
  },

  introTitle: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '900',
  },

  introSubtitle: {
    color: '#777777',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },

  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E7E7E7',
  },

  label: {
    color: '#333333',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 7,
    marginTop: 14,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 13,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 14,
    color: '#111111',
    fontSize: 14,
  },

  addressInput: {
    height: 100,
    paddingTop: 14,
    paddingBottom: 14,
  },

  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },

  quantityButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FBEAEA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  quantityButtonText: {
    color: '#C62828',
    fontSize: 28,
    fontWeight: '700',
    marginTop: -2,
  },

  quantityInput: {
    width: 70,
    height: 48,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 14,
    marginHorizontal: 10,
    backgroundColor: '#FAFAFA',
    color: '#111111',
    fontSize: 18,
    fontWeight: '900',
  },

  quantityHint: {
    textAlign: 'center',
    color: '#888888',
    fontSize: 11,
    marginTop: 8,
    marginBottom: 20,
  },

  bookButton: {
    borderRadius: 15,
    overflow: 'hidden',
  },

  bookGradient: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 20,
  },

  bookIcon: {
    fontSize: 18,
    marginRight: 8,
  },

  bookText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },

  pressed: {
    opacity: 0.8,
  },

  disabled: {
    opacity: 0.65,
  },

  infoCard: {
    marginTop: 14,
    backgroundColor: '#111111',
    borderRadius: 18,
    padding: 17,
  },

  infoTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 7,
  },

  infoText: {
    color: '#BDBDBD',
    fontSize: 12,
    lineHeight: 18,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C62828',
    marginRight: 8,
  },

  statusText: {
    color: '#E0E0E0',
    fontSize: 11,
    fontWeight: '700',
  },

  footer: {
    textAlign: 'center',
    color: '#999999',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginTop: 24,
  },
});