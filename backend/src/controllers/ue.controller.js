import db from "../config/db.js";

export const getUEs = async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT id, code, intitule, classe_id, enseignant_id, semestre_id FROM ues ORDER BY intitule ASC"
        );
        res.status(200).json(rows);
    } catch (err) {
        console.error("Erreur getUEs:", err);
        res.status(500).json({ message: "Erreur lors de la récupération des unités d'enseignement" });
    }
};

export const createUE = async (req, res) => {
    const { code, intitule, classe_id, enseignant_id, semestre_id } = req.body;
    try {
        const [result] = await db.query(
            "INSERT INTO ues (code, intitule, classe_id, enseignant_id, semestre_id) VALUES (?, ?, ?, ?, ?)",
            [code, intitule, classe_id, enseignant_id, semestre_id]
        );
        res.status(201).json({ message: "UE créée", id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

export const updateUE = async (req, res) => {
    const { id } = req.params;
    const { code, intitule, classe_id, enseignant_id, semestre_id } = req.body;
    try {
        await db.query(
            "UPDATE ues SET code=?, intitule=?, classe_id=?, enseignant_id=?, semestre_id=? WHERE id=?",
            [code, intitule, classe_id, enseignant_id, semestre_id, id]
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
