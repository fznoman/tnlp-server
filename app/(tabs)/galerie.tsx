import React, { useState } from "react";
import {
    Image,
    ImageBackground,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import FlyingBats from "../../components/FlyingBats";

const PHOTOS: any[] = [
  // ========================================
  // AJOUTER LES PHOTOS ICI PLUS TARD
  // ========================================
  //
  // {
  //   id: "1",
  //   source: require("../../assets/images/photo1.jpg"),
  // },
  //
  // Pour l'instant, la liste est vide.
];

export default function GalerieScreen() {
  const [selectedPhoto, setSelectedPhoto] =
    useState<any>(null);

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../../assets/images/fond-fumee.png")}
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
            GALERIE
          </Text>

          <Text style={styles.subtitle}>
            PHOTOS · VIDÉOS · SOUVENIRS
          </Text>

          <View style={styles.separator} />

          {/* PHOTOS */}

          <Text style={styles.sectionTitle}>
            PHOTOS
          </Text>

          {PHOTOS.length === 0 ? (
            <>
              <View style={styles.emptyHeader}>
                <Text style={styles.emptyIcon}>
                  ⏳
                </Text>

                <Text style={styles.emptyTitle}>
                  LES SOUVENIRS ARRIVENT
                </Text>

                <Text style={styles.emptyText}>
                  Les photos de NIGHTMARE seront
                  disponibles après la soirée.
                </Text>
              </View>

              <View style={styles.grid}>
                {[1, 2, 3, 4, 5, 6].map(
                  (item) => (
                    <View
                      key={item}
                      style={styles.photoCard}
                    >
                      <View
                        style={
                          styles.photoPlaceholder
                        }
                      >
                        <Text
                          style={styles.hourglass}
                        >
                          ⏳
                        </Text>

                        <Text
                          style={
                            styles.comingSoon
                          }
                        >
                          BIENTÔT
                        </Text>
                      </View>
                    </View>
                  )
                )}
              </View>
            </>
          ) : (
            <View style={styles.grid}>
              {PHOTOS.map((photo) => (
                <TouchableOpacity
                  key={photo.id}
                  style={styles.photoCard}
                  activeOpacity={0.85}
                  onPress={() =>
                    setSelectedPhoto(photo)
                  }
                >
                  <Image
                    source={photo.source}
                    style={styles.photo}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* VIDÉOS */}

          <Text style={styles.sectionTitle}>
            VIDÉOS
          </Text>

          <View style={styles.videoCard}>
            <View style={styles.videoContent}>
              <View style={styles.playCircle}>
                <Text style={styles.playIcon}>
                  ▶
                </Text>
              </View>

              <Text style={styles.videoTitle}>
                AFTERMOVIE
              </Text>

              <Text style={styles.videoSubtitle}>
                DISPONIBLE APRÈS LA SOIRÉE
              </Text>
            </View>
          </View>

          <View style={styles.videoCard}>
            <View style={styles.videoContent}>
              <View style={styles.playCircle}>
                <Text style={styles.playIcon}>
                  ▶
                </Text>
              </View>

              <Text style={styles.videoTitle}>
                TEASER
              </Text>

              <Text style={styles.videoSubtitle}>
                BIENTÔT DISPONIBLE...
                {"\n"}
                NIGHTMARE · 31 OCTOBRE 2026
              </Text>
            </View>
          </View>

          {/* MESSAGE */}

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>
              🎃 NIGHTMARE
            </Text>

            <Text style={styles.infoText}>
              Cette galerie sera mise à jour avec
              les photos et vidéos de la soirée.
            </Text>
          </View>

          <Text style={styles.footer}>
            TNLP · THE NEXT LEVEL PARTY
          </Text>
        </ScrollView>
      </ImageBackground>

      {/* PHOTO EN GRAND */}

      <Modal
        visible={selectedPhoto !== null}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setSelectedPhoto(null)
        }
      >
        <View style={styles.modalBackground}>
          <Pressable
            style={styles.closeButton}
            onPress={() =>
              setSelectedPhoto(null)
            }
          >
            <Text style={styles.closeText}>
              ×
            </Text>
          </Pressable>

          {selectedPhoto && (
            <Image
              source={selectedPhoto.source}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

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
    opacity: 0.35,
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 55,
    paddingBottom: 120,
  },

  smallTitle: {
    color: "#777",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },

  title: {
    color: "#ff5a00",
    fontSize: 42,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 12,
  },

  subtitle: {
    color: "#777",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 10,
    letterSpacing: 1,
  },

  separator: {
    height: 1,
    backgroundColor: "#222",
    marginTop: 38,
    marginBottom: 38,
  },

  sectionTitle: {
    color: "#ff5a00",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 16,
    marginTop: 12,
  },

  emptyHeader: {
    backgroundColor: "rgba(16, 16, 16, 0.94)",
    borderWidth: 1,
    borderColor: "#292929",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    marginBottom: 18,
  },

  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },

  emptyTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
  },

  emptyText: {
    color: "#666",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 8,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  photoCard: {
    width: "48%",
    marginBottom: 14,
  },

  photoPlaceholder: {
    height: 190,
    backgroundColor: "rgba(16, 16, 16, 0.95)",
    borderWidth: 1,
    borderColor: "#292929",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  hourglass: {
    fontSize: 38,
    marginBottom: 8,
  },

  comingSoon: {
    color: "#555",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 2,
    textAlign: "center",
  },

  photo: {
    width: "100%",
    height: 190,
    borderRadius: 18,
  },

  videoCard: {
    backgroundColor: "rgba(16, 16, 16, 0.95)",
    borderWidth: 1,
    borderColor: "#292929",
    borderRadius: 20,
    marginBottom: 16,
    overflow: "hidden",
  },

  videoContent: {
    height: 190,
    alignItems: "center",
    justifyContent: "center",
  },

  playCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#ff5a00",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  playIcon: {
    color: "#050505",
    fontSize: 20,
    marginLeft: 3,
  },

  videoTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },

  videoSubtitle: {
    color: "#666",
    fontSize: 9,
    fontWeight: "700",
    marginTop: 6,
    textAlign: "center",
    lineHeight: 15,
  },

  infoCard: {
    backgroundColor: "rgba(16, 16, 16, 0.9)",
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

  footer: {
    color: "#333",
    fontSize: 9,
    textAlign: "center",
    marginTop: 45,
  },

  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.97)",
    alignItems: "center",
    justifyContent: "center",
  },

  fullImage: {
    width: "100%",
    height: "80%",
  },

  closeButton: {
    position: "absolute",
    top: 55,
    right: 25,
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: "#222",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },

  closeText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "300",
    lineHeight: 35,
  },
});