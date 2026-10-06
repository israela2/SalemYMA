import { Slot, router, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { supabase } from '../lib/supabase';
import { registerForNotifications, setupNotificationHandler } from '../lib/notification-service';

function WebNavItem({
  label,
  icon,
  href,
  active,
}: {
  label: string;
  icon: string;
  href: string;
  active: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push(href as never)}
      style={({ hovered, pressed }) => ({
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: 0,
        width: '20%',
        minWidth: 0,
        maxWidth: '20%',
        height: 58,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: active
          ? '#FBEAEA'
          : hovered || pressed
            ? '#F7F7F7'
            : 'transparent',
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <Text
        style={{
          fontSize: 18,
          lineHeight: 21,
          color: active ? '#C62828' : '#777777',
          fontWeight: '900',
        }}
      >
        {icon}
      </Text>
      <Text
        style={{
          marginTop: 2,
          fontSize: 10,
          lineHeight: 12,
          color: active ? '#C62828' : '#666666',
          fontWeight: '800',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function WebRootLayout() {
  const pathname = usePathname();
  const [session, setSession] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const isPublicPage =
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    pathname === '/admin-signup' ||
    pathname.startsWith('/admin-signup/');

  useEffect(() => {
    setupNotificationHandler();
  }, []);

  useEffect(() => {
    if (!session) return;

    registerForNotifications().catch((error) => {
      console.log('[Notifications] registration skipped:', error?.message || error);
    });
  }, [session]);

  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel(`global-notifications-${session.user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: 'is_published=eq.true',
        },
        (payload) => {
          const row = payload.new as {
            title?: string;
            body?: string;
            data?: Record<string, any>;
          };

          if (row.data?.type !== 'news') return;

          if (
            typeof window !== 'undefined' &&
            'Notification' in window &&
            Notification.permission === 'granted'
          ) {
            try {
              new Notification(row.title || 'New YMA Salem Branch News', {
                body:
                  row.body ||
                  'A new YMA Salem Branch news or announcement is available.',
                data: row.data || {},
                icon: '/favicon.png',
              });
            } catch {}
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (mounted) {
        setSession(session);
        setCheckingAuth(false);
      }
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setCheckingAuth(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (checkingAuth) return;

    if (!session && !isPublicPage) {
      router.replace('/login');
      return;
    }

    if (session && pathname === '/login') {
      router.replace('/');
    }
  }, [session, checkingAuth, isPublicPage, pathname]);

  if (checkingAuth) {
    return (
      <View
        style={{
          flex: 1,
          minHeight: '100%',
          backgroundColor: '#111111',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: 18,
            fontWeight: '900',
            letterSpacing: 1,
          }}
        >
          YMA Salem Branch
        </Text>
        <Text
          style={{
            color: '#BDBDBD',
            fontSize: 11,
            marginTop: 7,
          }}
        >
          Checking account...
        </Text>
      </View>
    );
  }

  if (isPublicPage) {
    return (
      <View style={{ flex: 1, minHeight: '100%' }}>
        <Slot />
      </View>
    );
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <View
      style={{
        flex: 1,
        minHeight: '100vh',
        backgroundColor: '#F7F7F7',
      }}
    >
      <View style={{ flex: 1, minHeight: 0, paddingBottom: 88 }}>
        <Slot />
      </View>

      <View
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99999,
          elevation: 99999,
          width: '100%',
          height: 76,
          minHeight: 76,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5E5',
          paddingHorizontal: 0,
          paddingTop: 6,
          paddingBottom: 6,
          alignItems: 'stretch',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
        } as any}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 'none',
            flex: 1,
            flexDirection: 'row',
            alignItems: 'stretch',
            justifyContent: 'space-between',
            gap: 0,
          }}
        >
          <WebNavItem label="Home" icon="⌂" href="/" active={isActive('/')} />
          <WebNavItem
            label="News"
            icon="▤"
            href="/news"
            active={isActive('/news')}
          />
          <WebNavItem
            label="Activity"
            icon="✓"
            href="/activities"
            active={isActive('/activities')}
          />
          <WebNavItem
            label="Branch"
            icon="⌖"
            href="/branches"
            active={isActive('/branches')}
          />
          <WebNavItem
            label="More"
            icon="☰"
            href="/more"
            active={isActive('/more')}
          />
        </View>
      </View>
    </View>
  );
}
