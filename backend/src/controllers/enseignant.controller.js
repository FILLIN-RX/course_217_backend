import db from '../config/db.js';
import { logAction } from '../services/audit.service.js';

// --- Submit Preferences ---
export const submitDisponibilite = async (req, res) => {
    const enseignant_id = req.user.role === 'ENSEIGNANT' ? req.user.enseignant_id : req.body.enseignant_id;
    const { plage_id, prefere } = req.body;
    const userId = req.user.id;

    if (!enseignant_id) return res.status(400).json({ message: "ID Enseignant manquant." });

    try {
        const [existing] = await db.query(
            "SELECT * FROM disponibilites_enseignants WHERE enseignant_id=? AND plage_id=?",
            [enseignant_id, plage_id]
        );

        if (existing.length > 0) {
            const oldVal = existing[0];
            await db.query(
                "UPDATE disponibilites_enseignants SET prefere=? WHERE id=?",
                [prefere, existing[0].id]
            );
            await logAction('UPDATE_PREF', 'disponibilites_enseignants', existing[0].id, userId, oldVal, { prefere });
            return res.json({ message: "Préférence mise à jour." });
        }

        const [insert] = await db.query(
            "INSERT INTO disponibilites_enseignants (enseignant_id, plage_id, prefere) VALUES (?, ?, ?)",
            [enseignant_id, plage_id, prefere]
        );
        await logAction('CREATE_PREF', 'disponibilites_enseignants', insert.insertId, userId, null, { enseignant_id, plage_id, prefere });
        
        res.status(201).json({ message: "Préférence enregistrée." });
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur" });
    }
};

// --- View Personal Schedule ---
export const getEmploiDuTempsDetail = async (req, res) => {
    const enseignant_id = req.user.role === 'ENSEIGNANT' ? req.user.enseignant_id : req.query.enseignant_id;

    if (!enseignant_id) return res.status(400).json({ message: "ID Enseignant manquant." });

    try {
        const [rows] = await db.query(
            `SELECT et.*, u.code, u.intitule, s.nom as salle_nom, ph.jour, ph.heure_debut, ph.heure_fin 
             FROM emplois_du_temps et
             JOIN ues u ON et.ue_id = u.id
             JOIN salles s ON et.salle_id = s.id
             JOIN plages_horaires ph ON et.plage_id = ph.id
             WHERE u.enseignant_id = ? AND et.statut = 'VALIDE'
             ORDER BY ph.jour, ph.heure_debut`,
            [enseignant_id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur" });
    }
};
