import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function WasteFeeScreen() {
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Bawhhlawh Paih Man
        </Text>

        <Text style={styles.headerText}>
          Waste collection fee
        </Text>
      </View>

      {/* Account */}
      <View style={styles.accountCard}>
        <View style={styles.accountIcon}>
          <Text style={styles.accountIconText}>
            🗑️
          </Text>
        </View>

        <View style={styles.accountInfo}>
          <Text style={styles.accountLabel}>
            ACCOUNT
          </Text>

          <Text style={styles.accountName}>
            Salem YMA Member
          </Text>

          <Text style={styles.accountNumber}>
            Account No: YMA-0001
          </Text>
        </View>
      </View>

      {/* Current Bill */}
      <Text style={styles.sectionTitle}>
        Current Bill
      </Text>

      <View style={styles.billCard}>
        <View>
          <Text style={styles.billLabel}>
            OUTSTANDING AMOUNT
          </Text>

          <Text style={styles.amount}>
            ₹0.00
          </Text>

          <Text style={styles.dueText}>
            No outstanding payment
          </Text>
        </View>

        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            PAID
          </Text>
        </View>
      </View>

      {/* Payment Button */}
      <Pressable style={styles.paymentButton}>
        <Text style={styles.paymentButtonText}>
          Pay Bawhhlawh Paih Man
        </Text>
      </Pressable>

      {/* Payment History */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitleNoMargin}>
          Payment History
        </Text>

        <Text style={styles.viewAll}>
          View All
        </Text>
      </View>

      <View style={styles.historyCard}>
        <View style={styles.historyIcon}>
          <Text>✓</Text>
        </View>

        <View style={styles.historyInfo}>
          <Text style={styles.historyTitle}>
            Waste Collection Fee
          </Text>

          <Text style={styles.historyDate}>
            Payment history will appear here
          </Text>
        </View>

        <Text style={styles.historyAmount}>
          —
        </Text>
      </View>

      {/* Information */}
      <Text style={styles.sectionTitle}>
        Information
      </Text>

      <View style={styles.infoCard}>
        <Text style={styles.infoIcon}>
          ℹ️
        </Text>

        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>
            About Waste Collection Fee
          </Text>

          <Text style={styles.infoText}>
            Bawhhlawh paih man bill, payment status leh
            payment receipt te hetah hian kan dah ang.
          </Text>
        </View>
      </View>

      <View style={{ height: 35 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },

  header: {
    backgroundColor: '#123B5D',
    paddingTop: 55,
    paddingHorizontal: 18,
    paddingBottom: 22,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '900',
  },

  headerText: {
    color: '#D8E6F0',
    fontSize: 12,
    marginTop: 5,
  },

  accountCard: {
    margin: 18,
    padding: 17,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },

  accountIcon: {
    width: 56,
    height: 56,
    borderRadius: 15,
    backgroundColor: '#E8F0F5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  accountIconText: {
    fontSize: 28,
  },

  accountInfo: {
    flex: 1,
    marginLeft: 13,
  },

  accountLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#7A8494',
    letterSpacing: 0.8,
  },

  accountName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#172033',
    marginTop: 3,
  },

  accountNumber: {
    fontSize: 10,
    color: '#667085',
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#172033',
    marginHorizontal: 18,
    marginTop: 5,
    marginBottom: 12,
  },

  billCard: {
    marginHorizontal: 18,
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  billLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#7A8494',
    letterSpacing: 0.7,
  },

  amount: {
    fontSize: 30,
    fontWeight: '900',
    color: '#123B5D',
    marginTop: 4,
  },

  dueText: {
    fontSize: 10,
    color: '#2E7D5B',
    marginTop: 3,
  },

  statusBadge: {
    backgroundColor: '#E8F5EE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
  },

  statusText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#2E7D5B',
  },

  paymentButton: {
    marginHorizontal: 18,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 13,
    backgroundColor: '#123B5D',
    alignItems: 'center',
  },

  paymentButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  sectionHeader: {
    marginHorizontal: 18,
    marginTop: 24,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  sectionTitleNoMargin: {
    fontSize: 20,
    fontWeight: '800',
    color: '#172033',
  },

  viewAll: {
    fontSize: 11,
    fontWeight: '700',
    color: '#123B5D',
  },

  historyCard: {
    marginHorizontal: 18,
    padding: 15,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },

  historyIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#E8F5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  historyInfo: {
    flex: 1,
    marginLeft: 12,
  },

  historyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#172033',
  },

  historyDate: {
    fontSize: 10,
    color: '#7A8494',
    marginTop: 4,
  },

  historyAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#172033',
  },

  infoCard: {
    marginHorizontal: 18,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
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
    fontWeight: '800',
    color: '#172033',
  },

  infoText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 5,
    lineHeight: 17,
  },
});