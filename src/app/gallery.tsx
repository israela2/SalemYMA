import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function GalleryScreen() {
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Gallery
        </Text>

        <Text style={styles.headerText}>
          Salem YMA photos and memories
        </Text>
      </View>

      {/* Albums */}
      <Text style={styles.sectionTitle}>
        Albums
      </Text>

      <View style={styles.row}>
        <Pressable style={styles.albumCard}>
          <View style={styles.albumIconBox}>
            <Text style={styles.albumIcon}>🤝</Text>
          </View>

          <Text style={styles.albumTitle}>
            Activities
          </Text>

          <Text style={styles.albumText}>
            YMA hmalakna te
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.albumCard,
            styles.rightCard,
          ]}
        >
          <View style={styles.albumIconBox}>
            <Text style={styles.albumIcon}>📅</Text>
          </View>

          <Text style={styles.albumTitle}>
            Events
          </Text>

          <Text style={styles.albumText}>
            Programme te
          </Text>
        </Pressable>
      </View>

      <View style={styles.row}>
        <Pressable style={styles.albumCard}>
          <View style={styles.albumIconBox}>
            <Text style={styles.albumIcon}>👥</Text>
          </View>

          <Text style={styles.albumTitle}>
            Members
          </Text>

          <Text style={styles.albumText}>
            Member thlalak te
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.albumCard,
            styles.rightCard,
          ]}
        >
          <View style={styles.albumIconBox}>
            <Text style={styles.albumIcon}>🎥</Text>
          </View>

          <Text style={styles.albumTitle}>
            Videos
          </Text>

          <Text style={styles.albumText}>
            Video te
          </Text>
        </Pressable>
      </View>

      {/* Recent Photos */}
      <Text style={styles.sectionTitle}>
        Recent Photos
      </Text>

      <View style={styles.photoRow}>
        <View style={styles.photoBox}>
          <Text style={styles.photoIcon}>📷</Text>
          <Text style={styles.photoLabel}>
            Salem YMA
          </Text>
        </View>

        <View
          style={[
            styles.photoBox,
            styles.rightPhoto,
          ]}
        >
          <Text style={styles.photoIcon}>📷</Text>
          <Text style={styles.photoLabel}>
            Activity
          </Text>
        </View>
      </View>

      <View style={styles.photoRow}>
        <View style={styles.photoBox}>
          <Text style={styles.photoIcon}>📷</Text>
          <Text style={styles.photoLabel}>
            Programme
          </Text>
        </View>

        <View
          style={[
            styles.photoBox,
            styles.rightPhoto,
          ]}
        >
          <Text style={styles.photoIcon}>📷</Text>
          <Text style={styles.photoLabel}>
            Members
          </Text>
        </View>
      </View>

      {/* Information */}
      <View style={styles.infoCard}>
        <Text style={styles.infoIcon}>
          🖼️
        </Text>

        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>
            Salem YMA Gallery
          </Text>

          <Text style={styles.infoText}>
            Salem YMA programme, activity, event leh
            member-te thlalak te hetah hian kan dah ang.
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

  row: {
    flexDirection: 'row',
    marginHorizontal: 18,
    marginBottom: 10,
  },

  albumCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
  },

  rightCard: {
    marginLeft: 10,
  },

  albumIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#E8F0F5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  albumIcon: {
    fontSize: 24,
  },

  albumTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#172033',
    marginTop: 10,
  },

  albumText: {
    fontSize: 10,
    color: '#7A8494',
    marginTop: 4,
  },

  photoRow: {
    flexDirection: 'row',
    marginHorizontal: 18,
    marginBottom: 10,
  },

  photoBox: {
    width: '48%',
    height: 145,
    borderRadius: 17,
    backgroundColor: '#E8F0F5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  rightPhoto: {
    marginLeft: 10,
  },

  photoIcon: {
    fontSize: 38,
  },

  photoLabel: {
    fontSize: 10,
    fontWeight: '700',
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