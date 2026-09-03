import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: '#ff5a00',
        tabBarInactiveTintColor: '#666',

        tabBarStyle: {
          backgroundColor: '#101010',
          borderTopColor: '#222',
          borderTopWidth: 1,
          height: 82,
          paddingTop: 8,
          paddingBottom: 10,
        },

        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },

        tabBarIconStyle: {
          marginBottom: 2,
        },
      }}
    >

      {/* ================================
          ACCUEIL
      ================================= */}

      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="home"
              size={28}
              color={color}
            />
          ),
        }}
      />

      {/* ================================
          SOIRÉE
      ================================= */}

      <Tabs.Screen
        name="explore"
        options={{
          title: 'Soirée',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="ghost"
              size={30}
              color={color}
            />
          ),
        }}
      />

      {/* ================================
          GALERIE
      ================================= */}

      <Tabs.Screen
        name="galerie"
        options={{
          title: 'Galerie',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="image-multiple"
              size={28}
              color={color}
            />
          ),
        }}
      />

      {/* ================================
          BILLETTERIE
      ================================= */}

      <Tabs.Screen
        name="billetterie"
        options={{
          title: 'Billetterie',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="ticket"
              size={28}
              color={color}
            />
          ),
        }}
      />

      {/* ================================
          PARRAINAGE
      ================================= */}

      <Tabs.Screen
        name="parrainage"
        options={{
          title: 'Parrainage',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="account-multiple-plus"
              size={28}
              color={color}
            />
          ),
        }}
      />

      {/* ================================
          MON COMPTE
      ================================= */}

      <Tabs.Screen
        name="compte"
        options={{
          title: 'Mon compte',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="account-circle"
              size={28}
              color={color}
            />
          ),
        }}
      />

      {/* ================================
          ADMIN
      ================================= */}

      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="lock"
              size={27}
              color={color}
            />
          ),
        }}
      />

    </Tabs>
  );
}