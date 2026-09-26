import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function EventsScreen() {
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Events
        </Text>

        <Text style={styles.headerText}>
          Upcoming programmes and events
        </Text>
      </View>

      <Text style={styles.sectionTitle}>
        Upcoming Events
      </Text>

      <View style={styles.eventCard}>
        <View style={styles.dateBox}>
          <Text style={styles.month}>SEP</Text>
          <Text style={styles.date}>28</Text>
        </View>

        <View style={styles.eventContent}>
          <Text style={styles.eventTitle}>
            Salem YMA Programme
          </Text>

          <Text style={styles.eventText}>
            Upcoming Salem YMA programme
          </Text>

          <Text style={styles.location}>
            📍 Salem, Mizoram
          </Text>
        </View>
      </View>

      <View style={styles.eventCard}>
        <View style={styles.dateBox}>
          <Text style={styles.month}>OCT</Text>
          <Text style={styles.date}>05</Text>
        </View>

        <View style={styles.eventContent}>
          <Text style={styles.eventTitle}>
            YMA Community Activity
          </Text>

          <Text style={styles.eventText}>
            Community service and fellowship programme
          </Text>

          <Text style={styles.location}>
            📍 Salem, Mizoram
          </Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoIcon}>📅</Text>

        <Text style={styles.infoText}>
          Salem YMA events, programmes and important
          dates will be updated here.
        </Text>
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
    fontSize: 26,
    fontWeight: '900',
  },

  headerText: {
    color: '#D8E6F0',
    fontSize: 12,
    marginTop: 5,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#172033',
    marginHorizontal: 18,
    marginTop: 22,
    marginBottom: 12,
  },

  eventCard: {
    marginHorizontal: 18,
    marginBottom: 12,
    padding: 15,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
  },

  dateBox: {
    width: 55,
    height: 62,
    borderRadius: 13,
    backgroundColor: '#E8F0F5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  month: {
    fontSize: 10,
    fontWeight: '900',
    color: '#123B5D',
  },

  date: {
    fontSize: 22,
    fontWeight: '900',
    color: '#123B5D',
    marginTop: 1,
  },

  eventContent: {
    flex: 1,
    marginLeft: 13,
  },

  eventTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#172033',
  },

  eventText: {
    fontSize: 11,
    color: '#7A8494',
    marginTop: 5,
    lineHeight: 16,
  },

  location: {
    fontSize: 10,
    color: '#667085',
    marginTop: 7,
  },

  infoCard: {
    marginHorizontal: 18,
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },

  infoIcon: {
    fontSize: 23,
  },

  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 17,
  },
});