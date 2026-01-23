const db = require('../config/db');

// Fonction pour remplir la DB au démarrage
exports.seedDepartements = async () => {
    try {
        // On vérifie si la table est vide
        const [rows] = await db.promise().query("SELECT COUNT(*) as total FROM departements");
        
        if (rows[0].total === 0) {
            console.log("🌱 Table 'departements' vide. Début du seeding...");

            const departementsAInserer = [
                ['Ressources Humaines'],
                ['Développement Web'],
                ['Marketing Digital'],
                ['Comptabilité'],
                ['Design UX/UI']
            ];

            // MySQL attend un tableau de tableaux pour l'insertion multiple
            const sql = "INSERT INTO departements (nom) VALUES ?";
            await db.promise().query(sql, [departementsAInserer]);

            console.log("✅ Données initiales insérées avec succès !");
        } else {
            console.log("ℹ️ Données déjà présentes dans 'departements'. Pas de seeding nécessaire.");
        }
    } catch (err) {
        console.error("❌ Erreur lors du seeding :", err.message);
    }
};

// Lire tous les départements (Triés par date de création)
exports.getDepartements = async (req, res) => {
    try {
        const [rows] = await db.promise().query(
            "SELECT id, nom, created_at FROM departements ORDER BY created_at DESC"
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ message: "Aucun département trouvé." });
        }

        res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur lors de la récupération des données" });
    }
};











exports.genererEmploiDuTempsOptimise = async (req, res) => {
    const { classe_id, semestre_id, annee_id } = req.body;

    try {
        // 1️⃣ Récupérer toutes les UE de la classe
        const [ues] = await db.promise().query(
            "SELECT * FROM ues WHERE classe_id=?",
            [classe_id]
        );

        // 2️⃣ Récupérer l'effectif
        const [effectifRows] = await db.promise().query(
            "SELECT effectif FROM effectifs_classe WHERE classe_id=? AND semestre_id=? AND annee_id=?",
            [classe_id, semestre_id, annee_id]
        );
        if (!effectifRows.length) return res.status(400).json({ message: "Effectif non défini" });
        const effectif = effectifRows[0].effectif;

        // 3️⃣ Récupérer toutes les salles disponibles
        const [salles] = await db.promise().query(
            "SELECT * FROM salles WHERE capacite>=?",
            [effectif]
        );

        // 4️⃣ Récupérer toutes les plages horaires
        const [plages] = await db.promise().query(
            "SELECT * FROM plages_horaires ORDER BY FIELD(jour,'Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'), heure_debut"
        );

        let ueNonAffectees = [];

        // 5️⃣ Parcourir chaque UE
        for (const ue of ues) {
            let affecte = false;

            // 5a. Récupérer les disponibilités préférées de l’enseignant
            const [prefs] = await db.promise().query(
                "SELECT plage_id FROM disponibilites_enseignants WHERE enseignant_id=? AND prefere=1",
                [ue.enseignant_id]
            );
            const prefPlages = prefs.map(p => p.plage_id);

            // 5b. Parcourir les plages prioritaires puis les autres
            const allPlages = [...prefPlages, ...plages.map(p => p.id).filter(p => !prefPlages.includes(p))];

            for (const plageId of allPlages) {
                for (const salle of salles) {
                    // Vérifier si salle libre pour cette plage
                    const [checkSalle] = await db.promise().query(
                        "SELECT * FROM emplois_du_temps WHERE salle_id=? AND plage_id=? AND semestre_id=? AND annee_id=?",
                        [salle.id, plageId, semestre_id, annee_id]
                    );
                    if (checkSalle.length > 0) continue;

                    // Vérifier si UE déjà programmée sur cette plage
                    const [checkUE] = await db.promise().query(
                        "SELECT * FROM emplois_du_temps WHERE ue_id=? AND plage_id=? AND semestre_id=? AND annee_id=?",
                        [ue.id, plageId, semestre_id, annee_id]
                    );
                    if (checkUE.length > 0) continue;

                    // Vérifier disponibilité enseignant
                    const [disp] = await db.promise().query(
                        "SELECT * FROM disponibilites_enseignants WHERE enseignant_id=? AND plage_id=?",
                        [ue.enseignant_id, plageId]
                    );
                    if (disp.length === 0) continue;

                    // Tout est ok → insérer dans emplois_du_temps
                    await db.promise().query(
                        `INSERT INTO emplois_du_temps (ue_id, salle_id, plage_id, semestre_id, annee_id, statut)
                         VALUES (?, ?, ?, ?, ?, 'BROUILLON')`,
                        [ue.id, salle.id, plageId, semestre_id, annee_id]
                    );

                    affecte = true;
                    break;
                }
                if (affecte) break;
            }

            if (!affecte) ueNonAffectees.push(ue.intitule);
        }

        res.json({
            message: "Planification terminée",
            ueNonAffectees: ueNonAffectees.length ? ueNonAffectees : "Toutes les UEs ont été affectées"
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};
