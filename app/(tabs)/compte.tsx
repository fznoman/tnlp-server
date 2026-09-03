import React, { useCallback, useState } from "react";
import {
  Alert,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import QRCode from "react-native-qrcode-svg";

import FlyingBats from "../../components/FlyingBats";

// ========================================
// SERVEUR
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
  password?: string | null;
  tarif?: string | null;
  montant?: number | null;
  statut_paiement?: string | null;
  code_parrain?: string | null;
  parrain_code?: string | null;

  // Billet
  billet_code?: string | null;
  billet_utilise?: boolean | null;
  billet_utilise_at?: string | null;
};

type Reward = {
  id: string | number;
  palier: number;
  recompense: string;
  statut: string;
  created_at?: string;
  claimed_at?: string | null;
};

// ========================================
// PALIERS
// ========================================

const LEVELS = [
  {
    number: 3,
    reward: "1 MÈTRE DE SHOTS",
  },
  {
    number: 5,
    reward: "ENTRÉE REMBOURSÉE",
  },
  {
    number: 10,
    reward: "2 ENTRÉES GRATUITES",
  },
  {
    number: 15,
    reward: "50 € CASH",
  },
  {
    number: 20,
    reward: "MAGNUM DE BELVEDERE",
  },
];

export default function CompteScreen() {
  // ========================================
  // COMPTE
  // ========================================

  const [participant, setParticipant] =
    useState<Participant | null>(null);

  const [referralCode, setReferralCode] =
    useState<string | null>(null);

  const [referrals, setReferrals] =
    useState(0);

  const [rewards, setRewards] =
    useState<Reward[]>([]);

  const [loading, setLoading] =
    useState(true);

  // ========================================
  // CONNEXION / INSCRIPTION
  // ========================================

  const [showRegister, setShowRegister] =
    useState(false);

  const [login, setLogin] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loginLoading, setLoginLoading] =
    useState(false);

  // ========================================
  // CRÉATION DE COMPTE
  // ========================================

  const [prenom, setPrenom] =
    useState("");

  const [nom, setNom] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [telephone, setTelephone] =
    useState("");

  const [registerPassword, setRegisterPassword] =
    useState("");

  const [registerLoading, setRegisterLoading] =
    useState(false);

  // ========================================
  // CHARGER LE COMPTE
  // ========================================

  const loadAccount = async () => {
    try {
      setLoading(true);

      const savedId =
        await AsyncStorage.getItem(
          "tnlp_participant_id"
        );

      if (!savedId) {
        setParticipant(null);
        setReferralCode(null);
        setReferrals(0);
        setRewards([]);
        return;
      }

      const response =
        await fetch(
          `${SERVER_URL}/participant/${encodeURIComponent(
            savedId
          )}`
        );

      const data =
        await response.json();

      if (!response.ok) {
        await AsyncStorage.removeItem(
          "tnlp_participant_id"
        );

        setParticipant(null);
        setReferralCode(null);
        setReferrals(0);
        setRewards([]);

        return;
      }

      if (!data.participant) {
        await AsyncStorage.removeItem(
          "tnlp_participant_id"
        );

        setParticipant(null);
        setReferralCode(null);
        setReferrals(0);
        setRewards([]);

        return;
      }

      const currentParticipant =
        data.participant as Participant;

      setParticipant(
        currentParticipant
      );

      const code =
        currentParticipant.code_parrain
          ?.trim()
          .toUpperCase();

      setReferralCode(
        code || null
      );

      // ========================================
      // FILLEULS
      // ========================================

      if (code) {
        try {
          const referralsResponse =
            await fetch(
              `${SERVER_URL}/referrals/${encodeURIComponent(
                code
              )}`
            );

          const referralsData =
            await referralsResponse.json();

          if (referralsResponse.ok) {
            setReferrals(
              Number(
                referralsData.referrals
              ) || 0
            );
          } else {
            setReferrals(0);
          }
        } catch (error) {
          console.log(
            "Erreur filleuls :",
            error
          );

          setReferrals(0);
        }

        // ========================================
        // RÉCOMPENSES
        // ========================================

        try {
          const rewardsResponse =
            await fetch(
              `${SERVER_URL}/rewards/${encodeURIComponent(
                code
              )}`
            );

          const rewardsData =
            await rewardsResponse.json();

          if (rewardsResponse.ok) {
            setRewards(
              Array.isArray(
                rewardsData.rewards
              )
                ? rewardsData.rewards
                : []
            );
          } else {
            setRewards([]);
          }
        } catch (error) {
          console.log(
            "Erreur récompenses :",
            error
          );

          setRewards([]);
        }
      } else {
        setReferrals(0);
        setRewards([]);
      }
    } catch (error) {
      console.log(
        "Erreur chargement compte :",
        error
      );

      setParticipant(null);
      setReferralCode(null);
      setReferrals(0);
      setRewards([]);
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // RECHARGER À CHAQUE OUVERTURE
  // ========================================

  useFocusEffect(
    useCallback(() => {
      loadAccount();
    }, [])
  );

  // ========================================
  // CONNEXION
  // ========================================

  const handleLogin = async () => {
    if (
      !login.trim() ||
      !password.trim()
    ) {
      Alert.alert(
        "Informations manquantes",
        "Renseigne ton email ou ton numéro de téléphone ainsi que ton mot de passe."
      );

      return;
    }

    try {
      setLoginLoading(true);

      const response =
        await fetch(
          `${SERVER_URL}/login`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              login:
                login.trim(),

              password:
                password.trim(),
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Impossible de se connecter."
        );
      }

      if (!data.participant) {
        throw new Error(
          "Compte introuvable."
        );
      }

      const connectedParticipant =
        data.participant as Participant;

      // ========================================
      // SAUVEGARDER L'ID
      // ========================================

      await AsyncStorage.setItem(
        "tnlp_participant_id",
        String(
          connectedParticipant.id
        )
      );

      // ========================================
      // SAUVEGARDER LE CODE
      // ========================================

      if (
        connectedParticipant.code_parrain
      ) {
        await AsyncStorage.setItem(
          "tnlp_code_parrain",
          connectedParticipant.code_parrain
        );
      }

      setParticipant(
        connectedParticipant
      );

      setLogin("");
      setPassword("");

      await loadAccount();

    } catch (error) {
      console.error(
        "Erreur connexion :",
        error
      );

      Alert.alert(
        "Connexion impossible",
        error instanceof Error
          ? error.message
          : "Impossible de se connecter."
      );
    } finally {
      setLoginLoading(false);
    }
  };

  // ========================================
  // CRÉATION DE COMPTE
  // ========================================

  const handleRegister = async () => {
    if (
      !prenom.trim() ||
      !nom.trim() ||
      !email.trim() ||
      !telephone.trim() ||
      !registerPassword.trim()
    ) {
      Alert.alert(
        "Informations manquantes",
        "Merci de remplir tous les champs."
      );

      return;
    }

    if (
      registerPassword.trim().length < 4
    ) {
      Alert.alert(
        "Mot de passe",
        "Le mot de passe doit contenir au moins 4 caractères."
      );

      return;
    }

    if (!email.includes("@")) {
      Alert.alert(
        "Email invalide",
        "Vérifie ton adresse email."
      );

      return;
    }

    try {
      setRegisterLoading(true);

      const response =
        await fetch(
          `${SERVER_URL}/register-account`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              prenom:
                prenom.trim(),

              nom:
                nom.trim(),

              mail:
                email.trim().toLowerCase(),

              telephone:
                telephone.trim(),

              password:
                registerPassword.trim(),
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Impossible de créer le compte."
        );
      }

      if (!data.participant) {
        throw new Error(
          "Le compte a été créé mais les informations sont introuvables."
        );
      }

      const newParticipant =
        data.participant as Participant;

      // ========================================
      // CONNECTER AUTOMATIQUEMENT
      // ========================================

      await AsyncStorage.setItem(
        "tnlp_participant_id",
        String(
          newParticipant.id
        )
      );

      if (
        newParticipant.code_parrain
      ) {
        await AsyncStorage.setItem(
          "tnlp_code_parrain",
          newParticipant.code_parrain
        );
      }

      setParticipant(
        newParticipant
      );

      // ========================================
      // RESET
      // ========================================

      setPrenom("");
      setNom("");
      setEmail("");
      setTelephone("");
      setRegisterPassword("");

      setShowRegister(false);

      await loadAccount();

      Alert.alert(
        "Compte créé 🎃",
        "Ton compte NIGHTMARE a bien été créé."
      );

    } catch (error) {
      console.error(
        "Erreur création compte :",
        error
      );

      Alert.alert(
        "Création impossible",
        error instanceof Error
          ? error.message
          : "Impossible de créer ton compte."
      );
    } finally {
      setRegisterLoading(false);
    }
  };

  // ========================================
  // DÉCONNEXION
  // ========================================

  const handleLogout = async () => {
    await AsyncStorage.removeItem(
      "tnlp_participant_id"
    );

    await AsyncStorage.removeItem(
      "tnlp_code_parrain"
    );

    setParticipant(null);
    setReferralCode(null);
    setReferrals(0);
    setRewards([]);

    setLogin("");
    setPassword("");

    setShowRegister(false);
  };

  // ========================================
  // PARTAGE
  // ========================================

  const shareReferral = async () => {
    if (!referralCode) {
      return;
    }

    try {
      await Share.share({
        message:
          `🎃 Rejoins-moi pour NIGHTMARE - THE NEXT LEVEL PARTY !\n\n` +
          `31 octobre 2026 · Savoie\n\n` +
          `Prends ta place avec mon invitation :\n` +
          `tnlp://billetterie?code=${referralCode}`,
      });
    } catch (error) {
      console.log(
        "Erreur partage :",
        error
      );
    }
  };

  // ========================================
  // PROCHAIN PALIER
  // ========================================

  const nextLevel =
    LEVELS.find(
      (level) =>
        referrals < level.number
    ) ||
    LEVELS[LEVELS.length - 1];

  const progress =
    referrals >= 20
      ? 1
      : Math.min(
          referrals /
            nextLevel.number,
          1
        );

  // ========================================
  // CHARGEMENT
  // ========================================

  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <ImageBackground
          source={require(
            "../../assets/images/fond-fumee.png"
          )}
          style={styles.background}
          imageStyle={
            styles.backgroundImage
          }
        >
          <FlyingBats />

          <View
            style={
              styles.loadingScreen
            }
          >
            <Text
              style={
                styles.loadingText
              }
            >
              CHARGEMENT...
            </Text>
          </View>
        </ImageBackground>
      </SafeAreaView>
    );
  }

  // ========================================
  // CONNEXION / INSCRIPTION
  // ========================================

  if (!participant) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <ImageBackground
          source={require(
            "../../assets/images/fond-fumee.png"
          )}
          style={styles.background}
          imageStyle={
            styles.backgroundImage
          }
        >
          <FlyingBats />

          <ScrollView
            contentContainerStyle={
              styles.loginContent
            }
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={
              false
            }
          >
            <Text
              style={
                styles.smallTitle
              }
            >
              NIGHTMARE
            </Text>

            <Text
              style={styles.title}
            >
              MON COMPTE
            </Text>

            <Text
              style={styles.subtitle}
            >
              TON ESPACE PERSONNEL
            </Text>

            <View
              style={styles.separator}
            />

            {!showRegister ? (
              <>
                <View
                  style={styles.loginCard}
                >
                  <Text
                    style={
                      styles.loginTitle
                    }
                  >
                    SE CONNECTER
                  </Text>

                  <Text
                    style={
                      styles.loginDescription
                    }
                  >
                    Connecte-toi avec ton
                    email ou ton numéro de
                    téléphone.
                  </Text>

                  <Text
                    style={
                      styles.inputLabel
                    }
                  >
                    EMAIL OU TÉLÉPHONE
                  </Text>

                  <TextInput
                    style={styles.input}
                    value={login}
                    onChangeText={setLogin}
                    placeholder="Ton email ou téléphone"
                    placeholderTextColor="#555"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loginLoading}
                  />

                  <Text
                    style={
                      styles.inputLabel
                    }
                  >
                    MOT DE PASSE
                  </Text>

                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={
                      setPassword
                    }
                    placeholder="Ton mot de passe"
                    placeholderTextColor="#555"
                    secureTextEntry
                    editable={!loginLoading}
                  />

                  <TouchableOpacity
                    style={[
                      styles.loginButton,
                      loginLoading &&
                        styles.buttonDisabled,
                    ]}
                    activeOpacity={0.8}
                    onPress={
                      handleLogin
                    }
                    disabled={
                      loginLoading
                    }
                  >
                    <Text
                      style={
                        styles.loginButtonText
                      }
                    >
                      {loginLoading
                        ? "CONNEXION..."
                        : "SE CONNECTER"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View
                  style={
                    styles.createAccountBox
                  }
                >
                  <Text
                    style={
                      styles.createAccountText
                    }
                  >
                    Pas encore de compte ?
                  </Text>

                  <TouchableOpacity
                    onPress={() =>
                      setShowRegister(
                        true
                      )
                    }
                  >
                    <Text
                      style={
                        styles.createAccountButton
                      }
                    >
                      CRÉER MON COMPTE
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View
                  style={styles.loginCard}
                >
                  <Text
                    style={
                      styles.loginTitle
                    }
                  >
                    CRÉER MON COMPTE
                  </Text>

                  <Text
                    style={
                      styles.loginDescription
                    }
                  >
                    Crée ton compte gratuitement,
                    même sans acheter de billet.
                  </Text>

                  <Text
                    style={
                      styles.inputLabel
                    }
                  >
                    PRÉNOM
                  </Text>

                  <TextInput
                    style={styles.input}
                    value={prenom}
                    onChangeText={setPrenom}
                    placeholder="Ton prénom"
                    placeholderTextColor="#555"
                    autoCapitalize="words"
                    editable={
                      !registerLoading
                    }
                  />

                  <Text
                    style={
                      styles.inputLabel
                    }
                  >
                    NOM
                  </Text>

                  <TextInput
                    style={styles.input}
                    value={nom}
                    onChangeText={setNom}
                    placeholder="Ton nom"
                    placeholderTextColor="#555"
                    autoCapitalize="words"
                    editable={
                      !registerLoading
                    }
                  />

                  <Text
                    style={
                      styles.inputLabel
                    }
                  >
                    EMAIL
                  </Text>

                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Ton email"
                    placeholderTextColor="#555"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={
                      !registerLoading
                    }
                  />

                  <Text
                    style={
                      styles.inputLabel
                    }
                  >
                    TÉLÉPHONE
                  </Text>

                  <TextInput
                    style={styles.input}
                    value={telephone}
                    onChangeText={
                      setTelephone
                    }
                    placeholder="Ton numéro"
                    placeholderTextColor="#555"
                    keyboardType="phone-pad"
                    editable={
                      !registerLoading
                    }
                  />

                  <Text
                    style={
                      styles.inputLabel
                    }
                  >
                    MOT DE PASSE
                  </Text>

                  <TextInput
                    style={styles.input}
                    value={
                      registerPassword
                    }
                    onChangeText={
                      setRegisterPassword
                    }
                    placeholder="4 caractères minimum"
                    placeholderTextColor="#555"
                    secureTextEntry
                    editable={
                      !registerLoading
                    }
                  />

                  <TouchableOpacity
                    style={[
                      styles.loginButton,
                      registerLoading &&
                        styles.buttonDisabled,
                    ]}
                    activeOpacity={0.8}
                    onPress={
                      handleRegister
                    }
                    disabled={
                      registerLoading
                    }
                  >
                    <Text
                      style={
                        styles.loginButtonText
                      }
                    >
                      {registerLoading
                        ? "CRÉATION..."
                        : "CRÉER MON COMPTE"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View
                  style={
                    styles.createAccountBox
                  }
                >
                  <Text
                    style={
                      styles.createAccountText
                    }
                  >
                    Tu as déjà un compte ?
                  </Text>

                  <TouchableOpacity
                    onPress={() =>
                      setShowRegister(
                        false
                      )
                    }
                  >
                    <Text
                      style={
                        styles.createAccountButton
                      }
                    >
                      SE CONNECTER
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

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
  // COMPTE CONNECTÉ
  // ========================================

  const hasTicket =
    participant.tarif !== null &&
    participant.tarif !== undefined &&
    participant.tarif !== "";

  const ticketIsPaid =
    participant.statut_paiement ===
    "paye";

  return (
    <SafeAreaView
      style={styles.container}
    >
      <ImageBackground
        source={require(
          "../../assets/images/fond-fumee.png"
        )}
        style={styles.background}
        imageStyle={
          styles.backgroundImage
        }
      >
        <FlyingBats />

        <ScrollView
          contentContainerStyle={
            styles.content
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          {/* HEADER */}

          <Text
            style={styles.smallTitle}
          >
            NIGHTMARE
          </Text>

          <Text
            style={styles.title}
          >
            MON COMPTE
          </Text>

          <Text
            style={styles.subtitle}
          >
            TON ESPACE PERSONNEL
          </Text>

          <View
            style={styles.separator}
          />

          {/* PROFIL */}

          <View
            style={styles.profileCard}
          >
            <View
              style={styles.profileIcon}
            >
              <Text
                style={
                  styles.profileIconText
                }
              >
                {participant.prenom
                  .charAt(0)
                  .toUpperCase()}
              </Text>
            </View>

            <View
              style={styles.profileInfo}
            >
              <Text
                style={
                  styles.profileName
                }
              >
                {participant.prenom}{" "}
                {participant.nom}
              </Text>

              <Text
                style={
                  styles.profileEmail
                }
              >
                {participant.mail}
              </Text>
            </View>
          </View>

          {/* MA PLACE */}

          <Text
            style={styles.sectionTitle}
          >
            🎟️ MA PLACE
          </Text>

          {hasTicket ? (
            <View
              style={styles.ticketCard}
            >
              <View
                style={styles.ticketTop}
              >
                <View>
                  <Text
                    style={
                      styles.ticketEvent
                    }
                  >
                    NIGHTMARE
                  </Text>

                  <Text
                    style={
                      styles.ticketParty
                    }
                  >
                    THE NEXT LEVEL PARTY
                  </Text>
                </View>

                <View
                  style={[
                    styles.paymentBadge,
                    ticketIsPaid
                      ? styles.paymentPaid
                      : styles.paymentWaiting,
                  ]}
                >
                  <Text
                    style={[
                      styles.paymentText,
                      ticketIsPaid
                        ? styles.paymentTextPaid
                        : styles.paymentTextWaiting,
                    ]}
                  >
                    {ticketIsPaid
                      ? "PAYÉ"
                      : "EN ATTENTE"}
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.ticketDivider
                }
              />

              <View
                style={
                  styles.ticketInfoRow
                }
              >
                <View
                  style={
                    styles.ticketInfoItem
                  }
                >
                  <Text
                    style={
                      styles.ticketLabel
                    }
                  >
                    TARIF
                  </Text>

                  <Text
                    style={
                      styles.ticketValue
                    }
                  >
                    {participant.tarif}
                  </Text>
                </View>

                <View
                  style={
                    styles.ticketInfoItem
                  }
                >
                  <Text
                    style={
                      styles.ticketLabel
                    }
                  >
                    MONTANT
                  </Text>

                  <Text
                    style={
                      styles.ticketPrice
                    }
                  >
                    {Number(
                      participant.montant || 0
                    ).toFixed(2)}{" "}
                    €
                  </Text>
                </View>
              </View>

              <View
                style={styles.ticketDate}
              >
                <Text
                  style={
                    styles.ticketDateText
                  }
                >
                  📅 31 OCTOBRE 2026
                </Text>

                <Text
                  style={
                    styles.ticketDateText
                  }
                >
                  📍 SAVOIE
                </Text>
              </View>

              {/* ======================================== */}
              {/* QR CODE DU BILLET */}
              {/* ======================================== */}

              {ticketIsPaid &&
                participant.billet_code && (
                  <View
                    style={styles.qrSection}
                  >
                    <Text
                      style={styles.qrTitle}
                    >
                      TON BILLET
                    </Text>

                    <View
                      style={
                        styles.qrContainer
                      }
                    >
                      <QRCode
                        value={
                          participant.billet_code
                        }
                        size={190}
                        backgroundColor="#ffffff"
                        color="#000000"
                      />
                    </View>

                    <Text
                      style={
                        styles.qrCodeLabel
                      }
                    >
                      CODE BILLET
                    </Text>

                    <Text
                      style={
                        styles.qrCodeValue
                      }
                    >
                      {participant.billet_code}
                    </Text>

                    <Text
                      style={styles.qrInfo}
                    >
                      Présente ce QR code à
                      l'entrée de la soirée.
                    </Text>

                    {participant.billet_utilise ===
                      true && (
                      <View
                        style={
                          styles.ticketUsedBadge
                        }
                      >
                        <Text
                          style={
                            styles.ticketUsedText
                          }
                        >
                          ⚠️ BILLET DÉJÀ UTILISÉ
                        </Text>
                      </View>
                    )}
                  </View>
                )}

              {!ticketIsPaid && (
                <View
                  style={styles.qrWaiting}
                >
                  <Text
                    style={
                      styles.qrWaitingIcon
                    }
                  >
                    ⏳
                  </Text>

                  <Text
                    style={
                      styles.qrWaitingTitle
                    }
                  >
                    QR CODE EN ATTENTE
                  </Text>

                  <Text
                    style={
                      styles.qrWaitingText
                    }
                  >
                    Ton QR code sera
                    disponible dès que ton
                    paiement aura été validé.
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View
              style={
                styles.noTicketCard
              }
            >
              <Text
                style={
                  styles.noTicketIcon
                }
              >
                🎟️
              </Text>

              <Text
                style={
                  styles.noTicketTitle
                }
              >
                PAS ENCORE DE BILLET
              </Text>

              <Text
                style={
                  styles.noTicketText
                }
              >
                Ton compte est bien créé.
                Tu pourras acheter ton billet
                plus tard.
              </Text>
            </View>
          )}

          {/* INFORMATIONS */}

          <Text
            style={styles.sectionTitle}
          >
            👤 MES INFORMATIONS
          </Text>

          <View
            style={styles.infoCard}
          >
            <View
              style={styles.personalRow}
            >
              <Text
                style={
                  styles.personalLabel
                }
              >
                PRÉNOM
              </Text>

              <Text
                style={
                  styles.personalValue
                }
              >
                {participant.prenom}
              </Text>
            </View>

            <View
              style={styles.personalRow}
            >
              <Text
                style={
                  styles.personalLabel
                }
              >
                NOM
              </Text>

              <Text
                style={
                  styles.personalValue
                }
              >
                {participant.nom}
              </Text>
            </View>

            <View
              style={styles.personalRow}
            >
              <Text
                style={
                  styles.personalLabel
                }
              >
                EMAIL
              </Text>

              <Text
                style={
                  styles.personalValue
                }
              >
                {participant.mail}
              </Text>
            </View>

            <View
              style={[
                styles.personalRow,
                {
                  borderBottomWidth: 0,
                },
              ]}
            >
              <Text
                style={
                  styles.personalLabel
                }
              >
                TÉLÉPHONE
              </Text>

              <Text
                style={
                  styles.personalValue
                }
              >
                {participant.telephone}
              </Text>
            </View>
          </View>

          {/* PARRAINAGE */}

          <Text
            style={styles.sectionTitle}
          >
            🎃 PARRAINAGE
          </Text>

          <View
            style={styles.referralCard}
          >
            <Text
              style={
                styles.referralLabel
              }
            >
              TON CODE
            </Text>

            <Text
              style={
                styles.referralCode
              }
            >
              {referralCode || "--------"}
            </Text>

            <View
              style={
                styles.referralStats
              }
            >
              <View
                style={
                  styles.referralStat
                }
              >
                <Text
                  style={
                    styles.referralNumber
                  }
                >
                  {referrals}
                </Text>

                <Text
                  style={
                    styles.referralStatLabel
                  }
                >
                  FILLEULS VALIDÉS
                </Text>
              </View>

              <View
                style={
                  styles.referralStatDivider
                }
              />

              <View
                style={
                  styles.referralStat
                }
              >
                <Text
                  style={
                    styles.referralNumber
                  }
                >
                  {rewards.length}
                </Text>

                <Text
                  style={
                    styles.referralStatLabel
                  }
                >
                  RÉCOMPENSES
                </Text>
              </View>
            </View>

            {referralCode && (
              <TouchableOpacity
                style={
                  styles.shareButton
                }
                activeOpacity={0.8}
                onPress={
                  shareReferral
                }
              >
                <Text
                  style={
                    styles.shareButtonText
                  }
                >
                  PARTAGER MON INVITATION
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* PROGRESSION */}

          <View
            style={styles.progressCard}
          >
            <Text
              style={
                styles.progressTitle
              }
            >
              PROCHAIN PALIER
            </Text>

            <Text
              style={
                styles.progressReward
              }
            >
              {referrals >= 20
                ? "TOUS LES PALIERS ATTEINTS 🎉"
                : nextLevel.reward}
            </Text>

            {referrals < 20 && (
              <>
                <View
                  style={
                    styles.progressNumbers
                  }
                >
                  <Text
                    style={
                      styles.progressCurrent
                    }
                  >
                    {referrals}
                  </Text>

                  <Text
                    style={
                      styles.progressTarget
                    }
                  >
                    / {nextLevel.number}
                  </Text>
                </View>

                <View
                  style={
                    styles.progressBackground
                  }
                >
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${
                          progress * 100
                        }%`,
                      },
                    ]}
                  />
                </View>

                <Text
                  style={
                    styles.progressText
                  }
                >
                  Plus que{" "}
                  {nextLevel.number -
                    referrals}{" "}
                  filleul
                  {nextLevel.number -
                    referrals >
                  1
                    ? "s"
                    : ""}{" "}
                  pour débloquer cette
                  récompense
                </Text>
              </>
            )}
          </View>

          {/* RÉCOMPENSES */}

          <Text
            style={styles.sectionTitle}
          >
            🎁 MES RÉCOMPENSES
          </Text>

          {rewards.length === 0 ? (
            <View
              style={
                styles.noRewardCard
              }
            >
              <Text
                style={
                  styles.noRewardIcon
                }
              >
                🔒
              </Text>

              <Text
                style={
                  styles.noRewardTitle
                }
              >
                AUCUNE RÉCOMPENSE
              </Text>

              <Text
                style={
                  styles.noRewardText
                }
              >
                Continue de parrainer tes amis
                pour débloquer des récompenses.
              </Text>
            </View>
          ) : (
            rewards.map((reward) => {
              const claimed =
                reward.statut === "remise";

              return (
                <View
                  key={String(
                    reward.id
                  )}
                  style={[
                    styles.rewardCard,
                    claimed &&
                      styles.rewardCardClaimed,
                  ]}
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
                      styles.rewardInfo
                    }
                  >
                    <Text
                      style={
                        styles.rewardTitle
                      }
                    >
                      {reward.palier}{" "}
                      FILLEUL
                      {reward.palier > 1
                        ? "S"
                        : ""}
                    </Text>

                    <Text
                      style={
                        styles.rewardName
                      }
                    >
                      {reward.recompense}
                    </Text>

                    <Text
                      style={[
                        styles.rewardStatus,
                        claimed
                          ? styles.rewardStatusClaimed
                          : styles.rewardStatusUnlocked,
                      ]}
                    >
                      {claimed
                        ? "✓ RÉCOMPENSE REMISE"
                        : "✓ RÉCOMPENSE DÉBLOQUÉE"}
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.rewardCheck
                    }
                  >
                    {claimed
                      ? "✓"
                      : "🎁"}
                  </Text>
                </View>
              );
            })
          )}

          {/* SOIRÉE */}

          <Text
            style={styles.sectionTitle}
          >
            📅 LA SOIRÉE
          </Text>

          <View
            style={styles.eventCard}
          >
            <Text
              style={styles.eventTitle}
            >
              NIGHTMARE
            </Text>

            <Text
              style={styles.eventSubtitle}
            >
              THE NEXT LEVEL PARTY
            </Text>

            <View
              style={styles.eventLine}
            />

            <Text
              style={styles.eventInfo}
            >
              📅 SAMEDI 31 OCTOBRE 2026
            </Text>

            <Text
              style={styles.eventInfo}
            >
              📍 SAVOIE
            </Text>

            <Text
              style={styles.eventInfo}
            >
              🎃 HALLOWEEN
            </Text>
          </View>

          {/* DÉCONNEXION */}

          <TouchableOpacity
            style={
              styles.logoutButton
            }
            activeOpacity={0.8}
            onPress={
              handleLogout
            }
          >
            <Text
              style={
                styles.logoutButtonText
              }
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
    backgroundColor: "#050505",
  },

  background: {
    flex: 1,
  },

  backgroundImage: {
    resizeMode: "cover",
    opacity: 0.45,
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 45,
    paddingBottom: 120,
  },

  loginContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 45,
    paddingBottom: 60,
  },

  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: "#ff5a00",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2,
  },

  // ========================================
  // TITRES
  // ========================================

  smallTitle: {
    color: "#777",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 3,
  },

  title: {
    color: "#ff5a00",
    fontSize: 40,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 12,
  },

  subtitle: {
    color: "#777",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 10,
    letterSpacing: 2,
  },

  separator: {
    height: 1,
    backgroundColor: "#222",
    marginVertical: 38,
  },

  // ========================================
  // CONNEXION / INSCRIPTION
  // ========================================

  loginCard: {
    backgroundColor:
      "rgba(16,16,16,0.96)",
    borderWidth: 1,
    borderColor: "#292929",
    borderRadius: 22,
    padding: 22,
  },

  loginTitle: {
    color: "#ff5a00",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },

  loginDescription: {
    color: "#666",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 9,
    marginBottom: 8,
  },

  inputLabel: {
    color: "#777",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 18,
    marginBottom: 8,
  },

  input: {
    backgroundColor: "#0b0b0b",
    borderWidth: 1,
    borderColor: "#292929",
    borderRadius: 12,
    color: "#fff",
    fontSize: 14,
    paddingHorizontal: 15,
    paddingVertical: 14,
  },

  loginButton: {
    backgroundColor: "#ff5a00",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 25,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  loginButtonText: {
    color: "#050505",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },

  createAccountBox: {
    alignItems: "center",
    marginTop: 22,
  },

  createAccountText: {
    color: "#666",
    fontSize: 10,
    marginBottom: 8,
  },

  createAccountButton: {
    color: "#ff5a00",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },

  // ========================================
  // PROFIL
  // ========================================

  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor:
      "rgba(16,16,16,0.94)",
    borderWidth: 1,
    borderColor: "#292929",
    borderRadius: 22,
    padding: 20,
    marginBottom: 30,
  },

  profileIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#ff5a00",
    alignItems: "center",
    justifyContent: "center",
  },

  profileIconText: {
    color: "#050505",
    fontSize: 25,
    fontWeight: "900",
  },

  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },

  profileName: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "900",
  },

  profileEmail: {
    color: "#666",
    fontSize: 10,
    marginTop: 5,
  },

  // ========================================
  // SECTIONS
  // ========================================

  sectionTitle: {
    color: "#777",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 15,
  },

  // ========================================
  // BILLET
  // ========================================

  ticketCard: {
    backgroundColor:
      "rgba(16,16,16,0.96)",
    borderWidth: 1,
    borderColor: "#ff5a00",
    borderRadius: 22,
    padding: 20,
    marginBottom: 30,
  },

  ticketTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  ticketEvent: {
    color: "#ff5a00",
    fontSize: 20,
    fontWeight: "900",
  },

  ticketParty: {
    color: "#666",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginTop: 5,
  },

  paymentBadge: {
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  paymentPaid: {
    backgroundColor:
      "rgba(110,231,160,0.12)",
  },

  paymentWaiting: {
    backgroundColor:
      "rgba(255,177,92,0.12)",
  },

  paymentText: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  paymentTextPaid: {
    color: "#6ee7a0",
  },

  paymentTextWaiting: {
    color: "#ffb15c",
  },

  ticketDivider: {
    height: 1,
    backgroundColor: "#242424",
    marginVertical: 20,
  },

  ticketInfoRow: {
    flexDirection: "row",
  },

  ticketInfoItem: {
    flex: 1,
  },

  ticketLabel: {
    color: "#555",
    fontSize: 8,
    fontWeight: "800",
  },

  ticketValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 5,
  },

  ticketPrice: {
    color: "#ff5a00",
    fontSize: 17,
    fontWeight: "900",
    marginTop: 3,
  },

  ticketDate: {
    backgroundColor: "#0b0b0b",
    borderRadius: 12,
    padding: 12,
    marginTop: 18,
  },

  ticketDateText: {
    color: "#777",
    fontSize: 9,
    fontWeight: "800",
    marginBottom: 5,
  },

  // ========================================
  // QR CODE
  // ========================================

  qrSection: {
    marginTop: 22,
    paddingTop: 22,
    borderTopWidth: 1,
    borderTopColor: "#242424",
    alignItems: "center",
  },

  qrTitle: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 15,
  },

  qrContainer: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  qrCodeLabel: {
    color: "#555",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginTop: 15,
  },

  qrCodeValue: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: 5,
  },

  qrInfo: {
    color: "#666",
    fontSize: 9,
    textAlign: "center",
    marginTop: 8,
  },

  ticketUsedBadge: {
    backgroundColor:
      "rgba(255,80,80,0.12)",
    borderWidth: 1,
    borderColor: "#7a2d2d",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
  },

  ticketUsedText: {
    color: "#ff7474",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  qrWaiting: {
    marginTop: 22,
    paddingTop: 22,
    borderTopWidth: 1,
    borderTopColor: "#242424",
    alignItems: "center",
  },

  qrWaitingIcon: {
    fontSize: 25,
  },

  qrWaitingTitle: {
    color: "#ffb15c",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginTop: 9,
  },

  qrWaitingText: {
    color: "#666",
    fontSize: 9,
    lineHeight: 15,
    textAlign: "center",
    marginTop: 7,
  },

  noTicketCard: {
    backgroundColor:
      "rgba(16,16,16,0.94)",
    borderWidth: 1,
    borderColor: "#292929",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    marginBottom: 30,
  },

  noTicketIcon: {
    fontSize: 28,
  },

  noTicketTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 10,
  },

  noTicketText: {
    color: "#666",
    fontSize: 10,
    textAlign: "center",
    lineHeight: 16,
    marginTop: 8,
  },

  // ========================================
  // INFORMATIONS
  // ========================================

  infoCard: {
    backgroundColor:
      "rgba(16,16,16,0.94)",
    borderWidth: 1,
    borderColor: "#292929",
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
  },

  personalRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#202020",
  },

  personalLabel: {
    color: "#555",
    fontSize: 8,
    fontWeight: "800",
    marginBottom: 5,
  },

  personalValue: {
    color: "#ddd",
    fontSize: 13,
    fontWeight: "700",
  },

  // ========================================
  // PARRAINAGE
  // ========================================

  referralCard: {
    backgroundColor:
      "rgba(16,16,16,0.94)",
    borderWidth: 1,
    borderColor: "#ff5a00",
    borderRadius: 22,
    padding: 22,
    alignItems: "center",
    marginBottom: 15,
  },

  referralLabel: {
    color: "#666",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 2,
  },

  referralCode: {
    color: "#fff",
    fontSize: 27,
    fontWeight: "900",
    letterSpacing: 3,
    marginTop: 10,
  },

  referralStats: {
    flexDirection: "row",
    width: "100%",
    marginTop: 22,
  },

  referralStat: {
    flex: 1,
    alignItems: "center",
  },

  referralNumber: {
    color: "#ff5a00",
    fontSize: 28,
    fontWeight: "900",
  },

  referralStatLabel: {
    color: "#666",
    fontSize: 7,
    fontWeight: "900",
    marginTop: 4,
    textAlign: "center",
  },

  referralStatDivider: {
    width: 1,
    backgroundColor: "#292929",
  },

  shareButton: {
    backgroundColor: "#ff5a00",
    borderRadius: 14,
    paddingVertical: 15,
    width: "100%",
    alignItems: "center",
    marginTop: 20,
  },

  shareButtonText: {
    color: "#050505",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },

  // ========================================
  // PROGRESSION
  // ========================================

  progressCard: {
    backgroundColor:
      "rgba(16,16,16,0.94)",
    borderWidth: 1,
    borderColor: "#292929",
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
  },

  progressTitle: {
    color: "#666",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 2,
  },

  progressReward: {
    color: "#ff5a00",
    fontSize: 14,
    fontWeight: "900",
    marginTop: 7,
  },

  progressNumbers: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 18,
  },

  progressCurrent: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "900",
  },

  progressTarget: {
    color: "#666",
    fontSize: 13,
    fontWeight: "800",
    marginLeft: 4,
  },

  progressBackground: {
    width: "100%",
    height: 8,
    backgroundColor: "#252525",
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 10,
  },

  progressBar: {
    height: "100%",
    backgroundColor: "#ff5a00",
    borderRadius: 10,
  },

  progressText: {
    color: "#666",
    fontSize: 9,
    lineHeight: 15,
    marginTop: 10,
  },

  // ========================================
  // RÉCOMPENSES
  // ========================================

  rewardCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor:
      "rgba(16,16,16,0.94)",
    borderWidth: 1,
    borderColor: "#ff5a00",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },

  rewardCardClaimed: {
    borderColor: "#292929",
    opacity: 0.7,
  },

  rewardLevel: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ff5a00",
    alignItems: "center",
    justifyContent: "center",
  },

  rewardLevelNumber: {
    color: "#050505",
    fontSize: 17,
    fontWeight: "900",
  },

  rewardInfo: {
    flex: 1,
    marginLeft: 14,
  },

  rewardTitle: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
  },

  rewardName: {
    color: "#ff5a00",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 4,
  },

  rewardStatus: {
    fontSize: 8,
    fontWeight: "900",
    marginTop: 6,
  },

  rewardStatusUnlocked: {
    color: "#6ee7a0",
  },

  rewardStatusClaimed: {
    color: "#777",
  },

  rewardCheck: {
    fontSize: 18,
    marginLeft: 8,
  },

  noRewardCard: {
    backgroundColor:
      "rgba(16,16,16,0.94)",
    borderWidth: 1,
    borderColor: "#292929",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    marginBottom: 20,
  },

  noRewardIcon: {
    fontSize: 25,
  },

  noRewardTitle: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 10,
  },

  noRewardText: {
    color: "#666",
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 7,
  },

  // ========================================
  // SOIRÉE
  // ========================================

  eventCard: {
    backgroundColor:
      "rgba(16,16,16,0.94)",
    borderWidth: 1,
    borderColor: "#292929",
    borderRadius: 20,
    padding: 22,
    marginBottom: 20,
  },

  eventTitle: {
    color: "#ff5a00",
    fontSize: 23,
    fontWeight: "900",
  },

  eventSubtitle: {
    color: "#666",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 2,
    marginTop: 5,
  },

  eventLine: {
    height: 1,
    backgroundColor: "#252525",
    marginVertical: 18,
  },

  eventInfo: {
    color: "#aaa",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 9,
  },

  // ========================================
  // DÉCONNEXION
  // ========================================

  logoutButton: {
    borderWidth: 1,
    borderColor: "#292929",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 5,
    marginBottom: 20,
  },

  logoutButtonText: {
    color: "#777",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },

  // ========================================
  // FOOTER
  // ========================================

  footer: {
    color: "#333",
    fontSize: 9,
    textAlign: "center",
    marginTop: 30,
  },
});