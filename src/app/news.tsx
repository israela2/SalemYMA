import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';

type NewsItem = {
  id: number;
  title: string | null;
  content: string | null;
  category: string | null;
  published_at: string | null;
  image_url: string | null;
  is_published: boolean;
  created_at: string;
};

export default function NewsScreen() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] =
    useState<NewsItem | null>(null);

  useEffect(() => {
    loadNews();
  }, []);

  async function loadNews() {
    setLoading(true);

    const { data, error } = await supabase
      .from('news')
      .select(
        'id, title, content, category, published_at, image_url, is_published, created_at'
      )
      .eq('is_published', true)
      .order('published_at', {
        ascending: false,
      });

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

  function formatDate(date: string | null) {
    if (!date) return '';

    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '';
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER */}
        <LinearGradient
          colors={['#D32F2F', '#8E1B1B', '#0B0B0B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>‹ Back</Text>
          </Pressable>

          <Text style={styles.headerSmall}>
            YMA SALEM BRANCH
          </Text>

          <Text style={styles.headerTitle}>
            News & Announcements
          </Text>

          <Text style={styles.headerText}>
            Salem YMA latest news and updates
          </Text>
        </LinearGradient>

        {/* SECTION HEADER */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Latest News
            </Text>

            <Text style={styles.sectionSubtitle}>
              Thupuan leh chanchinthar
            </Text>
          </View>

          <Pressable
            onPress={loadNews}
            style={styles.refreshButton}
          >
            <Text style={styles.refreshText}>
              ↻
            </Text>
          </Pressable>
        </View>

        {/* LOADING */}
        {loading ? (
          <View style={styles.messageCard}>
            <ActivityIndicator
              size="large"
              color="#C62828"
            />

            <Text style={styles.messageTitle}>
              Loading News...
            </Text>
          </View>
        ) : news.length === 0 ? (
          /* EMPTY */
          <View style={styles.messageCard}>
            <View style={styles.messageIconBox}>
              <Text style={styles.messageIcon}>
                📰
              </Text>
            </View>

            <Text style={styles.messageTitle}>
              No News Yet
            </Text>

            <Text style={styles.messageText}>
              Salem YMA news and announcements
              will appear here.
            </Text>

            <Pressable
              onPress={loadNews}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>
                Refresh
              </Text>
            </Pressable>
          </View>
        ) : (
          /* NEWS LIST */
          news.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => setSelectedNews(item)}
              style={({ pressed }) => [
                styles.newsCard,
                pressed && styles.newsCardPressed,
              ]}
            >
              {/* SMALL LEFT IMAGE */}
              {item.image_url ? (
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.newsThumbnail}
                  resizeMode="cover"
                />
              ) : (
                <LinearGradient
                  colors={[
                    '#D32F2F',
                    '#8E1B1B',
                    '#111111',
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.thumbnailPlaceholder}
                >
                  <Text style={styles.thumbnailText}>
                    YMA
                  </Text>
                </LinearGradient>
              )}

              {/* RIGHT CONTENT */}
              <View style={styles.newsBody}>
                <View style={styles.topRow}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>
                      {item.category || 'YMA NEWS'}
                    </Text>
                  </View>

                  <Text style={styles.cardDate}>
                    {formatDate(item.published_at)}
                  </Text>
                </View>

                <Text
                  style={styles.newsTitle}
                  numberOfLines={2}
                >
                  {item.title || 'Untitled News'}
                </Text>

                {item.content ? (
                  <Text
                    style={styles.newsText}
                    numberOfLines={3}
                  >
                    {item.content}
                  </Text>
                ) : null}

                <View style={styles.readMoreRow}>
                  <Text style={styles.readMore}>
                    Read more
                  </Text>

                  <Text style={styles.arrow}>
                    →
                  </Text>
                </View>
              </View>
            </Pressable>
          ))
        )}

        <View style={{ height: 35 }} />
      </ScrollView>

      {/* FULL ARTICLE MODAL */}
      <Modal
        visible={selectedNews !== null}
        animationType="slide"
        onRequestClose={() => setSelectedNews(null)}
      >
        <View style={styles.modalContainer}>
          <ScrollView
            showsVerticalScrollIndicator={false}
          >
            <LinearGradient
              colors={[
                '#D32F2F',
                '#8E1B1B',
                '#0B0B0B',
              ]}
              style={styles.modalHeader}
            >
              <Pressable
                onPress={() => setSelectedNews(null)}
                style={styles.closeButton}
              >
                <Text style={styles.closeText}>
                  ×
                </Text>
              </Pressable>

              <Text style={styles.modalSmall}>
                SALEM YMA
              </Text>

              <Text style={styles.modalTitle}>
                Announcement
              </Text>
            </LinearGradient>

            {selectedNews && (
              <View>
                {selectedNews.image_url ? (
                  <Image
                    source={{
                      uri: selectedNews.image_url,
                    }}
                    style={styles.modalImage}
                    resizeMode="cover"
                  />
                ) : null}

                <View style={styles.article}>
                  <View style={styles.articleBadge}>
                    <Text
                      style={
                        styles.articleBadgeText
                      }
                    >
                      {selectedNews.category ||
                        'YMA NEWS'}
                    </Text>
                  </View>

                  <Text style={styles.articleTitle}>
                    {selectedNews.title ||
                      'Untitled News'}
                  </Text>

                  <Text style={styles.articleDate}>
                    Published:{' '}
                    {formatDate(
                      selectedNews.published_at
                    )}
                  </Text>

                  <View style={styles.divider} />

                  <Text
                    style={styles.articleContent}
                  >
                    {selectedNews.content ||
                      'No content available.'}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  scrollContent: {
    paddingBottom: 20,
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
    paddingBottom: 27,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },

  headerSmall: {
    color: '#FFB4B4',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '900',
    marginTop: 5,
  },

  headerText: {
    color: '#F5DADA',
    fontSize: 12,
    marginTop: 6,
  },

  sectionHeader: {
    marginHorizontal: 18,
    marginTop: 22,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#151515',
  },

  sectionSubtitle: {
    color: '#999999',
    fontSize: 10,
    marginTop: 4,
  },

  refreshButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  refreshText: {
    color: '#C62828',
    fontSize: 23,
  },

  /* NEWS CARD */

  newsCard: {
    marginHorizontal: 18,
    marginBottom: 12,
    padding: 11,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    elevation: 3,
    shadowColor: '#000000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  newsCardPressed: {
    opacity: 0.7,
    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  /* SMALL LEFT PHOTO */

  newsThumbnail: {
    width: 92,
    height: 92,
    borderRadius: 13,
    backgroundColor: '#EEEEEE',
  },

  thumbnailPlaceholder: {
    width: 92,
    height: 92,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  thumbnailText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },

  /* RIGHT SIDE */

  newsBody: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  categoryBadge: {
    backgroundColor: '#FBEAEA',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    maxWidth: 105,
  },

  categoryText: {
    color: '#C62828',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  cardDate: {
    color: '#999999',
    fontSize: 8,
    marginLeft: 5,
  },

  newsTitle: {
    color: '#151515',
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 19,
    marginTop: 6,
  },

  newsText: {
    color: '#666666',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },

  readMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },

  readMore: {
    color: '#C62828',
    fontSize: 8,
    fontWeight: '900',
  },

  arrow: {
    color: '#C62828',
    fontSize: 12,
    marginLeft: 3,
  },

  /* EMPTY */

  messageCard: {
    marginHorizontal: 18,
    padding: 30,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    elevation: 2,
  },

  messageIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
    marginTop: 12,
  },

  messageText: {
    fontSize: 11,
    color: '#777777',
    textAlign: 'center',
    marginTop: 6,
  },

  retryButton: {
    marginTop: 15,
    backgroundColor: '#C62828',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
  },

  retryText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },

  /* MODAL */

  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  modalHeader: {
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 23,
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor:
      'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  closeText: {
    color: '#FFFFFF',
    fontSize: 28,
  },

  modalSmall: {
    color: '#FFB4B4',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  modalTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 5,
  },

  modalImage: {
    width: '100%',
    height: 240,
    backgroundColor: '#EEEEEE',
  },

  article: {
    padding: 20,
  },

  articleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FBEAEA',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },

  articleBadgeText: {
    color: '#C62828',
    fontSize: 9,
    fontWeight: '900',
  },

  articleTitle: {
    color: '#151515',
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '900',
    marginTop: 12,
  },

  articleDate: {
    color: '#999999',
    fontSize: 10,
    marginTop: 9,
  },

  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 18,
  },

  articleContent: {
    color: '#444444',
    fontSize: 14,
    lineHeight: 23,
  },
});