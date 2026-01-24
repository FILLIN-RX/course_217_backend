import db from "../config/db.js";

// --- Seeding ---
export const seedSemestres = async () => {
    try {
        const [count] = await db.query("SELECT COUNT(*) as total FROM semestres");
        if (count[0].total === 0) {
            console.log("🌱 Seeding Semestres...");
            await db.query("INSERT INTO semestres (nom) VALUES ('Semestre 1'), ('Semestre 2')");
            console.log("✅ Semestres seeded.");
        }
    } catch (err) {
        console.error("❌ Seed Semestres Error:", err);
    }
};

export const getSemestres = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM semestres ORDER BY id ASC");
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};
