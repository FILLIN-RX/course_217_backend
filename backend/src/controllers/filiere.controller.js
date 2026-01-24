import db from "../config/db.js";

// --- Seeding ---
export const seedFilieres = async () => {
    try {
        const [count] = await db.query("SELECT COUNT(*) as total FROM filieres");
        if (count[0].total === 0) {
            console.log("🌱 Seeding Filieres...");
            const [dep] = await db.query("SELECT id FROM departements WHERE nom = 'Informatique'");
            const depId = dep.length ? dep[0].id : 1;

            await db.query(`INSERT INTO filieres (nom, departement_id) VALUES 
                ('Informatique Fondamentale', ?), 
                ('ICT 4 Development', ?)`, [depId, depId]);
            console.log("✅ Filieres seeded.");
        }
    } catch (err) {
        console.error("❌ Seed Filieres Error:", err);
    }
};

export const getFilieres = async (req, res) => {
    try {
        const query = `
            SELECT f.id, f.nom as filiere_nom, d.nom as departement_nom, f.departement_id
            FROM filieres f
            INNER JOIN departements d ON f.departement_id = d.id
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur lors de la récupération" });
    }
};

export const createFiliere = async (req, res) => {
    const { nom, departement_id } = req.body;
    try {
        const [result] = await db.query(
            "INSERT INTO filieres (nom, departement_id) VALUES (?, ?)",
            [nom, departement_id]
        );
        res.status(201).json({ message: "Filière créée", id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

export const updateFiliere = async (req, res) => {
    const { id } = req.params;
    const { nom, departement_id } = req.body;
    try {
        await db.query(
            "UPDATE filieres SET nom=?, departement_id=? WHERE id=?",
            [nom, departement_id, id]
        );
        res.json({ message: "Filière mise à jour" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

export const deleteFiliere = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM filieres WHERE id=?", [id]);
        res.json({ message: "Filière supprimée" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};
