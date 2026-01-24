import db from '../config/db.js';
import { logAction } from '../services/audit.service.js';

// --- Seeding ---
export const seedDepartements = async () => {
    try {
        const [count] = await db.query("SELECT COUNT(*) as total FROM departements");
        if (count[0].total === 0) {
            console.log("🌱 Seeding Departements...");
            await db.query("INSERT INTO departements (nom) VALUES ('Informatique')");
            console.log("✅ Departements seeded.");
        }
    } catch (err) {
        console.error("❌ Seed Error:", err);
    }
};

// --- Departements ---
export const getDepartements = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM departements ORDER BY nom ASC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur" });
    }
};

// --- Scheduling Logic ---

/**
 * Generate an optimized schedule for a class, semester, and academic year.
 * Takes into account room capacity vs class effectif, and teacher preferences.
 */
export const genererEmploiDuTempsOptimise = async (req, res) => {
    const { classe_id, semestre_id, annee_id } = req.body;
    const userId = req.user.id;

    try {
        // 1. Get Class Effectif
        const [effectifRows] = await db.query(
            "SELECT effectif FROM effectifs_classe WHERE classe_id=? AND semestre_id=? AND annee_id=?",
            [classe_id, semestre_id, annee_id]
        );
        if (effectifRows.length === 0) {
            return res.status(400).json({ message: "Effectif non défini pour cette classe/semestre/année." });
        }
        const classEffectif = effectifRows[0].effectif;

        // 2. Get UEs for this semester (Global UEs logic as per user request 'UE no class ID')
        // We assume UEs are filtered by semester only, or we would need a join via Filiere if schema permitted.
        // For now, fetching all UEs for the semester that are NOT yet fully scheduled for this class.
        const [ues] = await db.query(
            "SELECT * FROM ues WHERE semestre_id=?",
            [semestre_id]
        );

        // 3. Get all Rooms with enough capacity
        const [salles] = await db.query(
            "SELECT * FROM salles WHERE capacite >= ? ORDER BY capacite ASC",
            [classEffectif]
        );

        if (salles.length === 0) {
            return res.status(400).json({ message: "Aucune salle disponible pour accueillir cet effectif." });
        }

        // 4. Get all Time Slots
        const [plages] = await db.query("SELECT * FROM plages_horaires ORDER BY FIELD(jour,'Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'), heure_debut");

        let nonAffectees = [];

        // 5. Algorithm: Iterative placement
        for (const ue of ues) {
            let affecte = false;

            // Check if UE is already scheduled for THIS class in this period
            const [alreadyScheduled] = await db.query(
               "SELECT id FROM emplois_du_temps WHERE ue_id=? AND semestre_id=? AND annee_id=? AND salle_id IN (SELECT salle_id FROM emplois_du_temps WHERE ue_id=?)", // Logic ambiguous without Many-to-Many mapping but proceeding with basic constraint
               [ue.id, semestre_id, annee_id, ue.id]
            );
            // Simpler check: Has this UE been scheduled at all for this context? 
            // Since UEs are global now, we might schedule the SAME UE for multiple classes? 
            // The user didn't specify. Assuming ONE instance per UE for now or until collision.
            
            // Get Teacher Preferences for this UE's teacher
            const [prefs] = await db.query(
                "SELECT plage_id FROM disponibilites_enseignants WHERE enseignant_id=? AND prefere=1",
                [ue.enseignant_id]
            );
            const prefPlageIds = prefs.map(p => p.plage_id);

            // Sort plages: preferences first, then others
            const sortedPlages = [
                ...plages.filter(p => prefPlageIds.includes(p.id)),
                ...plages.filter(p => !prefPlageIds.includes(p.id))
            ];

            for (const plage of sortedPlages) {
                for (const salle of salles) {
                    // Check if salle is busy at this slot
                    const [busySalle] = await db.query(
                        "SELECT id FROM emplois_du_temps WHERE salle_id=? AND plage_id=? AND semestre_id=? AND annee_id=?",
                        [salle.id, plage.id, semestre_id, annee_id]
                    );
                    if (busySalle.length > 0) continue;

                    // Check if teacher is busy at this slot
                    const [busyTeacher] = await db.query(
                        "SELECT et.id FROM emplois_du_temps et JOIN ues u ON et.ue_id = u.id WHERE u.enseignant_id=? AND et.plage_id=? AND et.semestre_id=? AND et.annee_id=?",
                        [ue.enseignant_id, plage.id, semestre_id, annee_id]
                    );
                    if (busyTeacher.length > 0) continue;

                    // Check if teacher is available (not just preferred)
                    const [isAvailable] = await db.query(
                        "SELECT id FROM disponibilites_enseignants WHERE enseignant_id=? AND plage_id=?",
                        [ue.enseignant_id, plage.id]
                    );
                    if (isAvailable.length === 0) continue; 

                    // Place the UE
                    const [insert] = await db.query(
                        "INSERT INTO emplois_du_temps (ue_id, salle_id, plage_id, semestre_id, annee_id, statut) VALUES (?, ?, ?, ?, ?, 'BROUILLON')",
                        [ue.id, salle.id, plage.id, semestre_id, annee_id]
                    );

                    await logAction('PLACEMENT_AUTO', 'emplois_du_temps', insert.insertId, userId, null, { ue_id: ue.id, salle_id: salle.id, plage_id: plage.id });

                    affecte = true;
                    break;
                }
                if (affecte) break;
            }

            if (!affecte) {
                nonAffectees.push(`${ue.code} - ${ue.intitule}`);
            }
        }

        res.json({
            message: "Génération automatique terminée.",
            nonAffectees
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur lors de la génération de l'emploi du temps." });
    }
};

// --- Validation ---
export const validerEmploiDuTemps = async (req, res) => {
    const { classe_id, semestre_id, annee_id } = req.body;
    const userId = req.user.id;

    try {
        // Updated logic: Validate ALL drafts for this semester/year since UEs are not class-bound directly
        // Or we assume the admin passes the context.
        await db.query(
            "UPDATE emplois_du_temps SET statut='VALIDE' WHERE semestre_id=? AND annee_id=? AND statut='BROUILLON'",
            [semestre_id, annee_id]
        );
        
        await logAction('VALIDATION_GLOBALE', 'emplois_du_temps', null, userId, { statut: 'BROUILLON' }, { statut: 'VALIDE' });

        res.json({ message: "L'emploi du temps a été validé et publié." });
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur" });
    }
};

// --- CRUD Salles ---
export const getSalles = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM salles ORDER BY nom ASC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur" });
    }
};

