import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

export default function HomeScreen() {
  const router = useRouter();

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const target = new Date('2026-10-31T21:00:00');

    const updateCountdown = () => {
      const now = new Date();
      const difference = target.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        });
        return;
      }

      setTimeLeft({
        days: Math.floor(
          difference / (1000 * 60 * 60 * 24)
        ),
        hours: Math.floor(
          (difference / (1000 * 60 * 60)) % 24
        ),
        minutes: Math.floor(
          (difference / (1000 * 60)) % 60
        ),
        seconds: Math.floor(
          (difference / 1000) % 60
        ),
      });
    };

    updateCountdown();

    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

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
          {/* LOGO */}

          <Text style={styles.logo}>
            TNLP
          </Text>

          <Text style={styles.subtitle}>
            THE NEXT LEVEL PARTY
          </Text>

          <View style={styles.separator} />

          {/* ÉVÉNEMENT */}

          <Text style={styles.smallTitle}>
            PROCHAINE SOIRÉE
          </Text>

          <Text style={styles.eventTitle}>
            NIGHTM☠️RE
          </Text>

          <Text style={styles.date}>
            31 OCTOBRE 2026
          </Text>

          <Text style={styles.location}>
            SAVOIE · FRANCE
          </Text>

          {/* COMPTE À REBOURS */}

          <View style={styles.countdownHeader}>
            <Text style={styles.countdownTitle}>
              LE COMPTE À REBOURS EST LANCÉ
            </Text>
          </View>

          <View style={styles.countdown}>
            <View style={styles.countItem}>
              <Text style={styles.number}>
                {timeLeft.days}
              </Text>

              <Text style={styles.label}>
                JOURS
              </Text>
            </View>

            <Text style={styles.colon}>
              :
            </Text>

            <View style={styles.countItem}>
              <Text style={styles.number}>
                {String(timeLeft.hours).padStart(2, '0')}
              </Text>

              <Text style={styles.label}>
                HEURES
              </Text>
            </View>

            <Text style={styles.colon}>
              :
            </Text>

            <View style={styles.countItem}>
              <Text style={styles.number}>
                {String(timeLeft.minutes).padStart(2, '0')}
              </Text>

              <Text style={styles.label}>
                MIN
              </Text>
            </View>

            <Text style={styles.colon}>
              :
            </Text>

            <View style={styles.countItem}>
              <Text style={styles.number}>
                {String(timeLeft.seconds).padStart(2, '0')}
              </Text>

              <Text style={styles.label}>
                SEC
              </Text>
            </View>
          </View>

          {/* BOUTON BILLETTERIE */}

          <TouchableOpacity
            style={styles.mainButton}
            activeOpacity={0.8}
            onPress={() =>
              router.push('/(tabs)/billetterie')
            }
          >
            <Text style={styles.mainButtonText}>
              BILLETTERIE
            </Text>
          </TouchableOpacity>

          {/* BOUTON SOIRÉE */}

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.8}
            onPress={() =>
              router.push('/(tabs)/explore')
            }
          >
            <Text style={styles.secondaryButtonText}>
              DÉCOUVRIR LA SOIRÉE
            </Text>
          </TouchableOpacity>

          {/* PROCHAIN ÉVÉNEMENT */}

          <View style={styles.nextEvent}>
            <Text style={styles.nextLabel}>
              APRÈS NIGHTMARE...
            </Text>

            <Text style={styles.nextTitle}>
              NEW YEAR 2027
            </Text>

            <Text style={styles.nextDate}>
              31 DÉCEMBRE 2026
            </Text>

            <Text style={styles.comingSoon}>
              INFORMATIONS BIENTÔT
            </Text>
          </View>

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
    opacity: 0.55,
  },

  content: {
    paddingHorizontal: 28,
    paddingTop: 35,
    paddingBottom: 45,
  },

  /* LOGO */

  logo: {
    color: '#ff5a00',
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 12,
    textAlign: 'center',
  },

  subtitle: {
    color: '#666',
    fontSize: 11,
    letterSpacing: 4,
    textAlign: 'center',
    marginTop: 8,
  },

  separator: {
    height: 1,
    backgroundColor: '#222',
    marginTop: 45,
    marginBottom: 45,
  },

  /* ÉVÉNEMENT */

  smallTitle: {
    color: '#777',
    fontSize: 12,
    letterSpacing: 5,
    textAlign: 'center',
  },

  eventTitle: {
    color: '#ff5a00',
    fontSize: 43,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 18,
  },

  date: {
    color: '#fff',
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: 4,
    textAlign: 'center',
    marginTop: 20,
  },

  location: {
    color: '#777',
    fontSize: 12,
    letterSpacing: 4,
    textAlign: 'center',
    marginTop: 10,
  },

  /* COMPTE À REBOURS */

  countdownHeader: {
    marginTop: 75,
    alignItems: 'center',
  },

  countdownTitle: {
    color: '#777',
    fontSize: 10,
    letterSpacing: 4,
    textAlign: 'center',
  },

  countdown: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },

  countItem: {
    alignItems: 'center',
    minWidth: 55,
  },

  number: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '900',
  },

  label: {
    color: '#666',
    fontSize: 8,
    letterSpacing: 2,
    marginTop: 4,
  },

  colon: {
    color: '#ff5a00',
    fontSize: 30,
    fontWeight: '900',
    marginHorizontal: 5,
    marginBottom: 13,
  },

  /* BOUTON PRINCIPAL */

  mainButton: {
    backgroundColor: '#ff5a00',
    borderRadius: 35,
    paddingVertical: 21,
    alignItems: 'center',
    marginTop: 65,
  },

  mainButtonText: {
    color: '#050505',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 4,
  },

  /* BOUTON SECONDAIRE */

  secondaryButton: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 35,
    paddingVertical: 20,
    alignItems: 'center',
    marginTop: 18,
    backgroundColor: 'rgba(5, 5, 5, 0.45)',
  },

  secondaryButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 3,
  },

  /* NEW YEAR */

  nextEvent: {
    backgroundColor: 'rgba(16, 16, 16, 0.88)',
    borderWidth: 1,
    borderColor: '#292929',
    borderRadius: 22,
    padding: 25,
    alignItems: 'center',
    marginTop: 75,
  },

  nextLabel: {
    color: '#666',
    fontSize: 9,
    letterSpacing: 4,
  },

  nextTitle: {
    color: '#fff',
    fontSize: 29,
    fontWeight: '900',
    marginTop: 16,
  },

  nextDate: {
    color: '#777',
    fontSize: 11,
    letterSpacing: 3,
    marginTop: 8,
  },

  comingSoon: {
    color: '#ff5a00',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 3,
    marginTop: 25,
  },

  /* FOOTER */

  footer: {
    color: '#333',
    fontSize: 9,
    letterSpacing: 4,
    textAlign: 'center',
    marginTop: 50,
  },
});