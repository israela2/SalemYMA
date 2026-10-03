import { Platform } from 'react-native';
import Constants from 'expo-constants';
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

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const pushToken = await NotificationsModule.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
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

export async function loadNotifications(limit = 50): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id,title,body,data,created_at')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as AppNotification[];
}

export async function publishNotification(title: string, body: string, data: Record<string, any> = {}) {
  const { data: row, error } = await supabase
    .from('notifications')
    .insert({ title: title.trim(), body: body.trim(), data, is_published: true })
    .select('id,title,body,data,created_at')
    .single();
  if (error) throw error;

  // Trigger native phone push delivery after the notification is stored.
  // Web users use the in-app notification feed; browser push requires a separate
  // service-worker/VAPID setup and should not call the native Expo push function.
  if (Platform.OS !== 'web') try {
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
