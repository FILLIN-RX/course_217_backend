const db = require('../config/db');

// ----------------- SOUMISSION DES DISPONIBILITÉS ----------------- //
exports.submitDisponibilite = async (req, res) => {
    const enseignant_id = req.user.role === 'ENSEIGNANT' ? req.user.enseignant_id : null;
    const { plage_id, prefere } = req.body;

    if (!enseignant_id) return res.status(403).json({ message: "Accès refusé" });

    try {
        // Vérifie si la disponibilité existe déjà
        const [rows] = await db.promise().query(
            "SELECT * FROM disponibilites_enseignants WHERE enseignant_id=? AND plage_id=?",
            [enseignant_id, plage_id]
        );

        if (rows.length > 0) {
            // Mise à jour si déjà existante
            await db.promise().query(
                "UPDATE disponibilites_enseignants SET prefere=? WHERE id=?",
                [prefere, rows[0].id]
            );
            return res.json({ message: "Disponibilité mise à jour" });
        }

        // Sinon, insertion
        await db.promise().query(
            "INSERT INTO disponibilites_enseignants (enseignant_id, plage_id, prefere) VALUES (?, ?, ?)",
            [enseignant_id, plage_id, prefere]
        );
        res.status(201).json({ message: "Disponibilité soumise" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

// ----------------- MODIFICATION DES DISPONIBILITÉS ----------------- //
exports.updateDisponibilite = async (req, res) => {
    const enseignant_id = req.user.role === 'ENSEIGNANT' ? req.user.enseignant_id : null;
    const { plage_id, prefere } = req.body;

    if (!enseignant_id) return res.status(403).json({ message: "Accès refusé" });

    try {
        const [rows] = await db.promise().query(
            "SELECT * FROM disponibilites_enseignants WHERE enseignant_id=? AND plage_id=?",
            [enseignant_id, plage_id]
        );

        if (rows.length === 0) return res.status(404).json({ message: "Disponibilité non trouvée" });

        await db.promise().query(
            "UPDATE disponibilites_enseignants SET prefere=? WHERE id=?",
            [prefere, rows[0].id]
        );

        res.json({ message: "Disponibilité modifiée" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

// ----------------- CONSULTATION EMPLOI DU TEMPS ----------------- //
exports.getEmploiDuTempsDetail = async (req, res) => {
    const enseignant_id = req.user.role === 'ENSEIGNANT' ? req.user.enseignant_id : null;

    if (!enseignant_id) return res.status(403).json({ message: "Accès refusé" });

    try {
        const [rows] = await db.promise().query(
            `SELECT et.id AS emploi_id,
                    u.code AS ue_code,
                    u.intitule AS ue_intitule,
                    s.nom AS salle,
                    ph.jour,
                    ph.heure_debut,
                    ph.heure_fin,
                    sem.nom AS semestre,
                    aa.libelle AS annee,
                    et.statut
             FROM emplois_du_temps et
             JOIN ues u ON et.ue_id = u.id
             JOIN salles s ON et.salle_id = s.id
             JOIN plages_horaires ph ON et.plage_id = ph.id
             JOIN semestres sem ON et.semestre_id = sem.id
             JOIN annees_academiques aa ON et.annee_id = aa.id
             WHERE u.enseignant_id=?
             ORDER BY ph.jour, ph.heure_debut`,
             [enseignant_id]
        );

        if (rows.length === 0) {
            return res.json({ message: "Aucun emploi du temps disponible" });
        }

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

