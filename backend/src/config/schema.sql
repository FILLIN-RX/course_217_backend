-- Final SQL Schema for UniSched
DROP DATABASE IF EXISTS gestion_emploi_temps;
CREATE DATABASE gestion_emploi_temps CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gestion_emploi_temps;

-- 1. Infrastructure Tables
CREATE TABLE departements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE filieres (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  departement_id INT NOT NULL,
  FOREIGN KEY (departement_id) REFERENCES departements(id) ON DELETE CASCADE
);

CREATE TABLE classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(50) NOT NULL,
  filiere_id INT NOT NULL,
  FOREIGN KEY (filiere_id) REFERENCES filieres(id) ON DELETE CASCADE
);

CREATE TABLE salles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(50) NOT NULL,
  capacite INT NOT NULL
);

-- 2. Academic Context
CREATE TABLE annees_academiques (
  id INT AUTO_INCREMENT PRIMARY KEY,
  libelle VARCHAR(20) NOT NULL -- e.g., 2025/2026
);

CREATE TABLE semestres (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(20) NOT NULL -- e.g., Semestre 1
);

CREATE TABLE effectifs_classe (
  id INT AUTO_INCREMENT PRIMARY KEY,
  classe_id INT NOT NULL,
  semestre_id INT NOT NULL,
  annee_id INT NOT NULL,
  effectif INT NOT NULL,
  FOREIGN KEY (classe_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (semestre_id) REFERENCES semestres(id) ON DELETE CASCADE,
  FOREIGN KEY (annee_id) REFERENCES annees_academiques(id) ON DELETE CASCADE,
  UNIQUE(classe_id, semestre_id, annee_id)
);

-- 3. Users and Teachers
CREATE TABLE enseignants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE
);

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

-- 4. Courses (UE)
CREATE TABLE ues (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL,
  intitule VARCHAR(100) NOT NULL,
  classe_id INT NOT NULL,
  enseignant_id INT NOT NULL,
  semestre_id INT NOT NULL,
  FOREIGN KEY (classe_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (enseignant_id) REFERENCES enseignants(id) ON DELETE CASCADE,
  FOREIGN KEY (semestre_id) REFERENCES semestres(id) ON DELETE CASCADE
);

-- 5. Scheduling
CREATE TABLE plages_horaires (
  id INT AUTO_INCREMENT PRIMARY KEY,
  jour ENUM('Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi') NOT NULL,
  heure_debut TIME NOT NULL,
  heure_fin TIME NOT NULL
);

CREATE TABLE disponibilites_enseignants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  enseignant_id INT NOT NULL,
  plage_id INT NOT NULL,
  prefere BOOLEAN DEFAULT true,
  date_soumission TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enseignant_id) REFERENCES enseignants(id) ON DELETE CASCADE,
  FOREIGN KEY (plage_id) REFERENCES plages_horaires(id) ON DELETE CASCADE,
  UNIQUE(enseignant_id, plage_id)
);

CREATE TABLE emplois_du_temps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ue_id INT NOT NULL,
  salle_id INT NOT NULL,
  plage_id INT NOT NULL,
  semestre_id INT NOT NULL,
  annee_id INT NOT NULL,
  statut ENUM('BROUILLON','VALIDE') DEFAULT 'BROUILLON',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ue_id) REFERENCES ues(id) ON DELETE CASCADE,
  FOREIGN KEY (salle_id) REFERENCES salles(id) ON DELETE CASCADE,
  FOREIGN KEY (plage_id) REFERENCES plages_horaires(id) ON DELETE CASCADE,
  FOREIGN KEY (semestre_id) REFERENCES semestres(id) ON DELETE CASCADE,
  FOREIGN KEY (annee_id) REFERENCES annees_academiques(id) ON DELETE CASCADE,
  UNIQUE (plage_id, salle_id, semestre_id, annee_id),
  UNIQUE (plage_id, ue_id, semestre_id, annee_id)
);

-- 6. Audit and History
CREATE TABLE audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  action VARCHAR(255) NOT NULL,
  table_name VARCHAR(50),
  record_id INT,
  user_id INT,
  old_value TEXT,
  new_value TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
