import db from '../config/db.js';

// Fonction pour remplir la DB au démarrage
export const seedDepartements = async () => {
    try {
        // On vérifie si la table est vide
        const [rows] = await db.query("SELECT COUNT(*) as total FROM departements");
        
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
            await db.query(sql, [departementsAInserer]);

            console.log("✅ Données initiales insérées avec succès !");
        } else {
            console.log("ℹ️ Données déjà présentes dans 'departements'. Pas de seeding nécessaire.");
        }
    } catch (err) {
        console.error("❌ Erreur lors du seeding :", err.message);
    }
};

// Lire tous les départements (Triés par date de création)
export const getDepartements = async (req, res) => {
    try {
        const [rows] = await db.query(
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











export const genererEmploiDuTempsOptimise = async (req, res) => {
    const { classe_id, semestre_id, annee_id } = req.body;

    try {
        // 1️⃣ Récupérer toutes les UE de la classe
        const [ues] = await db.query(
            "SELECT * FROM ues WHERE classe_id=?",
            [classe_id]
        );

        // 2️⃣ Récupérer l'effectif
        const [effectifRows] = await db.query(
            "SELECT effectif FROM effectifs_classe WHERE classe_id=? AND semestre_id=? AND annee_id=?",
            [classe_id, semestre_id, annee_id]
        );
        if (!effectifRows.length) return res.status(400).json({ message: "Effectif non défini" });
        const effectif = effectifRows[0].effectif;

        // 3️⃣ Récupérer toutes les salles disponibles
        const [salles] = await db.query(
            "SELECT * FROM salles WHERE capacite>=?",
            [effectif]
        );

        // 4️⃣ Récupérer toutes les plages horaires
        const [plages] = await db.query(
            "SELECT * FROM plages_horaires ORDER BY FIELD(jour,'Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'), heure_debut"
        );

        let ueNonAffectees = [];

        // 5️⃣ Parcourir chaque UE
        for (const ue of ues) {
            let affecte = false;

            // 5a. Récupérer les disponibilités préférées de l’enseignant
            const [prefs] = await db.query(
                "SELECT plage_id FROM disponibilites_enseignants WHERE enseignant_id=? AND prefere=1",
                [ue.enseignant_id]
            );
            const prefPlages = prefs.map(p => p.plage_id);

            // 5b. Parcourir les plages prioritaires puis les autres
            const allPlages = [...prefPlages, ...plages.map(p => p.id).filter(p => !prefPlages.includes(p))];

            for (const plageId of allPlages) {
                for (const salle of salles) {
                    // Vérifier si salle libre pour cette plage
                    const [checkSalle] = await db.query(
                        "SELECT * FROM emplois_du_temps WHERE salle_id=? AND plage_id=? AND semestre_id=? AND annee_id=?",
                        [salle.id, plageId, semestre_id, annee_id]
                    );
                    if (checkSalle.length > 0) continue;

                    // Vérifier si UE déjà programmée sur cette plage
                    const [checkUE] = await db.query(
                        "SELECT * FROM emplois_du_temps WHERE ue_id=? AND plage_id=? AND semestre_id=? AND annee_id=?",
                        [ue.id, plageId, semestre_id, annee_id]
                    );
                    if (checkUE.length > 0) continue;

                    // Vérifier disponibilité enseignant
                    const [disp] = await db.query(
                        "SELECT * FROM disponibilites_enseignants WHERE enseignant_id=? AND plage_id=?",
                        [ue.enseignant_id, plageId]
                    );
                    if (disp.length === 0) continue;

                    // Tout est ok → insérer dans emplois_du_temps
                    await db.query(
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

export const validerEmploiDuTemps = async (req, res) => {
    try {
        await db.query("UPDATE emplois_du_temps SET statut='VALIDE' WHERE statut='BROUILLON'");
        res.json({ message: "Emplois du temps validés" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};
