-- SQLite Schema for Gestion Emploi du Temps
-- Converted from MySQL schema

-- ==========================================
-- 1. TABLES INDÉPENDANTES (Niveau 0)
-- ==========================================

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

INSERT INTO annees_academiques (id, libelle) VALUES (1, '2023-2024');

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

-- ==========================================
-- 2. TABLES AVEC DÉPENDANCES SIMPLES (Niveau 1)
-- ==========================================

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

-- ==========================================
-- 3. TABLES AVEC DÉPENDANCES EN CASCADE (Niveau 2 & 3)
-- ==========================================

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

-- ==========================================
-- 4. TABLES DE LIAISON ET GESTION (Niveau Final)
-- ==========================================

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
  FOREIGN KEY (annee_id) REFERENCES annees_academiques(id),
  UNIQUE (plage_id, salle_id, date_passage),
  UNIQUE (plage_id, classe_id, date_passage),
  UNIQUE (plage_id, ue_id, date_passage)
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

-- Enable foreign keys in SQLite
PRAGMA foreign_keys = ON;
