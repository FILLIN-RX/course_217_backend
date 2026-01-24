import db from "../config/db.js";

export const createSalle = async (req, res) => {
    const { nom, capacite } = req.body;
    try {
        const [result] = await db.query(
            "INSERT INTO salles (nom, capacite) VALUES (?, ?)",
            [nom, capacite]
        );
        res.status(201).json({ message: "Salle créée", id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

export const getSalles = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM salles");
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

export const updateSalle = async (req, res) => {
    const { id } = req.params;
    const { nom, capacite } = req.body;
    try {
        await db.query(
            "UPDATE salles SET nom=?, capacite=? WHERE id=?",
            [nom, capacite, id]
        );
        res.json({ message: "Salle mise à jour" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

export const deleteSalle = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM salles WHERE id=?", [id]);
        res.json({ message: "Salle supprimée" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};
