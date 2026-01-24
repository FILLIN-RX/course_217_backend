import db from "../config/db.js";

// --- Seeding ---
export const seedClasses = async () => {
    try {
        const [count] = await db.query("SELECT COUNT(*) as total FROM classes");
        if (count[0].total === 0) {
            console.log("🌱 Seeding Classes...");
            // Get 'Génie Logiciel' ID
            const [fil] = await db.query("SELECT id FROM filieres WHERE nom = 'Génie Logiciel'");
            const filId = fil.length ? fil[0].id : 1;

            await db.query(`INSERT INTO classes (nom, filiere_id) VALUES ('L1 GL', ?), ('L2 GL', ?)`, [filId, filId]);
            console.log("✅ Classes seeded.");
        }
    } catch (err) {
        console.error("❌ Seed Classes Error:", err);
    }
};

export const createClasse = async (req, res) => {
    const { nom, filiere_id } = req.body;
    try {
        const [result] = await db.query(
            "INSERT INTO classes (nom, filiere_id) VALUES (?, ?)",
            [nom, filiere_id]
        );
        res.status(201).json({ message: "Classe créée", id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

export const getClasses = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM classes");
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

export const updateClasse = async (req, res) => {
    const { id } = req.params;
    const { nom, filiere_id } = req.body;
    try {
        await db.query(
            "UPDATE classes SET nom=?, filiere_id=? WHERE id=?",
            [nom, filiere_id, id]
        );
        res.json({ message: "Classe mise à jour" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

export const deleteClasse = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM classes WHERE id=?", [id]);
        res.json({ message: "Classe supprimée" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

// --- Effectifs ---
export const setEffectif = async (req, res) => {
    const { classe_id, semestre_id, annee_id, effectif } = req.body;
    try {
        await db.query(
            "INSERT INTO effectifs_classe (classe_id, semestre_id, annee_id, effectif) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE effectif=?",
            [classe_id, semestre_id, annee_id, effectif, effectif]
        );
        res.json({ message: "Effectif mis à jour" });
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur" });
    }
};