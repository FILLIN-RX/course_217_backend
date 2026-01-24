import db from "../config/db.js";

// --- Seeding ---
export const seedPlages = async () => {
    const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const data = [];

    jours.forEach(jour => {
        for (let h = 8; h < 20; h++) {
            const hDebut = `${h.toString().padStart(2, '0')}:00:00`;
            const hFin = `${(h + 1).toString().padStart(2, '0')}:00:00`;
            data.push([jour, hDebut, hFin]);
        }
    });

    try {
        const [count] = await db.query("SELECT COUNT(*) as total FROM plages_horaires");
        if (count[0].total === 0) {
            console.log("🌱 Seeding Plages Hiraires...");
            // await db.query("DELETE FROM plages_horaires"); // Optional: depends on if we want to reset or just seed if empty
            await db.query(
                "INSERT INTO plages_horaires (jour, heure_debut, heure_fin) VALUES ?",
                [data]
            );
            console.log("✅ 72 Plages horaires créées avec succès !");
        }
    } catch (err) {
        console.error("❌ Erreur lors du seed plages :", err);
    }
};

// --- Retrieval ---
export const getPlages = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM plages_horaires ORDER BY FIELD(jour,'Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'), heure_debut");
        res.status(200).json(rows);
    } catch (err) {
        console.error("Erreur getPlages:", err);
        res.status(500).json({ message: "Erreur lors de la récupération des plages horaires" });
    }
};
