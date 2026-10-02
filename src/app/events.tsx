import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';

type EventItem = {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  event_date: string | null;
  image_url: string | null;
  organizing_branch: string | null;
  is_published: boolean;
};

function getMonth(dateString: string | null) {
  if (!dateString) return 'TBA';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'TBA';
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getDay(dateString: string | null) {
  if (!dateString) return '--';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '--';
  return String(date.getFullYear());
}

function getEventDate(dateString: string | null) {
  if (!dateString) return 'Date to be announced';

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return 'Date to be announced';
  }

  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

function getEventTime(dateString: string | null) {
  if (!dateString) return '';

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function EventsScreen() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] =
    useState<EventItem | null>(null);

  const loadEvents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(
          'id, title, description, location, event_date, image_url, organizing_branch, is_published'
        )
        .eq('is_published', true)
        .order('event_date', {
          ascending: true,
          nullsFirst: false,
        });

      if (error) {
        console.log('Events load error:', error);
        setEvents([]);
        return;
      }

      setEvents((data || []) as EventItem[]);
    } catch (error) {
      console.log('Events error:', error);
      setEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={['#D32F2F', '#8E1B1B', '#0B0B0B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Text style={styles.headerEyebrow}>
            SALEM YMA
          </Text>

          <Text style={styles.headerTitle}>
            Events
          </Text>

          <Text style={styles.headerText}>
            Upcoming programmes and events
          </Text>
        </LinearGradient>

        <Text style={styles.sectionTitle}>
          Upcoming Events
        </Text>

        {/* Loading */}
        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator
              size="small"
              color="#C62828"
            />

            <Text style={styles.loadingText}>
              Loading events...
            </Text>
          </View>
        )}

        {/* Empty */}
        {!loading && events.length === 0 && (
          <View style={styles.emptyCard}>
            <LinearGradient
              colors={['#D32F2F', '#8E1B1B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyIcon}
            >
              <Text style={styles.emptyIconText}>
                📅
              </Text>
            </LinearGradient>

            <Text style={styles.emptyTitle}>
              No Upcoming Events
            </Text>

            <Text style={styles.emptyText}>
              Salem YMA events and programmes will appear here.
            </Text>
          </View>
        )}

        {/* Event List */}
        {!loading &&
          events.map((event) => (
            <Pressable
              key={event.id}
              onPress={() => setSelectedEvent(event)}
              style={({ pressed }) => [
                styles.eventCard,
                {
                  opacity: pressed ? 0.92 : 1,
                  transform: [
                    {
                      scale: pressed ? 0.985 : 1,
                    },
                  ],
                },
              ]}
            >
              {/* Event Image */}
              {event.image_url ? (
                <Image
                  source={{ uri: event.image_url }}
                  style={styles.eventImage}
                  resizeMode="cover"
                />
              ) : (
                <LinearGradient
                  colors={['#D32F2F', '#8E1B1B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.eventImage}
                >
                  <Text style={styles.imagePlaceholderIcon}>
                    📅
                  </Text>
                </LinearGradient>
              )}

              <View style={styles.eventMain}>
                {/* Date Box */}
                <LinearGradient
                  colors={['#D32F2F', '#8E1B1B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.dateBox}
                >
                  <Text style={styles.month}>
                    {getMonth(event.event_date)}
                  </Text>

                  <Text style={styles.date}>
                    {getDay(event.event_date)}
                  </Text>
                </LinearGradient>

                {/* Content */}
                <View style={styles.eventContent}>
                  <Text
                    style={styles.eventTitle}
                    numberOfLines={2}
                  >
                    {event.title}
                  </Text>

                  {event.description ? (
                    <Text
                      style={styles.eventText}
                      numberOfLines={2}
                    >
                      {event.description}
                    </Text>
                  ) : null}

                  <View style={styles.metaRow}>
                    <Text style={styles.metaIcon}>
                      📅
                    </Text>

                    <Text style={styles.metaText}>
                      {getEventDate(event.event_date)}
                    </Text>
                  </View>

                  {getEventTime(event.event_date) ? (
                    <View style={styles.metaRow}>
                      <Text style={styles.metaIcon}>
                        🕐
                      </Text>

                      <Text style={styles.metaText}>
                        {getEventTime(event.event_date)}
                      </Text>
                    </View>
                  ) : null}

                  {event.location ? (
                    <View style={styles.metaRow}>
                      <Text style={styles.metaIcon}>
                        📍
                      </Text>

                      <Text
                        style={styles.metaText}
                        numberOfLines={1}
                      >
                        {event.location}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <View style={styles.tapHint}>
                <Text style={styles.tapHintText}>
                  TAP TO VIEW
                </Text>

                <Text style={styles.arrow}>
                  ›
                </Text>
              </View>
            </Pressable>
          ))}

        {/* Information Card */}
        <LinearGradient
          colors={['#D32F2F', '#8E1B1B', '#0B0B0B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.infoCard}
        >
          <View style={styles.infoIconBox}>
            <Text style={styles.infoIcon}>
              📅
            </Text>
          </View>

          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>
              Stay Updated
            </Text>

            <Text style={styles.infoText}>
              Salem YMA events, programmes and important
              dates will be updated here.
            </Text>
          </View>
        </LinearGradient>

        <View style={{ height: 35 }} />
      </ScrollView>

      {/* Event Detail Modal */}
      <Modal
        visible={!!selectedEvent}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedEvent(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView
              showsVerticalScrollIndicator={false}
            >
              {/* Close */}
              <Pressable
                onPress={() => setSelectedEvent(null)}
                style={styles.closeButton}
              >
                <Text style={styles.closeText}>
                  ×
                </Text>
              </Pressable>

              {/* Detail Image */}
              {selectedEvent?.image_url ? (
                <Image
                  source={{
                    uri: selectedEvent.image_url,
                  }}
                  style={styles.detailImage}
                  resizeMode="cover"
                />
              ) : (
                <LinearGradient
                  colors={[
                    '#D32F2F',
                    '#8E1B1B',
                    '#0B0B0B',
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.detailImage}
                >
                  <Text style={styles.detailPlaceholderIcon}>
                    📅
                  </Text>
                </LinearGradient>
              )}

              <View style={styles.detailContent}>
                <Text style={styles.detailEyebrow}>
                  SALEM YMA EVENT
                </Text>

                <Text style={styles.detailTitle}>
                  {selectedEvent?.title}
                </Text>

                {selectedEvent?.description ? (
                  <Text style={styles.detailDescription}>
                    {selectedEvent.description}
                  </Text>
                ) : null}

                <View style={styles.detailDivider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailIcon}>
                    📅
                  </Text>

                  <View style={styles.detailRowContent}>
                    <Text style={styles.detailLabel}>
                      DATE
                    </Text>

                    <Text style={styles.detailValue}>
                      {getEventDate(
                        selectedEvent?.event_date || null
                      )}
                    </Text>
                  </View>
                </View>

                {getEventTime(
                  selectedEvent?.event_date || null
                ) ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailIcon}>
                      🕐
                    </Text>

                    <View style={styles.detailRowContent}>
                      <Text style={styles.detailLabel}>
                        TIME
                      </Text>

                      <Text style={styles.detailValue}>
                        {getEventTime(
                          selectedEvent?.event_date || null
                        )}
                      </Text>
                    </View>
                  </View>
                ) : null}

                {selectedEvent?.location ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailIcon}>
                      📍
                    </Text>

                    <View style={styles.detailRowContent}>
                      <Text style={styles.detailLabel}>
                        LOCATION
                      </Text>

                      <Text style={styles.detailValue}>
                        {selectedEvent.location}
                      </Text>
                    </View>
                  </View>
                ) : null}

                {selectedEvent?.organizing_branch ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailIcon}>
                      🏛
                    </Text>

                    <View style={styles.detailRowContent}>
                      <Text style={styles.detailLabel}>
                        ORGANISING BRANCH
                      </Text>

                      <Text style={styles.detailValue}>
                        {selectedEvent.organizing_branch}
                      </Text>
                    </View>
                  </View>
                ) : null}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  header: {
    paddingTop: 55,
    paddingHorizontal: 18,
    paddingBottom: 25,
  },

  headerEyebrow: {
    color: '#F7CACA',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 5,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },

  headerText: {
    color: '#F2DADA',
    fontSize: 12,
    marginTop: 5,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111111',
    marginHorizontal: 18,
    marginTop: 23,
    marginBottom: 13,
  },

  loadingBox: {
    marginHorizontal: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: '#777777',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 9,
  },

  emptyCard: {
    marginHorizontal: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#000000',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 3,
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },

  emptyIconText: {
    fontSize: 25,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#171717',
  },

  emptyText: {
    fontSize: 11,
    lineHeight: 17,
    color: '#777777',
    textAlign: 'center',
    marginTop: 6,
  },

  eventCard: {
    marginHorizontal: 18,
    marginBottom: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',

    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 3,
  },

  eventImage: {
    width: '100%',
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },

  imagePlaceholderIcon: {
    fontSize: 42,
    opacity: 0.9,
  },

  eventMain: {
    flexDirection: 'row',
    padding: 15,
  },

  dateBox: {
    width: 58,
    height: 66,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  month: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },

  date: {
    fontSize: 23,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 1,
  },

  eventContent: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },

  eventTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#171717',
  },

  eventText: {
    fontSize: 11,
    color: '#777777',
    marginTop: 5,
    lineHeight: 16,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
  },

  metaIcon: {
    fontSize: 10,
    width: 18,
  },

  metaText: {
    flex: 1,
    fontSize: 10,
    color: '#666666',
    lineHeight: 15,
    fontWeight: '600',
  },

  tapHint: {
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingHorizontal: 15,
    paddingVertical: 9,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  tapHintText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#C62828',
    letterSpacing: 1,
  },

  arrow: {
    fontSize: 21,
    color: '#C62828',
    fontWeight: '900',
    lineHeight: 18,
  },

  infoCard: {
    marginHorizontal: 18,
    marginTop: 8,
    padding: 16,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',

    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 4,
  },

  infoIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoIcon: {
    fontSize: 22,
  },

  infoContent: {
    flex: 1,
    marginLeft: 13,
  },

  infoTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },

  infoText: {
    fontSize: 11,
    color: '#F5DCDC',
    lineHeight: 17,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
  },

  modalCard: {
    backgroundColor: '#FFFFFF',
    maxHeight: '92%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },

  closeButton: {
    position: 'absolute',
    right: 15,
    top: 15,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 30,
  },

  detailImage: {
    width: '100%',
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },

  detailPlaceholderIcon: {
    fontSize: 55,
  },

  detailContent: {
    padding: 20,
    paddingBottom: 35,
  },

  detailEyebrow: {
    color: '#C62828',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 7,
  },

  detailTitle: {
    color: '#111111',
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '900',
  },

  detailDescription: {
    color: '#666666',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
  },

  detailDivider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 17,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },

  detailIcon: {
    width: 34,
    fontSize: 17,
  },

  detailRowContent: {
    flex: 1,
  },

  detailLabel: {
    fontSize: 8,
    color: '#999999',
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 3,
  },

  detailValue: {
    fontSize: 13,
    color: '#222222',
    fontWeight: '700',
    lineHeight: 19,
  },
});