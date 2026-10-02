import {
    ActivityIndicator,
    Linking,
    Alert,
    Pressable,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';

type ZonunItem = {
  id: number;
  title: string;
  description: string | null;
  issue_month: string | null;
  pdf_url: string;
  is_published: boolean;
  created_at: string;
};

export default function ZonunScreen() {
  const [zonun, setZonun] = useState<ZonunItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadZonun();
  }, []);

  async function loadZonun() {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('zonun')
        .select(
          'id, title, description, issue_month, pdf_url, is_published, created_at'
        )
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setZonun((data ?? []) as ZonunItem[]);
    } catch (error: any) {
      Alert.alert(
        'Unable to load Zonun',
        error?.message || 'Something went wrong'
      );
    } finally {
      setLoading(false);
    }
  }

  function openPdf(url: string) {
    router.push({
      pathname: '/zonun-reader',
      params: {
        url,
      },
    });
  }

  return (
    <SafeAreaView style={styles.container}>

      <LinearGradient
        colors={['#D32F2F', '#8E1B1B', '#111111']}
        style={styles.header}
      >

        <View style={styles.headerRow}>

          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>


          <View style={styles.headerContent}>
            <Text style={styles.small}>
              SALEM YMA
            </Text>

            <Text style={styles.title}>
              Zonun
            </Text>

            <Text style={styles.subtitle}>
              Kan veng chanchinbu archive
            </Text>
          </View>


          <View style={styles.headerIcon}>
            <Text style={{fontSize:24}}>
              📖
            </Text>
          </View>

        </View>

      </LinearGradient>


      {loading ? (

        <View style={styles.loading}>
          <ActivityIndicator
            size="large"
            color="#C62828"
          />

          <Text style={styles.loadingText}>
            Zonun loading...
          </Text>
        </View>

      ) : (

        <ScrollView

          showsVerticalScrollIndicator={false}

          contentContainerStyle={styles.content}

          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={loadZonun}
              colors={['#C62828']}
            />
          }

        >

          <View style={styles.introCard}>

            <Text style={styles.introTitle}>
              Zonun Archive
            </Text>

            <Text style={styles.introText}>
              Salem YMA chanchinbu hetah hian chhiar theih a ni.
            </Text>

          </View>


          {zonun.length === 0 ? (

            <View style={styles.empty}>

              <Text style={styles.emptyIcon}>
                📖
              </Text>

              <Text style={styles.emptyTitle}>
                No Zonun Available
              </Text>

              <Text style={styles.emptyText}>
                Zonun thar publish a awm lo.
              </Text>

            </View>

          ) : (

            zonun.map((item) => (

              <Pressable
                key={item.id}
                style={styles.card}
                onPress={() => openPdf(item.pdf_url)}
              >

                <LinearGradient
                  colors={[
                    '#111111',
                    '#8E1B1B',
                    '#C62828'
                  ]}
                  style={styles.pdfBox}
                >

                  <Text style={styles.pdfText}>
                    PDF
                  </Text>

                </LinearGradient>


                <View style={styles.info}>

                  <Text style={styles.cardTitle}>
                    {item.title}
                  </Text>


                  {item.issue_month && (

                    <Text style={styles.month}>
                      {item.issue_month}
                    </Text>

                  )}


                  {item.description && (

                    <Text
                      numberOfLines={2}
                      style={styles.desc}
                    >
                      {item.description}
                    </Text>

                  )}


                  <View style={styles.readButton}>

                    <Text style={styles.readText}>
                      READ PDF →
                    </Text>

                  </View>

                  <Pressable
                    style={styles.downloadButton}
                    onPress={() => Linking.openURL(item.pdf_url)}
                  >
                    <Text style={styles.downloadText}>DOWNLOAD PDF ↓</Text>
                  </Pressable>


                </View>


              </Pressable>

            ))

          )}

        </ScrollView>

      )}

    </SafeAreaView>
  );
}
const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  header: {
    paddingTop: 25,
    paddingBottom: 25,
    paddingHorizontal: 18,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF22',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backText: {
    color: '#FFFFFF',
    fontSize: 34,
    marginTop: -5,
  },

  headerContent: {
    flex: 1,
    marginLeft: 12,
  },

  small: {
    color: '#FFD6D6',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },

  subtitle: {
    color: '#EEEEEE',
    fontSize: 11,
    marginTop: 4,
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF22',
    alignItems: 'center',
    justifyContent: 'center',
  },


  content: {
    padding: 16,
    paddingBottom: 40,
  },


  introCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },

  introTitle: {
    color: '#111111',
    fontSize: 18,
    fontWeight: '900',
  },

  introText: {
    color: '#777777',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },


  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },


  pdfBox: {
    width: 60,
    height: 72,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },


  pdfText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },


  info: {
    flex: 1,
  },


  cardTitle: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '900',
  },


  month: {
    color: '#C62828',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 5,
  },


  desc: {
    color: '#777777',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 5,
  },


  downloadButton: { marginTop: 9, borderWidth: 1, borderColor: '#C62828', borderRadius: 10, minHeight: 40, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },

  downloadText: { color: '#C62828', fontSize: 11, fontWeight: '900' },

  readButton: {
    marginTop: 10,
    backgroundColor: '#C62828',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },


  readText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },


  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },


  loadingText: {
    color: '#555555',
    marginTop: 10,
    fontWeight: '700',
  },


  empty: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 30,
    alignItems: 'center',
    marginTop: 20,
  },


  emptyIcon: {
    fontSize: 40,
  },


  emptyTitle: {
    color: '#111111',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 10,
  },


  emptyText: {
    color: '#777777',
    fontSize: 12,
    marginTop: 5,
  },

});