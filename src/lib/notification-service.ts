import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

declare const require: any;

let NotificationsModule: any = null;
try {
  // Optional until `npx expo install expo-notifications` is run in the project.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  NotificationsModule = require('expo-notifications');
} catch {
  NotificationsModule = null;
}

export type AppNotification = {
  id: number;
  title: string;
  body: string;
  data?: Record<string, any> | null;
  created_at: string;
};

export function setupNotificationHandler() {
  if (!NotificationsModule) return;
  NotificationsModule.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function registerForNotifications() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  let token: string | null = null;
  let platform = Platform.OS === 'web' ? 'web' : Platform.OS;

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return null;
      // Browser push needs a service worker + VAPID subscription. The database
      // row is still useful for the in-app notification feed.
      platform = 'web';
    } else {
      return null;
    }
  } else if (NotificationsModule) {
    const permissions = await NotificationsModule.getPermissionsAsync();
    let finalStatus = permissions.status;
    if (finalStatus !== 'granted') {
      const requested = await NotificationsModule.requestPermissionsAsync();
      finalStatus = requested.status;
    }
    if (finalStatus !== 'granted') return null;

    const pushToken = await NotificationsModule.getExpoPushTokenAsync();
    token = pushToken?.data ?? null;
    platform = Platform.OS;
  }

  if (token) {
    await supabase.from('notification_devices').upsert({
      user_id: user.id,
      platform,
      push_token: token,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,platform,push_token' });
  }

  return { platform, token };
}

const HIDDEN_NOTIFICATIONS_KEY = 'salem_yma_hidden_notifications';

async function getHiddenNotificationIds(): Promise<number[]> {
  try {
    const raw = await AsyncStorage.getItem(HIDDEN_NOTIFICATIONS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(Number).filter(Number.isFinite) : [];
  } catch {
    return [];
  }
}

async function saveHiddenNotificationIds(ids: number[]) {
  await AsyncStorage.setItem(HIDDEN_NOTIFICATIONS_KEY, JSON.stringify(Array.from(new Set(ids))));
}

export async function hideNotification(id: number) {
  const ids = await getHiddenNotificationIds();
  if (!ids.includes(id)) await saveHiddenNotificationIds([...ids, id]);
}

export async function clearAllNotifications() {
  const items = await loadNotifications(500);
  await saveHiddenNotificationIds(items.map((item) => item.id));
}

export async function loadNotifications(limit = 50): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id,title,body,data,created_at')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  const hiddenIds = new Set(await getHiddenNotificationIds());
  return ((data ?? []) as AppNotification[]).filter((item) => !hiddenIds.has(item.id));
}

export async function publishNotification(title: string, body: string, data: Record<string, any> = {}) {
  const { data: row, error } = await supabase
    .from('notifications')
    .insert({ title: title.trim(), body: body.trim(), data, is_published: true })
    .select('id,title,body,data,created_at')
    .single();
  if (error) throw error;

  // Trigger phone push delivery after the notification is stored.
  // Do not fail publishing the announcement if the Edge Function is not
  // deployed/configured yet; the in-app notification remains available.
  try {
    const { error: pushError } = await supabase.functions.invoke('send-notification', {
      body: {
        title: title.trim(),
        body: body.trim(),
        data,
      },
    });
    if (pushError) console.error('[Notifications] Push delivery failed:', pushError);
  } catch (pushError) {
    console.error('[Notifications] Push delivery unavailable:', pushError);
  }

  return row as AppNotification;
}
