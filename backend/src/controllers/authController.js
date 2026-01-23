const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db'); // ta config MySQL
const dotenv = require('dotenv');
dotenv.config();

exports.registerUser = async (req, res) => {
    const { username, password, role, enseignant_id } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.promise().query(
            "INSERT INTO users (nom,email, password, role, enseignant_id) VALUES (?, ?, ?, ?, ?)",
            [username, email, hashedPassword, role, enseignant_id || null]
        );

        res.status(201).json({ message: "Utilisateur créé", userId: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};


exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const [rows] = await db.promise().query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        if (rows.length === 0) return res.status(400).json({ message: "Utilisateur non trouvé" });

        const user = rows[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) return res.status(400).json({ message: "Mot de passe incorrect" });

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({ message: "Connexion réussie", token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};
