import db from "../config/db.js";
import { logAction } from "../services/audit.service.js";

// --- Submit Preferences ---
export const submitDisponibilite = async (req, res) => {
  const enseignant_id =
    req.user.role === "ENSEIGNANT"
      ? req.user.enseignant_id
      : req.body.enseignant_id;
  const { plage_id, prefere, semestre_id } = req.body;
  const userId = req.user.id;

  if (!enseignant_id)
    return res.status(400).json({ message: "ID Enseignant manquant." });
  if (!semestre_id)
    return res.status(400).json({ message: "Semestre manquant." });

  try {
    const [existing] = await db.query(
      "SELECT * FROM disponibilites_enseignants WHERE enseignant_id=? AND plage_id=? AND semestre_id=?",
      [enseignant_id, plage_id, semestre_id],
    );

    if (existing.length > 0) {
      const oldVal = existing[0];
      await db.query(
        "UPDATE disponibilites_enseignants SET prefere=? WHERE id=?",
        [prefere, existing[0].id],
      );
      await logAction(
        "UPDATE_PREF",
        "disponibilites_enseignants",
        existing[0].id,
        userId,
        oldVal,
        { prefere },
      );
      return res.json({ message: "Préférence mise à jour." });
    }

    const [insert] = await db.query(
      "INSERT INTO disponibilites_enseignants (enseignant_id, plage_id, semestre_id, prefere) VALUES (?, ?, ?, ?)",
      [enseignant_id, plage_id, semestre_id, prefere],
    );
    // await logAction('CREATE_PREF', 'disponibilites_enseignants', insert.insertId, userId, null, { enseignant_id, plage_id, prefere });

    res.status(201).json({ message: "Préférence enregistrée." });
  } catch (err) {
    console.error("Erreur submitDisponibilite:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// --- View Personal Schedule ---
export const getEmploiDuTempsDetail = async (req, res) => {
  const enseignant_id =
    req.user.role === "ENSEIGNANT"
      ? req.user.enseignant_id
      : req.query.enseignant_id;

  if (!enseignant_id)
    return res.status(400).json({ message: "ID Enseignant manquant." });

  try {
    const [rows] = await db.query(
      `SELECT et.*, u.code, u.intitule, s.nom as salle_nom, c.nom as classe_nom, ph.jour, ph.heure_debut, ph.heure_fin 
             FROM emplois_du_temps et
             JOIN ues u ON et.ue_id = u.id
             JOIN enseignant_ues eu ON u.id = eu.ue_id
             JOIN salles s ON et.salle_id = s.id
             JOIN classes c ON et.classe_id = c.id
             JOIN plages_horaires ph ON et.plage_id = ph.id
             WHERE eu.enseignant_id = ? AND et.statut = 'VALIDE'
             ORDER BY ph.jour, ph.heure_debut`,
      [enseignant_id],
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// --- Get Teacher Availabilities ---
export const getDisponibilites = async (req, res) => {
  const enseignant_id =
    req.user.role === "ENSEIGNANT"
      ? req.user.enseignant_id
      : req.query.enseignant_id;
  const { semestre_id } = req.query;

  if (!enseignant_id)
    return res.status(400).json({ message: "ID Enseignant manquant." });

  try {
    // Sélection explicite pour éviter toute ambiguïté
    let query = `SELECT d.id, d.enseignant_id, d.plage_id, d.prefere, d.semestre_id, ph.jour, ph.heure_debut, ph.heure_fin 
             FROM disponibilites_enseignants d
             JOIN plages_horaires ph ON d.plage_id = ph.id
             WHERE d.enseignant_id = ?`;

    const params = [enseignant_id];

    if (semestre_id) {
      query += ` AND d.semestre_id = ?`;
      params.push(semestre_id);
    }

    query += ` ORDER BY FIELD(ph.jour,'Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'), ph.heure_debut`;

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error("Erreur getDisponibilites:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
