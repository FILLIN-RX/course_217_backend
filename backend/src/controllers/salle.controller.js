import db from "../config/db.js";

export const seedSalles = async () => {
  try {
    const [count] = await db.query("SELECT COUNT(*) as total FROM salles");
    if (count[0].total === 0) {
      console.log("🌱 Seeding Salles...");
      const salles = [
        ["Amphi 100", 100],
        ["Amphi 250", 250],
        ["Amphi 350", 350],
        ["Salle 101", 50],
        ["Salle 102", 50],
        ["Labo Info 1", 30],
        ["Labo Info 2", 30],
      ];
      for (const salle of salles) {
        await db.query(
          "INSERT INTO salles (nom, capacite) VALUES (?, ?)",
          salle,
        );
      }
      console.log("✅ Salles seeded.");
    }
  } catch (err) {
    console.error("❌ Seed Salles Error:", err);
  }
};

export const createSalle = async (req, res) => {
  const { nom, capacite } = req.body;
  try {
    await db.query("INSERT INTO salles (nom, capacite) VALUES (?, ?)", [
      nom,
      capacite,
    ]);
    const [rows] = await db.query("SELECT last_insert_rowid() as id");
    res.status(201).json({ message: "Salle créée", id: rows[0].id });
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
    await db.query("UPDATE salles SET nom=?, capacite=? WHERE id=?", [
      nom,
      capacite,
      id,
    ]);
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
