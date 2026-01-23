import db from "../config/db.js";
// ------------------------ ENSEIGNANTS ------------------------ //
exports.createEnseignant = async (req, res) => {
    const { nom, email } = req.body;
    try {
        const [result] = await db.promise().query(
            "INSERT INTO enseignants (nom, email) VALUES (?, ?)",
            [nom, email]
        );
        res.status(201).json({ message: "Enseignant créé", id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

exports.getEnseignants = async (req, res) => {
    try {
        const [rows] = await db.promise().query("SELECT * FROM enseignants");
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

exports.updateEnseignant = async (req, res) => {
    const { id } = req.params;
    const { nom, email } = req.body;
    try {
        await db.promise().query(
            "UPDATE enseignants SET nom=?, email=? WHERE id=?",
            [nom, email, id]
        );
        res.json({ message: "Enseignant mis à jour" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

exports.deleteEnseignant = async (req, res) => {
    const { id } = req.params;
    try {
        await db.promise().query("DELETE FROM enseignants WHERE id=?", [id]);
        res.json({ message: "Enseignant supprimé" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};