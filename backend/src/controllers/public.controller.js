import db from "../config/db.js";

export const getPublicSchedule = async (req, res) => {
  const { classe_id, semestre_id } = req.params;

  if (!classe_id || !semestre_id) {
    return res.status(400).json({ message: "Classe et semestre requis." });
  }

  try {
    const [rows] = await db.query(
      `
            SELECT 
                et.id,
                et.statut,
                u.code as ue_code,
                u.intitule as ue_intitule,
                e.nom as enseignant_nom,
                s.nom as salle_nom,
                ph.jour,
                ph.heure_debut,
                ph.heure_fin
            FROM emplois_du_temps et
            JOIN ues u ON et.ue_id = u.id
            LEFT JOIN enseignant_ues eu ON u.id = eu.ue_id
            LEFT JOIN enseignants e ON eu.enseignant_id = e.id
            JOIN salles s ON et.salle_id = s.id
            JOIN plages_horaires ph ON et.plage_id = ph.id
            WHERE et.classe_id = ? AND et.semestre_id = ?
            ORDER BY ph.jour, ph.heure_debut
        `,
      [classe_id, semestre_id],
    );

    // Note: The join with teachers might be simplified if we assume one teacher per assignment.
    // Given the schema enseignant_ues is a many-to-many, the subquery is a bit loose.
    // Let's refine the join to get THE teacher assigned if possible.

    res.json(rows);
  } catch (err) {
    console.error("Erreur getPublicSchedule:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getSalles = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM salles ORDER BY nom ASC");
    res.json(rows);
  } catch (err) {
    console.error("Erreur getSalles:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getPublicRoomSchedule = async (req, res) => {
  const { salle_id, semestre_id } = req.params;

  try {
    const [rows] = await db.query(
      `
            SELECT 
                et.id,
                u.code as ue_code,
                u.intitule as ue_intitule,
                c.nom as classe_nom,
                e.nom as enseignant_nom,
                ph.jour,
                ph.heure_debut,
                ph.heure_fin
            FROM emplois_du_temps et
            JOIN ues u ON et.ue_id = u.id
            LEFT JOIN enseignant_ues eu ON u.id = eu.ue_id
            LEFT JOIN enseignants e ON eu.enseignant_id = e.id
            JOIN classes c ON et.classe_id = c.id
            JOIN plages_horaires ph ON et.plage_id = ph.id
            WHERE et.salle_id = ? AND et.semestre_id = ? AND et.statut = 'VALIDE'
            ORDER BY ph.jour, ph.heure_debut
        `,
      [salle_id, semestre_id],
    );
    res.json(rows);
  } catch (err) {
    console.error("Erreur getPublicRoomSchedule:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getClassesPublic = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT c.id, c.nom, f.nom as filiere_nom FROM classes c JOIN filieres f ON c.filiere_id = f.id ORDER BY c.nom ASC",
    );
    res.json(rows);
  } catch (err) {
    console.error("Erreur getClassesPublic:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
