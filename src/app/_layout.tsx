import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function RootLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: '#123B5D',
        tabBarInactiveTintColor: '#98A2B3',

        tabBarStyle: {
          height: 68,
          paddingTop: 6,
          paddingBottom: 8,
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
        },

        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Text
              style={{
                color,
                fontSize: size,
              }}
            >
              ⌂
            </Text>
          ),
        }}
      />

      <Tabs.Screen
        name="news"
        options={{
          title: 'News',
          tabBarIcon: ({ color, size }) => (
            <Text
              style={{
                color,
                fontSize: size,
              }}
            >
              ▣
            </Text>
          ),
        }}
      />

      <Tabs.Screen
        name="activities"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color, size }) => (
            <Text
              style={{
                color,
                fontSize: size,
              }}
            >
              ✓
            </Text>
          ),
        }}
      />

      <Tabs.Screen
        name="branches"
        options={{
          title: 'Branch',
          tabBarIcon: ({ color, size }) => (
            <Text
              style={{
                color,
                fontSize: size,
              }}
            >
              ⌂
            </Text>
          ),
        }}
      />

      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => (
            <Text
              style={{
                color,
                fontSize: size,
              }}
            >
              ☰
            </Text>
          ),
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
        name="settings"
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
    </Tabs>
  );
}