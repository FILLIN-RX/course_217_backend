import db from "../config/db.js";

// --- Seeding ---
export const seedUEs = async () => {
    try {
        const [count] = await db.query("SELECT COUNT(*) as total FROM ues");
        if (count[0].total === 0) {
            console.log("🌱 Seeding UEs...");
            
            // Get all classes
            const [classes] = await db.query("SELECT id, nom FROM classes ORDER BY id");
            
            // Map class names to IDs
            const classMap = {};
            classes.forEach(c => {
                classMap[c.nom] = c.id;
            });
            
            // Courses structure: [code, intitule, className, semestre]
            const coursesData = [
                // L1 IF - Semestre 1
                ['ICT 101', 'Introduction à l\'Informatique', 'L1 IF', 1],
                ['ICT 102', 'Algorithmique et Programmation I', 'L1 IF', 1],
                ['ICT 103', 'Mathématiques Discrètes', 'L1 IF', 1],
                ['ICT 104', 'Architecture des Ordinateurs', 'L1 IF', 1],
                ['ICT 105', 'Systèmes d\'Exploitation I', 'L1 IF', 1],
                ['ICT 106', 'Anglais Technique I', 'L1 IF', 1],
                
                // L1 IF - Semestre 2
                ['ICT 107', 'Programmation Orientée Objet', 'L1 IF', 2],
                ['ICT 108', 'Structures de Données', 'L1 IF', 2],
                ['ICT 109', 'Algèbre Linéaire', 'L1 IF', 2],
                ['ICT 110', 'Réseaux Informatiques I', 'L1 IF', 2],
                ['ICT 111', 'Base de Données I', 'L1 IF', 2],
                ['ICT 112', 'Anglais Technique II', 'L1 IF', 2],
                
                // L2 IF - Semestre 1
                ['ICT 201', 'Programmation Web I', 'L2 IF', 1],
                ['ICT 202', 'Génie Logiciel I', 'L2 IF', 1],
                ['ICT 203', 'Théorie des Graphes', 'L2 IF', 1],
                ['ICT 204', 'Systèmes d\'Exploitation II', 'L2 IF', 1],
                ['ICT 205', 'Base de Données II', 'L2 IF', 1],
                ['ICT 206', 'Probabilités et Statistiques', 'L2 IF', 1],
                
                // L2 IF - Semestre 2
                ['ICT 207', 'Programmation Web II', 'L2 IF', 2],
                ['ICT 208', 'Réseaux Informatiques II', 'L2 IF', 2],
                ['ICT 209', 'Intelligence Artificielle I', 'L2 IF', 2],
                ['ICT 210', 'Sécurité Informatique I', 'L2 IF', 2],
                ['ICT 211', 'Analyse Numérique', 'L2 IF', 2],
                ['ICT 212', 'Méthodologie de Recherche', 'L2 IF', 2],
                
                // L3 IF - Semestre 1
                ['ICT 301', 'Développement Mobile', 'L3 IF', 1],
                ['ICT 302', 'Cloud Computing', 'L3 IF', 1],
                ['ICT 303', 'Big Data', 'L3 IF', 1],
                ['ICT 304', 'Cryptographie', 'L3 IF', 1],
                ['ICT 305', 'Compilation', 'L3 IF', 1],
                ['ICT 306', 'Gestion de Projets IT', 'L3 IF', 1],
                
                // L3 IF - Semestre 2
                ['ICT 307', 'DevOps', 'L3 IF', 2],
                ['ICT 308', 'Machine Learning', 'L3 IF', 2],
                ['ICT 309', 'Blockchain', 'L3 IF', 2],
                ['ICT 310', 'IoT (Internet of Things)', 'L3 IF', 2],
                ['ICT 311', 'Éthique et Droit Informatique', 'L3 IF', 2],
                ['ICT 312', 'Stage Professionnel', 'L3 IF', 2],
                
                // Master 1 IF - Semestre 1
                ['ICT 401', 'Deep Learning', 'Master 1 IF', 1],
                ['ICT 402', 'Systèmes Distribués', 'Master 1 IF', 1],
                ['ICT 403', 'Architecture Microservices', 'Master 1 IF', 1],
                ['ICT 404', 'Sécurité Avancée', 'Master 1 IF', 1],
                ['ICT 405', 'Data Science', 'Master 1 IF', 1],
                ['ICT 406', 'Recherche Opérationnelle', 'Master 1 IF', 1],
                
                // Master 1 IF - Semestre 2
                ['ICT 407', 'Computer Vision', 'Master 1 IF', 2],
                ['ICT 408', 'Traitement du Langage Naturel', 'Master 1 IF', 2],
                ['ICT 409', 'Systèmes Temps Réel', 'Master 1 IF', 2],
                ['ICT 410', 'Audit et Conformité IT', 'Master 1 IF', 2],
                ['ICT 411', 'Innovation et Entrepreneuriat', 'Master 1 IF', 2],
                ['ICT 412', 'Projet de Recherche I', 'Master 1 IF', 2],
                
                // Master 2 IF - Semestre 1
                ['ICT 501', 'Recherche Avancée en IA', 'Master 2 IF', 1],
                ['ICT 502', 'Systèmes Cyber-Physiques', 'Master 2 IF', 1],
                ['ICT 503', 'Quantum Computing', 'Master 2 IF', 1],
                ['ICT 504', 'Gouvernance IT', 'Master 2 IF', 1],
                ['ICT 505', 'Analyse de Données Massives', 'Master 2 IF', 1],
                ['ICT 506', 'Séminaire de Recherche', 'Master 2 IF', 1],
                
                // Master 2 IF - Semestre 2
                ['ICT 507', 'Thèse de Master (Partie 1)', 'Master 2 IF', 2],
                ['ICT 508', 'Thèse de Master (Partie 2)', 'Master 2 IF', 2],
                ['ICT 509', 'Publication Scientifique', 'Master 2 IF', 2],
                ['ICT 510', 'Soutenance de Thèse', 'Master 2 IF', 2],
                ['ICT 511', 'Stage en Entreprise', 'Master 2 IF', 2],
                ['ICT 512', 'Projet Final', 'Master 2 IF', 2]
            ];

            // Convert to database format with classe_id and semestre_id
            const uesForDB = coursesData.map(([code, intitule, className, semestre]) => {
                const classeId = classMap[className] || 1;
                return [code, intitule, classeId, semestre];
            });

            await db.query("INSERT INTO ues (code, intitule, classe_id, semestre_id) VALUES ?", [uesForDB]);
            console.log("✅ UEs seeded with class and semester assignments.");
        }
    } catch (err) {
        console.error("❌ Seed UEs Error:", err);
    }
};

export const getUEs = async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT id, code, intitule, classe_id, semestre_id FROM ues ORDER BY code ASC"
        );
        res.status(200).json(rows);
    } catch (err) {
        console.error("Erreur getUEs:", err);
        res.status(500).json({ message: "Erreur lors de la récupération des unités d'enseignement" });
    }
};

export const createUE = async (req, res) => {
    const { code, intitule, classe_id, semestre_id } = req.body;
    try {
        const [result] = await db.query(
            "INSERT INTO ues (code, intitule, classe_id, semestre_id) VALUES (?, ?, ?, ?)",
            [code, intitule, classe_id, semestre_id]
        );
        res.status(201).json({ message: "UE créée", id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

export const updateUE = async (req, res) => {
    const { id } = req.params;
    const { code, intitule, classe_id, semestre_id } = req.body;
    try {
        await db.query(
            "UPDATE ues SET code=?, intitule=?, classe_id=?, semestre_id=? WHERE id=?",
            [code, intitule, classe_id, semestre_id, id]
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
