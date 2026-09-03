import React, { useState } from "react";
import {
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useLocalSearchParams } from "expo-router";

import AsyncStorage from "@react-native-async-storage/async-storage";

import FlyingBats from "../../components/FlyingBats";

const API_URL = "https://tnlp-server.onrender.com";

const TICKETS = [
  {
    name: "Prévente",
    price: "11,99 €",
    amount: 11.99,
    description:
      "Le meilleur tarif, disponible en quantité limitée",
    link: "https://pay.sumup.com/b2c/XNXP0POQMF",
    available: true,
  },

  {
    name: "Tarif normal",
    price: "17,99 €",
    amount: 17.99,
    description: "Tarif standard",
    link: "https://pay.sumup.com/b2c/X52EE500YC",
    available: false,
  },

  {
    name: "Late",
    price: "21,99 €",
    amount: 21.99,
    description: "Dernières places disponibles",
    link: "https://pay.sumup.com/b2c/XW8FFXKNUD",
    available: false,
  },
];

export default function BilletterieScreen() {
  const { code } = useLocalSearchParams<{
    code?: string;
  }>();

  // ========================================
  // CODE PARRAIN VENU DU LIEN
  // ========================================

  const codeDepuisLien =
    typeof code === "string"
      ? code.trim().toUpperCase()
      : "";

  // ========================================
  // ÉTATS
  // ========================================

  const [selectedTicket, setSelectedTicket] =
    useState<any>(null);

  const [firstName, setFirstName] =
    useState("");

  const [lastName, setLastName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [referralCode, setReferralCode] =
    useState(codeDepuisLien);

  const [loading, setLoading] =
    useState(false);

  // ========================================
  // CHOIX DU TARIF
  // ========================================

  const openForm = (ticket: any) => {
    if (!ticket.available) {
      return;
    }

    setSelectedTicket(ticket);
  };

  // ========================================
  // ENREGISTREMENT + PAIEMENT
  // ========================================

  const continueToPayment = async () => {
    if (loading) {
      return;
    }

    // ========================================
    // VÉRIFICATION DES CHAMPS
    // ========================================

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !phone.trim()
    ) {
      Alert.alert(
        "Informations manquantes",
        "Merci de remplir tous les champs."
      );

      return;
    }

    // ========================================
    // VÉRIFICATION EMAIL
    // ========================================

    if (!email.includes("@")) {
      Alert.alert(
        "Email invalide",
        "Vérifie ton adresse email."
      );

      return;
    }

    // ========================================
    // VÉRIFICATION TARIF
    // ========================================

    if (!selectedTicket) {
      Alert.alert(
        "Erreur",
        "Aucun tarif sélectionné."
      );

      return;
    }

    setLoading(true);

    try {
      // ========================================
      // NETTOYER LES INFORMATIONS
      // ========================================

      const cleanReferralCode =
        referralCode.trim().toUpperCase();

      const cleanEmail =
        email.trim().toLowerCase();

      // ========================================
      // ENVOI AU SERVEUR
      // ========================================

      const response = await fetch(
        `${API_URL}/register-participant`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            prenom:
              firstName.trim(),

            nom:
              lastName.trim(),

            mail:
              cleanEmail,

            telephone:
              phone.trim(),

            tarif:
              selectedTicket.name,

            montant:
              selectedTicket.amount,

            // Code du parrain
            code_parrain:
              cleanReferralCode || null,
          }),
        }
      );

      // ========================================
      // RÉPONSE SERVEUR
      // ========================================

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Impossible d'enregistrer le participant."
        );
      }

      // ========================================
      // SAUVEGARDE DE L'ID DU PARTICIPANT
      // ========================================

      if (data.participant?.id) {
        await AsyncStorage.setItem(
          "tnlp_participant_id",
          String(data.participant.id)
        );
      }

      // ========================================
      // SAUVEGARDE DU CODE PERSONNEL
      // ========================================

      if (
        data.participant?.code_parrain
      ) {
        await AsyncStorage.setItem(
          "tnlp_code_parrain",
          data.participant.code_parrain
        );
      }

      // ========================================
      // SAUVEGARDE DE L'EMAIL
      // ========================================

      await AsyncStorage.setItem(
        "tnlp_email",
        cleanEmail
      );

      // ========================================
      // LOG
      // ========================================

      console.log(
        "================================"
      );

      console.log(
        "PARTICIPANT ENREGISTRÉ"
      );

      console.log(
        "Participant :",
        data.participant
      );

      console.log(
        "ID participant :",
        data.participant?.id
      );

      console.log(
        "Email sauvegardé :",
        cleanEmail
      );

      console.log(
        "Tarif :",
        selectedTicket.name
      );

      console.log(
        "Montant :",
        selectedTicket.amount
      );

      console.log(
        "Code personnel :",
        data.participant?.code_parrain ||
          "Non disponible"
      );

      console.log(
        "Code parrain :",
        cleanReferralCode ||
          "Aucun"
      );

      console.log(
        "================================"
      );

      // ========================================
      // OUVERTURE SUMUP
      // ========================================

      const supported =
        await Linking.canOpenURL(
          selectedTicket.link
        );

      if (!supported) {
        throw new Error(
          "Impossible d'ouvrir le lien de paiement SumUp."
        );
      }

      await Linking.openURL(
        selectedTicket.link
      );

    } catch (error: any) {
      console.error(
        "Erreur billetterie :",
        error
      );

      Alert.alert(
        "Erreur",
        error?.message ||
          "Une erreur est survenue."
      );

    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // AFFICHAGE
  // ========================================

  return (
    <SafeAreaView style={styles.container}>

      <ImageBackground
        source={require(
          "../../assets/images/fond-fumee.png"
        )}
        style={styles.background}
        imageStyle={styles.backgroundImage}
      >

        <FlyingBats />

        <KeyboardAvoidingView
          style={styles.keyboard}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : undefined
          }
        >

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >

            {/* ========================================
                LISTE DES TARIFS
            ======================================== */}

            {!selectedTicket ? (

              <>

                <Text style={styles.smallTitle}>
                  NIGHTMARE
                </Text>

                <Text style={styles.title}>
                  BILLETTERIE
                </Text>

                <Text style={styles.subtitle}>
                  31 octobre 2026 · Savoie
                </Text>

                <View style={styles.separator} />

                <Text style={styles.sectionTitle}>
                  CHOISIS TON TARIF
                </Text>

                {TICKETS.map(
                  (ticket, index) => (

                    <View
                      key={ticket.name}
                      style={[
                        styles.ticketCard,

                        index === 0 &&
                          ticket.available &&
                          styles.preSaleCard,

                        !ticket.available &&
                          styles.unavailableCard,
                      ]}
                    >

                      {/* BADGE MEILLEUR TARIF */}

                      {index === 0 &&
                        ticket.available && (

                          <View
                            style={styles.badge}
                          >

                            <Text
                              style={
                                styles.badgeText
                              }
                            >
                              MEILLEUR TARIF
                            </Text>

                          </View>

                        )}

                      {/* BADGE INDISPONIBLE */}

                      {!ticket.available && (

                        <View
                          style={
                            styles.unavailableBadge
                          }
                        >

                          <Text
                            style={
                              styles.unavailableBadgeText
                            }
                          >
                            INDISPONIBLE
                          </Text>

                        </View>

                      )}

                      <View
                        style={
                          styles.ticketHeader
                        }
                      >

                        <View
                          style={
                            styles.ticketInfo
                          }
                        >

                          <Text
                            style={[
                              styles.ticketName,

                              !ticket.available &&
                                styles.unavailableText,
                            ]}
                          >
                            {ticket.name}
                          </Text>

                          <Text
                            style={[
                              styles.ticketDescription,

                              !ticket.available &&
                                styles.unavailableDescription,
                            ]}
                          >
                            {ticket.description}
                          </Text>

                        </View>

                        <Text
                          style={[
                            styles.ticketPrice,

                            !ticket.available &&
                              styles.unavailablePrice,
                          ]}
                        >
                          {ticket.price}
                        </Text>

                      </View>

                      <TouchableOpacity
                        style={[
                          styles.buyButton,

                          !ticket.available &&
                            styles.disabledButton,
                        ]}
                        disabled={
                          !ticket.available
                        }
                        activeOpacity={0.8}
                        onPress={() =>
                          openForm(ticket)
                        }
                      >

                        <Text
                          style={[
                            styles.buyButtonText,

                            !ticket.available &&
                              styles.disabledButtonText,
                          ]}
                        >
                          {ticket.available
                            ? "ACHETER"
                            : "INDISPONIBLE"}
                        </Text>

                      </TouchableOpacity>

                    </View>

                  )
                )}

                <View
                  style={styles.infoCard}
                >

                  <Text
                    style={styles.infoTitle}
                  >
                    🎃 ENTRÉE SUR LISTE
                  </Text>

                  <Text
                    style={styles.infoText}
                  >
                    Tes informations sont
                    enregistrées avant
                    l'ouverture du paiement
                    SumUp.
                  </Text>

                </View>

              </>

            ) : (

              /* ========================================
                 FORMULAIRE
              ======================================== */

              <>

                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => {

                    if (!loading) {
                      setSelectedTicket(null);
                    }

                  }}
                  disabled={loading}
                >

                  <Text
                    style={styles.backText}
                  >
                    ‹ Retour aux tarifs
                  </Text>

                </TouchableOpacity>

                <Text
                  style={styles.smallTitle}
                >
                  {selectedTicket.name}
                </Text>

                <Text
                  style={styles.title}
                >
                  TES INFORMATIONS
                </Text>

                <Text
                  style={styles.subtitle}
                >
                  {selectedTicket.price}
                </Text>

                {/* ========================================
                    PARRAINAGE
                ======================================== */}

                <View
                  style={styles.referralCard}
                >

                  <Text
                    style={styles.referralTitle}
                  >
                    🎃 PARRAINAGE
                  </Text>

                  <Text
                    style={styles.referralText}
                  >
                    Tu as été invité par quelqu'un ?
                  </Text>

                  <TextInput
                    style={styles.referralInput}
                    value={referralCode}
                    onChangeText={(text) =>
                      setReferralCode(
                        text.toUpperCase()
                      )
                    }
                    placeholder="TON CODE PARRAIN"
                    placeholderTextColor="#555"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    editable={!loading}
                    maxLength={10}
                  />

                  <Text
                    style={styles.referralHint}
                  >
                    Laisse vide si tu n'as pas de
                    code parrain.
                  </Text>

                </View>

                {/* ========================================
                    FORMULAIRE
                ======================================== */}

                <View
                  style={styles.formCard}
                >

                  {/* PRÉNOM */}

                  <Text
                    style={styles.inputLabel}
                  >
                    PRÉNOM
                  </Text>

                  <TextInput
                    style={styles.input}
                    value={firstName}
                    onChangeText={
                      setFirstName
                    }
                    placeholder="Ton prénom"
                    placeholderTextColor="#555"
                    autoCapitalize="words"
                    editable={!loading}
                  />

                  {/* NOM */}

                  <Text
                    style={styles.inputLabel}
                  >
                    NOM
                  </Text>

                  <TextInput
                    style={styles.input}
                    value={lastName}
                    onChangeText={
                      setLastName
                    }
                    placeholder="Ton nom"
                    placeholderTextColor="#555"
                    autoCapitalize="words"
                    editable={!loading}
                  />

                  {/* EMAIL */}

                  <Text
                    style={styles.inputLabel}
                  >
                    EMAIL
                  </Text>

                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={
                      setEmail
                    }
                    placeholder="ton@email.com"
                    placeholderTextColor="#555"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />

                  {/* TÉLÉPHONE */}

                  <Text
                    style={styles.inputLabel}
                  >
                    TÉLÉPHONE
                  </Text>

                  <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={
                      setPhone
                    }
                    placeholder="06 00 00 00 00"
                    placeholderTextColor="#555"
                    keyboardType="phone-pad"
                    editable={!loading}
                  />

                  {/* RÉCAPITULATIF */}

                  <View
                    style={styles.summary}
                  >

                    <Text
                      style={
                        styles.summaryLabel
                      }
                    >
                      TARIF
                    </Text>

                    <Text
                      style={
                        styles.summaryValue
                      }
                    >
                      {selectedTicket.name}
                    </Text>

                    <Text
                      style={
                        styles.summaryPrice
                      }
                    >
                      {selectedTicket.price}
                    </Text>

                  </View>

                  {/* BOUTON PAIEMENT */}

                  <TouchableOpacity
                    style={[
                      styles.paymentButton,

                      loading &&
                        styles.paymentButtonLoading,
                    ]}
                    activeOpacity={0.8}
                    onPress={
                      continueToPayment
                    }
                    disabled={loading}
                  >

                    <Text
                      style={
                        styles.paymentButtonText
                      }
                    >
                      {loading
                        ? "ENREGISTREMENT..."
                        : "CONTINUER VERS LE PAIEMENT"}
                    </Text>

                  </TouchableOpacity>

                  <Text
                    style={styles.paymentInfo}
                  >
                    Tes informations sont
                    enregistrées avant
                    l'ouverture du paiement
                    SumUp.
                  </Text>

                </View>

              </>

            )}

            <Text
              style={styles.footer}
            >
              TNLP · THE NEXT LEVEL PARTY
            </Text>

          </ScrollView>

        </KeyboardAvoidingView>

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

  keyboard: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 45,
    paddingBottom: 50,
  },

  // ========================================
  // TITRES
  // ========================================

  smallTitle: {
    color: "#777",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
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
    fontSize: 13,
    textAlign: "center",
    marginTop: 10,
  },

  separator: {
    height: 1,
    backgroundColor: "#222",
    marginTop: 38,
    marginBottom: 38,
  },

  sectionTitle: {
    color: "#777",
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 16,
  },

  // ========================================
  // TARIFS
  // ========================================

  ticketCard: {
    backgroundColor:
      "rgba(16, 16, 16, 0.94)",
    borderWidth: 1,
    borderColor: "#292929",
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
  },

  preSaleCard: {
    borderColor: "#ff5a00",
  },

  unavailableCard: {
    opacity: 0.55,
  },

  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#ff5a00",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 15,
  },

  badgeText: {
    color: "#050505",
    fontSize: 9,
    fontWeight: "900",
  },

  unavailableBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#292929",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 15,
  },

  unavailableBadgeText: {
    color: "#777",
    fontSize: 9,
    fontWeight: "900",
  },

  ticketHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  ticketInfo: {
    flex: 1,
    paddingRight: 15,
  },

  ticketName: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
  },

  unavailableText: {
    color: "#888",
  },

  ticketDescription: {
    color: "#777",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },

  unavailableDescription: {
    color: "#555",
  },

  ticketPrice: {
    color: "#ff5a00",
    fontSize: 23,
    fontWeight: "900",
  },

  unavailablePrice: {
    color: "#777",
  },

  buyButton: {
    backgroundColor: "#ff5a00",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
  },

  buyButtonText: {
    color: "#050505",
    fontSize: 14,
    fontWeight: "900",
  },

  disabledButton: {
    backgroundColor: "#242424",
  },

  disabledButtonText: {
    color: "#666",
  },

  // ========================================
  // INFOS
  // ========================================

  infoCard: {
    backgroundColor:
      "rgba(16, 16, 16, 0.88)",
    borderWidth: 1,
    borderColor: "#292929",
    borderRadius: 20,
    padding: 20,
    marginTop: 12,
  },

  infoTitle: {
    color: "#ff5a00",
    fontSize: 13,
    fontWeight: "900",
  },

  infoText: {
    color: "#777",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 8,
  },

  // ========================================
  // RETOUR
  // ========================================

  backButton: {
    marginBottom: 25,
  },

  backText: {
    color: "#ff5a00",
    fontSize: 14,
    fontWeight: "700",
  },

  // ========================================
  // PARRAINAGE
  // ========================================

  referralCard: {
    backgroundColor:
      "rgba(16, 16, 16, 0.94)",
    borderWidth: 1,
    borderColor: "#ff5a00",
    borderRadius: 18,
    padding: 18,
    marginTop: 22,
  },

  referralTitle: {
    color: "#ff5a00",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    textAlign: "center",
  },

  referralText: {
    color: "#777",
    fontSize: 11,
    textAlign: "center",
    marginTop: 10,
  },

  referralInput: {
    backgroundColor: "#0b0b0b",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 12,
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 2,
    paddingHorizontal: 15,
    paddingVertical: 14,
    marginTop: 14,
  },

  referralHint: {
    color: "#555",
    fontSize: 9,
    textAlign: "center",
    marginTop: 9,
  },

  // ========================================
  // FORMULAIRE
  // ========================================

  formCard: {
    backgroundColor:
      "rgba(16, 16, 16, 0.94)",
    borderWidth: 1,
    borderColor: "#292929",
    borderRadius: 22,
    padding: 22,
    marginTop: 20,
  },

  inputLabel: {
    color: "#777",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 18,
    marginBottom: 8,
  },

  input: {
    backgroundColor: "#0b0b0b",
    borderWidth: 1,
    borderColor: "#292929",
    borderRadius: 12,
    color: "#fff",
    fontSize: 15,
    paddingHorizontal: 15,
    paddingVertical: 14,
  },

  // ========================================
  // RÉCAPITULATIF
  // ========================================

  summary: {
    backgroundColor: "#0b0b0b",
    borderWidth: 1,
    borderColor: "#292929",
    borderRadius: 15,
    padding: 17,
    marginTop: 25,
  },

  summaryLabel: {
    color: "#666",
    fontSize: 9,
    fontWeight: "800",
  },

  summaryValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 5,
  },

  summaryPrice: {
    color: "#ff5a00",
    fontSize: 25,
    fontWeight: "900",
    marginTop: 4,
  },

  // ========================================
  // PAIEMENT
  // ========================================

  paymentButton: {
    backgroundColor: "#ff5a00",
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: "center",
    marginTop: 22,
  },

  paymentButtonLoading: {
    opacity: 0.6,
  },

  paymentButtonText: {
    color: "#050505",
    fontSize: 13,
    fontWeight: "900",
  },

  paymentInfo: {
    color: "#555",
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 14,
  },

  // ========================================
  // FOOTER
  // ========================================

  footer: {
    color: "#333",
    fontSize: 9,
    textAlign: "center",
    marginTop: 45,
  },

});