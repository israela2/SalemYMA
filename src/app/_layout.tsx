import { Tabs, router, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { supabase } from '../lib/supabase';
import { registerForNotifications, setupNotificationHandler } from '../lib/notification-service';

function TabIcon({
  icon,
  focused,
}: {
  icon: string;
  focused: boolean;
}) {
  return (
    <View
      style={{
        width: 42,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: focused
          ? '#FBEAEA'
          : 'transparent',
      }}
    >
      <Text
        style={{
          fontSize: 18,
          color: focused
            ? '#C62828'
            : '#777777',
          fontWeight: '800',
        }}
      >
        {icon}
      </Text>
    </View>
  );
}

function MoreIcon({
  focused,
}: {
  focused: boolean;
}) {
  const iconColor = focused
    ? '#C62828'
    : '#777777';

  return (
    <View
      style={{
        width: 42,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: focused
          ? '#FBEAEA'
          : 'transparent',
      }}
    >
      <View
        style={{
          width: 20,
          height: 16,
          justifyContent: 'space-between',
        }}
      >
        <View
          style={{
            width: 20,
            height: 2.5,
            borderRadius: 2,
            backgroundColor: iconColor,
          }}
        />

        <View
          style={{
            width: 14,
            height: 2.5,
            borderRadius: 2,
            backgroundColor: iconColor,
          }}
        />

        <View
          style={{
            width: 20,
            height: 2.5,
            borderRadius: 2,
            backgroundColor: iconColor,
          }}
        />
      </View>
    </View>
  );
}

export default function TabLayout() {
  const pathname = usePathname();

  const [session, setSession] =
    useState<any>(null);

  const [checkingAuth, setCheckingAuth] =
    useState(true);

  /*
   * PUBLIC PAGES
   *
   * User does not need to be logged in
   * to open these pages.
   */
  const isPublicPage =
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    pathname === '/admin-signup' ||
    pathname.startsWith('/admin-signup/');

  /*
   * CHECK SUPABASE SESSION
   */
  useEffect(() => {
    setupNotificationHandler();
  }, []);

  useEffect(() => {
    if (!session) return;
    registerForNotifications().catch((error) => {
      console.log('[Notifications] registration skipped:', error?.message || error);
    });
  }, [session]);

  // Keep a global realtime listener so a newly published announcement can
  // notify the user even when they are on another page of the app.
  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel(`global-notifications-${session.user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: 'is_published=eq.true' },
        (payload) => {
          const row = payload.new as { title?: string; body?: string; data?: Record<string, any> };
          if (row.data?.type !== 'news') return;
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(row.title || 'New Salem YMA News', {
                body: row.body || 'A new Salem YMA news or announcement is available.',
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
    } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setCheckingAuth(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /*
   * AUTH REDIRECT
   */
  useEffect(() => {
    if (checkingAuth) {
      return;
    }

    /*
     * No session:
     * allow Login + Admin Sign Up.
     */
    if (!session && !isPublicPage) {
      router.replace('/login');
      return;
    }

    /*
     * Logged-in user:
     * Login page -> Home.
     *
     * IMPORTANT:
     * Do NOT redirect /admin-signup.
     * This allows the admin request page to open.
     */
    if (
      session &&
      pathname === '/login'
    ) {
      router.replace('/');
    }
  }, [
    session,
    checkingAuth,
    isPublicPage,
    pathname,
  ]);

  /*
   * LOADING SCREEN
   */
  if (checkingAuth) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#111111',
          alignItems: 'center',
          justifyContent: 'center',
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
          YMA SALEM BRANCH
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

  /*
   * TABS
   */
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: '#C62828',
        tabBarInactiveTintColor: '#777777',

        /*
         * Hide bottom tab bar on public pages.
         */
        tabBarStyle: isPublicPage
          ? {
              display: 'none',
            }
          : {
              height: 72,
              paddingTop: 8,
              paddingBottom: 9,
              backgroundColor: '#FFFFFF',
              borderTopWidth: 1,
              borderTopColor: '#E5E5E5',
              elevation: 10,
              shadowColor: '#000000',
              shadowOpacity: 0.1,
              shadowRadius: 12,
              shadowOffset: {
                width: 0,
                height: -4,
              },
            },

        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '800',
          marginTop: 2,
        },

        tabBarIconStyle: {
          marginBottom: 0,
        },
      }}
    >
      {/* =========================
          HOME
          ========================= */}

      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon="⌂"
              focused={focused}
            />
          ),
        }}
      />

      {/* =========================
          NEWS
          ========================= */}

      <Tabs.Screen
        name="news"
        options={{
          title: 'News',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon="▤"
              focused={focused}
            />
          ),
        }}
      />

      {/* =========================
          ACTIVITY
          ========================= */}

      <Tabs.Screen
        name="activities"
        options={{
          title: 'Activity',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon="✓"
              focused={focused}
            />
          ),
        }}
      />

      {/* =========================
          BRANCH
          ========================= */}

      <Tabs.Screen
        name="branches"
        options={{
          title: 'Branch',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon="⌖"
              focused={focused}
            />
          ),
        }}
      />

      {/* =========================
          MORE
          ========================= */}

      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ focused }) => (
            <MoreIcon
              focused={focused}
            />
          ),
        }}
      />

      {/* =========================
          HIDDEN PAGES
          ========================= */}

      <Tabs.Screen
        name="zonun"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="zonun-reader"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="gas-booking"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="cemetery"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="gallery"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="events"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="waste-fee"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />

      {/* =========================
          ABOUT
          HIDDEN FROM NAVIGATION
          ========================= */}

      <Tabs.Screen
        name="about"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="admin"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="add-member"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="member-detail"
        options={{
          href: null,
        }}
      />

      {/* =========================
          LOGIN
          ========================= */}

      <Tabs.Screen
        name="login"
        options={{
          href: null,
        }}
      />

      {/* =========================
          ADMIN SIGN UP
          ========================= */}

      <Tabs.Screen
        name="admin-signup"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}