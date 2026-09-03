import React, { useCallback, useState } from 'react';
import {
    Alert,
    ImageBackground,
    SafeAreaView,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { useFocusEffect } from 'expo-router';

import AsyncStorage from '@react-native-async-storage/async-storage';

import FlyingBats from '../../components/FlyingBats';


// ========================================
// SERVEUR
// ========================================

const SERVER_URL = 'http://192.168.1.12:3000';


// ========================================
// PALIERS
// ========================================

const LEVELS = [
  {
    number: 3,
    reward: '1 MÈTRE DE SHOTS',
  },

  {
    number: 5,
    reward: 'ENTRÉE REMBOURSÉE',
  },

  {
    number: 10,
    reward: '2 ENTRÉES GRATUITES',
  },

  {
    number: 15,
    reward: '50 € CASH',
  },

  {
    number: 20,
    reward: 'MAGNUM DE BELVEDERE',
  },
];


// ========================================
// ÉCRAN PARRAINAGE
// ========================================

export default function ParrainageScreen() {

  const [referralCode, setReferralCode] =
    useState<string | null>(null);

  const [referrals, setReferrals] =
    useState(0);

  const [loadingReferrals, setLoadingReferrals] =
    useState(false);


  // ========================================
  // RÉCUPÉRER LE CODE PERSONNEL
  // ========================================

  const loadReferralCode = async () => {

    try {

      const savedCode =
        await AsyncStorage.getItem(
          'tnlp_code_parrain'
        );

      console.log(
        'Code de parrainage récupéré :',
        savedCode
      );


      if (savedCode) {

        setReferralCode(
          savedCode.trim().toUpperCase()
        );

      } else {

        setReferralCode(null);
        setReferrals(0);

      }

    } catch (error) {

      console.error(
        'Erreur récupération code parrain :',
        error
      );

      setReferralCode(null);

    }
  };


  // ========================================
  // RÉCUPÉRER LES FILLEULS VALIDÉS
  // ========================================

  const loadReferrals = async (
    code: string
  ) => {

    try {

      setLoadingReferrals(true);

      const response =
        await fetch(
          `${SERVER_URL}/referrals/${encodeURIComponent(code)}`,
          {
            method: 'GET',
          }
        );


      const result =
        await response.json();


      if (!response.ok) {

        throw new Error(
          result.error ||
          'Impossible de récupérer les filleuls.'
        );

      }


      const count =
        Number(result.referrals) || 0;


      console.log(
        'Filleuls validés :',
        count
      );


      setReferrals(count);


    } catch (error) {

      console.error(
        'Erreur récupération filleuls :',
        error
      );

    } finally {

      setLoadingReferrals(false);

    }
  };


  // ========================================
  // CHARGEMENT COMPLET
  // ========================================

  const loadData = async () => {

    try {

      const savedCode =
        await AsyncStorage.getItem(
          'tnlp_code_parrain'
        );


      if (!savedCode) {

        setReferralCode(null);
        setReferrals(0);

        return;
      }


      const cleanCode =
        savedCode
          .trim()
          .toUpperCase();


      setReferralCode(
        cleanCode
      );


      await loadReferrals(
        cleanCode
      );


    } catch (error) {

      console.error(
        'Erreur chargement parrainage :',
        error
      );

    }
  };


  // ========================================
  // RECHARGER À CHAQUE RETOUR SUR L'ONGLET
  // ========================================

  useFocusEffect(
    useCallback(() => {

      loadData();

    }, [])
  );


  // ========================================
  // PROCHAIN PALIER
  // ========================================

  const nextLevel =
    LEVELS.find(
      (level) =>
        referrals < level.number
    );


  const progress =
    nextLevel
      ? Math.min(
          referrals / nextLevel.number,
          1
        )
      : 1;


  // ========================================
  // PARTAGER
  // ========================================

  const shareReferral = async () => {

    if (!referralCode) {

      Alert.alert(
        'Code indisponible',
        'Ton code de parrainage sera disponible après ton inscription à la billetterie.'
      );

      return;
    }


    const referralLink =
      `tnlp://billetterie?code=${referralCode}`;


    try {

      await Share.share({

        message:
          `🎃 Rejoins-moi pour NIGHTMARE - THE NEXT LEVEL PARTY !\n\n` +
          `31 octobre 2026 · Savoie\n\n` +
          `Prends ta place avec mon invitation :\n` +
          `${referralLink}`,

      });


    } catch (error) {

      console.error(
        'Erreur partage :',
        error
      );

    }
  };


  // ========================================
  // AFFICHAGE
  // ========================================

  return (

    <SafeAreaView
      style={styles.container}
    >

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

          {/* TITRE */}

          <Text style={styles.smallTitle}>
            NIGHTMARE
          </Text>


          <Text style={styles.title}>
            PARRAINAGE
          </Text>


          <Text style={styles.subtitle}>
            INVITE TES POTES · GAGNE DES RÉCOMPENSES
          </Text>


          <View style={styles.separator} />


          {/* INTRO */}

          <View style={styles.intro}>

            <Text style={styles.introTitle}>
              THE NEXT LEVEL PARTY
            </Text>


            <Text style={styles.introText}>
              Plus tu invites, plus tu gagnes.
            </Text>


            <Text style={styles.introDescription}>
              Partage ton invitation avec tes amis
              et débloque progressivement les
              récompenses de NIGHTMARE.
            </Text>

          </View>


          {/* CODE */}

          <View style={styles.codeCard}>

            <Text style={styles.cardLabel}>
              TON CODE DE PARRAINAGE
            </Text>


            <Text style={styles.code}>
              {referralCode || 'NON DISPONIBLE'}
            </Text>


            <TouchableOpacity
              style={[
                styles.shareButton,

                !referralCode &&
                  styles.shareButtonDisabled,
              ]}
              activeOpacity={0.8}
              onPress={shareReferral}
              disabled={!referralCode}
            >

              <Text style={styles.shareButtonText}>
                PARTAGER MON INVITATION
              </Text>

            </TouchableOpacity>


            {!referralCode && (

              <Text style={styles.codeInfo}>
                Inscris-toi d'abord à la billetterie
                pour obtenir ton code.
              </Text>

            )}

          </View>


          {/* COMPTEUR */}

          <View style={styles.counterCard}>

            <Text style={styles.counterLabel}>
              TES FILLEULS VALIDÉS
            </Text>


            <Text style={styles.counter}>
              {loadingReferrals
                ? '...'
                : referrals}
            </Text>


            <Text style={styles.counterDescription}>
              filleul{referrals > 1 ? 's' : ''} validé
              {referrals > 1 ? 's' : ''}
            </Text>


            {/* PROGRESSION */}

            <View
              style={styles.progressBackground}
            >

              <View
                style={[
                  styles.progressBar,
                  {
                    width:
                      `${progress * 100}%`,
                  },
                ]}
              />

            </View>


            {/* PROCHAIN PALIER */}

            <Text style={styles.nextReward}>

              {referrals >=
              LEVELS[LEVELS.length - 1].number

                ? '🎉 TOUS LES PALIERS SONT ATTEINTS !'

                : (
                  <>
                    Plus que{' '}

                    {Math.max(
                      (nextLevel?.number || 0) -
                        referrals,
                      0
                    )}

                    {' '}pour atteindre le palier de{' '}

                    {nextLevel?.number}

                    {' '}filleuls
                  </>
                )}

            </Text>

          </View>


          {/* PALIERS */}

          <Text style={styles.sectionTitle}>
            TES RÉCOMPENSES
          </Text>


          {LEVELS.map((level) => {

            const unlocked =
              referrals >= level.number;


            return (

              <View
                key={level.number}
                style={[
                  styles.levelCard,

                  unlocked &&
                    styles.levelCardUnlocked,
                ]}
              >

                {/* NUMÉRO */}

                <View
                  style={[
                    styles.levelNumber,

                    unlocked &&
                      styles.levelNumberUnlocked,
                  ]}
                >

                  <Text
                    style={[
                      styles.levelNumberText,

                      unlocked &&
                        styles.levelNumberTextUnlocked,
                    ]}
                  >
                    {level.number}
                  </Text>

                </View>


                {/* INFORMATIONS */}

                <View
                  style={styles.levelInfo}
                >

                  <Text
                    style={styles.levelTitle}
                  >
                    {level.number} FILLEUL
                    {level.number > 1
                      ? 'S'
                      : ''}
                  </Text>


                  <Text
                    style={[
                      styles.levelReward,

                      unlocked &&
                        styles.levelRewardUnlocked,
                    ]}
                  >
                    {level.reward}
                  </Text>


                  {/* MESSAGE */}

                  <Text
                    style={[
                      styles.levelDescription,

                      unlocked &&
                        styles.levelDescriptionUnlocked,
                    ]}
                  >
                    {unlocked
                      ? 'RÉCOMPENSE DÉBLOQUÉE'
                      : `Encore ${
                          level.number -
                          referrals
                        } filleul${
                          level.number -
                            referrals >
                          1
                            ? 's'
                            : ''
                        }`}
                  </Text>

                </View>


                {/* STATUT */}

                <Text
                  style={[
                    styles.levelStatus,

                    unlocked &&
                      styles.levelStatusUnlocked,
                  ]}
                >
                  {unlocked
                    ? '✓'
                    : '🔒'}
                </Text>

              </View>

            );

          })}


          {/* COMMENT ÇA MARCHE */}

          <View style={styles.infoCard}>

            <Text style={styles.infoTitle}>
              🎃 COMMENT ÇA MARCHE ?
            </Text>


            <Text style={styles.infoText}>
              1. Partage ton invitation avec tes amis.
            </Text>


            <Text style={styles.infoText}>
              2. Tes amis s'inscrivent avec ton code.
            </Text>


            <Text style={styles.infoText}>
              3. Leur paiement est validé par
              l'organisation.
            </Text>


            <Text style={styles.infoText}>
              4. Leur inscription devient un filleul
              validé.
            </Text>


            <Text style={styles.infoText}>
              5. Débloque tes récompenses en
              atteignant les différents paliers.
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


// ========================================
// STYLES
// ========================================

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
    paddingTop: 45,
    paddingBottom: 120,
  },


  // ========================================
  // TITRE
  // ========================================

  smallTitle: {
    color: '#777',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },

  title: {
    color: '#ff5a00',
    fontSize: 40,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 12,
  },

  subtitle: {
    color: '#777',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 10,
    letterSpacing: 1,
  },

  separator: {
    height: 1,
    backgroundColor: '#222',
    marginTop: 38,
    marginBottom: 38,
  },


  // ========================================
  // INTRO
  // ========================================

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
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
  },

  introDescription: {
    color: '#777',
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 12,
  },


  // ========================================
  // CODE
  // ========================================

  codeCard: {
    backgroundColor: 'rgba(16, 16, 16, 0.94)',
    borderWidth: 1,
    borderColor: '#292929',
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    marginBottom: 16,
  },

  cardLabel: {
    color: '#666',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
  },

  code: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 14,
  },

  shareButton: {
    backgroundColor: '#ff5a00',
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  },

  shareButtonDisabled: {
    backgroundColor: '#292929',
  },

  shareButtonText: {
    color: '#050505',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },

  codeInfo: {
    color: '#666',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 12,
  },


  // ========================================
  // COMPTEUR
  // ========================================

  counterCard: {
    backgroundColor: 'rgba(16, 16, 16, 0.94)',
    borderWidth: 1,
    borderColor: '#292929',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    marginBottom: 30,
  },

  counterLabel: {
    color: '#666',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
  },

  counter: {
    color: '#ff5a00',
    fontSize: 58,
    fontWeight: '900',
    marginTop: 8,
  },

  counterDescription: {
    color: '#777',
    fontSize: 11,
    marginTop: -4,
  },

  progressBackground: {
    width: '100%',
    height: 8,
    backgroundColor: '#252525',
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 25,
  },

  progressBar: {
    height: '100%',
    backgroundColor: '#ff5a00',
    borderRadius: 10,
  },

  nextReward: {
    color: '#777',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 12,
  },


  // ========================================
  // PALIERS
  // ========================================

  sectionTitle: {
    color: '#777',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 16,
  },

  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 16, 16, 0.94)',
    borderWidth: 1,
    borderColor: '#292929',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },

  levelCardUnlocked: {
    borderColor: '#ff5a00',
  },

  levelNumber: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#252525',
    alignItems: 'center',
    justifyContent: 'center',
  },

  levelNumberUnlocked: {
    backgroundColor: '#ff5a00',
  },

  levelNumberText: {
    color: '#777',
    fontSize: 18,
    fontWeight: '900',
  },

  levelNumberTextUnlocked: {
    color: '#050505',
  },

  levelInfo: {
    flex: 1,
    marginLeft: 15,
  },

  levelTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
  },

  levelReward: {
    color: '#666',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 5,
  },

  levelRewardUnlocked: {
    color: '#ff5a00',
  },

  levelDescription: {
    color: '#555',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 5,
  },

  levelDescriptionUnlocked: {
    color: '#777',
  },

  levelStatus: {
    fontSize: 18,
    marginLeft: 10,
  },

  levelStatusUnlocked: {
    color: '#ff5a00',
  },


  // ========================================
  // INFOS
  // ========================================

  infoCard: {
    backgroundColor: 'rgba(16, 16, 16, 0.88)',
    borderWidth: 1,
    borderColor: '#292929',
    borderRadius: 20,
    padding: 20,
    marginTop: 18,
  },

  infoTitle: {
    color: '#ff5a00',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 12,
  },

  infoText: {
    color: '#777',
    fontSize: 11,
    lineHeight: 18,
    marginBottom: 8,
  },


  // ========================================
  // FOOTER
  // ========================================

  footer: {
    color: '#333',
    fontSize: 9,
    textAlign: 'center',
    marginTop: 45,
  },

});