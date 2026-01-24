import db from "../config/db.js";

// --- Seeding ---
export const seedUEs = async () => {
    try {
        const [count] = await db.query("SELECT COUNT(*) as total FROM ues");
        if (count[0].total === 0) {
            console.log("🌱 Seeding UEs...");
            
            // Get 'Enseignant' ID
            const [ens] = await db.query("SELECT id FROM enseignants LIMIT 1");
            const enseignantId = ens.length ? ens[0].id : 1;

            const ues = [
                ['MATH101', 'Algèbre Linéaire', enseignantId, 1],
                ['INFO101', 'Introduction Algo', enseignantId, 1],
                ['WEB101', 'HTML/CSS/JS', enseignantId, 1]
            ];

            await db.query(
                "INSERT INTO ues (code, intitule, enseignant_id, semestre_id) VALUES ?",
                [ues]
            );
            console.log("✅ UEs seeded.");
        }
    } catch (err) {
        console.error("❌ Seed UEs Error:", err);
    }
};

export const getUEs = async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT id, code, intitule, enseignant_id, semestre_id FROM ues ORDER BY intitule ASC"
        );
        res.status(200).json(rows);
    } catch (err) {
        console.error("Erreur getUEs:", err);
        res.status(500).json({ message: "Erreur lors de la récupération des unités d'enseignement" });
    }
};

export const createUE = async (req, res) => {
    const { code, intitule, enseignant_id, semestre_id } = req.body;
    try {
        const [result] = await db.query(
            "INSERT INTO ues (code, intitule, enseignant_id, semestre_id) VALUES (?, ?, ?, ?)",
            [code, intitule, enseignant_id, semestre_id]
        );
        res.status(201).json({ message: "UE créée", id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

export const updateUE = async (req, res) => {
    const { id } = req.params;
    const { code, intitule, enseignant_id, semestre_id } = req.body;
    try {
        await db.query(
            "UPDATE ues SET code=?, intitule=?, enseignant_id=?, semestre_id=? WHERE id=?",
            [code, intitule, enseignant_id, semestre_id, id]
        );
        res.json({ message: "UE mise à jour" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

export const deleteUE = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM ues WHERE id=?", [id]);
        res.json({ message: "UE supprimée" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};
