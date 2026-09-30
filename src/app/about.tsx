import {
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

export default function AboutScreen() {
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <LinearGradient
        colors={['#D32F2F', '#8E1B1B', '#0B0B0B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>

        <View style={styles.headerContent}>
          <Text style={styles.headerSmall}>
            YMA SALEM BRANCH
          </Text>

          <Text style={styles.headerTitle}>
            About Us
          </Text>

          <Text style={styles.headerText}>
            Young Mizo Association
          </Text>
        </View>

        <View style={styles.headerLogoBox}>
          <Image
            source={require('../../assets/images/yma-logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>
      </LinearGradient>

      {/* Main Logo Card */}
      <View style={styles.logoCard}>
        <View style={styles.logoCircle}>
          <Image
            source={require('../../assets/images/yma-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.branchTitle}>
          YMA SALEM BRANCH
        </Text>

        <Text style={styles.branchSubtitle}>
          Young Mizo Association
        </Text>

        <View style={styles.branchBadge}>
          <Text style={styles.branchBadgeText}>
            SALEM BRANCH
          </Text>
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.sectionDot} />
          <Text style={styles.sectionTitle}>
            YMA Salem Branch
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            YMA Salem Branch hi Young Mizo Association
            hnuaia branch pakhat a ni a. Salem khawtlang
            chhungah mihring nunphung tha, inpumkhatna,
            mahni hriatna leh khawtlang tana rawngbawlna
            te a ngai pawimawh em em a ni.
          </Text>

          <Text style={styles.infoText}>
            YMA Salem Branch chuan member-te leh
            khawtlang tan hmalakna hrang hrang, khawtlang
            nun siamthatna leh inpumkhatna tihchakna
            turin a theih ang tawkin hma a la thin.
          </Text>
        </View>
      </View>

      {/* Our Purpose */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.sectionDot} />
          <Text style={styles.sectionTitle}>
            Kan Tum
          </Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.pointRow}>
            <View style={styles.pointIcon}>
              <Text style={styles.pointIconText}>✓</Text>
            </View>

            <Text style={styles.pointText}>
              Member-te inpumkhatna leh inhmangaihna
              tihchak.
            </Text>
          </View>

          <View style={styles.pointRow}>
            <View style={styles.pointIcon}>
              <Text style={styles.pointIconText}>✓</Text>
            </View>

            <Text style={styles.pointText}>
              Salem khawtlang tana hmalakna leh
              rawngbawlna pe.
            </Text>
          </View>

          <View style={styles.pointRow}>
            <View style={styles.pointIcon}>
              <Text style={styles.pointIconText}>✓</Text>
            </View>

            <Text style={styles.pointText}>
              Khawtlang nunphung tha leh tlawmngaihna
              tihchak.
            </Text>
          </View>

          <View style={styles.pointRow}>
            <View style={styles.pointIcon}>
              <Text style={styles.pointIconText}>✓</Text>
            </View>

            <Text style={styles.pointText}>
              YMA hmalakna leh tumte chu member-te
              leh khawtlang hnenah hriattir.
            </Text>
          </View>
        </View>
      </View>

      {/* Activities */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.sectionDot} />
          <Text style={styles.sectionTitle}>
            Hmalakna
          </Text>
        </View>

        <View style={styles.activityCard}>
          <View style={styles.activityIconBox}>
            <Text style={styles.activityIcon}>🤝</Text>
          </View>

          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>
              Community Service
            </Text>

            <Text style={styles.activityText}>
              Khawtlang tana rawngbawlna leh
              hmalakna hrang hrang.
            </Text>
          </View>
        </View>

        <View style={styles.activityCard}>
          <View style={styles.activityIconBox}>
            <Text style={styles.activityIcon}>👥</Text>
          </View>

          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>
              Member Development
            </Text>

            <Text style={styles.activityText}>
              Member-te hmasawnna leh inpumkhatna
              tihchakna.
            </Text>
          </View>
        </View>

        <View style={styles.activityCard}>
          <View style={styles.activityIconBox}>
            <Text style={styles.activityIcon}>🏘️</Text>
          </View>

          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>
              Salem Community
            </Text>

            <Text style={styles.activityText}>
              Salem khawtlang nun leh hmasawnna
              turin hma lak.
            </Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLine} />

        <Text style={styles.footerTitle}>
          YMA SALEM BRANCH
        </Text>

        <Text style={styles.footerText}>
          Young Mizo Association
        </Text>

        <Text style={styles.footerSmall}>
          Together for Salem Community
        </Text>
      </View>

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  header: {
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF18',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFFFFF25',
  },

  backIcon: {
    color: '#FFFFFF',
    fontSize: 31,
    lineHeight: 32,
    marginTop: -3,
  },

  headerContent: {
    flex: 1,
  },

  headerSmall: {
    color: '#F5CACA',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.6,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    marginTop: 4,
  },

  headerText: {
    color: '#E8E8E8',
    fontSize: 11,
    marginTop: 5,
  },

  headerLogoBox: {
    position: 'absolute',
    right: 20,
    top: 75,
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: '#FFFFFF18',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF25',
  },

  headerLogo: {
    width: 43,
    height: 43,
    opacity: 0.9,
  },

  logoCard: {
    marginHorizontal: 18,
    marginTop: 18,
    paddingVertical: 23,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },

  logoCircle: {
    width: 86,
    height: 86,
    borderRadius: 25,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 12,
  },

  logoImage: {
    width: 72,
    height: 72,
  },

  branchTitle: {
    color: '#111111',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },

  branchSubtitle: {
    color: '#777777',
    fontSize: 10,
    marginTop: 4,
  },

  branchBadge: {
    backgroundColor: '#FBEAEA',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
    marginTop: 9,
  },

  branchBadgeText: {
    color: '#C62828',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  section: {
    marginHorizontal: 18,
    marginTop: 24,
  },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 11,
  },

  sectionDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#C62828',
    marginRight: 8,
  },

  sectionTitle: {
    color: '#111111',
    fontSize: 18,
    fontWeight: '900',
  },

  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 17,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },

  infoText: {
    color: '#555555',
    fontSize: 11,
    lineHeight: 19,
    marginBottom: 12,
  },

  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },

  pointIcon: {
    width: 25,
    height: 25,
    borderRadius: 8,
    backgroundColor: '#FBEAEA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  pointIconText: {
    color: '#C62828',
    fontSize: 13,
    fontWeight: '900',
  },

  pointText: {
    flex: 1,
    color: '#555555',
    fontSize: 10,
    lineHeight: 17,
    paddingTop: 3,
  },

  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 13,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },

  activityIconBox: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: '#FBEAEA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  activityIcon: {
    fontSize: 21,
  },

  activityContent: {
    flex: 1,
    marginLeft: 12,
  },

  activityTitle: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '900',
  },

  activityText: {
    color: '#777777',
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },

  footer: {
    alignItems: 'center',
    marginTop: 30,
    paddingHorizontal: 18,
  },

  footerLine: {
    width: 45,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#C62828',
    marginBottom: 15,
  },

  footerTitle: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '900',
  },

  footerText: {
    color: '#888888',
    fontSize: 9,
    marginTop: 3,
  },

  footerSmall: {
    color: '#AAAAAA',
    fontSize: 8,
    marginTop: 7,
  },

  bottomSpace: {
    height: 30,
  },
});