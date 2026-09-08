const express = require("express");
const cors = require("cors");
require("dotenv").config();

const supabase = require("./supabase");

const app = express();

app.use(cors());
app.use(express.json());


// ========================================
// CONFIGURATION ADMIN
// ========================================

const ADMIN_PIN = process.env.ADMIN_PIN;

if (!ADMIN_PIN) {
  console.error(
    "ATTENTION : ADMIN_PIN n'est pas défini dans le fichier .env"
  );
}


// ========================================
// RÉCOMPENSES
// ========================================

const REWARDS = [
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


// ========================================
// TARIFS / LIMITES DE BILLETS
// ========================================

const TICKET_CONFIG = {
  "Prévente": {
    amount: 12.99,
    limit: 30,
  },

  "Tarif normal": {
    amount: 17.99,
    limit: 140,
  },

  "Late": {
    amount: 21.99,
    limit: 30,
  },
};

const TICKET_ORDER = [
  "Prévente",
  "Tarif normal",
  "Late",
];


// ========================================
// VERROU DES VENTES
// ========================================
//
// Permet d'éviter que deux validations de paiement
// simultanées dépassent la limite d'un tarif.
//
// Exemple :
// 29 Early vendues
// Deux validations arrivent en même temps
// Une seule pourra prendre la 30e place.
//

let ticketSaleLock = Promise.resolve();

async function withTicketSaleLock(fn) {
  const previousLock = ticketSaleLock;

  let releaseLock;

  ticketSaleLock = new Promise((resolve) => {
    releaseLock = resolve;
  });

  await previousLock;

  try {
    return await fn();
  } finally {
    releaseLock();
  }
}


// ========================================
// RÉCUPÉRER LES DISPONIBILITÉS
// ========================================

async function getTicketAvailability() {
  const tickets = {};

  for (const ticketName of TICKET_ORDER) {
    const {
      count,
      error,
    } = await supabase
      .from("Participants")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq(
        "statut_paiement",
        "paye"
      )
      .eq(
        "tarif",
        ticketName
      );

    if (error) {
      throw error;
    }

    const sold = count || 0;

    const limit =
      TICKET_CONFIG[ticketName].limit;

    tickets[ticketName] = {
      sold,
      limit,
      remaining:
        Math.max(
          limit - sold,
          0
        ),
    };
  }

  return tickets;
}


// ========================================
// VÉRIFIER DISPONIBILITÉ D'UN TARIF
// ========================================

function checkTicketAvailability(
  tarif,
  tickets
) {
  if (!TICKET_CONFIG[tarif]) {
    return {
      ok: false,
      error: "Tarif invalide.",
    };
  }

  const current =
    tickets[tarif];

  // Tarif complet
  if (
    !current ||
    current.sold >= current.limit
  ) {
    return {
      ok: false,
      error:
        `Le tarif ${tarif} est SOLD OUT.`,
      soldOut: true,
    };
  }

  const index =
    TICKET_ORDER.indexOf(
      tarif
    );

  // Vérifier que le tarif précédent
  // est bien terminé
  if (index > 0) {
    const previousTicket =
      TICKET_ORDER[index - 1];

    const previous =
      tickets[previousTicket];

    if (
      !previous ||
      previous.sold <
        previous.limit
    ) {
      return {
        ok: false,
        error:
          `Le tarif ${tarif} n'est pas encore disponible.`,
        locked: true,
      };
    }
  }

  return {
    ok: true,
  };
}


// ========================================
// VALIDER RÉELLEMENT UNE PLACE
// ========================================
//
// Cette fonction est utilisée au moment où
// l'administrateur valide le paiement.
//
// Elle vérifie à nouveau la disponibilité
// juste avant de passer le billet en "paye".
//

async function reserveTicketSlot(
  participantId,
  tarif
) {
  return withTicketSaleLock(
    async () => {

      const tickets =
        await getTicketAvailability();

      const availability =
        checkTicketAvailability(
          tarif,
          tickets
        );

      if (!availability.ok) {
        return {
          ok: false,
          ...availability,
          tickets,
        };
      }

      // ========================================
      // GÉNÉRER CODE BILLET
      // ========================================

      let billetCode = null;
      let billetUnique = false;

      while (!billetUnique) {

        billetCode =
          generateTicketCode();

        const {
          data: existingTicket,
          error:
            ticketCheckError,
        } = await supabase
          .from("Participants")
          .select("id")
          .eq(
            "billet_code",
            billetCode
          )
          .maybeSingle();

        if (ticketCheckError) {
          throw ticketCheckError;
        }

        if (!existingTicket) {
          billetUnique = true;
        }
      }

      // ========================================
      // VALIDER LE PAIEMENT
      // ========================================

      const {
        data: updatedParticipant,
        error: updateError,
      } = await supabase
        .from("Participants")
        .update({
          statut_paiement:
            "paye",

          billet_code:
            billetCode,

          billet_utilise:
            false,

          billet_utilise_at:
            null,
        })
        .eq(
          "id",
          participantId
        )
        .eq(
          "statut_paiement",
          "en_attente"
        )
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      return {
        ok: true,

        participant:
          updatedParticipant,

        billetCode,

        tickets,
      };
    }
  );
}


// ========================================
// GÉNÉRER CODE PARRAINAGE
// ========================================

function generateReferralCode() {
  const characters =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "TNLP";

  for (let i = 0; i < 6; i++) {
    code += characters.charAt(
      Math.floor(
        Math.random() *
          characters.length
      )
    );
  }

  return code;
}


// ========================================
// GÉNÉRER UN CODE DE BILLET UNIQUE
// ========================================

function generateTicketCode() {
  const characters =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "NMP";

  for (let i = 0; i < 10; i++) {
    code += characters.charAt(
      Math.floor(
        Math.random() *
          characters.length
      )
    );
  }

  return code;
}


// ========================================
// VÉRIFIER PIN ADMIN
// ========================================

function checkAdminPin(
  req,
  res,
  next
) {
  const pin =
    req.headers[
      "x-admin-pin"
    ];

  if (
    !ADMIN_PIN ||
    pin !== ADMIN_PIN
  ) {
    return res.status(401).json({
      error:
        "Accès administrateur refusé.",
    });
  }

  next();
}


// ========================================
// CRÉER UN COMPTE
// SANS BILLET
// ========================================

app.post(
  "/register-account",
  async (req, res) => {
    try {

      const {
        prenom,
        nom,
        mail,
        telephone,
        password,
      } = req.body;

      if (
        !prenom ||
        !nom ||
        !mail ||
        !telephone ||
        !password
      ) {
        return res.status(400).json({
          error:
            "Merci de remplir tous les champs.",
        });
      }

      const cleanPrenom =
        prenom.trim();

      const cleanNom =
        nom.trim();

      const cleanMail =
        mail
          .trim()
          .toLowerCase();

      const cleanTelephone =
        telephone.trim();

      const cleanPassword =
        password.trim();

      if (
        cleanPassword.length < 4
      ) {
        return res.status(400).json({
          error:
            "Le mot de passe doit contenir au moins 4 caractères.",
        });
      }


      // ========================================
      // VÉRIFIER EMAIL
      // ========================================

      const {
        data: existingEmail,
        error: emailError,
      } = await supabase
        .from("Participants")
        .select("id")
        .ilike(
          "mail",
          cleanMail
        )
        .maybeSingle();

      if (emailError) {

        console.error(
          "Erreur vérification email :",
          emailError
        );

        return res.status(500).json({
          error:
            "Impossible de vérifier l'adresse email.",
        });
      }

      if (existingEmail) {
        return res.status(400).json({
          error:
            "Un compte existe déjà avec cette adresse email.",
        });
      }


      // ========================================
      // VÉRIFIER TÉLÉPHONE
      // ========================================

      const {
        data: existingPhone,
        error: phoneError,
      } = await supabase
        .from("Participants")
        .select("id")
        .eq(
          "telephone",
          cleanTelephone
        )
        .maybeSingle();

      if (phoneError) {

        console.error(
          "Erreur vérification téléphone :",
          phoneError
        );

        return res.status(500).json({
          error:
            "Impossible de vérifier le numéro de téléphone.",
        });
      }

      if (existingPhone) {
        return res.status(400).json({
          error:
            "Un compte existe déjà avec ce numéro de téléphone.",
        });
      }


      // ========================================
      // GÉNÉRER CODE PERSONNEL
      // ========================================

      let nouveauCode = null;
      let codeUnique = false;

      while (!codeUnique) {

        nouveauCode =
          generateReferralCode();

        const {
          data: existingCode,
          error: checkError,
        } = await supabase
          .from("Participants")
          .select("id")
          .eq(
            "code_parrain",
            nouveauCode
          )
          .maybeSingle();

        if (checkError) {

          console.error(
            "Erreur génération code :",
            checkError
          );

          return res.status(500).json({
            error:
              "Impossible de générer le code de parrainage.",
          });
        }

        if (!existingCode) {
          codeUnique = true;
        }
      }


      // ========================================
      // CRÉER COMPTE
      // ========================================

      const {
        data: participant,
        error: insertError,
      } = await supabase
        .from("Participants")
        .insert([
          {
            prenom:
              cleanPrenom,

            nom:
              cleanNom,

            mail:
              cleanMail,

            telephone:
              cleanTelephone,

            password:
              cleanPassword,

            tarif:
              null,

            montant:
              null,

            statut_paiement:
              "en_attente",

            parrain_code:
              null,

            code_parrain:
              nouveauCode,
          },
        ])
        .select()
        .single();

      if (insertError) {

        console.error(
          "Erreur création compte :",
          insertError
        );

        return res.status(500).json({
          error:
            "Impossible de créer le compte.",

          details:
            insertError.message,
        });
      }


      console.log(
        "================================"
      );

      console.log(
        "COMPTE CRÉÉ"
      );

      console.log(
        "Participant :",
        cleanPrenom,
        cleanNom
      );

      console.log(
        "Email :",
        cleanMail
      );

      console.log(
        "Téléphone :",
        cleanTelephone
      );

      console.log(
        "Code personnel :",
        nouveauCode
      );

      console.log(
        "================================"
      );


      return res.json({
        success: true,
        participant,
      });

    } catch (error) {

      console.error(
        "Erreur création compte :",
        error
      );

      return res.status(500).json({
        error:
          "Erreur serveur.",

        details:
          error.message,
      });
    }
  }
);


// ========================================
// CONNEXION
// EMAIL OU TÉLÉPHONE + MOT DE PASSE
// ========================================

app.post(
  "/login",
  async (req, res) => {
    try {

      const {
        login,
        password,
      } = req.body;

      if (
        !login ||
        !password
      ) {
        return res.status(400).json({
          error:
            "Identifiant et mot de passe requis.",
        });
      }

      const cleanLogin =
        login.trim();

      const cleanPassword =
        password.trim();

      let participant = null;


      // ========================================
      // RECHERCHE PAR EMAIL
      // ========================================

      const {
        data: participantByEmail,
        error: emailError,
      } = await supabase
        .from("Participants")
        .select("*")
        .ilike(
          "mail",
          cleanLogin.toLowerCase()
        )
        .maybeSingle();

      if (emailError) {

        console.error(
          "Erreur recherche email :",
          emailError
        );

        return res.status(500).json({
          error:
            "Impossible de se connecter.",
        });
      }

      if (participantByEmail) {
        participant =
          participantByEmail;
      }


      // ========================================
      // RECHERCHE PAR TÉLÉPHONE
      // ========================================

      if (!participant) {

        const {
          data: participantByPhone,
          error: phoneError,
        } = await supabase
          .from("Participants")
          .select("*")
          .eq(
            "telephone",
            cleanLogin
          )
          .maybeSingle();

        if (phoneError) {

          console.error(
            "Erreur recherche téléphone :",
            phoneError
          );

          return res.status(500).json({
            error:
              "Impossible de se connecter.",
          });
        }

        if (participantByPhone) {
          participant =
            participantByPhone;
        }
      }


      // ========================================
      // AUCUN COMPTE
      // ========================================

      if (!participant) {
        return res.status(401).json({
          error:
            "Email ou numéro de téléphone incorrect.",
        });
      }


      // ========================================
      // MOT DE PASSE
      // ========================================

      if (
        participant.password !==
        cleanPassword
      ) {
        return res.status(401).json({
          error:
            "Mot de passe incorrect.",
        });
      }


      console.log(
        "================================"
      );

      console.log(
        "CONNEXION RÉUSSIE"
      );

      console.log(
        "Participant :",
        participant.prenom,
        participant.nom
      );

      console.log(
        "================================"
      );


      return res.json({
        success: true,
        participant,
      });

    } catch (error) {

      console.error(
        "Erreur connexion :",
        error
      );

      return res.status(500).json({
        error:
          "Erreur serveur.",

        details:
          error.message,
      });
    }
  }
);


// ========================================
// BILLETS
// DISPONIBILITÉ DES TARIFS
// ========================================

app.get(
  "/ticket-availability",
  async (req, res) => {

    try {

      const tickets =
        await getTicketAvailability();

      return res.json({
        success: true,
        tickets,
      });

    } catch (error) {

      console.error(
        "Erreur disponibilité billets :",
        error
      );

      return res.status(500).json({
        success: false,

        error:
          "Impossible de récupérer les disponibilités.",
      });
    }
  }
);


// ========================================
// ENREGISTRER UN PARTICIPANT
// ACHAT D'UN BILLET
// ========================================

app.post(
  "/register-participant",
  async (req, res) => {

    try {

      const {
        prenom,
        nom,
        mail,
        telephone,
        tarif,
        montant,
        code_parrain,
        password,
      } = req.body;


      // ========================================
      // VÉRIFICATION CHAMPS
      // ========================================

      if (
        !prenom ||
        !nom ||
        !mail ||
        !telephone
      ) {
        return res.status(400).json({
          error:
            "Merci de remplir tous les champs.",
        });
      }

      if (!tarif) {
        return res.status(400).json({
          error:
            "Tarif manquant.",
        });
      }

      if (
        montant === undefined ||
        montant === null
      ) {
        return res.status(400).json({
          error:
            "Montant manquant.",
        });
      }


      // ========================================
      // VÉRIFIER TARIF + MONTANT
      // ========================================

      if (
        !TICKET_CONFIG[tarif]
      ) {
        return res.status(400).json({
          error:
            "Tarif invalide.",
        });
      }

      const expectedAmount =
        TICKET_CONFIG[tarif].amount;

      if (
        Number(montant) !==
        expectedAmount
      ) {
        return res.status(400).json({
          error:
            "Le montant ne correspond pas au tarif sélectionné.",
        });
      }


      const cleanMail =
        mail
          .trim()
          .toLowerCase();

      const cleanTelephone =
        telephone.trim();


      // ========================================
      // RECHERCHER COMPTE EXISTANT
      // ========================================

      const {
        data: existingParticipant,
        error: existingError,
      } = await supabase
        .from("Participants")
        .select("*")
        .ilike(
          "mail",
          cleanMail
        )
        .maybeSingle();

      if (existingError) {

        console.error(
          "Erreur recherche participant :",
          existingError
        );

        return res.status(500).json({
          error:
            "Impossible de vérifier le compte.",
        });
      }


      // ========================================
      // COMPTE EXISTANT
      // ========================================

      if (
        existingParticipant
      ) {

        let codeParrainFinal =
          existingParticipant.parrain_code ||
          null;


        // ========================================
        // VÉRIFIER CODE PARRAIN
        // ========================================

        if (code_parrain) {

          const code =
            code_parrain
              .trim()
              .toUpperCase();

          const {
            data: parrain,
            error: parrainError,
          } = await supabase
            .from("Participants")
            .select(
              "id, code_parrain, mail, telephone"
            )
            .eq(
              "code_parrain",
              code
            )
            .maybeSingle();

          if (parrainError) {

            console.error(
              "Erreur recherche parrain :",
              parrainError
            );

            return res.status(500).json({
              error:
                "Impossible de vérifier le code de parrainage.",
            });
          }

          if (!parrain) {
            return res.status(400).json({
              error:
                "Code de parrainage invalide.",
            });
          }


          // ========================================
          // BLOQUER AUTO-PARRAINAGE
          // ========================================

          const parrainMail =
            parrain.mail
              ?.trim()
              .toLowerCase();

          const parrainTelephone =
            parrain.telephone
              ?.trim();

          if (
            (
              parrainMail &&
              parrainMail ===
                cleanMail
            ) ||
            (
              parrainTelephone &&
              parrainTelephone ===
                cleanTelephone
            )
          ) {

            return res.status(400).json({
              error:
                "Tu ne peux pas utiliser ton propre code de parrainage.",
            });
          }

          codeParrainFinal =
            code;
        }


        // ========================================
        // MISE À JOUR COMPTE
        // ========================================

        const updateData = {

          prenom:
            prenom.trim(),

          nom:
            nom.trim(),

          telephone:
            cleanTelephone,

          tarif:
            tarif,

          montant:
            Number(montant),

          statut_paiement:
            "en_attente",

          parrain_code:
            codeParrainFinal,
        };


        // ========================================
        // PASSWORD
        // ========================================

        if (
          password &&
          !existingParticipant.password
        ) {

          updateData.password =
            password.trim();
        }


        const {
          data: updatedParticipant,
          error: updateError,
        } = await supabase
          .from("Participants")
          .update(updateData)
          .eq(
            "id",
            existingParticipant.id
          )
          .select()
          .single();

        if (updateError) {

          console.error(
            "Erreur mise à jour participant :",
            updateError
          );

          return res.status(500).json({
            error:
              "Impossible d'enregistrer le billet.",

            details:
              updateError.message,
          });
        }


        // ========================================
        // CRÉER PARRAINAGE
        // ========================================

        if (codeParrainFinal) {

          const {
            data: existingParrainage,
          } = await supabase
            .from("Parrainages")
            .select("id")
            .eq(
              "code_parrain",
              codeParrainFinal
            )
            .eq(
              "mail_filleul",
              cleanMail
            )
            .maybeSingle();

          if (
            !existingParrainage
          ) {

            await supabase
              .from("Parrainages")
              .insert([
                {
                  code_parrain:
                    codeParrainFinal,

                  prenom_filleul:
                    prenom.trim(),

                  nom_filleul:
                    nom.trim(),

                  mail_filleul:
                    cleanMail,

                  telephone_filleul:
                    cleanTelephone,

                  valide:
                    false,
                },
              ]);
          }
        }


        return res.json({
          success: true,

          participant:
            updatedParticipant,

          code_parrain:
            updatedParticipant.code_parrain,

          parrain_code:
            updatedParticipant.parrain_code,
        });
      }


      // ========================================
      // NOUVEAU PARTICIPANT
      // ========================================

      let codeParrainFinal =
        null;


      if (code_parrain) {

        const code =
          code_parrain
            .trim()
            .toUpperCase();

        const {
          data: parrain,
          error: parrainError,
        } = await supabase
          .from("Participants")
          .select(
            "id, code_parrain, mail, telephone"
          )
          .eq(
            "code_parrain",
            code
          )
          .maybeSingle();

        if (parrainError) {

          console.error(
            "Erreur recherche parrain :",
            parrainError
          );

          return res.status(500).json({
            error:
              "Impossible de vérifier le code de parrainage.",
          });
        }

        if (!parrain) {
          return res.status(400).json({
            error:
              "Code de parrainage invalide.",
          });
        }


        // ========================================
        // BLOQUER AUTO-PARRAINAGE
        // ========================================

        const parrainMail =
          parrain.mail
            ?.trim()
            .toLowerCase();

        const parrainTelephone =
          parrain.telephone
            ?.trim();

        if (
          (
            parrainMail &&
            parrainMail ===
              cleanMail
          ) ||
          (
            parrainTelephone &&
            parrainTelephone ===
              cleanTelephone
          )
        ) {

          return res.status(400).json({
            error:
              "Tu ne peux pas utiliser ton propre code de parrainage.",
          });
        }

        codeParrainFinal =
          code;
      }


      // ========================================
      // GÉNÉRER CODE PERSONNEL
      // ========================================

      let nouveauCode = null;
      let codeUnique = false;

      while (!codeUnique) {

        nouveauCode =
          generateReferralCode();

        const {
          data: existingCode,
          error: checkError,
        } = await supabase
          .from("Participants")
          .select("id")
          .eq(
            "code_parrain",
            nouveauCode
          )
          .maybeSingle();

        if (checkError) {

          return res.status(500).json({
            error:
              "Impossible de générer le code de parrainage.",
          });
        }

        if (!existingCode) {
          codeUnique = true;
        }
      }


      // ========================================
      // CRÉER PARTICIPANT
      // ========================================

      const {
        data,
        error,
      } = await supabase
        .from("Participants")
        .insert([
          {
            prenom:
              prenom.trim(),

            nom:
              nom.trim(),

            mail:
              cleanMail,

            telephone:
              cleanTelephone,

            password:
              password
                ? password.trim()
                : null,

            tarif:
              tarif,

            montant:
              Number(montant),

            statut_paiement:
              "en_attente",

            parrain_code:
              codeParrainFinal,

            code_parrain:
              nouveauCode,
          },
        ])
        .select()
        .single();


      if (error) {

        console.error(
          "Erreur Supabase :",
          error
        );

        return res.status(500).json({
          error:
            "Impossible d'enregistrer le participant.",

          details:
            error.message,
        });
      }


      // ========================================
      // CRÉER PARRAINAGE
      // ========================================

      if (codeParrainFinal) {

        await supabase
          .from("Parrainages")
          .insert([
            {
              code_parrain:
                codeParrainFinal,

              prenom_filleul:
                prenom.trim(),

              nom_filleul:
                nom.trim(),

              mail_filleul:
                cleanMail,

              telephone_filleul:
                cleanTelephone,

              valide:
                false,
            },
          ]);
      }


      return res.json({
        success: true,

        participant:
          data,

        code_parrain:
          nouveauCode,

        parrain_code:
          codeParrainFinal,
      });

    } catch (error) {

      console.error(
        "Erreur serveur :",
        error
      );

      return res.status(500).json({
        error:
          "Erreur serveur.",

        details:
          error.message,
      });
    }
  }
);


// ========================================
// COMPTE
// RÉCUPÉRER PAR EMAIL
// ========================================

app.get(
  "/participant/email/:email",
  async (req, res) => {

    try {

      const email =
        decodeURIComponent(
          req.params.email
        )
          .trim()
          .toLowerCase();

      if (!email) {
        return res.status(400).json({
          error:
            "Adresse email manquante.",
        });
      }

      const {
        data: participant,
        error,
      } = await supabase
        .from("Participants")
        .select(`
          id,
          prenom,
          nom,
          mail,
          telephone,
          tarif,
          montant,
          statut_paiement,
          code_parrain,
          parrain_code,
          billet_code,
          billet_utilise,
          billet_utilise_at
        `)
        .ilike(
          "mail",
          email
        )
        .maybeSingle();

      if (error) {

        console.error(
          "Erreur compte email :",
          error
        );

        return res.status(500).json({
          error:
            "Impossible de récupérer le compte.",
        });
      }

      if (!participant) {
        return res.status(404).json({
          error:
            "Aucun compte trouvé.",
        });
      }

      return res.json({
        success: true,
        participant,
      });

    } catch (error) {

      console.error(
        "Erreur serveur compte email :",
        error
      );

      return res.status(500).json({
        error:
          "Erreur serveur.",
      });
    }
  }
);


// ========================================
// COMPTE
// RÉCUPÉRER PAR ID
// ========================================

app.get(
  "/participant/:id",
  async (req, res) => {

    try {

      const participantId =
        req.params.id;

      if (!participantId) {
        return res.status(400).json({
          error:
            "ID participant manquant.",
        });
      }

      const {
        data: participant,
        error,
      } = await supabase
        .from("Participants")
        .select(`
          id,
          prenom,
          nom,
          mail,
          telephone,
          tarif,
          montant,
          statut_paiement,
          code_parrain,
          parrain_code,
          billet_code,
          billet_utilise,
          billet_utilise_at
        `)
        .eq(
          "id",
          participantId
        )
        .maybeSingle();

      if (error) {

        return res.status(500).json({
          error:
            "Impossible de récupérer ton compte.",
        });
      }

      if (!participant) {
        return res.status(404).json({
          error:
            "Participant introuvable.",
        });
      }

      return res.json({
        success: true,
        participant,
      });

    } catch (error) {

      return res.status(500).json({
        error:
          "Erreur serveur.",
      });
    }
  }
);


// ========================================
// ADMIN
// PARTICIPANTS
// ========================================

app.get(
  "/admin/participants",
  checkAdminPin,
  async (req, res) => {

    try {

      const {
        data,
        error,
      } = await supabase
        .from("Participants")
        .select(`
          id,
          prenom,
          nom,
          mail,
          telephone,
          tarif,
          montant,
          statut_paiement,
          code_parrain,
          parrain_code,
          billet_code,
          billet_utilise,
          billet_utilise_at
        `)
        .order(
          "id",
          {
            ascending:
              false,
          }
        );

      if (error) {

        return res.status(500).json({
          error:
            "Impossible de récupérer les participants.",
        });
      }

      return res.json({
        success: true,
        participants:
          data || [],
      });

    } catch (error) {

      return res.status(500).json({
        error:
          "Erreur serveur.",
      });
    }
  }
);


// ========================================
// ADMIN
// VALIDER PAIEMENT
// ========================================

app.post(
  "/admin/validate-payment",
  checkAdminPin,
  async (req, res) => {

    try {

      const {
        participantId,
      } = req.body;

      if (!participantId) {
        return res.status(400).json({
          error:
            "Participant manquant.",
        });
      }


      // ========================================
      // RÉCUPÉRER PARTICIPANT
      // ========================================

      const {
        data: participant,
        error: participantError,
      } = await supabase
        .from("Participants")
        .select(`
          id,
          prenom,
          nom,
          mail,
          tarif,
          montant,
          statut_paiement,
          parrain_code
        `)
        .eq(
          "id",
          participantId
        )
        .maybeSingle();

      if (participantError) {

        return res.status(500).json({
          error:
            "Impossible de récupérer le participant.",
        });
      }

      if (!participant) {

        return res.status(404).json({
          error:
            "Participant introuvable.",
        });
      }


      // ========================================
      // DÉJÀ PAYÉ
      // ========================================

      if (
        participant.statut_paiement ===
        "paye"
      ) {

        return res.status(400).json({
          error:
            "Ce paiement est déjà validé.",
        });
      }


      // ========================================
      // VÉRIFIER LIMITE + VALIDER BILLET
      // ========================================

      const saleResult =
        await reserveTicketSlot(
          participant.id,
          participant.tarif
        );


      // ========================================
      // TARIF SOLD OUT / BLOQUÉ
      // ========================================

      if (!saleResult.ok) {

        return res.status(400).json({

          error:
            saleResult.error,

          soldOut:
            saleResult.soldOut ||
            false,

          locked:
            saleResult.locked ||
            false,

          tickets:
            saleResult.tickets ||
            null,
        });
      }


      const updatedParticipant =
        saleResult.participant;

      const billetCode =
        saleResult.billetCode;


      let parrainageValide =
        false;

      let codeParrain =
        null;

      let referralsCount =
        0;

      let parrainParticipant =
        null;

      let rewardsCreated =
        [];


      // ========================================
      // VALIDER PARRAINAGE
      // ========================================

      if (
        participant.parrain_code
      ) {

        codeParrain =
          participant.parrain_code
            .trim()
            .toUpperCase();

        const {
          data: parrainages,
        } = await supabase
          .from("Parrainages")
          .select("*")
          .eq(
            "code_parrain",
            codeParrain
          );


        const mailParticipant =
          participant.mail
            .trim()
            .toLowerCase();


        const parrainage =
          parrainages?.find(
            (item) =>
              item.mail_filleul
                ?.trim()
                .toLowerCase() ===
              mailParticipant
          );


        if (parrainage) {

          if (
            parrainage.valide ===
            true
          ) {

            parrainageValide =
              true;

          } else {

            const {
              error:
                parrainageUpdateError,
            } = await supabase
              .from("Parrainages")
              .update({
                valide:
                  true,
              })
              .eq(
                "id",
                parrainage.id
              );

            if (
              !parrainageUpdateError
            ) {

              parrainageValide =
                true;
            }
          }
        }
      }


      // ========================================
      // TROUVER PARRAIN
      // ========================================

      if (codeParrain) {

        const {
          data: parrain,
        } = await supabase
          .from("Participants")
          .select(`
            id,
            prenom,
            nom,
            code_parrain
          `)
          .eq(
            "code_parrain",
            codeParrain
          )
          .maybeSingle();

        parrainParticipant =
          parrain;
      }


      // ========================================
      // COMPTER FILLEULS
      // ========================================

      if (codeParrain) {

        const {
          count,
        } = await supabase
          .from("Parrainages")
          .select(
            "*",
            {
              count:
                "exact",

              head:
                true,
            }
          )
          .eq(
            "code_parrain",
            codeParrain
          )
          .eq(
            "valide",
            true
          );

        referralsCount =
          count || 0;
      }


      // ========================================
      // CRÉER RÉCOMPENSES
      // ========================================

      if (
        parrainParticipant &&
        referralsCount > 0
      ) {

        for (
          const level of REWARDS
        ) {

          if (
            referralsCount >=
            level.number
          ) {

            const {
              data:
                existingReward,
            } = await supabase
              .from("Recompenses")
              .select(
                "id, statut"
              )
              .eq(
                "participant_id",
                parrainParticipant.id
              )
              .eq(
                "palier",
                level.number
              )
              .maybeSingle();


            if (
              !existingReward
            ) {

              const {
                data:
                  newReward,
              } = await supabase
                .from("Recompenses")
                .insert([
                  {
                    participant_id:
                      parrainParticipant.id,

                    palier:
                      level.number,

                    recompense:
                      level.reward,

                    statut:
                      "debloquee",
                  },
                ])
                .select()
                .single();

              if (newReward) {

                rewardsCreated.push(
                  newReward
                );
              }
            }
          }
        }
      }


      // ========================================
      // LOG
      // ========================================

      console.log(
        "================================"
      );

      console.log(
        "PAIEMENT VALIDÉ"
      );

      console.log(
        "Participant :",
        updatedParticipant.prenom,
        updatedParticipant.nom
      );

      console.log(
        "Tarif :",
        updatedParticipant.tarif
      );

      console.log(
        "Montant :",
        updatedParticipant.montant
      );

      console.log(
        "Billet :",
        billetCode
      );

      console.log(
        "================================"
      );


      return res.json({

        success:
          true,

        participant:
          updatedParticipant,

        billet_code:
          billetCode,

        parrainage_valide:
          parrainageValide,

        referrals:
          referralsCount,

        rewards_created:
          rewardsCreated,
      });

    } catch (error) {

      console.error(
        "Erreur validation paiement :",
        error
      );

      return res.status(500).json({
        error:
          "Erreur serveur.",

        details:
          error.message,
      });
    }
  }
);


// ========================================
// PARRAINAGE
// ========================================

app.get(
  "/referrals/:code",
  async (req, res) => {

    try {

      const code =
        req.params.code
          ?.trim()
          .toUpperCase();

      if (!code) {

        return res.status(400).json({
          error:
            "Code de parrainage manquant.",
        });
      }


      const {
        count,
        error,
      } = await supabase
        .from("Parrainages")
        .select(
          "*",
          {
            count:
              "exact",

            head:
              true,
          }
        )
        .eq(
          "code_parrain",
          code
        )
        .eq(
          "valide",
          true
        );


      if (error) {

        return res.status(500).json({
          error:
            "Impossible de récupérer les parrainages.",
        });
      }


      return res.json({
        success:
          true,

        referrals:
          count || 0,
      });

    } catch (error) {

      return res.status(500).json({
        error:
          "Erreur serveur.",
      });
    }
  }
);


// ========================================
// RÉCOMPENSES
// ========================================

app.get(
  "/rewards/:code",
  async (req, res) => {

    try {

      const code =
        req.params.code
          ?.trim()
          .toUpperCase();

      if (!code) {

        return res.status(400).json({
          error:
            "Code de parrainage manquant.",
        });
      }


      const {
        data: participant,
        error:
          participantError,
      } = await supabase
        .from("Participants")
        .select(`
          id,
          prenom,
          nom,
          code_parrain
        `)
        .eq(
          "code_parrain",
          code
        )
        .maybeSingle();


      if (participantError) {

        return res.status(500).json({
          error:
            "Impossible de récupérer le participant.",
        });
      }


      if (!participant) {

        return res.status(404).json({
          error:
            "Code de parrainage introuvable.",
        });
      }


      const {
        data: rewards,
        error:
          rewardsError,
      } = await supabase
        .from("Recompenses")
        .select(`
          id,
          participant_id,
          palier,
          recompense,
          statut,
          created_at,
          claimed_at
        `)
        .eq(
          "participant_id",
          participant.id
        )
        .order(
          "palier",
          {
            ascending:
              true,
          }
        );


      if (rewardsError) {

        return res.status(500).json({
          error:
            "Impossible de récupérer les récompenses.",
        });
      }


      return res.json({
        success:
          true,

        rewards:
          rewards || [],
      });

    } catch (error) {

      return res.status(500).json({
        error:
          "Erreur serveur.",

        details:
          error.message,
      });
    }
  }
);


// ========================================
// ADMIN
// SCANNER / VALIDER UN BILLET
// ========================================

app.post(
  "/admin/scan-ticket",
  checkAdminPin,
  async (req, res) => {

    try {

      const code =
        req.body?.billet_code
          ?.trim()
          .toUpperCase();

      if (!code) {

        return res.status(400).json({
          error:
            "Code billet manquant.",
        });
      }


      // ========================================
      // RECHERCHER BILLET
      // ========================================

      const {
        data: participant,
        error:
          participantError,
      } = await supabase
        .from("Participants")
        .select(`
          id,
          prenom,
          nom,
          mail,
          telephone,
          tarif,
          montant,
          statut_paiement,
          billet_code,
          billet_utilise,
          billet_utilise_at
        `)
        .eq(
          "billet_code",
          code
        )
        .maybeSingle();


      if (participantError) {

        console.error(
          "Erreur recherche billet :",
          participantError
        );

        return res.status(500).json({
          error:
            "Impossible de vérifier le billet.",
        });
      }


      if (!participant) {

        return res.status(404).json({
          error:
            "Billet invalide ou introuvable.",
        });
      }


      // ========================================
      // VÉRIFIER PAIEMENT
      // ========================================

      if (
        participant.statut_paiement !==
        "paye"
      ) {

        return res.status(400).json({
          error:
            "Ce billet n'est pas encore payé.",

          participant,
        });
      }


      // ========================================
      // DÉJÀ UTILISÉ
      // ========================================

      if (
        participant.billet_utilise ===
        true
      ) {

        return res.status(400).json({

          error:
            "Ce billet a déjà été utilisé.",

          deja_utilise:
            true,

          participant,
        });
      }


      // ========================================
      // VALIDER ENTRÉE
      // ========================================

      const {
        data: updatedParticipant,
        error: updateError,
      } = await supabase
        .from("Participants")
        .update({
          billet_utilise:
            true,

          billet_utilise_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          participant.id
        )
        .eq(
          "billet_utilise",
          false
        )
        .select(`
          id,
          prenom,
          nom,
          mail,
          telephone,
          tarif,
          montant,
          statut_paiement,
          billet_code,
          billet_utilise,
          billet_utilise_at
        `)
        .maybeSingle();


      if (updateError) {

        console.error(
          "Erreur validation entrée :",
          updateError
        );

        return res.status(500).json({
          error:
            "Impossible de valider l'entrée.",
        });
      }


      if (!updatedParticipant) {

        return res.status(400).json({

          error:
            "Ce billet vient déjà d'être utilisé.",

          deja_utilise:
            true,

          participant,
        });
      }


      console.log(
        "================================"
      );

      console.log(
        "BILLET VALIDÉ - ENTRÉE"
      );

      console.log(
        "Participant :",
        updatedParticipant.prenom,
        updatedParticipant.nom
      );

      console.log(
        "Billet :",
        updatedParticipant.billet_code
      );

      console.log(
        "================================"
      );


      return res.json({

        success:
          true,

        message:
          "Billet valide. Entrée autorisée.",

        participant:
          updatedParticipant,
      });

    } catch (error) {

      console.error(
        "Erreur scan billet :",
        error
      );

      return res.status(500).json({
        error:
          "Erreur serveur.",

        details:
          error.message,
      });
    }
  }
);


// ========================================
// ADMIN
// RÉCOMPENSES
// ========================================

app.get(
  "/admin/rewards",
  checkAdminPin,
  async (req, res) => {

    try {

      const {
        data: rewards,
        error:
          rewardsError,
      } = await supabase
        .from("Recompenses")
        .select(`
          id,
          participant_id,
          palier,
          recompense,
          statut,
          created_at,
          claimed_at
        `)
        .order(
          "palier",
          {
            ascending:
              true,
          }
        );


      if (rewardsError) {

        return res.status(500).json({
          error:
            "Impossible de récupérer les récompenses.",
        });
      }


      const participantIds =
        [
          ...new Set(
            (rewards || [])
              .map(
                reward =>
                  reward.participant_id
              )
          ),
        ];


      let participantsMap =
        {};


      if (
        participantIds.length >
        0
      ) {

        const {
          data: participants,
        } = await supabase
          .from("Participants")
          .select(`
            id,
            prenom,
            nom,
            code_parrain
          `)
          .in(
            "id",
            participantIds
          );


        (
          participants ||
          []
        ).forEach(
          participant => {

            participantsMap[
              String(
                participant.id
              )
            ] =
              participant;

          }
        );
      }


      const finalRewards =
        (
          rewards ||
          []
        ).map(
          reward => ({

            ...reward,

            participant:
              participantsMap[
                String(
                  reward.participant_id
                )
              ] ||
              null,
          })
        );


      return res.json({

        success:
          true,

        rewards:
          finalRewards,
      });

    } catch (error) {

      return res.status(500).json({
        error:
          "Erreur serveur.",

        details:
          error.message,
      });
    }
  }
);


// ========================================
// ADMIN
// REMETTRE UNE RÉCOMPENSE
// ========================================

app.post(
  "/admin/claim-reward",
  checkAdminPin,
  async (req, res) => {

    try {

      const {
        rewardId,
      } = req.body;

      if (!rewardId) {

        return res.status(400).json({
          error:
            "Récompense manquante.",
        });
      }


      const {
        data: reward,
        error:
          rewardError,
      } = await supabase
        .from("Recompenses")
        .select(`
          id,
          palier,
          recompense,
          statut,
          participant_id
        `)
        .eq(
          "id",
          rewardId
        )
        .maybeSingle();


      if (rewardError) {

        return res.status(500).json({
          error:
            "Impossible de récupérer la récompense.",
        });
      }


      if (!reward) {

        return res.status(404).json({
          error:
            "Récompense introuvable.",
        });
      }


      if (
        reward.statut ===
        "remise"
      ) {

        return res.status(400).json({
          error:
            "Cette récompense a déjà été remise.",
        });
      }


      const {
        data: updatedReward,
        error: updateError,
      } = await supabase
        .from("Recompenses")
        .update({
          statut:
            "remise",

          claimed_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          rewardId
        )
        .select()
        .single();


      if (updateError) {

        return res.status(500).json({

          error:
            "Impossible de valider la remise de la récompense.",

          details:
            updateError.message,
        });
      }


      return res.json({

        success:
          true,

        reward:
          updatedReward,
      });

    } catch (error) {

      return res.status(500).json({
        error:
          "Erreur serveur.",

        details:
          error.message,
      });
    }
  }
);


// ========================================
// TEST SERVEUR
// ========================================

app.get(
  "/",
  (req, res) => {

    res.json({

      success:
        true,

      message:
        "Serveur TNLP opérationnel.",
    });

  }
);


// ========================================
// SERVEUR
// ========================================

const PORT =
  process.env.PORT ||
  3000;

app.listen(
  PORT,
  () => {

    console.log(
      `Serveur TNLP lancé sur http://localhost:${PORT}`
    );

  }
);
