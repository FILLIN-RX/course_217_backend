import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

export const registerUser = async (req, res) => {
    // On utilise 'nom' pour correspondre au formulaire front-end
    const { nom, email, password, role, enseignant_id } = req.body;

    try {
        // Vérifier si l'utilisateur existe déjà
        const [existingUser] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: "Cet email est déjà utilisé." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertion (Note : on n'utilise plus .promise() si le pool est déjà en mode promise)
        const [result] = await db.query(
            "INSERT INTO users (nom, email, password, role, enseignant_id) VALUES (?, ?, ?, ?, ?)",
            [nom, email, hashedPassword, role, enseignant_id || null]
        );

        res.status(201).json({ message: "Utilisateur créé avec succès", userId: result.insertId });
    } catch (err) {
        console.error("Erreur Register:", err);
        res.status(500).json({ message: "Erreur lors de l'insertion en base de données" });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

        if (rows.length === 0) {
            return res.status(400).json({ message: "Identifiants incorrects" });
        }

        const user = rows[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(400).json({ message: "Identifiants incorrects" });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({ 
            message: "Connexion réussie", 
            token,
            user: { id: user.id, nom: user.nom, role: user.role } 
        });
    } catch (err) {
        console.error("Erreur Login:", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

export const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.query(
            "SELECT id, nom, email, role, enseignant_id, created_at FROM users WHERE id = ?", 
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error("Erreur GetProfile:", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};