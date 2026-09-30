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
   * Mobile app does not use Guest Mode.
   */
  const [isGuest, setIsGuest] =
    useState(false);

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
    let mounted = true;

async function loginAsGuest() {
  if (Platform.OS !== 'web') {
    return;
  }

  if (guestLoading) {
    return;
  }

  setGuestLoading(true);
  setMessage('');

  try {
    if (
      typeof window !== 'undefined' &&
      typeof window.localStorage !== 'undefined'
    ) {
      window.localStorage.setItem(
        GUEST_KEY,
        'true',
      );

      /*
       * Use a full Web navigation here.
       * This makes _layout.tsx read the saved
       * Guest Mode flag again from localStorage.
       *
       * This code runs ONLY on Web.
       * Android/iOS cannot reach this block.
       */
      window.location.href = '/';
      return;
    }

    setGuestLoading(false);
  } catch (error) {
    console.log(
      'Guest login error:',
      error,
    );

    setGuestLoading(false);

    setMessage(
      'Guest login-ah harsatna a awm. Tih leh rawh.',
    );
  }
}

    /*
     * Logged-in member/admin OR
     * Web Guest:
     *
     * Login page -> Home.
     */
    if (
      (session || isGuest) &&
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