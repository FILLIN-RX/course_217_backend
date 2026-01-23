import db from "../config/db.js";

export const seedUEs = async () => {
    try {
        const [rows] = await db.query("SELECT COUNT(*) as total FROM ues");
        
        if (rows[0].total === 0) {
            console.log("🌱 Seeding des Unités d'Enseignement (UE)...");

            const uesAInserer = [
                ['MATH101', 'Mathématiques Fondamentales'],
                ['PROG202', 'Algorithmique et Python'],
                ['WEB303', 'Développement Fullstack Node.js'],
                ['SYS404', 'Administration Réseaux et Linux'],
                ['ENG102', 'Anglais Technique']
            ];

            const sql = "INSERT INTO ues (code, intitule) VALUES ?";
            await db.query(sql, [uesAInserer]);

            console.log("✅ UEs insérées avec succès !");
        } else {
            console.log("ℹ️ La table 'ues' contient déjà des données.");
        }
    } catch (err) {
        console.error("❌ Erreur lors du seeding des UE :", err.message);
    }
};

export const getUEs = async (req, res) => {
    try {
        // Sélectionne toutes les colonnes, triées par nom d'UE
        const [rows] = await db.query(
            "SELECT id, code, intitule FROM ues ORDER BY intitule ASC"
        );
        
        // Si la liste est vide, on renvoie un tableau vide avec un code 200 (car ce n'est pas une erreur serveur)
        res.status(200).json(rows);
    } catch (err) {
        console.error("Erreur getUEs:", err);
        res.status(500).json({ 
            message: "Erreur lors de la récupération des unités d'enseignement" 
        });
    }
};