import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../config/db.js";

export const registerUser = async (req, res) => {
  const { nom, email, password, role, ues } = req.body;

  // SQLite transaction support via wrapper
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Vérifier si l'email existe
    const [existing] = await connection.query(
      "SELECT id FROM users WHERE email = ?",
      [email],
    );
    if (existing.length > 0) {
      // Rollback not needed if we haven't written yet, but good practice
      await connection.rollback();
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let enseignant_id = null;

    // 2. Si c'est un enseignant, on le crée d'abord dans la table 'enseignants'
    if (role === "ENSEIGNANT") {
      await connection.query(
        "INSERT INTO enseignants (nom, email) VALUES (?, ?)",
        [nom, email],
      );
      // Récupérer l'ID inséré (SQLite specific)
      const [rows] = await connection.query("SELECT last_insert_rowid() as id");
      enseignant_id = rows[0].id;

      // 3. Associer les UEs sélectionnées
      if (ues && ues.length > 0) {
        // SQLite bulk insert workaround: loop or multiple values
        for (const ueId of ues) {
          await connection.query(
            "INSERT INTO enseignant_ues (enseignant_id, ue_id) VALUES (?, ?)",
            [enseignant_id, ueId],
          );
        }
      }
    }

    // 4. Créer le compte utilisateur
    await connection.query(
      "INSERT INTO users (nom, email, password, role, enseignant_id) VALUES (?, ?, ?, ?, ?)",
      [nom, email, hashedPassword, role, enseignant_id],
    );

    await connection.commit();
    res.status(201).json({ message: "Compte créé avec succès" });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "Erreur lors de l'inscription" });
  } finally {
    connection.release();
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (rows.length === 0) {
      return res.status(400).json({ message: "Identifiants incorrects" });
    }

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({ message: "Identifiants incorrects" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, enseignant_id: user.enseignant_id },
      process.env.JWT_SECRET,
      { expiresIn: "8h" },
    );

    res.json({
      message: "Connexion réussie",
      token,
      user: {
        id: user.id,
        nom: user.nom,
        role: user.role,
        enseignant_id: user.enseignant_id,
      },
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
      [userId],
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
