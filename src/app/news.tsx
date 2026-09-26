import {
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';

type NewsItem = {
  id: number;
  title: string | null;
  content: string | null;
  category: string | null;
  published_at: string | null;
  image_url: string | null;
};

export default function NewsScreen() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNews();
  }, []);

  async function loadNews() {
    setLoading(true);

    const { data, error } = await supabase
      .from('news')
      .select(
        'id, title, content, category, published_at, image_url'
      );

    console.log('NEWS DATA:', data);
    console.log('NEWS ERROR:', error);

    if (error) {
      setNews([]);
      setLoading(false);
      return;
    }

    setNews(data || []);
    setLoading(false);
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          News & Announcements
        </Text>

        <Text style={styles.headerText}>
          Salem YMA latest news and updates
        </Text>
      </View>

      <Text style={styles.sectionTitle}>
        Latest News
      </Text>

      {loading ? (
        <View style={styles.messageCard}>
          <Text style={styles.messageIcon}>
            📰
          </Text>

          <Text style={styles.messageTitle}>
            Loading News...
          </Text>

          <Text style={styles.messageText}>
            Salem YMA news is being loaded.
          </Text>
        </View>
      ) : news.length === 0 ? (
        <View style={styles.messageCard}>
          <Text style={styles.messageIcon}>
            📰
          </Text>

          <Text style={styles.messageTitle}>
            No News Yet
          </Text>

          <Text style={styles.messageText}>
            Salem YMA news and announcements will
            appear here.
          </Text>
        </View>
      ) : (
        news.map((item) => (
          <View
            key={item.id}
            style={styles.newsCard}
          >
            <View style={styles.dateBox}>
              <Text style={styles.month}>
                {item.published_at
                  ? new Date(
                      item.published_at
                    )
                      .toLocaleDateString(
                        'en-US',
                        {
                          month: 'short',
                        }
                      )
                      .toUpperCase()
                  : '---'}
              </Text>

              <Text style={styles.date}>
                {item.published_at
                  ? new Date(
                      item.published_at
                    ).toLocaleDateString(
                      'en-US',
                      {
                        day: '2-digit',
                      }
                    )
                  : '--'}
              </Text>
            </View>

            <View style={styles.newsContent}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>
                  {item.category || 'YMA NEWS'}
                </Text>
              </View>

              <Text style={styles.newsTitle}>
                {item.title || 'Untitled News'}
              </Text>

              <Text style={styles.newsText}>
                {item.content || ''}
              </Text>

              {item.published_at ? (
                <Text style={styles.dateText}>
                  Published: {item.published_at}
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
    fontSize: 25,
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

  newsCard: {
    marginHorizontal: 18,
    marginBottom: 12,
    padding: 15,
    borderRadius: 18,
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

  newsContent: {
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

  newsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#172033',
    marginTop: 8,
  },

  newsText: {
    fontSize: 11,
    color: '#667085',
    lineHeight: 17,
    marginTop: 5,
  },

  dateText: {
    fontSize: 9,
    color: '#98A2B3',
    marginTop: 8,
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