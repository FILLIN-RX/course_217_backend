import db from "../config/db.js";
import { logAction } from "../services/audit.service.js";

// --- Seeding ---
export const seedDepartements = async () => {
  try {
    const [count] = await db.query(
      "SELECT COUNT(*) as total FROM departements",
    );
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
    const [rows] = await db.query(
      "SELECT * FROM departements ORDER BY nom ASC",
    );
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
      "SELECT effectif FROM classe_effectifs WHERE classe_id=? AND semestre_id=? AND annee_id=?",
      [classe_id, semestre_id, annee_id],
    );
    if (effectifRows.length === 0) {
      return res.status(400).json({
        message: "Effectif non défini pour cette classe/semestre/année.",
      });
    }
    const classEffectif = effectifRows[0].effectif;

    // 2. Get UEs for this semester (Global UEs logic as per user request 'UE no class ID')
    // We assume UEs are filtered by semester only, or we would need a join via Filiere if schema permitted.
    // For now, fetching all UEs for the semester that are NOT yet fully scheduled for this class.
    const [ues] = await db.query(
      "SELECT u.*, eu.enseignant_id FROM ues u LEFT JOIN enseignant_ues eu ON u.id = eu.ue_id WHERE u.semestre_id=?",
      [semestre_id],
    );

    // 3. Get all Rooms with enough capacity
    const [salles] = await db.query(
      "SELECT * FROM salles WHERE capacite >= ? ORDER BY capacite ASC",
      [classEffectif],
    );

    if (salles.length === 0) {
      return res.status(400).json({
        message: "Aucune salle disponible pour accueillir cet effectif.",
      });
    }

    // 4. Get all Time Slots
    const [plages] = await db.query(
      "SELECT * FROM plages_horaires ORDER BY FIELD(jour,'Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'), heure_debut",
    );

    let nonAffectees = [];

    // 5. Algorithm: Iterative placement
    for (const ue of ues) {
      let affecte = false;

      // Check if UE is already scheduled for THIS class in this period
      const [alreadyScheduled] = await db.query(
        "SELECT id FROM emplois_du_temps WHERE ue_id=? AND semestre_id=? AND annee_id=? AND salle_id IN (SELECT salle_id FROM emplois_du_temps WHERE ue_id=?)", // Logic ambiguous without Many-to-Many mapping but proceeding with basic constraint
        [ue.id, semestre_id, annee_id, ue.id],
      );
      // Simpler check: Has this UE been scheduled at all for this context?
      // Since UEs are global now, we might schedule the SAME UE for multiple classes?
      // The user didn't specify. Assuming ONE instance per UE for now or until collision.

      // Get Teacher Preferences for this UE's teacher
      const [prefs] = await db.query(
        "SELECT plage_id FROM disponibilites_enseignants WHERE enseignant_id=? AND prefere=1",
        [ue.enseignant_id],
      );
      const prefPlageIds = prefs.map((p) => p.plage_id);

      // Sort plages: preferences first, then others
      const sortedPlages = [
        ...plages.filter((p) => prefPlageIds.includes(p.id)),
        ...plages.filter((p) => !prefPlageIds.includes(p.id)),
      ];

      for (const plage of sortedPlages) {
        for (const salle of salles) {
          // Check if salle is busy at this slot
          const [busySalle] = await db.query(
            "SELECT id FROM emplois_du_temps WHERE salle_id=? AND plage_id=? AND semestre_id=? AND annee_id=?",
            [salle.id, plage.id, semestre_id, annee_id],
          );
          if (busySalle.length > 0) continue;

          // Check if teacher is busy at this slot
          const [busyTeacher] = await db.query(
            `SELECT et.id FROM emplois_du_temps et 
             LEFT JOIN enseignant_ues eu ON et.ue_id = eu.ue_id 
             WHERE eu.enseignant_id=? AND et.plage_id=? AND et.semestre_id=? AND et.annee_id=?`,
            [ue.enseignant_id, plage.id, semestre_id, annee_id],
          );
          if (busyTeacher.length > 0) continue;

          // Check if teacher is available (not just preferred)
          const [isAvailable] = await db.query(
            "SELECT id FROM disponibilites_enseignants WHERE enseignant_id=? AND plage_id=?",
            [ue.enseignant_id, plage.id],
          );
          if (isAvailable.length === 0) continue;

          // Place the UE
          const [insert] = await db.query(
            "INSERT INTO emplois_du_temps (ue_id, salle_id, classe_id, plage_id, semestre_id, annee_id, statut) VALUES (?, ?, ?, ?, ?, ?, 'BROUILLON')",
            [ue.id, salle.id, ue.classe_id, plage.id, semestre_id, annee_id],
          );

          await logAction(
            "PLACEMENT_AUTO",
            "emplois_du_temps",
            insert.insertId,
            userId,
            null,
            { ue_id: ue.id, salle_id: salle.id, plage_id: plage.id },
          );

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
      nonAffectees,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Erreur lors de la génération de l'emploi du temps." });
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
      [semestre_id, annee_id],
    );

    await logAction(
      "VALIDATION_GLOBALE",
      "emplois_du_temps",
      null,
      userId,
      { statut: "BROUILLON" },
      { statut: "VALIDE" },
    );

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
    const [result] = await db.query(
      "INSERT INTO salles (nom, capacite) VALUES (?, ?)",
      [nom, capacite],
    );
    res.status(201).json({ id: result.insertId, nom, capacite });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// --- Récupérer les profs dispos pour la grille Admin ---
export const getGrilleDisponibilitesOption = async (req, res) => {
  const { semestre_id } = req.query;

  console.log("=== API: getGrilleDisponibilitesOption ===");
  console.log("Semestre demandé:", semestre_id);

  try {
    let query = `
           SELECT 
        ph.id as plage_id,
        e.id as enseignant_id,
        e.nom,
        de.semestre_id,
        -- On ajoute IFNULL pour éviter le vide total
        IFNULL(GROUP_CONCAT(DISTINCT u.code SEPARATOR ', '), 'Aucune UE') as ues_codes
    FROM plages_horaires ph
    JOIN disponibilites_enseignants de ON ph.id = de.plage_id
    JOIN enseignants e ON de.enseignant_id = e.id
    -- On s'assure de bien joindre les UEs liées à cet enseignant
    LEFT JOIN enseignant_ues eu ON e.id = eu.enseignant_id
    LEFT JOIN ues u ON eu.ue_id = u.id
    WHERE de.prefere = 1`;

    const params = [];
    if (semestre_id) {
      query += ` AND de.semestre_id = ?`;
      params.push(semestre_id);
    }

    // Exclure les disponibilités déjà assignées à un cours
    query += ` AND NOT EXISTS (
        SELECT 1 FROM emplois_du_temps et
        JOIN enseignant_ues eu2 ON et.ue_id = eu2.ue_id
        WHERE et.plage_id = ph.id 
        AND eu2.enseignant_id = e.id
        AND et.semestre_id = de.semestre_id
    )`;

    query += ` GROUP BY ph.id, e.id, de.semestre_id`;
    const [rows] = await db.query(query, params);

    console.log(`Nombre de disponibilités trouvées: ${rows.length}`);

    // Regrouper par plage pour le front
    const mapping = rows.reduce((acc, row) => {
      if (!acc[row.plage_id]) acc[row.plage_id] = [];
      acc[row.plage_id].push({
        id: row.enseignant_id,
        nom: row.nom,
        semestre: row.semestre_id,
        ues: row.ues_codes, // Ajouter la liste des UEs
      });
      return acc;
    }, {});

    console.log(
      `Nombre de créneaux avec disponibilités: ${Object.keys(mapping).length}`,
    );
    console.log("Mapping créé:", JSON.stringify(mapping, null, 2));

    res.json(mapping);
  } catch (err) {
    console.error("Erreur getGrilleDisponibilitesOption:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// --- Récupérer les UEs d'un enseignant choisi dans la pop-up ---
export const getUesEnseignant = async (req, res) => {
  const { enseignant_id } = req.params;
  console.log(`=== API: getUesEnseignant (id=${enseignant_id}) ===`);

  try {
    const query = `
            SELECT u.*, c.nom as classe_nom, c.id as classe_id
            FROM ues u
            JOIN enseignant_ues eu ON u.id = eu.ue_id
            JOIN classes c ON u.classe_id = c.id
            WHERE eu.enseignant_id = ?
        `;
    const [ues] = await db.query(query, [enseignant_id]);

    console.log(
      `${ues.length} UEs trouvées pour l'enseignant ${enseignant_id}`,
    );
    if (ues.length === 0)
      console.warn(
        "Attention: Aucune UE trouvée. Vérifiez la table 'enseignant_ues'.",
      );

    res.json(ues);
  } catch (err) {
    console.error("Erreur getUesEnseignant:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/**
 * Assigner manuellement un cours
 */
export const assignerCoursManuel = async (req, res) => {
  const { ue_id, salle_id, plage_id, semestre_id, annee_id } = req.body;

  try {
    // 1. Get Class & Details for the UE
    const [ueRows] = await db.query(
      `SELECT u.id, u.classe_id, eu.enseignant_id, c.nom as classe_nom 
       FROM ues u 
       JOIN classes c ON u.classe_id = c.id 
       LEFT JOIN enseignant_ues eu ON u.id = eu.ue_id
       WHERE u.id = ?`,
      [ue_id],
    );

    if (ueRows.length === 0) {
      return res.status(404).json({ message: "UE introuvable." });
    }
    const { classe_id, classe_nom, enseignant_id } = ueRows[0];

    // 2. Validate Room Capacity
    // Get Class Effectif
    const [effRows] = await db.query(
      "SELECT effectif FROM classe_effectifs WHERE classe_id=? AND semestre_id=? AND annee_id=?",
      [classe_id, semestre_id, annee_id],
    );
    const effectif = effRows.length > 0 ? effRows[0].effectif : 0;

    // Get Room Capacity
    if (!salle_id) return res.status(400).json({ message: "Salle manquante." });

    const [salleRows] = await db.query("SELECT * FROM salles WHERE id = ?", [
      salle_id,
    ]);
    if (salleRows.length === 0)
      return res.status(404).json({ message: "Salle introuvable." });

    if (effectif > salleRows[0].capacite) {
      return res.status(400).json({
        message: `La salle ${salleRows[0].nom} (Cap: ${salleRows[0].capacite}) est trop petite pour la classe ${classe_nom} (Eff: ${effectif}).`,
      });
    }

    // 3. Check Collisions (Room, Class, Teacher)
    // Helper to build collision query
    const checkCollision = async (entityField, entityId) => {
      let query = `SELECT id FROM emplois_du_temps WHERE ${entityField} = ? AND plage_id = ? AND semestre_id = ? AND annee_id = ?`;
      let params = [entityId, plage_id, semestre_id, annee_id];

      const [rows] = await db.query(query, params);
      return rows.length > 0;
    };

    if (await checkCollision("salle_id", salle_id))
      return res.status(400).json({ message: "La salle est déjà occupée." });
    if (await checkCollision("classe_id", classe_id))
      return res.status(400).json({ message: "La classe a déjà un cours." });

    // Check Teacher
    let teacherQuery = `
        SELECT et.id FROM emplois_du_temps et 
        JOIN enseignant_ues eu ON et.ue_id = eu.ue_id 
        WHERE eu.enseignant_id = ? AND et.plage_id = ? AND et.semestre_id = ? AND et.annee_id = ?`;
    let teacherParams = [enseignant_id, plage_id, semestre_id, annee_id];

    const [teacherBusy] = await db.query(teacherQuery, teacherParams);
    if (teacherBusy.length > 0)
      return res.status(400).json({ message: "L'enseignant est déjà occupé." });

    // 4. Insert
    await db.query(
      `INSERT INTO emplois_du_temps (ue_id, salle_id, classe_id, plage_id, semestre_id, annee_id, statut)
       VALUES (?, ?, ?, ?, ?, ?, 'VALIDE')`,
      [ue_id, salle_id, classe_id, plage_id, semestre_id, annee_id],
    );

    res.json({ message: "Cours assigné avec succès." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/**
 * Check which classes have a complete schedule for a semester
 */
export const getScheduleStatus = async (req, res) => {
  const { semestre_id } = req.query; // Expects query params
  const annee_id = 1; // Default or passing from query

  try {
    // 1. Get all Classes
    const [classes] = await db.query("SELECT id, nom FROM classes");
    const readyClasses = [];

    for (const cls of classes) {
      // Get Total UEs for this class & semester
      const [ues] = await db.query(
        "SELECT COUNT(*) as total FROM ues WHERE classe_id = ? AND semestre_id = ?",
        [cls.id, semestre_id],
      );
      const totalUEs = ues[0].total;

      if (totalUEs === 0) continue; // No UEs, skip

      // Get Scheduled UEs
      const [scheduled] = await db.query(
        `SELECT COUNT(DISTINCT ue_id) as total 
                 FROM emplois_du_temps etk
                 JOIN ues u ON etk.ue_id = u.id
                 WHERE u.classe_id = ? AND etk.semestre_id = ? AND etk.annee_id = ?`,
        [cls.id, semestre_id, annee_id],
      );
      const countScheduled = scheduled[0].total;

      if (totalUEs === countScheduled) {
        readyClasses.push(cls.nom);
      }
    }

    res.json({ readyClasses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
// ... existing code ...

/**
 * Get all teachers with their UEs
 */
export const getEnseignants = async (req, res) => {
  try {
    const [teachers] = await db.query(
      "SELECT * FROM enseignants ORDER BY nom ASC",
    );

    // Fetch UEs for each teacher
    for (const teacher of teachers) {
      const [ues] = await db.query(
        `SELECT u.code FROM ues u
                 JOIN enseignant_ues eu ON u.id = eu.ue_id
                 WHERE eu.enseignant_id = ?`,
        [teacher.id],
      );
      teacher.ues = ues.map((u) => u.code).join(", ");
    }

    res.json(teachers);
  } catch (err) {
    console.error("Erreur getEnseignants:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const deleteCourse = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // Get course details before deletion for logging
    const [course] = await db.query(
      "SELECT * FROM emplois_du_temps WHERE id = ?",
      [id],
    );

    if (course.length === 0) {
      return res.status(404).json({ message: "Cours introuvable" });
    }

    await db.query("DELETE FROM emplois_du_temps WHERE id = ?", [id]);

    await logAction(
      "DELETE_COURSE",
      "emplois_du_temps",
      id,
      userId,
      course[0],
      null,
    );

    res.json({ message: "Cours supprimé avec succès" });
  } catch (err) {
    console.error("Erreur deleteCourse:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
