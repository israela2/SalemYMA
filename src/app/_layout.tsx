import {
  Tabs,
  router,
  usePathname,
} from 'expo-router';

import { useEffect, useState } from 'react';

import {
  Platform,
  Text,
  View,
} from 'react-native';

import { supabase } from '../lib/supabase';

const GUEST_KEY =
  'salem_yma_guest_mode';

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
   * WEB ONLY GUEST MODE
   *
   * Guest mode is stored in sessionStorage.
   *
   * Android/iOS will always keep
   * isGuest = false.
   */
  const [isGuest, setIsGuest] =
    useState(false);

  /*
   * PUBLIC PAGES
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
    let mounted = true;

    async function checkSession() {
      try {
        const {
          data: { session },
        } =
          await supabase.auth.getSession();

        /*
         * Check Guest Mode only on Web.
         */
        let webGuest = false;

        if (
          Platform.OS === 'web' &&
          typeof window !== 'undefined' &&
          typeof window.sessionStorage !==
            'undefined'
        ) {
          webGuest =
            window.sessionStorage.getItem(
              GUEST_KEY,
            ) === 'true';
        }

        if (mounted) {
          setSession(session);
          setIsGuest(webGuest);
        }
      } catch (error) {
        console.log(
          'Session check error:',
          error,
        );

        if (mounted) {
          setSession(null);
          setIsGuest(false);
        }
      } finally {
        if (mounted) {
          setCheckingAuth(false);
        }
      }
    }

    checkSession();

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        (_event, newSession) => {
          if (!mounted) {
            return;
          }

          setSession(newSession);

          /*
           * Real Supabase login:
           * remove Guest Mode.
           */
          if (
            Platform.OS === 'web' &&
            newSession &&
            typeof window !== 'undefined' &&
            typeof window.sessionStorage !==
              'undefined'
          ) {
            window.sessionStorage.removeItem(
              GUEST_KEY,
            );

            setIsGuest(false);
          }

          setCheckingAuth(false);
        },
      );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /*
   * AUTH REDIRECT
   *
   * IMPORTANT:
   * Read sessionStorage directly before
   * redirecting.
   *
   * This fixes the first-time Guest Login
   * race condition.
   */
  useEffect(() => {
    if (checkingAuth) {
      return;
    }

    /*
     * Always get the latest Guest Mode
     * directly from sessionStorage on Web.
     */
    let guestMode = isGuest;

    if (
      Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      typeof window.sessionStorage !==
        'undefined'
    ) {
      guestMode =
        window.sessionStorage.getItem(
          GUEST_KEY,
        ) === 'true';

      /*
       * Keep React state synchronized.
       */
      if (guestMode !== isGuest) {
        setIsGuest(guestMode);
      }
    }

    /*
     * No real session
     * AND no Guest Mode
     * AND not a public page
     *
     * -> Login
     */
    if (
      !session &&
      !guestMode &&
      !isPublicPage
    ) {
      router.replace('/login');
      return;
    }

    /*
     * ONLY a real Supabase session
     * redirects Login -> Home.
     *
     * Guest users are allowed to open
     * Login page.
     */
    if (
      session &&
      pathname === '/login'
    ) {
      router.replace('/');
    }
  }, [
    session,
    isGuest,
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
         * LOGIN / ADMIN SIGNUP
         *
         * Bottom navigation completely hidden.
         *
         * Other pages keep the existing
         * navigation design.
         */
        tabBarStyle: isPublicPage
          ? {
              display: 'none',
              height: 0,
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
          MAIN NAVIGATION
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
          HIDDEN / INTERNAL ROUTES
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

      <Tabs.Screen
        name="login"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="admin-signup"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}