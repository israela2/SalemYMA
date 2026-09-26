import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';

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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Hmalakna
        </Text>

        <Text style={styles.headerText}>
          Salem YMA activities and programmes
        </Text>

        <Pressable
          style={styles.refreshButton}
          onPress={loadActivities}
        >
          <Text style={styles.refreshText}>
            ↻ Refresh
          </Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>
        Recent Activities
      </Text>

      {loading ? (
        <View style={styles.messageCard}>
          <Text style={styles.messageIcon}>
            🤝
          </Text>

          <Text style={styles.messageTitle}>
            Loading Activities...
          </Text>

          <Text style={styles.messageText}>
            Salem YMA hmalakna te load mek a ni.
          </Text>
        </View>
      ) : activities.length === 0 ? (
        <View style={styles.messageCard}>
          <Text style={styles.messageIcon}>
            🤝
          </Text>

          <Text style={styles.messageTitle}>
            No Activities Yet
          </Text>

          <Text style={styles.messageText}>
            Salem YMA hmalakna leh programme te
            hetah hian an lo lang ang.
          </Text>
        </View>
      ) : (
        activities.map((item) => (
          <View
            key={item.id}
            style={styles.activityCard}
          >
            <View style={styles.activityIcon}>
              <Text style={styles.iconText}>
                🤝
              </Text>
            </View>

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
                  {item.activity_date}
                </Text>
              ) : null}

              <Text style={styles.activityText}>
                {item.description || ''}
              </Text>

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

  refreshButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF22',
  },

  refreshText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#172033',
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
  },

  activityIcon: {
    width: 54,
    height: 54,
    borderRadius: 15,
    backgroundColor: '#E8F0F5',
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
    backgroundColor: '#E8F0F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },

  categoryText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#123B5D',
  },

  activityTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#172033',
    marginTop: 7,
  },

  activityDate: {
    fontSize: 9,
    fontWeight: '700',
    color: '#123B5D',
    marginTop: 4,
  },

  activityText: {
    fontSize: 11,
    color: '#7A8494',
    lineHeight: 16,
    marginTop: 5,
  },

  location: {
    fontSize: 10,
    color: '#667085',
    marginTop: 7,
  },

  messageCard: {
    marginHorizontal: 18,
    padding: 25,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },

  messageIcon: {
    fontSize: 32,
  },

  messageTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#172033',
    marginTop: 8,
  },

  messageText: {
    fontSize: 11,
    color: '#7A8494',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 17,
  },
});