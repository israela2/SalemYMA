import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';

type WasteBill = {
  id: number;
  account_no: string | null;
  bill_month: string | null;
  amount: number;
  due_date: string | null;
  status: string;
  paid_at: string | null;
  receipt_no: string | null;
  payment_method: string | null;
  created_at: string;
};

type Member = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
};

export default function WasteFeeScreen() {
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState<WasteBill[]>([]);
  const [member, setMember] = useState<Member | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadWasteFee();
  }, []);

  async function loadWasteFee() {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.log('Auth user error:', userError);
        setBills([]);
        return;
      }

      if (!user) {
        setBills([]);
        setUserId(null);
        return;
      }

      setUserId(user.id);

      console.log('Current logged-in user:', user.id);

      // Load member profile
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('full_name, email, phone')
        .eq('user_id', user.id)
        .maybeSingle();

      if (memberError) {
        console.log('Member error:', memberError);
      }

      setMember(memberData ?? null);

      // Load waste bills belonging to the current member
      const { data: billData, error: billError } = await supabase
        .from('waste_bills')
        .select(
          'id, account_no, bill_month, amount, due_date, status, paid_at, receipt_no, payment_method, created_at'
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (billError) {
        console.log('Waste bill error:', billError);
        setBills([]);
        return;
      }

      console.log('Waste bills:', billData);

      setBills((billData ?? []) as WasteBill[]);
    } catch (error) {
      console.log('Waste fee load error:', error);
      setBills([]);
    } finally {
      setLoading(false);
    }
  }

  function formatAmount(amount: number) {
    return `₹${Number(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function formatDate(date: string | null) {
    if (!date) return '—';

    const d = new Date(date);

    if (Number.isNaN(d.getTime())) {
      return date;
    }

    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  function getStatusLabel(status: string) {
    const value = (status || '').toLowerCase();

    if (value === 'paid') return 'PAID';
    if (value === 'pending') return 'PENDING';
    if (value === 'cancelled') return 'CANCELLED';

    return 'UNPAID';
  }

  function getStatusColor(status: string) {
    const value = (status || '').toLowerCase();

    if (value === 'paid') {
      return '#2E7D32';
    }

    if (value === 'pending') {
      return '#F57C00';
    }

    if (value === 'cancelled') {
      return '#757575';
    }

    return '#C62828';
  }

  const unpaidBills = bills.filter(
    (bill) => (bill.status || '').toLowerCase() !== 'paid'
  );

  const paidBills = bills.filter(
    (bill) => (bill.status || '').toLowerCase() === 'paid'
  );

  const outstanding = unpaidBills.reduce(
    (total, bill) => total + Number(bill.amount || 0),
    0
  );

  const accountNo =
    bills.find((bill) => bill.account_no)?.account_no || 'YMA-0001';

  function handlePayment() {
    Alert.alert(
      'Payment',
      'Online payment will be available soon. Please contact Salem YMA Branch for payment assistance.'
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#C62828" />
        <Text style={styles.loadingText}>Loading waste fee...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#C62828', '#8E1B1B', '#111111']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerSmall}>SALEM YMA</Text>
            <Text style={styles.headerTitle}>Bawhhlawh Paih Man</Text>
            <Text style={styles.headerSubtitle}>
              Waste collection fee
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Text style={styles.headerIconText}>₹</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Account */}
        <View style={styles.accountCard}>
          <View style={styles.accountLeft}>
            <Text style={styles.sectionLabel}>ACCOUNT</Text>

            <Text style={styles.accountNumber}>{accountNo}</Text>

            <Text style={styles.memberName}>
              {member?.full_name || 'Salem YMA Member'}
            </Text>

            {member?.phone ? (
              <Text style={styles.memberContact}>{member.phone}</Text>
            ) : null}
          </View>

          <View style={styles.accountBadge}>
            <Text style={styles.accountBadgeText}>ACTIVE</Text>
          </View>
        </View>

        {/* Current Bill */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Current Bill</Text>

          <Text style={styles.billCount}>
            {unpaidBills.length} unpaid
          </Text>
        </View>

        {unpaidBills.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>✓</Text>
            </View>

            <Text style={styles.emptyTitle}>No outstanding bill</Text>

            <Text style={styles.emptyText}>
              You currently have no unpaid waste collection fee.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.outstandingCard}>
              <View>
                <Text style={styles.outstandingLabel}>
                  TOTAL OUTSTANDING
                </Text>

                <Text style={styles.outstandingAmount}>
                  {formatAmount(outstanding)}
                </Text>

                <Text style={styles.outstandingSubtext}>
                  Please pay before the due date.
                </Text>
              </View>

              <View style={styles.outstandingIcon}>
                <Text style={styles.outstandingIconText}>₹</Text>
              </View>
            </View>

            {unpaidBills.map((bill) => (
              <View style={styles.billCard} key={bill.id}>
                <View style={styles.billTop}>
                  <View>
                    <Text style={styles.billMonth}>
                      {bill.bill_month || 'Waste Collection Fee'}
                    </Text>

                    <Text style={styles.billAccount}>
                      Account: {bill.account_no || accountNo}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: `${getStatusColor(
                          bill.status
                        )}15`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(bill.status) },
                      ]}
                    >
                      {getStatusLabel(bill.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.billInfoRow}>
                  <View>
                    <Text style={styles.infoLabel}>AMOUNT</Text>
                    <Text style={styles.infoValue}>
                      {formatAmount(bill.amount)}
                    </Text>
                  </View>

                  <View style={styles.infoRight}>
                    <Text style={styles.infoLabel}>DUE DATE</Text>
                    <Text style={styles.infoValue}>
                      {formatDate(bill.due_date)}
                    </Text>
                  </View>
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.payButton,
                    pressed && styles.pressed,
                  ]}
                  onPress={handlePayment}
                >
                  <LinearGradient
                    colors={['#C62828', '#8E1B1B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.payButtonGradient}
                  >
                    <Text style={styles.payButtonText}>
                      Pay Now
                    </Text>

                    <Text style={styles.payButtonArrow}>→</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            ))}
          </>
        )}

        {/* Payment History */}
        <View style={styles.sectionHeaderRowHistory}>
          <Text style={styles.sectionTitle}>Payment History</Text>

          <Text style={styles.billCount}>
            {paidBills.length} paid
          </Text>
        </View>

        {paidBills.length === 0 ? (
          <View style={styles.historyEmpty}>
            <Text style={styles.historyEmptyTitle}>
              No payment history
            </Text>

            <Text style={styles.historyEmptyText}>
              Your completed payments will appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.historyCard}>
            {paidBills.map((bill, index) => (
              <View key={bill.id}>
                <View style={styles.historyRow}>
                  <View style={styles.historyIcon}>
                    <Text style={styles.historyIconText}>✓</Text>
                  </View>

                  <View style={styles.historyMain}>
                    <Text style={styles.historyMonth}>
                      {bill.bill_month || 'Waste Fee'}
                    </Text>

                    <Text style={styles.historyDate}>
                      Paid {formatDate(bill.paid_at || bill.created_at)}
                    </Text>

                    {bill.receipt_no ? (
                      <Text style={styles.receiptText}>
                        Receipt: {bill.receipt_no}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.historyAmountWrap}>
                    <Text style={styles.historyAmount}>
                      {formatAmount(bill.amount)}
                    </Text>

                    <Text style={styles.paidText}>PAID</Text>
                  </View>
                </View>

                {index < paidBills.length - 1 ? (
                  <View style={styles.historyDivider} />
                ) : null}
              </View>
            ))}
          </View>
        )}

        {/* Information */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={styles.infoCircle}>
              <Text style={styles.infoCircleText}>i</Text>
            </View>

            <Text style={styles.infoTitle}>Information</Text>
          </View>

          <Text style={styles.infoDescription}>
            Waste collection fees help support regular waste
            collection and maintain a clean community environment.
          </Text>

          <View style={styles.infoLine} />

          <Text style={styles.infoContactTitle}>
            Need help with your bill?
          </Text>

          <Text style={styles.infoContactText}>
            Please contact the Salem YMA Branch administration.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerTitle}>SALEM YMA</Text>
          <Text style={styles.footerSubtitle}>
            Young Mizo Association
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#777777',
    fontWeight: '600',
  },

  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },

  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerSmall: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 5,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  headerSubtitle: {
    color: '#F4DADA',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },

  headerIconText: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '900',
  },

  scroll: {
    flex: 1,
  },

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  accountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: -2,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  accountLeft: {
    flex: 1,
  },

  sectionLabel: {
    fontSize: 9,
    color: '#999999',
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 5,
  },

  accountNumber: {
    color: '#111111',
    fontSize: 20,
    fontWeight: '900',
  },

  memberName: {
    color: '#555555',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },

  memberContact: {
    color: '#888888',
    fontSize: 11,
    marginTop: 3,
  },

  accountBadge: {
    backgroundColor: '#EAF6EC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  accountBadgeText: {
    color: '#2E7D32',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  sectionHeaderRowHistory: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 25,
    marginBottom: 10,
  },

  sectionTitle: {
    color: '#111111',
    fontSize: 19,
    fontWeight: '900',
  },

  billCount: {
    color: '#888888',
    fontSize: 11,
    fontWeight: '700',
  },

  outstandingCard: {
    backgroundColor: '#111111',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  outstandingLabel: {
    color: '#AAAAAA',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  outstandingAmount: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    marginTop: 5,
  },

  outstandingSubtext: {
    color: '#AAAAAA',
    fontSize: 11,
    marginTop: 5,
  },

  outstandingIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#C62828',
    alignItems: 'center',
    justifyContent: 'center',
  },

  outstandingIconText: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '900',
  },

  billCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 17,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  billTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  billMonth: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '900',
  },

  billAccount: {
    color: '#888888',
    fontSize: 10,
    marginTop: 4,
    fontWeight: '600',
  },

  statusBadge: {
    borderRadius: 15,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  statusText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 15,
  },

  billInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  infoRight: {
    alignItems: 'flex-end',
  },

  infoLabel: {
    color: '#999999',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  infoValue: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 4,
  },

  payButton: {
    marginTop: 17,
    borderRadius: 13,
    overflow: 'hidden',
  },

  payButtonGradient: {
    height: 46,
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  payButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },

  payButtonArrow: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },

  pressed: {
    opacity: 0.82,
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EAF6EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  emptyIconText: {
    color: '#2E7D32',
    fontSize: 22,
    fontWeight: '900',
  },

  emptyTitle: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '900',
  },

  emptyText: {
    color: '#888888',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 5,
  },

  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },

  historyIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EAF6EC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  historyIconText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '900',
  },

  historyMain: {
    flex: 1,
    marginLeft: 11,
  },

  historyMonth: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '900',
  },

  historyDate: {
    color: '#888888',
    fontSize: 10,
    marginTop: 3,
  },

  receiptText: {
    color: '#AAAAAA',
    fontSize: 9,
    marginTop: 3,
  },

  historyAmountWrap: {
    alignItems: 'flex-end',
  },

  historyAmount: {
    color: '#111111',
    fontSize: 12,
    fontWeight: '900',
  },

  paidText: {
    color: '#2E7D32',
    fontSize: 8,
    fontWeight: '900',
    marginTop: 3,
  },

  historyDivider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginLeft: 49,
  },

  historyEmpty: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  historyEmptyTitle: {
    color: '#333333',
    fontSize: 13,
    fontWeight: '900',
  },

  historyEmptyText: {
    color: '#999999',
    fontSize: 11,
    marginTop: 4,
  },

  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  infoCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FBEAEA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoCircleText: {
    color: '#C62828',
    fontSize: 15,
    fontWeight: '900',
  },

  infoTitle: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '900',
    marginLeft: 9,
  },

  infoDescription: {
    color: '#777777',
    fontSize: 11,
    lineHeight: 18,
    marginTop: 12,
  },

  infoLine: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 14,
  },

  infoContactTitle: {
    color: '#333333',
    fontSize: 11,
    fontWeight: '900',
  },

  infoContactText: {
    color: '#888888',
    fontSize: 10,
    marginTop: 4,
    lineHeight: 16,
  },

  footer: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 10,
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