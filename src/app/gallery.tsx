import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { supabase } from '../lib/supabase';

type GalleryItem = {
  id: string;
  title: string;
  album: string;
  media_type: string;
  file_url: string;
  thumbnail_url: string | null;
  created_at: string;
  source: 'legacy' | 'managed';
};


export default function GalleryScreen() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState('');
  const [selectedAlbumKind, setSelectedAlbumKind] = useState<'legacy' | 'managed' | ''>('');
  const [availableAlbums, setAvailableAlbums] = useState<string[]>(['All']);
  const [managedAlbumNames, setManagedAlbumNames] = useState<string[]>([]);
  const [collectionNames, setCollectionNames] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [selectedVideo, setSelectedVideo] =
    useState<GalleryItem | null>(null);

  const [selectedPhoto, setSelectedPhoto] =
    useState<GalleryItem | null>(null);

  const loadGallery = useCallback(async () => {
    setErrorMessage('');

    try {
      /*
       * OLD GALLERY SYSTEM
       * Existing photos/videos are stored in gallery_items.
       */
      const oldResult = await supabase
        .from('gallery_items')
        .select(
          'id, title, album, media_type, file_url, thumbnail_url, created_at'
        )
        .order('created_at', { ascending: false });

      /*
       * NEW GALLERY SYSTEM
       * New admin uploads are stored in gallery.
       */
      const newResult = await supabase
        .from('gallery')
        .select(
          'id, title, category, media_type, image_url, created_at'
        )
        .order('created_at', { ascending: false });

      const { data: albumRows } = await supabase
        .from('gallery_albums')
        .select('title, description')
        .order('created_at', { ascending: false });

      if (oldResult.error && newResult.error) {
        setErrorMessage(
          oldResult.error.message || newResult.error.message
        );
        setItems([]);
        return;
      }

      const oldItems: GalleryItem[] = (
        oldResult.data ?? []
      ).map((item: any) => ({
        id: `old-${item.id}`,
        title: item.title || 'Salem YMA',
        album: item.album || 'Activities',
        media_type:
          item.media_type === 'video'
            ? 'video'
            : 'photo',
        file_url: item.file_url || '',
        thumbnail_url: item.thumbnail_url || null,
        created_at: item.created_at,
        source: 'legacy',
      }));

      const newItems: GalleryItem[] = (
        newResult.data ?? []
      ).map((item: any) => ({
        id: `new-${item.id}`,
        title: item.title || 'Salem YMA',
        album:
          item.media_type === 'video'
            ? 'Videos'
            : item.category || 'Activities',
        media_type:
          item.media_type === 'video'
            ? 'video'
            : 'photo',
        file_url: item.image_url || '',
        thumbnail_url: null,
        created_at: item.created_at,
        source: 'managed',
      }));

      /*
       * Combine both systems.
       * Newest uploads appear first.
       */
      const combined = [
        ...oldItems,
        ...newItems,
      ].sort((a, b) => {
        return (
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
        );
      });

      setItems(combined);
      const albumNames = (albumRows || [])
        .map((album: any) => album.title)
        .filter(Boolean) as string[];

      // Keep older gallery categories accessible as album cards, but do not
      // render them as a separate photo collection below the albums.
      const categoryNames = combined.map((item) => item.album).filter(Boolean);
      const legacyNames = Array.from(new Set(categoryNames))
        .filter((name) => !albumNames.includes(name));

      setManagedAlbumNames(albumNames);
      setCollectionNames(legacyNames);

      const dynamicAlbums = Array.from(
        new Set([...albumNames, ...legacyNames]),
      );

      setAvailableAlbums(['All', ...dynamicAlbums]);

      if (
        selectedAlbum &&
        selectedAlbum !== 'All' &&
        !dynamicAlbums.includes(selectedAlbum)
      ) {
        setSelectedAlbum('');
        setSelectedAlbumKind('');
      }
    } catch (error: any) {
      setErrorMessage(
        error?.message || 'Unable to load gallery.'
      );
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadGallery();

    // Live update: members see newly uploaded/deleted photos and albums
    // without having to leave and reopen the Gallery page.
    const channel = supabase
      .channel('public-gallery-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gallery' },
        () => { loadGallery(); },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gallery_albums' },
        () => { loadGallery(); },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadGallery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGallery();
  };

  const downloadPhoto = async () => {
    if (!selectedPhoto?.file_url) return;

    const safeName = (selectedPhoto.title || 'salem-yma-photo')
      .replace(/[^a-z0-9-_ ]/gi, '')
      .trim()
      .replace(/\s+/g, '-') || 'salem-yma-photo';

    if (Platform.OS === 'web') {
      try {
        // Fetching as a Blob makes the browser download the original image
        // instead of navigating away from the gallery viewer.
        const response = await fetch(selectedPhoto.file_url);
        if (!response.ok) throw new Error('Download failed');
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = `${safeName}.jpg`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(objectUrl);
      } catch {
        // Fallback: open the original image so the user can save it from the browser.
        await Linking.openURL(selectedPhoto.file_url);
      }
      return;
    }

    // On mobile, open the original image; users can save it from the image
    // viewer/browser using their device's Save/Download option.
    try {
      await Linking.openURL(selectedPhoto.file_url);
    } catch {
      Alert.alert('Unable to open photo', 'Please try again later.');
    }
  };

  const filteredItems =
    selectedAlbum === 'All'
      ? items
      : selectedAlbum
        ? items.filter((item) => item.album === selectedAlbum)
        : [];

  const visibleAlbumNames = [...managedAlbumNames, ...collectionNames];
  const renderAlbumCard = (album: string, isManaged: boolean) => {
    const albumItems = items.filter((item) => item.album === album);
    const cover = albumItems.find((item) => !!(item.thumbnail_url || item.file_url));
    const count = albumItems.filter((item) => item.media_type === 'photo').length;
    return (
      <Pressable
        key={`${isManaged ? 'album' : 'collection'}-${album}`}
        onPress={() => { setSelectedAlbum(album); setSelectedAlbumKind(isManaged ? 'managed' : 'legacy'); }}
        style={({ pressed }) => [styles.albumCard, pressed && styles.albumCardPressed]}
      >
        <View style={styles.albumCoverWrap}>
          {cover ? (
            <Image source={{ uri: cover.thumbnail_url || cover.file_url }} style={styles.albumCover} resizeMode="cover" />
          ) : (
            <View style={[styles.albumCover, styles.albumCoverEmpty]}>
              <Text style={styles.albumCoverIcon}>▧</Text>
            </View>
          )}
          <View style={styles.albumCoverShade} />
          <View style={styles.albumPhotoCountPill}>
            <Text style={styles.albumPhotoCountText}>{count} {count === 1 ? 'photo' : 'photos'}</Text>
          </View>
          <View style={styles.albumStackIcon}><Text style={styles.albumStackIconText}>▤</Text></View>
        </View>
        <View style={styles.albumCardDetails}>
          <Text style={styles.albumCardTitle} numberOfLines={2}>{album}</Text>
          <Text style={styles.albumCardMeta}>{isManaged ? 'PHOTO ALBUM' : 'COLLECTION'}</Text>
        </View>
      </Pressable>
    );
  };

  const photoItems = filteredItems.filter(
    (item) =>
      item.media_type === 'photo' &&
      !!item.file_url
  );

  const videoItems = filteredItems.filter(
    (item) =>
      item.media_type === 'video' &&
      !!item.file_url
  );

  return (
    <>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        bounces
        alwaysBounceVertical
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#C62828"
            colors={["#C62828"]}
            progressBackgroundColor="#FFFFFF"
            progressViewOffset={Platform.OS === 'android' ? 8 : 0}
          />
        }
      >
        {/* HEADER */}
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

          <Text style={styles.headerSmall}>
            YMA SALEM BRANCH
          </Text>

          <Text style={styles.headerTitle}>
            Gallery
          </Text>

          <Text style={styles.headerText}>
            Salem YMA photos and memories
          </Text>
        </LinearGradient>

        {/* SECTION TITLE */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionDot} />

          <View>
            <Text style={styles.sectionTitle}>
              Media Collection
            </Text>

            <Text style={styles.sectionSubtitle}>
              Salem YMA photos, videos and memories
            </Text>
          </View>
        </View>

        {selectedAlbum && selectedAlbum !== 'All' ? (
          <Pressable onPress={() => { setSelectedAlbum(''); setSelectedAlbumKind(''); }} style={styles.backToAlbumsButton}>
            <Text style={styles.backToAlbumsText}>‹ Back to albums</Text>
          </Pressable>
        ) : null}

        {/* COUNT */}
        {!loading && !errorMessage && selectedAlbum ? (
          <View style={styles.countRow}>
            <Text style={styles.countText}>
              {filteredItems.length} media item
              {filteredItems.length === 1 ? '' : 's'}
            </Text>
          </View>
        ) : null}

        {/* LOADING */}
        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator
              size="large"
              color="#C62828"
            />

            <Text style={styles.stateTitle}>
              Loading Gallery...
            </Text>

            <Text style={styles.stateText}>
              Salem YMA media te kan load mek.
            </Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.stateCard}>
            <View style={styles.errorIconBox}>
              <Text style={styles.errorIcon}>
                !
              </Text>
            </View>

            <Text style={styles.stateTitle}>
              Gallery load a kal lo
            </Text>

            <Text style={styles.stateText}>
              {errorMessage}
            </Text>

            <Pressable
              onPress={loadGallery}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>
                TRY AGAIN
              </Text>
            </Pressable>
          </View>
        ) : !selectedAlbum ? (
          <View style={styles.albumListing}>
            <View style={styles.albumSectionHeading}>
              <View style={styles.albumSectionHeadingCopy}>
                <Text style={styles.albumSectionTitle}>Albums</Text>
                <Text style={styles.albumSectionSubtitle}>
                  Choose an album to view its photos
                </Text>
              </View>
              <Text style={styles.albumSectionCount}>
                {visibleAlbumNames.length}
              </Text>
            </View>

            {visibleAlbumNames.length > 0 ? (
              <View style={styles.albumCardsGrid}>
                {managedAlbumNames.map((album) =>
                  renderAlbumCard(album, true)
                )}

                {collectionNames.map((album) =>
                  renderAlbumCard(album, false)
                )}
              </View>
            ) : (
              <View style={styles.stateCard}>
                <View style={styles.emptyIconBox}>
                  <Text style={styles.emptyIcon}>🖼️</Text>
                </View>
                <Text style={styles.stateTitle}>No albums yet</Text>
                <Text style={styles.stateText}>
                  New albums and photos will appear here when the admin adds them.
                </Text>
              </View>
            )}
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.stateCard}>
            <View style={styles.emptyIconBox}>
              <Text style={styles.emptyIcon}>
                🖼️
              </Text>
            </View>

            <Text style={styles.stateTitle}>
              Gallery ruai a awm lo
            </Text>

            <Text style={styles.stateText}>
              He album-ah hian media upload tawh a awm lo.
            </Text>
          </View>
        ) : (
          <>
            {/* PHOTO GRID */}
            {photoItems.length > 0 ? (
              <>
                <View style={styles.mediaSectionHeader}>
                  <View style={styles.miniRedBar} />

                  <Text style={styles.mediaSectionTitle}>
                    Photos
                  </Text>
                </View>

                <View style={styles.mediaGrid}>
                  {photoItems.map((item, index) => (
                    <Pressable
                      key={item.id}
                      onPress={() =>
                        setSelectedPhoto(item)
                      }
                      style={({ pressed }) => [
                        styles.mediaCard,
                        index % 2 === 0
                          ? styles.mediaCardLeft
                          : styles.mediaCardRight,
                        pressed &&
                          styles.mediaCardPressed,
                      ]}
                    >
                      <Image
                        source={{
                          uri:
                            item.thumbnail_url ||
                            item.file_url,
                        }}
                        style={styles.mediaImage}
                        resizeMode="cover"
                      />

                      <View style={styles.mediaOverlay}>
                        <View style={styles.albumBadge}>
                          <Text style={styles.albumBadgeText}>
                            {item.album}
                          </Text>
                        </View>

                        <Text
                          style={styles.mediaTitle}
                          numberOfLines={2}
                        >
                          {item.title}
                        </Text>

                        <Text style={styles.mediaDate}>
                          {formatDate(
                            item.created_at
                          )}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}

            {/* VIDEO SECTION */}
            {videoItems.length > 0 ? (
              <View style={styles.videoSection}>
                <View style={styles.videoHeading}>
                  <View style={styles.videoHeadingIcon}>
                    <Text
                      style={
                        styles.videoHeadingIconText
                      }
                    >
                      ▶
                    </Text>
                  </View>

                  <View>
                    <Text
                      style={styles.videoHeadingTitle}
                    >
                      Videos
                    </Text>

                    <Text
                      style={styles.videoHeadingText}
                    >
                      Salem YMA video memories
                    </Text>
                  </View>
                </View>

                {videoItems.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() =>
                      setSelectedVideo(item)
                    }
                    style={styles.videoCard}
                  >
                    <LinearGradient
                      colors={[
                        '#D32F2F',
                        '#8E1B1B',
                        '#0B0B0B',
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.videoPreview}
                    >
                      {item.thumbnail_url ? (
                        <Image
                          source={{
                            uri: item.thumbnail_url,
                          }}
                          style={styles.videoThumbnail}
                          resizeMode="cover"
                        />
                      ) : null}

                      <View
                        style={[
                          styles.videoDarkOverlay,
                          item.thumbnail_url
                            ? styles.videoDarkOverlayWithImage
                            : null,
                        ]}
                      />

                      <View style={styles.playButton}>
                        <Text style={styles.playIcon}>
                          ▶
                        </Text>
                      </View>

                      <View style={styles.videoTitleBox}>
                        <Text
                          style={styles.videoTitle}
                          numberOfLines={2}
                        >
                          {item.title}
                        </Text>
                      </View>
                    </LinearGradient>

                    <View style={styles.videoInfo}>
                      <Text style={styles.videoType}>
                        VIDEO
                      </Text>

                      <Text style={styles.videoDate}>
                        {formatDate(item.created_at)}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </>
        )}

        {/* INFO CARD */}
        <LinearGradient
          colors={['#D32F2F', '#8E1B1B', '#111111']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.infoCard}
        >
          <View style={styles.infoIconBox}>
            <Text style={styles.infoIcon}>
              🖼️
            </Text>
          </View>

          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>
              Salem YMA Gallery
            </Text>

            <Text style={styles.infoText}>
              Salem YMA programme, activity, event leh
              member-te thlalak te hetah hian kan dah ang.
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* PHOTO VIEWER MODAL */}
      <Modal
        visible={selectedPhoto !== null}
        animationType="fade"
        transparent={false}
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={styles.photoModal}>
          <View style={styles.photoModalHeader}>
            <Pressable
              onPress={() => setSelectedPhoto(null)}
              style={styles.photoCloseButton}
            >
              <Text style={styles.photoCloseText}>
                ‹
              </Text>
            </Pressable>

            <View style={styles.photoModalTitleBox}>
              <Text
                style={styles.photoModalTitle}
                numberOfLines={1}
              >
                {selectedPhoto?.title}
              </Text>

              <Text style={styles.photoModalSubtitle}>
                {selectedPhoto?.album}
              </Text>
            </View>

            <Pressable
              onPress={downloadPhoto}
              style={styles.photoDownloadButton}
              accessibilityRole="button"
              accessibilityLabel="Download photo"
            >
              <Text style={styles.photoDownloadText}>↓ Download</Text>
            </Pressable>
          </View>

          {selectedPhoto ? (
            <View style={styles.photoViewer}>
              <Image
                source={{
                  uri:
                    selectedPhoto.thumbnail_url ||
                    selectedPhoto.file_url,
                }}
                style={styles.fullPhoto}
                resizeMode="contain"
              />
            </View>
          ) : null}
        </View>
      </Modal>

      {/* VIDEO PLAYER MODAL */}
      <Modal
        visible={selectedVideo !== null}
        animationType="fade"
        transparent={false}
        onRequestClose={() => setSelectedVideo(null)}
      >
        <View style={styles.videoModal}>
          <View style={styles.videoModalHeader}>
            <Pressable
              onPress={() => setSelectedVideo(null)}
              style={styles.videoCloseButton}
            >
              <Text style={styles.videoCloseText}>
                ‹
              </Text>
            </Pressable>

            <View style={styles.videoModalTitleBox}>
              <Text
                style={styles.videoModalTitle}
                numberOfLines={1}
              >
                {selectedVideo?.title}
              </Text>

              <Text style={styles.videoModalSubtitle}>
                {selectedVideo?.album}
              </Text>
            </View>
          </View>

          {selectedVideo ? (
            <GalleryVideoPlayer
              url={selectedVideo.file_url}
            />
          ) : null}
        </View>
      </Modal>
    </>
  );
}

function GalleryVideoPlayer({
  url,
}: {
  url: string;
}) {
  const player = useVideoPlayer(url, (player) => {
    player.loop = false;
    player.play();
  });

  return (
    <View style={styles.videoPlayerContainer}>
      <VideoView
        player={player}
        style={styles.videoPlayer}
        nativeControls
        contentFit="contain"
      />
    </View>
  );
}

function formatDate(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  backIcon: {
    color: '#FFFFFF',
    fontSize: 31,
    lineHeight: 31,
    marginTop: -3,
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
    fontSize: 28,
    fontWeight: '900',
  },

  headerText: {
    color: '#F5DADA',
    fontSize: 12,
    marginTop: 5,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 18,
    marginTop: 23,
    marginBottom: 13,
  },

  sectionDot: {
    width: 5,
    height: 27,
    borderRadius: 3,
    backgroundColor: '#C62828',
    marginRight: 10,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#151515',
  },

  sectionSubtitle: {
    fontSize: 10,
    color: '#888888',
    marginTop: 2,
  },

  albumScroll: {
    paddingHorizontal: 18,
    paddingBottom: 8,
  },

  albumButton: {
    minWidth: 78,
    height: 38,
    paddingHorizontal: 15,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  albumButtonActive: {
    backgroundColor: '#C62828',
    borderColor: '#C62828',
  },

  albumText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#777777',
  },

  albumTextActive: {
    color: '#FFFFFF',
  },

  countRow: {
    marginHorizontal: 18,
    marginTop: 4,
    marginBottom: 9,
  },

  countText: {
    fontSize: 10,
    color: '#888888',
    fontWeight: '700',
  },

  stateCard: {
    marginHorizontal: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  stateTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#222222',
    marginTop: 13,
    textAlign: 'center',
  },

  stateText: {
    fontSize: 11,
    color: '#777777',
    marginTop: 6,
    lineHeight: 17,
    textAlign: 'center',
  },

  errorIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FBEAEA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  errorIcon: {
    fontSize: 25,
    fontWeight: '900',
    color: '#C62828',
  },

  emptyIconBox: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#FBEAEA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyIcon: {
    fontSize: 28,
  },

  retryButton: {
    marginTop: 16,
    backgroundColor: '#C62828',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },

  retryText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  mediaSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 18,
    marginBottom: 10,
  },

  miniRedBar: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: '#C62828',
    marginRight: 8,
  },

  mediaSectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#222222',
  },

  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 18,
  },

  mediaCard: {
    width: '48%',
    height: 190,
    borderRadius: 17,
    overflow: 'hidden',
    backgroundColor: '#E9E9E9',
    marginBottom: 10,
  },

  mediaCardLeft: {
    marginRight: '4%',
  },

  mediaCardRight: {
    marginRight: 0,
  },

  mediaCardPressed: {
    opacity: 0.78,
    transform: [
      {
        scale: 0.98,
      },
    ],
  },

  mediaImage: {
    width: '100%',
    height: '100%',
  },

  mediaOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 10,
    paddingTop: 28,
    backgroundColor: 'rgba(0,0,0,0.62)',
  },

  albumBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#C62828',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 5,
  },

  albumBadgeText: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: '900',
  },

  mediaTitle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },

  mediaDate: {
    color: '#DDDDDD',
    fontSize: 8,
    marginTop: 5,
  },

  videoSection: {
    marginTop: 9,
  },

  videoHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 18,
    marginBottom: 10,
  },

  videoHeadingIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#FBEAEA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  videoHeadingIconText: {
    color: '#C62828',
    fontSize: 16,
  },

  videoHeadingTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#222222',
  },

  videoHeadingText: {
    fontSize: 10,
    color: '#888888',
    marginTop: 2,
  },

  videoCard: {
    marginHorizontal: 18,
    marginBottom: 12,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  videoPreview: {
    height: 165,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },

  videoThumbnail: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },

  videoDarkOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },

  videoDarkOverlayWithImage: {
    backgroundColor: 'rgba(0,0,0,0.38)',
  },

  playButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  playIcon: {
    color: '#FFFFFF',
    fontSize: 22,
    marginLeft: 3,
  },

  videoTitleBox: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 13,
  },

  videoTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },

  videoInfo: {
    paddingHorizontal: 13,
    paddingVertical: 11,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  videoType: {
    color: '#C62828',
    fontSize: 9,
    fontWeight: '900',
  },

  videoDate: {
    color: '#888888',
    fontSize: 9,
  },

  infoCard: {
    marginHorizontal: 18,
    marginTop: 13,
    padding: 16,
    borderRadius: 19,
    flexDirection: 'row',
  },

  infoIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoIcon: {
    fontSize: 21,
  },

  infoContent: {
    flex: 1,
    marginLeft: 12,
  },

  infoTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  infoText: {
    fontSize: 11,
    color: '#F2DADA',
    marginTop: 5,
    lineHeight: 17,
  },

  bottomSpace: {
    height: 35,
  },

  photoModal: {
    flex: 1,
    backgroundColor: '#000000',
  },

  photoModalHeader: {
    height: 85,
    paddingTop: 15,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },

  photoCloseButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
  },

  photoCloseText: {
    color: '#FFFFFF',
    fontSize: 31,
    lineHeight: 31,
    marginTop: -3,
  },

  photoDownloadButton: {
    minHeight: 38,
    paddingHorizontal: 11,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  photoDownloadText: {
    color: '#111111',
    fontSize: 12,
    fontWeight: '800',
  },

  photoModalTitleBox: {
    flex: 1,
    marginLeft: 12,
  },

  photoModalTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

  photoModalSubtitle: {
    color: '#999999',
    fontSize: 10,
    marginTop: 4,
  },

  photoViewer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },

  fullPhoto: {
    width: '100%',
    height: '100%',
  },

  videoModal: {
    flex: 1,
    backgroundColor: '#000000',
  },

  videoModalHeader: {
    height: 85,
    paddingTop: 15,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },

  videoCloseButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
  },

  videoCloseText: {
    color: '#FFFFFF',
    fontSize: 31,
    lineHeight: 31,
    marginTop: -3,
  },

  videoModalTitleBox: {
    flex: 1,
    marginLeft: 12,
  },

  videoModalTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

  videoModalSubtitle: {
    color: '#999999',
    fontSize: 10,
    marginTop: 4,
  },

  videoPlayerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },

  videoPlayer: {
    width: '100%',
    height: 320,
  },

  albumListing: { paddingBottom: 8 },
  albumSectionHeading: { marginHorizontal: 18, marginTop: 8, marginBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  albumSectionHeadingSpaced: { marginTop: 14, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#EEEEEE' },
  albumSectionHeadingCopy: { flex: 1 },
  albumSectionTitle: { color: '#171717', fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
  albumSectionSubtitle: { color: '#777777', fontSize: 12, marginTop: 4 },
  albumSectionCount: { minWidth: 30, textAlign: 'center', overflow: 'hidden', color: '#8E1B1B', backgroundColor: '#F8EAEA', fontSize: 12, fontWeight: '800', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 14 },
  albumCardsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', paddingHorizontal: 18, paddingBottom: 16, gap: 12 },
  albumCard: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', marginBottom: 4, borderWidth: 1, borderColor: '#EAEAEA', shadowColor: '#000000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  albumCardPressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  albumCoverWrap: { width: '100%', height: 142, backgroundColor: '#F1EEEE', position: 'relative' },
  albumCover: { width: '100%', height: '100%', backgroundColor: '#F0F0F0' },
  albumCoverEmpty: { alignItems: 'center', justifyContent: 'center' },
  albumCoverIcon: { fontSize: 38, color: '#A5A5A5' },
  albumCoverShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.08)' },
  albumPhotoCountPill: { position: 'absolute', right: 8, bottom: 8, backgroundColor: 'rgba(15,15,15,0.76)', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12 },
  albumPhotoCountText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  albumStackIcon: { position: 'absolute', left: 9, top: 9, width: 27, height: 27, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.92)' },
  albumStackIconText: { color: '#8E1B1B', fontSize: 16, fontWeight: '900' },
  albumCardDetails: { paddingHorizontal: 11, paddingTop: 10, paddingBottom: 12, minHeight: 66 },
  albumCardTitle: { color: '#202020', fontSize: 14, lineHeight: 19, fontWeight: '800' },
  albumCardMeta: { color: '#969696', fontSize: 9, letterSpacing: 1, fontWeight: '800', marginTop: 5 },
  backToAlbumsButton: { marginHorizontal: 18, marginBottom: 12, alignSelf: 'flex-start', backgroundColor: '#F4EAEA', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18 },
  backToAlbumsText: { color: '#8E1B1B', fontWeight: '800' },

});