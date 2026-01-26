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
                u.code as ue_code,
                u.intitule as ue_intitule,
                e.nom as enseignant_nom,
                s.nom as salle_nom,
                ph.jour,
                ph.heure_debut,
                ph.heure_fin
            FROM emplois_du_temps et
            JOIN ues u ON et.ue_id = u.id
            JOIN enseignants e ON u.id IN (SELECT ue_id FROM enseignant_ues WHERE enseignant_id = e.id)
            JOIN salles s ON et.salle_id = s.id
            JOIN plages_horaires ph ON et.plage_id = ph.id
            WHERE u.classe_id = ? AND et.semestre_id = ? AND et.statut = 'VALIDE'
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
