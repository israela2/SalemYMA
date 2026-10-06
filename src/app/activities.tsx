import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useEffect, useState } from 'react';

import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';

import AppBackButton from '../components/AppBackButton';
type ActivityItem = {
  id: number;
  title: string | null;
  description: string | null;
  category: string | null;
  activity_date: string | null;
  location: string | null;
  image_url: string | null;
};

export default function ActivitiesScreen() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  async function loadActivities() {
    setLoading(true);

    const { data, error } = await supabase
      .from('activities')
      .select(
        'id, title, description, category, activity_date, location, image_url'
      )
      .order('activity_date', {
        ascending: false,
      });

    console.log('ACTIVITIES DATA:', data);
    console.log('ACTIVITIES ERROR:', error);

    if (error) {
      setActivities([]);
      setLoading(false);
      return;
    }

    setActivities(data || []);
    setLoading(false);
  }

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
        <AppBackButton />

        <Text style={styles.headerSmall}>
          YMA Salem Branch
        </Text>

        <Text style={styles.headerTitle}>
          Hmalakna
        </Text>

        <Text style={styles.headerText}>
          YMA Salem Branch activities and programmes
        </Text>

        <Pressable
          style={styles.refreshButton}
          onPress={loadActivities}
        >
          <Text style={styles.refreshText}>
            ↻ Refresh
          </Text>
        </Pressable>
      </LinearGradient>

      {/* Section */}
      <Text style={styles.sectionTitle}>
        Recent Activities
      </Text>

      {/* Loading */}
      {loading ? (
        <View style={styles.messageCard}>
          <View style={styles.messageIconBox}>
            <Text style={styles.messageIcon}>
              🤝
            </Text>
          </View>

          <Text style={styles.messageTitle}>
            Loading Activities...
          </Text>

          <Text style={styles.messageText}>
            YMA Salem Branch hmalakna te load mek a ni.
          </Text>
        </View>
      ) : activities.length === 0 ? (
        /* Empty State */
        <View style={styles.messageCard}>
          <View style={styles.messageIconBox}>
            <Text style={styles.messageIcon}>
              🤝
            </Text>
          </View>

          <Text style={styles.messageTitle}>
            No Activities Yet
          </Text>

          <Text style={styles.messageText}>
            YMA Salem Branch hmalakna leh programme te
            hetah hian an lo lang ang.
          </Text>
        </View>
      ) : (
        /* Activities */
        activities.map((item) => (
          <View
            key={item.id}
            style={styles.activityCard}
          >
            <LinearGradient
              colors={['#D32F2F', '#8E1B1B', '#111111']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.activityIcon}
            >
              <Text style={styles.iconText}>
                🤝
              </Text>
            </LinearGradient>

            <View style={styles.activityContent}>
              {item.category ? (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>
                    {item.category}
                  </Text>
                </View>
              ) : null}

              <Text style={styles.activityTitle}>
                {item.title || 'Untitled Activity'}
              </Text>

              {item.activity_date ? (
                <Text style={styles.activityDate}>
                  {(() => {
                    const date = new Date(item.activity_date as string);
                    return Number.isNaN(date.getTime())
                      ? ''
                      : `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
                  })()}
                </Text>
              ) : null}

              {item.description ? (
                <Text
                  style={styles.activityText}
                  numberOfLines={4}
                >
                  {item.description}
                </Text>
              ) : null}

              {item.location ? (
                <Text style={styles.location}>
                  📍 {item.location}
                </Text>
              ) : null}
            </View>
          </View>
        ))
      )}

      <View style={{ height: 35 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: '#FFFFFF22',
    borderWidth: 1,
    borderColor: '#FFFFFF33',
  },

  backButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },

  header: {
    paddingTop: 58,
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },

  headerSmall: {
    color: '#FFB4B4',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 5,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '900',
  },

  headerText: {
    color: '#F5DADA',
    fontSize: 12,
    marginTop: 5,
  },

  refreshButton: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: '#FFFFFF22',
    borderWidth: 1,
    borderColor: '#FFFFFF33',
  },

  refreshText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#151515',
    marginHorizontal: 18,
    marginTop: 22,
    marginBottom: 12,
  },

  activityCard: {
    marginHorizontal: 18,
    marginBottom: 12,
    padding: 15,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    elevation: 3,
    shadowColor: '#000000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  activityIcon: {
    width: 54,
    height: 54,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconText: {
    fontSize: 25,
  },

  activityContent: {
    flex: 1,
    marginLeft: 13,
  },

  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FBEAEA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },

  categoryText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#C62828',
    letterSpacing: 0.4,
  },

  activityTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#151515',
    marginTop: 7,
    lineHeight: 20,
  },

  activityDate: {
    fontSize: 9,
    fontWeight: '800',
    color: '#C62828',
    marginTop: 5,
  },

  activityText: {
    fontSize: 11,
    color: '#666666',
    lineHeight: 17,
    marginTop: 5,
  },

  location: {
    fontSize: 10,
    color: '#666666',
    marginTop: 7,
  },

  messageCard: {
    marginHorizontal: 18,
    padding: 28,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  messageIconBox: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#FBEAEA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  messageIcon: {
    fontSize: 30,
  },

  messageTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#151515',
    marginTop: 10,
  },

  messageText: {
    fontSize: 11,
    color: '#777777',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 17,
  },
});