import { useRouter } from 'expo-router';
import React from 'react';
import {
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import FlyingBats from '../../components/FlyingBats';

const INSTAGRAM_URL = 'https://www.instagram.com/tnlparty/';

export default function ExploreScreen() {
  const router = useRouter();

  const openTickets = () => {
    router.push('/billetterie');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require('../../assets/images/fond-fumee.png')}
        style={styles.background}
        imageStyle={styles.backgroundImage}
      >
        {/* CHAUVES-SOURIS */}

        <FlyingBats />

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.smallTitle}>NIGHTMARE</Text>

          <Text style={styles.title}>LA SOIRÉE</Text>

          <Text style={styles.date}>31 OCTOBRE 2026</Text>

          <Text style={styles.location}>SAVOIE · FRANCE</Text>

          <View style={styles.separator} />

          {/* INTRODUCTION */}

          <View style={styles.intro}>
            <Text style={styles.introTitle}>
              THE NEXT LEVEL PARTY
            </Text>

            <Text style={styles.introText}>
              Une nuit placée sous le signe d'Halloween.
            </Text>

            <Text style={styles.text}>
              Prépare-toi pour une soirée immersive,
              une ambiance survoltée et une expérience
              pensée pour te faire vivre Halloween
              autrement.
            </Text>
          </View>

          {/* INFOS */}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>INFOS</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>DATE</Text>

              <Text style={styles.infoValue}>
                31 octobre 2026
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>LIEU</Text>

              <Text style={styles.infoValue}>
                Savoie · France
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>HORAIRES</Text>

              <Text style={styles.infoValue}>
                22H30 - 5H
              </Text>
            </View>
          </View>

          {/* PROGRAMME */}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              AU PROGRAMME
            </Text>

            <View style={styles.programRow}>
              <Text style={styles.dot}>•</Text>

              <Text style={styles.programText}>
                OPEN BAR
              </Text>
            </View>

            <View style={styles.programRow}>
              <Text style={styles.dot}>•</Text>

              <Text style={styles.programText}>
                DJ SET
              </Text>
            </View>

            <View style={styles.programRow}>
              <Text style={styles.dot}>•</Text>

              <Text style={styles.programText}>
                Décoration Halloween
              </Text>
            </View>

            <View style={styles.programRow}>
              <Text style={styles.dot}>•</Text>

              <Text style={styles.programText}>
                Ambiance NIGHTMARE
              </Text>
            </View>

            <View style={styles.programRow}>
              <Text style={styles.dot}>•</Text>

              <Text style={styles.programText}>
                D'autres surprises à venir...
              </Text>
            </View>
          </View>

          {/* INFORMATIONS PRATIQUES */}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              INFORMATIONS PRATIQUES
            </Text>

            <View style={styles.practicalRow}>
              <Text style={styles.practicalTitle}>
                Dress code
              </Text>

              <Text style={styles.practicalText}>
                Déguisement d'Halloween (5€ de + si pas de déguisement)
              </Text>
            </View>

            <View style={styles.practicalRow}>
              <Text style={styles.practicalTitle}>
                Horaires
              </Text>

              <Text style={styles.practicalText}>
                22H30 - 5H
              </Text>
            </View>

            <View style={styles.practicalRowLast}>
              <Text style={styles.practicalTitle}>
                Accès
              </Text>

              <Text style={styles.practicalText}>
                Informations à venir
              </Text>
            </View>
          </View>

          {/* BILLETTERIE */}

          <TouchableOpacity
            style={styles.ticketButton}
            onPress={openTickets}
            activeOpacity={0.8}
          >
            <Text style={styles.ticketText}>
              PRENDRE MA PLACE
            </Text>
          </TouchableOpacity>

          {/* INSTAGRAM */}

          <TouchableOpacity
            style={styles.instagramButton}
            onPress={() => {
              import('expo-linking').then((Linking) => {
                Linking.openURL(INSTAGRAM_URL);
              });
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.instagramText}>
              INSTAGRAM · @tnlparty
            </Text>
          </TouchableOpacity>

          {/* RETOUR */}

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.backText}>
              RETOUR
            </Text>
          </TouchableOpacity>

          {/* FOOTER */}

          <Text style={styles.footer}>
            TNLP · THE NEXT LEVEL PARTY
          </Text>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },

  background: {
    flex: 1,
  },

  backgroundImage: {
    resizeMode: 'cover',
    opacity: 0.45,
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 120,
  },

  /* TITRES */

  smallTitle: {
    color: '#777',
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '700',
  },

  title: {
    color: '#ff5a00',
    fontSize: 40,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 12,
  },

  date: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 15,
  },

  location: {
    color: '#777',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 8,
  },

  separator: {
    height: 1,
    backgroundColor: '#222',
    marginVertical: 35,
  },

  /* INTRO */

  intro: {
    alignItems: 'center',
    marginBottom: 25,
  },

  introTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 18,
  },

  introText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 27,
    marginBottom: 14,
  },

  text: {
    color: '#999',
    fontSize: 14,
    lineHeight: 23,
    textAlign: 'center',
  },

  /* CARTES */

  card: {
    backgroundColor: 'rgba(16, 16, 16, 0.94)',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 20,
    padding: 22,
    marginBottom: 16,
  },

  cardTitle: {
    color: '#ff5a00',
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 20,
  },

  /* INFOS */

  infoRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#202020',
    paddingBottom: 15,
    marginBottom: 15,
  },

  infoLabel: {
    color: '#666',
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 6,
  },

  infoValue: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  /* PROGRAMME */

  programRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  dot: {
    color: '#ff5a00',
    fontSize: 20,
    marginRight: 10,
  },

  programText: {
    color: '#ccc',
    fontSize: 14,
    flex: 1,
  },

  /* INFORMATIONS PRATIQUES */

  practicalRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#202020',
    paddingBottom: 15,
    marginBottom: 15,
  },

  practicalRowLast: {
    paddingBottom: 2,
  },

  practicalTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 5,
  },

  practicalText: {
    color: '#777',
    fontSize: 12,
  },

  /* BILLETTERIE */

  ticketButton: {
    backgroundColor: '#ff5a00',
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },

  ticketText: {
    color: '#050505',
    fontSize: 12,
    fontWeight: '900',
  },

  /* INSTAGRAM */

  instagramButton: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 30,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 12,
  },

  instagramText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },

  /* RETOUR */

  backButton: {
    alignItems: 'center',
    paddingVertical: 18,
    marginTop: 12,
  },

  backText: {
    color: '#666',
    fontSize: 11,
    fontWeight: '800',
  },

  /* FOOTER */

  footer: {
    color: '#333',
    fontSize: 8,
    textAlign: 'center',
    marginTop: 25,
  },
});