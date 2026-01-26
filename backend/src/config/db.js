import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbPath;
try {
  // Tentative d'import d'Electron pour le mode production
  const electron = await import("electron");
  const app = electron.app || electron.default?.app;
  if (app) {
    dbPath = path.join(app.getPath("userData"), "database.sqlite");
  } else {
    throw new Error("Electron app not found");
  }
} catch (err) {
  // Mode développement (Node.js standard)
  dbPath = path.join(__dirname, "..", "..", "database.sqlite");
}

console.log(`📂 Database path: ${dbPath}`);

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Connexion à la base de données
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Erreur de connexion SQLite:", err.message);
  } else {
    console.log("✅ Connecté à la base de données SQLite.");
  }
});

// Configuration et initialisation immédiate (dans la file d'attente SQLite)
db.run("PRAGMA foreign_keys = ON");
initDatabase();

// Promisification des méthodes de base
const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

// Fonction d'initialisation de la base de données
async function initDatabase() {
  console.log("🔄 Initialisation de la base de données...");

  const schema = `
      CREATE TABLE IF NOT EXISTS departements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS enseignants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        email TEXT UNIQUE
      );

      CREATE TABLE IF NOT EXISTS annees_academiques (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        libelle TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS semestres (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS salles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        capacite INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS plages_horaires (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        jour TEXT NOT NULL CHECK(jour IN ('Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi')),
        heure_debut TEXT NOT NULL,
        heure_fin TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS filieres (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        departement_id INTEGER NOT NULL,
        FOREIGN KEY (departement_id) REFERENCES departements(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('ADMIN','ENSEIGNANT')),
        enseignant_id INTEGER NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (enseignant_id) REFERENCES enseignants(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        filiere_id INTEGER NOT NULL,
        FOREIGN KEY (filiere_id) REFERENCES filieres(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS classe_effectifs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        classe_id INTEGER NOT NULL,
        annee_id INTEGER NOT NULL,
        semestre_id INTEGER NOT NULL,
        effectif INTEGER NOT NULL,
        FOREIGN KEY (classe_id) REFERENCES classes(id) ON DELETE CASCADE,
        FOREIGN KEY (annee_id) REFERENCES annees_academiques(id) ON DELETE CASCADE,
        FOREIGN KEY (semestre_id) REFERENCES semestres(id) ON DELETE CASCADE,
        UNIQUE(classe_id, annee_id, semestre_id)
      );

      CREATE TABLE IF NOT EXISTS ues (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL,
        intitule TEXT NOT NULL,
        classe_id INTEGER NOT NULL,
        semestre_id INTEGER NOT NULL,
        FOREIGN KEY (classe_id) REFERENCES classes(id) ON DELETE CASCADE,
        FOREIGN KEY (semestre_id) REFERENCES semestres(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS enseignant_ues (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        enseignant_id INTEGER NOT NULL,
        ue_id INTEGER NOT NULL,
        FOREIGN KEY (enseignant_id) REFERENCES enseignants(id) ON DELETE CASCADE,
        FOREIGN KEY (ue_id) REFERENCES ues(id) ON DELETE CASCADE,
        UNIQUE(enseignant_id, ue_id)
      );

      CREATE TABLE IF NOT EXISTS disponibilites_enseignants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        enseignant_id INTEGER NOT NULL,
        plage_id INTEGER NOT NULL,
        semestre_id INTEGER NOT NULL,
        prefere INTEGER DEFAULT 1,
        FOREIGN KEY (enseignant_id) REFERENCES enseignants(id) ON DELETE CASCADE,
        FOREIGN KEY (plage_id) REFERENCES plages_horaires(id) ON DELETE CASCADE,
        FOREIGN KEY (semestre_id) REFERENCES semestres(id) ON DELETE CASCADE,
        UNIQUE(enseignant_id, plage_id, semestre_id)
      );

      CREATE TABLE IF NOT EXISTS emplois_du_temps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ue_id INTEGER NOT NULL,
        salle_id INTEGER NOT NULL,
        classe_id INTEGER NOT NULL,
        plage_id INTEGER NOT NULL,
        semestre_id INTEGER NOT NULL,
        annee_id INTEGER NOT NULL,
        date_passage TEXT NULL,
        statut TEXT DEFAULT 'BROUILLON' CHECK(statut IN ('BROUILLON','VALIDE')),
        FOREIGN KEY (ue_id) REFERENCES ues(id),
        FOREIGN KEY (salle_id) REFERENCES salles(id),
        FOREIGN KEY (classe_id) REFERENCES classes(id),
        FOREIGN KEY (plage_id) REFERENCES plages_horaires(id),
        FOREIGN KEY (semestre_id) REFERENCES semestres(id),
        FOREIGN KEY (annee_id) REFERENCES annees_academiques(id)
      );

      CREATE TABLE IF NOT EXISTS historique_modifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT,
        table_name TEXT,
        record_id INTEGER,
        user_id INTEGER,
        old_values TEXT,
        new_values TEXT,
        date_action DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

  try {
    await new Promise((resolve, reject) => {
      db.exec(schema, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Seed default data
    const semestreCount = await get("SELECT COUNT(*) as count FROM semestres");
    if (semestreCount.count === 0) {
      await run("INSERT INTO semestres (id, nom) VALUES (?, ?)", [
        1,
        "Semestre 1",
      ]);
      await run("INSERT INTO semestres (id, nom) VALUES (?, ?)", [
        2,
        "Semestre 2",
      ]);
    }

    const anneeCount = await get(
      "SELECT COUNT(*) as count FROM annees_academiques",
    );
    if (anneeCount.count === 0) {
      await run("INSERT INTO annees_academiques (id, libelle) VALUES (?, ?)", [
        1,
        "2023-2024",
      ]);
    }

    console.log("✅ Database schema initialized successfully");
  } catch (err) {
    console.error("❌ Error initializing database:", err);
  }
}

// Wrapper compatible avec l'interface mysql2/pool utilisée dans les contrôleurs
const dbWrapper = {
  // Méthode query générique
  query: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      const sqlTrim = sql.trim().toUpperCase();
      if (
        sqlTrim.startsWith("SELECT") ||
        sqlTrim.startsWith("PRAGMA") ||
        sqlTrim.startsWith("SHOW")
      ) {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve([rows, []]); // Format [rows, fields] comme mysql2
        });
      } else {
        // INSERT, UPDATE, DELETE
        db.run(sql, params, function (err) {
          if (err) reject(err);
          else {
            // On retourne un objet qui ressemble à ResultSetHeader de mysql2
            resolve([
              {
                insertId: this.lastID,
                affectedRows: this.changes,
              },
              [],
            ]);
          }
        });
      }
    });
  },

  // Méthode pour obtenir une "connexion" (simulée pour SQLite) avec support transactionnel
  getConnection: async () => {
    return {
      query: dbWrapper.query,
      beginTransaction: async () => await run("BEGIN TRANSACTION"),
      commit: async () => await run("COMMIT"),
      rollback: async () => await run("ROLLBACK"),
      release: () => {}, // No-op for SQLite
    };
  },

  // Méthodes natives promisifiées comme demandé
  all: all,
  get: get,
  run: run,

  // Accès brut (optionnel)
  raw: db,
};

export default dbWrapper;