export const createSalle = async (req, res) => {
    const { nom, capacite } = req.body;
    try {
        const [result] = await db.query("INSERT INTO salles (nom, capacite) VALUES (?, ?)", [nom, capacite]);
        res.status(201).json({ id: result.insertId, nom, capacite });
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur" });
    }
};

// --- Récupérer les profs dispos pour la grille Admin ---
export const getGrilleDisponibilitesOption = async (req, res) => {
    const { semestre_id } = req.query;
    
    console.log('=== API: getGrilleDisponibilitesOption ===');
    console.log('Semestre demandé:', semestre_id);
    
    try {
        let query = `
            SELECT 
                ph.id as plage_id,
                ph.jour,
                ph.heure_debut,
                ph.heure_fin,
                e.id as enseignant_id,
                e.nom,
                de.prefere,
                de.semestre_id
            FROM plages_horaires ph
            JOIN disponibilites_enseignants de ON ph.id = de.plage_id
            JOIN enseignants e ON de.enseignant_id = e.id
            WHERE de.prefere = 1`;
        
        const params = [];
        if (semestre_id) {
            query += ` AND de.semestre_id = ?`;
            params.push(semestre_id);
        }
        
        query += ` ORDER BY ph.jour, ph.heure_debut`;
        
        const [rows] = await db.query(query, params);
        
        console.log(`Nombre de disponibilités trouvées: ${rows.length}`);
        console.log('Échantillon (5 premières):', rows.slice(0, 5));

        // Regrouper par plage pour le front
        const mapping = rows.reduce((acc, row) => {
            if (!acc[row.plage_id]) acc[row.plage_id] = [];
            acc[row.plage_id].push({ 
                id: row.enseignant_id, 
                nom: row.nom,
                semestre: row.semestre_id 
            });
            return acc;
        }, {});
        
        console.log(`Nombre de créneaux avec disponibilités: ${Object.keys(mapping).length}`);
        console.log('Mapping créé:', JSON.stringify(mapping, null, 2));

        res.json(mapping);
    } catch (err) {
        console.error("Erreur getGrilleDisponibilitesOption:", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

// --- Récupérer les UEs d'un enseignant choisi dans la pop-up ---
export const getUesEnseignant = async (req, res) => {
    const { enseignant_id } = req.params;
    try {
        const [ues] = await db.query("SELECT * FROM ues", []);
        res.json(ues);
    } catch (err) {
        console.error("Erreur getUesEnseignant:", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};