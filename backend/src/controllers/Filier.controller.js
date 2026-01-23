import db from "../config/db.js";

exports.seedFilieres = async () => {
    try {
        // 1. Vérifier si la table est vide
        const [existing] = await db.promise().query("SELECT COUNT(*) as total FROM filieres");
        
        if (existing[0].total === 0) {
            console.log("🌱 Seeding des filières...");

            // 2. Récupérer l'ID d'un département pour la cohérence (ex: Informatique)
            const [deps] = await db.promise().query("SELECT id FROM departements WHERE nom = 'Informatique' LIMIT 1");
            
            // Si le département n'existe pas, on prend le premier disponible
            const depId = deps.length > 0 ? deps[0].id : 1;

            const filieresAInserer = [
                ['Génie Logiciel', depId],
                ['Sécurité Informatique', depId],
                ['Systèmes et Réseaux', depId],
                ['Intelligence Artificielle', depId]
            ];

            // 3. Insertion multiple
            await db.promise().query(
                "INSERT INTO filieres (nom, departement_id) VALUES ?", 
                [filieresAInserer]
            );

            console.log("✅ Filières insérées avec succès !");
        } else {
            console.log("ℹ️ La table 'filieres' contient déjà des données.");
        }
    } catch (err) {
        console.error("❌ Erreur lors du seeding filières :", err.message);
    }
};

exports.getFilieres = async (req, res) => {
    try {
        const query = `
            SELECT f.id, f.nom as filiere_nom, d.nom as departement_nom 
            FROM filieres f
            INNER JOIN departements d ON f.departement_id = d.id
        `;
        const [rows] = await db.promise().query(query);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur lors de la récupération" });
    }
};