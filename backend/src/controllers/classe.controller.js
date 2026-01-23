
import db from "../config/db.js";

// ------------------------ CLASSES ------------------------ //
exports.createClasse = async (req, res) => {
    const { nom, filiere_id } = req.body;
    try {
        const [result] = await db.promise().query(
            "INSERT INTO classes (nom, filiere_id) VALUES (?, ?)",
            [nom, filiere_id]
        );
        res.status(201).json({ message: "Classe créée", id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

exports.getClasses = async (req, res) => {
    try {
        const [rows] = await db.promise().query("SELECT * FROM classes");
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

exports.updateClasse = async (req, res) => {
    const { id } = req.params;
    const { nom, filiere_id } = req.body;
    try {
        await db.promise().query(
            "UPDATE classes SET nom=?, filiere_id=? WHERE id=?",
            [nom, filiere_id, id]
        );
        res.json({ message: "Classe mise à jour" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

exports.deleteClasse = async (req, res) => {
    const { id } = req.params;
    try {
        await db.promise().query("DELETE FROM classes WHERE id=?", [id]);
        res.json({ message: "Classe supprimée" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};