DROP DATABASE IF EXISTS gestion_emploi_temps;
CREATE DATABASE gestion_emploi_temps CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gestion_emploi_temps;

-- ==========================================
-- 1. TABLES INDÉPENDANTES (Niveau 0)
-- ==========================================

CREATE TABLE departements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE enseignants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE
);

CREATE TABLE annees_academiques (
  id INT AUTO_INCREMENT PRIMARY KEY,
  libelle VARCHAR(20) NOT NULL
);

CREATE TABLE semestres (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(20) NOT NULL
);

CREATE TABLE salles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(50) NOT NULL,
  capacite INT NOT NULL
);

CREATE TABLE plages_horaires (
  id INT AUTO_INCREMENT PRIMARY KEY,
  jour ENUM('Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi') NOT NULL,
  heure_debut TIME NOT NULL,
  heure_fin TIME NOT NULL
);

-- ==========================================
-- 2. TABLES AVEC DÉPENDANCES SIMPLES (Niveau 1)
-- ==========================================

-- Dépend de 'departements'
CREATE TABLE filieres (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  departement_id INT NOT NULL,
  FOREIGN KEY (departement_id) REFERENCES departements(id) ON DELETE CASCADE
);

-- Dépend de 'enseignants'
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('ADMIN','ENSEIGNANT') NOT NULL,
  enseignant_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enseignant_id) REFERENCES enseignants(id) ON DELETE SET NULL
);

-- ==========================================
-- 3. TABLES AVEC DÉPENDANCES EN CASCADE (Niveau 2 & 3)
-- ==========================================

-- Dépend de 'filieres'
CREATE TABLE classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(50) NOT NULL,
  filiere_id INT NOT NULL,
  FOREIGN KEY (filiere_id) REFERENCES filieres(id) ON DELETE CASCADE
);

-- Dépend de 'classes' et 'semestres'
CREATE TABLE ues (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL,
  intitule VARCHAR(100) NOT NULL,
  classe_id INT NOT NULL,
  semestre_id INT NOT NULL,
  FOREIGN KEY (classe_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (semestre_id) REFERENCES semestres(id) ON DELETE CASCADE
);

-- Table de liaison enseignants <-> UEs (many-to-many)
CREATE TABLE enseignant_ues (
  id INT AUTO_INCREMENT PRIMARY KEY,
  enseignant_id INT NOT NULL,
  ue_id INT NOT NULL,
  FOREIGN KEY (enseignant_id) REFERENCES enseignants(id) ON DELETE CASCADE,
  FOREIGN KEY (ue_id) REFERENCES ues(id) ON DELETE CASCADE,
  UNIQUE(enseignant_id, ue_id)
);

-- ==========================================
-- 4. TABLES DE LIAISON ET GESTION (Niveau Final)
-- ==========================================

-- Dépend de 'enseignants', 'plages_horaires' et 'semestres'
CREATE TABLE disponibilites_enseignants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  enseignant_id INT NOT NULL,
  plage_id INT NOT NULL,
  semestre_id INT NOT NULL,
  prefere BOOLEAN DEFAULT true,
  FOREIGN KEY (enseignant_id) REFERENCES enseignants(id) ON DELETE CASCADE,
  FOREIGN KEY (plage_id) REFERENCES plages_horaires(id) ON DELETE CASCADE,
  FOREIGN KEY (semestre_id) REFERENCES semestres(id) ON DELETE CASCADE,
  UNIQUE(enseignant_id, plage_id, semestre_id)
);

-- Dépend de 'ues', 'salles', 'plages_horaires', 'semestres' et 'annees_academiques'
CREATE TABLE emplois_du_temps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ue_id INT NOT NULL,
  salle_id INT NOT NULL,
  plage_id INT NOT NULL,
  semestre_id INT NOT NULL,
  annee_id INT NOT NULL,
  statut ENUM('BROUILLON','VALIDE') DEFAULT 'BROUILLON',
  FOREIGN KEY (ue_id) REFERENCES ues(id),
  FOREIGN KEY (salle_id) REFERENCES salles(id),
  FOREIGN KEY (plage_id) REFERENCES plages_horaires(id),
  FOREIGN KEY (semestre_id) REFERENCES semestres(id),
  FOREIGN KEY (annee_id) REFERENCES annees_academiques(id),
  UNIQUE (plage_id, salle_id),
  UNIQUE (plage_id, ue_id)
);

CREATE TABLE historique_modifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  action VARCHAR(100),
  utilisateur VARCHAR(50),
  date_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);