import React, { useCallback, useState } from 'react';
import {
  Alert,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useFocusEffect } from 'expo-router';

import FlyingBats from '../../components/FlyingBats';


// ========================================
// ADRESSE DU SERVEUR
// ========================================

const SERVER_URL = "https://tnlp-server.onrender.com";


// ========================================
// TYPES
// ========================================

type Participant = {
  id: string | number;
  prenom: string;
  nom: string;
  mail: string;
  telephone: string;
  tarif: string;
  montant: number;
  statut_paiement: string;
  code_parrain?: string | null;
  parrain_code?: string | null;

  billet_code?: string | null;
  billet_utilise?: boolean | null;
  billet_utilise_at?: string | null;
};


type Reward = {
  id: string | number;
  participant_id: string | number;
  palier: number;
  recompense: string;
  statut: string;
  created_at: string;
  claimed_at?: string | null;

  participant?: {
    prenom: string;
    nom: string;
    code_parrain?: string | null;
  } | null;
};


// ========================================
// ÉCRAN ADMIN
// ========================================

export default function AdminScreen() {

  // ========================================
  // CONNEXION
  // ========================================

  const [pin, setPin] = useState('');

  const [authenticated, setAuthenticated] =
    useState(false);


  // ========================================
  // PARTICIPANTS
  // ========================================

  const [participants, setParticipants] =
    useState<Participant[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [validatingId, setValidatingId] =
    useState<string | number | null>(null);


  // ========================================
  // RÉCOMPENSES
  // ========================================

  const [rewards, setRewards] =
    useState<Reward[]>([]);

  const [loadingRewards, setLoadingRewards] =
    useState(false);

  const [claimingRewardId, setClaimingRewardId] =
    useState<string | number | null>(null);


  // ========================================
  // SCANNER QR
  // ========================================

  const [scannerVisible, setScannerVisible] =
    useState(false);

  const [permission, requestPermission] =
    useCameraPermissions();

  const [scanLocked, setScanLocked] =
    useState(false);

  const [scanLoading, setScanLoading] =
    useState(false);

  const [scanResult, setScanResult] =
    useState<
      'success' |
      'already_used' |
      'invalid' |
      'waiting' |
      null
    >(null);

  const [scannedParticipant, setScannedParticipant] =
    useState<Participant | null>(null);


  // ========================================
  // RÉCUPÉRER LES PARTICIPANTS
  // ========================================

  const loadParticipants = async (
    adminPin: string
  ) => {

    try {

      setLoading(true);

      const response = await fetch(
        `${SERVER_URL}/admin/participants`,
        {
          method: 'GET',

          headers: {
            'x-admin-pin': adminPin,
          },
        }
      );

      const result =
        await response.json();

      if (!response.ok) {

        throw new Error(
          result.error ||
          'Impossible de récupérer les participants.'
        );

      }

      setParticipants(
        result.participants || []
      );

    } catch (error) {

      console.error(
        'Erreur récupération participants :',
        error
      );

      Alert.alert(
        'Erreur',
        error instanceof Error
          ? error.message
          : 'Impossible de contacter le serveur.'
      );

    } finally {

      setLoading(false);

    }
  };


  // ========================================
  // RÉCUPÉRER LES RÉCOMPENSES
  // ========================================

  const loadRewards = async (
    adminPin: string
  ) => {

    try {

      setLoadingRewards(true);

      const response = await fetch(
        `${SERVER_URL}/admin/rewards`,
        {
          method: 'GET',

          headers: {
            'x-admin-pin': adminPin,
          },
        }
      );

      const result =
        await response.json();

      if (!response.ok) {

        throw new Error(
          result.error ||
          'Impossible de récupérer les récompenses.'
        );

      }

      setRewards(
        result.rewards || []
      );

    } catch (error) {

      console.error(
        'Erreur récupération récompenses :',
        error
      );

      Alert.alert(
        'Erreur',
        error instanceof Error
          ? error.message
          : 'Impossible de récupérer les récompenses.'
      );

    } finally {

      setLoadingRewards(false);

    }
  };


  // ========================================
  // CHARGEMENT COMPLET
  // ========================================

  const loadAdminData = async (
    adminPin: string
  ) => {

    await Promise.all([
      loadParticipants(adminPin),
      loadRewards(adminPin),
    ]);

  };


  // ========================================
  // CONNEXION ADMIN
  // ========================================

  const login = async () => {

    if (!pin.trim()) {

      Alert.alert(
        'Code manquant',
        'Entre ton code administrateur.'
      );

      return;
    }

    try {

      setLoading(true);

      const response = await fetch(
        `${SERVER_URL}/admin/participants`,
        {
          method: 'GET',

          headers: {
            'x-admin-pin': pin.trim(),
          },
        }
      );

      const result =
        await response.json();

      if (!response.ok) {

        Alert.alert(
          'Accès refusé',
          result.error ||
          'Code administrateur incorrect.'
        );

        return;
      }

      setAuthenticated(true);

      setParticipants(
        result.participants || []
      );

      await loadRewards(
        pin.trim()
      );

    } catch (error) {

      console.error(
        'Erreur connexion admin :',
        error
      );

      Alert.alert(
        'Erreur',
        'Impossible de contacter le serveur.'
      );

    } finally {

      setLoading(false);

    }
  };


  // ========================================
  // ACTUALISER
  // ========================================

  const refresh = async () => {

    if (!pin) {
      return;
    }

    await loadAdminData(pin);
  };


  // ========================================
  // VALIDATION PAIEMENT
  // ========================================

  const validatePayment = async (
    participant: Participant
  ) => {

    Alert.alert(
      'Confirmer le paiement',

      `Confirmer que ${participant.prenom} ${participant.nom} a bien payé ${participant.montant} € ?`,

      [
        {
          text: 'ANNULER',
          style: 'cancel',
        },

        {
          text: 'VALIDER',

          onPress: async () => {

            try {

              setValidatingId(
                participant.id
              );

              const response =
                await fetch(
                  `${SERVER_URL}/admin/validate-payment`,
                  {
                    method: 'POST',

                    headers: {
                      'Content-Type':
                        'application/json',

                      'x-admin-pin':
                        pin,
                    },

                    body: JSON.stringify({
                      participantId:
                        participant.id,
                    }),
                  }
                );

              const result =
                await response.json();

              if (!response.ok) {

                throw new Error(
                  result.error ||
                  'Impossible de valider le paiement.'
                );

              }

              Alert.alert(
                'Paiement validé ✅',

                result.billet_code
                  ? `Paiement validé.\n\nBillet créé : ${result.billet_code}`
                  : result.parrainage_valide
                    ? 'Le paiement est validé et le parrainage a également été validé.'
                    : 'Le paiement est validé.'
              );

              await loadAdminData(pin);

            } catch (error) {

              console.error(
                'Erreur validation paiement :',
                error
              );

              Alert.alert(
                'Erreur',
                error instanceof Error
                  ? error.message
                  : 'Impossible de valider le paiement.'
              );

            } finally {

              setValidatingId(null);

            }

          },
        },
      ]
    );
  };


  // ========================================
  // MARQUER RÉCOMPENSE COMME REMISE
  // ========================================

  const claimReward = async (
    reward: Reward
  ) => {

    const participantName =
      reward.participant
        ? `${reward.participant.prenom} ${reward.participant.nom}`
        : 'ce participant';


    Alert.alert(
      'Confirmer la remise',

      `Confirmer que la récompense "${reward.recompense}" a bien été remise à ${participantName} ?`,

      [
        {
          text: 'ANNULER',
          style: 'cancel',
        },

        {
          text: 'CONFIRMER',

          onPress: async () => {

            try {

              setClaimingRewardId(
                reward.id
              );

              const response =
                await fetch(
                  `${SERVER_URL}/admin/claim-reward`,
                  {
                    method: 'POST',

                    headers: {
                      'Content-Type':
                        'application/json',

                      'x-admin-pin':
                        pin,
                    },

                    body: JSON.stringify({
                      rewardId:
                        reward.id,
                    }),
                  }
                );

              const result =
                await response.json();

              if (!response.ok) {

                throw new Error(
                  result.error ||
                  'Impossible de remettre la récompense.'
                );

              }

              Alert.alert(
                'Récompense remise ✅',
                reward.recompense
              );

              await loadRewards(pin);

            } catch (error) {

              console.error(
                'Erreur remise récompense :',
                error
              );

              Alert.alert(
                'Erreur',
                error instanceof Error
                  ? error.message
                  : 'Impossible de remettre la récompense.'
              );

            } finally {

              setClaimingRewardId(null);

            }

          },
        },
      ]
    );
  };


  // ========================================
  // SCANNER
  // OUVRIR
  // ========================================

  const openScanner = async () => {

    setScanResult(null);
    setScannedParticipant(null);
    setScanLocked(false);
    setScanLoading(false);

    if (!permission) {
      const result =
        await requestPermission();

      if (!result.granted) {

        Alert.alert(
          'Caméra refusée',
          'Autorise l’accès à la caméra pour scanner les billets.'
        );

        return;
      }
    }

    if (!permission?.granted) {

      const result =
        await requestPermission();

      if (!result.granted) {

        Alert.alert(
          'Caméra refusée',
          'Autorise l’accès à la caméra pour scanner les billets.'
        );

        return;
      }
    }

    setScannerVisible(true);
  };


  // ========================================
  // SCANNER
  // FERMER
  // ========================================

  const closeScanner = () => {

    setScannerVisible(false);

    setScanLocked(false);
    setScanLoading(false);

    setScanResult(null);
    setScannedParticipant(null);
  };


  // ========================================
  // SCANNER
  // TRAITER QR
  // ========================================

  const handleBarcodeScanned = async ({
    data,
  }: {
    data: string;
  }) => {

    if (
      scanLocked ||
      scanLoading ||
      !data
    ) {
      return;
    }

    setScanLocked(true);
    setScanLoading(true);
    setScanResult('waiting');

    try {

      const response =
        await fetch(
          `${SERVER_URL}/admin/scan-ticket`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              'x-admin-pin':
                pin,
            },

            body: JSON.stringify({
              billet_code:
                data.trim().toUpperCase(),
            }),
          }
        );

      const result =
        await response.json();

      if (response.ok) {

        setScanResult('success');

        setScannedParticipant(
          result.participant || null
        );

        await loadParticipants(pin);

        return;
      }

      if (
        result.deja_utilise === true
      ) {

        setScanResult(
          'already_used'
        );

        setScannedParticipant(
          result.participant || null
        );

        return;
      }

      setScanResult('invalid');

      setScannedParticipant(
        result.participant || null
      );

    } catch (error) {

      console.error(
        'Erreur scan billet :',
        error
      );

      setScanResult('invalid');

      Alert.alert(
        'Erreur',
        error instanceof Error
          ? error.message
          : 'Impossible de contacter le serveur.'
      );

    } finally {

      setScanLoading(false);

    }
  };


  // ========================================
  // SCANNER
  // RECOMMENCER
  // ========================================

  const resetScanner = () => {

    setScanLocked(false);
    setScanLoading(false);

    setScanResult(null);
    setScannedParticipant(null);

  };


  // ========================================
  // RECHARGER EN REVENANT SUR LA PAGE
  // ========================================

  useFocusEffect(
    useCallback(() => {

      if (
        authenticated &&
        pin &&
        !scannerVisible
      ) {

        loadAdminData(pin);

      }

    }, [authenticated, scannerVisible])
  );


  // ========================================
  // STATISTIQUES
  // ========================================

  const totalParticipants =
    participants.length;


  const paidParticipants =
    participants.filter(
      participant =>
        participant.statut_paiement ===
        'paye'
    ).length;


  const waitingParticipants =
    participants.filter(
      participant =>
        participant.statut_paiement !==
        'paye'
    ).length;


  const usedTickets =
    participants.filter(
      participant =>
        participant.billet_utilise ===
        true
    ).length;


  const pendingRewards =
    rewards.filter(
      reward =>
        reward.statut !== 'remise'
    );


  // ========================================
  // ÉCRAN CONNEXION
  // ========================================

  if (!authenticated) {

    return (

      <SafeAreaView
        style={styles.container}
      >

        <ImageBackground
          source={require(
            '../../assets/images/fond-fumee.png'
          )}
          style={styles.background}
          imageStyle={styles.backgroundImage}
        >

          <FlyingBats />

          <ScrollView
            contentContainerStyle={
              styles.loginContent
            }
            keyboardShouldPersistTaps="handled"
          >

            <Text
              style={styles.smallTitle}
            >
              TNLP
            </Text>


            <Text
              style={styles.title}
            >
              ADMIN
            </Text>


            <Text
              style={styles.subtitle}
            >
              ESPACE ORGANISATEUR
            </Text>


            <View
              style={styles.separator}
            />


            <View
              style={styles.loginCard}
            >

              <Text
                style={styles.loginTitle}
              >
                ACCÈS ADMINISTRATEUR
              </Text>


              <Text
                style={
                  styles.loginDescription
                }
              >
                Entre ton code administrateur pour
                accéder à la gestion des paiements,
                des récompenses et des billets.
              </Text>


              <TextInput
                style={styles.pinInput}
                value={pin}
                onChangeText={setPin}
                placeholder="Code PIN"
                placeholderTextColor="#555"
                keyboardType="number-pad"
                secureTextEntry
                maxLength={20}
                onSubmitEditing={login}
              />


              <TouchableOpacity
                style={styles.loginButton}
                activeOpacity={0.8}
                onPress={login}
                disabled={loading}
              >

                <Text
                  style={
                    styles.loginButtonText
                  }
                >

                  {loading
                    ? 'CONNEXION...'
                    : "ACCÉDER À L'ADMIN"}

                </Text>

              </TouchableOpacity>


              <TouchableOpacity
                style={styles.backButton}
                activeOpacity={0.8}
                onPress={() =>
                  router.back()
                }
              >

                <Text
                  style={styles.backText}
                >
                  RETOUR
                </Text>

              </TouchableOpacity>

            </View>


            <Text
              style={styles.footer}
            >
              TNLP · THE NEXT LEVEL PARTY
            </Text>

          </ScrollView>

        </ImageBackground>

      </SafeAreaView>

    );
  }


  // ========================================
  // SCANNER OUVERT
  // ========================================

  if (scannerVisible) {

    return (

      <SafeAreaView
        style={styles.scannerScreen}
      >

        <View
          style={styles.scannerHeader}
        >

          <TouchableOpacity
            style={
              styles.scannerCloseButton
            }
            activeOpacity={0.8}
            onPress={
              closeScanner
            }
          >

            <Text
              style={
                styles.scannerCloseText
              }
            >
              ✕
            </Text>

          </TouchableOpacity>


          <View
            style={
              styles.scannerHeaderCenter
            }
          >

            <Text
              style={
                styles.scannerHeaderSmall
              }
            >
              NIGHTMARE
            </Text>

            <Text
              style={
                styles.scannerHeaderTitle
              }
            >
              SCANNER
            </Text>

          </View>


          <View
            style={
              styles.scannerHeaderSpacer
            }
          />

        </View>


        <View
          style={styles.cameraWrapper}
        >

          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            onBarcodeScanned={
              scanLocked
                ? undefined
                : handleBarcodeScanned
            }
          >

            <View
              style={
                styles.cameraOverlay
              }
            >

              <View
                style={
                  styles.scanFrame
                }
              >

                <View
                  style={[
                    styles.corner,
                    styles.cornerTopLeft,
                  ]}
                />

                <View
                  style={[
                    styles.corner,
                    styles.cornerTopRight,
                  ]}
                />

                <View
                  style={[
                    styles.corner,
                    styles.cornerBottomLeft,
                  ]}
                />

                <View
                  style={[
                    styles.corner,
                    styles.cornerBottomRight,
                  ]}
                />

              </View>


              {!scanResult && (
                <Text
                  style={
                    styles.scanInstruction
                  }
                >
                  PLACE LE QR CODE DANS LE CADRE
                </Text>
              )}

            </View>

          </CameraView>

        </View>


        {/* ========================================
            RÉSULTAT SCAN
        ======================================== */}

        {scanResult && (

          <View
            style={[
              styles.scanResultCard,

              scanResult === 'success' &&
                styles.scanResultSuccess,

              scanResult === 'already_used' &&
                styles.scanResultAlreadyUsed,

              scanResult === 'invalid' &&
                styles.scanResultInvalid,

              scanResult === 'waiting' &&
                styles.scanResultWaiting,
            ]}
          >

            {scanResult === 'waiting' && (

              <>
                <Text
                  style={
                    styles.resultIcon
                  }
                >
                  ⏳
                </Text>

                <Text
                  style={
                    styles.resultTitle
                  }
                >
                  VÉRIFICATION...
                </Text>

                <Text
                  style={
                    styles.resultText
                  }
                >
                  Vérification du billet en cours.
                </Text>
              </>

            )}


            {scanResult === 'success' && (

              <>
                <Text
                  style={
                    styles.resultIcon
                  }
                >
                  ✅
                </Text>

                <Text
                  style={
                    styles.resultSuccessTitle
                  }
                >
                  ENTRÉE AUTORISÉE
                </Text>

                {scannedParticipant && (

                  <>
                    <Text
                      style={
                        styles.resultParticipant
                      }
                    >
                      {
                        scannedParticipant.prenom
                      }{' '}
                      {
                        scannedParticipant.nom
                      }
                    </Text>

                    <Text
                      style={
                        styles.resultTicket
                      }
                    >
                      {scannedParticipant.tarif}
                    </Text>

                  </>

                )}

                <Text
                  style={
                    styles.resultText
                  }
                >
                  Le billet a été marqué comme utilisé.
                </Text>

              </>

            )}


            {scanResult === 'already_used' && (

              <>
                <Text
                  style={
                    styles.resultIcon
                  }
                >
                  ⚠️
                </Text>

                <Text
                  style={
                    styles.resultWarningTitle
                  }
                >
                  BILLET DÉJÀ UTILISÉ
                </Text>

                {scannedParticipant && (

                  <Text
                    style={
                      styles.resultParticipant
                    }
                  >
                    {
                      scannedParticipant.prenom
                    }{' '}
                    {
                      scannedParticipant.nom
                    }
                  </Text>

                )}

                <Text
                  style={
                    styles.resultText
                  }
                >
                  Cette place a déjà été scannée.
                </Text>

              </>

            )}


            {scanResult === 'invalid' && (

              <>
                <Text
                  style={
                    styles.resultIcon
                  }
                >
                  ❌
                </Text>

                <Text
                  style={
                    styles.resultErrorTitle
                  }
                >
                  BILLET INVALIDE
                </Text>

                <Text
                  style={
                    styles.resultText
                  }
                >
                  Ce billet n'est pas valide ou ne peut
                  pas être utilisé.
                </Text>
              </>

            )}


            {scanResult !== 'waiting' && (

              <TouchableOpacity
                style={
                  styles.scanAgainButton
                }
                activeOpacity={0.8}
                onPress={
                  resetScanner
                }
              >

                <Text
                  style={
                    styles.scanAgainText
                  }
                >
                  SCANNER UN AUTRE BILLET
                </Text>

              </TouchableOpacity>

            )}

          </View>

        )}

      </SafeAreaView>

    );
  }


  // ========================================
  // ADMIN
  // ========================================

  return (

    <SafeAreaView
      style={styles.container}
    >

      <ImageBackground
        source={require(
          '../../assets/images/fond-fumee.png'
        )}
        style={styles.background}
        imageStyle={styles.backgroundImage}
      >

        <FlyingBats />

        <ScrollView
          contentContainerStyle={
            styles.content
          }
          showsVerticalScrollIndicator={false}
        >

          <Text
            style={styles.smallTitle}
          >
            TNLP
          </Text>


          <Text
            style={styles.title}
          >
            ADMIN
          </Text>


          <Text
            style={styles.subtitle}
          >
            GESTION DE LA BILLETTERIE
          </Text>


          <View
            style={styles.separator}
          />


          {/* ========================================
              SCANNER BILLET
          ======================================== */}

          <TouchableOpacity
            style={
              styles.scannerButton
            }
            activeOpacity={0.8}
            onPress={
              openScanner
            }
          >

            <Text
              style={
                styles.scannerButtonIcon
              }
            >
              📷
            </Text>

            <View
              style={
                styles.scannerButtonInfo
              }
            >

              <Text
                style={
                  styles.scannerButtonTitle
                }
              >
                SCANNER UN BILLET
              </Text>

              <Text
                style={
                  styles.scannerButtonText
                }
              >
                Contrôler et valider l'entrée
              </Text>

            </View>

            <Text
              style={
                styles.scannerButtonArrow
              }
            >
              ›
            </Text>

          </TouchableOpacity>


          {/* ========================================
              STATISTIQUES
          ======================================== */}

          <View
            style={styles.statsCard}
          >

            <Text
              style={styles.cardTitle}
            >
              VUE D'ENSEMBLE
            </Text>


            <View
              style={styles.statsRow}
            >

              <View
                style={styles.stat}
              >

                <Text
                  style={styles.statNumber}
                >
                  {totalParticipants}
                </Text>

                <Text
                  style={styles.statLabel}
                >
                  PARTICIPANTS
                </Text>

              </View>


              <View
                style={styles.stat}
              >

                <Text
                  style={[
                    styles.statNumber,
                    styles.paidNumber,
                  ]}
                >
                  {paidParticipants}
                </Text>

                <Text
                  style={styles.statLabel}
                >
                  PAYÉS
                </Text>

              </View>


              <View
                style={styles.stat}
              >

                <Text
                  style={[
                    styles.statNumber,
                    styles.waitingNumber,
                  ]}
                >
                  {waitingParticipants}
                </Text>

                <Text
                  style={styles.statLabel}
                >
                  EN ATTENTE
                </Text>

              </View>


              <View
                style={styles.stat}
              >

                <Text
                  style={[
                    styles.statNumber,
                    styles.usedNumber,
                  ]}
                >
                  {usedTickets}
                </Text>

                <Text
                  style={styles.statLabel}
                >
                  ENTRÉS
                </Text>

              </View>

            </View>

          </View>


          {/* ========================================
              RÉCOMPENSES
          ======================================== */}

          <View
            style={styles.sectionHeader}
          >

            <Text
              style={styles.sectionTitle}
            >
              🎁 RÉCOMPENSES
            </Text>

            <TouchableOpacity
              style={styles.refreshButton}
              activeOpacity={0.8}
              onPress={refresh}
              disabled={
                loading ||
                loadingRewards
              }
            >

              <Text
                style={styles.refreshText}
              >

                {loading ||
                loadingRewards
                  ? '...'
                  : 'ACTUALISER'}

              </Text>

            </TouchableOpacity>

          </View>


          {rewards.length === 0 ? (

            <View
              style={styles.emptyCard}
            >

              <Text
                style={styles.emptyIcon}
              >
                🎁
              </Text>

              <Text
                style={styles.emptyTitle}
              >
                AUCUNE RÉCOMPENSE
              </Text>

              <Text
                style={styles.emptyText}
              >
                Aucune récompense n'est encore
                débloquée.
              </Text>

            </View>

          ) : (

            rewards.map((reward) => {

              const claimed =
                reward.statut ===
                'remise';

              const claiming =
                claimingRewardId ===
                reward.id;

              const participantName =
                reward.participant
                  ? `${reward.participant.prenom} ${reward.participant.nom}`
                  : 'Participant inconnu';


              return (

                <View
                  key={String(reward.id)}
                  style={[
                    styles.rewardCard,
                    claimed &&
                      styles.rewardCardClaimed,
                  ]}
                >

                  <View
                    style={
                      styles.rewardHeader
                    }
                  >

                    <View
                      style={
                        styles.rewardLevel
                      }
                    >

                      <Text
                        style={
                          styles.rewardLevelNumber
                        }
                      >
                        {reward.palier}
                      </Text>

                    </View>


                    <View
                      style={
                        styles.rewardIdentity
                      }
                    >

                      <Text
                        style={
                          styles.rewardParticipant
                        }
                      >
                        {participantName}
                      </Text>

                      <Text
                        style={
                          styles.rewardCode
                        }
                      >
                        {
                          reward.participant
                            ?.code_parrain ||
                          'Code inconnu'
                        }
                      </Text>

                    </View>


                    <View
                      style={[
                        styles.rewardStatus,

                        claimed
                          ? styles.rewardStatusClaimed
                          : styles.rewardStatusPending,
                      ]}
                    >

                      <Text
                        style={[
                          styles.rewardStatusText,

                          claimed
                            ? styles.rewardStatusTextClaimed
                            : styles.rewardStatusTextPending,
                        ]}
                      >

                        {claimed
                          ? 'REMISE'
                          : 'À REMETTRE'}

                      </Text>

                    </View>

                  </View>


                  <View
                    style={
                      styles.rewardContent
                    }
                  >

                    <Text
                      style={
                        styles.rewardLabel
                      }
                    >
                      RÉCOMPENSE
                    </Text>

                    <Text
                      style={[
                        styles.rewardName,

                        claimed &&
                          styles.rewardNameClaimed,
                      ]}
                    >
                      {reward.recompense}
                    </Text>

                  </View>


                  {!claimed && (

                    <TouchableOpacity
                      style={
                        styles.claimButton
                      }
                      activeOpacity={0.8}
                      onPress={() =>
                        claimReward(
                          reward
                        )
                      }
                      disabled={
                        claiming
                      }
                    >

                      <Text
                        style={
                          styles.claimButtonText
                        }
                      >

                        {claiming
                          ? 'ENREGISTREMENT...'
                          : '✓  MARQUER COMME REMISE'}

                      </Text>

                    </TouchableOpacity>

                  )}

                </View>

              );

            })

          )}


          {/* ========================================
              PARTICIPANTS
          ======================================== */}

          <View
            style={[
              styles.sectionHeader,
              {
                marginTop: 30,
              },
            ]}
          >

            <Text
              style={styles.sectionTitle}
            >
              PARTICIPANTS
            </Text>

            <TouchableOpacity
              style={styles.refreshButton}
              activeOpacity={0.8}
              onPress={refresh}
              disabled={loading}
            >

              <Text
                style={styles.refreshText}
              >

                {loading
                  ? '...'
                  : 'ACTUALISER'}

              </Text>

            </TouchableOpacity>

          </View>


          {/* ========================================
              LISTE PARTICIPANTS
          ======================================== */}

          {participants.length === 0 ? (

            <View
              style={styles.emptyCard}
            >

              <Text
                style={styles.emptyIcon}
              >
                🎃
              </Text>

              <Text
                style={styles.emptyTitle}
              >
                AUCUN PARTICIPANT
              </Text>

              <Text
                style={styles.emptyText}
              >
                Aucun participant n'est actuellement
                enregistré.
              </Text>

            </View>

          ) : (

            participants.map((participant) => {

              const paid =
                participant.statut_paiement ===
                'paye';

              const validating =
                validatingId ===
                participant.id;

              const ticketUsed =
                participant.billet_utilise ===
                true;


              return (

                <View
                  key={String(
                    participant.id
                  )}
                  style={
                    styles.participantCard
                  }
                >

                  {/* NOM */}

                  <View
                    style={
                      styles.participantHeader
                    }
                  >

                    <View
                      style={
                        styles.participantIdentity
                      }
                    >

                      <Text
                        style={
                          styles.participantName
                        }
                      >
                        {participant.prenom}{' '}
                        {participant.nom}
                      </Text>

                      <Text
                        style={
                          styles.participantEmail
                        }
                      >
                        {participant.mail}
                      </Text>

                    </View>


                    <View
                      style={[
                        styles.statusBadge,

                        paid
                          ? styles.statusPaid
                          : styles.statusWaiting,
                      ]}
                    >

                      <Text
                        style={[
                          styles.statusText,

                          paid
                            ? styles.statusTextPaid
                            : styles.statusTextWaiting,
                        ]}
                      >

                        {paid
                          ? 'PAYÉ'
                          : 'EN ATTENTE'}

                      </Text>

                    </View>

                  </View>


                  {/* INFORMATIONS */}

                  <View
                    style={
                      styles.participantInfo
                    }
                  >

                    <View
                      style={styles.infoItem}
                    >

                      <Text
                        style={
                          styles.infoLabel
                        }
                      >
                        TARIF
                      </Text>

                      <Text
                        style={
                          styles.infoValue
                        }
                      >
                        {participant.tarif}
                      </Text>

                    </View>


                    <View
                      style={styles.infoItem}
                    >

                      <Text
                        style={
                          styles.infoLabel
                        }
                      >
                        MONTANT
                      </Text>

                      <Text
                        style={
                          styles.infoValue
                        }
                      >
                        {participant.montant} €
                      </Text>

                    </View>


                    <View
                      style={styles.infoItem}
                    >

                      <Text
                        style={
                          styles.infoLabel
                        }
                      >
                        ENTRÉE
                      </Text>

                      <Text
                        style={[
                          styles.infoValue,
                          ticketUsed &&
                            styles.infoValueUsed,
                          paid &&
                            !ticketUsed &&
                            styles.infoValueReady,
                        ]}
                      >
                        {!paid
                          ? 'ATTENTE'
                          : ticketUsed
                            ? 'UTILISÉ'
                            : 'VALIDE'}
                      </Text>

                    </View>

                  </View>


                  {/* CODE BILLET */}

                  {participant.billet_code && (

                    <View
                      style={
                        styles.ticketCodeBox
                      }
                    >

                      <Text
                        style={
                          styles.ticketCodeLabel
                        }
                      >
                        CODE BILLET
                      </Text>

                      <Text
                        style={
                          styles.ticketCodeValue
                        }
                      >
                        {
                          participant.billet_code
                        }
                      </Text>

                    </View>

                  )}


                  {/* PARRAIN */}

                  {participant.parrain_code && (

                    <View
                      style={
                        styles.referralBox
                      }
                    >

                      <Text
                        style={
                          styles.referralLabel
                        }
                      >
                        PARRAIN
                      </Text>

                      <Text
                        style={
                          styles.referralCode
                        }
                      >
                        {
                          participant.parrain_code
                        }
                      </Text>

                    </View>

                  )}


                  {/* VALIDATION */}

                  {!paid && (

                    <TouchableOpacity
                      style={
                        styles.validateButton
                      }
                      activeOpacity={0.8}
                      onPress={() =>
                        validatePayment(
                          participant
                        )
                      }
                      disabled={
                        validating
                      }
                    >

                      <Text
                        style={
                          styles.validateButtonText
                        }
                      >

                        {validating
                          ? 'VALIDATION...'
                          : '✓  VALIDER LE PAIEMENT'}

                      </Text>

                    </TouchableOpacity>

                  )}

                </View>

              );

            })

          )}


          {/* ========================================
              DÉCONNEXION
          ======================================== */}

          <TouchableOpacity
            style={styles.logoutButton}
            activeOpacity={0.8}
            onPress={() => {

              setAuthenticated(false);

              setPin('');

              setParticipants([]);

              setRewards([]);

              closeScanner();

            }}
          >

            <Text
              style={styles.logoutText}
            >
              SE DÉCONNECTER
            </Text>

          </TouchableOpacity>


          <Text
            style={styles.footer}
          >
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

  loginContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 50,
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 120,
  },


  // ========================================
  // SCANNER
  // ========================================

  scannerScreen: {
    flex: 1,
    backgroundColor: '#050505',
  },

  scannerHeader: {
    height: 80,
    backgroundColor: '#0b0b0b',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },

  scannerCloseButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scannerCloseText: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '700',
  },

  scannerHeaderCenter: {
    flex: 1,
    alignItems: 'center',
  },

  scannerHeaderSmall: {
    color: '#777',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 2,
  },

  scannerHeaderTitle: {
    color: '#ff5a00',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },

  scannerHeaderSpacer: {
    width: 42,
  },

  cameraWrapper: {
    flex: 1,
    overflow: 'hidden',
  },

  camera: {
    flex: 1,
  },

  cameraOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.16)',
  },

  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },

  corner: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderColor: '#ff5a00',
  },

  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },

  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },

  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },

  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },

  scanInstruction: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 28,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },

  scanResultCard: {
    backgroundColor: '#101010',
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 24,
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#292929',
  },

  scanResultSuccess: {
    borderTopColor: '#6ee7a0',
  },

  scanResultAlreadyUsed: {
    borderTopColor: '#ffb15c',
  },

  scanResultInvalid: {
    borderTopColor: '#ff5c5c',
  },

  scanResultWaiting: {
    borderTopColor: '#555',
  },

  resultIcon: {
    fontSize: 28,
    marginBottom: 5,
  },

  resultTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },

  resultSuccessTitle: {
    color: '#6ee7a0',
    fontSize: 17,
    fontWeight: '900',
  },

  resultWarningTitle: {
    color: '#ffb15c',
    fontSize: 17,
    fontWeight: '900',
  },

  resultErrorTitle: {
    color: '#ff7070',
    fontSize: 17,
    fontWeight: '900',
  },

  resultParticipant: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 6,
    textAlign: 'center',
  },

  resultTicket: {
    color: '#ff5a00',
    fontSize: 10,
    fontWeight: '900',
    marginTop: 5,
    letterSpacing: 1,
  },

  resultText: {
    color: '#777',
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 7,
  },

  scanAgainButton: {
    backgroundColor: '#ff5a00',
    borderRadius: 13,
    width: '100%',
    alignItems: 'center',
    paddingVertical: 15,
    marginTop: 14,
  },

  scanAgainText: {
    color: '#050505',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },


  // ========================================
  // TITRES
  // ========================================

  smallTitle: {
    color: '#777',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 3,
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
    letterSpacing: 2,
  },

  separator: {
    height: 1,
    backgroundColor: '#222',
    marginVertical: 38,
  },


  // ========================================
  // LOGIN
  // ========================================

  loginCard: {
    backgroundColor:
      'rgba(16, 16, 16, 0.96)',
    borderWidth: 1,
    borderColor: '#292929',
    borderRadius: 22,
    padding: 24,
  },

  loginTitle: {
    color: '#ff5a00',
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },

  loginDescription: {
    color: '#777',
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 12,
  },

  pinInput: {
    backgroundColor: '#0b0b0b',
    borderWidth: 1,
    borderColor: '#292929',
    borderRadius: 14,
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 8,
    paddingVertical: 16,
    marginTop: 25,
  },

  loginButton: {
    backgroundColor: '#ff5a00',
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 17,
    marginTop: 18,
  },

  loginButtonText: {
    color: '#050505',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },

  backButton: {
    alignItems: 'center',
    paddingVertical: 18,
    marginTop: 8,
  },

  backText: {
    color: '#666',
    fontSize: 11,
    fontWeight: '800',
  },


  // ========================================
  // BOUTON SCANNER
  // ========================================

  scannerButton: {
    backgroundColor:
      'rgba(255, 90, 0, 0.12)',
    borderWidth: 1,
    borderColor: '#ff5a00',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  scannerButtonIcon: {
    fontSize: 28,
    marginRight: 15,
  },

  scannerButtonInfo: {
    flex: 1,
  },

  scannerButtonTitle: {
    color: '#ff5a00',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },

  scannerButtonText: {
    color: '#777',
    fontSize: 9,
    marginTop: 5,
  },

  scannerButtonArrow: {
    color: '#ff5a00',
    fontSize: 30,
    fontWeight: '300',
    marginLeft: 10,
  },


  // ========================================
  // STATS
  // ========================================

  statsCard: {
    backgroundColor:
      'rgba(16, 16, 16, 0.94)',
    borderWidth: 1,
    borderColor: '#292929',
    borderRadius: 22,
    padding: 22,
    marginBottom: 28,
  },

  cardTitle: {
    color: '#ff5a00',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 22,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  stat: {
    alignItems: 'center',
    flex: 1,
  },

  statNumber: {
    color: '#fff',
    fontSize: 27,
    fontWeight: '900',
  },

  paidNumber: {
    color: '#6ee7a0',
  },

  waitingNumber: {
    color: '#ffb15c',
  },

  usedNumber: {
    color: '#ff5a00',
  },

  statLabel: {
    color: '#666',
    fontSize: 7,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 5,
  },


  // ========================================
  // SECTION
  // ========================================

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },

  sectionTitle: {
    color: '#777',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },

  refreshButton: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  refreshText: {
    color: '#777',
    fontSize: 8,
    fontWeight: '800',
  },


  // ========================================
  // RÉCOMPENSES
  // ========================================

  rewardCard: {
    backgroundColor:
      'rgba(16, 16, 16, 0.96)',
    borderWidth: 1,
    borderColor: '#ff5a00',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
  },

  rewardCardClaimed: {
    borderColor: '#292929',
    opacity: 0.7,
  },

  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  rewardLevel: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ff5a00',
    alignItems: 'center',
    justifyContent: 'center',
  },

  rewardLevelNumber: {
    color: '#050505',
    fontSize: 18,
    fontWeight: '900',
  },

  rewardIdentity: {
    flex: 1,
    marginLeft: 14,
  },

  rewardParticipant: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },

  rewardCode: {
    color: '#666',
    fontSize: 9,
    marginTop: 4,
    letterSpacing: 1,
  },

  rewardStatus: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  rewardStatusPending: {
    backgroundColor:
      'rgba(255, 90, 0, 0.15)',
  },

  rewardStatusClaimed: {
    backgroundColor:
      'rgba(110, 231, 160, 0.12)',
  },

  rewardStatusText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  rewardStatusTextPending: {
    color: '#ff5a00',
  },

  rewardStatusTextClaimed: {
    color: '#6ee7a0',
  },

  rewardContent: {
    marginTop: 18,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#202020',
  },

  rewardLabel: {
    color: '#555',
    fontSize: 8,
    fontWeight: '800',
  },

  rewardName: {
    color: '#ff5a00',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 6,
  },

  rewardNameClaimed: {
    color: '#777',
  },

  claimButton: {
    backgroundColor: '#ff5a00',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 15,
  },

  claimButtonText: {
    color: '#050505',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },


  // ========================================
  // PARTICIPANTS
  // ========================================

  participantCard: {
    backgroundColor:
      'rgba(16, 16, 16, 0.96)',
    borderWidth: 1,
    borderColor: '#292929',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
  },

  participantHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  participantIdentity: {
    flex: 1,
    paddingRight: 10,
  },

  participantName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },

  participantEmail: {
    color: '#666',
    fontSize: 10,
    marginTop: 5,
  },

  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  statusPaid: {
    backgroundColor:
      'rgba(110, 231, 160, 0.12)',
  },

  statusWaiting: {
    backgroundColor:
      'rgba(255, 177, 92, 0.12)',
  },

  statusText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  statusTextPaid: {
    color: '#6ee7a0',
  },

  statusTextWaiting: {
    color: '#ffb15c',
  },


  // ========================================
  // INFOS
  // ========================================

  participantInfo: {
    flexDirection: 'row',
    marginTop: 18,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#202020',
  },

  infoItem: {
    flex: 1,
  },

  infoLabel: {
    color: '#555',
    fontSize: 8,
    fontWeight: '800',
    marginBottom: 5,
  },

  infoValue: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: '700',
  },

  infoValueReady: {
    color: '#6ee7a0',
  },

  infoValueUsed: {
    color: '#ff5a00',
  },


  // ========================================
  // CODE BILLET
  // ========================================

  ticketCodeBox: {
    backgroundColor: '#0b0b0b',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 10,
    padding: 11,
    marginTop: 12,
  },

  ticketCodeLabel: {
    color: '#555',
    fontSize: 8,
    fontWeight: '800',
  },

  ticketCodeValue: {
    color: '#ff5a00',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginTop: 4,
  },


  // ========================================
  // PARRAIN
  // ========================================

  referralBox: {
    backgroundColor: '#0b0b0b',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },

  referralLabel: {
    color: '#555',
    fontSize: 8,
    fontWeight: '800',
  },

  referralCode: {
    color: '#ff5a00',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 4,
    letterSpacing: 1,
  },


  // ========================================
  // VALIDATION
  // ========================================

  validateButton: {
    backgroundColor: '#ff5a00',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 15,
  },

  validateButtonText: {
    color: '#050505',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },


  // ========================================
  // EMPTY
  // ========================================

  emptyCard: {
    backgroundColor:
      'rgba(16, 16, 16, 0.94)',
    borderWidth: 1,
    borderColor: '#292929',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 12,
  },

  emptyIcon: {
    fontSize: 30,
  },

  emptyTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 12,
  },

  emptyText: {
    color: '#666',
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 8,
  },


  // ========================================
  // LOGOUT
  // ========================================

  logoutButton: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 25,
  },

  logoutText: {
    color: '#777',
    fontSize: 10,
    fontWeight: '900',
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